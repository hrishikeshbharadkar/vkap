const port = process.env.PORT || 3000;
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var fs= require('fs');  
var multer  = require('multer')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        console.log(file);
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype == 'image/jpeg' || file.mimetype == 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}
const upload = multer({ storage: storage, fileFilter: fileFilter });


let connection;
var oracledb = require('oracledb');

(async function() {
try{
   connection = await oracledb.getConnection({
        user : 'VKYC',
        password : 'adroit11',
        connectString : '192.168.100.110:1521/orcl12'
   });
   console.log("Successfully connected to Oracle!")
} catch(err) {
    console.log("Error: ", err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch(err) {
        console.log("Error when closing the database connection: ", err);
      }
    }
  }
})
// const request = require('request');

// let url = "https://192.168.200.73/accounts/api/tutorials";

// let options = {json: true};



// request(url, options, (error, res, body) => {
//     if (error) {
//         return  console.log(error)
//     };

//     if (!error && res.statusCode == 200) {
//        console.log(body)
//        // var x = document.getElementById("btn");
//        // if (x.style.display === "none") {
//        // x.style.display = "block";
//        // } else {
//        // x.style.display = "none";
//        // }
//     };
// });





// var bodyParser = require('body-parser');
//  // others  = require("./public/client.js");
//  let buffer = new Buffer.alloc(0);
 



app.use(express.static('public'));
//create a file named mynewfile3.txt:
// var upperBound = '1gb';
// app.use(bodyParser.urlencoded({extended: false, limit: upperBound}));
// app.use(express.json());
///////////////////////////////////auto download for videos image////////////////////////////////////////////////
// const maxFileSize = 1024 * 1024 * 50; // 50 MB
// let contentBuffer = [];
// let totalBytesInBuffer = 0;

// app.post('/getdownload', function (req, res) {
//     req.on('data', chunk => {
//       contentBuffer.push(chunk);
//       totalBytesInBuffer += chunk.length;
      
//       console.log('contentBuffer', contentBuffer)

//       // Look to see if the file size is too large.
//       if (totalBytesInBuffer > maxFileSize) {
//         req.pause();

//         res.header('Connection', 'close');
//         res.status(413).json({error: `The file size exceeded the limit of ${maxFileSize} bytes`});

//         req.connection.destroy();
//       }
//     });

//     req.on('aborted', function() {
//       // Nothing to do with buffering, garbage collection will clean everything up.
//     });
    
//     req.on('end', async function() {
//       contentBuffer = Buffer.concat(contentBuffer, totalBytesInBuffer);
      
//       console.log("end buffer", contentBuffer)
      
//       try{ 
//             fs.writeFile('video.webm', contentBuffer , () => console.log('video saved!') );
//       } catch (err) {
          
//           console.log(err);
          
//       }
//     });
// });



// app.post('/uploadPicture', upload.single('Picture'), function (req, res) {
//   var img = req.body.Picture;
//   var data = img.replace(/^data:image\/\w+;base64,/, "");
//   var buf = new Buffer(data, 'base64');
  
//   try{ 
//       fs.writeFile('D:/face_images/'+Date.now()+'.jpeg', buf , () => console.log('Picture saved!') );
//       return res.status(201).json({
//         message: 'Face image Uploaded successfully'
//       });
//     } catch (err) {
//       console.log(err);
//     }
     
// });


// app.post('/uploadPicture1', upload.single('Picture1'), function (req, res) {
//   var img = req.body.Picture1;
//   var data = img.replace(/^data:image\/\w+;base64,/, "");
//   var buf = new Buffer(data, 'base64');
  
//   try{ 
//       fs.writeFile('D:/pan_images/'+Date.now()+'.jpeg',buf , () => console.log('Picture saved!') );
//       return res.status(201).json({
//         message: 'Pan image uploaded successfully'
//       });
//     } catch (err) {
//       console.log(err);
//     }
     
// });

// app.post('/uploadPicture2', upload.single('Picture2'), function (req, res) {
//   var img = req.body.Picture2;
//   var data = img.replace(/^data:image\/\w+;base64,/, "");
//   var buf = new Buffer(data, 'base64');
  
//   try{ 
//       fs.writeFile('D:/'+Date.now()+'.jpeg', buf , () => console.log('Picture saved!') );
//       return res.status(201).json({
//         message: 'Signature image uplodeded successfully'
//       });
//     } catch (err) {
//       console.log(err);
//     }
     
// });
////////////////////////////////////////////end auto download code/////////////////////////////////////////////////


////////////////////////////////////////////python auto download code testing///////////////////////////////////////
// app.post('/getdownload', function (req, res) {
//     req.on('readable', function(){
//     console.log(req.read.length);
//     console.log(req.read()); 
//      fs.writeFile('video.webm', req.read() , () => console.log('video saved!') );

    
//   });
    
    

//     res.send("res from getData function");
// })



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
////////////////////////////////////////////end python auto download code testing///////////////////////////////////////
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

// let app=express();
app.use ((req, res, next) => {
    res.locals.url = req.originalUrl;
    res.locals.host = req.get('host');
    res.locals.protocol = req.protocol;
    console.log('im in');
    next();
    
});