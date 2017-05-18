'use strict';

var os = require('os');
var nodeStatic= require('node-static'); 
var http=require('http');
var socketIO = require('socket.io');//(http, {'pingInterval': 1000, 'pingTimeout': 2000});

var fileServer = new (nodeStatic.Server)();
var app=http.createServer(function(req,res){fileServer.serve(req,res);}).listen(8080);

var io=socketIO.listen(app);//(app,{ 'pingTimeout': 30000});


//io.set('heartbeat timeout', 3000);
//io.set('heartbeat interval', 2500);


var connected_callback=function(socket){

var temp=socket.id;
var conSockId=Object.keys(io.of('/').connected);
	var index_of_socket =conSockId.indexOf(temp+"");
var key_prevSock;var key_nextSock;


var message_next_callback=function(message){
	 conSockId=Object.keys(io.of('/').connected);  //array of socket ids
	index_of_socket=conSockId.indexOf(temp+"");
	key_nextSock=conSockId[index_of_socket+1];
	io.to(key_nextSock).emit('message_next',message);

}
var message_callback=function(message){
	 conSockId=Object.keys(io.of('/').connected);
	 index_of_socket=conSockId.indexOf(temp+"");
	key_prevSock=conSockId[index_of_socket-1];
	io.to(key_prevSock).emit('message',message);

}

var joined_callback=function(){
	 conSockId=Object.keys(io.of('/').connected);
	 index_of_socket=conSockId.indexOf(temp+"");
	key_prevSock=conSockId[index_of_socket-1];

	io.to(key_prevSock).emit('message',"startService");
	console.log("received joined request");
}

var disconnect_callback = function(){
	
	
	console.log(index_of_socket);
	//conSockId=Object.keys(io.of('/').connected);
	 key_prevSock=conSockId[index_of_socket-1];
	 conSockId=conSockId=Object.keys(io.of('/').connected);
	console.log(" previous socket:       "+key_prevSock);
	console.log(" disconnected socket :    "+temp);

	//for(var i=index_of_socket;i<conSockId.length-1;i++){         //for loop model closed down
	console.log("sent it to"+ key_prevSock);
	io.to(key_prevSock).emit('message','startService');
	//}
	
	
}

socket.on('message',message_callback);
socket.on('message_next',message_next_callback);
socket.on('joined',joined_callback);
socket.on('disconnect',disconnect_callback);
}


io.sockets.on('connection',connected_callback);
