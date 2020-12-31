// jshint esversion:8
const mongoose = require('mongoose');
const findOrCreate = require("mongoose-findorcreate");
const passportLocalMongoose = require("passport-local-mongoose");
require("mongoose-type-email");
var bcrypt = require('bcrypt-nodejs');

const BookSchema = new mongoose.Schema({
  bookId:{
      type:String,
      required:true,
      trim:true,
      unique:true
  },
  bookName:{
      type:String,
      required:true,
  },
  qty:{
      type:Number,
      required:true,
  },
  bookAuthor:{
      type:String,
      required:true,
      },
   bookSubject:{
       type:String,
       required:true
   },
   bookTags:{
       type:[],
       required:true
   },
   filename:{
       type:String,
   }
    
});


BookSchema.plugin(findOrCreate);

module.exports = mongoose.model("Book", BookSchema);