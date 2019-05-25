'use strict';

cs142App.controller('FeedController', ['$scope', '$http', '$routeParams', '$timeout',
  function($scope, $http, $routeParams, $timeout) {
    $scope.reloadActivites = function()
    {
      //Get the history and stuff it into the activities scope var
      $http.get('/history')
      .success(function(response)
      {
        for(var i = 0; i < response.length; i++)
        {
          response[i].formattedTime = window.cs142FormatTime(new Date(response[i].date_time));
        }
        $scope.activities = response;
      });
    };

    //Make this redirector when wanting to visit a specific photo's site
    $scope.goToSpecificPhoto = function(user, photoIDClicked)
    {
      window.location = "http://localhost:3000/photo-share.html#/photos/" + user + "/" + photoIDClicked;
    };
    $scope.$parent.main.current_location = "Viewing the activity feed";
    $scope.reloadActivites();
}]);
