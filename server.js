'use strict';



var channelStream;
var socket_server=io.connect();
var pc_server_to_client;    //each element of the array represents first node of a sin gle linked list
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
	if(pc_server_to_client) {pc_server_to_client.close();pc_server_to_client=null;console.log("Closing current connection and starting a new one");}
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
	console.log('icecandidate event: ', event);													
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
  socket_server.emit('message_next',sessionDescription);									

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






///// mobile support
var array_of_indexes=[];
var pc_server_to_mobile=[];
var i=0;
function message_server_callback(message){


if(message.type=="start"){
  
  for(i=0;i<20;i++) {
   if(pc_server_to_mobile[i]===undefined) {
    
    break;
  }
  } 
                                                             //work here important  //finished
  console.log("a mobile is connected with i="+i);
  array_of_indexes[i]=message.index;
  console.log("index of mobile in signalling server is"+array_of_indexes[i]);
  console.log("starting service and sending signal to client");
  socket_server.emit('message_mobile',{index:message.index,type:"start"});

  Start_mobile();
}

if (message.type.type === 'candidate' ) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.type.label,
      candidate: message.type.candidate
    });
    pc_server_to_mobile[i].addIceCandidate(candidate);}
else if (message.type.type === 'answer') {
    pc_server_to_mobile[i].setRemoteDescription(new RTCSessionDescription(message.type));
  } 
}

socket_server.on('message_server',message_server_callback);

function Start_mobile(){
  console.log("start_mobile called now creating peer connection");
  //peer connection
  
  try{
    pc_server_to_mobile[i]=new RTCPeerConnection(pcConfig);
    pc_server_to_mobile[i].onicecandidate=handler_IceCandidate_mobile;  //no onaddstream handler

    console.log("created peer connection");
    pc_server_to_mobile[i].addStream(channelStream);
    //sending offer to client
    pc_server_to_mobile[i].createOffer(setLocalAndSendMessage_mobile, function(event){console.log("cannont create offer:"+event);});

  }
  catch(e){
    console.log('Failed to create PeerConnection, exception: ' + e.message);
      alert('Cannot create RTCPeerConnection object.');
  }


}

function handler_IceCandidate_mobile(event){
  console.log('icecandidate event: ', event);                         
  //sending info about network candidate to first client
  if (event.candidate) {
    socket_server.emit('message_mobile',{index:array_of_indexes[i],type:{
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    }});
  } else {
    console.log('End of candidates.');
  }
}

function setLocalAndSendMessage_mobile(sessionDescription){
  pc_server_to_mobile[i].setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  
  socket_server.emit('message_mobile',{index:array_of_indexes[i],type:sessionDescription});                  

}


//mobile disconnect handler

function disconnect_mobile_callback(index_of_mobile){
  var j=array_of_indexes.indexOf(index_of_mobile);
  pc_server_to_mobile[j].close();
  pc_server_to_mobile[j]=undefined;
  array_of_indexes[j]=undefined;

}

socket_server.on("disconnect_mobile",disconnect_mobile_callback);