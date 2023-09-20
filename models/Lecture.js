const pool = require('../db.js');

const Lecture = {};

Lecture.validateName = async (name, userId) => {
    try {
        const resultLectures = await pool.query(`SELECT name FROM lecture where lecturer_id = $1 and name = $2 and 
                                                    active = true`, [userId, name]);
        const lectures = resultLectures.rows;
        if (lectures.length > 0) {
            return false;
        }
        return name.length >= 3;
    } catch(error){throw error;}
}

Lecture.validateDesc = (description) => description.length >=10;

Lecture.validateDateFormat = (date) => {const pattern = /^\d{4}-\d{2}-\d{2}$/; return pattern.test(date);}

Lecture.validateDateEnd = (dateStart, dateEnd) => dateStart <= dateEnd;

Lecture.validateTimeFormat = (time) => {const pattern = /^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$/; return pattern.test(time)}

Lecture.validateTimeEnd = (timeStart, timeEnd) => timeStart <= timeEnd;

Lecture.getCategories = async () =>{
    try{
        const resultCategories = await pool.query('select category_name from category order by id', []);
        const categoriesJson = resultCategories.rows;
        const categories = categoriesJson.map(row => row.category_name);
        return categories;
    } catch(error) {throw error;}
}

Lecture.validateCategory = async (category) =>{
    try {
        const categories = new Set(await Lecture.getCategories());
        return categories.has(category);
    } catch(error){throw error;}
}

Lecture.getDays = async () =>{
    try{
        const daysResult = await pool.query(`select day from days_in_week order by id`, []);
        const daysJson = daysResult.rows;
        const days = daysJson.map(row => row.day);
        return days;
    } catch(error) {throw error;}
}

Lecture.validateDay = async (day) =>{
    try {
        const days = new Set(await Lecture.getDays());
        return days.has(day);
    } catch(error){throw error;}
}

Lecture.getPrivacies = async () =>{
    try{
        const privaciesResult = await pool.query(`select name_privacy from privacy order by id`, []);
        const privaciesJson = privaciesResult.rows;
        const privacies = privaciesJson.map(row => row.name_privacy);
        return privacies;
    } catch(error) {throw error;}
}

Lecture.validatePrivacy = async (privacy) => {
    try {
        const privacies = new Set(await Lecture.getPrivacies());
        return privacies.has(privacy);
    } catch(error){throw error;}
}

Lecture.getIdOfCategory = async (category) => {
    try{
        const resultCategories = await pool.query('select id from category where category_name = $1', [category]);
        const categoryId = resultCategories.rows[0].id;
        return categoryId;
    } catch(error) {throw error;}
}
Lecture.getIdOfDay = async (day) =>{
    try{
        const dayResult = await pool.query(`select id from days_in_week where day = $1`, [day]);
        const day1 = dayResult.rows[0].id;
        return day1;
    } catch(error){throw error;}
}

Lecture.getIdOfPrivacy = async (privacy) =>{
    try{
        const privacyResult = await pool.query(`select id from privacy where name_privacy = $1`, [privacy]);
        const privacy1 = privacyResult.rows[0].id;
        return privacy1;
    } catch(error) {throw error;}
}

Lecture.createLecture = async (lecturer_id, name1, description, image, category, dateStart, dateEnd, schedule, privacy) =>{
    try {
        if (!(await Lecture.validateName(name1, lecturer_id))) {
            throw new Error('Name must be long at least 3 characters, and you must not have lecture with the same name!');
        }
        if (!Lecture.validateDesc(description)) {
            throw new Error('Description must be at least 10 characters long!');
        }
        if (!(await Lecture.validateCategory(category))) {
            throw new Error('Invalid category!');
        }
        if (!Lecture.validateDateFormat(dateStart)) {
            throw new Error('Invalid format of starting date!');
        }
        if (!Lecture.validateDateFormat(dateEnd)) {
            throw new Error('Invalid format of ending date!');
        }
        if (!Lecture.validateDateEnd(dateStart, dateEnd)) {
            throw new Error('Invalid ending date!');
        }
        for(let i = 0; i < schedule.length; i++){
            if (!Lecture.validateTimeFormat(schedule[i].time_start)) {
                throw new Error('Invalid format of starting time!');
            }
            if (!Lecture.validateTimeFormat(schedule[i].time_end)) {
                throw new Error('Invalid format of ending time!');
            }
            if (!Lecture.validateTimeEnd(schedule[i].time_start, schedule[i].time_end)) {
                throw new Error('Invalid ending time!');
            }
            if (!Lecture.validateDay(schedule[i].day)) {
                throw new Error('Invalid day!');
            }

        }
        if (!(await Lecture.validatePrivacy(privacy))) {
            throw new Error('Invalid privacy!');
        }
        const category1 = await Lecture.getIdOfCategory(category);
        const schedule1 = [];
        for(let i = 0; i < schedule.length; i++){
            schedule1.push({day_id: await Lecture.getIdOfDay(schedule[i].day), time_start:schedule[i].time_start,
                time_end: schedule[i].time_end});
        }
        const privacy1 = await Lecture.getIdOfPrivacy(privacy);
        await pool.query(`call set_lecture($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [lecturer_id, name1, description, image, category1, dateStart, dateEnd, schedule1, privacy1])
        const lectureResult = await pool.query(`SELECT * FROM lecture where lecturer_id = $1 and name = $2`, [lecturer_id, name1]);
        const lecture = lectureResult.rows[0];
        return lecture;
    } catch(error){console.log(error); throw error;}

}

Lecture.getLectureDetailsRegistered = async (user_id, lecture_id) =>{
    try{
        const isOrganizerResult = await pool.query(`select lecturer_id from lecture where id = $1`, [lecture_id]);
        const isOrganizer = isOrganizerResult.rows[0].lecturer_id === user_id;
        if(!isOrganizer){
            const privacy_lectureResults = await pool.query(`select name_privacy from lecture l inner join privacy p on l.privacy = p.id
                                              where l.id = $1`, [lecture_id]);
            const privacy = privacy_lectureResults.rows[0].name_privacy;
            if(privacy === 'Private'){
                const isAttendingResults = await pool.query(`select a.id from lecture l inner join attendee a on l.id = a.lecture_id
                                              where a.user_id = $1`, [user_id]);
                const isAttending = isAttendingResults.rows.length > 0;
                if(!isAttending){
                    throw new Error('Unathorized!');
                }
            }
        }
        const lectureResult = await pool.query(`select l.id, u.username, l.name, description, c.category_name, date_start, date_end,
                                                image from lecture l inner join "user" u on l.lecturer_id = u.id inner join 
                                                category c on l.category = c.id where l.id = $1`, [lecture_id]);
        const lecture = lectureResult.rows[0];
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const dateStartUnf = new Date(lecture.date_start);
        const dateStart = dateStartUnf.toLocaleDateString('en-US', options);
        const dateEndUnf = new Date(lecture.date_end);
        const dateEnd = dateEndUnf.toLocaleDateString('en-US', options);
        const scheduleResult = await pool.query(`select d.day, time_start, time_end from schedule s inner join days_in_week d on
                                                 s.day = d.id where lecture_id = $1`, [lecture_id]);
        const schedule = scheduleResult.rows;
        const fileResult = await pool.query(`select id, file_name from file_lecture where lecture_id = $1`, [lecture_id]);
        const files = fileResult.rows;
        const commentarsResult = await pool.query(`select c.commentar, u.username from "commentar_lecture" c inner join "attendee" a 
                                                   on a.id = c.attendee_id inner join "user" u on a.user_id = u.id where a.lecture_id = $1
                                                   and a.active = true and c.active = true`, [lecture_id]);
        const commentars = commentarsResult.rows;
        const gradesResult = await pool.query(`select g.grade, u.username from "grade_lecture" gr inner join "attendee" a 
                                               on a.id = gr.attendee_id inner join "user" u on a.user_id = u.id
                                               inner join "grades_lecture" g on gr.grade_id = g.id 
                                               where a.lecture_id = $1 and a.active = true and gr.active = true`, [lecture_id]);
        const grades = gradesResult.rows;
        const result={id: lecture.id, username: lecture.username, name: lecture.name, description: lecture.description,
                      category: lecture.category_name, dateStart: dateStart, dateEnd: dateEnd,
                      image: lecture.image, schedule: schedule, files:files, commentars: commentars, grades:grades};
        return result;
    } catch(error){throw error;}

}

Lecture.isUserAttendee = async (user_id, lecture_id) =>{
    try{
        const attendeeResult = await pool.query(`select id from attendee where user_id = $1 and lecture_id = $2 and active = true`,
            [user_id, lecture_id]);
        const attendee = attendeeResult.rows.length > 0;
        return attendee;
    }catch(error){throw error;}
}

Lecture.isUserLecturer = async (user_id, lecture_id) =>{
    try{
        const lecturerResult = await pool.query(`select lecturer_id from lecture where id = $1 and lecturer_id = $2 and active = true`,
            [lecture_id, user_id]);
        const lecturer = lecturerResult.rows.length > 0;
        return lecturer;
    }catch(error){throw error;}
}
Lecture.search = async (nameLecture, user_id) =>{
    try{
        const searchResult = await pool.query(`SELECT distinct l.id, l.name, c.category_name FROM lecture l inner join "category" c on 
                                                l.category = c.id inner join "privacy" p on l.privacy = p.id 
                                                left join "attendee" a on a.lecture_id = l.id
                                                WHERE (l.name like $1 || '%' or c.category_name like $1 || '%') and l.active=true and (p.name_privacy = 'Everyone' or 
                                                (p.name_privacy = 'Private' and
                                                ((a.user_id = $2 and a.active=true) or (l.lecturer_id = $2))))`,
                                                [nameLecture, user_id]);
        return searchResult.rows;
    }catch(error){throw error;}
}

Lecture.searchAllStartDate = async (nameLecture, user_id, pagination) =>{
    try{
        const resultLectures = await pool.query(`select distinct l.id, u.username, l.name, description, c.category_name, date_start, date_end,
                                                image from lecture l inner join "user" u on l.lecturer_id = u.id inner join 
                                                "category" c on l.category = c.id inner join "privacy" p on 
                                                l.privacy = p.id left join "attendee" a on
                                                a.lecture_id = l.id
                                                where (l.name like $1 || '%' or c.category_name like $1 || '%')
                                                and l.active=true and (p.name_privacy = 'Everyone' or (p.name_privacy = 'Private' and
                                                ((a.user_id = $2 and a.active=true) or (l.lecturer_id = $2)))) 
                                                order by date_start desc limit 12 offset 12*$3`, [nameLecture,user_id,pagination]);
        const countLectures = await pool.query(`select count( distinct l.id) from lecture l inner join "user" u on l.lecturer_id = u.id inner join 
                                                "category" c on l.category = c.id inner join "privacy" p on 
                                                l.privacy = p.id left join "attendee" a on
                                                a.lecture_id = l.id
                                                where (l.name like $1 || '%' or c.category_name like $1 || '%') 
                                                and l.active=true and (p.name_privacy = 'Everyone' or (p.name_privacy = 'Private' and
                                                ((a.user_id = $2 and a.active=true) or (l.lecturer_id = $2))))`,
                                                [nameLecture,user_id]);
        let result = resultLectures.rows;
        result.push(countLectures.rows[0].count);
        return result;
    }catch(error){throw error;}
}

Lecture.searchAllNumberOfSessions = async (nameLecture, user_id, pagination) =>{
    try{
        const resultLectures = await pool.query(`select distinct * from(select l.id, u.username, l.name, description, 
                                                c.category_name, date_start, date_end, image 
                                                from lecture l inner join "user" u on l.lecturer_id = u.id inner join 
                                                category c on l.category = c.id inner join privacy p on 
                                                l.privacy = p.id left join attendee a on
                                                a.lecture_id = l.id
                                                where (l.name like $1 || '%' or c.category_name like $1 || '%') 
                                                and l.active=true and (p.name_privacy = 'Everyone' or (p.name_privacy = 'Private' and
                                                ((a.user_id = $2 and a.active=true) or (l.lecturer_id = $2)))) 
                                                order by number_of_repetition(date_start, date_end, days(l.id)) 
                                                desc limit 12 offset 12*$3) as ja;`, [nameLecture,user_id,pagination]);
        const countLectures = await pool.query(`select count(distinct l.id) from lecture l inner join "user" u on l.lecturer_id = u.id inner join 
                                                "category" c on l.category = c.id inner join "privacy" p on 
                                                l.privacy = p.id left join "attendee" a on
                                                a.lecture_id = l.id
                                                where (l.name like $1 || '%' or c.category_name like $1 || '%') 
                                                and l.active=true and (p.name_privacy = 'Everyone' or (p.name_privacy = 'Private' and
                                                ((a.user_id = $2 and a.active=true) or (l.lecturer_id = $2))))`,
                                                [nameLecture,user_id]);
        let result = resultLectures.rows;
        result.push(countLectures.rows[0].count);
        return result;
    }catch(error){throw error;}
}

Lecture.addAttendee = async (user_id, lecture_id) =>{
    try{
        return await pool.query('call set_attendees($1, $2)', [user_id, lecture_id]);
    } catch(error){throw error;}
}

Lecture.removeAttendee = async (user_id, lecture_id) =>{
    try{
        const result = await pool.query('call delete_lecture_attendee($1, $2)', [user_id, lecture_id]);
        return result;
    } catch(error){throw error;}
}

Lecture.uploadFile = async (lecture_id, name, file) =>{
    try{
        const result = await pool.query('call set_file_lecture($1, $2, $3)', [lecture_id, name, file]);
        return result;
    } catch(error){throw error;}
}

Lecture.deleteFile = async (file_id) =>{
    try{
        const result = await pool.query('call delete_file_lecture($1)', [file_id]);
        return result;
    } catch(error){throw error;}
}

Lecture.getFile = async (file_id) =>{
    try{
        const result = await pool.query('select file, file_name from file_lecture where id = $1', [file_id]);
        return result.rows[0];
    } catch(error){throw error;}
}


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

Lecture.isLectureInSession = async (lecture_id) =>{
    try{
        const datesResult = await pool.query('select date_start, date_end from lecture where id = $1', [lecture_id]);
        const dates = datesResult.rows[0];
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const dateStartUnf = new Date(dates.date_start);
        const dateStart = dateStartUnf.toLocaleDateString('en-US', options);
        const dateEndUnf = new Date(dates.date_end);
        const dateEnd = dateEndUnf.toLocaleDateString('en-US', options);
        const scheduleResult = await pool.query(`select d.day, time_start, time_end from schedule s inner join days_in_week d on
                                                 s.day = d.id where lecture_id = $1`, [lecture_id]);
        const schedule = scheduleResult.rows;
        return isLectureInProgress(dateStart, dateEnd, schedule);
    } catch(error){throw error;}
}

Lecture.getQuestionAnswer = async (lecture_id, user_id) =>{
    try{
        const messagesResult = await pool.query(`SELECT
                                                    q.id,
                                                    q.content,
                                                    q.time,
                                                    q.answer,
                                                    u.username,
                                                    COUNT(lq.user_id) AS likes_count,
                                                    CASE
                                                        WHEN bool_or(lq.user_id = $2) THEN true
                                                        ELSE false
                                                    END AS user_has_liked
                                                FROM
                                                    "question_answer_meeting" q
                                                INNER JOIN
                                                    "attendee" a ON q.attendee_id = a.id
                                                INNER JOIN
                                                    "user" u ON a.user_id = u.id
                                                LEFT JOIN
                                                    "likes_question" lq ON q.id = lq.question_id
                                                WHERE
                                                    a.lecture_id = $1
                                                    AND q.hidden = false
                                                GROUP BY
                                                    q.id,
                                                    q.content,
                                                    q.time,
                                                    q.answer,
                                                    u.username
                                                ORDER BY
                                                    likes_count DESC,
                                                    q.time DESC;`,
                                                [lecture_id, user_id]);
        const messages = messagesResult.rows;
        return messages;
    }catch(error){throw error;}
}
Lecture.recieveQuestion = async (lecture_id, user_id, content) =>{
    try{
        const attendeeIdResult = await pool.query('select id from attendee where lecture_id = $1 and user_id = $2 and active = true',
            [lecture_id, user_id]);
        const attendeeId = attendeeIdResult.rows[0].id;
        const forbiddenWordsResult = await pool.query(`select word from forbidden_word`);
        const forbiddenWords = forbiddenWordsResult.rows;
        const arrayContent = content.split(' ');
        var forbidden = false;
        for(let i = 0; i < arrayContent.length; i++){
            for(let j = 0; j < forbiddenWords.length; j++){
                if(arrayContent[i] === forbiddenWords[j].word){
                    forbidden = true;
                }
            }
        }
        await pool.query(`insert into question_answer_meeting (attendee_id, content, time, hidden, proposal)
                                                values ($1, $2, current_time, false, $3) returning id`, [attendeeId, content, forbidden]);
        return await Lecture.getQuestionAnswer(lecture_id, user_id);
    }catch(error){throw error;}
}

Lecture.answerQuestion = async (question_id, answer) =>{
    try{
        await pool.query(`update question_answer_meeting set answer = $1 where id = $2`, [answer, question_id]);
        return;
    }catch(error){throw error}
}

Lecture.hideQuestion = async (question_id) =>{
    try{
        await pool.query(`update question_answer_meeting set hidden = true where id = $1`, [question_id]);
        return;
    }catch(error){throw error}
}

Lecture.eraseLecture = async (lecture_id) =>{
    try{
        await pool.query(`update lecture set active = false where id = $1`, [lecture_id]);
    }catch(error){throw error;}
}
Lecture.getAttendees = async (lecture_id) =>{
    try{
        const attendeesResult = await pool.query(`select u.id, u.username from "attendee" a inner join "user" u on a.user_id = u.id 
                                        where a.lecture_id = $1 and a.active = true`, [lecture_id]);
        const attendees = attendeesResult.rows;
        console.log(attendees);
        return attendees;
    }catch(error){throw error;}
}

Lecture.getAnsweredQuestions = async (lecture_id) =>{
    try{
        const answeredQuestionsResult = await pool.query(`select q.id, q.content, q.answer, u.username from 
                                                "question_answer_meeting" q
                                                 inner join "attendee" a on q.attendee_id = a.id inner join "user" u on 
                                                 a.user_id = u.id where a.lecture_id = $1 and hidden = false and answer is not null
                                                 order by q.time desc`,
                                                 [lecture_id]);
        const answeredQuestions = answeredQuestionsResult.rows;
        return answeredQuestions;
    }catch(error){throw error;}
}

Lecture.getUnansweredQuestions = async (lecture_id) =>{
    try{
        const answeredQuestionsResult = await pool.query(`select q.id, q.content, q.answer, u.username from 
                                                "question_answer_meeting" q
                                                 inner join "attendee" a on q.attendee_id = a.id inner join "user" u on 
                                                 a.user_id = u.id where a.lecture_id = $1 and hidden = false and answer is null
                                                 order by q.time desc`,
            [lecture_id]);
        const answeredQuestions = answeredQuestionsResult.rows;
        return answeredQuestions;
    }catch(error){throw error;}
}

Lecture.getHiddenQuestions = async (lecture_id) =>{
    try{
        const answeredQuestionsResult = await pool.query(`select q.id, q.content, q.answer, u.username from 
                                                "question_answer_meeting" q
                                                 inner join "attendee" a on q.attendee_id = a.id inner join "user" u on 
                                                 a.user_id = u.id where a.lecture_id = $1 and hidden = true
                                                 order by q.time desc`,
                                                [lecture_id]);
        const answeredQuestions = answeredQuestionsResult.rows;
        return answeredQuestions;
    }catch(error){throw error;}
}

Lecture.unhideQuestion = async (question_id) => {
    try{
        await pool.query('update question_answer_meeting set hidden = false where id = $1', [question_id]);
        const questionResult = await  pool.query(`select q.id, q.content, u.username from 
                                                "question_answer_meeting" q
                                                 inner join "attendee" a on q.attendee_id = a.id inner join "user" u on 
                                                 a.user_id = u.id where q.id = $1`,
                                                [question_id]);
        const question = questionResult.rows[0];
        return question;
    }catch(error){throw error;}
}

Lecture.comment = async (user_id, lecture_id, comment) =>{
    try{
        const attendeeIdResult = await pool.query(`select id from attendee where user_id = $1 and lecture_id = $2 and active = true`,
                                             [user_id, lecture_id]);
        const attendeeId = attendeeIdResult.rows[0].id;
        await pool.query('insert into commentar_lecture (attendee_id, commentar) values ($1, $2)', [attendeeId, comment]);
        return;
    }catch(error){throw error;}
}

Lecture.grade = async (user_id, lecture_id, grade) =>{
    try{
        const attendeeIdResult = await pool.query(`select id from attendee where user_id = $1 and lecture_id = $2 and active = true`,
            [user_id, lecture_id]);
        const attendeeId = attendeeIdResult.rows[0].id;
        await pool.query('insert into grade_lecture (attendee_id, grade_id) values ($1, $2)', [attendeeId, grade]);
        return;
    }catch(error){throw error;}
}

Lecture.getLecturerIdName = async (lecture_id) =>{
    try{
        const idResult = await pool.query('select lecturer_id, name from lecture where id = $1 and active = true', [lecture_id]);
        return idResult.rows[0];
    }catch(error){throw error;}
}

Lecture.likeQuestion = async(question_id, user_id, lecture_id) =>{
    try{
        await pool.query('insert into likes_question (question_id, user_id) values ($1, $2)', [question_id, user_id]);
        return await Lecture.getQuestionAnswer(lecture_id, user_id);
    }catch (error){throw error;}
}

Lecture.dislikeQuestion = async(question_id, user_id, lecture_id) =>{
    try{
        await pool.query('delete from likes_question where question_id = $1 and user_id = $2', [question_id, user_id]);
        return await Lecture.getQuestionAnswer(lecture_id, user_id);
    }catch (error){throw error;}
}

module.exports = Lecture;