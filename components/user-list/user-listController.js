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
          $scope.$parent.FetchModel("/rank/users", function(response)
          {
             $scope.ranks = {}
             var actual_sorted_results = response.results.sort(function(a,b) {
                 return b.score - a.score
             })
             $scope.ranks.users = actual_sorted_results
             if (actual_sorted_results.length > 6) {
                $scope.ranks.users = actual_sorted_results.slice(0, 7)
             }
          });
        };
        $scope.fillUpList();
      }]);
