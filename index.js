'use strict';

var os = require('os');
var nodeStatic= require('node-static'); 
var http=require('http');
var socketIO = require('socket.io');

var fileServer = new (nodeStatic.Server)();
var app=http.createServer(function(req,res){fileServer.serve(req,res);}).listen(8080);

var io=socketIO.listen(app);



var connected_callback=function(socket){

var message_next_callback=function(message){
	var conSockId=Object.keys(io.of('/').connected);  //araay of socket ids
	var key_nextSock=conSockId[conSockId.indexOf(socket.id+"")+1];
	io.to(key_nextSock).emit('message_next',message);

}
var message_callback=function(message){
	var conSockId=Object.keys(io.of('/').connected);
	var key_prevSock=conSockId[conSockId.indexOf(socket.id+"")-1];
	io.to(key_prevSock).emit('message',message);

}

var joined_callback=function(){
	var conSockId=Object.keys(io.of('/').connected);
	var key_prevSock=conSockId[conSockId.indexOf(socket.id+"")-1];

	io.to(key_prevSock).emit('message',"startService");
}

socket.on('message',message_callback);
socket.on('message_next',message_next_callback);
socket.on('joined',joined_callback);	
}


io.sockets.on('connection',connected_callback);


