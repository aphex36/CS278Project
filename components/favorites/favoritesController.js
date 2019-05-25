'use strict';

cs142App.controller('FavoriteController', ['$scope', '$http', '$routeParams', '$timeout',
  function($scope, $http, $routeParams, $timeout) {
    $http.get('/favorites')
    .success(function(response)
    {
      $scope.photos = response;
      $scope.photos.map(function(photo)
      {
        photo.formattedTime = window.cs142FormatTime(new Date(photo.date_time));
      });
    });
    $http.get('/current_user')
    .success(function(response)
    {
      $scope.currentUser = response;
    });
    $scope.toggleModal = function(photoID)
    {
      $("#" + photoID).css('visibility', 'visible');
      $("#" + photoID).dialog({
        modal: true,
        width: 700,
        height: 500
      });
    };
    $scope.removeFromFavorites = function(photoID, favorite)
    {
      $("#" + photoID).remove();
      $http.delete("/favorites/" + favorite.user_id + "?photo=" + photoID)
      .success(function(messageResponse)
      {
        $http.get('/favorites')
        .success(function(response)
        {
          $scope.photos = response;
          $scope.photos.map(function(photo)
          {
            photo.formattedTime = window.cs142FormatTime(new Date(photo.date_time));
          });
        });
      });
    };
    $scope.$parent.main.current_location = "Viewing your favorites";
  }]);
