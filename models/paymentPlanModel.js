// models/paymentPlanModel.js
const mongoose = require('mongoose');

const paymentPlanSchema = new mongoose.Schema({
    name: { type: String, required: true },
    duration: { type: Number, required: true }, // Duration in months
    amount: { type: Number, required: true }, // Amount for the payment plan
    memberType: { type: mongoose.Schema.Types.ObjectId, ref: 'MemberType', required: true },
    // Add other payment plan fields as needed
});

const PaymentPlan = mongoose.model('PaymentPlan', paymentPlanSchema);

module.exports = PaymentPlan;
