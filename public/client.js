var divSelectRoom = document.getElementById("selectRoom");
var divConsultingRoom = document.getElementById("consultingRoom");
var inputRoomNumber = document.getElementById("roomNumber");
var btnGoRoom = document.getElementById("goRoom");
var localVideo = document.getElementById("localVideo");
var remoteVideo= document.getElementById("remoteVideo");
var roomNumber;
var localStream;
var remoteStream;
var rtcPeerConnection;


var iceServers={
  'iceServers':[
    {'url':'stun:stun.services.mozilla.com'},
    {'url':'stun:stun.l.google.com:19302'},
     {'urls': 'turn:120.138.121.50:3478?transport=tcp',
      'credential': 'test',
      'username': 'test',
      }    
]
}




var BandwidthHandler = (function() {
    function setBAS(sdp, bandwidth, isScreen) {
        if (!bandwidth) {
            return sdp;
        }

        if (typeof isFirefox !== 'undefined' && isFirefox) {
            return sdp;
        }

        if (isScreen) {
            if (!bandwidth.screen) {
                console.warn('It seems that you are not using bandwidth for screen. Screen sharing is expected to fail.');
            } else if (bandwidth.screen < 300) {
                console.warn('It seems that you are using wrong bandwidth value for screen. Screen sharing is expected to fail.');
            }
        }

        // if screen; must use at least 300kbs
        if (bandwidth.screen && isScreen) {
            sdp = sdp.replace(/b=AS([^\r\n]+\r\n)/g, '');
            sdp = sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:' + bandwidth.screen + '\r\n');
        }

        // remove existing bandwidth lines
        if (bandwidth.audio || bandwidth.video || bandwidth.data) {
            sdp = sdp.replace(/b=AS([^\r\n]+\r\n)/g, '');
        }

        if (bandwidth.audio) {
            sdp = sdp.replace(/a=mid:audio\r\n/g, 'a=mid:audio\r\nb=AS:' + bandwidth.audio + '\r\n');
        }

        if (bandwidth.video) {
            sdp = sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:' + (isScreen ? bandwidth.screen : bandwidth.video) + '\r\n');
        }

        return sdp;
    }

    // Find the line in sdpLines that starts with |prefix|, and, if specified,
    // contains |substr| (case-insensitive search).
    function findLine(sdpLines, prefix, substr) {
        return findLineInRange(sdpLines, 0, -1, prefix, substr);
    }

    // Find the line in sdpLines[startLine...endLine - 1] that starts with |prefix|
    // and, if specified, contains |substr| (case-insensitive search).
    function findLineInRange(sdpLines, startLine, endLine, prefix, substr) {
        var realEndLine = endLine !== -1 ? endLine : sdpLines.length;
        for (var i = startLine; i < realEndLine; ++i) {
            if (sdpLines[i].indexOf(prefix) === 0) {
                if (!substr ||
                    sdpLines[i].toLowerCase().indexOf(substr.toLowerCase()) !== -1) {
                    return i;
                }
            }
        }
        return null;
    }

    // Gets the codec payload type from an a=rtpmap:X line.
    function getCodecPayloadType(sdpLine) {
        var pattern = new RegExp('a=rtpmap:(\\d+) \\w+\\/\\d+');
        var result = sdpLine.match(pattern);
        return (result && result.length === 2) ? result[1] : null;
    }

    function setVideoBitrates(sdp, params) {
        params = params || {};
        var xgoogle_min_bitrate = params.min;
        var xgoogle_max_bitrate = params.max;

        var sdpLines = sdp.split('\r\n');

        // VP8
        var vp8Index = findLine(sdpLines, 'a=rtpmap', 'VP8/90000');
        var vp8Payload;
        if (vp8Index) {
            vp8Payload = getCodecPayloadType(sdpLines[vp8Index]);
        }

        if (!vp8Payload) {
            return sdp;
        }

        var rtxIndex = findLine(sdpLines, 'a=rtpmap', 'rtx/90000');
        var rtxPayload;
        if (rtxIndex) {
            rtxPayload = getCodecPayloadType(sdpLines[rtxIndex]);
        }

        if (!rtxIndex) {
            return sdp;
        }

        var rtxFmtpLineIndex = findLine(sdpLines, 'a=fmtp:' + rtxPayload.toString());
        if (rtxFmtpLineIndex !== null) {
            var appendrtxNext = '\r\n';
            appendrtxNext += 'a=fmtp:' + vp8Payload + ' x-google-min-bitrate=' + (xgoogle_min_bitrate || '228') + '; x-google-max-bitrate=' + (xgoogle_max_bitrate || '228');
            sdpLines[rtxFmtpLineIndex] = sdpLines[rtxFmtpLineIndex].concat(appendrtxNext);
            sdp = sdpLines.join('\r\n');
        }

        return sdp;
    }

    function setOpusAttributes(sdp, params) {
        params = params || {};

        var sdpLines = sdp.split('\r\n');

        // Opus
        var opusIndex = findLine(sdpLines, 'a=rtpmap', 'opus/48000');
        var opusPayload;
        if (opusIndex) {
            opusPayload = getCodecPayloadType(sdpLines[opusIndex]);
        }

        if (!opusPayload) {
            return sdp;
        }

        var opusFmtpLineIndex = findLine(sdpLines, 'a=fmtp:' + opusPayload.toString());
        if (opusFmtpLineIndex === null) {
            return sdp;
        }

        var appendOpusNext = '';
        appendOpusNext += '; stereo=' + (typeof params.stereo != 'undefined' ? params.stereo : '1');
        appendOpusNext += '; sprop-stereo=' + (typeof params['sprop-stereo'] != 'undefined' ? params['sprop-stereo'] : '1');

        if (typeof params.maxaveragebitrate != 'undefined') {
            appendOpusNext += '; maxaveragebitrate=' + (params.maxaveragebitrate || 128 * 1024 * 8);
        }

        if (typeof params.maxplaybackrate != 'undefined') {
            appendOpusNext += '; maxplaybackrate=' + (params.maxplaybackrate || 128 * 1024 * 8);
        }

        if (typeof params.cbr != 'undefined') {
            appendOpusNext += '; cbr=' + (typeof params.cbr != 'undefined' ? params.cbr : '1');
        }

        if (typeof params.useinbandfec != 'undefined') {
            appendOpusNext += '; useinbandfec=' + params.useinbandfec;
        }

        if (typeof params.usedtx != 'undefined') {
            appendOpusNext += '; usedtx=' + params.usedtx;
        }

        if (typeof params.maxptime != 'undefined') {
            appendOpusNext += '\r\na=maxptime:' + params.maxptime;
        }

        sdpLines[opusFmtpLineIndex] = sdpLines[opusFmtpLineIndex].concat(appendOpusNext);

        sdp = sdpLines.join('\r\n');
        return sdp;
    }

    return {
        setApplicationSpecificBandwidth: function(sdp, bandwidth, isScreen) {
            return setBAS(sdp, bandwidth, isScreen);
        },
        setVideoBitrates: function(sdp, params) {
            return setVideoBitrates(sdp, params);
        },
        setOpusAttributes: function(sdp, params) {
            return setOpusAttributes(sdp, params);
        }
    };
})();







var streamConstraints ={audio:{ echoCancellation: true },video:true};
var isCaller;

var socket = io();
btnGoRoom.onclick=function(){
  if(inputRoomNumber.value === ''){
    alert("please type a room number")
  }else{
    roomNumber=inputRoomNumber.value;
    socket.emit('create or join',roomNumber);
    divSelectRoom.style = "display:none;";
    divConsultingRoom.style="display:block;";
  }                        
}

inputRoomNumber.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
   event.preventDefault();
   document.getElementById("goRoom").click();
  }
});

socket.on('created',function(room){
  navigator.mediaDevices.getUserMedia(streamConstraints).then(function(stream){
    localStream = stream;
    localVideo.muted = true;
    localVideo.srcObject = stream;
    isCaller = true;
  }).catch(function(err){
    console.log('An error occured when accessing media devices');
  });
});

socket.on('joined',function(room){
  navigator.mediaDevices.getUserMedia(streamConstraints).then(function(stream){
    localStream = stream;
    localVideo.srcObject = stream;
    socket.emit('ready',roomNumber);
  }).catch(function(err){
    console.log('An error occured when accessing media devices');
  });
});


socket.on('ready',function(){
  if(isCaller){
    rtcPeerConnection = new RTCPeerConnection(iceServers);

    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.onaddstream = onAddStream;

    rtcPeerConnection.addStream(localStream);
    rtcPeerConnection.createOffer(setLocalAndOffer,function(e){console.log(e)})

  }
});


socket.on('offer',function(event){
  if(!isCaller){
    rtcPeerConnection = new RTCPeerConnection(iceServers);

    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.onaddstream = onAddStream;

    rtcPeerConnection.addStream(localStream);
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));

    rtcPeerConnection.createAnswer(setLocalAndAnswer,function(e){console.log(e)});
  }
});


socket.on('answer',function(event){
  rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));


});

socket.on('candidate',function(event){
    var candidate = new RTCIceCandidate({
    sdpMLineIndex:event.label,
    candidate: event.candidate
  });
  rtcPeerConnection.addIceCandidate(candidate);
});


function onAddStream(event){
  document.getElementById('remoteVideo').srcObject = event.stream;
    remoteStream = event.stream;
    theStream = event.stream;
    try {
      recorder = new MediaRecorder(event.stream, {mimeType : "video/webm"});
     } catch (e) {
       console.error('Exception while creating MediaRecorder: ' + e);
       return;
     }
     theRecorder = recorder;
     recorder.ondataavailable = 
         (event) => { recordedChunks.push(event.data); };
     recorder.start(100);
     console.log("recorded");
}

function onIceCandidate(
  event) {
    if (event.candidate) {
        console.log('sending ice candidate');
        socket.emit('candidate', {
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
            room: roomNumber
        })
    }
}
function setLocalAndOffer(sessionDescription){
  rtcPeerConnection.setLocalDescription(sessionDescription);
  socket.emit('offer',{
    type:'offer',
    sdp: sessionDescription,
    room : roomNumber

  });
}


function setLocalAndAnswer(sessionDescription){
  rtcPeerConnection.setLocalDescription(sessionDescription);
  socket.emit('answer',{
    type:'answer',
    sdp: sessionDescription,
    room : roomNumber

  });
}


///////////////////////////////////video download/////////////////////////////////////////////////

var theStream;
var theRecorder;
var recordedChunks = [];
function download() {
  theRecorder.stop();
  theStream.getTracks().forEach(track => { track.stop(); });
  var blob = new Blob(recordedChunks, {type: "video/webm"});
  // blob = new Blob([new Uint8Array(buffer, byteOffset, length)]);
  // fs.writeFile('video.webm', blob, () => console.log('video saved!') );
  // console.log(blob)
    // var xmlhttp = new XMLHttpRequest();
     var url = "http://localhost:3000/getdownload";//auto download
    // xmlhttp.onreadystatechange = function (res) {
    //   if (this.readyState == 4 && this.status == 200) {
    //     document.write(this.responseText);
    //   }
    // };   
    // xmlhttp.open("POST", url, true);
    // xmlhttp.send(blob);

  var xhr = new XMLHttpRequest();//auto download
  xhr.open('POST', url, true);//auto download
  xhr.send(blob);//auto download
  alert('video saved in local');//auto download
  // var url =  URL.createObjectURL(blob);//normal download
  // var a = document.createElement("a");
  // document.body.appendChild(a);
  // a.style = "display: none";
  // a.href = url;
  // a.download = new Date() +'.webm';
  // a.click();//normal download
  // setTimeout() here is needed for Firefox.
}

// function upload(blob){
//     var formData = new FormData();
//     formData.append('video-blob', blob);
//     formData.append('video-filename', 'demo.webm');
//     $.ajax({
//          url: "https://192.168.200.73/create_file/",
//          type: "POST",
//          data: formData, 
//          processData: false,
//          contentType: false,

// });
//     console.log("ya ya")

// }

// function upload(blob){
//     var formData = new FormData();
//     formData.append('video-blob', blob);
//     formData.append('video-filename', 'demo.webm');
//     $.ajax({
//          url: "https://192.168.200.73/create_file/",
//          type: "POST",
//          data: formData, 
//          processData: false,
//          contentType: false,

// });
//     console.log("ya ya")

// }
///////////////////////////////////capture image/////////////////////////////////////////////////
var width = 320; 
var height = 0;   
var streaming = false;
var video = document.getElementById('remoteVideo')
  document.getElementById('remoteVideo').addEventListener('canplay', function(ev){
      if (!streaming) {
        height = video.videoHeight / (video.video/width);
      
        // Firefox currently has a bug where the height can't be read from
        // the video, so we will make assumptions if this happens.
      
        if (isNaN(height)) {
          height = width / (4/3);
        }
      
        video.setAttribute('width', width);
        video.setAttribute('height', height);
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        canvas1.setAttribute('width', width);
        canvas1.setAttribute('height', height);
        canvas2.setAttribute('width', width);
        canvas2.setAttribute('height', height);
        streaming = true;
      }
    }, false);

    document.getElementById('startbutton').addEventListener('click', function(ev){
      url = "http://localhost:3000/uploadPicture";
      upload_picture(url);
      ev.preventDefault();
    }, false);
    
    clearphoto();

  function clearphoto() {
    var context = canvas.getContext('2d');
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);

  }

    function upload_picture(url) {
   var context = canvas.getContext('2d');
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);
      
      
    
      var data = canvas.toDataURL('image/jpeg');
     // var a = document.createElement("a");//normal download
     //  document.body.appendChild(a);//normal download
     //  a.style = "display: none";//normal download
     //  a.href = data;//normal download
     //  a.download ='face.jpeg';//normal download
     //  a.click();//normal download
    var formData = new FormData();//auto download
    formData.append('Picture', data); //auto download
    $.ajax({//auto download
      url: url ,//auto download
      data: formData,//auto download
      dataType: 'json',//auto download
      type: 'POST',//auto download
      processData: false,//auto download
      contentType: false,//auto download
      success: function (dataR) {//auto download
        console.log(dataR)//auto download
        
      },//auto download
      error: function (xhr, status, error) {//auto download
        console.log('Error: ' + error.message);//auto download
      }
    });//auto download
    event.preventDefault();
}

  }

  // function takepicture() {

  //   var context = canvas.getContext('2d');
  //   if (width && height) {
  //     canvas.width = width;
  //     canvas.height = height;
  //     context.drawImage(video, 0, 0, width, height);
    
  //      var data = canvas.toDataURL('image/png').replace("image/png", "image/octet-stream");;
  //      var url = "http://localhost:3000/img";
  //      var xhr = new XMLHttpRequest();
  //      xhr.open('POST', url, true);
  //      xhr.send(data);
      // var a = document.createElement("a");
      // document.body.appendChild(a);
      // console.log(data)
      // a.style = "display: none";
      // a.href = data;
      // a.download ='image.jpeg';
      // a.click();
  //   } else {
  //     clearphoto();
  //   }
  // }

  ///////////////////////////////////capture Pan image/////////////////////////////////////////////////
var video1 = document.getElementById('remoteVideo')
document.getElementById('pan').addEventListener('click', function(ev){
  url1 = "http://localhost:3000/uploadPicture1";
      upload_picture1(url1);
      ev.preventDefault();
    }, false);
clearphoto1();

  function clearphoto1() {
    var context1 = canvas1.getContext('2d');
    context1.fillStyle = "#AAA";
    context1.fillRect(0, 0, canvas1.width, canvas1.height);
  }



// function takepicture1() {
//     var context1 = canvas1.getContext('2d');
//     if (width && height) {
//       canvas1.width = width;
//       canvas1.height = height;
//       context1.drawImage(video1, 0, 0, width, height);
//       var data1 = canvas1.toDataURL('image/jpeg');
//       var a = document.createElement("a");
//       document.body.appendChild(a);
//       a.style = "display: none";
//       a.href = data1;
//       a.download ='pan.jpeg';
//       a.click();
//     } else {
//       clearphoto1();
//     }
//   }

    function upload_picture1(url1) {
   var context1 = canvas1.getContext('2d');
    if (width && height) {
      canvas1.width = width;
      canvas1.height = height;
      context1.drawImage(video, 0, 0, width, height);
      
      
    
      var data1 = canvas1.toDataURL('image/jpeg');//auto download

     // var a = document.createElement("a");//normal download
     //  document.body.appendChild(a);
     //  a.style = "display: none";
     //  a.href = data1;
     //  a.download ='pan.jpeg';
     //  a.click();//normal download
    var formData = new FormData();
    formData.append('Picture1', data1); 
    $.ajax({
      url: url1 ,
      data: formData,
      dataType: 'json',
      type: 'POST',
      processData: false,
      contentType: false,
      success: function (dataR) {
        console.log(dataR)
        
      },
      error: function (xhr, status, error) {
        console.log('Error: ' + error.message);
      }
    });//auto download
    event.preventDefault();
}

  }

   ///////////////////////////////////capture Signature/////////////////////////////////////////////////

  var video1 = document.getElementById('remoteVideo');
document.getElementById('Signature').addEventListener('click', function(ev){
  url2 = "http://localhost:3000/uploadPicture2";
      upload_picture2(url2);
      ev.preventDefault();
    }, false);
clearphoto2();



  function clearphoto2() {
    var context2 = canvas2.getContext('2d');
    context2.fillStyle = "#AAA";
    context2.fillRect(0, 0, canvas2.width, canvas2.height);
  }

// function takepicture1() {
//     var context1 = canvas1.getContext('2d');
//     if (width && height) {
//       canvas1.width = width;
//       canvas1.height = height;
//       context1.drawImage(video1, 0, 0, width, height);
//       var data1 = canvas1.toDataURL('image/jpeg');
//       var a = document.createElement("a");
//       document.body.appendChild(a);
//       a.style = "display: none";
//       a.href = data1;
//       a.download ='pan.jpeg';
//       a.click();
//     } else {
//       clearphoto1();
//     }
//   }

    function upload_picture2(url2) {
   var context2 = canvas2.getContext('2d');
    if (width && height) {
      canvas2.width = width;
      canvas2.height = height;
      context2.drawImage(video, 0, 0, width, height);
      
      
    
      var data2 = canvas2.toDataURL('image/jpeg');
      // var a = document.createElement("a");//normal download
      // document.body.appendChild(a);
      // a.style = "display: none";
      // a.href = data2;
      // a.download ='Signature.jpeg';
      // a.click();//normal download
    var formData = new FormData();//auto download
    formData.append('Picture2', data2); 
    $.ajax({
      url: url2 ,
      data: formData,
      dataType: 'json',
      type: 'POST',
      processData: false,
      contentType: false,
      success: function (dataR) {
        console.log(dataR)
        
      },
      error: function (xhr, status, error) {
        console.log('Error: ' + error.message);
      }
    });//auto download
    event.preventDefault();
}

  }

////////////////////////////////////////////customer end call button //////////////////////////////

function dropcall() {
  theStream.getTracks().forEach(track => { track.stop(); });
  }


///////////////////////////////////////////mute and unmute button /////////////////////////////////

function mute(){
    localStream.getAudioTracks()[0].enabled = !(localStream.getAudioTracks()[0].enabled);
    console.log('muted');
    $('.btn-secondary span').toggleClass('fa-microphone fa-microphone-slash');
   
}


