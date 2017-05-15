'use strict';

var socket=io.connect();
var pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};
var pc_receiverEnd;  //connection to receive from previous client/server
var pc_server_to_client;  //connection to forward stream to next joined client
var video=document.querySelector('#video');
var channelStream;
////////////////////////////////
//telling the server that the client is connected
socket.emit('joined');
console.log("sent the signal to send stream");
/////////////////////////////////////////////////
if (location.hostname !== 'localhost') {
  requestTurn(
    'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
  );
}
//////////////////////////////////////
var message_next_callback = function(message){
if(message=="startService"){
  console.log('received message for starting service on client');
start();
}
else if (message.type === 'candidate' ) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc_receiverEnd.addIceCandidate(candidate);}
    else if (message.type === 'offer' ) {
    pc_receiverEnd.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  }
}

socket.on('message_next',message_next_callback);
///////////////////////////////////////////////////
//create peer connection on signal 
function start(){
try{
		pc_receiverEnd=new RTCPeerConnection(pcConfig);
		pc_receiverEnd.onicecandidate=handler_IceCandidate;  
		pc_receiverEnd.onaddstream=handler_remoteStreamAdded;
		console.log("created peer connection");
	}
	catch(e){
		console.log('Failed to create PeerConnection, exception: ' + e.message);
    	alert('Cannot create RTCPeerConnection object.');
	}

}

function handler_remoteStreamAdded(event) {
  console.log('Remote stream added.');
  video.src = window.URL.createObjectURL(event.stream);
  channelStream = event.stream;
}

function handler_IceCandidate(event){
	console.log('icecandidate event: ', event);													//work here
	//sending info about network candidate to first client
  if (event.candidate) {
    socket.emit('message',{
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log('End of candidates.');
  }
}

function doAnswer() {
  console.log('Sending answer to peer.');
  pc_receiverEnd.createAnswer().then(
    setLocalAndSendMessage,
    function(error){
    	console.log('Failed to create session description: ' + error.toString());
    }
  );
}

function setLocalAndSendMessage(sessionDescription){
  pc_receiverEnd.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  socket.emit('message',sessionDescription);																			//work here

}
///////////////////////////////////////////////////////
function requestTurn(turnURL) {
  var turnExists = false;
  for (var i in pcConfig.iceServers) {
    if (pcConfig.iceServers[i].url.substr(0, 5) === 'turn:') {
      turnExists = true;
      turnReady = true;
      break;
    }
  }
  if (!turnExists) {
    console.log('Getting TURN server from ', turnURL);
    // No TURN server. Get one from computeengineondemand.appspot.com:
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var turnServer = JSON.parse(xhr.responseText);
        console.log('Got TURN server: ', turnServer);
        pcConfig.iceServers.push({
          'url': 'turn:' + turnServer.username + '@' + turnServer.turn,
          'credential': turnServer.password
        });
        turnReady = true;
      }
    };
    xhr.open('GET', turnURL, true);
    xhr.send();
  }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// to make the connected client act as a server to next client we proceed

//messaging service listening for messages from next sockets

var message_callback = function(message){
if(message=='startService'){
  console.log("starting service and sending signal to client");
  socket.emit('message_next',"startService");
  maybeStartForNextClient();
}
 if (message.type === 'candidate' ) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc_server_to_client.addIceCandidate(candidate);}
else if (message.type === 'answer') {
    pc_server_to_client.setRemoteDescription(new RTCSessionDescription(message));
  } 
}

socket.on('message',message_callback);



function maybeStartForNextClient(){
  console.log("may be start called now creating peer connection");
  //peer connection
  try{
    pc_server_to_client=new RTCPeerConnection(pcConfig);
    pc_server_to_client.onicecandidate=handler_next_IceCandidate;  //no onaddstream handler

    console.log("created peer connection");
    pc_server_to_client.addStream(channelStream);
    //sending offer to client
    pc_server_to_client.createOffer(next_setLocalAndSendMessage, function(event){console.log("cannont create offer:"+event);});

  }
  catch(e){
    console.log('Failed to create PeerConnection, exception: ' + e.message);
      alert('Cannot create RTCPeerConnection object.');
  }


}

function handler_next_IceCandidate(event){
    console.log('icecandidate event: ', event);                         //work here
  //sending info about network candidate to first client
  if (event.candidate) {
    socket.emit('message_next',{
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log('End of candidates.');
  }
}

function next_setLocalAndSendMessage(sessionDescription){
  pc_server_to_client.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  socket.emit('message_next',sessionDescription);                                      //work here

}