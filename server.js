'use strict';
var channelStream;
var socket_server=io.connect();
var pc_server_to_client;
var pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};
////////////////////////////////////////
socket_server.emit('joined');
//////////////////////////////////////
//set up the messaging service
if (location.hostname !== 'localhost') {
  requestTurn(
    'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
  );
}
function message_callback(message){
if(message=='startService'){
	console.log("starting service and sending signal to client");
	socket_server.emit('message_next',"startService");
	maybeStart();
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

socket_server.on('message',message_callback);
//////////////////////////////////////////
//getting user media and attaching it to video element 

	var video = document.querySelector('#video');
   navigator.mediaDevices.getUserMedia({
  audio: true,
  video: true
})
.then(gotStream)
.catch(function(e) {
  alert('getUserMedia() error: ' + e.name);
}); 


console.log("getting user media");
//////////////////////////
if (location.hostname !== 'localhost') {
  requestTurn(
    'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
  );
}
/////////////////////////////
function gotStream(stream){
	console.log('attaching stream to video element');
	video.src= window.URL.createObjectURL(stream);
	channelStream=stream;
	
}


function maybeStart(){
	console.log("may be start called now creating peer connection");
	//peer connection
	try{
		pc_server_to_client=new RTCPeerConnection(pcConfig);
		pc_server_to_client.onicecandidate=handler_IceCandidate;  //no onaddstream handler

		console.log("created peer connection");
		pc_server_to_client.addStream(channelStream);
		//sending offer to client
		pc_server_to_client.createOffer(setLocalAndSendMessage, function(event){console.log("cannont create offer:"+event);});

	}
	catch(e){
		console.log('Failed to create PeerConnection, exception: ' + e.message);
    	alert('Cannot create RTCPeerConnection object.');
	}


}

function handler_IceCandidate(event){
	console.log('icecandidate event: ', event);													//work here
	//sending info about network candidate to first client
  if (event.candidate) {
    socket_server.emit('message_next',{
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log('End of candidates.');
  }
}

function setLocalAndSendMessage(sessionDescription){
  pc_server_to_client.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  socket_server.emit('message_next',sessionDescription);																			//work here

}

///////////////////////////////////////////////////////////////////////////////////
//request for turn server

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

