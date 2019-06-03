"use strict";
/*
 *  Defined the Mongoose Schema and return a Model for a Recommendation
 */
/* jshint node: true */

var mongoose = require('mongoose');


// create a schema
var recommendationSchema = new mongoose.Schema({
    id: String, 
    user_id: String,
    review: String,
    types: [String],
    strength: Number,
    restaurant: String
});


// the schema is useless so far
// we need to create a model using it
var Recommendation = mongoose.model('Recommendation', recommendationSchema);

// make this available to our users in our Node applications
module.exports = Recommendation;
