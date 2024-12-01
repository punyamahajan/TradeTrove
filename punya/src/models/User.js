const mongoose = require('mongoose');
const Coupon = require('./Coupon');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    cart: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Coupon'
        }
    ],
    tokens: [
        {
            token: {
                type: String,
                required: true,
            },
        },
    ],
});

userSchema.methods.generateToken = async function () {
    const token = jwt.sign({ _id: this._id.toString() }, "punyamahajan23cse");
    this.tokens = this.tokens.concat({ token: token })
    await this.save();
    return token;
}

//converting password into hash
userSchema.pre("save", async function (next) { //this is being used for hashing before save 
    // const passwordHash = await bcrypt.hash(password,10);
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10)
    }
    next() //next makes sure the save function is completed
})


const User = mongoose.model('User', userSchema);

module.exports = User;