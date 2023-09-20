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