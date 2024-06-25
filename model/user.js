const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: {type: String, required: false},
    branch: {type: String, required: false},
    email: {type: String, required: false},
    name: {type: String, required: false},
    role: {type: String, default: "agent"},
    password: {type: String, required: true},
}, {timestamps: true})

module.exports = mongoose.model('User', userSchema)