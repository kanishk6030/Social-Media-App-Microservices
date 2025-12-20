const express = require('express');
const logger = require("../utils/logger");
const{createPost,getAllPosts,getPost} = require("../controllers/post-service")
const{authenticateRequest} = require("../middlewares/authMiddleware")

const router = express.Router();

//This middleware will ensure that all the routes defined below this line will be protected
//this will make the every route protected and only authenticated users can access these routes
router.use(authenticateRequest);

router.post("/create-post",createPost);
router.get("/all-posts",getAllPosts);
router.get("/:id",getPost);

module.exports = router;    