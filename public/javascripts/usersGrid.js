$(document).ready(function(){
    $('.go-to').click(function(){
        const userUrl = '/user/' + $(this).attr('id')+'?token='+token;
        window.location.href = userUrl;
    })
})