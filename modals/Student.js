// jshint esversion:8
const mongoose = require('mongoose');
const findOrCreate = require("mongoose-findorcreate");
const passportLocalMongoose = require("passport-local-mongoose");
require("mongoose-type-email"); 

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: false,
  },
  displayName: {
    type: String,
    required: false,
  },
  firstName: {
    type: String,
    required: false,
  },
  lastName: {
    type: String,
    required: false,
  },
  username: {
    type: String,
    unique: true,
  },
  email: {
    type: mongoose.SchemaTypes.Email,
    unique:true,
  },
  password: {
    type: String,
    unique: true,
  },
  books: {
    bookId: {
      type: String,
      required: false,
    },
    bookName: {
      type: String,
      required: false,
    },
    bookAuthor: {
      type: String,
      required: false,
    },
    bookTopic: {
      type: String,
      required: false,
    },
    deadLine: {
      type: Date,
      required: false,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(findOrCreate);

module.exports = mongoose.model("User", UserSchema);