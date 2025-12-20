const logger = require("../utils/logger");
const User = require("../models/User");
const { validateRegistration, validateLogin } = require("../utils/validation");
const generateToken = require("../utils/generateTokens");
const RefreshToken = require("../models/RefreshToken");

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

// User  login

const loginUser = async(req,res,next)=>{
    logger.info("Login endpoint hit ...");
    try {
        const { error } = validateLogin(req.body);
    if(error){
        logger.warn("Validation Error",error.details[0].message);
        return res.status(400).json({
            success:false,
            message:error.details[0].message,
        })
    }
    const {email,password} = req.body;
    if(!req.body){
        logger.warn("Empty request body");
    }

    let user = await User.findOne({email});
    if(!user){
        logger.warn("User Not Found");
        return res.status(400).json({
            success:false,
            message:"Invalid Credentials"
        })
    }

    const isValidPassword = await user.comparePassword(password);
    if(!isValidPassword){
        logger.warn("Password is Wrong");
        return res.status(400).json({
            success:false,
            message:"Password is Wrong"
        })
    }

    const {accessToken, refreshToken} = await generateToken(user);

    res.json({
        accessToken,
        refreshToken,
        user:user._id,
    })
    }catch(error){
        logger.warn("Login Error Occured",error);
      return res.status(500).json({
        success:false,
        message:"Internal Server Error"
      }) 
    }

};


// refresh  Token
const refreshTokenUser = async(req,res) => {
    logger.warn("Refresh Token endpoint hit ...");
    try{    
        const {refreshToken} = req.body;
        if(!refreshToken){
            logger.warn("Refresh Token missing");
            return res.status(400).json({
                success:false,
                message:"Refresh Token missing"
            })
        }

    const storedToken = await RefreshToken.findOne({token:refreshToken});
    
    if(!storedToken || storedToken.expiredAt < new Date()){
        logger.warn("Invalid or Expired refresh Token");

    return res.status(400).json({
        success:false,
        message:"Invalid or Expired refresh Token",
    })
    }

    const user = await user.findById(storedToken.user);

    if(!user){
        logger.warn("User not Found");
        return res.status(401).json({
            success:false,
            message:"User not found",
        })
    }

    const{accessToken:newAccessToken,refreshToken:newRefreshToken} = generateToken(user);

    //delete the previous stored Refresh Token 
    await RefreshToken.deleteOne({id:storedToken._id});

    res.json({
        accessToken:newAccessToken,
        refreshToken:newRefreshToken,
    })
    }
    catch(error){
        logger.warn("Login Error Occured",error);
      return res.status(500).json({
        success:false,
        message:"Internal Server Error"
      })
    }
}

//logout
const logoutUser = async(req,res)=>{
    logger.warn("Logout endpoint hit ...");
    try{    
        const {refreshToken} = req.body;
        if(!refreshToken){
            logger.warn("Refresh Token missing");
            return res.status(400).json({
                success:false,
                message:"Refresh Token missings"
            })
        }

        await RefreshToken.deleteOne({token:refreshToken});
        logger.info("refresh token deleted successfully for logout")

        res.json({
            success:true,
            message:"Logout successfully"
        })
    }
    catch(error){
        logger.warn("Login Error Occured",error);
      return res.status(500).json({
        success:false,
        message:"Internal Server Error"
      })
    }
}

module.exports = { registerUser ,loginUser,refreshTokenUser,logoutUser };