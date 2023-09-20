$(document).ready(function() {
  $('#searchForm').on('submit', function(e) {
    e.preventDefault();
  });
  $('#searchInput').on('input', function() {
    const searchString = $(this).val();
    const token = localStorage.getItem('token');
    $('#searchForm').on('submit', function(e) {
      e.preventDefault();
      const lectureName = $('#searchInput').val();
      const urlWithToken = '/lectures/grid/search/startDate/0' + '?searchName=' + lectureName + '&token=' + token;
      window.location.href = urlWithToken;
    });
    if (searchString.length >= 3) {
      $.ajax({
        url: `/search/lectures?lecture_name=${searchString}&token=${token}`,
        method: 'GET',
        dataType: 'json',
        success: function(response) {
          $('#searchResults').empty();
          if(response.lecturesSearch.length > 0){
            $('#searchResults').addClass('show');
          }
          else{
            $('#searchResults').removeClass('show');
          }
          for(let i = 0; i < response.lecturesSearch.length; i++){
            var div = $('<div class = "searchResult">');
            div.click(function(){
              var url = "/homepage?lecture_id="+response.lecturesSearch[i].id+"&token="+token;
              window.location.href = url;
            })
            div.text(`Name: ${response.lecturesSearch[i].name} Category: ${response.lecturesSearch[i].category_name}`)
            $('#searchResults').append(div);
          }
        },
        error: function() {
          console.error('Error fetching search results');
        }
      });
    } else {
      $('#searchResults').empty();
      $('#searchResults').removeClass('show');
    }
  });

  $('#searchUsersForm').on('submit', function(e) {
    e.preventDefault();
  });
  $('#searchUsersInput').on('input', function() {
    const searchString = $(this).val();
    const token = localStorage.getItem('token');
    $('#searchUsersForm').on('submit', function(e) {
      e.preventDefault();
      const userName = $('#searchUsersInput').val();
      const urlWithToken = '/grid/users/'+ userName + '/?token=' + token;
      window.location.href = urlWithToken;
    });
    if (searchString.length >= 3) {
      $.ajax({
        url: `/search/users?user_name=${searchString}&token=${token}`,
        method: 'GET',
        dataType: 'json',
        success: function(response) {
          $('#searchUserResults').empty();
          if(response.users.length > 0){
            $('#searchUserResults').addClass('show');
          }
          else{
            $('#searchUserResults').removeClass('show');
          }
          for(let i = 0; i < response.users.length; i++){
            var div = $('<div class = "searchUserResult">');
            div.click(function(){
              var url = "/user/"+response.users[i].id+"?token="+token;
              window.location.href = url;
            })
            div.text(response.users[i].username);
            $('#searchUserResults').append(div);
          }
        },
        error: function() {
          console.error('Error fetching search results');
        }
      });
    } else {
      $('#searchUserResults').empty();
      $('#searchUserResults').removeClass('show');
    }
  });

  $('#codeForm').on('submit', function(e) {
    e.preventDefault();
    const lecture_id = $('#codeInput').val();
    const url = '/homepage?lecture_id=' + lecture_id + '&token=' + token;
    window.location.href = url;
  });
});
const mytoken = localStorage.getItem('token');
const socketNotif = io('/notifications', {transports: ['websocket']});
socketNotif.emit('user-connected', mytoken);
socketNotif.on('notifications', (notifications) =>{
  $('#numberN').text(notifications[notifications.length-1]);
  if(notifications.length === 1){
    $('#notificationsResults').append($('<div class="notificationsResult">').text('No notifications'));
  }
  else{$('#notificationsResults').empty();}
  for(let i = 0; i < notifications.length-1; i++){
    var div = $('<div class="notificationsResult">').text(notifications[i].content);
    div.attr('id', notifications[i].sender_id);
    if(notifications[i].content.includes('graded')){
      div.click(function(){
        window.location.href = '/homepage?lecture_id=/' + notifications[i].sender_id + '&token=' + mytoken;
      })
    }
    else if (notifications[i].content.includes('comments')){
      div.click(function(){
        window.location.href = '/homepage?lecture_id=/' + notifications[i].sender_id + '&token=' + mytoken;
      })
    }
    else {
      div.click(function () {
        window.location.href = '/user/' + notifications[i].sender_id + '?token=' + mytoken;
      })
    }
    $('#notificationsResults').append(div.text(notifications[i].content));
  }
})
$('#notifications').click(function(){
  if($('#notificationsResults').hasClass('show')){
    $('#notificationsResults').removeClass('show');
  }
  else{
    $('#notificationsResults').addClass('show');
    socketNotif.emit('user read notifications', mytoken);
    socketNotif.on('notifications read', ()=>{
      $('#numberN').text('0');
    })
  }
})

socketNotif.on('user sends request', (content, id) =>{
  var number = parseInt($('#numberN').text());
  number = number+1;
  $('#numberN').text(number);
  if($('.notificationsResult').text() === 'No notifications'){
    $('#notificationsResults').empty();
  }
  var div = $('<div class="notificationsResult">').text(content);
  div.attr('id', id);
  $('#notificationsResults').prepend(div);
  div.click(function(){
    window.location.href = '/user/' + id + '?token=' + mytoken;
  })
})

socketNotif.on('user deletes request', (content, id) =>{
  var number = parseInt($('#numberN').text());
  number = number+1;
  $('#numberN').text(number);
  if($('.notificationsResult').text() === 'No notifications'){
    $('#notificationsResults').empty();
  }
  var div = $('<div class="notificationsResult">').text(content);
  div.attr('id', id);
  $('#notificationsResults').prepend(div);
  div.click(function(){
    window.location.href = '/user/' + id + '?token=' + mytoken;
  })
})

socketNotif.on('user accepts request', (content, id) =>{
  var number = parseInt($('#numberN').text());
  number = number+1;
  $('#numberN').text(number);
  if($('.notificationsResult').text() === 'No notifications'){
    $('#notificationsResults').empty();
  }
  var div = $('<div class="notificationsResult">').text(content);
  div.attr('id', id);
  $('#notificationsResults').prepend(div);
  div.click(function(){
    window.location.href = '/user/' + id + '?token=' + mytoken;
  })
})

socketNotif.on('user declines request', (content, id) =>{
  var number = parseInt($('#numberN').text());
  number = number+1;
  $('#numberN').text(number);
  if($('.notificationsResult').text() === 'No notifications'){
    $('#notificationsResults').empty();
  }
  var div = $('<div class="notificationsResult">').text(content);
  div.attr('id', id);
  $('#notificationsResults').prepend(div);
  div.click(function(){
    window.location.href = '/user/' + id + '?token=' + mytoken;
  })
})

socketNotif.on('user unfriend', (content, id) =>{
  var number = parseInt($('#numberN').text());
  number = number+1;
  $('#numberN').text(number);
  if($('.notificationsResult').text() === 'No notifications'){
    $('#notificationsResults').empty();
  }
  var div = $('<div class="notificationsResult">').text(content);
  div.attr('id', id);
  $('#notificationsResults').prepend(div);
  div.click(function(){
    window.location.href = '/user/' + id + '?token=' + mytoken;
  })
})

socketNotif.on('user graded', (content, id) =>{
  var number = parseInt($('#numberN').text());
  number = number+1;
  $('#numberN').text(number);
  if($('.notificationsResult').text() === 'No notifications'){
    $('#notificationsResults').empty();
  }
  var div = $('<div class="notificationsResult">').text(content);
  div.attr('id', id);
  $('#notificationsResults').prepend(div);
  div.click(function(){
    window.location.href = '/homepage?lecture_id=' + id + '&token=' + mytoken;
  })
})

socketNotif.on('user comments', (content, id) =>{
  var number = parseInt($('#numberN').text());
  number = number+1;
  $('#numberN').text(number);
  if($('.notificationResult').text() === 'No notifications'){
    $('#notificationsResults').empty();
  }
  var div = $('<div class="notificationsResult">').text(content);
  div.attr('id', id);
  $('#notificationsResults').prepend(div);
  div.click(function(){
    window.location.href = '/homepage?lecture_id=' + id + '&token=' + mytoken;
  })
})




