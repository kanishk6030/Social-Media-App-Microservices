const logger = require("../utils/logger");
const {validateCreatePost} = require("../utils/validation");
const Post = require("../models/Post"); 
const { json } = require("express");

// This is the function that will handle  the invakudation of the cache when a new post is created
async function invalidateCache(req,input){

    const cacheKey = `post:${input}`;
    await req.redisClient.del(cacheKey);

    const keys = await req.redisClient.keys("posts:*");
    if(keys.length > 0){
        await req.redisClient.del(keys)
    }

}

const createPost = async(req,res)=>{
    logger.info("Create Post endpoint hit ...");
    try{
        const { error } = validateCreatePost(req.body);
        if(error){
            logger.warn("Validation Error",error.details[0].message);
            return res.status(400).json({
                success:false,
                    message:error.details[0].message,
                })
            }
        const {content , mediaIds} = req.body;
        const newlyCreatedPost = new Post({
            user:req.user.userId, //We are getting the userId in the req.user.userId by the authenticateMiddleware
            content,
            mediaIds:mediaIds || null,
        });

        await newlyCreatedPost.save();
        await invalidateCache(req, newlyCreatedPost._id.toString())
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
//Pagination and Caching logic to added
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const cacheKey = `posts:${page}:${limit}`;
        const cachedPosts = await req.redisClient.get(cacheKey);
        
        if(cachedPosts){
            return res.json(JSON.parse(cachedPosts));
        }
        
        const Posts = await Post.find({}).sort({createdAt:-1}).skip(startIndex).limit(limit);
        
        const totalNoofPosts = await Post.countDocuments({});

        const result = {
            Posts,
            currrentPage:page,
            totalPages:Math.ceil(totalNoofPosts/limit),
            totalPosts : totalNoofPosts
        }

        //save you result in cache for future requests
        await req.redisClient.set(
            cacheKey,
            JSON.stringify(result),
            "EX",
            300
        );

        res.json(result);
    }catch(error){
        logger.warn("Error Fetching Post",error);
        res.status(500).json({
            success:false,
            message:"Error Fetching Post"
        })
    }
}

const getPost = async(req,res)=>{
    try{
        const postId = req.params.id;
        const cacheKey = `post:${postId}`;
        const cachedPost = await req.redisClient.get(cacheKey);

        if(cachedPost){
            return res.json(JSON.parse(cachedPost));
        }

        const singlePostDetailsbyId = await Post.findById(postId);
        if(!singlePostDetailsbyId){
            return res.status(404).json({
                message:"Post Not Found",
                success:false
            })
        }

        await req.redisClient.set(
            cacheKey,
            JSON.stringify(singlePostDetailsbyId),
            "EX",
            3600
        )

        res.json(singlePostDetailsbyId);
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
        // The user who have created can only delete the post
        const post = await Post.findOneAndDelete({
            _id:req.params.id, 
            user:req.user.userId
        });
        if(!post){
            return res.status(404).json({
                success:false,
                message:"Post Not Found"
            })
        }
        await invalidateCache(req, req.params.id);
    }catch(error){
        logger.warn("Error fetching Post",error);
        res.status(500).json({
            success:false,
            message:"Error Creating Post"
        })
    }
    res.json({
        message:"Post Deleted Successfully"
    })
}

module.exports = {createPost,getAllPosts,  getPost , deletePost};