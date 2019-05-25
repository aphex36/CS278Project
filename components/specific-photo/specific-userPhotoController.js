'use strict';

cs142App.controller('SpecificUserPhotoController', ['$scope', '$http', '$routeParams', '$timeout',
  function($scope, $http, $routeParams, $timeout) {

    //This controller handles specific user photos with the album scroller
    //Get the user id
    var userId = $routeParams.userId;

    //If there was a photo number to go to specified store it in a temporary var
    var specificPhotoIndex;

    //Check if user wanted a display of a gallery or not
    var displayGallery = $routeParams.advanced_display;
    var photos;

    //If there is a gallery option wanted

    //Display the other View
    //Get the photo index specified from the url and get that ith Photo
    $scope.displayNormal = undefined;
    $scope.message = {};
    $scope.$parent.FetchModel("/photosOfUser/" + userId, function(response)
    {
      var allPhotosGiven = response;
      var desiredPhotoID = $routeParams.photoId;
      var previousPhotoID;
      var nextPhotoID;
      for(var l = 0; l < allPhotosGiven.length; l++)
      {
        if(allPhotosGiven[l].id === desiredPhotoID)
        {
          specificPhotoIndex = l;
          if(l > 0)
          {
            previousPhotoID = allPhotosGiven[l-1].id;
          }
          if(l < allPhotosGiven.length - 1)
          {
            nextPhotoID = allPhotosGiven[l+1].id;
          }
        }
      }

      photos = [allPhotosGiven[specificPhotoIndex]];

      //Format the time of the photo itself and the comments
      photos[0].formattedTime = window.cs142FormatTime(new Date(photos[0].date_time));
      if(photos[0].comments && photos[0].length !== 0)
      {
        $scope.specificPostComments = "true";
        for(var k = 0; k < photos[0].comments.length; k++)
        {
          photos[0].comments[k].formattedTime = window.cs142FormatTime(new Date(photos[0].comments[k].date_time));
        }
      }

      //Disable previous and next buttons if element is the first or last element respectively
      if(specificPhotoIndex === 0)
      {
        $scope.disablePrev = "true";
      }
      if(specificPhotoIndex === allPhotosGiven.length - 1)
      {
        $scope.disableNext = "true";
      }

      //Use the specified image url
      $scope.currentPostImage = photos[0].file_name;
      $scope.switchImage = function(direction)
      {

        //Called everytime the next or prev button is called
        var newPhoto;

        //Get the next id and set the url
        if(direction === "next")
        {
          newPhoto = nextPhotoID;
        }
        else
        {
          newPhoto = previousPhotoID;
        }

        //Set the newest url
        window.location = "http://localhost:3000/photo-share.html#/photos/" + userId + "/" + newPhoto;
      };

      //For every photo, format the time
      for(var i = 0; i < photos.length; i++)
      {
        photos[i].formattedTime = window.cs142FormatTime(new Date(photos[i].date_time));
        //Check if there are comments and if not continue
        if(!photos[i].comments || photos[i].length === 0)
        {
          continue;
        }

        //If there are comments, then format the time as well
        for(var j = 0; j < photos[i].comments.length; j++)
        {
          photos[i].comments[j].formattedTime = window.cs142FormatTime(new Date(photos[i].comments[j].date_time));
        }
      }

      //Make sure checkbox is checked for this page (since it is a specific )
      $scope.$parent.specificPicturePicked = true;

      $scope.$parent.toggleAdvanced = function()
      {
        if(!$scope.$parent.specificPicturePicked)
        {
          window.location = "http://localhost:3000/photo-share.html#/photos/" + userId;
        }

        else
        {
          window.location = "http://localhost:3000/photo-share.html#/photos/" + userId + "/" + photos[0].id;
        }
      };

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
      $scope.deletePhoto = function(photoID, photoUserID)
      {
        $http.delete("/photos/" + photoID)
        .success(function(response)
        {
          angular.element(document.getElementById('listView')).scope().fillUpList();
          window.location = "http://localhost:3000/photo-share.html#/photos/" + photoUserID;
        });
      };
      $http.get('/current_user')
      .success(function(response)
      {
        $scope.currentUser = response.user_id;
        if(photos[0].favoritedBy.indexOf($scope.currentUser) !== -1)
        {
          photos[0].favorite = "true";
        }
      });

      //Update titles, photos, and the location in the side bar
      $scope.main.title = 'Photos';
      $scope.$parent.advancedPicDisplay = "true";
      $scope.$parent.FetchModel("/user/" + userId, function(response)
      {
        $scope.specificUser = response;
        $scope.$parent.main.current_location = 'Viewing ' + $scope.specificUser.first_name + " " + $scope.specificUser.last_name + "'s photos";
      });
      $scope.detail = {};
      $scope.detail.possession = "'s Photos";
      $scope.userPhotos = {};
      $scope.userPhotos.allPhotos = photos;
    });
  }]);
