const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const rateLimiter = require("./middleware/rateLimiter");
const authRoute = require("./routes/authRoutes.js");
const userRoute = require("./routes/userRoutes.js");
const logger = require("./utils/logger.js")
const cors = require("cors")
const app = express()
app.use(
    cors({
      origin: "https://assesment5-27dec.onrender.com",
      methods: "GET,POST,PUT,DELETE",
      credentials: true,
    })
  );
app.use(express.json({limit : "5mb"}))
app.use(express.urlencoded({extended:false,limit:"5mb"}));
app.use(rateLimiter)
app.use((err,req,res,next)=>{
    logger.error(` Error : ${err.message}\nStack : ${err.stack}`)
    res.status(500).json({message : "Server Error"})
})

app.use((req, res, next) => {
    logger.info(`Incoming req from ${req.ip}, Method: ${req.method}, URL : ${req.originalUrl} `);
    next();
});
  
// Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);


// Mongo connection
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(()=>{

    app.listen(process.env.PORT, ()=>{
        logger.info(`Server running on port ${process.env.PORT}`)
        console.log(`Server running on port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    logger.error("Error connecting to DB", err)
})