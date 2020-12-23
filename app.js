// jshint esversion:9
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
const Book = require('./modals/Book');
const {connectDB,gfs} = require("./config/db");
var flash = require('connect-flash');
var async = require('async');
var nodemailer = require('nodemailer');
var crypto = require('crypto');
var multer = require('multer');
const gridFsStorage = require('multer-gridfs-storage');
const cors = require('cors');





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



// Use cors api
app.use(cors());


//Configure storage details for multer upload
var storage = multer.diskStorage({
  
  //Set the upload destination through a function with null/no callback
  destination:function(req,file,cb)
  {
    cb(null,'./public/uploads');
  },
  //Set the filename with another function having null/no callback again as we are sure of the event
  filename(req,file,cb)
  {
       cb(null,file.originalname+'_'+Date.now());
  }
});
//Activate multer with the configured storage details
var upload = multer({storage:storage}).single('bookUpload');

// express session
app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);


// Flash
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());


// Connect Mongo Cloud
connectDB();

// use createStrategy method of model
passport.use(Student.createStrategy());


// use static serialize and deserialize of model for passport session support
passport.serializeUser(Student.serializeUser());
passport.deserializeUser(Student.deserializeUser());

app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.get('/',(req, res)=>{
    res.redirect("/404");
});

app.get('/home',(req,res)=>{
  if(req.isAuthenticated()) res.render('home');
  else res.redirect('/404');
  
});

app.get('/dashboard',(req,res)=>{
  // console.log(req.user);
  if(req.isAuthenticated()) res.render('dashboard',{name:req.user.firstName});
  else res.redirect('/login');
});

// Book search results
app.post('/dashboard',(req,res)=>{
  // console.log(req.user);
  if (req.isAuthenticated())
  {
    var queryTerm = req.body.bookQuery;
    // console.log(queryTerm);
    var queryArr = queryTerm.split(' ');
    // console.log(queryArr);
    Book.find({bookTags:{$in:queryArr}},(err,books)=>{
      if(books)
      {
        // console.log(books);
        req.app.locals.resultArr = books;
      }
      else if(!books)
      {
        // console.log("No book found!");
      }

      if(err) console.log(err);

      res.redirect('/bookSearchRes');
    });
  } 
  else res.redirect('/login');

  

});

app.get('/bookSearchRes',(req,res)=>{
  // console.log(req.user);
  
  // results = req.params.results
  var resultArr = req.app.locals.resultArr;
  if (req.isAuthenticated()) res.render('bookSearchRes', { name: req.user.firstName, results:resultArr});
  else res.redirect('/login');
  // console.log(resultArr);
});


app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});


// app.post("/register",(req,res)=>{
//     var username = req.body.username;
//   var email = req.body.email;
//   var password = req.body.password;
//   var confirmPassword = req.body.confirmpassword;


//   Student.findOne({username: username},function(err,foundUser){
//     if(err) console.log(err);
//     else if(foundUser)
//     {  
//       res.redirect("/login");  
//     }
//     else if(!foundUser)
//     {
//        var ind = email.indexOf("@");

//        var domain = email.slice(ind + 1,email.length);
//       //  console.log(domain);
         
//            if (password === confirmPassword && domain==="nitp.ac.in") {
//             Student.register(
//               { username: username,email:email,password:password },
//               req.body.password,
//               function (err, user) {
//                 if (err) {
//                   console.log(err);
//                   res.redirect("/register");
//                 } else {
//                   passport.authenticate("local")(req, res, function () {
//                     res.redirect("/dashboard");
//                   });
//                 }
//               }
//             );
//          } else res.redirect("/register");
       
//     }

//   });
//   console.log(username+ " " + email + " " + password);
// });


app.post("/register",(req,res)=>{
    var username = req.body.username;
  var email = req.body.email;
  var password = req.body.password;
  var confirmPassword = req.body.confirmpassword;
  var firstName = req.body.firstName;
  var lastName = req.body.lastName;

  Student.findOne(
    {
      username: username,
      email:email,
      password:password,
      firstName: firstName,
      lastName:lastName
    },

    function(err,foundUser){
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
               {
                 username: username,
                 email: email,
                 password: password,
                 firstName: firstName,
                 lastName: lastName},
              req.body.password,
              function (err, user) {
                if (err) {
                  console.log(err);
                  res.redirect("/register");
                } 
                else {
                  async.waterfall([
                    function (done) {
        crypto.randomBytes(20, function (err, buf) {
          var token = buf.toString("hex");
          console.log(token);
          done(err, token);
        });
      },
      function (token, done) {
        Student.findOne({ email: req.body.email }, function (err, user) {
          if (!user) {
            req.flash("error", "No account with that email address exists.");
            return res.redirect("/register");
          }

          user.activationToken = token;
          user.activationTokenExpires = Date.now() + 3600000; // 1 hour later

          user.save(function (err) {
            done(err, token, user);
          });
        });
      },
      function (token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: "devnetlabs@gmail.com",
            pass: process.env.GMAILPW,
          },
        });
        var mailOptions = {
          to: user.email,
          from: "devnetlabs@gmail.com",
          subject: "Online Library Password Reset",
          text:
            "You are receiving this because you (or someone else) have requested the register your account for our library.\n\n" +
            "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
            "http://" +
            req.headers.host +
            "/active/" +
            token +
            "\n\n" +
            "If you did not request this, please ignore this email and your temporary account will expire in 1 hour.\n",
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          console.log("mail sent");
          req.flash(
            "success",
            "An e-mail has been sent to " + user.email +" with further instructions."
            );
          done(err, "done");
        });
      },
      function(){
        res.redirect("/inactive");
      },
                  ]);
                  
                }
                  
               } );
    }
       else res.redirect("/register");
  
         } 
       else res.redirect("/register");

        

  });
  console.log(username+ " " + email + " " + password);
});


app.get("/inactive",function(req,res){
  res.render("inactive");
});

app.get("/active/:token",function(req,res){
  Student.findOne(
    {
      activationToken: req.params.token,
      activationTokenExpires: { $gt: Date.now() },
    },
    function (err, user) {
      if (!user) {
        req.flash("error", "Activation token is invalid or has expired.");
         Student.findOne(
          {
            activationToken:req.params.token,
          },
          function(err,user)
          {
            if(!user){req.flash("error", "Activation token is invalid or has expired.");}
            else{
              Student.deleteOne({activationToken:req.params.token},function(err){
                       if(err) console.log(err);
              });
            }
          }
        );
        return res.redirect("/register");
      }
      else
      {
        return res.render("active" ,{ token: req.params.token });
      }  
    }
  );
});

app.post("/active/token",function(req,res){
   async.waterfall(
    [
      function (done) {
        Student.findOne(
          {
            activationToken: req.params.token,
            activationTokenExpires: { $gt: Date.now() },
          },
          function (err, user) {
            if (!user) {
              req.flash(
                "error",
                "Activation token is invalid or has expired."
              );
               Student.findOne(
          {
            activationToken:req.params.token,
          },
          function(err,user)
          {
            if(!user){req.flash("error", "Activation token is invalid or has expired.");}
            else{
              Student.deleteOne({activationToken:req.params.token},function(err){
                       if(err) console.log(err);
              });
            }
          }
        );
              return res.redirect("back");
            }
              
                user.activationToken = undefined;
                user.activationTokenExpires = undefined;
                user.isActive = true;

                user.save(function (err) {
                  req.logIn(user, function (err) {
                    done(err, user);
                  });
                 } );
          });
             
          },
      function (user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: "devnetlabs@gmail.com",
            pass: process.env.GMAILPW,
          },
        });
        var mailOptions = {
          to: user.email,
          from: "devnetlabs@gmail.com",
          subject: "Your account has been activated",
          text:
            "Hello,\n\n" +
            "This is a confirmation that your account has been registered." +
            user.email +
            " has just been changed.\n",
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          req.flash("success", "Success! Your account has been activated.");
          done(err);
        });
      },
    ],
    function (err) {
      res.redirect("/dashboard");
    }
  );
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
        // console.log(req.user);
        if(req.user.isAdmin===true) res.redirect("/admin");
        else res.redirect("/dashboard");
      });
    }
  });
});

// Logout
app.get("/logout", function (req, res) {
  req.logout();
  req.flash('succces',"See you later");
  res.redirect("/");
});


// Forgot
app.get("/forgot",function(req,res){
  res.render("forgot");
});

app.post("/forgot",function(req,res,next){
  async.waterfall(
    [
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          var token = buf.toString("hex");
          done(err, token);
        });
      },
      function (token, done) {
        Student.findOne({ email: req.body.email }, function (err, user) {
          if (!user) {
            req.flash("error", "No account with that email address exists.");
            return res.redirect("/forgot");
          }

          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour later

          user.save(function (err) {
            done(err, token, user);
          });
        });
      },
      function (token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: "devnetlabs@gmail.com",
            pass: process.env.GMAILPW,
          },
        });
        var mailOptions = {
          to: user.email,
          from: "devnetlabs@gmail.com",
          subject: "Online Library Password Reset",
          text:
            "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
            "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
            "http://" +
            req.headers.host +
            "/reset/" +
            token +
            "\n\n" +
            "If you did not request this, please ignore this email and your password will remain unchanged.\n",
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          console.log("mail sent");
          req.flash(
            "success",
            "An e-mail has been sent to " + user.email +" with further instructions."
            );
          done(err, "done");
        });
      },
    ],
    function (err) {
      if (err) return next(err);
      res.redirect("/forgot");
    }
  );
});

// Reset 
app.get("/reset/:token", function (req, res) {
  Student.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    },
    function (err, user) {
      if (!user) {
        req.flash("error", "Password reset token is invalid or has expired.");
        return res.redirect("/forgot");
      }
      res.render("reset", { token: req.params.token });
    }
  );
});


app.post("/reset/:token", function (req, res) {
  async.waterfall(
    [
      function (done) {
        Student.findOne(
          {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
          },
          function (err, user) {
            if (!user) {
              req.flash(
                "error",
                "Password reset token is invalid or has expired."
              );
              return res.redirect("back");
            }
            if (req.body.password === req.body.confirm) {
              user.setPassword(req.body.password, function (err) {
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                user.save(function (err) {
                  req.logIn(user, function (err) {
                    done(err, user);
                  });
                });
              });
            } else {
              req.flash("error", "Passwords do not match.");
              return res.redirect("back");
            }
          }
        );
      },
      function (user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: "devnetlabs@gmail.com",
            pass: process.env.GMAILPW,
          },
        });
        var mailOptions = {
          to: user.email,
          from: "devnetlabs@gmail.com",
          subject: "Your password has been changed",
          text:
            "Hello,\n\n" +
            "This is a confirmation that the password for your account " +
            user.email +
            " has just been changed.\n",
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          req.flash("success", "Success! Your password has been changed.");
          done(err);
        });
      },
    ],
    function (err) {
      res.redirect("/dashboard");
    }
  );
});

// Admin
app.get('/admin',(req,res)=>{
  // console.log(req.user);
  if(req.isAuthenticated()) res.render('admin',{name:req.user.firstName});
  else res.redirect('/login');
});


// RegisterBook
app.get('/registerBook',(req,res)=>{
  if(req.isAuthenticated() && (req.user.isAdmin))
  {
    res.render('registerBook',{name:req.user.firstName});
  }
  else res.redirect('/login');
});

app.post('/registerBook',(req,res)=>{
  // console.log(req.body);
  const tags = req.body.bookTags;
  const tagArr = tags.split(',');
  // console.log(tagArr);
  const bookId = req.body.bookId;
  const bookName = req.body.bookName;
  const qty = req.body.qty;
  const bookAuthor = req.body.bookAuthor;
  const bookSubject = req.body.bookSubject;

   Book.findOne({bookId:bookId},async (err,book)=>{
     try {
        if(book)
    { 
      req.flash('Book is already registered');
      res.redirect('/admin');
    }
    else if(!book)
    {
      if(bookId==null || bookName==null || qty==null || bookAuthor==null || bookSubject==null)
      {
        alert('Please enter all the fields');
      }
      else 
      {
        mybook = new Book({
          bookId:bookId,
          bookName:bookName,
          bookAuthor:bookAuthor,
          qty:qty,
          bookSubject:bookSubject,
          bookTags:tagArr
        });

        await mybook.save();
        res.redirect('/admin');
      }
    }
  } catch (error) {
       console.log(error);
     }
   });
     
});

// Server error
app.get('/500',(req,res)=>{
  res.render('500');
});

// Resource not found
app.get('/404',(req,res)=>{
  res.render('404');
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



