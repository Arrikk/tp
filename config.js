const mongoose = require("mongoose")
require("dotenv/config")

const db = async () => {
    try {
       await mongoose.connect(process.env.MONGO_URI, {dbName: "treepDrive"})
        console.log("Connected")
    } catch (error) {
        console.log("Connection Error: ", error)
    }
}
// Added NL
module.exports = db