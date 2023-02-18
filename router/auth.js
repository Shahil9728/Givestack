const express = require('express')
const router = express.Router();
require('../db/conn');
const User = require('../models/userSchema');
const bcryptjs = require('bcryptjs');
const validator = require('email-validator');
const jwt = require('jsonwebtoken');
const hbs = require('express-handlebars')
const path = require('path')
const cookieParser = require('cookie-parser')
const https = require('https');
const { resolve } = require('path');

router.use(cookieParser());
var userLoggedIn = false;



function getRandomImage() {
    return new Promise(resolve => {
        try {
            let imageUrl = "";
            const apiKey = '0BaN29B1p41fOY5NpxkklzvQW5svpHPRPqwaSpiWcx4';
            const url = `https://api.unsplash.com/photos/random?query=person&client_id=${apiKey}`;
            const options = {
                hostname: 'api.pexels.com',
                path: '/v1/search?query=people&per_page=1&page=1&sort=random',
                headers: {
                    Authorization: 'emMhFZ9bY3TKTXmUhXfhw8ATcaquHkVQsM2D4MFNAD6irtE5B53L18SV',
                }
            };
            https.get(url, res => {
                let data = '';
                res.on('data', chunk => {
                    data += chunk;
                });
                res.on('end', async () => {
                    try {
                        data = JSON.parse(data);
                        imageUrl = await data.urls.regular;
                        resolve(imageUrl);
                    } catch (error) {
                        https.get(options, (res) => {
                            let data = '';

                            res.on('data', (chunk) => {
                                data += chunk;
                            });

                            res.on('end', async () => {
                                const result = JSON.parse(data);
                                imageUrl = await data.urls.regular;
                                resolve(imageUrl);
                            });

                        }).on('error', (err) => {
                            console.log('Error: ' + err.message);
                        });
                        console.log("Error is " + error);
                    }
                })
            })
        } catch (error) {
            console.log(error);
        }
    });
}

var username;
const middleware = async (req, res, next) => {
    if (req.headers.cookie) {
        const cookie = req.headers.cookie;
        const jwtToken = cookie.split("=")[1];
        const decoded = jwt.verify(jwtToken, process.env.SECRET_KEY);
        const id = decoded.id;
        const user1 = await User.findOne({ _id: id })
        if(user1!=null)
        {
            userLoggedIn=true;
        }
        req.data = { user: user1 };
        username = user1.name;
        console.log(user1.name);
    }
    else {
        req.data = { user: null }
    }
    next();
}



router.get('/',middleware, (req, res) => {
    if (userLoggedIn) {
        if (dataflag) {
            dataflag = false;
            return res.render('index.hbs', { userLoggedIn: true, data: true,name:username })
        }
        else {
            return res.render('index.hbs', { userLoggedIn: true, data: false,name:username })
        }
    }
    return res.render('index.hbs', { userLoggedIn: false, data: false,name:null });
//     res.render('index.hbs', { data:false})
})

var dataflag = true;

router.get('/home', middleware, async (req, res) => {
    if (userLoggedIn) {
        if (dataflag) {
            dataflag = false;
            return res.render('index.hbs', { userLoggedIn: true, data: true,name:username })
        }
        else {
            return res.render('index.hbs', { userLoggedIn: true, data: false,name:username })
        }
    }
    return res.render('index.hbs', { userLoggedIn: false, data: false,name:null });
})

router.get('/about', middleware,  async (req, res) => {
    console.log("in about section")
    console.log(userLoggedIn);
    const data1 = await req.data.user;
    if (userLoggedIn) {
        if (req.data.user) {
            return res.render('about.hbs', { data:data1, img: true, userLoggedIn: true })
        }
        else {
            return res.render('about.hbs', { data: false, img: false,userLoggedIn:false })
        }
    }
    return res.render('about.hbs', { data: false, img: false, userLoggedIn: false })
})


router.get('/contact', middleware, (req, res) => {
    if (userLoggedIn) {
        return res.render('contact.hbs', { userLoggedIn: true })
    }
    res.render('contact.hbs')
})

router.get('/login', (req, res) => {
    res.render('login.hbs')
})

router.get('/register', (req, res) => {
    res.render('register.hbs')
})

router.get('/logout', (req, res) => {
    res.clearCookie('jwttoken')
    userLoggedIn = false;
    res.redirect('/login');
})


router.post('/register',middleware, async (req, res) => {
    const { name, email, phone, work, password, cpassword } = req.body;
    if (!name || !email || !phone || !work || !password || !cpassword) {
        return res.render('register.hbs',{error:"Please fill the required feilds"});
    }

    const ismatchpassc = await bcryptjs.compare(password, cpassword);
    if (ismatchpassc) {
        return res.render('register.hbs',{error:"Password does not match"});
    }
    if (phone.length != 10) {
        return res.render('register.hbs',{error:"Phone number is not valid"});
    }


    try {
        const userexists = await User.findOne({ email: email })
        if (userexists) {
            return res.render('register.hbs',{error:"User is already exists"});
        }
        const user = new User({ name, email, phone, work, password, cpassword });
        const token = await user.generateAuthToken();
        res.cookie('jwttoken', token, {
            expires: new Date(Date.now() + 25892000000),       // The cookie will expires after 30 yrs
            httpOnly: true
        })
        console.log(user.name);
        user.image = await getRandomImage();
        const usersaved = await user.save();
        if (usersaved) {
            console.log('user is saved')
            userLoggedIn = true;
            console.log(userLoggedIn);
            return res.redirect('/home');
        }
    } catch (error) {
        console.log(error);
    }
})


router.post('/signin',middleware, async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.render('login.hbs',{error:"Please fill the required feilds"});
    }
    try {
        const useralready = await User.findOne({ email: email })
        const ismatchpass = await bcryptjs.compare(password, useralready.password);
        const token = await useralready.generateAuthToken();
        res.cookie('jwttoken', token, {
            expires: new Date(Date.now() + 25892000000),       // The cookie will expires after 30 yrs
            httpOnly: true
        })

        if (!useralready) {
            return res.render('login.hbs',{error:"Email id not registered"});
        }
        else {
            if (ismatchpass) {
                console.log("You are successfully login")
                userLoggedIn = true;
                console.log(userLoggedIn);
                return res.redirect('/home');
            }
            else {
                return res.render('login.hbs',{error:"Password is incorrect"});
            }
        }

    } catch (error) {
        return res.render('login.hbs',{error:"Email is not registered"});
    }

})


module.exports = router;
