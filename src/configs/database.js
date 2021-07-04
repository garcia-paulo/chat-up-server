const mongoose = require("mongoose");
require("dotenv");

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})
    .then(() => {
        console.log("db connected");
    })

mongoose.connection.on("error", err => {
    console.log("db connection error: ", err.message)
})

module.exports = mongoose;