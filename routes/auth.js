const express = require("express");
const authRoutes = express.Router();
const auth = require("../middleware/auth");
const User = require("../model/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../helpers");
const forgetpassword = require("../model/forgetpassword");

authRoutes.post("/register", async (req, res) => {
    try {
        // Get user input
        const { first_name, last_name, email, password } = req.body;
        // Validate user input
        if (!(email && password && first_name && last_name)) {
            res.status(400).send("All input is required");
        }

        // check if user already exist
        // Validate if user exist in our database
        const oldUser = await User.findOne({ email });

        if (oldUser) {
            return res.status(409).send("User Already Exist. Please Login");
        }

        //Encrypt user password
        encryptedPassword = await bcrypt.hash(password, 10);

        // Create user in our database
        const user = await User.create({
            first_name,
            last_name,
            email: email.toLowerCase(), // sanitize: convert email to lowercase
            password: encryptedPassword,
        });

        // Create token
        const token = jwt.sign(
            { user_id: user._id, email },
            process.env.TOKEN_KEY,
            {
                expiresIn: "2h",
            }
        );
        // save user token
        user.token = token;

        // return new user
        res.status(201).json(user);
    } catch (err) {
        console.log(err);
    }
});

// Login
authRoutes.post("/login", async (req, res) => {
    try {
        // Get user input
        const { email, password } = req.body;

        // Validate user input
        if (!(email && password)) {
            res.status(400).send("All input is required");
        }
        // Validate if user exist in our database
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            // Create token
            const token = jwt.sign(
                { user_id: user._id, email },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "2h",
                }
            );

            // save user token
            user.token = token;

            // user
            res.status(200).json(user);
        }
        res.status(400).send("Invalid Credentials");
    } catch (err) {
        console.log(err);
    }
});

authRoutes.post("/forget-password", async (req, res) => {
    
    const { email } = req.body;

    if(!email) {
        res.status(400).send("email field is required");
    }

    const user = await User.findOne({ email });
    
    if(!user) {
        res.status(400).send("invalid email address");
    }
    
    const code = Math.floor(100000 + Math.random() * 900000)
    
    await forgetpassword.create({
        userId: user._id,
        code
    });

    sendEmail('forgetpassword', 'arifiqbal@outlook.com', "forget email", {code})

    res.status(200).send({
        message: 'email has been sent check you inbox.'
    });
});

authRoutes.post("/reset-password", async (req, res) => {
    
    const { code, password, password_confirmation } = req.body;

    if(!(code && password && password_confirmation)) {
        res.status(400).send({
            message: "unauthorized request",
            code: "code is required",
            password: "code is required",
            password_confirmation: "code is required",
        });
        return;
    }

    if(password !== password_confirmation) {
        res.status(400).send({
            message: "password miss match",
        });
        return;
    }

    const codeDco = await forgetpassword.findOne({ code });
    
    if(!codeDco) {
        res.status(401).send({
            message: "Invalid code.!"
        });
        return;
    }

    await forgetpassword.findByIdAndDelete(codeDco._id);

    const newEncryptedPassword = await bcrypt.hash(password, 10);

    await User.findByIdAndUpdate(codeDco.userId, {password: newEncryptedPassword})

    res.status(200).send({
        message: 'password has been reset.'
    });
});

authRoutes.get("/profile", auth, (req, res) => {
    console.log(req.user)
    res.status(200).send("Welcome 🙌 ");
});

module.exports = authRoutes;