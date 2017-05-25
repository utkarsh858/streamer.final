'use strict';

var socket=io.connect();//'http://localhost:8080',{'sync disconnect on unload':true});
var pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};
var pc;

socket.emit('joined_mobile');
console.log("sent the signal to send stream");

if (location.hostname !== 'localhost') {
  requestTurn(
    'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
  );
}

var index;

//////////////////////////////////////
var message_mobile_callback = function(message){
	console.log("got a message!");

if(message==="start"){
  console.log('received message for starting service on client');
start();
} else if(message.type==="index") {index=message.index;
console.log("got my index:"+index);}
else if (message.type === 'candidate' ) {

    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc.addIceCandidate(candidate);}
    else if (message.type === 'offer' ) {
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  }
}

socket.on('message_mobile',message_mobile_callback);

function start(){
try{
		pc=new RTCPeerConnection(pcConfig);
		pc.onicecandidate=handler_IceCandidate;  
		pc.onaddstream=handler_remoteStreamAdded;
		console.log("created peer connection");
	}
	catch(e){
		console.log('Failed to create PeerConnection, exception: ' + e.message);
    	alert('Cannot create RTCPeerConnection object.');
	}

}
///////////////////////////////////////////////////
//create peer connection on signal 
var video=document.querySelector("#video");

function handler_remoteStreamAdded(event) {
  console.log('Remote stream added.');
  video.src = window.URL.createObjectURL(event.stream);
 

  //
  
}

function handler_IceCandidate(event){
	console.log('icecandidate event: ', event);													//work here
	//sending info about network candidate to first client
  if (event.candidate) {
    socket.emit('message_server',{index:index,type:{
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    }});
  } else {
    console.log('End of candidates.');
  }
}

function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer().then(
    setLocalAndSendMessage,
    function(error){
    	console.log('Failed to create session description: ' + error.toString());
    }
  );
}

function setLocalAndSendMessage(sessionDescription){
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  
  socket.emit('message_server',{index:index,type:sessionDescription});																			//work here

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