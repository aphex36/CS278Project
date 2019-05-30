"use strict";
/*
 *  Defined the Mongoose Schema and return a Model for a Recommendation
 */
/* jshint node: true */

var mongoose = require('mongoose');


// create a schema
var recommendationSchema = new mongoose.Schema({
    id: String,     // Unique ID identifying this user
    user_id: mongoose.Schema.Types.ObjectId,
    review: String,
    types: [String],
    strength: Number
});


// the schema is useless so far
// we need to create a model using it
var Recommendation = mongoose.model('Recommendation', recommendationSchema);

// make this available to our users in our Node applications
module.exports = Recommendation;
