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

var message_next_callback=function(message){
	var temp_room=message.room;

	if(io.sockets.adapter.rooms[temp_room]!=undefined){
	conSockId=Object.keys(io.sockets.adapter.rooms[temp_room].sockets);  
	index_of_socket=conSockId.indexOf(temp+"");

	key_nextSock=conSockId[index_of_socket+1];

	io.to(key_nextSock).emit('message_next',message.data);       //in message_next no need to send the room no.
	console.log("sent the message to next socket"+key_nextSock+"of"+socket.id+"in room"+temp_room);
	}
}

var message_callback=function(message){
	var temp_room=message.room;
 if(io.sockets.adapter.rooms[temp_room]!=undefined){
	 conSockId=Object.keys(io.sockets.adapter.rooms[temp_room].sockets);
	 index_of_socket=conSockId.indexOf(temp+"");
	 
	key_prevSock=conSockId[index_of_socket-1];
	
	io.to(key_prevSock).emit('message',message);    //send room also (done because of server)
	console.log("sent the message to previous socket "+key_prevSock+"of"+socket.id+"in room:"+temp_room);
	}
}

var joined_callback=function(){
	console.log("joined_callback called");
	var temp_room;
	var loop=true;
	for(var iterator=1;iterator<=roomCount&&loop;iterator++)
	if(Object.keys(io.sockets.adapter.rooms[iterator+""].sockets).length<maxSize)
	{socket.join(iterator+"");
	temp_room=iterator+"";
	socket.emit("room",iterator+"");
	console.log(iterator);
	loop=false;                             //edited
	}

	if(io.sockets.adapter.rooms[temp_room]!=undefined){
	console.log(io.sockets.adapter.rooms[temp_room]);
	console.log(io.sockets.adapter.sids[temp+""]);
	 conSockId=Object.keys(io.sockets.adapter.rooms[temp_room].sockets);
	 index_of_socket=conSockId.indexOf(temp+"");
	
	key_prevSock=conSockId[index_of_socket-1];
	
	io.to(key_prevSock).emit('message',{room:temp_room,data:"startService"});
	console.log("received joined request of "+socket.id+"in room:"+temp_room);
	}}

var joined_again_callback =function(room){
	if(io.sockets.adapter.rooms[room]!=undefined){
	console.log(io.sockets.adapter.rooms[room]);
	
	 conSockId=Object.keys(io.sockets.adapter.rooms[room].sockets);
	 index_of_socket=conSockId.indexOf(temp+"");
	
	key_prevSock=conSockId[index_of_socket-1];
	
	io.to(key_prevSock).emit('message',{room:room,data:"startService"});
	console.log("received joined request of "+socket.id+"in room:"+room);
	}

}

var disconnect_callback = function(){
	
	
	var isMobile=array_of_mobiles.indexOf(temp);   
	if(isMobile==-1)

	{// if disconnected socket is not mobile
		//lets find out which room was it in
		console.log("A socket is disconnected"+socket.id);
		console.log(rooms_of_a_socket);
		if(rooms_of_a_socket){
		var temp_room=Object.keys(rooms_of_a_socket)[0];
		console.log(temp_room);
			}

	if(io.sockets.adapter.rooms[temp_room]!=undefined){
	conSockId=Object.keys(io.sockets.adapter.rooms[temp_room].sockets);
	 key_prevSock=conSockId[index_of_socket-1];
	 conSockId=conSockId=Object.keys(io.sockets.adapter.rooms[temp_room].sockets);
	
	console.log(" previous socket:       "+key_prevSock+"of room:"+temp_room);
	console.log(" disconnected socket :    "+socket.id+"of room"+temp_room);
	
	console.log("sent it to"+ key_prevSock);
	io.to(key_prevSock).emit('message',{room:temp_room,data:'startService'});
	
	
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

function joined_server_callback(){
	for(var iterator=1;iterator<=roomCount;iterator++)
	{
		console.log("joined the server to room:"+iterator);
		socket.join(iterator+"");   //server will be the first element in all rooms

	}
}

socket.on('message',message_callback);
socket.on('message_next',message_next_callback);
socket.on('joined',joined_callback);
socket.on('joined_again',joined_again_callback);
socket.on('disconnect',disconnect_callback);
socket.on('joined_mobile',joined_mobile_callback);
socket.on('message_mobile',message_mobile_callback);
socket.on('message_server',message_server_callback);
socket.on('joined_server',joined_server_callback);
}


io.sockets.on('connection',connected_callback);
