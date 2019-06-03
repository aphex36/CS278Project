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

    $scope.$parent.FetchModel("/current_user/", function(curr_response) 
    {
      $scope.userDetail.currUserId = curr_response.user_id
      if (userId == curr_response.user_id) {
        $scope.userDetail.current_user = true;
      } else {
        $scope.userDetail.current_user = false;
      }
      $scope.$parent.FetchModel("/user/" + userId, function(response)
      {
        $scope.userDetail.user = response;
        $scope.userDetail.followers = response.followers.length;
        $scope.userDetail.following = response.following.length;

        $scope.userDetail.follow_action = "Follow"
        for (var i = 0; i < response.followers.length; i++) {
           if (response.followers[i] === $scope.userDetail.currUserId) {
              $scope.userDetail.follow_action = "Unfollow"
              break
           }
        }
        if (response.specialties.length !== 0) {
          $scope.userDetail.specialties = response.specialties.join(", ")
        } else {
          $scope.userDetail.specialties = "none"
        }


        $scope.$parent.main.current_location = "Viewing " + $scope.userDetail.user.first_name + " " + $scope.userDetail.user.last_name + "'s profile";
      });

      $scope.$parent.FetchModel("/recommendation/user/" + $routeParams.userId, function(res) {
          $scope.recommendations = res
      })

    });

    $scope.toggleFollow = function() {
         $scope.$parent.FetchModel("/follow/" + $scope.userDetail.user.id, function(curr_response) 
         {
            if (curr_response.followed == true) {
               $scope.userDetail.follow_action = "Unfollow"
               $scope.userDetail.followers += 1
            } else {
               $scope.userDetail.follow_action = "Follow"
               $scope.userDetail.followers -= 1
            }

            $scope.$apply()

         });
    }

}]);
