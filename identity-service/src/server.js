require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDb = require("./config/connectDb");
const helmet = require("helmet");
const logger = require("./utils/logger");
const {RateLimiterRedis} = require("rate-limiter-flexible");
const Redis = require("ioredis");
const {rateLimit} = require("express-rate-limit");
const {RedisStore} = require("rate-limit-redis");
const routes = require("./routes/identity-service");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

const PORT = process.env.PORT || 3001;

//connect to db
connectDb()

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

//DDos Protection & rate limiting
const rateLimiter = new RateLimiterRedis({
    storeClient : redisClient,
    keyPrefix : "middleware",
    points : 10,
    duration : 1,
})

app.use((req,res,next)=>{
    rateLimiter.consume(req.ip).then(()=>next()).catch(()=>{
        logger.warn(`Rate Limit Exceeded for IP ${req.ip}`);
        res.status(429).json({
            success: false,
            message:"Too many requests"
        })
    })
})

// IP Based RateLimiting for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max:50,
    standardHeaders:true,
    legacyHeaders:true,
    handler:(req,res)=>{
        logger.warn(`Rate Limit Exceeded for IP ${req.ip}`);
        res.status(429).json({
            success: false,
            message:"Too many requests"
        })
    },
    store: new RedisStore({
        sendCommand:(...args) => redisClient.call(...args)
    })
})

//apply this sensitive endpointLimiter to our routes
app.use("/api/auth/register", sensitiveEndpointsLimiter);
app.use("/api/auth/login", sensitiveEndpointsLimiter);

//routes
app.use("/api/auth",routes);

//errorhandler
app.use(errorHandler)

app.listen(PORT,() =>{
    logger.info(`Identity service is running on the port ${PORT}`)
})

// Unhandeled promise rejections
process.on("unhandledRejection" ,(reason, promise) =>{
    logger.error(`Unhandeled Rejections at ${promise} , "reason : ${reason} `);
})