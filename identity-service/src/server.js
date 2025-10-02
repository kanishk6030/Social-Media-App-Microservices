const express = require("express");
const cors = require("cors");

const app = express();



app.use(cors());

app.get((req,res)=>{
    res.send("API is running...");
})

app.listen(process.env.PORT,() =>{
    console.log(`Server started and listening to the ${process.env.PORT}`);
})