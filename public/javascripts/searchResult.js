$(document).ready(function() {
    const urlCurrent = window.location.href;
    const token = localStorage.getItem('token');
    const match = urlCurrent.match(/\/(\d+)\?/);
    const number = match[1];
    const sorted = urlCurrent.split('/')[6];
    $('.pagination1').each(function() {
        const id = $(this).attr('id');
        $(this).attr('href', urlCurrent.replace(`/${number}?`, `/${id}?`));
    });
    $('#'+ String(number)).attr('style', 'color: white !important; background-color: #660033 !important');
    $('#previous').click(function(){
        if(parseInt(number) !== 0) {
            window.location.href = urlCurrent.replace(`/${number}?`, `/${parseInt(number) - 1}?`)
        }
        else{
            window.location.href = urlCurrent;
        }
    })
    $('#next').click(function(){
        if(parseInt(number) !== $('.pagination1').length-1) {
            window.location.href = urlCurrent.replace(`/${number}?`, `/${parseInt(number) + 1}?`)
        }
        else{
            window.location.href = urlCurrent;
        }
    })
    if(sorted === 'startDate'){
        $('#sortStartDate').addClass('my-active');
        $('#sortNumberOfSessions').removeClass('my-active');
    }
    if(sorted === 'numberOfSessions'){
        $('#sortStartDate').removeClass('my-active');
        $('#sortNumberOfSessions').addClass('my-active');
    }
    $('#sortStartDate').click(function (){
        window.location.href = urlCurrent.replace(sorted, 'startDate');
    })
    $('#sortNumberOfSessions').click(function (){
        window.location.href = urlCurrent.replace(sorted, 'numberOfSessions');
    })
    $('.go-to').click(function(){
        const neededUrl = '/homepage?lecture_id=' + $(this).attr('id')+'&token='+token;
        window.location.href = neededUrl;
    })
});