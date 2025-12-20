require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDb = require("./config/connectDb");
const logger = require("./utils/logger");
const {RateLimiterRedis} = require("rate-limiter-flexible");
const Redis = require("ioredis");
const {rateLimit} = require("express-rate-limit");
const {RedisStore} = require("rate-limit-redis");
const postRoutes = require("./routes/post-routes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

const PORT = process.env.PORT || 3002;

connectDb();

const redisClient = new Redis (process.env.REDIS_URL);


//middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}))

app.use((req,res,next)=>{
    logger.info(`Recieved ${req.method} request to ${req.url}`);
    logger.info(`Request body,${req.body}`);
    next();
})

// Ip based sensitive endpoints rate limiting 
// soon

// routes -> IMP: to pass the redis client to routes 
app.use("/api/posts",(req,res,next)=>{
    req.redisClient = redisClient;
    next();
},postRoutes);

app.use(errorHandler)

app.listen(PORT,() =>{
    logger.info(`Post service is running on the port ${PORT}`)
})

// Unhandeled promise rejections
process.on("unhandledRejection" ,(reason, promise) =>{
    logger.error(`Unhandeled Rejections at ${promise} , "reason : ${reason} `);
})