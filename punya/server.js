const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const hbs = require('hbs');
const { engine } = require('express-handlebars');
const auth = require('./src/middleware/auth')
const bodyParser = require('body-parser');
const User = require('./src/models/User');
const bcrypt = require('bcrypt'); // For hashing passwords
const cookieParser = require('cookie-parser');
const Coupon = require('./src/models/Coupon');
require('dotenv').config()


const staticPath = path.join(__dirname, "/public"); //CLIENT SIDE CODE IS HERE
const templatePath = path.join(__dirname, "/templates/views");
const partialsPath = path.join(__dirname, "/templates/partials");

app.use(express.static(staticPath));
app.engine('handlebars', engine());
app.set("view engine", "hbs");

app.set("views", templatePath);
hbs.registerPartials(partialsPath);

require("./src/db/conn");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());



app.get('/', (req, res) => {
    res.render('index');
});

// Route to render food coupons
app.get('/foodCoupon', async (req, res) => {
    try {
        const foodCoupons = await Coupon.find({ category: 'food' });
        res.render('foodCoupon', { coupons: foodCoupons });
    } catch (error) {
        console.error('Error fetching food coupons:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Route to render pharmacy coupons
app.get('/pharmacyCoupon', async (req, res) => {
    try {
        const pharmacyCoupons = await Coupon.find({ category: 'pharmacy' });
        res.render('pharmacyCoupon', { coupons: pharmacyCoupons });
    } catch (error) {
        console.error('Error fetching pharmacy coupons:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Route to render shopping coupons
app.get('/shoppingCoupon', async (req, res) => {
    try {
        const shoppingCoupons = await Coupon.find({ category: 'shopping' });
        res.render('shoppingCoupon', { coupons: shoppingCoupons });
    } catch (error) {
        console.error('Error fetching shopping coupons:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Route to render travel coupons
app.get('/travelCoupon', async (req, res) => {
    try {
        const travelCoupons = await Coupon.find({ category: 'travel' });
        res.render('travelCoupon', { coupons: travelCoupons });
    } catch (error) {
        console.error('Error fetching travel coupons:', error.message);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/uploadCoupon',auth, (req, res) => {
    res.render('uploadCoupon');
})


// Route to create a new coupon
app.post("/sell", auth, async (req, res) => {
    try {
        const { category, code, description, percentOff } = req.body;

        if (!category || !code || !description || !percentOff) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newCoupon = new Coupon({
            category,
            code,
            description,
            percentOff,
            userId: req.user._id, // Associate with logged-in user
            lastTimeApplied:null
        });

        await newCoupon.save();
        res.status(201).json({ message: "Coupon successfully created", coupon: newCoupon });
    } catch (error) {
        console.error("Error creating coupon:", error);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
});


// route to add coupon to cart
// Route to add coupon to the user's cart
app.post('/addToCart/:couponId', auth, async (req, res) => {
    try {
        const couponId = req.params.couponId;

        // Find the coupon by ID
        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
            return res.status(404).send({ error: 'Coupon not found.' });
        }

        // Add coupon to the user's cart
        req.user.cart.push(coupon);
        await req.user.save();
        
        res.send({ message: 'Coupon added to your cart successfully!', cart: req.user.cart });
    } catch (err) {
        res.status(500).send({ error: 'Failed to add coupon to cart.' });
    }
});

// cart page

app.get('/cart', auth, async (req, res) => {
    try {
        const user = req.user;
        const coupons = await Coupon.find({ '_id': { $in: user.cart } });
        res.render('cart', { coupons });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Internal server error' });
    }
});

// Remove coupon from user's cart
app.delete('/removeFromCart/:couponId', auth, async (req, res) => {
    try {
        const couponId = req.params.couponId;
        const user = req.user;

        // Check if the coupon exists in the cart
        const index = user.cart.indexOf(couponId);
        if (index === -1) {
            return res.status(404).send({ message: 'Coupon not found in cart' });
        }

        // Remove the coupon from the cart
        user.cart.splice(index, 1);
        await user.save();
        res.status(200).send({ message: 'Coupon removed from cart' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Internal server error' });
    }
});


// profile functionalities

// Profile Route
app.get('/profile', auth, async (req, res) => {
    try {
        const user = req.user; // Auth middleware adds user to req
        res.render('profile', {
            username: user.username,
            email: user.email,
            cart: user.cart,
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).send({ message: 'Failed to load profile' });
    }
});

// Update User Profile
app.put('/profile', auth, async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = req.user;

        // Update only the provided fields
        if (username) user.username = username;
        if (email) user.email = email;
        if (password) user.password = password; // Password hashing handled in `pre` save

        await user.save();
        res.status(200).send({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to update profile' });
    }
});

app.get('/login', (req, res) => {
    res.render('login');
})

app.post('/signIn', async (req, res) => {
    console.log(req.body); // Debugging
    const { email, username, password } = req.body;

    try {
        const exists = await User.findOne({ email });

        if (exists) {
            return res.status(400).send("You already have an account. Please login.");
        }

        const newUser = new User({ email, username, password, cart: [], tokens: [] });
        const token = await newUser.generateToken();
        res.cookie("jwt", token, { httpOnly: true, secure: true });

        console.log("Token generated: ", token);

        await newUser.save();
        return res.redirect('/'); // Return ensures no further execution
    } catch (err) {
        console.error("Error during sign-in:", err); // Log error for debugging
        return res.status(400).send("There is an error: " + err);
    }
});

app.post('/logIn', async (req, res) => {
    try {
        const { username, password } = req.body;

        const userName = await User.findOne({ username });
        if (!userName) {
            return res.status(400).send("Please register."); // Return here
        }

        const isMatch = await bcrypt.compare(password, userName.password);
        if (!isMatch) {
            return res.status(400).send("Please enter the right credentials."); // Return here
        }

        const token = await userName.generateToken();
        console.log("Generated Token: ", token);

        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 5); // Set expiration to 5 days from now
        res.cookie("jwt", token, { expires: expirationDate, httpOnly: true, secure: true });

        console.log("Cookie created successfully.");

        return res.redirect('/'); // Return ensures no further execution
    } catch (err) {
        console.error("Error during login:", err); // Log error for debugging
        return res.status(400).send("In try and catch block: " + err);
    }
});

app.get('/logout', auth, async (req, res) => {
    try {
        // Remove the token from the user's tokens array
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);

        // Save the updated user document
        await req.user.save();

        // Clear the JWT cookie
        res.clearCookie("jwt", {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production", // Ensure secure cookies in production
        });

        console.log("User logged out successfully");
        res.status(200).send("Logout successful");
    } catch (err) {
        console.error("Logout failed:", err);
        res.status(500).send("Logout failed");
    }
});




app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});