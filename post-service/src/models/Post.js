const { required } = require("joi");
const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    content:{
        type:String,
        required:true,
    },
    mediaIds:{
        type:String,
    },
    createdAt:{
        type:Date.now(),
    }
},{timestamps:true})

//if there will not be the search service then it will be helpful
postSchema.index({
    content:"text",
})

const Post = mongoose.model("Post",postSchema);

module.exports = Post;