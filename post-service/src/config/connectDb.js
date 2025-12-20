const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDb = async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI);
        logger.info("Connected successfully to DB.")
    }catch(e){
        logger.warn("Some error occured in connecting DB..",e);
    }
}

module.exports = connectDb;