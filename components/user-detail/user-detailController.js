'use strict';

cs142App.controller('UserDetailController', ['$scope', '$http', '$routeParams',
  function ($scope, $http, $routeParams) {
    /*
     * Since the route is specified as '/users/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
    var userId = $routeParams.userId;

    //Update the user and titles
    $scope.main.title = "User Profile";
    $scope.userDetail = {};
    $scope.$parent.advancedPicDisplay = undefined;
    $scope.$parent.toggleAdvanced = function()
    {
    };
    $scope.redirect = function(photoID)
    {
      window.location = "http://localhost:3000/photo-share.html#/photos/" + userId + "/" + photoID;
    };
    $scope.$parent.FetchModel("/user/" + userId, function(response)
    {
      $scope.userDetail.user = response;
      $scope.$parent.main.current_location = "Viewing " + $scope.userDetail.user.first_name + " " + $scope.userDetail.user.last_name + "'s profile";
    });
    $http.get("/mostCommentedPic/" + userId)
    .success(function(response)
    {
      if(response.file_name)
      {
        $scope.mostCommentedPic = response;
      }
    });
    $http.get("/mostRecentPic/" + userId)
    .success(function(response)
    {
      if(response.file_name)
      {
        $scope.mostRecentPic = response;
        $scope.mostRecentPic.formattedTime = window.cs142FormatTime(new Date(response.date_time));
      }
    });
}]);
