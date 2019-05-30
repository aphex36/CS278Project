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


// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var test = require('./schema/photo.js');
var Photo = test.Photo;
var Comments = test.Comment;
var HistoryInfo = require('./schema/history.js');
var SchemaInfo = require('./schema/schemaInfo.js');
var express = require('express');
var app = express();
var ObjectId = require('mongoose').Types.ObjectId;
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var fs = require('fs');
var cs142password = require('./cs142password.js');

mongoose.connect('mongodb://localhost/cs142project6');

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

//Create an index on the comments for searching later
Comments.collection.createIndex({"comment": "text"});
app.get('/search', function(request, response)
{
  //Match the comments and find the corresponding photo using a $lookup
  Comments.aggregate([{$match: {$text: {$search: request.query.q}}}, {$lookup: {from: "photos", localField: "belongsToPhoto", foreignField: "id", as: "joined"}}], function(err, foundPhotos)
  {
    if(err)
    {
      response.status(400).send(JSON.stringify(err));
      return;
    }
    var copyOfFoundPhotos = JSON.parse(JSON.stringify(foundPhotos));
    if(foundPhotos.length === 0)
    {
      response.end("[]");
      return;
    }

    //Get the photo owner's name and the commenter's name in two nested queries
    for(var i = 0; i < foundPhotos.length; i++)
    {
      (function(j)
      {
        User.findOne({"id": copyOfFoundPhotos[j].joined[0].user_id}, function(error, matchingPhoto)
        {
          User.findOne({"id": copyOfFoundPhotos[j].user_id}, function(userError, matchingUser)
          {
              //Call on a counter and return the modification
              copyOfFoundPhotos[j].full_name_of_commenter = matchingUser.first_name + " " + matchingUser.last_name;
              copyOfFoundPhotos[j].full_name_of_uploader = matchingPhoto.first_name + " " + matchingPhoto.last_name;
              if(j === foundPhotos.length - 1)
              {
                response.end(JSON.stringify(copyOfFoundPhotos));
              }
          });
        });
      })(i);
    }
  });
});

app.get('/test/:p1', function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);

    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            {name: 'user', collection: User},
            {name: 'photo', collection: Photo},
            {name: 'schemaInfo', collection: SchemaInfo}
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.count({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));
            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {
    //Get all users, but only get the first_name, last_name and id
    if(!request.session.userLoggedIn)
    {
      response.status(401).send("No authorization to make request");
      return;
    }
    User.find({}, {"first_name": 1, "last_name": 1, "id": 1}, function(err, users)
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

    if(!request.session.userLoggedIn)
    {
      response.status(401).send("No authorization to make request");
      return;
    }
    //Get a certain user that has the matching id as provided
    User.findOne({"_id": request.params.id}, {"login_name": 0, "password_digest": 0, "salt": 0}, function(err, user)
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

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function (request, response) {
    //Find all photos belonging to a user with the parameter "id"

    if(!request.session.userLoggedIn)
    {
      response.status(401).send("No authorization to make request");
      return;
    }

    Photo.find({"user_id" : request.params.id}, function(err, photos)
    {
      if(err)
      {
        //There was an error (probably the id wasn't valid) so send 400 status with error
        console.error('Error getting /photosOfUser/:id error:', err);
        response.status(400).send(JSON.stringify(err));
        return;
      }
      else
      {
        //Now get a list of all users to do some manual joins
        User.find({}, function(error, users)
        {
          if(err)
          {
            //There was an error (probably the id wasn't valid) so send 400 status with error
            console.error('Error getting all users', error);
            response.status(400).send(JSON.stringify(error));
            return;
          }

          //Create a copy of the photos (this avoids a weird error where we can't modify the response (photos) from the earlier query)
          var photosToReturn = JSON.parse(JSON.stringify(photos));

          //For each of the photos
          async.each(photosToReturn, function(photoOfUser, callback)
          {
            //For each of comments inside the photo
            async.each(photoOfUser.comments, function(singleComment)
            {
              //Find the user in the list of users that has the same id as the commenter
              var specificUser = users.filter(function(givenUser)
              {
                return givenUser.id + "" === singleComment.user_id + "";
              });

              //Now create a user object inside a comment with the same user id
              singleComment.user = {"first_name" : specificUser[0].first_name, "last_name" : specificUser[0].last_name, "commenter_id" : specificUser[0].id};
            });
            callback();
          }, function()
          {
            //After outer callback is done, return
            response.end(JSON.stringify(photosToReturn));
          });
        });
      }
    });
  });

  app.get('/commentsOfUser/:id', function (request, response) {
      if(!request.session.userLoggedIn)
      {
        response.status(401).send("No authorization to make request");
        return;
      }
      //Get the photos where the photo contains comment by the requested user id
      Photo.find({"comments" : {$elemMatch : {"user_id" : request.params.id}}}, {"comments" : 1, "file_name" : 1, "user_id" : 1},
      function(err, photos)
      {
        //Right now "photos" will contain all photos that contains a comment by the user of interest
        //It will only include the comments, file_name, and user_id field
        if(err)
        {
          //Error processing ID so send 400 status
          console.error('Error getting /commentsOfUser/:id', err);
          response.status(400).send(JSON.stringify(err));
          return;
        }
        //Create a copy (weird error doesn't let me edit original photos response object)
        var photosWithCommentsOnly = JSON.parse(JSON.stringify(photos));

        //This will contain a list of all relevant objects
        var allCommentsByUser = [];

        //For every photo the user commented on
        async.each(photosWithCommentsOnly, function(singlePhotoWithComments, callback)
        {
          //Get only relevant comments (the ones that the user commented)
          var commentsOnSpecPhoto = singlePhotoWithComments.comments.filter(function(comment)
          {
            return comment.user_id + "" === request.params.id + "";
          });

          //For each of the user comments on a specific photo
          async.each(commentsOnSpecPhoto, function(singleComment)
          {
            //Add a photoID, a url, and a by User and push it into a single comment
            singleComment.photoID = singlePhotoWithComments._id;
            singleComment.photoImageURL = singlePhotoWithComments.file_name;
            singleComment.byUser = singlePhotoWithComments.user_id;
            allCommentsByUser.push(singleComment);
          });
          callback();
        }, function(){
          //Return the array of comments
          response.end(JSON.stringify(allCommentsByUser));
        });
      });
    });

app.get('/photosAndCommentsCount/:id', function(request, response)
{
  if(!request.session.userLoggedIn)
  {
    response.status(401).send("No authorization to make request");
    return;
  }

  var numComments = 0;

  //Get all relevant comments for each post belonging to a certain user
  Photo.find(
  {"comments" :
    { $elemMatch :
        {"user_id" :  request.params.id}
    }
  },
  function(err, photos)
  {
    if(err)
    {
      //Error processing ID so send 400 status
      console.error('Error getting the comments of a post from user with user id', request.params.id, " and error: ", err);
      response.status(400).send(JSON.stringify(err));
      return;
    }
    //Now get all photos relevant to the user
    Photo.find({"user_id" :  new ObjectId(request.params.id)}, function(error, allPosts)
    {
      if(error)
      {
        //Error processing ID so send 400 status
        console.error('Error getting all photos from user with id ', request.params.id, ", got error: ", error);
        response.status(400).send(JSON.stringify(error));
        return;
      }
      //Count all comments by a user in each photo that contains his photos
      async.each(photos, function(singlePhoto, callback)
      {
        async.each(singlePhoto.comments, function(comment)
        {
          //For every single comment of that has the desired user id, incrememnt comment count
          if(comment.user_id + "" === request.params.id + "")
          {
             numComments += 1;
          }
        });
        callback();
      }, function(){
        //Send back the object
        response.end(JSON.stringify({"comments" : numComments, "photos": allPosts.length}));
      });
    });
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
      //Check that the password is or is not correct using the cs142password method with hash/salt
      var passwordIsCorrect = cs142password.doesPasswordMatch(user.password_digest, user.salt, request.body.password);
      if(!passwordIsCorrect)
      {
        console.log("password is not correct");
        response.status(400).send("Password is incorrect");
        return;
      }
      request.session.userLoggedIn = user.first_name + " " + user.last_name;
      request.session.userLoginID = user._id;

      //Create the login history
      HistoryInfo.create({
        'type': "login",
        'user_id': request.session.userLoginID,
        'photoInvolved': "",
        "comment": ""
      },
      function(historyCreationErr, historyObj)
      {
          if(historyCreationErr)
          {
            console.log("Could not add to history");
            response.status(400).send("Could not add to history");
            return;
          }
          else
          {
            response.end(JSON.stringify(user));
          }
      });
    }
    else
    {
      console.log("user wasn't found");
      response.status(400).send("No user was found with given login name");
    }

  });
});
app.get('/history', function(request, response)
{
  HistoryInfo.aggregate([{$sort: {date_time: -1}}, {$limit: 20}, {$lookup: {from: "users", localField: "user_id", foreignField: "id", as: "userInformation"}}], function(recentActivitiesError, recentActivities)
  {
    if(recentActivitiesError)
    {
      response.status(400).send(JSON.stringify(recentActivitiesError));
      return;
    }
    //Get all photos to do another join (has to be manual)
    Photo.find({}, function(photoFindErr, allPhotosFound)
    {
      if(photoFindErr)
      {
        response.status(400).send(JSON.stringify(photoFindErr));
        return;
      }
      var allActivities = [];

      //Iterate through all 20 recent activities
      var recentActivitiesModified = JSON.parse(JSON.stringify(recentActivities));
      var size = recentActivitiesModified.length;

      //For each of the activities return the imageURL or the user owner of the photo (if applicable)
      for(var i = 0; i < size; i++)
      {
          //Modify every activity
          if(recentActivitiesModified[i].type === "comment" || recentActivitiesModified[i].type === "photo")
          {
            var photoMatchingID =  allPhotosFound.filter(function(photoGiven)
            {
              return photoGiven.id === recentActivitiesModified[i].photoInvolved;
            });
            recentActivitiesModified[i].imageURL = photoMatchingID[0].file_name;
            recentActivitiesModified[i].photoOwner = photoMatchingID[0].user_id;
          }
       }
       response.json(recentActivitiesModified);
     });
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
      var passwordObj = cs142password.makePasswordEntry(request.body.password);
      User.create({
          login_name: request.body.login_name,
          first_name: request.body.first_name,
          last_name: request.body.last_name,
          occupation: request.body.occupation,
          location: request.body.location,
          description: request.body.description,
          password_digest: passwordObj.hash,
          salt: passwordObj.salt
        }, function(err, userObj)
        {
          //Created the user so now create the HistoryInfo
          userObj.id = userObj._id;
          userObj.save(function(err, updatedUser)
          {
            if(err)
            {
              response.status(400).send("Error saving the user");
            }
            HistoryInfo.create({
              type: "register",
              user_id: userObj.id,
              photoInvolved: "",
              comment: "",
            }, function(historyCreationErr, historyObj)
            {
              if(historyCreationErr)
              {
                response.status(400).send("Error adding the new user to history table");
                return;
              }
              //Update the session and return the new user
              request.session.userLoggedIn = updatedUser.first_name + " " + updatedUser.last_name;
              request.session.userLoginID = updatedUser._id;
              response.end(JSON.stringify(updatedUser));
            });
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
      else
      {
        if(request.body.keepFromHistory === "true")
        {
          response.end("[]");
          return;
        }
        HistoryInfo.create({
          'type': "logout",
          'user_id': sessionUserID,
          'photoInvolved': "",
          "comment": ""
        },
        function(historyCreationErr, historyObj)
        {
            if(historyCreationErr)
            {
              console.log("Could not add to history");
              response.status(400).send("Could not add to history");
              return;
            }
            else
            {
              response.end("[]");
            }
        });

      }
  });
});

//Take a comment and add it to a post
app.post('/commentsOfPhoto/:id', function (request, response) {
  //If there is no comment text throw this error
  if(!request.body.comment)
  {
    response.status(400).send("Cannot add an empty comment");
    return;
  }
  //Get the photo object of which photo to add the comment to
  Photo.findOne({"id" : request.params.id}, function(err, photoToUpdate)
  {
    if(err)
    {
      //Return the error (id wasn't valid)
      response.status(400).send(JSON.stringify(err));
      return;
    }
    //Create the comment object
    var currentTime = Date();
    var newComment = {"comment" : request.body.comment, "user_id" : request.session.userLoginID, "date_time": currentTime};
    var firstAndLastName = request.session.userLoggedIn.split(" ");
    var userToReturn = {"commenter_id": request.session.userLoginID, "first_name": firstAndLastName[0], "last_name": firstAndLastName[1]};
    var commentToReturn = {"comment" : request.body.comment,
                          "user" : userToReturn, "date_time": currentTime};
    var objIDCreated = new ObjectId();
    Comments.create({"comment": request.body.comment, "belongsToPhoto": request.params.id, "second_id": objIDCreated, "user_id": request.session.userLoginID, "date_time": currentTime},
    function(commError, newComment)
    {
      if(commError)
      {
        response.status(400).send(JSON.stringify(commError));
      }
      //Add the comment to the photo's comments
      photoToUpdate.comments.push(newComment);
      commentToReturn._id = newComment._id;
      //Save and return the new comment
      photoToUpdate.save(function(error)
      {
        if(error)
        {
          console.error('Error trying to add comment', error);
          response.status(400).send(JSON.stringify(error));
        }
        else
        {
          //Return the comment if no error occurred
          HistoryInfo.create({
            'type': "comment",
            'user_id': request.session.userLoginID,
            'photoInvolved': photoToUpdate._id,
            "comment": objIDCreated,
          },
          function(historyCreationErr, historyObj)
          {
              if(historyCreationErr)
              {
                console.log("Could not add comment to history");
                response.status(400).send("Could not add comment to history");
                return;
              }
              else
              {
                response.end(JSON.stringify(commentToReturn));
              }
          });
        }
      });
    });
  });
});

app.post('/photos/new', function(request,response)
{
  if(!request.session.userLoggedIn)
  {
    response.status(401).send("No authorization to make request");
    return;
  }

  var processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');
  processFormBody(request, response, function (err) {
        if (err || !request.file) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        // request.file has the following properties of interest
        //      fieldname      - Should be 'uploadedphoto' since that is what we sent
        //      originalname:  - The name of the file the user uploaded
        //      mimetype:      - The mimetype of the image (e.g. 'image/jpeg',  'image/png')
        //      buffer:        - A node Buffer containing the contents of the file
        //      size:          - The size of the file in bytes

        var currentTime = Date();
        var timestamp = currentTime.valueOf();
        var filename = 'U' +  String(timestamp) + request.file.originalname;

        fs.writeFile("./images/" + filename, request.file.buffer, function (photoSaveError) {
          if(photoSaveError)
          {
            response.status(400).send(JSON.stringify(photoSaveError));
            return;
          }

          //Photo was put inside images so now create a photo
          Photo.create(
            {"file_name": filename,
             "date_time": currentTime,
             "user_id": request.session.userLoginID,
             "comments": []
           }, function(error, newPhoto)
           {
             if(error)
             {
               response.status(400).send(JSON.stringify(error));
               return;
             }
             else {
                //If no error, add the "id" field and save the photo
                newPhoto.id = newPhoto._id;
                newPhoto.save(function(secondError, updatedPhoto)
                {
                  if(secondError)
                  {
                    response.status(400).send("Error saving the photo");
                    return;
                  }

                  HistoryInfo.create({
                    'type': "photo",
                    'user_id': request.session.userLoginID,
                    'photoInvolved': newPhoto._id,
                    "comment": "",
                  },
                  function(historyCreationErr, historyObj)
                  {
                      if(historyCreationErr)
                      {
                        console.log("Could not add photo to history");
                        response.status(400).send("Could not add photo to history");
                        return;
                      }
                      else
                      {
                        response.end(JSON.stringify(updatedPhoto));
                      }
                  });
                });
             }
           });
        });
    });
});

app.delete('/users/:userId', function(request, response)
{
  if(!request.session.userLoggedIn)
  {
    response.status(401).send("No authorization to make request");
    return;
  }

  //Remove the user
  User.remove({"id" : request.params.userId}, function(error, user)
  {
    if(error)
    {
      response.status(400).send(JSON.stringify(error));
      return;
    }

    //Remove all their photos
    Photo.find({"user_id": request.params.userId}, function(photoFindErr, photosFound)
    {
      if(photoFindErr)
      {
        response.status(400).send(JSON.stringify(photoFindErr));
        return;
      }

      var arrOfPhotoIDs = [];
      for(var i = 0; i < photosFound.length; i++)
      {
        arrOfPhotoIDs.push(photosFound[i].id + "");
      }

      //Remove all history that has comments on their photos or any actions performed from them
      HistoryInfo.remove({$or: [{"user_id": request.params.userId}, {"photoInvolved": {$in: arrOfPhotoIDs}}]}, function(removeHistoryErr, historyObj)
      {
        if(removeHistoryErr)
        {
          response.status(400).send(JSON.stringify(removeHistoryErr));
          return;
        }
        var photosCopy = JSON.parse(JSON.stringify(photosFound));
        async.each(photosCopy, function(singlePhoto, callback)
        {
          //Remove all comments in the "Comment" table that belongs to a single photo
          Comments.remove({"belongsToPhoto": singlePhoto._id}, function(photoCommentErr, response)
          {
            if(photoCommentErr)
            {
              response.status(400).send(JSON.stringify(photoCommentErr));
              return;
            }
            callback();
          });
        },
        function(err)
        {
          //Now just remove all user photos
          Photo.remove({"user_id": request.params.userId}, function(photoErr, photosLeft)
          {
            if(photoErr)
            {
              response.status(400).send(JSON.stringify(error));
              return;
            }
            //Remove all comments by them on other photos
            Photo.update({}, {$pull: {"comments": {"user_id": request.params.userId}}}, {"multi": true}, function(err, photos)
            {
              if(err)
              {
                response.status(400).send(JSON.stringify(err));
                return;
              }

              //Remove all posts they favorited (from the photo's favoritedBy arrays)
              Photo.update({}, {$pull: {"favoritedBy": {$in: [request.params.userId]}}}, {"multi": true}, function(removeFavoriteError, finalPhotos)
              {
                if(removeFavoriteError)
                {
                  response.status(400).send(JSON.stringify(removeFavoriteError));
                  return;
                }
                //Remove all comments they made (inside the comments table not the photos schema)
                Comments.remove({"user_id": request.params.userId}, function(commentError, data)
                {
                    if(commentError)
                    {
                      response.status(400).send(JSON.stringify(commentError));
                      return;
                    }
                    response.end("Success in deleting user");
                });
              });
            });
          });
        });
      });
    });
  });
});

//Delete a comment
app.delete("/comments/:commentId", function(request, response)
{
  if(!request.session.userLoggedIn)
  {
    response.status(401).send("No authorization to make request");
    return;
  }

  //Find a photo that has a comment with the specified ID
  Photo.find({"comments._id": request.params.commentId}, function(err, photos)
  {
    if(err)
    {
      response.status(400).send(JSON.stringify(err));
      return;
    }
    var editablePhotos = JSON.parse(JSON.stringify(photos));
    var desiredArr = photos[0].comments.filter(function(singleComment)
    {
      return singleComment._id + "" === request.params.commentId + "";
    });

    //Get the secondID given to them
    var secondIDGiven = desiredArr[0].second_id;

    //Return the filtered to exclude all comments with that specific id
    photos[0].comments = photos[0].comments.filter(function(singleComment)
    {
      return singleComment._id + "" !== request.params.commentId + "";
    });

    //Save those photos
    photos[0].save(function(saveError)
    {
      if(saveError)
      {
        response.status(400).send(JSON.stringify(saveError));
        return;
      }

      //Now we can have the second_id to remove the comment from the Comments schema (not just the photo schema)
      Comments.remove({"second_id": secondIDGiven}, function(commentError, data)
      {
          if(commentError)
          {
            response.status(400).send(JSON.stringify(commentError));
            return;
          }
          HistoryInfo.remove({"comment": secondIDGiven}, function(historyInfoErr, historyObj)
          {
            if(historyInfoErr)
            {
              response.status(400).send(JSON.stringify(historyInfoErr));
              return;
            }
            else
            {
              response.end("Success in deleting comment");
            }
          });
      });
    });
  });
});

//Delete a photo
app.delete("/photos/:photoId", function(request, response)
{
  if(!request.session.userLoggedIn)
  {
    response.status(401).send("No authorization to make request");
    return;
  }

  Photo.remove({"id": request.params.photoId}, function(err, photos)
  {
    if(err)
    {
      response.status(400).send(JSON.stringify(err));
      return;
    }
    Comments.remove({"belongsToPhoto": request.params.photoId}, function(commentError, data)
    {
        if(commentError)
        {
          response.status(400).send(JSON.stringify(commentError));
          return;
        }
        HistoryInfo.remove({photoInvolved: request.params.photoId}, function(historyRemoveErr, historyObj)
        {
          if(historyRemoveErr)
          {
            response.status(400).send(JSON.stringify(historyRemoveErr));
          }
          else {
            response.end("Success in deleting photo");
          }
        });
     });
  });
});

//Get all favorite photos of a user
app.get('/favorites', function(request, response)
{
  if(!request.session.userLoggedIn)
  {
    response.status(401).send("No authorization to make request");
    return;
  }

  Photo.find({"favoritedBy": request.session.userLoginID + ""}, function(err, photos)
  {
    if(err)
    {
      response.status(400).send("Could not get favorites: " + err);
      return;
    }
    response.end(JSON.stringify(photos));
  });
});

//Delete a favorite photo
app.delete("/favorites/:favoriterID", function(request, response)
{
  if(!request.session.userLoggedIn)
  {
    response.status(401).send("No authorization to make request");
    return;
  }
  Photo.update({"id": request.query.photo}, {$pull: {"favoritedBy": {$in: [request.params.favoriterID]}}}, {"multi": true}, function(err, queryRemovalMessage)
  {
    if(err)
    {
      response.status(400).send("Could not remove favorites: " + err);
      return;
    }
    response.end(JSON.stringify(queryRemovalMessage));
  });
});

//Add to the user's favorites by adding their ID in the favoritedBy array
app.post('/favorites/:photoID', function(request, response)
{
  if(!request.session.userLoggedIn)
  {
    response.status(401).send("No authorization to make request");
    return;
  }

  //Update the photos and push hte id into the visibility
  Photo.update({"id": request.params.photoID}, {$push: {favoritedBy : request.session.userLoginID}}, {"multi": true}, function(err, queryAddMessage)
  {
    if(err)
    {
      response.status(400).send("Could not add to favorites: " + err);
      return;
    }
    response.end(JSON.stringify(queryAddMessage));
  });
});

//Get the most recent picture
app.get('/mostRecentPic/:userID', function(request,response)
{
  if(request.params.userID.length !== 12 && request.params.userID.length !== 24)
  {
    response.status(400).send("Error with the id passed in, could not convert");
    return;
  }

  //Aggregate based on a match of object id, sort by decreasing time, and limit to 1
  Photo.aggregate([{$match: {"user_id": new ObjectId(request.params.userID)}},{$sort: {date_time: -1}}, {$limit: 1}], function(err, recentPicture)
  {
    if(err)
    {
      response.status(400).send("Could not get recent picture: " + err);
      return;
    }
    else {
      if(recentPicture.length === 0)
      {
        response.end(JSON.stringify({}));
      }
      else{
        response.end(JSON.stringify({"file_name": recentPicture[0].file_name, _id: recentPicture[0]._id, "date_time": recentPicture[0].date_time}));
      }
    }
  });
});

//Get the most commented picture (here just manually going through all relevant photos and comparing comments numbers)
app.get('/mostCommentedPic/:userID', function(request,response)
{
  Photo.find({"user_id": request.params.userID},
  function(err, pictures)
  {
    if(err)
    {
      response.status(400).send("Could not get most commented picture picture: " + err);
      return;
    }
    else {
      if(pictures.length === 0)
      {
        response.end(JSON.stringify({}));
      }
      else{
        var mostCommentsNumber = -1;
        var mostCommentsFileName = "";
        var mostCommentsId = "";
        for(var i = 0; i < pictures.length; i++)
        {
          if(mostCommentsNumber < pictures[i].comments.length)
          {
            mostCommentsNumber = pictures[i].comments.length;
            mostCommentsFileName = pictures[i].file_name;
            mostCommentsId = pictures[i].id;
          }
        }
        response.end(JSON.stringify({"file_name": mostCommentsFileName, _id: mostCommentsId, "num_comments": mostCommentsNumber}));
      }
    }
  });
});

//Start the server
var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});
