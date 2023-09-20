const socket = io('/lecture_meeting', {transports: ['websocket']});
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.setAttribute('full-screen', 'off');
const token = localStorage.getItem('token');
myVideo.addEventListener('click', () =>{
    if(myVideo.getAttribute('full-screen') === 'off'){
        myVideo.style.width = "100vh";
        myVideo.style.height = "auto";
        myVideo.setAttribute('full-screen', 'on');
    }
    else{
        myVideo.style.width = "250px";
        myVideo.style.height = "250px";
        myVideo.setAttribute('full-screen', 'off');
    }
})

let user_id;
var peer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "9000",
});
let myVideoStream;
let myCalls =[];

socket.on('this user disconnected', (user) =>{
    const userVideo = document.getElementById(user);
    userVideo.remove();
});

navigator.mediaDevices
    .getUserMedia({
        audio: true,
        video: true,
    })
    .then((stream) => {
        myVideoStream = stream;
        addVideoStream(myVideo, stream);
        stream.getVideoTracks()[0].enabled = false;
        stream.getAudioTracks()[0].enabled = false;
        peer.on("call", (call) => {
            call.answer(stream);
            myCalls.push(call);
            const video = document.createElement("video");
            video.setAttribute('id', call.peer);
            video.setAttribute('full-screen', 'off');
            video.addEventListener('click', () =>{
                if(video.getAttribute('full-screen') === 'off'){
                    video.style.width = "100vh";
                    video.style.height = "auto";
                    video.setAttribute('full-screen', 'on');
                }
                else{
                    video.style.width = "250px";
                    video.style.height = "250px";
                    video.setAttribute('full-screen', 'off');
                }
            })
            call.on("stream", (userVideoStream) => {
                addVideoStream(video, userVideoStream);
            });
        });
        socket.emit("ready");
        socket.on("user-connected", (userId) => {
            connectToNewUser(userId, stream);
        });
    });
const connectToNewUser = (userId, stream) => {
    const call = peer.call(userId, stream);
    myCalls.push(call);
    const video = document.createElement("video");
    video.setAttribute('full-screen', 'off');
    video.addEventListener('click', () =>{
        if(video.getAttribute('full-screen') === 'off'){
            video.style.width = "100vh";
            video.style.height = "auto";
            video.setAttribute('full-screen', 'on');
        }
        else{
            video.style.width = "250px";
            video.style.height = "250px";
            video.setAttribute('full-screen', 'off');
        }
    })
    video.setAttribute('id', userId);
    call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
    });
};


const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
        videoGrid.append(video);
    });
};

peer.on("open", (id) => {
    user_id = id;
    socket.emit("join-room", ROOM_ID, id);
});


window.addEventListener('unload', () => socket.emit('user disconnects', user_id, ROOM_ID));


const videoButton = document.getElementById('myvideo');
const muteButton = document.getElementById('muteButton');
const screenButton = document.getElementById('shareScreen');
const hangButton = document.getElementById('hangUp');

videoButton.addEventListener('click', function(){
    if(screenButton.getAttribute('state') === 'off'){
        myVideoStream.getVideoTracks()[0].enabled =  !myVideoStream.getVideoTracks()[0].enabled;
    }
    if(videoButton.getAttribute('state') === 'on'){
        videoButton.setAttribute('state', 'off');
        videoButton.innerHTML="";
        const icon = document.createElement('i');
        icon.classList.add('fa-solid');
        icon.classList.add('fa-video-slash');
        videoButton.appendChild(icon);
    }
    else{
        videoButton.setAttribute('state', 'on');
        videoButton.innerHTML="";
        const icon = document.createElement('i');
        icon.classList.add('fa-solid');
        icon.classList.add('fa-video');
        videoButton.appendChild(icon);
    }
});

muteButton.addEventListener('click', function(){
    myVideoStream.getAudioTracks()[0].enabled =  !myVideoStream.getAudioTracks()[0].enabled;
    if(muteButton.getAttribute('state') === 'on'){
        muteButton.innerHTML="";
        muteButton.setAttribute('state', 'off');
        const icon = document.createElement('i');
        icon.classList.add('fa-solid');
        icon.classList.add('fa-microphone-slash');
        muteButton.appendChild(icon);
    }
    else{
        muteButton.setAttribute('state', 'on');
        muteButton.innerHTML="";
        const icon = document.createElement('i');
        icon.classList.add('fa-solid');
        icon.classList.add('fa-microphone');
        muteButton.appendChild(icon);
    }
});

screenButton.addEventListener('click', async function(){
    let stream1;
    let screen;
    if(screenButton.getAttribute('state') === 'off'){
        stream1 = await navigator.mediaDevices.getDisplayMedia({video: true});
        screen = stream1.getVideoTracks()[0];
        myVideoStream.removeTrack(myVideoStream.getVideoTracks()[0]);
        myVideoStream.addTrack(screen);
        if(myCalls.length > 0){
            myCalls.forEach((call) => call.peerConnection.getSenders()[1].replaceTrack(screen));
        }
        screenButton.setAttribute('state', 'on');
        screenButton.innerHTML="";
        const icon = document.createElement('i');
        icon.classList.add('fa-solid');
        icon.classList.add('fa-computer');
        screenButton.appendChild(icon);
    }
    else{
        stream1 = await navigator.mediaDevices.getUserMedia({video: true});
        screen = stream1.getVideoTracks()[0];
        myVideoStream.removeTrack(myVideoStream.getVideoTracks()[0]);
        myVideoStream.addTrack(screen);
        if(myCalls.length > 0){
            myCalls.forEach((call) => call.peerConnection.getSenders()[1].replaceTrack(screen));
        }
        if(videoButton.getAttribute('state') === 'off'){
            myVideoStream.getVideoTracks()[0].enabled = false;
        }
        else {
            myVideoStream.getVideoTracks()[0].enabled = true;
        }
        screenButton.setAttribute('state', 'off');
        screenButton.innerHTML="";
        const icon = document.createElement('i');
        icon.classList.add('fa-solid');
        icon.classList.add('fa-display');
        screenButton.appendChild(icon);
    }
});

hangButton.addEventListener('click', function(){
    window.location.href= 'http://localhost:3000/homepage?token=' + token;
})

function showMessage(message){
    var messageContainer;
    var contentContainer1;
    var contentContainer2;
    var contentContainer3;
    var contentContainer4;
    var contentContainer5;
    var footerContainer;
    var lecturer = $('#lecturer').attr('userIsLecturer');
    messageContainer = $('<div class = "message">');
    var header = $('<div style = "display: flex; flex-direction: row">');
    var question;
    if(message.proposal && lecturer === 'true'){
        question =$('<div style="font-weight:bold">Question:</div>').text('Maybe you want to hide this question:');
    }
    else{
        question =$('<div style="font-weight:bold">Question:</div>').text('Question:');
    }
    header.append(question);
    if(lecturer === 'true'){
        var hideButton = $(`<button style="margin-right: 0; margin-left: auto; background: #660033; color: white; 
                    padding:2px" class="Hide" type = ${message.id}>`).text('Hide');
        header.append(hideButton);
        hideButton.click(function(){
            var question_id = $(this).attr('type');
            hideQuestion(question_id);
            $(this).parent().parent().remove();
        })
    }
    else{
        if(message.user_has_liked){
            var dislikeButton = $(`<button style="margin-right: 0; margin-left: auto; background: #660033; color: white; 
                    padding:2px" class="Hide" dislike = ${message.id}>`).text('Dislike');
            header.append(dislikeButton);
            dislikeButton.click(function(){
                var question_id = $(this).attr('dislike');
                sendDislike(question_id);
                $(this).parent().parent().remove();
            })
        }
        else{
            var likeButton = $(`<button style="margin-right: 0; margin-left: auto; background: #660033; color: white; 
                    padding:2px" class="Hide" like = ${message.id}>`).text('Like');
            header.append(likeButton);
            likeButton.click(function(){
                var question_id = $(this).attr('like');
                sendLike(question_id);
                $(this).parent().parent().remove();
            })
        }
    }
    messageContainer.append(header);
    contentContainer1 = $('<div>').text(message.content);
    messageContainer.append(contentContainer1);
    contentContainer2 = $('<div style = "font-weight: bold">').text('Answer:');
    messageContainer.append(contentContainer2);
    if(message.answer === null){
        contentContainer3 = $(`<div class = ${message.id}>`).text('Not answered yet');
    }
    else{
        contentContainer3 = $(`<div class = ${message.id}>`).text(message.answer);
    }
    messageContainer.append(contentContainer3);
    if(lecturer === 'true'){
        var myDiv = $('<div style = "display: flex; flex-direction: row;">');
        var textArea = $(`<textarea type="text" autocomplete="off" style="width:90%; height: 30px;" 
                                placeholder="Answer question..." sm=${message.id}>`);
        var sendButton = $(`<div class="my-options__button Answer" id =${message.id}>`)
        sendButton.click(function(){
            const messageId = $(this).attr('id');
            var parent = $(this).parent();
            var myTextArea = parent.find('textarea');
            const answer = myTextArea.val();
            sendAnswer(messageId, answer);
            var selector = '.' + messageId;
            $(selector).text(answer);
            myTextArea.val('');
        })
        var icon = $('<i class="fa fa-plus" aria-hidden="true"></i>');
        sendButton.append(icon);
        sendButton.attr('id', message.id);
        myDiv.append(textArea);
        myDiv.append(sendButton);
        messageContainer.append(myDiv);
    }
    footerContainer = $('<div style = "display:flex; flex-direction:row">');
    contentContainer4 = $('<div>').text('By: ' + message.username);
    footerContainer.append(contentContainer4);
    contentContainer6 = $(`<div style ="margin-left: 5px" likes=${message.id}>`).text('Likes: ' + message.likes_count);
    footerContainer.append(contentContainer4);
    footerContainer.append(contentContainer6);
    var arrayTime = message.time.split(':');
    contentContainer5 = $('<div style="margin-right: 0; margin-left: auto">').text(arrayTime[0] + ':' + arrayTime[1]);
    footerContainer.append(contentContainer5);
    messageContainer.append(footerContainer);
    $('#messages').append(messageContainer);
}

socket.on('here is your message', (messages) =>{
    console.log('moja poruka');
    console.log(messages);
    $('#messages').empty();
    for(let i = 0; i < messages.length; i++){
        showMessage(messages[i]);
    }
});

socket.on('users message', (messages) =>{
    $('#messages').empty();
    for(let i = 0; i < messages.length; i++){
        showMessage(messages[i]);
    }
});
function sendingQuestion(content){
    if(content.length > 0){
        socket.emit('user sends message', content, token, ROOM_ID);
    }

}

$('#send').click(function(){
    console.log('tu sam');
    const content = $('#chat_message').val();
    sendingQuestion(content);
    $('#chat_message').val('');
})

function sendAnswer(questionId, content){
    socket.emit('answer', questionId, content, token, ROOM_ID);
}

$('.Answer').click(function(){
    console.log('click 2');
    const messageId = $(this).attr('id');
    var parent = $(this).parent();
    var myTextArea = parent.find('textarea');
    const answer = myTextArea.val();
    console.log(answer);
    sendAnswer(messageId, answer);
    var selector = '.' + messageId;
    $(selector).text(answer);
    myTextArea.val('');
})

socket.on('answer is', (question_id, answer) =>{
    console.log(answer);
    $('.' + question_id).text(answer);
})

function hideQuestion(question_id){
    socket.emit('hide', question_id, token, ROOM_ID);
}

$('.Hide').click(function(){
    var question_id = $(this).attr('type');
    hideQuestion(question_id);
    $(this).parent().parent().remove();
})

socket.on('hidden', (question_id) =>{
    $('.' + question_id).parent().remove();
})

$('#sendLecturer').click(function() {
    var text = 'Lecturer wrote: '
    text += $("#lecturer_message").val();
    $('#messages').prepend($('<div class = "message">').text(text));
    $("#lecturer_message").val('');
    socket.emit('Lecturer wrote', text, token, ROOM_ID);
})

socket.on('message', (content)=>
{
    $('#messages').prepend($('<div class = "message">').text(content));
}
)

function sendLike(question_id){
    socket.emit('user likes',token, ROOM_ID, question_id);
}


function sendDislike(question_id){
    socket.emit('user dislikes',token, ROOM_ID, question_id);
}

socket.on('here is your like', (messages) =>{
    $('#messages').empty();
    for(let i = 0; i < messages.length; i++){
        showMessage(messages[i]);
    }
})

socket.on('user liked', ()=>{
    socket.emit('give me liked', token, ROOM_ID);
})

socket.on('here is liked', (messages) =>{
    $('#messages').empty();
    for(let i = 0; i < messages.length; i++){
        showMessage(messages[i]);
    }
})

socket.on('here is your dislike', (messages) =>{
    $('#messages').empty();
    for(let i = 0; i < messages.length; i++){
        showMessage(messages[i]);
    }
})

socket.on('user disliked', ()=>{
    socket.emit('give me disliked', token, ROOM_ID);
})

socket.on('here is disliked', (messages) =>{
    $('#messages').empty();
    for(let i = 0; i < messages.length; i++){
        showMessage(messages[i]);
    }
})

$('.Dislike').click(function(){
    var question_id = $(this).attr('dislike');
    sendDislike(question_id);
    $(this).parent().parent().remove();
})

$('.Like').click(function(){
    var question_id = $(this).attr('like');
    sendLike(question_id);
    $(this).parent().parent().remove();
})





