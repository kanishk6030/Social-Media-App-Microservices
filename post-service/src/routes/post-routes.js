const express = require('express');
const logger = require("../utils/logger");
const{createPost} = require("../controllers/post-service")
const{authenticateRequest} = require("../middlewares/authMiddleware")

const router = express.Router();

router.use(authenticateRequest);

router.post("/create-post",createPost)