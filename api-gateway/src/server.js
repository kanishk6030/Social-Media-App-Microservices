require('dotenv').config();
const express = require("express");
const cors = require("cors");
const Redis = require('ioredis');
const helmet = require('helmet');
const {rateLimit} = require("express-rate-limit");
const {RedisStore} = require("rate-limit-redis");
const logger = require("./utils/logger");
const proxy = require("express-http-proxy");

const app = express();

const PORT = process.env.PORT;

const redisClient = new Redis(process.env.REDIS_URL);

app.use(cors());
app.use(helmet());
app.use(express.json());

//rate limitng 
const ratelimit = rateLimit({
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

app.use(rateLimit);

app.use((req,res,next)=>{
    logger.info(`Recieved ${req.method} request to ${req.url}`);
    logger.info(`Request body,${req.body}`);
    next();
})