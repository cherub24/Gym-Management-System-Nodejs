const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: mongoose.Schema.Types.ObjectId, ref: 'MemberType', required: true },
    paymentPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentPlan', required: true },
    lastPaymentDateTime: { type: Date, default: null },
    isPaid: { type: Boolean, default: false },
    expirationDate: { type: Date, required: true },
    phoneNumber: { type: String, required: true },
    address: { type: String, required: true },
    photo: { type: String, default: null }, // Assuming the photo is stored as a file path or URL
});

const Member = mongoose.model('Member', memberSchema);

module.exports = Member;
