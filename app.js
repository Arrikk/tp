const express = require('express');
const appRouter = require('./routers/routers');
const db = require('./config');
const app = express()
const cors = require("cors")
require("dotenv/config")

app.use(express.json({limit: "2mb"}))
app.use(cors())

const PORT = process.env.PORT || 9000
db().then(() => {
    app.use(appRouter)
}).catch(err => {
    console("Error Occured Connecting to DB: ", err)
})


app.listen(PORT, () => console.log("Listening on port " + PORT))