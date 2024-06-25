const mongoose = require('mongoose');

const inspectionSchema = new mongoose.Schema({
    branchId: {type: String, required: true, ref: "User"},
    status: {type: String, default: "N/A"},
    results: {type: Object, required: true},
}, {timestamps: true})

module.exports = mongoose.model('Inspection', inspectionSchema)