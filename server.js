const port = process.env.PORT || 3000;
const express = require('express');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);

app.use(express.static('public'));

// let runPy = new Promise(function(success, nosuccess) {

//     const { spawn } = require('child_process');
//     const pyprog = spawn('python',['savedata.py']);

//     pyprog.stdout.on('data', function(data) {

//         success("running python",data);
//     });

//     pyprog.stderr.on('data', (data) => {

//         nosuccess("no python",data);
//     });
// }).catch(function (error) {
//        console.log(error);
//   	});

// app.get('/', (req, res) => {

//     res.write('welcome\n');

//     runPy.then(function(create_file) {
//     	console.log(create_file.toString());
//         res.end(create_file);
//     });
// });

io.on('connection',function(socket){
	console.log('a user connected');
socket.on('create or join',function(room){
	console.log('create or join to room',room);
	 var myRoom = io.sockets.adapter.rooms[room] || {length: 0};
	 var numClients = myRoom.length;
	 console.log(room,'has',numClients,'clients');

	 if(numClients == 0){
	 	socket.join(room);
	 	socket.emit('created',room);
	 }else if (numClients == 1){
	 	socket.join(room);
	 	socket.emit('joined',room);
	 }else{
	 	socket.emit('full',room);
	 }
});

	socket.on('ready', function (room){
        socket.broadcast.to(room).emit('ready');
    });

    socket.on('candidate', function (event){
        socket.broadcast.to(event.room).emit('candidate', event);
    });

    socket.on('offer', function(event){
        socket.broadcast.to(event.room).emit('offer',event.sdp);
    });

    socket.on('answer', function(event){
        socket.broadcast.to(event.room).emit('answer',event.sdp);
    });

    socket.on('toggleAudio', function(event){
        socket.broadcast.to(event.room).emit('toggleAudio', event.message);
    });

});


http.listen(port,function(){
	console.log('listening on: 3000');
});