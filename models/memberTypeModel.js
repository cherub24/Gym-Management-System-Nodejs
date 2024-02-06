// models/memberTypeModel.js
const mongoose = require('mongoose');

const memberTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    amount: { type: Number, required: true }, // Add the amount field
});

const MemberType = mongoose.model('MemberType', memberTypeSchema);

module.exports = MemberType;
