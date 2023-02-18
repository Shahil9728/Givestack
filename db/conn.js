const mongoose = require('mongoose')
// Adding Database
mongoose.set('strictQuery', true);
const mongodburl = process.env.DATABASE;
mongoose.connect(mongodburl,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(()=>{
    console.log("Connection is Successful")
}).catch((error)=>{
    console.log(error);
})