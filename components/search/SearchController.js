cs142App.controller('SearchController', ['$scope', '$http', '$routeParams', '$timeout',
  function($scope, $http, $routeParams, $timeout) {
    $http.get('/search?q=' + $routeParams.q)
    .success(function(response)
    {
      console.log(response);
      $scope.comments = response;
    });
    $scope.$parent.main.current_location = "Viewing search results";
    $scope.goToSpecificPhoto = function(user, photoIDClicked)
    {
      window.location = "http://localhost:3000/photo-share.html#/photos/" + user + "/" + photoIDClicked;
    };
  }]);
