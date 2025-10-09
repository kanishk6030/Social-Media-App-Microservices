const logger = require("../utils/logger");

const createPost = async(req,res)=>{
    try{
        const {content , mediaIds} = req.body();
        const newlyCreatedPost = new Post({
            user:req.user.userId, //We are getting the userId in the req.user.userId by the authenticateMiddleware
            content,
            mediaIds:mediaIds || [],
        });

        await newlyCreatedPost.save();
        logger.info("New Post Created Successfully",newlyCreatedPost);
        res.status(201).json({
            success:true,
            message:"Post created successfully"
        });
    }catch(error){
        logger.warn("Error Creating Post",error);
        res.status(500).json({
            success:false,
            message:"Error Creating Post"
        })
    }
}

const getAllPosts = async(req,res)=>{
    try{

    }catch(error){
        logger.warn("Error Fetching Post",error);
        res.status(500).json({
            success:false,
            message:"Error Creating Post"
        })
    }
}

const getPost = async(req,res)=>{
    try{

    }catch(error){
        logger.warn("Error fetching Post",error);
        res.status(500).json({
            success:false,
            message:"Error Creating Post"
        })
    }
}

const deletePost = async(req,res)=>{
    try{

    }catch(error){
        logger.warn("Error fetching Post",error);
        res.status(500).json({
            success:false,
            message:"Error Creating Post"
        })
    }
}

module.exports = {createPost};