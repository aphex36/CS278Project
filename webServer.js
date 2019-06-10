"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes  a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be implemented:
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
var async = require('async');

// //lets require/import the mongodb native drivers.
// var mongodb = require('mongodb');

// //We need to work with "MongoClient" interface in order to connect to a mongodb server.
// var MongoClient = mongodb.MongoClient;

// // Connection URL. This is where your mongodb server is running.

//(Focus on This Variable)
//var uri = 'mongodb://heroku_ktb0hw7m:cpkkrgio02l99880f70j9c939h@ds231387.mlab.com:31387/heroku_ktb0hw7m';
var uri = 'mongodb://localhost:27017/cs142project6';

//(Focus on This Variable)

var options = {
  "server" : {
    "socketOptions" : {
      "keepAlive" : 300000,
      "connectTimeoutMS" : 30000
    }
  },
  "replset" : {
    "socketOptions" : {
      "keepAlive" : 300000,
      "connectTimeoutMS" : 30000
    }
  }
}
// // Use connect method to connect to the Server
//   MongoClient.connect(url, function (err, db) {
//   if (err) {
//     console.log('Unable to connect to the mongoDB server. Error:', err);
//   } else {
//     console.log('Connection established to', url);

//     // do some work here with the database.

//     //Close connection
//     db.close();
//   }
// });

mongoose.connect(uri, options);

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Recommendation = require('./schema/recommendation.js');
var Restaurant = require('./schema/restaurant.js');
var express = require('express');
var app = express();
var ObjectId = require('mongoose').Types.ObjectId;
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var fs = require('fs');
const yelp = require('yelp-fusion');
const client = yelp.client('5npPyPB-HOKcEL4nmkyl0LBW7kGuWZPgJbIXhu-NqXzb5kaaDeR0RBYrpO3txqzyiQjUIvpEn6ySAW2noSC5mL1yb7Zi-9jYKJ-HGtZg2vV-BliQS5VAe7n7yBD-XHYx')


// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));
app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());

app.get('/', function (request, response) {
    response.send('Simple web server of files from ' + __dirname);
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {
    //Get all users, but only get the first_name, last_name and id

    /*
    if(!request.session.userLoggedIn)
    {
      response.status(401).send("No authorization to make request");
      return;
    }*/
    User.find({}, function(err, users)
    {
      if(err)
      {
        //There was an error so send a 400 status with an error
        console.error('Error getting /user/list:', err);
        response.status(400).send(JSON.stringify(err));
        return;
      }
      else
      {
        response.end(JSON.stringify(users));
      }
    });
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {

    /*if(!request.session.userLoggedIn)
    {
      response.status(401).send("No authorization to make request");
      return;
    }
    */

    //Get a certain user that has the matching id as provided
    User.findOne({"_id": request.params.id}, {"password": 0}, function(err, user)
    {
      if(err)
      {
        //Id was probably not a valid one so send a 400 status with the error
        console.error('Error getting /user/list error:', err);
        response.status(400).send(JSON.stringify(err));
        return;
      }
      else
      {
        //We found the results no problem so stringify user
        response.end(JSON.stringify(user));
      }
    });
});

app.get('/follow/:id', function (request, response) {
    User.findOne({"_id": request.params.id}, function(err, user) {

      if(err)
      {
        //Error processing ID so send 400 status
        console.error('Error trying to get user', err);
        response.status(400).send(JSON.stringify(err));
        return;
      }

      var alreadyFollowed = false;
      for (var i = 0; i < user.followers.length; i++) {
        if (request.session.userLoginID === user.followers[i]) {
          alreadyFollowed = true;
          break;
        }
      }

      if (alreadyFollowed) {
         var index = user.followers.indexOf(request.session.userLoginID);
         user.followers.splice(index, 1);
      } else {
         user.followers.push(request.session.userLoginID)
      }

      user.save(function(newErr, updatedUser){
        User.findOne({"_id": request.session.userLoginID}, function(errorFound, currentUser) {
           if (errorFound) {
              response.status(400).send(JSON.stringify(errorFound));
              return;
           }

           var alreadyInFollowing = false;
           for (var i = 0; i < currentUser.following.length; i++) {
                if (request.params.id === currentUser.following[i]) {
                  alreadyInFollowing = true;
                  break;
                }
           }

           if (alreadyInFollowing) {
             var index = currentUser.following.indexOf(request.params.id);
             currentUser.following.splice(index, 1);
           } else {
             currentUser.following.push(request.params.id)
           }

           currentUser.save(function(lastErr, finalUpdatedUser) {
              if (lastErr) {
                response.status(400).send(JSON.stringify(lastErr));
                return;
              }
              var followedObj = {"followed": !alreadyFollowed}
              response.end(JSON.stringify(followedObj));
           });
        });
      });

    })
})

app.post('/recommendation', function(request, response) {


   if(!request.session.userLoginID || !request.body.review || !request.body.strength)
   {
      console.log("here's an issue")
      response.status(400).send("Need user id, strength, and review content");
      return;
   }

   Recommendation.create({
       user_id: request.session.userLoginID,
       review: request.body.review,
       strength: request.body.strength,
       types: request.body.types,
       restaurant: request.body.restaurant
   }, function(err, reviewObj)
        {
          //Created the user so now create the HistoryInfo
          reviewObj.id = reviewObj._id;
          reviewObj.save(function(newErr, newReview)
          {

            if(newErr)
            {
              response.status(400).send("Error adding the new recommendation");
              return;
            }
            response.end(JSON.stringify(newReview));
          });
    })
});

app.post('/yelp/load', function(request, response){

  client.search({
        latitude: 37.4275,
        longitude: -122.1697,
        radius: 3000
  }).then(totalResponse => {

      var numResults = totalResponse.jsonBody.total;
      Restaurant.remove({}, function(err, restaurantsFound) {

        for (var j = 0; j < numResults; j += 50) {
            function msleep(n) {
                Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
            }
            function sleep(n) {
                msleep(n*1000);
            }
            sleep(5)
            client.search({
              latitude: 37.4275,
              longitude: -122.1697,
              radius: 3000,
              limit: 50,
              offset: j
            }).then(currResponse => {
                var restaurants = []
                for (var i = 0; i < currResponse.jsonBody.businesses.length; i++) {
                   var currBusiness = currResponse.jsonBody.businesses[i]
                   var allCategories = []
                   if (currBusiness.categories) {
                     for (var k = 0; k < currBusiness.categories.length; k++) {
                         allCategories.push(currBusiness.categories[k].title.toLowerCase())
                     }
                   }
                   restaurants.push({"id": currBusiness.id, "address": currBusiness.location.display_address.join(", "), "name": currBusiness.name,
                                     "latitude": currBusiness.coordinates.latitude, "categories": allCategories, "longitude": currBusiness.coordinates.longitude});
                }
                Restaurant.create(restaurants, function(error, newData) {
                    if(error)
                    {
                      response.status(400).send("Error adding full yelp dataset");
                      return;
                    }

                    if (j + 50 >= numResults) {
                      response.end(JSON.stringify({"loaded": true}));
                    }
              })
            }).catch(e => {
              response.status(400).send(e);
              return;
            });
          }
        });
      });

});


app.get('/recommendation/list', function(request, response) {

   Recommendation.find({}, function(err, recommendations)
        {
          //Created the user so now create the HistoryInfo
          if(err)
          {
            //There was an error so send a 400 status with an error
            console.error('Error getting /recommendation/list:', err);
            response.status(400).send(JSON.stringify(err));
            return;
          }
          else
          {
            response.end(JSON.stringify(recommendations));
          }
    });
});

app.get('/recommendation/:id', function(request, response) {

   Recommendation.findOne({"_id": request.params.id}, function(err, recommendation_found)
    {
      if(err)
      {
        //Id was probably not a valid one so send a 400 status with the error
        console.error('Error getting single recommendation_found, error:', err);
        response.status(400).send(JSON.stringify(err));
        return;
      }
      else
      {
        //We found the results no problem so stringify user
        response.end(JSON.stringify(recommendation_found));
      }
    });
});

app.get('/recommendation/user/:id', function(request, response) {
    Recommendation.find({"user_id": request.params.id}, function(err, recs_found) {
      if(err)
      {
        //Id was probably not a valid one so send a 400 status with the error
        console.error('Error getting user recommendations, error:', err);
        response.status(400).send(JSON.stringify(err));
        return;
      }
      else
      {

        var restaurant_ids = []
        for (var i = 0; i < recs_found.length; i++) {
           restaurant_ids.push(recs_found[i].restaurant)
        }
        Restaurant.find({"id": { $in: restaurant_ids}}, function(new_err, restaurants_found) {

            if (new_err) {
               response.status(400).send(JSON.stringify(new_err));
               return;
            }

            var restaurantIdToObj = {}
            for (var j = 0; j < restaurants_found.length; j++) {
                restaurantIdToObj[restaurants_found[j].id] = restaurants_found[j]
            }

            var modified_recs = JSON.parse(JSON.stringify(recs_found))
            for (var j = 0; j < modified_recs.length; j++) {
                modified_recs[j].name = restaurantIdToObj[modified_recs[j].restaurant].name
                modified_recs[j].address = restaurantIdToObj[modified_recs[j].restaurant].address
            }
            response.end(JSON.stringify(modified_recs));
        })
      }
    });
});

app.get('/search', function(request, response) {

    var globalMap = {}
    Restaurant.find({
        $text: { $search: request.query.q}
    }, function(err, restaurants) {
      if (err) {
        response.status(400).send(JSON.stringify(err));
      }
      for (var i = 0; i < restaurants.length; i++) {
          globalMap[restaurants[i].id] = restaurants[i]
      }
      Restaurant.find({"categories": {$in: [request.query.q]}}, function(newErr, additionalRestaurants) {
          for (var i = 0; i < additionalRestaurants.length; i++) {
              globalMap[additionalRestaurants[i].id] = additionalRestaurants[i]
          }

          var unionedRestaurants = []
          for (var key in globalMap) {
              unionedRestaurants.push(globalMap[key])
          }
          response.end(JSON.stringify(unionedRestaurants));
      })
    });
});


app.get('/recommendation/restaurant/:restaurantId', function(request, response) {
    Recommendation.find({"restaurant": request.params.restaurantId}, function(err, recs_found){
      if(err)
      {
        //Id was probably not a valid one so send a 400 status with the error
        console.error('Error getting restaurant recommendations, error:', err);
        response.status(400).send(JSON.stringify(err));
        return;
      }
      else
      {
        var modified_recs = JSON.parse(JSON.stringify(recs_found))

        var user_ids = []
        for (var i = 0; i < modified_recs.length; i++) {
            user_ids.push(modified_recs[i].user_id)
        }

        var userIdToName = {}
        User.find({"id": { $in: user_ids}}, function(new_err, users_found) {
            if(new_err)
            {
              //Id was probably not a valid one so send a 400 status with the error
              console.error('Error getting restaurant recommendations with user names, error:', new_err);
              response.status(400).send(JSON.stringify(new_err));
              return;
            }

            for (var j = 0; j < users_found.length; j++) {
                userIdToName[users_found[j].id] = users_found[j].first_name + " " + users_found[j].last_name
            }

            for (var j = 0; j < modified_recs.length; j++) {
                 modified_recs[j].full_name = userIdToName[modified_recs[j].user_id]
            }
            response.end(JSON.stringify(modified_recs));

        })

      }
    });
});


app.get('/yelp/id/:id', function(request, response){

    client.business(request.params.id).then(currResponse => {
      response.end(JSON.stringify(currResponse.jsonBody));
    }).catch(e => {
      response.status(400).send(JSON.stringify(e));
    });
});

app.get('/restaurants/list',  function(request, response) {
    Restaurant.find({}, function(err, restaurants_found)
    {
      if(err)
      {
        console.error('Error getting all restaurants, error:', err);
        response.status(400).send(JSON.stringify(err));
        return;
      }
      else
      {
        //We found the results no problem so stringify user
        response.end(JSON.stringify(restaurants_found));
      }
    });
})

app.get('/restaurant/id/:id',  function(request, response) {
    Restaurant.find({"id": request.params.id}, function(err, restaurants_found)
    {
      if(err)
      {
        console.error('Error getting all restaurants, error:', err);
        response.status(400).send(JSON.stringify(err));
        return;
      }
      else
      {
        //We found the results no problem so stringify user
        response.end(JSON.stringify(restaurants_found));
      }
    });
})

app.get('/rank/users', function(request, response) {

  if(!request.session.userLoggedIn)
  {
    response.status(401).send("No authorization to make request");
    return;
  }


  var currUserId = request.session.userLoginID
  var cosineSimilarity = function(arr1, arr2) {
     var dictionaryOne = {}
     var dictionaryTwo = {}
     for (var i = 0; i < arr1.length; i++) {
        if (!(arr1[i] in dictionaryOne)) {
            dictionaryOne[arr1[i]] = 0
        }
        dictionaryOne[arr1[i]] += 1
     }

     for (var i = 0; i < arr2.length; i++) {
        if (!(arr1[i] in dictionaryTwo)) {
            dictionaryTwo[arr2[i]] = 0
        }
        dictionaryTwo[arr2[i]] += 1
     }

     var firstLength = 0
     var secondLength = 0
     for (var prop in dictionaryOne) {
         firstLength += dictionaryOne[prop] * dictionaryOne[prop]
     }

     for (var prop in dictionaryTwo) {
         secondLength += dictionaryTwo[prop] * dictionaryTwo[prop]
     }

     if (firstLength == 0 || secondLength == 0) {
         return 0;
     }

     firstLength = Math.pow(firstLength, 0.5)
     secondLength = Math.pow(secondLength, 0.5)

     var dotProduct = 0
     for (var prop in dictionaryOne) {
         if (prop in dictionaryTwo) {
            dotProduct += dictionaryOne[prop]*dictionaryTwo[prop]
         }
      }
      return (dotProduct/(firstLength*secondLength))
  }

  // Takes all recommendations from 1 user to convert into vector
  var convertRecommendationVectors = function(recs) {
      var newArr = []

      for (var k = 0; k < recs.length; k++) {
        var rec = recs[k]
        for (var i = 0; i < rec.types.length; i++) {
            for (var j = 0; j < rec.strength; j++) {
                newArr.push(rec.types[i])
            }
        }
      }
      return newArr;
  }

  var scores = {}
  var finalScores = []
  var recommendations_used = {}

  User.find({}, {"password": 0}, function(err, users) {
      var currentUser;
      var userScores = JSON.parse(JSON.stringify(users))
      for (var i = 0; i < userScores.length; i++) {
        if (currUserId === userScores[i].id) {
          currentUser = userScores[i]
          break
        }
      }

      for (var i = 0; i < userScores.length; i++) {
        if (currUserId === userScores[i].id) {
          continue
        } else {
          scores[userScores[i].id] = cosineSimilarity(currentUser.specialties, userScores[i].specialties)
        }
      }

      Recommendation.find({}, function(err, recommendations)
      {
            if(err)
            {
              //There was an error so send a 400 status with an error
              console.error('Error getting /recommendation/list:', err);
              response.status(400).send(JSON.stringify(err));
              return;
            }

            for (var i = 0; i < recommendations.length; i++) {
               var recUserID = recommendations[i].user_id
               if (!(recUserID in recommendations_used)) {
                   recommendations_used[recUserID] = []
               }
               var review_obj = {"strength": recommendations[i].strength, "types": recommendations[i].types}
               recommendations_used[recUserID].push(review_obj)
            }

            for (var i = 0; i < userScores.length; i++) {
              if (currUserId === userScores[i].id) {
                continue
              } else {
                if (!(currUserId in recommendations_used) || recommendations_used[currUserId].length == 0) {
                  userScores[i].score = scores[userScores[i].id]
                  finalScores.push(userScores[i])
                  continue
                }

                if (!(userScores[i].id in recommendations_used) || recommendations_used[userScores[i].id].length == 0) {
                    userScores[i].score = scores[userScores[i].id]
                    finalScores.push(userScores[i])
                    continue
                }

                var currRecs = convertRecommendationVectors(recommendations_used[currUserId])
                var otherRecs = convertRecommendationVectors(recommendations_used[userScores[i].id])
                scores[userScores[i].id] += cosineSimilarity(currRecs, otherRecs)
                userScores[i].score = scores[userScores[i].id]
                finalScores.push(userScores[i])
              }
            }

            response.end(JSON.stringify({"results": finalScores}))
      })
  });
});

app.post('/admin/login', function(request, response)
{
  User.findOne({'login_name': request.body.login_name}, function(err, user)
  {
    if(err)
    {
      //Error processing ID so send 400 status
      console.error('Error checking if user exists', err);
      response.status(400).send(JSON.stringify(err));
      return;
    }
    if(user)
    {
      //Check that the password is or is not correct
      if(user.password !== request.body.password)
      {
        console.log("password is not correct");
        response.status(400).send("Password is incorrect");
        return;
      }
      request.session.userLoggedIn = user.first_name + " " + user.last_name;
      request.session.userLoginID = user._id;
      response.end(JSON.stringify(user));
    }
    else
    {
      console.log("user wasn't found");
      response.status(400).send("No user was found with given login name");
    }

  });
});

app.post('/user', function(request, response)
{
  if(!request.body.first_name || !request.body.last_name)
  {
    response.status(400).send("Either the first or the last name is not specified");
    return;
  }

  User.find({'login_name' : request.body.login_name}, function(err, users)
  {
    if(err)
    {
      console.log(err);
      response.status(400).send("Error checking users with a type of login name");
      return;
    }
    if(users.length === 0)
    {
      //Get the hash and salt of a password
      User.create({
          login_name: request.body.login_name,
          first_name: request.body.first_name,
          last_name: request.body.last_name,
          specialties: request.body.specialties,
          password: request.body.password,
          followers: [],
          following: []
        }, function(err, userObj)
        {
          //Created the user so now create the HistoryInfo
          userObj.id = userObj._id;
          userObj.save(function(newErr, updatedUser)
          {

            if(newErr)
            {
              response.status(400).send("Error adding the new user");
              return;
            }
            //Update the session and return the new user
            request.session.userLoggedIn = updatedUser.first_name + " " + updatedUser.last_name;
            request.session.userLoginID = updatedUser._id;
            response.end(JSON.stringify(updatedUser));
          });
        });
    }
    else {
      response.status(400).send("Username is taken");
    }
  });
});

//Check if the request has anyone logged in currently
app.get('/current_user', function(request,response)
{
  if(!request.session.userLoggedIn)
  {
    response.end("No user logged in");
  }
  else
  {
    response.end(JSON.stringify({'user' : request.session.userLoggedIn, 'user_id' : request.session.userLoginID}));
  }
});

//Logout a user if they were logged in and send a 400 request if not
app.post('/admin/logout', function(request, response)
{
  if(!request.session.userLoggedIn)
  {
    response.status(400).send("No user was logged in the first place");
    return;
  }
  var sessionUserID = request.session.userLoginID;
  request.session.destroy(function (err) {
      if(err)
      {
        response.status(400).send("Could not add to history info");
        return;
      }
      response.end("[]");
  });
});

//Start the server
var server = app.listen(process.env.PORT || 3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});
