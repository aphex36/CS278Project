"use strict";

/*
 * Defined the Mongoose Schema and return a Model for a Photo
 */

/* jshint node: true */

var mongoose = require('mongoose');

var historySchema = new mongoose.Schema({
    type: String,
    user_id: String,
    photoInvolved: String,
    comment: String,
    date_time: {type: Date, default: Date.now}
});

var HistoryInfo = mongoose.model('HistoryInfo', historySchema);

// make this available to our photos in our Node applications
module.exports = HistoryInfo;
