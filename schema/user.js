"use strict";
/*
 *  Defined the Mongoose Schema and return a Model for a User
 */
/* jshint node: true */

var mongoose = require('mongoose');


// create a schema
var userSchema = new mongoose.Schema({
    id: String,     // Unique ID identifying this user
    first_name: String, // First name of the user.
    last_name: String,  // Last name of the user.
    login_name: String,
    password: String,
    specialties: [String],
    followers: [String],
    following: [String],
    profile_picture: String
});


// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('User', userSchema);

// make this available to our users in our Node applications
module.exports = User;
