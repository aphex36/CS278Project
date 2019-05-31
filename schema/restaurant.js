"use strict";
/*
 *  Defined the Mongoose Schema and return a Model for a Recommendation
 */
/* jshint node: true */

var mongoose = require('mongoose');


// create a schema
var restaurantSchema = new mongoose.Schema({
    id: String, // Yelp one
    address: String,
    name: String,
    latitude: Number,
    longitude: Number
});


// the schema is useless so far
// we need to create a model using it
var Restaurant = mongoose.model('Restaurant', restaurantSchema);

// make this available to our users in our Node applications
module.exports = Restaurant;
