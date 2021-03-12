const router = require('express').Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { registerValidation, loginValidation } = require('../validation');
const sendConfirmationMail = require('./sendMail');

function getCode() {
    const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let token = '';
    for (let i = 0; i < 25; i++) {
        token += characters[Math.floor(Math.random() * characters.length )];
    }

    return token;
}

router.post('/register', async (req, res) => {

    // Validate the data
    const { error } = registerValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    // Check if user is already in DB
    const emailExist = await User.findOne({ email: req.body.email });
    if(emailExist) return res.status(400).send('Email already exists');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Generate Confirmation Code
    const confirmationCode = getCode();

    // Create a new user
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        confirmationCode: confirmationCode
    });

    try {
        user.save((err) => {
            if(err) {
                res.status(500).send({ message: err });
                return;
            }

            res.send({
                message: "Please check your mail to confirm registration!"
            });

            sendConfirmationMail(
                user.name,
                user.email,
                user.confirmationCode
            ).catch(console.error);

        });
    } catch(err) {
        res.status(400).send(err);
    }
});

router.post('/login', async (req, res) => {
    // Validate the data
    const { error } = loginValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message);
    
    // Check if user is already in DB
    const user = await User.findOne({ email: req.body.email });
    if(!user) return res.status(400).send('Email or Password is wrong');

    // Check if password is correct
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if(!validPass) return res.status(400).send("Invalid Password");

    // Check if user confirmed their email
    if(user.confirmed !== true) {
        return res.status(401).send({ message: "Please confirm your email first!" });
    }

    // Create and sign a token
    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
    res.header('auth-token', token).send(token);
});

router.get('/confirm/:confirmationCode', async (req, res) => {
    // Get user from DB
    const user = await User.findOne({ confirmationCode: req.params.confirmationCode });
    if(!user) return res.status(400).send({ message: "User Not Found!" });

    // Set the confirmed status
    user.confirmed = true;

    try {
        await user.save();
        return res.send({ message: "User Verified" });
    } catch(err) {
        return res.status(500).send({ message: err });
    }
});

module.exports = router;