$('#addFriend').click(function(){
    socketNotif.emit('user sends request', token, userId);
   window.location.href = window.location.href;
})

$('#removeRequest').click(function(){
    socketNotif.emit('user deletes request', token, userId);
    window.location.href = window.location.href;
})

$('#acceptRequest').click(function(){
    socketNotif.emit('user accepts request', token, userId);
    window.location.href = window.location.href;
})

$('#declineRequest').click(function(){
    socketNotif.emit('user declines request', token, userId);
    window.location.href = window.location.href;
})

$('#unfriend').click(function(){
    socketNotif.emit('user unfriend', token, userId);
    window.location.href = window.location.href;
})

$('.toggle-div1').click(function (){
    window.location.href = '/homepage?lecture_id=' + $(this).attr('id') + '&token=' + mytoken;
})

$('#deleteProfile').click(function(){
    console.log('kliknuto');
    const url = '/delete-profile?token=' + token;
    $.ajax({
        type: "POST",
        url: url,
        success: function (response) {
            window.location.href = 'http://localhost:3000/login';
            localStorage.setItem('token', null);
        },
        error: function (xhr, status, err) {
            $('#error').text(xhr.responseJSON.error);
            console.error("Error changing username:", xhr.responseJSON.error);
        }
    });
})

$('#deleteProfile').click(function(){
    console.log('kliknuto');
    const url = '/delete-profile?token=' + token;
    $.ajax({
        type: "POST",
        url: url,
        success: function (response) {
            window.location.href = 'http://localhost:3000/login';
            localStorage.setItem('token', null);
        },
        error: function (xhr, status, err) {
            $('#error').text(xhr.responseJSON.error);
            console.error("Error changing username:", xhr.responseJSON.error);
        }
    });
})

$('#pictureInput').change(function() {
    $('#pictureForm').submit();
});
$('#changePicture').click(function(){
   $('#pictureInput').click();
})

$('#pictureForm').submit(function (e) {
    e.preventDefault();
    var form = document.getElementById('pictureForm')
    const formData = new FormData(form);
    const urlPicture = '/upload-profile-picture?token=' + token;
    $.ajax({
        url: urlPicture,
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function (response) {
            window.location.href = window.location.href;
        },
        error: function (error) {
            hideLoadingAnimation();
            console.error('Picture upload error:', error);
            alert('Picture upload failed.');
        }
    });
});

$('#block30').click(function(){
    const url = '/block-user?user_id=' + userId + '&token=' + token;
    $.ajax({
        url: url,
        type: 'POST',
        success: function (response) {
            window.location.href = 'http://localhost:3000/homepage?token=' + token;
        },
        error: function (error) {
            hideLoadingAnimation();
            console.error('Picture upload error:', error);
            alert('Picture upload failed.');
        }
    });
})