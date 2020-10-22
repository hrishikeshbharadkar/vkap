const port = process.env.PORT || 3000;
const express = require('express');
const {spawn} = require('child_process');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);



app.use(express.static('public'));

app.get('/', function(req, res){
   if(req.files.myUpload){
     var python = require('child_process').spawn(
     'python',
     // second argument is array of parameters, e.g.:
     ["savedata.py"
     , req.files.myUpload.path
     , req.files.myUpload.type]
     );
     var output = "";
     python.stdout.on('data', function(data){ output += data });
     python.on('close', function(code){ 
       if (code !== 0) {  
           return res.send(500, code); 
       }
       return res.send(200, output);
     });
   } else { res.send(500, 'No file found') }
});



// const python = spawn('python', ['./savedata.py']);


// app.get('/', (req, res) => {
// var dataToSend;
// python.stdout.on('data', function (data) {
//   console.log('Pipe data from python script ...');
//   dataToSend = data.toString();
//  });


// python.on('close', (code) => {
//  console.log(`child process close all stdio with code ${code}`);
//  // send data to browser
//  res.send(dataToSend)
//  });
// })

// let runPy = new Promise(function(success, nosuccess) {

//     const { spawn } = require('child_process');
//     const pyprog = spawn('python',['./savedata.py']);
//     data = ['1', '2']

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