'use strict';

cs142App.controller('mapController', ['$scope', '$routeParams',
  function($scope, $routeParams) {

    //Initial front page, just change the title and location
    $scope.main.title = 'Food App';
    $scope.$parent.toggleAdvanced = function()
    {
    };
    $scope.$parent.main.current_location = 'Home page';
  }]);
