function getDayFromInt(number){
    if(number === 1){
        return 'Monday';
    }
    else if(number === 2){
        return 'Tuesday';
    }
    else if(number === 3){
        return 'Wednesday';
    }
    else if(number === 4){
        return 'Thursday';
    }
    else if(number === 5){
        return 'Friday';
    }
    else if(number === 6){
        return 'Saturday';
    }
    else if(number === 0){
        return 'Sunday';
    }
    else{
        console.error('Not good number!');
    }
}

function isLectureInProgress(startDate, endDate, schedule){
    const start_date = new Date(startDate);
    const end_date = new Date(endDate);
    var currentDate = new Date();
    currentDate.setHours(0,0,0,0);
    if(!(currentDate >= start_date && currentDate <= end_date)){
        return false;
    }
    const day = getDayFromInt(currentDate.getDay());
    for(let i = 0; i < schedule.length; i++){
        if (day === schedule[i].day){
            currentDate = new Date();
            const currentHour = currentDate.getHours();
            const currentMinutes = currentDate.getMinutes();
            const timePartsStart = schedule[i].time_start.split(':');
            const startHour = parseInt(timePartsStart[0], 10);
            const startMinutes = parseInt(timePartsStart[1], 10);
            const timePartsEnd = schedule[i].time_end.split(':');
            const endHour = parseInt(timePartsEnd[0], 10);
            const endMinutes = parseInt(timePartsEnd[1], 10);
            if(
                (currentHour > startHour || (currentHour === startHour && currentMinutes >= startMinutes)) &&
                (currentHour < endHour || (currentHour === endHour && currentMinutes <= endMinutes))
            ) {
                return true;
            }
        }
    }
    return false;
}


function fillInDetails(lecture){
    $('#code').click(function(){
        $('#realQuestions').empty();
        $modal = $('#questionsModal');
        $('#questionsHeader').css('font-size', 'large').css('font-weight', 'bold').text('Code of lecture:')
        $modal.fadeIn();
        var divQuestion = $('<div class = toggle-div1Q>');
        divQuestion.text(lecture.id);
        $('#realQuestions').append(divQuestion);
    })
    function toBase64(arr) {
        return btoa(
            arr.reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
    }
    if(lecture.image) {
        const image = toBase64(lecture.image.data);
        src1="data:image/png;base64," + image;
        $('#lecture-image').attr('src', src1);
    }
    else{
        $('#lecture-image').attr('src', '');
    }
    $('#name-details').text(lecture.name);
    $('#category-details').text(lecture.category.replace('_', ' '));
    $('#lecturer-details').text(lecture.username);
    $('#start-date-details').text(lecture.dateStart);
    $('#end-date-details').text(lecture.dateEnd);
    $('#description-details').text(lecture.description);
    $('#schedule-details').empty();
    $('#commentars-details').empty();
    $('#grades-details').empty();
    $('#files-details').empty();
    $('#buttons').empty();
    $('#fileForm').remove();
    $('#enterLecture').remove();
    $('.left-div').attr('id', lecture.id);
    //buttons:
    if(lecture.userIsLecturer || lecture.userIsAdmin) {
        $('#seeAttendees').click(function(){
            $('realQuestions').empty();
            $modal = $('#questionsModal');
            $('#questionsHeader').css('font-size', 'large').css('font-weight', 'bold').text('Attendees:')
            $modal.fadeIn();
            $modal.css('overflow', 'auto')
            $('body').css('overflow', 'hidden');
            const urlGetAttendees = '/get-attendees/'+ lecture.id + '?token=' + token;
            $.ajax({
                type: "GET",
                url: urlGetAttendees,
                success: function (response) {
                    $('#realQuestions').empty();
                    if(response.attendees.length === 0){
                        var divQuestion = $('<div class = toggle-div1Q>');
                        divQuestion.text('No attendees');
                        $('#realQuestions').append(divQuestion);
                    }
                    else{
                        for(let i = 0; i  < response.attendees.length; i++){
                            var divQuestion = $('<div class =  attendee>');
                            divQuestion.attr('id', response.attendees.id);
                            divQuestion.append(response.attendees[i].username);
                            $('#realQuestions').append(divQuestion);
                        }
                    }
                },
                error: function (xhr, status, err) {
                    error.textContent = xhr.responseJSON.error;
                    console.error("Error getting lecture:", xhr.responseJSON.error);
                }
            });
        })
        var button1 = $('<button>').attr('type', 'button').attr('id', 'unansweredQuestions').addClass('btn').addClass('btn-primary').addClass('button');
        button1.css('float', 'right');
        button1.text('Unanswered questions');
        var button2 = $('<button>').attr('type', 'button').attr('id', 'answeredQuestions').addClass('btn').addClass('btn-primary').addClass('button');
        button2.css('float', 'right');
        button2.text('Answered questions');
        var button3 = $('<button>').attr('type', 'button').attr('id', 'hiddenQuestions').addClass('btn').addClass('btn-primary').addClass('button');
        button3.css('float', 'right');
        button3.text('Hidden questions');
        var button4 = $('<button>').attr('type', 'button').attr('id', 'eraseLecture').addClass('btn').addClass('btn-primary').addClass('button');
        button4.css('float', 'right');
        button4.text('Erase lecture');
        button1.click(function(){
            $modal = $('#questionsModal');
            $('#questionsHeader').css('font-size', 'large').css('font-weight', 'bold').text('Unanswered questions:')
            $modal.fadeIn();
            $modal.css('overflow', 'auto')
            $('body').css('overflow', 'hidden');
            const urlUnansweredQuestions = '/unanswered-questions/'+ lecture.id + '?token=' + token;
            $.ajax({
                type: "GET",
                url: urlUnansweredQuestions,
                success: function (response) {
                    $('#realQuestions').empty();
                    if(response.questions.length === 0){
                        var divQuestion = $('<div class = toggle-div1Q>');
                        divQuestion.text('No questions');
                        $('#realQuestions').append(divQuestion);
                    }
                    else{
                        for(let i = 0; i  < response.questions.length; i++){
                            var divQuestion = $('<div class = toggle-div1Q>');
                            divQuestion.attr('id', response.questions[i].id);
                            divQuestion.append($('<div style="font-weight: bold">').text('Question:'));
                            divQuestion.append(response.questions[i].content);
                            divQuestion.append('<br />');
                            const text2 = 'By: ' + response.questions[i].username;
                            divQuestion.append(text2);
                            var button = $('<button style="background: #660033; color: white; padding:2px">').text('Hide');
                            button.click(function(){
                                const urlHide = '/hide-question/' + lecture.id + '/' + response.questions[i].id + '?token=' + token;
                                $.ajax({
                                    type: "POST",
                                    url: urlHide,
                                    success: function(){
                                        const id = '#' + response.questions[i].id;
                                        $(id).remove();
                                    },
                                    error: function (xhr, status, err) {
                                        error.textContent = xhr.responseJSON.error;
                                        console.error("Error getting lecture:", xhr.responseJSON.error);
                                    }
                                })
                            })
                            divQuestion.append('<br />');
                            divQuestion.append(button);
                            $('#realQuestions').append(divQuestion);
                        }
                    }
                },
                error: function (xhr, status, err) {
                    error.textContent = xhr.responseJSON.error;
                    console.error("Error getting lecture:", xhr.responseJSON.error);
                }
            });
        })
        button2.click(function(){
            $modal = $('#questionsModal');
            $('#questionsHeader').css('font-size', 'large').css('font-weight', 'bold').text('Answered questions:')
            $modal.fadeIn();
            $modal.css('overflow', 'auto')
            $('body').css('overflow', 'hidden');
            const urlAnsweredQuestions = '/answered-questions/'+ lecture.id + '?token=' + token;
            $.ajax({
                type: "GET",
                url: urlAnsweredQuestions,
                success: function (response) {
                    $('#realQuestions').empty();
                    if(response.questions.length === 0){
                        var divQuestion = $('<div class = toggle-div1Q>');
                        divQuestion.text('No questions');
                        $('#realQuestions').append(divQuestion);
                    }
                    else{
                        for(let i = 0; i  < response.questions.length; i++){
                            var divQuestion = $('<div class = toggle-div1Q>');
                            divQuestion.attr('id', response.questions[i].id);
                            divQuestion.append($('<div style = "font-weight:bold">').text('Question:'));
                            divQuestion.append(response.questions[i].content);
                            divQuestion.append('<br />');
                            divQuestion.append($('<div style = "font-weight:bold">').text('Answer:'));
                            divQuestion.append(response.questions[i].answer);
                            divQuestion.append('<br />');
                            const text3 = 'By: ' + response.questions[i].username;
                            divQuestion.append(text3);
                            var button = $('<button style="background: #660033; color: white; padding:2px">').text('Hide');
                            button.click(function(){
                                const urlHide = '/hide-question/' + lecture.id + '/' + response.questions[i].id + '?token=' + token;
                                $.ajax({
                                    type: "POST",
                                    url: urlHide,
                                    success: function(){
                                        const id = '#' + response.questions[i].id;
                                        $(id).remove();
                                    },
                                    error: function (xhr, status, err) {
                                        error.textContent = xhr.responseJSON.error;
                                        console.error("Error getting lecture:", xhr.responseJSON.error);
                                    }
                                })
                            });
                            divQuestion.append('<br />');
                            divQuestion.append(button);
                            $('#realQuestions').append(divQuestion);
                        }
                    }
                },
                error: function (xhr, status, err) {
                    error.textContent = xhr.responseJSON.error;
                    console.error("Error getting lecture:", xhr.responseJSON.error);
                }
            });
        });
        button3.click(function(){
            $modal = $('#questionsModal');
            $('#questionsHeader').css('font-size', 'large').css('font-weight', 'bold').text('Hidden questions:')
            $modal.fadeIn();
            $modal.css('overflow', 'auto')
            $('body').css('overflow', 'hidden');
            const urlHiddenQuestions = '/hidden-questions/'+ lecture.id + '?token=' + token;
            $.ajax({
                type: "GET",
                url: urlHiddenQuestions,
                success: function (response) {
                    $('#realQuestions').empty();
                    if(response.questions.length === 0){
                        var divQuestion = $('<div class = toggle-div1Q>');
                        divQuestion.text('No questions');
                        $('#realQuestions').append(divQuestion);
                    }
                    else{
                        for(let i = 0; i  < response.questions.length; i++){
                            var divQuestion = $('<div class = toggle-div1Q>');
                            divQuestion.attr('id', response.questions[i].id)
                            divQuestion.append($('<div style="font-weight: bold">').text('Question:'));
                            divQuestion.append(response.questions[i].content);
                            divQuestion.append('<br />');
                            const text2 = 'By: ' + response.questions[i].username;
                            divQuestion.append(text2);
                            var button = $('<button style="background: #660033; color: white; padding:2px">').text('Unide');
                            button.click(function(){
                                const urlUnHide = '/unhide-question/' + lecture.id + '/' + response.questions[i].id + '?token=' + token;
                                $.ajax({
                                    type: "POST",
                                    url: urlUnHide,
                                    success: function(){
                                        const id = '#' + response.questions[i].id;
                                        $(id).remove();
                                    },
                                    error: function (xhr, status, err) {
                                        error.textContent = xhr.responseJSON.error;
                                        console.error("Error getting lecture:", xhr.responseJSON.error);
                                    }
                                })
                            });
                            divQuestion.append('<br />');
                            divQuestion.append(button);
                            $('#realQuestions').append(divQuestion);
                        }
                    }
                },
                error: function (xhr, status, err) {
                    error.textContent = xhr.responseJSON.error;
                    console.error("Error getting lecture:", xhr.responseJSON.error);
                }
            });
        });
        button4.click(function(){
            const urlEraseLecture = '/erase-lecture/'+ lecture.id + '?token=' + token;
            $.ajax({
                type: "POST",
                url: urlEraseLecture,
                success: function () {
                    window.location.href = window.location.href;
                },
                error: function (xhr, status, err) {
                    error.textContent = xhr.responseJSON.error;
                    console.error("Error getting lecture:", xhr.responseJSON.error);
                }
            });
        });
        $('#buttons').append(button1);
        $('#buttons').append(button2);
        $('#buttons').append(button3);
        $('#buttons').append(button4);
    }
    if(lecture.userIsAttendee){
        var button5 = $('<button>').attr('type', 'button').attr('id', 'unattend').
        addClass('btn').addClass('btn-primary').addClass('button');
        button5.css('float', 'right');
        button5.text('Unattend lecture');
        $('#buttons').append(button5);

        var buttonComment = $('<button>').attr('type', 'button').attr('id', 'comment').
        addClass('btn').addClass('btn-primary').addClass('button');
        buttonComment.css('float', 'right');
        buttonComment.text('Comment lecture');
        buttonComment.click(function(){
            $('#realQuestions').empty();
            $modal = $('#questionsModal');
            $('#questionsHeader').css('font-size', 'large').css('font-weight', 'bold').text('Comment lecture:')
            $modal.fadeIn();
            $modal.css('overflow', 'auto')
            $('body').css('overflow', 'hidden');
            var formComment = $('<form class="px-4 py-3" method="POST" id="commentForm" autocomplete="off">');
            var commentDiv = $(' <div className="form-group">');
            var commentField = $(`<textarea type="text" className="form-control" id="commentar" name="commentar" 
                                    placeholder="Comment lecture..." rows="3" style="width:100%">`)
            commentDiv.append(commentField);
            formComment.append(commentDiv);
            var buttonComment = $('<button type="submit" class="btn btn-primary" style="background-color:#660033; border-color:#C0603A;top:100px">');
            buttonComment.text('Comment');
            formComment.append(buttonComment);
            $('#realQuestions').append(formComment);
            formComment.on('submit', async (event) =>{
                event.preventDefault();
                var commentar = $('#commentar').val();
                if(commentar.length > 0){
                    var form = document.getElementById('commentForm');
                    var formData = new FormData(form);
                    console.log(Array.from(formData));
                    const urlComment = '/comment/' + lecture.id + '?token=' + token;
                    $.ajax({
                        type: "POST",
                        url: urlComment,
                        processData: false,
                        contentType: 'application/x-www-form-urlencoded',
                        data: new URLSearchParams(formData),
                        success: function (response) {
                            if($('#commentars-details .toggle-div1').text() === 'No commentars'){
                                $('#commentars-details').empty();
                            }
                            var divCom = $('<div class = "toggle-div1Q">');
                            divCom.text(response.commentar);
                            divCom.append('<br />');
                            var text = 'By: ' + response.username;
                            divCom.append(text);
                            $('#commentars-details').prepend(divCom);
                            $modal.fadeOut();
                            $('body').css('overflow', 'auto');
                            socketNotif.emit('user comments', token, lecture.id);
                        },
                        error: function (xhr, status, err) {
                            error.textContent = xhr.responseJSON.error;
                            console.error("Error submitting form:", xhr.responseJSON.error);
                        }
                    });
                }
            })

        })
        $('#buttons').append(buttonComment);

        var buttonGrade = $('<button>').attr('type', 'button').attr('id', 'grade').
        addClass('btn').addClass('btn-primary').addClass('button');
        buttonGrade.css('float', 'right');
        buttonGrade.text('Grade lecture');
        buttonGrade.click(function(){
            $('#realQuestions').empty();
            $modal = $('#questionsModal');
            $('#questionsHeader').css('font-size', 'large').css('font-weight', 'bold').text('Grade lecture:')
            $modal.fadeIn();
            $modal.css('overflow', 'auto')
            $('body').css('overflow', 'hidden');
            var formGrade = $('<form class="px-4 py-3" method="POST" id="gradeForm" autocomplete="off">');

            var gradeDiv1 = $(' <div className="form-check" style="bottom:5px; padding-bottom:10px">');
            var labelOne = $(' <label class="form-check-label">');
            var one = $('<input type="radio" className="form-check-input" id="one" name="graderadio" value="1">');
            labelOne.append(one);
            labelOne.append('One');
            gradeDiv1.append(labelOne);
            formGrade.append(gradeDiv1);

            var gradeDiv2 = $(' <div className="form-check" style="bottom:5px; padding-bottom:10px">');
            var labelTwo = $(' <label class="form-check-label">');
            var two = $('<input type="radio" className="form-check-input" id="two" name="graderadio" value="2">');
            labelTwo.append(two);
            labelTwo.append('Two');
            gradeDiv2.append(labelTwo);
            formGrade.append(gradeDiv2);

            var gradeDiv3 = $(' <div className="form-check" style="bottom:5px; padding-bottom:10px">');
            var labelThree = $(' <label class="form-check-label">');
            var three = $('<input type="radio" className="form-check-input" id="three" name="graderadio" value="3">');
            labelThree.append(three);
            labelThree.append('Three');
            gradeDiv3.append(labelThree);
            formGrade.append(gradeDiv3);

            var gradeDiv4 = $(' <div className="form-check" style="bottom:5px; padding-bottom:10px">');
            var labelFour = $(' <label class="form-check-label">');
            var four = $('<input type="radio" className="form-check-input" id="four" name="graderadio" value="4">');
            labelFour.append(four);
            labelFour.append('Four');
            gradeDiv4.append(labelFour);
            formGrade.append(gradeDiv4);

            var gradeDiv5 = $(' <div className="form-check" style="bottom:5px; padding-bottom:10px">');
            var labelFive = $(' <label class="form-check-label">');
            var five = $('<input type="radio" className="form-check-input" id="five" name="graderadio" value="5">');
            labelFive.append(five);
            labelFive.append('Five');
            gradeDiv5.append(labelFive);
            formGrade.append(gradeDiv5);

            var submitGrade = $('<button type="submit" class="btn btn-primary" style="background-color:#660033; border-color:#C0603A;top:100px">');
            submitGrade.text('Grade');
            formGrade.append(submitGrade);
            $('#realQuestions').append(formGrade);
            formGrade.on('submit', async (event) =>{
                event.preventDefault();
                var form = document.getElementById('gradeForm');
                var formData = new FormData(form);
                console.log(Array.from(formData));
                const urlGrade = '/grade/' + lecture.id + '?token=' + token;
                $.ajax({
                    type: "POST",
                    url: urlGrade,
                    processData: false,
                    contentType: 'application/x-www-form-urlencoded',
                    data: new URLSearchParams(formData),
                    success: function (response) {
                        if($('#grades-details .toggle-div1').text() === 'No grades'){
                            $('#grades-details').empty();
                        }
                        var divGr = $('<div class = "toggle-div1Q">');
                        var text = response.username + ' graded with: ' + response.grade;
                        divGr.append(text);
                        $('#grades-details').prepend(divGr);
                        $modal.fadeOut();
                        $('body').css('overflow', 'auto');
                        socketNotif.emit('user graded', token, lecture.id);
                    },
                    error: function (xhr, status, err) {
                        error.textContent = xhr.responseJSON.error;
                        console.error("Error submitting form:", xhr.responseJSON.error);
                    }
                });
            })

        })
        $('#buttons').append(buttonGrade);
    }
    else if(!lecture.userIsAttendee && !lecture.userIsLecturer){
        var button6 = $('<button>').attr('type', 'button').attr('id', 'attend').
        addClass('btn').addClass('btn-primary').addClass('button');
        button6.css('float', 'right');
        button6.text('Attend lecture');
        $('#buttons').append(button6);
    }

    //schedule:
    for(let i = 0; i < lecture.schedule.length; i++){
        var day = $('<th>').addClass('day').text(lecture.schedule[i].day);
        var timeStart = $('<td>').addClass('time').text(lecture.schedule[i].time_start);
        var timeEnd = $('<td>').addClass('time').text(lecture.schedule[i].time_end);
        var tr = $('<tr>');
        tr.append(day);
        tr.append(timeStart);
        tr.append(timeEnd);
        $('#schedule-details').append(tr);
    }

    //buttons-attend
    $('#attend').click(function(){
        const urlAttend = '/attend-lecture/' + lecture.id + '?token=' + token;
        $.ajax({
            type: "POST",
            url: urlAttend,
            success: function () {
                window.location.href = window.location.href;
            },
            error: function (xhr, status, err) {
                error.textContent = xhr.responseJSON.error;
                console.error("Error getting lecture:", xhr.responseJSON.error);
            }
        });
    })
    $('#unattend').click(function(){
        const urlUnattend = '/unattend-lecture/' + lecture.id + '?token=' + token;
        $.ajax({
            type: "POST",
            url: urlUnattend,
            success: function () {
                window.location.href = window.location.href;
            },
            error: function (xhr, status, err) {
                error.textContent = xhr.responseJSON.error;
                console.error("Error getting lecture:", xhr.responseJSON.error);
            }
        });
    })

    //files:
    if(lecture.userIsLecturer || lecture.userIsAttendee||lecture.userIsAdmin){
        var divFile = $('<div id ="filesContainer" class = row>');
        for(let i = 0; i < lecture.files.length; i++){
            var fileButton = $('<div class = "div-file" style="display: flex; flex-direction: row;">');
            var text = $('<a class = "text-container" style="margin-top:3px; text-decoration: none; color:#660033" download>')
                .text(lecture.files[i].file_name);
            var myHref = '/download-file/' + lecture.id + '/' + lecture.files[i].id + '?token=' + token;
            text.attr('href', myHref);
            fileButton.append(text);
            fileButton.attr('id', lecture.files[i].id);
            divFile.append( fileButton);
        }
        $('#files-details').append(divFile)

        //files-lecturer
        if(lecture.userIsLecturer || lecture.userIsAdmin){
            function showLoadingAnimation() {
                $('#loadingAnimation').removeClass('hidden');
            }

            function hideLoadingAnimation() {
                $('#loadingAnimation').addClass('hidden');
            }

            var x =$('<button type="button" class="xButton-file">');
            x.append($('<i class="fas fa-times">'));
            $('.div-file').append(x);
            $('.xButton-file').click(function(){
                const file_id = $(this).parent().attr('id');
                $(this).replaceWith($('<div id = "#loadingAnimationX">').append($('<div class = "spinnerX">')));
                const urlDeleteFile = '/delete-file/' + lecture.id +'/' + file_id + '?token=' + token;
                $.ajax({
                    url: urlDeleteFile,
                    type: 'POST',
                    success: function (response) {
                        hideLoadingAnimation();
                        window.location.href = window.location.href;
                    },
                    error: function (error) {
                        console.error('File delete error:', error);
                    }
                });
            })

            //add-file:
            var formFile = $('<form id = "fileForm" enctype =  "multipart/form-data" class="row" style="margin-left: 3px">');
            formFile.append($('<input type="file" name="file" id="fileInput" style="display: none;">'));
            formFile.append($('<div id="addFileButton" class = "add-file-button">').text('Add file'));
            $('#aboutLecture').append(formFile);
            var loading = $('<div id = "loadingAnimation" class = "hidden">');
            var spinner = $('<div class = "spinner">');
            loading.append(spinner);
            $(formFile).append(loading);
            $('#addFileButton').click(function(){
                $('#fileInput').click();
            })
            $('#fileInput').change(function() {
                $('#fileForm').submit();
            });
            $('#fileForm').submit(function (e) {
                e.preventDefault();
                var form = document.getElementById('fileForm')
                const formData = new FormData(form);
                showLoadingAnimation();
                const urlFile = '/upload-file/' + lecture.id + '?token=' + token;
                $.ajax({
                    url: urlFile,
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        hideLoadingAnimation();
                        window.location.href = window.location.href;
                    },
                    error: function (error) {
                        hideLoadingAnimation();
                        console.error('File upload error:', error);
                        alert('File upload failed.');
                    }
                });
            });
        }
    }
    if(lecture.userIsLecturer || lecture.userIsAttendee||lecture.userIsAdmin){
        if(isLectureInProgress(lecture.dateStart, lecture.dateEnd, lecture.schedule)){
            var button7 = $('<button>').attr('type', 'button').attr('id', 'enterLecture')
                .addClass('btn').addClass('btn-primary').addClass('button');
            const urlEnterLecture = '/lecture_meeting/' + lecture.id + '?token=' + token;
            button7.click(function(){
                window.location.href = urlEnterLecture;
            });
            button7.css('float', 'right');
            button7.text('Enter lecture');
            $('#everything').append(button7);
        }
    }
    $('#commentars-details').empty();
    if(lecture.commentars.length === 0){
        $('#commentars-details').append($('<div class = "toggle-div1">').text('No commentars'));
    }
    for(let i = 0; i < lecture.commentars.length; i++){
        var divCom = $('<div class = "toggle-div1">');
        divCom.text(lecture.commentars[i].commentar);
        divCom.append('<br />');
        var text = 'By: ' + lecture.commentars[i].username;
        divCom.append(text);
        $('#commentars-details').append(divCom);
    }
    $('#grades-details').empty();
    if(lecture.grades.length === 0){
        $('#grades-details').append($('<div class = "toggle-div1">').text('No grades'));
    }
    for(let i = 0; i < lecture.grades.length; i++){
        var divGrade = $('<div class = "toggle-div1">');
        var text = lecture.grades[i].username + ' graded with: ' + lecture.grades[i].grade;
        divGrade.append(text);
        $('#grades-details').append(divGrade);
    }
}