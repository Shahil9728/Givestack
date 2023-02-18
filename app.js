const express = require('express')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const app = express();
dotenv.config({path:'./config.env'});
require('./db/conn')
const PORT = process.env.PORT;
const path = require('path')
const hbs = require('hbs')
const exphbs = require('express-handlebars');
const User = require('./models/userSchema');
const cookieParser = require('cookie-parser')
// const fetch = require('node-fetch')


app.use(cookieParser());

app.use(express.urlencoded({ extended: false }));


app.use(express.json());
app.use(require('./router/auth'));


app.set('view engine','hbs')
app.set('views', path.join(__dirname, 'templates/views'));
hbs.registerPartials(path.join(__dirname,'templates/partials'))
app.use('/public', express.static(path.join(__dirname, './public')))
app.use('/images', express.static(path.join(__dirname, '/templates/images')))

// Middlewares
const middleware = (req,res,next)=>{
    console.log("This is middleware");
    next();
}

app.use(cookieParser());


app.get('/signin',middleware,(req,res)=>{
    res.send('Sign in Page');
})

app.get('/about',(req,res)=>{
    res.send('About Page');
})

app.get('/contact',(req,res)=>{
    res.send('Contact Page');
})

app.get('/signup',(req,res)=>{
    res.send('Sign up Page');
})


app.listen(PORT,()=>{
    console.log(`Server is running at http://localhost:${PORT}/`)
})


module.exports = app;