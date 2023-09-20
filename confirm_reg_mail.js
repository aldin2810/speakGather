const confirm_reg_mail = require('nodemailer');
const jwt = require('jsonwebtoken');

const confirmRegistration = {};

confirmRegistration.transporter = () => confirm_reg_mail.createTransport({
    service: 'gmail',
    auth: {
        user: 'gatherspeak@gmail.com',
        pass: 'bpsyimyqstwvdvjy',
    },
});
confirmRegistration.verify = () => confirmRegistration.transporter().verify((error, success) => {
    if (error) {
        console.error('SMTP configuration error:', error);
    } else {
        console.log('SMTP configuration is ready');
    }
});

confirmRegistration.generateToken = (user) => {
    return jwt.sign({ id: user.id, email: user.email }, 'your_secret_key', {
        expiresIn: '1h', // Token expires in 1 hour
    });
}

confirmRegistration.confirmationLink = (token) => `http://localhost:3000/confirm-registration?token=${token}`;

confirmRegistration.mailOptions = (userMail, link) => {
    return {
    from: 'gatherspeak@gmail.com',
    to: userMail,
    subject: 'Confirm Your Email',
    text: `Click the link to confirm your email: ${link}`
    }
}

confirmRegistration.sendMail = (mailOptions) => confirmRegistration.transporter().sendMail(mailOptions, (error, info) => {
    if (error) {
        throw new Error('Email sending error:', error);
    } else {
        console.log('Email sent:', info.response);
    }
});

module.exports = confirmRegistration;