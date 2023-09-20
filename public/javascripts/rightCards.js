function loadDiv(){
    $("div.toggle-div1[id]").click(function(){
        const id = $(this).attr('id');
        const token = localStorage.getItem('token');
        const url = '/get-lecture/'+id+'?token='+token;
        $.ajax({
            type: "GET",
            url: url,
            success: function (response) {
                $('#header-details').text('Details about selected lecture:');
                fillInDetails(response);
            },
            error: function (xhr, status, err) {
                error.textContent = xhr.responseJSON.error;
                console.error("Error getting lecture:", xhr.responseJSON.error);
            }
        });
    })
}

$(document).ready(function() {
    $(".toggle-button1").click(function() {
        const $content = $(this).next(".content1");
        $content.toggleClass("show1");
        $(this).toggleClass("active1");
    });
    loadDiv();
    const token = localStorage.getItem('token');
    const urlOrganizing = '/lectures/grid/organizing/startDate/0?token='+token;
    $("#organizingLink").attr('href', urlOrganizing);
    const urlOrganizeFuture = '/lectures/grid/organize-future/startDate/0?token='+token;
    $("#organizeFutureLink").attr('href', urlOrganizeFuture);
    const urlOrganized = '/lectures/grid/organized/startDate/0?token='+token;
    $("#organizedLink").attr('href', urlOrganized);
    const urlAttendging = '/lectures/grid/attending/startDate/0?token='+token;
    $("#attendingLink").attr('href', urlAttendging);
    const urlAttendFuture = '/lectures/grid/attend-future/startDate/0?token='+token;
    $("#attendFutureLink").attr('href', urlAttendFuture);
    const urlAttended = '/lectures/grid/attended/startDate/0?token='+token;
    $("#attendedLink").attr('href', urlAttended);
    if(!(!!$('#lecture_id').attr('lectureProvided'))){
        if($("div.toggle-div1[id]").length > 0){
            var firstLecture = $("div.toggle-div1[id]").first();
            console.log($("div.toggle-div1[id]").first());
            const id = firstLecture.attr('id');
            const url = '/get-lecture/'+id+'?token='+token;
            $.ajax({
                type: "GET",
                url: url,
                success: function (response) {
                    $('#header-details').text('Details about some of yours lecture:');
                    fillInDetails(response);
                },
                error: function (xhr, status, err) {
                    error.textContent = xhr.responseJSON.error;
                    console.error("Error getting lecture:", xhr.responseJSON.error);
                }
            });
        }
        else{
            $('#aboutLecture').empty();
            var header = $('<h3>').attr('id', 'header-details').text('There is no lectures of yours');
            $('#aboutLecture').append(header);
        }
    }
    else{
        const id = $('#lecture_id').attr('lectureProvided');
        const url = '/get-lecture/'+id+'?token='+token;
        $.ajax({
            type: "GET",
            url: url,
            success: function (response) {
                $('#header-details').text('Details about some of yours lecture:');
                fillInDetails(response);
            },
            error: function (xhr, status, err) {
                error.textContent = xhr.responseJSON.error;
                console.error("Error getting lecture:", xhr.responseJSON.error);
            }
        });
    }
});


