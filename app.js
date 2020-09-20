// jshint esversion:6
const express = require('express');
// const path = require('path');
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
const Student = require('./modals/Student');
const connectDB = require("./config/db");


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
passport.serializeUser(function(user, done) {
  done(null,user.id);
});

passport.deserializeUser(function(id, done) {
  Student.findById(id, function(err, user) {
    done(err, user);
  });
});





app.get('/',(req,res)=>{
  res.render('home');
});

app.get('/dashboard',(req,res)=>{
    res.render('dashboard');
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
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