const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const Passport = {};
passport.use(new LocalStrategy({ usernameField: 'username' }, async (username, password, done) => {
    try {
        const user = await User.authenticateUser(username, password);
        return done(null, user);
    } catch (err){
        return done(null, false, {message: err.message});
    }
})
);
Passport.generateToken= (user) =>
                        jwt.sign({ id: user.id, firstName: user.firstName, lastName: user.lastName,
                        email: user.email, attendee: user.attendee, lecturer: user.lecturer, username: user.username, admin: user.admin},
                            'your_secret_key', { expiresIn: '3000h' });

Passport.authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, 'your_secret_key', (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }

        req.user = user;
        next();
    });
}
Passport.pass=passport;


module.exports = Passport;