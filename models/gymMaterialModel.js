const mongoose = require('mongoose');

const gymMaterialSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String, // You can store the image URL
    },
    price: {
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    importDate: {
        type: Date,
        default: Date.now,
    },
    equipmentType: {
        type: String,
        required: true,
    },
});

const GymMaterial = mongoose.model('GymMaterial', gymMaterialSchema);

module.exports = GymMaterial;
