require('dotenv').config();
const express = require("express");
const cors = require("cors");
const Redis = require('ioredis');
const helmet = require('helmet');
const {rateLimit} = require("express-rate-limit");
const {RedisStore} = require("rate-limit-redis");
const logger = require("./utils/logger");
const proxy = require("express-http-proxy");
const errorHandler = require("./middleware/errorHandler");
const { validateToken } = require('./middleware/authMiddleware');


const app = express();

const PORT = process.env.PORT;

const redisClient = new Redis(process.env.REDIS_URL);

app.use(cors());
app.use(helmet());
app.use(express.json());

//rate limitng 
const ratelimitOptions = rateLimit({
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

app.use(ratelimitOptions);

app.use((req,res,next)=>{
    logger.info(`Recieved ${req.method} request to ${req.url}`);
    logger.info(`Request body,${req.body}`);
    next();
})

const proxyOptions = {
    proxyReqPathResolver : (req) =>{
        return req.originalUrl.replace(/^\/v1/,"/api")
    },
    proxyErrorHandler: (err,res,next) =>{
        logger.warn(`Proxy Error : ${err.message}`);
        res.status(400).json({
            success:false,
            message:"Internal Server Error",
            error:err.message,
        })
    }
}
// Setting up the proxy for the Identity Service
app.use("/v1/auth",proxy(process.env.IDENTITY_SERVICE_URL,{
    ...proxyOptions,
    proxyReqOptDecorator:(proxyReqOpts, srcReq) =>{
         proxyReqOpts.headers['Content-Type'] = 'application/json';
         return proxyReqOpts;
    },
    userResDecorator:(proxyRes, proxyResData, userReq, userRes)=>{
        logger.info(`Response recieved from Identity Service ${proxyRes.statusCode}`);
        return proxyResData;
    }
}));

// Setting up the proxy for the Post Service
app.use("/v1/posts",validateToken,proxy(process.env.POST_SERVICE_URL,{
    ...proxyOptions,
    proxyReqOptDecorator:(proxyReqOpts,srcReq)=>{
        proxyReqOpts.headers['Content-Type'] = 'application/json';
        proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;

        return proxyReqOpts;
    },
    userResDecorator:(proxyRes, proxyResData, userReq, userRes)=>{
        logger.info(`Response recieved from Post Service ${proxyRes.statusCode}`);
        return proxyResData;
    }
}));

app.use(errorHandler);

app.listen(PORT,()=>{
    logger.info(`API gateway is running on the PORT ${PORT}`);
    logger.info(`Identity Service is Running on the PORT ${process.env.IDENTITY_SERVICE_URL}`);
    logger.info(`Post Service is Running on the PORT ${process.env.POST_SERVICE_URL}`);
    logger.info(`Redis URL ${process.env.REDIS_URL}`)
})

