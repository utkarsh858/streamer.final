'use strict';

var os = require('os');
var nodeStatic= require('node-static'); 
var http=require('http');
var socketIO = require('socket.io');

var fileServer = new (nodeStatic.Server)();
var app=http.createServer(function(req,res){fileServer.serve(req,res);}).listen(8080);

var io=socketIO.listen(app);



var connected_callback=function(socket){

var message_callback=function(message){
	socket.broadcast.emit('message',message);
}

socket.on('message',message_callback);
	
}


io.sockets.on('connection',connected_callback);


