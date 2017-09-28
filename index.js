'use strict';

var os = require('os');
var nodeStatic= require('node-static'); 
var http=require('http');
var socketIO = require('socket.io');

var fileServer = new (nodeStatic.Server)();
var app=http.createServer(function(req,res){fileServer.serve(req,res);}).listen(80);

var io=socketIO.listen(app);


var i;

var key_prevSock;var key_nextSock;


var tree=['popo'];
var server_client_lines=3,client_client_lines=5;


/*
var temp=socket.id;																	//work here rooms!!!!!
if(io.sockets.adapter.rooms['room']!=undefined){
var conSockId=Object.keys(io.sockets.adapter.rooms['room'].sockets);
	var index_of_socket =conSockId.indexOf(temp+"");
array_of_mobiles[0]=conSockId[0];
}
var rooms_of_a_socket=io.sockets.adapter.sids[socket.id+""];


//  enable mltiple linked list
var maxSize=5;
//room start from 1 to roomCount;
var roomCount=5;

//
*/

var connected_callback=function(socket){
var message_next_callback=function(message){
	var index_parent=tree.indexOf(socket.id);
	var index_child=index_parent*client_client_lines+1+message.room;
	io.to(tree[index_child]).emit('message_next',message.data);         //+++++++++++++++++++++
}

var message_callback=function(message){
	var index_child=tree.indexOf(socket.id);
	var index_parent=Math.floor((index_child-1)/client_client_lines);
	var relative_index_child=index_child-(index_parent*client_client_lines+1);
	io.to(tree[index_parent]).emit('message',{room:relative_index_child,data:message});      //++++++++++++++
}

var joined_callback=function(){
	
console.log("Pushing a client");
	console.log(tree);
	for(var i=1;;i++) {
		console.log("tree["+i+"]"+tree[i]);
		if(tree[i]===undefined) {tree[i]=socket.id; 
		break;}}
	
	var index_child=tree.indexOf(socket.id);
	var index_parent=Math.floor((index_child-1)/client_client_lines);
	
	console.log("A faccha got added with id:"+index_child+":"+tree[index_child]+"   parent:"+ index_parent+":"+tree[index_parent]+":"+tree[0]);
	var relative_index_child=index_child-(index_parent*client_client_lines+1);
	
	io.to(tree[index_parent]).emit('message',{data:"startService",room:relative_index_child});
	
}
var joined_again_callback =function(room){
	

}

var disconnect_callback = function(){
	
	

}




var message_server_callback=function(message){

}

function joined_server_callback(){
	

	tree[0]=socket.id;
	console.log("created tree  "+tree[0]);
}

socket.on('message',message_callback);
socket.on('message_next',message_next_callback);
socket.on('joined',joined_callback);
socket.on('joined_again',joined_again_callback);
socket.on('disconnect',disconnect_callback);

socket.on('message_server',message_server_callback);
socket.on('joined_server',joined_server_callback);
}


io.sockets.on('connection',connected_callback);
