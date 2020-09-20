// jshint esversion:8
const mongoose = require('mongoose');
const findOrCreate = require("mongoose-findorcreate");
const passportLocalMongoose = require("passport-local-mongoose");
require("mongoose-type-email");

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: mongoose.SchemaTypes.Email,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  books: {
    bookId: {
      type: String,
      required: true,
    },
    bookName: {
      type: String,
      required: true,
    },
    bookAuthor: {
      type: String,
      required: true,
    },
    bookTopic: {
      type: String,
      required: true,
    },
    deadLine: {
      type: Date,
      required: true,
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