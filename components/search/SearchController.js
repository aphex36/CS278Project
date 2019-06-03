cs142App.controller('SearchController', ['$scope', '$http', '$routeParams', '$timeout',
  function($scope, $http, $routeParams, $timeout) {
    $scope.query = {}
    $scope.query.q = $routeParams.q
    $http.get('/search?q=' + $routeParams.q)
    .success(function(response)
    {
      $scope.restaurants = response;
    });
    $scope.goToSpecificPhoto = function(user, photoIDClicked)
    {
      window.location = "http://localhost:3000/photo-share.html#/photos/" + user + "/" + photoIDClicked;
    };
}]);
