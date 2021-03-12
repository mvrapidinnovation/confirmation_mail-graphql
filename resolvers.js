const User = require('./models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { registerValidation, loginValidation } = require('./validation');
const sendConfirmationMail = require('./routes/sendMail');
const { Error } = require('mongoose');

function getCode() {
    const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let token = '';
    for (let i = 0; i < 25; i++) {
        token += characters[Math.floor(Math.random() * characters.length )];
    }

    return token;
}

const resolvers = {
    Query: {
        info: async (_, args) => { 
            const res = await User.findOne({ name: args.name });
            return res.email;
        }
    },

    Mutation: {
        registerUser: async (_, args) => {

            // Validate the data
            const { error } = registerValidation(args);
            if(error) throw new Error(`${ error }`);

            // Check if user is already in DB
            const emailExist = await User.findOne({ email: args.email });
            if(emailExist) return 'Email already exists';

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(args.password, salt);

            // Generate Confirmation Code
            const confirmationCode = getCode();

            // Create a new user
            const user = new User({
                name: args.name,
                email: args.email,
                password: hashedPassword,
                confirmationCode: confirmationCode
            });

            try {
                user.save(async (err) => {
                    if(err) {
                        throw new Error(`${ err }`);
                    }
                    
                    await sendConfirmationMail(
                        user.name,
                        user.email,
                        user.confirmationCode
                    );
                });
            } catch(err) {
                throw new Error(`${ err }`);
            }

            return "Please check your mail to confirm registration!";

        },

        loginUser: async (_, args) => {
             // Validate the data
            const { error } = loginValidation(args);
            if(error) return error.details[0].message;
            
            // Check if user is already in DB
            const user = await User.findOne({ email: args.email });
            if(!user) return 'Email or Password is wrong';

            // Check if password is correct
            const validPass = await bcrypt.compare(args.password, user.password);
            if(!validPass) return "Invalid Password";

            // Check if user confirmed their email
            if(user.confirmed !== true) {
                return "Please confirm your email first!" ;
            }

            return "User Logged-in!";

            // // Create and sign a token
            // const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
            // res.header('auth-token', token).send(token);
        }
    }
}

module.exports = { resolvers };