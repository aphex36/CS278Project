'use strict';

cs142App.controller('RestaurantDetailController', ['$scope', '$http', '$routeParams',
  function ($scope, $http, $routeParams) {
    /*
     * Since the route is specified as '/users/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */

    // restaurantId = Yelp ID
    var restaurantId = $routeParams.restaurantId;

    //Update the user and titles
    $scope.main.title = "Restaurant Profile";
    // $scope.restaurantDetail = {};

    // $scope.$parent.FetchModel("/yelp/id/" + restaurantId, function(response)
    // {
    //   $scope.restaurantDetail.user = response;
    //   $scope.$parent.main.current_location = "Viewing " + $scope.userDetail.user.first_name + " " + $scope.userDetail.user.last_name + "'s profile";
    // });
    // $http.get("/mostCommentedPic/" + userId)
    // .success(function(response)
    // {
    //   if(response.file_name)
    //   {
    //     $scope.mostCommentedPic = response;
    //   }
    // });
    // $http.get("/mostRecentPic/" + userId)
    // .success(function(response)
    // {
    //   if(response.file_name)
    //   {
    //     $scope.mostRecentPic = response;
    //     $scope.mostRecentPic.formattedTime = window.cs142FormatTime(new Date(response.date_time));
    //   }
    // });
}]);
