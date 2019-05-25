'use strict';

cs142App.controller('UserCommentsController', ['$scope', '$http', '$routeParams',
  function ($scope, $http, $routeParams) {
    /*
     * Since the route is specified as '/users/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
    var userId = $routeParams.userId;

    //Update the user and titles
    $scope.main.title = "User Comments";
    $scope.$parent.advancedPicDisplay = undefined;
    $scope.$parent.toggleAdvanced = function()
    {
    };
    $scope.goToSpecificPhoto = function(user, photoIDClicked)
    {
      window.location = "http://localhost:3000/photo-share.html#/photos/" + user + "/" + photoIDClicked;
    };
    $scope.deleteSpecificComment = function(commentID)
    {
      $http.delete("/comments/" + commentID)
      .success(function(response)
      {
        $scope.comments = $scope.comments.filter(function(value)
        {
          return value._id + "" !== commentID + "";
        });
        angular.element(document.getElementById('listView')).scope().fillUpList();
      })
      .error(function(error)
      {
        alert(error);
      });
    };
    $http.get('/commentsOfUser/' + userId)
    .success(function(response)
    {
      $http.get('/user/' + userId)
      .success(function(user)
      {
        $scope.comments = response;
        $scope.userInfo = user;
        $scope.$parent.main.current_location = 'Viewing ' + user.first_name + " " + user.last_name + "'s comments";
        $http.get('/current_user')
        .success(function(response)
        {
          if($scope.userInfo.id + "" === response.user_id)
          {
            $scope.canDeleteComments = true;
          }
        });
      });
    });

}]);
