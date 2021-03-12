const nodemailer = require("nodemailer");

module.exports = async function(name, email, confirmationCode) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.USER,
            pass: process.env.PASS
        },
        tls:{
            rejectUnauthorized: false
        },
    });

    await transporter.sendMail({
        from: process.env.USER,
        to: email,
        subject: "Please Confirm Your Email",
        html: `
        <div>
            <h1>Email Confirmation</h1>
            <h2>Hello ${name}</h2>
            <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
            <a href=http://localhost:3001/api/user/confirm/${confirmationCode}> Click here</a>
        </div>
        `,
    });
}