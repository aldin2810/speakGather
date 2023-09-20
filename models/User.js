const pool = require('../db.js');
const bcrypt = require('bcrypt');

const User = {};

User.validateFirstName = (firstName) => firstName.length >= 3;

User.validateLastName = (lastName) => lastName.length >= 3;

User.validateUsernameLength = (username) => username.length >= 8 ;

User.validateUsernameUnique = async (username) => {
    try {
        const uniqueUsername = await pool.query('select check_username_exists($1)', [username]);
        return !uniqueUsername.rows[0].check_username_exists;
        }catch(error){
        throw error;
    }
}

User.validateEmailFormat = (email) => email.includes('@');

User.validateEmailUnique = async (email) => {
    try {
        const uniqueEmail = await pool.query('select check_email_exists($1)', [email]);
        return !uniqueEmail.rows[0].check_email_exists;
    }catch(error){
        console.error('Unexpected error:', error);
        throw error;
    }
}

User.validatePassword = (password) => password.length >=8;

User.validatePasswordConfirmation = (password1, password2) => password1 === password2;

User.validateLecturerAttendee = (lecturer, attendee) => lecturer||attendee;

User.validate = async (firstName, lastName, username, email, password, passwordConfirmation, lecturer, attendee) =>{
    if(!User.validateFirstName(firstName))
        throw new Error('First name too short!')
    if(!User.validateLastName(lastName))
        throw new Error('Lastname name too short!')
    if(!User.validateUsernameLength(username))
        throw new Error('Username name too short!')
    if(!(await User.validateUsernameUnique(username)))
        throw new Error('Username already exists!')
    if(!User.validateEmailFormat(email))
        throw new Error('Email not in good format!')
    if(!(await User.validateEmailUnique(email)))
        throw new Error('Email already exists!')
    if(!User.validatePassword(password))
        throw new Error('Password too short!')
    if(!User.validatePasswordConfirmation(password, passwordConfirmation))
        throw new Error('Passwords do not match!')
    if(!User.validateLecturerAttendee(lecturer, attendee))
        throw new Error('You must choose one of provided options!')
    return true;
}

User.createUser = async (firstName, lastName, username, email, password, passwordConfirmation, lecturer, attendee)=>{
    try{
        await User.validate(firstName, lastName, username, email, password, passwordConfirmation, lecturer, attendee)
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('call set_user($1, $2, $3, $4, $5, $6, $7)', [firstName, lastName, username, email,
            hashedPassword, lecturer, attendee]);
        const User1 = await pool.query(`select id, first_name, last_name, username, email, password, lecturer, 
        attendee from "user" where username = $1`, [username]);
        return User1.rows[0];
    }
    catch(error){
        throw error;
    }
}
User.confirmRegistration = async (user_id) =>{
    try{
        await pool.query(`call update_user_active($1);`, [user_id]);
    }catch(error){throw new Error('Could not activate your account :(')}
}
User.authenticateUser = async (username, password) => {
    try{
        const resultUser = await pool.query(`select id, first_name, last_name, username, email, password, lecturer, 
        attendee, admin from "user" where username = $1 and active = true;`, [username]);
        const userArray = resultUser.rows;
        if (userArray.length === 0){
            throw new Error('User with that username does not exist!');
        }
        const user = userArray[0];
        const returnUser = {id: user.id, firstName: user.first_name, lastName: user.last_name, username: user.username,
            email: user.email, attendee: user.attendee, lecturer: user.lecturer, admin: user.admin}
        const password1 = resultUser.rows[0].password;
        const match = await bcrypt.compare(password, password1);
        if(!match){
            throw new Error('Wrong password!');
        }
        return returnUser;
    } catch(error){throw error;}
}

User.getOrganizingLectures = async (user_id)=>{
    try{
        const resultLectures = await pool.query(`SELECT l.id, name, category_name FROM lecture l inner join category c on l.category = c.id
                                             WHERE lecturer_id = $1 and active=true AND date_start <= current_date and 
                                             current_date <= date_end`, [user_id]);

        return resultLectures.rows;
    }catch(error){throw error;}
}

User.getOrganizedLectures = async (user_id)=>{
    try{
        const resultLectures = await pool.query(`SELECT l.id, name, category_name FROM lecture l inner join category c on l.category = c.id
                                             WHERE lecturer_id = $1 and active=true AND current_date > date_end`, [user_id]);
        return resultLectures.rows;
    }catch(error){throw error;}
}

User.getOrganizeFutureLectures = async (user_id)=>{
    try{
        const resultLectures = await pool.query(`SELECT l.id, name, category_name FROM "lecture" l inner join "category" c on l.category = c.id
                                             WHERE l.lecturer_id = $1 AND l.active = true and current_date < l.date_start`, [user_id]);
        return resultLectures.rows;
    }catch(error){throw error;}
}

User.getAttendingLectures = async (user_id)=>{
    try{
        const resultLectures = await pool.query(`SELECT l.id, name, category_name FROM attendee a inner join lecture l on a.lecture_id = 
                                             l.id inner join category c on l.category = c.id where
                                             a.user_id = $1 and a.active = true and l.active = true and
                                             current_date >= date_start and current_date <= date_end`, [user_id]);
        return resultLectures.rows;
    } catch(error){throw error;}
}

User.getAttendedLectures = async (user_id)=>{
    try{
        const resultLectures = await pool.query(`SELECT l.id, name, category_name FROM attendee a inner join lecture l on a.lecture_id = 
                                             l.id inner join category c on l.category = c.id where
                                             a.user_id = $1 and a.active = true and l.active = true and
                                             current_date > date_end`, [user_id]);
        return resultLectures.rows;
    }catch(error){throw error;}
}

User.getAttendFutureLectures = async (user_id)=>{
    try{
        const resultLectures = await pool.query(`SELECT l.id, name, category_name FROM attendee a inner join lecture l on a.lecture_id = 
                                             l.id inner join category c on l.category = c.id where
                                             a.user_id = $1 and a.active = true and l.active = true and
                                             current_date < date_start`, [user_id]);
        return resultLectures.rows;
    }catch(error){throw error;}
}

User.getAllOrganizingLecturesStartDate = async (user_id, pagination) =>{
    try{
        const resultLectures = await pool.query(`select l.id, u.username, l.name, description, c.category_name, date_start, date_end,
                                                image from lecture l inner join "user" u on l.lecturer_id = u.id inner join 
                                                category c on l.category = c.id where l.lecturer_id = $1 
                                                and l.date_start <= current_date and date_end >= current_date and l.active=true
                                                order by date_start desc limit 12 offset 12*$2`, [user_id, pagination]);

        const resultCount = await pool.query(`select count(*) from lecture l where l.date_start <= current_date and 
                                                l.date_end >= current_date and l.active=true and l.lecturer_id = $1`,
                                                [user_id]);
        const count = resultCount.rows[0].count;
        let result = resultLectures.rows;
        result.push(count);
        return result;
    }catch(error){throw error;}
}

User.getAllOrganizingLecturesNumberOfSessions = async (user_id, pagination) =>{
    try{
        const resultLectures = await pool.query(`select l.id, u.username, l.name, description, c.category_name, date_start, date_end,
                                                image from lecture l inner join "user" u on l.lecturer_id = u.id inner join 
                                                category c on l.category = c.id where l.lecturer_id = $1 
                                                and l.date_start <= current_date and date_end >= current_date and l.active=true
                                                order by number_of_repetition(date_start, date_end, days(l.id)) 
                                                desc limit 12 offset 12*$2`, [user_id, pagination])
        const resultCount = await pool.query(`select count(*) from lecture l where l.date_start <= current_date and 
                                                l.date_end >= current_date and l.active=true and l.lecturer_id = $1`,
            [user_id]);
        const count = resultCount.rows[0].count;
        let result = resultLectures.rows;
        result.push(count);
        return result;
    }catch(error){throw error;}
}

User.getAllOrganizedLecturesStartDate = async (user_id, pagination) =>{
    try{
        const resultLectures = await pool.query(`select l.id, u.username, l.name, description, c.category_name, date_start, date_end,
                                                image from lecture l inner join "user" u on l.lecturer_id = u.id inner join 
                                                category c on l.category = c.id where l.lecturer_id = $1 and
                                                date_end < current_date and l.active = true
                                                order by date_start desc limit 12 offset 12*$2`, [user_id, pagination])
        const resultCount = await pool.query(`select count(*) from lecture l where
                                                date_end < current_date and l.active=true and l.lecturer_id = $1`,
                                                [user_id]);
        const count = resultCount.rows[0].count;
        let result = resultLectures.rows;
        result.push(count);
        return result;
    }catch(error){throw error;}
}

User.getAllOrganizedLecturesNumberOfSessions = async (user_id, pagination) =>{
    try{
        const resultLectures = await pool.query(`select l.id, u.username, l.name, description, c.category_name, date_start, date_end,
                                                image from lecture l inner join "user" u on l.lecturer_id = u.id inner join 
                                                category c on l.category = c.id where l.lecturer_id = $1 and
                                                date_end < current_date and l.active = true
                                                order by number_of_repetition(date_start, date_end, days(l.id)) 
                                                desc limit 12 offset 12*$2`, [user_id, pagination])
        const resultCount = await pool.query(`select count(*) from lecture l where  date_end < current_date
                                                and l.active=true and l.lecturer_id = $1`,
                                                [user_id]);
        const count = resultCount.rows[0].count;
        let result = resultLectures.rows;
        result.push(count);
        return result;
    }catch(error){throw error;}
}

User.getAllOrganizeFutureLecturesStartDate = async (user_id, pagination) =>{
    try{
        const resultLectures = await pool.query(`select l.id, u.username, l.name, description, c.category_name, date_start, date_end,
                                                image from lecture l inner join "user" u on l.lecturer_id = u.id inner join 
                                                category c on l.category = c.id where l.lecturer_id = $1 and
                                                date_start > current_date and l.active=true
                                                order by date_start desc limit 12 offset 12*$2`, [user_id, pagination])
        const resultCount = await pool.query(`select count(*) from lecture l where date_start > current_date
                                              and l.active=true and l.lecturer_id = $1`,
                                              [user_id]);
        const count = resultCount.rows[0].count;
        let result = resultLectures.rows;
        result.push(count);
        return result;
    }catch(error){throw error;}
}

User.getAllOrganizeFutureLecturesNumberOfSessions = async (user_id, pagination) =>{
    try{
        const resultLectures = await pool.query(`select l.id, u.username, l.name, description, c.category_name, date_start, date_end,
                                                image from lecture l inner join "user" u on l.lecturer_id = u.id inner join 
                                                category c on l.category = c.id where l.lecturer_id = $1 and
                                                date_start > current_date and l.active=true
                                                order by date_start desc limit 12 offset 12*$2
                                                order by number_of_repetition(date_start, date_end, days(l.id)) 
                                                desc limit 12 offset 12*$2`, [user_id, pagination])
        const resultCount = await pool.query(`select count(*) from lecture l where date_start > current_date
                                              and l.active=true and l.lecturer_id = $1`,
                                              [user_id]);
        const count = resultCount.rows[0].count;
        let result = resultLectures.rows;
        result.push(count);
        return result;
    }catch(error){throw error;}
}

User.getAllAttendingLecturesStartDate = async (user_id, pagination)=>{
    try{
        const resultLectures = await pool.query(`select l.id, u.username, l.name, description, c.category_name, date_start, date_end,
                                             image FROM attendee a inner join lecture l on a.lecture_id = 
                                             l.id inner join category c on l.category = c.id inner join "user" u on 
                                             l.lecturer_id = u.id where
                                             a.user_id = $1 and a.active = true and l.active = true and
                                             current_date >= date_start and current_date <= date_end
                                             order by date_start desc limit 12 offset 12*$2`, [user_id, pagination])
        const resultCount = await pool.query(`select count(*) FROM attendee a inner join lecture l on a.lecture_id = 
                                             l.id where
                                             a.user_id = $1 and a.active = true and l.active = true and
                                             current_date >= date_start and current_date <= date_end`, [user_id])
        const count = resultCount.rows[0].count;
        let result = resultLectures.rows;
        result.push(count);
        return result;
    } catch(error){throw error;}
}

User.getAllAttendingLecturesNumberOfSessions = async (user_id, pagination)=>{
    try{
        const resultLectures = await pool.query(`select l.id, u.username, l.name, description, c.category_name, date_start, date_end,
                                             image FROM attendee a inner join lecture l on a.lecture_id = 
                                             l.id inner join category c on l.category = c.id inner join "user" u on 
                                             l.lecturer_id = u.id where
                                             a.user_id = $1 and a.active = true and l.active = true and
                                             current_date >= date_start and current_date <= date_end
                                             order by number_of_repetition(date_start, date_end, days(l.id)) 
                                             desc limit 12 offset 12*$2`, [user_id, pagination])
        const resultCount = await pool.query(`select count(*) FROM attendee a inner join lecture l on a.lecture_id = 
                                             l.id where
                                             a.user_id = $1 and a.active = true and l.active = true and
                                             current_date >= date_start and current_date <= date_end`, [user_id])
        const count = resultCount.rows[0].count;
        let result = resultLectures.rows;
        result.push(count);
        return result;
    } catch(error){throw error;}
}

User.getAllAttendedLecturesStartDate = async (user_id, pagination)=>{
    try{
        const resultLectures = await pool.query(`select l.id, u.username, l.name, description, c.category_name, date_start, date_end,
                                                image FROM attendee a inner join lecture l on a.lecture_id = 
                                                l.id inner join category c on l.category = c.id inner join "user" u on 
                                                l.lecturer_id = u.id where
                                                a.user_id = $1 and a.active = true and l.active = true and
                                                current_date > date_end order by date_start desc limit 12 offset 12*$2`,
                                                [user_id, pagination])
        const resultCount = await pool.query(`select count(*) FROM attendee a inner join lecture l on a.lecture_id = 
                                             l.id where
                                             a.user_id = $1 and a.active = true and l.active = true and
                                             current_date > date_end`, [user_id])
        const count = resultCount.rows[0].count;
        let result = resultLectures.rows;
        result.push(count);
        return result;
    }catch(error){throw error;}
}

User.getAllAttendedLecturesNumberOfSessions = async (user_id, pagination)=>{
    try{
        const resultLectures = await pool.query(`select l.id, u.username, l.name, description, c.category_name, date_start, date_end,
                                                 image FROM attendee a inner join lecture l on a.lecture_id = 
                                                 l.id inner join category c on l.category = c.id inner join "user" u on 
                                                 l.lecturer_id = u.id where
                                                 a.user_id = $1 and a.active = true and l.active = true and
                                                 current_date > date_end order by number_of_repetition(date_start, date_end, days(l.id)) 
                                                 desc limit 12 offset 12*$2`, [user_id, pagination])
        const resultCount = await pool.query(`select count(*) FROM attendee a inner join lecture l on a.lecture_id = 
                                             l.id where
                                             a.user_id = $1 and a.active = true and l.active = true and
                                             current_date > date_end`, [user_id])
        const count = resultCount.rows[0].count;
        let result = resultLectures.rows;
        result.push(count);
        return result;
    }catch(error){throw error;}
}

User.getAllAttendFutureLecturesStartDate = async (user_id, pagination)=>{
    try{
        const resultLectures = await pool.query(`select l.id, u.username, l.name, description, c.category_name, date_start, date_end,
                                             image FROM attendee a inner join lecture l on a.lecture_id = 
                                             l.id inner join category c on l.category = c.id inner join "user" u on 
                                             l.lecturer_id = u.id where
                                             a.user_id = $1 and a.active = true and l.active = true and
                                             current_date < date_start
                                             order by date_start desc limit 12 offset 12*$2`, [user_id, pagination])
        const resultCount = await pool.query(`select count(*) FROM attendee a inner join lecture l on a.lecture_id = 
                                             l.id where
                                             a.user_id = $1 and a.active = true and l.active = true and
                                             current_date < date_start`, [user_id])
        const count = resultCount.rows[0].count;
        let result = resultLectures.rows;
        result.push(count);
        return result;
    }catch(error){throw error;}
}

User.getAllAttendFutureLecturesNumberOfSessions = async (user_id, pagination)=>{
    try{
        const resultLectures = await pool.query(`select l.id, u.username, l.name, description, c.category_name, date_start, date_end,
                                             image FROM attendee a inner join lecture l on a.lecture_id = 
                                             l.id inner join category c on l.category = c.id where
                                             a.user_id = $1 and a.active = true and l.active = true and
                                             current_date < date_start
                                             order by number_of_repetition(date_start, date_end, days(l.id)) 
                                             desc limit 12 offset 12*$2`, [user_id, pagination])
        const resultCount = await pool.query(`select count(*) FROM attendee a inner join lecture l on a.lecture_id = 
                                             l.id where
                                             a.user_id = $1 and a.active = true and l.active = true and
                                             current_date < date_start`, [user_id])
        const count = resultCount.rows[0].count;
        let result = resultLectures.rows;
        result.push(count);
        return result;
    }catch(error){throw error;}
}

User.search = async (nameUser) =>{
    try{
        const searchResults = await pool.query(`select "id", "username" from "user" where "username" like $1 || '%' and "active" = true`, [nameUser]);
        const search = searchResults.rows;
        return search;
    }catch(error){throw error;}
}

User.getDetails = async (user_id) =>{
    try{
        const userResult = await pool.query(`select "id", "username", "profile_picture", "lecturer", "attendee", "date_of_signup" from "user"
                                             where id = $1 and "active" = true `, [user_id]);
        const user = userResult.rows[0];
        console.log(user_id);
        return user;
    }catch(error){throw error;}
}

User.friendshipStatus = async (user_id1, user_id2) =>{
    try{
        const friendshipResult = await pool.query(`select s.name, fr.sender_of_request, fr.reciever_of_request from
                                                   "friendship_request" fr inner join "friendship_status" s
                                                   on fr.status = s.id where fr.active = true and ((fr.sender_of_request = $1 and 
                                                   fr.reciever_of_request = $2) or (fr.sender_of_request = $2 and fr.reciever_of_request = $1))`,
                                                   [user_id1, user_id2]);
        const friendship = friendshipResult.rows[0];
        return friendship;
    }catch(error){throw error;}
}

User.lecturerLectures = async (user_id) =>{
    try{
    const lecturesResult = await pool.query(`select l.id, l.name, c.category_name from "lecture" l inner join "category" c 
                                            on l.category = c.id where l.lecturer_id = $1 and l.active = true`, [user_id]);
    const lectures = lecturesResult.rows;
    console.log(lectures);
    return lectures;
    }catch(error){throw error;}
}

User.attendeeLectures = async (user_id) =>{
    try{
        const attendeeResult = await pool.query(`select l.id, l.name, c.category_name from "lecture" l inner join "category" c 
                                            on l.category = c.id inner join "attendee" a on l.id = a.lecture_id 
                                            where a.user_id = $1 and l.active = true and a.active = true`, [user_id]);
        const lectures = attendeeResult.rows;
        console.log(lectures);
        return lectures;
    }catch(error){throw error;}
}

User.grid = async (name)=>{
    try{
        const usersResult = await pool.query(`select "id", "profile_picture", "username", "lecturer", "attendee" from "user" 
                                          where username like $1 || '%' and "active" = true`,
            [name]);
        const users = usersResult.rows;
        return users;
    }catch(error){throw error;}
}

User.addFriend = async (sender_id, reciever_id) =>{
    try{
        await pool.query(`insert into friendship_request (sender_of_request, reciever_of_request, status) values ($1, $2, 1)`,
                    [sender_id, reciever_id]);
        return;
    }catch(erro){throw error;}
}

User.getNotifications = async (user_id) =>{
    try{
        const notificationsResult =await pool.query('select content, sender_id from notifications where user_id = $1 order by time desc', [user_id]);
        const notifications = notificationsResult.rows;
        const notReadResult = await pool.query('select count(*) from notifications where user_id = $1 and read = false', [user_id]);
        const notRead = notReadResult.rows[0].count;
        notifications.push(notRead);
        return notifications;
    }catch(error){throw error}
}

User.readNotifications = async (user_id) =>{
    try{
        await pool.query('update notifications set read = true where user_id = $1', [user_id]);
        return;
    }catch(error){throw error;}
}

User.newNotifications = async (user_id, sender_id, content) =>{
    try{
        await pool.query('insert into notifications (user_id, content, sender_id) values ($1, $2, $3)', [user_id, content, sender_id]);
        return;
    }catch(error){throw error;}
}

User.removeRequest = async (sender_id, reciever_id) =>{
    try{
        await pool.query(`update friendship_request set active = false where sender_of_request = $1 and 
                          reciever_of_request = $2 and active = true`, [sender_id, reciever_id]);
        return;
    }catch(error){throw error;}
}

User.acceptRequest = async (sender_id, reciever_id) =>{
    try{
        await pool.query(`update friendship_request set status = 2 where active = true and sender_of_request = $1 and 
                           reciever_of_request = $2`, [sender_id, reciever_id]);
        return;
    }catch(error){throw error;}
}

User.declineRequest = async (sender_id, reciever_id) =>{
    try{
        await pool.query(`update friendship_request set status = 3, active = false where active = true and sender_of_request = $1 and 
                           reciever_of_request = $2`, [sender_id, reciever_id]);
        return;
    }catch(error){throw error;}
}

User.unfriend = async (user_id, friend_id) =>{
    try{
        await pool.query(`update friendship_request set active = false where   (sender_of_request = $1 and 
                           reciever_of_request =$2) or (sender_of_request = $2 and reciever_of_request = $1)`, [user_id, friend_id]);
        return;
    }catch(error){throw error;}
}

User.delete = async (user_id) =>{
    try{
        await pool.query('update "user" set active = false where id = $1', [user_id]);
        return;
    }catch(error){throw error;}
}

User.uploadPicture = async (user_id, picture) =>{
    try{
        await pool.query('update "user" set profile_picture = $1 where id = $2;', [picture, user_id]);
        return;
    }catch(error){throw error;}
}

User.block = async (user_id) =>{
    try{
        await pool.query('update "user" set active = false, blocked_at = current_date where id = $1;', [user_id]);
        return;
    }catch(error){throw error;}
}

User.unblock = async (current_date) =>{
    try{
        await pool.query('update "user" set active = true, blocked_at = null where active = false and blocked_at < $1;', [current_date]);
        return;
    }catch(error){throw error;}
}
module.exports = User;




