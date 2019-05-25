'use strict';

cs142App.controller('UserPhotosController', ['$scope', '$http', '$routeParams', '$timeout',
  function($scope, $http, $routeParams, $timeout) {
    /*
     * Since the route is specified as '/photos/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */

    //Get the user id
    var userId = $routeParams.userId;

    $http.get("/photosOfUser/" + userId)
    .success(function(response)
    {
      $http.get('/current_user')
      .success(function(secondResponse)
      {
         $scope.currentUser = secondResponse.user_id;
         //Get all the photos
         var photos = response;

         //For every photo, format the time
         for(var i = 0; i < photos.length; i++)
         {

           photos[i].formattedTime = window.cs142FormatTime(new Date(photos[i].date_time));
           //Check if there are comments and if not continue
           if(photos[i].favoritedBy.indexOf($scope.currentUser) !== -1)
           {
             photos[i].favorite = "true";
           }
           if(!photos[i].comments || photos[i].comments.length === 0)
           {
             continue;
           }

           //If there are comments, then format the time as well
           for(var j = 0; j < photos[i].comments.length; j++)
           {
              photos[i].comments[j].formattedTime = window.cs142FormatTime(new Date(photos[i].comments[j].date_time));
           }
         }
         //Make sure checkbox is unchecked for a "regular" display
         $scope.$parent.specificPicturePicked = undefined;
         $scope.message = {};
         //Add the toggle feature to move from advanced to regular display
         $scope.$parent.toggleAdvanced = function()
         {
           if(!$scope.$parent.specificPicturePicked)
           {
             window.location = "http://localhost:3000/photo-share.html#/photos/" + userId;
           }

           else
           {
             if(photos.length !== 0)
             {
               window.location = "http://localhost:3000/photo-share.html#/photos/" + userId + "/" + photos[0].id;
             }
           }
         };
         //Update titles, photos, and the location in the side bar
         $scope.main.title = 'Photos';
         $scope.$parent.advancedPicDisplay = "true";
         $http.get("/user/" + userId)
         .success(function(response)
         {
           $scope.specificUser = response;
           $scope.$parent.main.current_location = 'Viewing ' + $scope.specificUser.first_name + " " + $scope.specificUser.last_name + "'s photos";
         });

         $scope.addToFavorite = function(photo)
         {
           $http.post('/favorites/' + photo._id)
           .success(function(response)
           {
             photo.favorite = !photo.favorite;
           })
           .error(function(error)
           {
             console.log(error);
           });
         };

         $scope.removeFromFavorites = function(photo)
         {
           $http.delete('/favorites/' + $scope.currentUser + "?photo=" + photo._id)
           .success(function(response)
           {
             photo.favorite = !photo.favorite;
           })
           .error(function(error)
           {
             console.log(error);
           });
         };


         $scope.addToPhoto = function(photo_id)
         {
           if(!document.getElementById("comment_info_" + photo_id).value)
           {
             $scope.message.commentErrorMessage = "You must write something!";
           }
           else {
             var commentInfo = {"comment" : document.getElementById("comment_info_" + photo_id).value};
             document.getElementById("comment_info_" + photo_id).value = "";
             $scope.updateModel("/commentsOfPhoto/" + photo_id, commentInfo, function(response)
             {
               for(var i = 0; i < $scope.userPhotos.allPhotos.length; i++)
               {
                 if($scope.userPhotos.allPhotos[i]._id + "" === photo_id + "")
                 {
                   response.formattedTime = window.cs142FormatTime(new Date(response.date_time));
                   $scope.userPhotos.allPhotos[i].comments.push(response);
                 }
               }
               $scope.message.commentErrorMessage = "";
               angular.element(document.getElementById('listView')).scope().fillUpList();
             });
           }
         };

         $scope.deleteSpecificComment = function(commentID, photoID)
         {
           $http.delete("/comments/" + commentID)
           .success(function(response)
           {
             for(var i = 0; i < $scope.userPhotos.allPhotos.length; i++)
             {
               if($scope.userPhotos.allPhotos[i]._id === photoID)
               {
                 for(var j = 0; j < $scope.userPhotos.allPhotos[i].comments.length; j++)
                 {
                   if($scope.userPhotos.allPhotos[i].comments[j]._id === commentID)
                   {
                     $scope.userPhotos.allPhotos[i].comments.splice(j,1);
                     break;
                   }
                 }
                 break;
               }
             }
             angular.element(document.getElementById('listView')).scope().fillUpList();
           })
           .error(function(error)
           {
             alert(error);
           });
         };
         $scope.deletePhoto = function(photoID)
         {
           $http.delete("/photos/" + photoID)
           .success(function(response)
           {
             angular.element(document.getElementById('listView')).scope().fillUpList();
             for(var i = 0; i < $scope.userPhotos.allPhotos.length; i++)
             {
               if($scope.userPhotos.allPhotos[i].id + "" === photoID + "")
               {
                 $scope.userPhotos.allPhotos.splice(i,1);
                 break;
               }
             }
           });
         };
         $scope.userPhotos = {};
         console.log(photos);
         $scope.userPhotos.allPhotos = photos;
       });
    });
  }]);
