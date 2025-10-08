const logger = require("../utils/logger");
const User = require("../models/User");
const { validateRegistration } = require("../utils/validation");
const generateToken = require("../utils/generateTokens");

//User registration 

const registerUser = async (req,res)=>{
    logger.info("Registration endpoint hit ...");
    try {
        const { error } = validateRegistration(req.body);
    if(error){
        logger.warn("Validation Error",error.details[0].message);
        return res.status(400).json({
            success:false,
            message:error.details[0].message,
        })
    }

    const {username,email,password} = req.body;
    if(!req.body){
        logger.warn("Empty request body");
    }
 
    let user = await User.findOne({ $or : [{email},{username}]});
    if(user){
        logger.warn("User already exists...");
        return res.status(400).json({
            success:false,
            message:"User already exists"
        })
    }
    user = new User({username,email,password});
    await user.save();
    logger.warn("User saved",user._id);

    const { refreshToken , accessToken } = await generateToken(user);

    res.status(201).json({
        success:true,
        message:"User registered successfully",
        accessToken:accessToken,
        refreshToken:refreshToken,
    })
    } catch (error) {
      logger.warn("Registration Error Occured",error);
      return res.status(500).json({
        success:false,
        message:"Internal Server Error"
      })  
    }
}

module.exports = { registerUser }