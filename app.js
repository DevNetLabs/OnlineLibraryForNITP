// jshint esversion:6
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const morgan = require('morgan');
// const exphbs = require('express-handlebars');
// const methodOverride = require("method-override");
const passport = require("passport");
const session = require("express-session");
// const MongoStore = require("connect-mongo")(session);
// const bcrypt = require('bcrypt');
const Student = require('./modals/Student');
const connectDB = require("./config/db");


// Salt rounds for bcrypt = 9 =>20 hash/sec
// const saltRounds = 9;

// Load config
dotenv.config({path:'./config/config.env'});

const app = express();

// ejs
app.set('view engine','ejs');
// Body parser
app.use(bodyParser.urlencoded({ extended: true }));
// Static folder
app.use(express.static("public"));

// express session
app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);


app.use(passport.initialize());
app.use(passport.session());


// Connect Mongo Cloud
connectDB();

// use createStrategy method of model
passport.use(Student.createStrategy());


// use static serialize and deserialize of model for passport session support
passport.serializeUser(Student.serializeUser());
passport.deserializeUser(Student.deserializeUser());




app.get('/',(req,res)=>{
  res.render('home');
});

app.get('/dashboard',(req,res)=>{
  // console.log(req.user);
  if(req.isAuthenticated()) res.render('dashboard');
  else res.redirect('/login');
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});


app.post("/register",(req,res)=>{
    var username = req.body.username;
  var email = req.body.email;
  var password = req.body.password;
  var confirmPassword = req.body.confirmpassword;


  Student.findOne({username: username},function(err,foundUser){
    if(err) console.log(err);
    else if(foundUser)
    {  
      res.redirect("/login");  
    }
    else if(!foundUser)
    {
       var ind = email.indexOf("@");

       var domain = email.slice(ind + 1,email.length);
       console.log(domain);
         
           if (password === confirmPassword && domain==="nitp.ac.in") {
            Student.register(
              { username: username,email:email,password:password },
              req.body.password,
              function (err, user) {
                if (err) {
                  console.log(err);
                  res.redirect("/register");
                } else {
                  passport.authenticate("local")(req, res, function () {
                    res.redirect("/dashboard");
                  });
                }
              }
            );
         } else res.redirect("/register");
       
    }

  });
  console.log(username+ " " + email + " " + password);
});


app.post("/login",(req,res)=>{
  const user = new Student({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) console.log(err);
    else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/dashboard");
      });
    }
  });
});


// Logging
if(process.env.NODE_ENV === 'development') 
{
    app.use(morgan('dev'));
}


const PORT = process.env.PORT || 3000;
app.listen(
    PORT,
    console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);



