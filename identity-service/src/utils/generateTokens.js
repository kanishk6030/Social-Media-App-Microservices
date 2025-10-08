const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const RefreshToken = require("../models/RefreshToken")

const generateToken = async (user) =>{
    const accessToken = jwt.sign({
        userId:user._id,
        username:user.username,
    },process.env.JWT_SCERET,{expiresIn:"15m"});

    const refreshToken = crypto.randomBytes(40).toString("hex");
    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + 7); //Referesh token for the 7 days.

    await RefreshToken.create({
        token:refreshToken,
        user: user._id,
        expiredAt:expiredAt
    })

    return { refreshToken , accessToken };
}

module.exports = generateToken;