$(document).ready(function () {
    const $modal = $('#myModal');
    const $closeModalButton = $('#closeModalButton');
    const $openModalButton = $('#openModalButton');

    // Function to open the modal
    function openModal() {
        $modal.fadeIn();
        $modal.css('overflow', 'auto')
        $('body').css('overflow', 'hidden');
    }

    function closeModal() {
        $modal.fadeOut();
        $('body').css('overflow', 'auto');
    }
    $openModalButton.on('click', openModal);
    $closeModalButton.on('click', closeModal);



    $("#dateStart").datepicker({
        minDate: 0,
        firstDay: 1,
        dateFormat: "yy-mm-dd",
        onSelect: function (selectedDate) {
            var minEndDate = new Date(selectedDate);
            minEndDate.setDate(minEndDate.getDate() + 6);
            $("#dateEnd").datepicker("option", "minDate", minEndDate);
        }
    });
    $("#dateEnd").datepicker({
        firstDay: 1,
        dateFormat: "yy-mm-dd",
    });
    $("#timeStart").timepicker({
        timeFormat: "H:i:s",
        step: 15,
        dropdown: true,
    });



    $("#days").on("change", async function () {
        $('#wrapper').remove();
        let divWrapper = $("<div>").attr('id', 'wrapper');
        const selectedDays = $('#days').val();
        for(let i = 0; i < selectedDays.length; i++){
            var id = "time" + selectedDays[i];
            var start = "timeStart" + selectedDays[i];
            var end = "timeEnd" + selectedDays[i];
            var divElement = $("<div>");
            divElement.attr('id', id);
            divElement.css("display", "flex");
            divElement.css("flex-direction", "row");
            divElement.css("padding", "3px");
            var divInputs = $('<div>').css('width', '100%');
            var divt = $('<div>').text('-');
            divt.css('float', 'right');
            divt.css('margin-top', '2px');
            divt.css('padding', '3px');
            var input1 = $("<input/>").attr('type', 'text').attr('id', start).attr('name', start);
            input1.css('width', '80px');
            input1.css('text-align', 'center');
            input1.css('border-radius', '3px');
            input1.css('height', '25px');
            input1.css('margin-top', '5px');
            input1.css('float', 'right');
            var input2 = $("<input/>").attr('type', 'text').attr('id', end).attr('name', end);
            input2.css('width', '80px');
            input2.css('text-align', 'center');
            input2.css('border-radius', '3px');
            input2.css('height', '25px');
            input2.css('margin-top', '5px');
            input2.css('float', 'right');
            input2.css('margin-right', '70px');
            divInputs.append(input2);
            divInputs.append(divt);
            divInputs.append(input1);
            var day = $('<div>').text(selectedDays[i]);
            day.css('padding', '5px');
            day.css('border-radius', '5px');
            day.css('color', 'white');
            day.css('background-color', '##660033');
            day.css('text-align', 'center');
            day.css('width', '130px');
            divElement.append(day);
            divElement.append(divInputs);
            divWrapper.append(divElement);
            $("label[for='time']").append(divWrapper);
            input1.timepicker({
                timeFormat: "H:i:s",
                step: 15,
                dropdown: true,
            });
            input2.timepicker({
                timeFormat: "H:i:s",
                step: 15,
                dropdown: true,
            });
        }
        for(let i = 0; i < selectedDays.length; i++){
            (function(){
                var start1 = "#timeStart" + selectedDays[i];
                var end1 = "#timeEnd" + selectedDays[i];
                $(end1).on("change", function() {
                    var startTime = $(start1).timepicker("getTime");
                    var endTimeLimit = startTime;
                    endTimeLimit.setMinutes(startTime.getMinutes()+45);
                    var endTime = $(end1).timepicker("getTime");
                    if (endTime < endTimeLimit) {
                        $(end1).timepicker("setTime", endTimeLimit);
                    }
                });
            }());
        }
    });


    $('#lectureForm').on('submit', async (event) => {
        event.preventDefault();
        const name = document.getElementById('name').value;
        const description = document.getElementById('description').value;
        const dateStart = document.getElementById('dateStart').value;
        const dateEnd = document.getElementById('dateEnd').value;
        const days = $('#days').val();
        const error = document.getElementById('error');
        if(name.length < 3){
            error.textContent = 'Invalid length of name!';
            return;
        }
        if(description.length < 10){
            error.textContent = 'Invalid length of description!';
            return;
        }

        const validateDateFormat = (date) => {const pattern = /^\d{4}-\d{2}-\d{2}$/; return pattern.test(date);}
        const validateDateEnd = (dateStart, dateEnd) => dateStart <= dateEnd;

        const validateTimeFormat = (time) => {const pattern = /^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$/;
            return pattern.test(time)}

        const validateTimeEnd = (timeStart, timeEnd) => timeStart <= timeEnd;

        if(!validateDateFormat(dateStart)){
            error.textContent = 'Invalid date start format';
            return;
        }
        if(!validateDateFormat(dateEnd)){
            error.textContent = 'Invalid date end format';
            return;
        }
        if(!validateDateEnd(dateStart,dateEnd)){
            error.textContent = 'Invalid date end';
            return;
        }
        if(days.length === 0){
            error.textContent = 'You must choose days';
            return;
        }
        for(let i = 0; i < days.length; i++) {
            var start1 = "#timeStart" + days[i];
            var end1 = "#timeEnd" + days[i];
            var startTime = $(start1).val();
            var endTime = $(end1).val();
            if (!validateTimeFormat(startTime)) {
                error.textContent = 'Invalid time format';
                return;
            }
            if (!validateTimeFormat(endTime)) {
                error.textContent = 'Invalid time format';
                return;
            }
            if (!validateTimeEnd(startTime, endTime)) {
                error.textContent = 'Invalid time of end';
                return;
            }
        }
        var selectedFile = $("#image")[0].files[0];

        if (selectedFile) {
            var fileType = selectedFile.type;
            if (!fileType.startsWith("image/")) {
                error.textContent = 'Invalid image type';
                return;
            }
        }
        var form = document.getElementById('lectureForm')
        const formData = new FormData(form);
        const token = localStorage.getItem('token');
        const url = '/submit/new-lecture?token='+token;
        $.ajax({
            type: "POST",
            url: url,
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                window.location.href=window.location.href;
            },
            error: function (xhr, status, err) {
                error.textContent = xhr.responseJSON.error;
                console.error("Error submitting form:", xhr.responseJSON.error);
            }
        });
    });


});



