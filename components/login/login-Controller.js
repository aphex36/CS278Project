"use strict";

cs142App.controller('LoginController', ['$scope', '$http', '$routeParams', '$timeout',
  function($scope, $http, $routeParams, $timeout) {
    $scope.$parent.current_location = "Login Page";
    $scope.$parent.toggleAdvanced = function()
    {
    };
    $scope.submitLogin = function(form)
    {
      if(!form.$valid)
      {
        return;
      }
      //Make an http request with the given structure
      $http.post('/admin/login', {"login_name" : $scope.user_name, "password": $scope.password})
      .success(function(response)
      {
        //Fill in the user list and redirect to front page with customized welcome message
        angular.element(document.getElementById('listView')).scope().fillUpList(true);
        var user_logged_in = response;
        $scope.userIsLoggedIn = "true";
        $scope.$parent.main.welcome_message = "Welcome " + user_logged_in.first_name + " " + user_logged_in.last_name;
        window.location = "http://localhost:3000/photo-share.html#/front_page";
      })
      .error(function(error)
      {
        //State the login problem
        $scope.loginErrorMessage = error;
      });
    };

    $scope.submitRegister = function(form)
    {
      if(!form.$valid)
      {
        return;
      }

      if($scope.password_register !== $scope.repeatedPassword)
      {
        $scope.errorMessage = "Passwords do not match";
        return;
      }

      //Make an http request with the given structure
      $http.post('/user',
      {"login_name" : $scope.user_name_register,
       "password": $scope.password_register,
       "first_name" : $scope.firstNameInput,
       "last_name" : $scope.lastNameInput,
       "location" : $scope.locationInput,
       "occupation": $scope.occupationInput,
       "description": $scope.descriptionInput,
       })
      .success(function(response)
      {
        //Fill up the previous user list and set up a welcome message and redirect to front page
        angular.element(document.getElementById('listView')).scope().fillUpList(true);
        var user_logged_in = response;
        $scope.userIsLoggedIn = "true";
        $scope.$parent.main.welcome_message = "Welcome " + user_logged_in.first_name + " " + user_logged_in.last_name;
        window.location = "http://localhost:3000/photo-share.html#/front_page";
      })
      .error(function(error)
      {
        //Error has to be username was taken
        $scope.errorMessage = "Username is already taken";
      });
     };
  }
]);
