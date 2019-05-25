'use strict';


cs142App.controller('UserListController', ['$scope', '$location',
    function ($scope, $location) {

        //Update the $scope to include all users
        $scope.main.title = 'Users';
        $scope.$parent.toggleAdvanced = function()
        {

        };

        $scope.fillUpList = function(locationBool)
        {
          //Get the users
          $scope.$parent.FetchModel("/user/list", function(response)
          {
            //If there was no authorization to make a request
            if(response === "No authorization to make request")
            {
              return;
            }
            //For each of the users
            for(var i = 0; i < response.length; i++)
            {
              //Get the comments and photos
              (function(j)
              {
                $scope.$parent.FetchModel("/photosAndCommentsCount/" + response[j].id, function(photoAndCommentCount)
                {
                  //Get the number of comments and number of photos and set it in the specific user
                  response[j].numberOfComments = photoAndCommentCount.comments;
                  response[j].numPhotos = photoAndCommentCount.photos;
                  if(j === response.length - 1)
                  {
                    //At the update of the last student set the scope
                    $scope.main.users = response;
                  }
                });
              })(i);
            }
          });
          $scope.$parent.advancedPicDisplay = undefined;
        };
        $scope.fillUpList();
      }]);
