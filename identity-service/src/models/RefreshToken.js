const mongoose = require("mongoose");

const refreshtokenSchema = new mongoose.Schema({
    token:{
        type:String,
        reuired:true,
        unique:true,
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    expiredAt:{
        type:Date,
        required:true,
    }
},{timestamps:true})

refreshtokenSchema.index({expiredAt:1},{expireAfterSeconds:0});

const RefreshToken = mongoose.model("RefreshToken",refreshtokenSchema);

module.exports = RefreshToken;