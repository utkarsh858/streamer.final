'use strict';

var os = require('os');
var nodeStatic= require('node-static'); 
var http=require('http');
var socketIO = require('socket.io');

var fileServer = new (nodeStatic.Server)();
var app=http.createServer(function(req,res){fileServer.serve(req,res);}).listen(8080);

var io=socketIO.listen(app);

var array_of_sockets=[];

var connected_callback=function(socket){

var message_next_callback=function(message){
	
	io.sockets.socket(array_of_sockets[array_of_sockets.indexof(socket.id)+1]).emit('message_next',message);

}
var message_callback=function(message){
	
	io.sockets.socket(array_of_sockets[array_of_sockets.indexof(socket.id)-1]).emit('message',message);

}

var joined_callback=function(){
	array_of_sockets.push(socket.id);
	io.sockets.socket(array_of_sockets[array_of_sockets.indexof(socket.id)-1]).emit('message',"startService");
}

socket.on('message',message_callback);
socket.on('message_next',message_next_callback);
socket.on('joined',joined_callback);	
}


io.sockets.on('connection',connected_callback);


