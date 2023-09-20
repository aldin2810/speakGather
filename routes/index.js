var express = require('express');
var router = express.Router();
const User = require('../models/User');
const Lecture = require('../models/Lecture');
const Passport = require('../passport_jwt');
const confirmRegistration = require('../confirm_reg_mail');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const multer = require('multer');
const fs = require('fs');
const util = require('util');
const readFileAsync = util.promisify(fs.readFile);
const upload =  multer({ dest: 'uploads/' });
const cron = require('node-cron');

var io = null;

cron.schedule('0 0 * * *', () => {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - 30);
  User.unblock(currentDate);
});

router.get('/', function(req, res, next) {
  res.render('confirmEmail');
});

router.get('/landingPage', function(req, res, next) {
  res.render('landingPage');
});

router.get('/signup', function(req, res, next) {
  res.render('signup');
});

router.get('/login', function(req, res, next) {
  res.render('login');
});

router.post('/submit/signup', async function(req, res, next) {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.passwordConfirmation;
  const attendee = !!req.body.attendee;
  const lecturer = !!req.body.lecturer;
  try{
    const user = await User.createUser(firstName, lastName, username, email, password, confirmPassword, lecturer, attendee);
    confirmRegistration.verify();
    const token = confirmRegistration.generateToken(user);
    const confirmationLink = confirmRegistration.confirmationLink(token);
    const mailOptions = confirmRegistration.mailOptions(user.email, confirmationLink);
    confirmRegistration.sendMail(mailOptions);
    res.render('confirmEmail');
  }catch(err){
    res.status(409).json({error: err.message});
  }
});

router.get('/confirm-registration', async function(req, res, next) {
  const token = req.query.token;
  try {
    const decoded = jwt.verify(token, 'your_secret_key');
    await User.confirmRegistration(decoded.id);
    return res.render('emailConfirmed', {succeded: true})
  } catch (error) {
    res.render('emailConfirmed', {succeded: false, message: error.message});
  }
});

router.post('/submit/login', (req, res, next)=>{
  Passport.pass.authenticate('local', { session: false }, (err, user, info) => {
      if (err || !user) {
        return res.status(401).json({ error: info.message });
      }
      const token = Passport.generateToken(user);
      return res.json({ token });
    }
  )(req, res, next);
});

router.get('/homepage', async (req, res) =>{
    if(!io){
      io =  require("socket.io")(req.connection.server);
      io.of('/notifications').on("connection", (socket) =>{
        socket.on('user-connected', async (token) =>{
          const decoded = await jwt.verify(token, 'your_secret_key');
          const id = decoded.id;
          socket.join(id);
          const notifications = await User.getNotifications(decoded.id);
          socket.emit('notifications', notifications);
        });
        socket.on('user sends request', async (token, id) =>{
          const decoded = await jwt.verify(token, 'your_secret_key');
          const content = decoded.username + ' sends you a friend request';
          await User.newNotifications(id, decoded.id, content);
          await User.addFriend(decoded.id, id);
          socket.broadcast.to(id).emit('user sends request', content, decoded.id);
        });
        socket.on('user read notifications', async (token) =>{
          const decoded = await jwt.verify(token, 'your_secret_key');
          await User.readNotifications(decoded.id);
          socket.emit('notifications read');
        })
        socket.on('error', function (err) {
          console.log(err);
        });
        socket.on('user deletes request', async (token, id) =>{
          const decoded = await jwt.verify(token, 'your_secret_key');
          const content = decoded.username + ' removes a friend request';
          await User.newNotifications(id, decoded.id, content);
          await User.removeRequest(decoded.id, id);
          socket.broadcast.to(id).emit('user removes request', content, decoded.id);
        })
        socket.on('user accepts request', async (token, id)=>{
          const decoded = await jwt.verify(token, 'your_secret_key');
          const content = decoded.username + ' accepts your friend request';
          await User.newNotifications(id, decoded.id, content);
          await User.acceptRequest(id, decoded.id);
          socket.broadcast.to(id).emit('user accepts request', content, decoded.id);
        })
        socket.on('user declines request', async (token, id)=>{
          const decoded = await jwt.verify(token, 'your_secret_key');
          const content = decoded.username + ' declines your friend request';
          await User.newNotifications(id, decoded.id, content);
          await User.declineRequest(id, decoded.id);
          socket.broadcast.to(id).emit('user declines request', content, decoded.id);
        })
        socket.on('user unfriend', async (token, id)=>{
          const decoded = await jwt.verify(token, 'your_secret_key');
          const content = decoded.username + ' unfriended you';
          await User.newNotifications(id, decoded.id, content);
          await User.unfriend(id, decoded.id);
          socket.broadcast.to(id).emit('user unfriend', content, decoded.id);
        })
        socket.on('user graded', async (token, lecture_id) =>{
          const decoded = await jwt.verify(token, 'your_secret_key');
          const idName = await Lecture.getLecturerIdName(lecture_id);
          const id = idName.lecturer_id;
          const name = idName.name;
          const content = decoded.username + ' graded your lecture: ' + name;
          await User.newNotifications(id, lecture_id, content);
          socket.broadcast.to(id).emit('user graded', content, lecture_id);
        })
        socket.on('user comments', async (token, lecture_id) =>{
          const decoded = await jwt.verify(token, 'your_secret_key');
          const idName = await Lecture.getLecturerIdName(lecture_id);
          const id = idName.lecturer_id;
          const name = idName.name;
          const content = decoded.username + ' comments your lecture: ' + name;
          await User.newNotifications(id, lecture_id, content);
          socket.broadcast.to(id).emit('user comments', content, lecture_id);
        })
      });
      io.of('/lecture_meeting').on("connection", (socket) => {
        console.log(socket.id);
        socket.on("join-room", async (roomId, userId) => {
          socket.join(roomId);
          socket.on('ready',()=>{
            socket.broadcast.to(roomId).emit('user-connected', userId);
          })
        });
        socket.on('user disconnects', (user_id, roomId) =>{
          socket.broadcast.to(roomId).emit('this user disconnected', user_id);
          socket.leave(roomId);
        });
        socket.on('user sends message', async (content, token, roomId)=>{
          var myToken = await jwt.verify(token, 'your_secret_key');
          var attendee = Lecture.isUserAttendee(myToken.id, roomId);
          if(!attendee) {
            return res.status(400).end('Not attendee');
          }
          var messages = await Lecture.recieveQuestion(roomId, myToken.id, content);
          socket.emit('here is your message', messages);
          socket.broadcast.to(roomId).emit('users message', messages);
        })
        socket.on('answer', async (question_id, answer, token, roomId)=>{
          var myToken = await jwt.verify(token, 'your_secret_key');
          var lecturer = await Lecture.isUserLecturer(myToken.id, roomId);
          console.log(lecturer);
          if(!lecturer){
            res.status(400);
          }
          await Lecture.answerQuestion(question_id, answer);
          console.log(answer);
          socket.broadcast.to(roomId).emit('answer is', question_id, answer);
        })
        socket.on('hide', async(question_id, token, roomId)=>{
          var myToken = await jwt.verify(token, 'your_secret_key');
          var lecturer = await Lecture.isUserLecturer(myToken.id, roomId);
          if(!lecturer){
            res.error('Not lecturer');
          }
          await Lecture.hideQuestion(question_id);
          socket.broadcast.to(roomId).emit('hidden', question_id);
        })
        socket.on('Lecturer wrote', async (content, token, roomId)=>{
          var myToken = await jwt.verify(token, 'your_secret_key');
          var lecturer = await Lecture.isUserLecturer(myToken.id, roomId);
          if(!lecturer){
            res.error('Not lecturer');
          }
          socket.broadcast.to(roomId).emit('message', content);
        })
        socket.on('user likes', async (token, roomId, question_id) =>{
          const decoded = await jwt.verify(token, 'your_secret_key');
          const messages = await Lecture.likeQuestion(question_id, decoded.id, roomId);
          socket.emit('here is your like', messages);
          socket.broadcast.to(roomId).emit('user liked');
        })
        socket.on('give me liked', async (token, roomId) =>{
          const decoded = await jwt.verify(token, 'your_secret_key');
          const messages = await Lecture.getQuestionAnswer(roomId, decoded.id);
          socket.emit('here is liked', messages);
        })
        socket.on('user dislikes', async (token, roomId, question_id) =>{
          const decoded = await jwt.verify(token, 'your_secret_key');
          const messages = await Lecture.dislikeQuestion(question_id, decoded.id, roomId);
          socket.emit('here is your dislike', messages);
          socket.broadcast.to(roomId).emit('user disliked');
        })
        socket.on('give me disliked', async (token, roomId) =>{
          const decoded = await jwt.verify(token, 'your_secret_key');
          const messages = await Lecture.getQuestionAnswer(roomId, decoded.id);
          socket.emit('here is disliked', messages);
        })
        socket.on('error', function (err) {
          console.log('tu sam', err);
        });
      });
    }
    try {
      const token = req.query.token;
      const decoded = await jwt.verify(token, 'your_secret_key');
      const categories = await Lecture.getCategories();
      const privacies = await Lecture.getPrivacies();
      const days = await Lecture.getDays();
      const user_id = decoded.id;
      const admin = decoded.admin;
      const lecture_id = req.query.lecture_id;
      let userIsAttendee = true;
      let userIsLecturer = true;
      if(!!lecture_id){
        userIsAttendee = await Lecture.isUserAttendee(user_id, lecture_id);
        userIsLecturer = await Lecture.isUserLecturer(user_id, lecture_id);
      }
      let result = {};
      if(decoded.lecturer && decoded.attendee){
        const organizingLectures = await User.getOrganizingLectures(user_id);
        const organizedLectures = await User.getOrganizedLectures(user_id);
        const organizeFutureLectures   = await User.getOrganizeFutureLectures(user_id);
        const attendingLectures = await User.getAttendingLectures(user_id);
        const attendedLectures = await User.getAttendedLectures(user_id);
        const attendFutureLectures = await User.getAttendFutureLectures(user_id);
        result = {categories:categories, privacies: privacies, days: days,myId: decoded.id,
          organizingLectures: organizingLectures, organizedLectures: organizedLectures, organizeFutureLectures: organizeFutureLectures,
          attendingLectures: attendingLectures, attendedLectures: attendedLectures, attendFutureLectures: attendFutureLectures,
          lecturer: true, attendee:true, lecture_id:lecture_id, userIsAttendee: userIsAttendee, userIsLecturer: userIsLecturer, userIsAdmin: admin};
      }
      else if(decoded.lecturer){
        const organizingLectures = await User.getOrganizingLectures(user_id);
        const organizedLectures = await User.getOrganizedLectures(user_id);
        const organizeFutureLectures   = await User.getOrganizeFutureLectures(user_id);
        result = {categories:categories, privacies: privacies, days: days, myId: decoded.id,
          organizingLectures: organizingLectures, organizedLectures: organizedLectures, organizeFutureLectures: organizeFutureLectures,
          lecturer: true, attendee:false, lecture_id:lecture_id, userIsAttendee: userIsAttendee, userIsLecturer: userIsLecturer, userIsAdmin: admin}
      }
      else{
        const attendingLectures = await User.getAttendingLectures(user_id);
        const attendedLectures = await User.getAttendedLectures(user_id);
        const attendFutureLectures = await User.getAttendFutureLectures(user_id);
        result = {categories:categories, privacies: privacies, days: days,myId: decoded.id,
          attendingLectures: attendingLectures, attendedLectures: attendedLectures, attendFutureLectures: attendFutureLectures,
          lecturer: false, attendee:true, lecture_id:lecture_id, userIsAttendee: userIsAttendee, userIsLecturer: userIsLecturer, userIsAdmin: admin}
      }
      return res.render('homepage', {result: result});
    } catch(err) {res.status(500).json({error: err.message});}
});

router.post('/submit/new-lecture', upload.single('image'), async (req, res) => {
  try {
    const token = req.query.token;
    const decoded = jwt.verify(token, 'your_secret_key');
    const orginizer = decoded.lecturer;
    const username = decoded.username;
    if(orginizer) {
      const user_id = decoded.id;
      const days = req.body.days;
      let schedule = [];
      if (Array.isArray(days)) {
        for (let i = 0; i < days.length; i++) {
          const timeStart = "timeStart" + days[i];
          const timeEnd = "timeEnd" + days[i];
          schedule.push({day: days[i], time_start: req.body[timeStart], time_end: req.body[timeEnd]});
        }
      } else {
        const timeStart = "timeStart" + days;
        const timeEnd = "timeEnd" + days;
        schedule.push({day: days, time_start: req.body[timeStart], time_end: req.body[timeEnd]});
      }
      const name = req.body.name;
      console.log(req.body);
      const category = req.body.category;
      const description = req.body.description;
      const dateStart = req.body.dateStart;
      const dateEnd = req.body.dateEnd;
      const privacy = req.body.privacy;
      let image = null;
      let imagePath = null;
      if (!!req.file) {
        imagePath = req.file.path;
        if (!req.file.mimetype.startsWith('image')) {
          throw new Error('Invalid image format!');
        }
        async function readImageFile(imagePath1) {
          try {
            const data = await readFileAsync(imagePath1);
            return data;
          } catch (error) {
            console.error('Error reading image file:', error);
            throw error;
          }
        }
        image = await readImageFile(imagePath);
      }
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      const dateStart2 = new Date(dateStart);
      const dateEnd2 = new Date(dateEnd);
      const dateStart1 = dateStart2.toLocaleDateString('en-US', options);
      const dateEnd1 = dateEnd2.toLocaleDateString('en-US', options);
      const lecture1= await Lecture.createLecture(user_id, name, description, image, category, dateStart,
          dateEnd, schedule, privacy);
      if(imagePath !== null){
        fs.unlinkSync(imagePath);
      }
      res.json({id:lecture1.id,username: username, name: name, description: description, category: category,
        dateStart: dateStart1, dateEnd: dateEnd1, schedule: schedule, image: image});
    }
    else{
      throw new Error('Unathorized!');
    }
  }catch(err){res.status(409).json({error: err.message});}
});

router.get('/get-lecture/:id', async (req, res, next) =>{
  try{
    const token = req.query.token;
    const decoded = jwt.verify(token, 'your_secret_key');
    const user_id = decoded.id;
    const userIsAdmin = decoded.admin;
    const lecture_id = req.params.id;
    const result = await Lecture.getLectureDetailsRegistered(user_id, lecture_id);
    userIsLecturer = (decoded.username === result.username);
    const userIsAttendee = await Lecture.isUserAttendee(user_id, lecture_id);
    result.userIsLecturer = userIsLecturer;
    result.userIsAttendee = userIsAttendee;
    result.userIsAdmin = userIsAdmin;
    return res.json(result);
  }catch(err){res.status(409).json({error: err.message});}

});

router.get('/lectures/grid/:type/:sort/:pagination', async (req, res, next) =>{
  try{
    const type = req.params.type;
    const pagination = req.params.pagination;
    const token = req.query.token;
    const sort = req.params.sort;
    const decoded = jwt.verify(token, 'your_secret_key');
    if(type==='organizing'){
      if(decoded.lecturer){
        if(sort === 'startDate'){
          const lectures = await User.getAllOrganizingLecturesStartDate(decoded.id, pagination);
          return res.render('searchResult', {lectures: lectures});
        }
        else if(sort === 'numberOfSessions'){
          const lectures = await User.getAllOrganizingLecturesNumberOfSessions(decoded.id, pagination);
          return res.render('searchResult', {lectures: lectures});
        }
      }
      else{throw new Error('You are not lecturer!')};
    }
    if(type==='organized'){
      if(decoded.lecturer){
        if(sort === 'startDate'){
          const lectures = await User.getAllOrganizedLecturesStartDate(decoded.id, pagination);
          return res.render('searchResult', {lectures: lectures});
        }
        else if(sort === 'numberOfSessions'){
          const lectures = await User.getAllOrganizedLecturesNumberOfSessions(decoded.id, pagination);
          return res.render('searchResult', {lectures: lectures});
        }
      }
      else{throw new Error('You are not lecturer!')};
    }
    if(type === 'organize-future'){
      if(decoded.lecturer){
        if(sort === 'startDate'){
          const lectures = await User.getAllOrganizeFutureLecturesStartDate(decoded.id, pagination);
          return res.render('searchResult', {lectures: lectures});
        }
        else if(sort === 'numberOfSessions'){
          const lectures = await User.getAllOrganizeFutureLecturesNumberOfSessions(decoded.id, pagination);
          return res.render('searchResult', {lectures: lectures});
        }
      }
      else{throw new Error('You are not lecturer!')};
    }
    if(type === 'attending'){
      if(decoded.attendee){
        if(sort === 'startDate'){
          const lectures = await User.getAllAttendingLecturesStartDate(decoded.id, pagination);
          return res.render('searchResult', {lectures: lectures});
        }
        else if(sort === 'numberOfSessions'){
          const lectures = await User.getAllAttendingLecturesNumberOfSessions(decoded.id, pagination);
          return res.render('searchResult', {lectures: lectures});
        }
      }
      else{throw new Error('You are not attendee!')};
    }
    if(type === 'attended'){
      if(decoded.attendee){
        if(sort === 'startDate'){
          const lectures = await User.getAllAttendedLecturesStartDate(decoded.id, pagination);
          return res.render('searchResult', {lectures: lectures});
        }
        else if(sort === 'numberOfSessions'){
          const lectures = await User.getAllAttendedLecturesNumberOfSessions(decoded.id, pagination);
          return res.render('searchResult', {lectures: lectures});
        }
      }
      else{throw new Error('You are not attendee!')};
    }
    if(type === 'attend-future'){
      if(decoded.attendee){
        if(sort === 'startDate'){
          const lectures = await User.getAllAttendFutureLecturesStartDate(decoded.id, pagination);
          return res.render('searchResult', {lectures: lectures});
        }
        else if(sort === 'numberOfSessions'){
          const lectures = await User.getAllAttendFutureLecturesNumberOfSessions(decoded.id, pagination);
          return res.render('searchResult', {lectures: lectures});
        }
      }
      else{throw new Error('You are not attendee!')};
    }
    if(type === 'search'){
      const name = req.query.searchName;
      if(sort === 'startDate'){
        const lectures = await Lecture.searchAllStartDate(name, decoded.id, pagination);
        return res.render('searchResult', {lectures: lectures});
      }
      else if(sort === 'numberOfSessions'){
        const lectures = await Lecture.searchAllNumberOfSessions(name, decoded.id, pagination);
        return res.render('searchResult', {lectures: lectures});
      }
    }
  } catch (err){res.status(409).json({error: err.message});}
});

router.get('/search/lectures', async (req, res, next) =>{
    try {
      const token = req.query.token;
      const decoded = jwt.verify(token, 'your_secret_key');
      const name = req.query.lecture_name;
      const lectures = await Lecture.search(name, decoded.id);
      return res.json({lecturesSearch: lectures});
    } catch (err){console.log(err.message); res.status(409).json({error: err.message});}
});

router.post('/attend-lecture/:lecture_id', async (req, res, next) =>{
  try {
    const token = req.query.token;
    const decoded = jwt.verify(token, 'your_secret_key');
    const lecture_id = req.params.lecture_id;
    if(! (await Lecture.isUserAttendee(decoded.id, lecture_id))){
      const result = await Lecture.addAttendee(decoded.id, lecture_id);
      return res.json(result);
    }
    else{throw new Error('You are already attendee of this lecture!')}
  } catch (err){console.log(err.message); res.status(409).json({error: err.message});}
});

router.post('/unattend-lecture/:lecture_id', async (req, res, next) =>{
  try {
    const token = req.query.token;
    const decoded = jwt.verify(token, 'your_secret_key');
    const lecture_id = req.params.lecture_id;
    if(await Lecture.isUserAttendee(decoded.id, lecture_id)){
      const result = await Lecture.removeAttendee(decoded.id, lecture_id);
      return res.json(result);
    }
    else{throw new Error('You are not attendee of this lecture!')}
  } catch (err){console.log(err.message); res.status(409).json({error: err.message});}
});

router.post('/upload-file/:lecture_id', upload.single('file'), async (req, res, next) =>{
  try{
    if (!req.file) {
      throw new Error('No file uploaded.');
    }
    const token = req.query.token;
    const decoded = jwt.verify(token, 'your_secret_key');
    const lecture_id = req.params.lecture_id;
    const userIsLecturer = Lecture.isUserLecturer(decoded.id, lecture_id);
    if(!userIsLecturer && !decoded.admin){
      throw new Error('You are not lecturer of this lecture!');
    }
    let filePath = req.file.path;
    async function readFile(filePath1){
      try {
        const data = await readFileAsync(filePath1);
        return data;
      } catch (error) {
        throw error;
      }
    }
    let file = await readFile(filePath);
    await Lecture.uploadFile(lecture_id, req.file.originalname, file);
    fs.unlinkSync(filePath);
    return res.json({file_name: req.file.originalname});
  }catch(err){console.log(err.message); res.status(409).json({error: err.message});}
})

router.post('/delete-file/:lecture_id/:file_id', async (req, res, next) =>{
  try{
    const token = req.query.token;
    const decoded = jwt.verify(token, 'your_secret_key');
    const lecture_id = req.params.lecture_id;
    const userIsLecturer = Lecture.isUserLecturer(decoded.id, lecture_id);
    if(!userIsLecturer && !decoded.admin){
      throw new Error('You are not lecturer of this lecture!');
    }
    const file_id = req.params.file_id;
    await Lecture.deleteFile(file_id);
    return res.json({success: 'Success!'});
  }catch(err){console.log(err.message); res.status(409).json({error: err.message});}
})

router.get('/download-file/:lecture_id/:file_id', async (req, res, next) =>{
  try{
    const token = req.query.token;
    const decoded = jwt.verify(token, 'your_secret_key');
    const lecture_id = req.params.lecture_id;
    const userIsLecturer = await Lecture.isUserLecturer(decoded.id, lecture_id);
    const userIsAttendee = await Lecture.isUserAttendee(decoded.id, lecture_id);
    if(!(userIsLecturer || userIsAttendee || decoded.admin)){
      throw new Error('You are not lecturer nor attendee of this lecture!');
    }
    const file_id = req.params.file_id;
    const myFile = await Lecture.getFile(file_id);
    res.setHeader('Content-Disposition', `attachment; filename="${myFile.file_name}"`);
    return res.send(myFile.file);
  }catch(err){console.log(err.message); res.status(409).json({error: err.message});}
})
router.get('/lecture_meeting/:lecture_id', async (req, res, next) =>{
  try{
    const token = req.query.token;
    const decoded = jwt.verify(token, 'your_secret_key');
    const admin = decoded.admin
    const lecture_id = req.params.lecture_id;
    const userIsLecturer = await Lecture.isUserLecturer(decoded.id, lecture_id);
    const userIsAttendee = await Lecture.isUserAttendee(decoded.id, lecture_id);
    const isLectureInSession = await Lecture.isLectureInSession(lecture_id);
    if(isLectureInSession){
      if((!(userIsLecturer || userIsAttendee)) && (!admin)){
        throw new Error('You are not lecturer nor attendee of this lecture');
      }
      const messages = await Lecture.getQuestionAnswer(lecture_id, decoded.id);
      res.render('lecture_meeting', {roomId: lecture_id, userIsAttendee: userIsAttendee, userIsLecturer: userIsLecturer,
      messages:messages});
    }
    else {res.render('lectureNotInSession');}
  }catch(err){console.log(err.message); res.status(409).json({error: err.message});}
})

router.post('/erase-lecture/:lecture_id', async (req, res, next) =>{
  try{
    const token = req.query.token;
    const lecture_id = req.params.lecture_id;
    const decoded = jwt.verify(token, 'your_secret_key');
    const userIsLecturer = Lecture.isUserLecturer(decoded.id, lecture_id);
    if(!userIsLecturer && !decoded.admin){
      res.status(400);
      return;
    }
    await Lecture.eraseLecture(lecture_id);
    return res.status(200).json({});
  }catch(err){{console.log(err.message); res.status(409).json({error: err.message});}}
})

router.get('/answered-questions/:lecture_id', async (req, res, next) =>{
  try{
    const token = req.query.token;
    const lecture_id = req.params.lecture_id;
    const decoded = jwt.verify(token, 'your_secret_key');
    const userIsLecturer = Lecture.isUserLecturer(decoded.id, lecture_id);
    if(!userIsLecturer && !decoded.admin){
      res.status(400);
      return;
    }
    const questions = await Lecture.getAnsweredQuestions(lecture_id);
    return res.status(200).json({questions:questions});
  }catch(err){{console.log(err.message); res.status(409).json({error: err.message});}}
})

router.get('/unanswered-questions/:lecture_id', async (req, res, next) =>{
  try{
    const token = req.query.token;
    const lecture_id = req.params.lecture_id;
    const decoded = jwt.verify(token, 'your_secret_key');
    const userIsLecturer = Lecture.isUserLecturer(decoded.id, lecture_id);
    if(!userIsLecturer && !decoded.admin){
      res.status(400);
      return;
    }
    const questions = await Lecture.getUnansweredQuestions(lecture_id);
    return res.status(200).json({questions:questions});
  }catch(err){{console.log(err.message); res.status(409).json({error: err.message});}}
})

router.get('/hidden-questions/:lecture_id', async (req, res, next) =>{
  try{
    const token = req.query.token;
    const lecture_id = req.params.lecture_id;
    const decoded = jwt.verify(token, 'your_secret_key');
    const userIsLecturer = Lecture.isUserLecturer(decoded.id, lecture_id);
    if(!userIsLecturer && !decoded.admin){
      res.status(400);
      return;
    }
    const questions = await Lecture.getHiddenQuestions(lecture_id);
    return res.status(200).json({questions:questions});
  }catch(err){{console.log(err.message); res.status(409).json({error: err.message});}}
})

router.get('/get-attendees/:lecture_id', async (req, res, next) =>{
  try{
    const token = req.query.token;
    const lecture_id = req.params.lecture_id;
    const decoded = jwt.verify(token, 'your_secret_key');
    const userIsLecturer = Lecture.isUserLecturer(decoded.id, lecture_id);
    if(!userIsLecturer && !decoded.admin){
      res.status(400);
      return;
    }
    const attendees = await Lecture.getAttendees(lecture_id);
    return res.status(200).json({attendees:attendees});
  }catch(err){{console.log(err.message); res.status(409).json({error: err.message});}}
})

router.post('/unhide-question/:lecture_id/:question_id', async (req, res, next) =>{
  try{
    const token = req.query.token;
    const lecture_id = req.params.lecture_id;
    const decoded = jwt.verify(token, 'your_secret_key');
    const userIsLecturer = Lecture.isUserLecturer(decoded.id, lecture_id);
    if(!userIsLecturer && !decoded.admin){
      res.status(400);
      return;
    }
    const question_id = req.params.question_id;
    await Lecture.unhideQuestion(question_id);
    return res.json({})
  }catch(err){{console.log(err.message); res.status(409).json({error: err.message});}}
})

router.post('/hide-question/:lecture_id/:question_id', async (req, res, next) =>{
  try{
    const token = req.query.token;
    const lecture_id = req.params.lecture_id;
    const decoded = jwt.verify(token, 'your_secret_key');
    const userIsLecturer = Lecture.isUserLecturer(decoded.id, lecture_id);
    if(!userIsLecturer && !decoded.admin){
      res.status(400);
      return;
    }
    const question_id = req.params.question_id;
    await Lecture.hideQuestion(question_id);
    return res.json({})
  }catch(err){{console.log(err.message); res.status(409).json({error: err.message});}}
})

router.post('/comment/:lecture_id', async (req, res, next) =>{
  try{
    const token = req.query.token;
    const lecture_id = req.params.lecture_id;
    const decoded = jwt.verify(token, 'your_secret_key');
    const userIsAttendee = Lecture.isUserAttendee(decoded.id, lecture_id);
    if(!userIsAttendee){
      res.status(400);
      return;
    }
    console.log(req.body);
    const commentar = req.body.commentar;
    await Lecture.comment(decoded.id, lecture_id, commentar);
    return res.json({username: decoded.username, commentar: commentar})
  }catch(err){{console.log(err.message); res.status(409).json({error: err.message});}}
})

router.post('/grade/:lecture_id', async (req, res, next) =>{
  try{
    const token = req.query.token;
    const lecture_id = req.params.lecture_id;
    const decoded = jwt.verify(token, 'your_secret_key');
    const userIsAttendee = Lecture.isUserAttendee(decoded.id, lecture_id);
    if(!userIsAttendee){
      res.status(400);
      return;
    }
    const grade = parseInt(req.body.graderadio);
    await Lecture.grade(decoded.id, lecture_id, grade);
    return res.json({username: decoded.username, grade: grade})
  }catch(err){{console.log(err.message); res.status(409).json({error: err.message});}}
})

router.get('/search/users', async (req, res, next) =>{
  try {
    const token = req.query.token;
    const decoded = jwt.verify(token, 'your_secret_key');
    const name = req.query.user_name;
    const users = await User.search(name);
    return res.json({users: users});
  } catch (err){console.log(err.message); res.status(409).json({error: err.message});}
});

router.get('/user/:user_id', async (req, res, next) =>{
  try {
    const token = req.query.token;
    const decoded = jwt.verify(token, 'your_secret_key');
    const user_id = req.params.user_id;
    const userDetails = await User.getDetails(user_id);
    const friendship = await User.friendshipStatus(user_id, decoded.id);
    var attendLectures = [];
    var lecturerLectures = [];
    if(userDetails.lecturer){
      lecturerLectures = await User.lecturerLectures(user_id);
    }
    if(userDetails.attendee){
      attendLectures = await User.attendeeLectures(user_id);
    }
    res.render('detailsUser', {user: userDetails, friendship:friendship, myId: decoded.id,
                                          lecturerLectures: lecturerLectures, attendeeLectures: attendLectures, myUsername:decoded.username,
                                          myAdmin: decoded.admin});
  } catch (err){console.log(err.message); res.status(409).json({error: err.message});}
});

router.get('/grid/users/:name/', async (req, res, next) =>{
  try{
    const name = req.params.name;
    const token = req.query.token;
    const decoded = jwt.verify(token, 'your_secret_key');
    const users = await User.grid(name);
    res.render('usersGrid', {users: users});
  }catch (err){console.log(err.message); res.status(409).json({error: err.message});}
});

router.get('/my-profile', (req, res, next)=>{
  try{
    const token = req.query.token;
    const decoded = jwt.verify(token, 'your_secret_key');
    const url = '/user/' + decoded.id + '?token=' + token;
    res.redirect(url);
  }catch (err){console.log(err.message); res.status(409).json({error: err.message});}
})

router.get('/add-friend/:user_id', async (req, res, next) =>{
  try{
    const name = req.params.name;
    const token = req.query.token;
    const user_id = req.params.user_id;
    const decoded = jwt.verify(token, 'your_secret_key');
    await User.addFriend(decoded.id, user_id);
    res.status(200);
    return;
  }catch (err){console.log(err.message); res.status(409).json({error: err.message});}
})

router.get('/chats', (req, res, next) =>{
  res.render('chats');
})

router.post('/delete-profile', async (req, res, next) =>{
  try{
    const token = req.query.token;
    const decoded = jwt.verify(token, 'your_secret_key');
    await User.delete(decoded.id);
    return res.end('Izbrisano');
  }catch (err){console.log(err.message); res.status(409).json({error: err.message});}
})

router.post('/upload-profile-picture', upload.single('picture'), async (req, res, next)=>{
  try{
    if (!req.file) {
      throw new Error('No file uploaded.');
    }
    const token = req.query.token;
    const decoded = jwt.verify(token, 'your_secret_key');
    let filePath = req.file.path;
    async function readFile(filePath1){
      try {
        const data = await readFileAsync(filePath1);
        return data;
      } catch (error) {
        throw error;
      }
    }
    let file = await readFile(filePath);
    await User.uploadPicture(decoded.id, file);
    fs.unlinkSync(filePath);
    return res.end('Uploaded picture');
  }catch(err){console.log(err.message); res.status(409).json({error: err.message});}
})

router.post('/block-user', async (req, res, next) =>{
  try{
    const token = req.query.token;
    const decoded = await jwt.verify(token, 'your_secret_key');
    if(!decoded.admin){
      res.status(400).end();
    }
    const user_id = req.query.user_id;
    await User.block(user_id);
    return res.status(200).end();
  }catch(err){console.log(err.message); res.status(409).json({error: err.message});}
})
module.exports = router;