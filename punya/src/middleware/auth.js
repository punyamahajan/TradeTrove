const jwt = require('jsonwebtoken');
const User = require("../models/User");

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;

        if (!token) {
            console.log("Token not found");
            return res.status(401).render('login'); // Redirect to login
        }

        const verifyUser = jwt.verify(token, "punyamahajan23cse"); // Replace with your secret key
        const user = await User.findOne({ _id: verifyUser._id });

        if (!user) {
            console.log("User not found");
            return res.status(401).render('login'); // Redirect to login
        }

        req.token = token;
        req.user = user;
        next();
    } catch (err) {
        console.error("Authentication error:", err.stack);
        return res.status(401).render('login'); // Redirect to login
    }
};

module.exports = auth;
