const mongoose = require('mongoose');

const inspectionSchema = new mongoose.Schema({
    email: {type: String, required: true},
    name: {type: String, required: true},
    results: {type: Object, required: true},
}, {timestamps: true})

module.exports = mongoose.model('Inspection', inspectionSchema)