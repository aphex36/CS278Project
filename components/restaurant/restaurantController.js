'use strict';

cs142App.controller('restaurantController', ['$scope', '$routeParams',
  function($scope, $routeParams) {

    //Initial front page, just change the title and location
    $scope.main.title = 'Food App';
    var restaurantId = $routeParams.restaurantId
    $scope.$parent.toggleAdvanced = function()
    {
    };

    $scope.$parent.FetchModel("/yelp/id/" + restaurantId, function(response)
    {
    	$scope.restaurant = {}
    	$scope.restaurant.restaurantInfo = response
    	console.log(response)
    	$scope.$parent.FetchModel('/recommendation/restaurant/' + restaurantId, function(res) {
    		$scope.review = {};
    		$scope.review.reviews = res;
    	});
    })
    $scope.$parent.main.current_location = 'Home page';
    $scope.submitReview = function() {
        if ($("#reviewContent").val().length == 0) {
            return;
        }
        var typesFound = []
        if ($scope.restaurant.restaurantInfo.categories) {
            for (var i = 0; i < $scope.restaurant.restaurantInfo.categories.length; i++) {
                typesFound.push($scope.restaurant.restaurantInfo.categories[i].title)
            }
        }

        var strengthUsed;
        if ($("#reviewRating").val() === "Nope (1/3 stars)") {
            strengthUsed = 1;
        } else if ($("#reviewRating").val() === "Meh (2/3 stars)") {
            strengthUsed = 2;
        } else {
            strengthUsed = 3;
        }
        var data = {
            restaurant: $routeParams.restaurantId,
            types: typesFound,
            strength: strengthUsed,
            review: $("#reviewContent").val()
        };
        console.log(data)
        console.log("data done")
        $scope.$parent.updateModel('/recommendation', data, function(updatedResponse) {
            $("#reviewContent").val("")
            $scope.review.reviews.unshift(updatedResponse)
            $scope.$apply()
        });
    }

  }]);
