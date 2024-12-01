const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const couponSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        enum: ['travel', 'food', 'pharmacy', 'shopping'],
        required: true
    },
    code: {
        type: String,
        required: true
    },
    description: {
        type: String, // Add this field to store the coupon description
        required: true
    },
    percentOff: {
        type: String, // Percentage off for the coupon (e.g., "30%")
        required: true
    },
    lastTimeApplied: {
        type: Date, // The last time the coupon was used
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Coupon', couponSchema);