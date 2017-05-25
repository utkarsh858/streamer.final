'use strict';

var os = require('os');
var nodeStatic= require('node-static'); 
var http=require('http');
var socketIO = require('socket.io');

var fileServer = new (nodeStatic.Server)();
var app=http.createServer(function(req,res){fileServer.serve(req,res);}).listen(8080);

var io=socketIO.listen(app);

var array_of_mobiles=[];

var i;

var key_prevSock;var key_nextSock;
var connected_callback=function(socket){
var temp=socket.id;
if(io.sockets.adapter.rooms['room']!=undefined){
var conSockId=Object.keys(io.sockets.adapter.rooms['room'].sockets);
	var index_of_socket =conSockId.indexOf(temp+"");
array_of_mobiles[0]=conSockId[0];
}





var message_next_callback=function(message){
	if(io.sockets.adapter.rooms['room']!=undefined){
	conSockId=Object.keys(io.sockets.adapter.rooms['room'].sockets);  
	index_of_socket=conSockId.indexOf(temp+"");

	key_nextSock=conSockId[index_of_socket+1];

	io.to(key_nextSock).emit('message_next',message);
	console.log("sent the message to next socket"+key_nextSock+"of"+socket.id);
	}
}
var message_callback=function(message){
	
 if(io.sockets.adapter.rooms['room']!=undefined){
	 conSockId=Object.keys(io.sockets.adapter.rooms['room'].sockets);
	 index_of_socket=conSockId.indexOf(temp+"");
	 
	key_prevSock=conSockId[index_of_socket-1];
	
	io.to(key_prevSock).emit('message',message);
	console.log("sent the message to previous socket "+key_prevSock+"of"+socket.id);
	}
}

var joined_callback=function(){
	socket.join('room');
	if(io.sockets.adapter.rooms['room']!=undefined){
	console.log(io.sockets.adapter.rooms['room']);
	
	 conSockId=Object.keys(io.sockets.adapter.rooms['room'].sockets);
	 index_of_socket=conSockId.indexOf(temp+"");
	
	key_prevSock=conSockId[index_of_socket-1];
	
	io.to(key_prevSock).emit('message',"startService");
	console.log("received joined request of "+socket.id);
	}}

var disconnect_callback = function(){
	
	
	var isMobile=array_of_mobiles.indexOf(temp);   
	if(isMobile==-1)

		{// if disconnected socket is not mobile 
	if(io.sockets.adapter.rooms['room']!=undefined){
	conSockId=Object.keys(io.sockets.adapter.rooms['room'].sockets);
	 key_prevSock=conSockId[index_of_socket-1];
	 conSockId=conSockId=Object.keys(io.sockets.adapter.rooms['room'].sockets);
	
	console.log(" previous socket:       "+key_prevSock);
	console.log(" disconnected socket :    "+socket.id);
	
	console.log("sent it to"+ key_prevSock);
	io.to(key_prevSock).emit('message','startService');
	
	
	}
	
	}


	else{    //if disconnected one is a mobile
		 delete array_of_mobiles[isMobile];
		io.to(array_of_mobiles[0]).emit("disconnect_mobile",isMobile);

	}

}


//for mobile we have to establish a direct connection
var joined_mobile_callback = function(){
	console.log("a new mobile is joined");
	
	
	for(i=1;i<20;i++) {if(array_of_mobiles[i]==undefined) {
		array_of_mobiles[i]=temp;break;

	}}

	console.log("which is now added to array");
	var index_of_mobile=array_of_mobiles.indexOf(temp+"");
	console.log("its index is"+index_of_mobile);
	io.to(array_of_mobiles[0]).emit("message_server",{type:"start",index:index_of_mobile});  //emit to server
	console.log("sent the start signal to server:"+array_of_mobiles[0]);

	io.to(temp).emit("message_mobile",{type:"index",index:index_of_mobile});
	console.log("sent the index to mobile it self:"+temp+"|or|"+array_of_mobiles[index_of_mobile]);

}

var message_mobile_callback=function(message){
	io.to(array_of_mobiles[message.index]).emit("message_mobile",message.type);

}

var message_server_callback=function(message){
	io.to(array_of_mobiles[0]).emit("message_server",message);
}

socket.on('message',message_callback);
socket.on('message_next',message_next_callback);
socket.on('joined',joined_callback);
socket.on('disconnect',disconnect_callback);
socket.on('joined_mobile',joined_mobile_callback);
socket.on('message_mobile',message_mobile_callback);
socket.on('message_server',message_server_callback);

}


io.sockets.on('connection',connected_callback);
