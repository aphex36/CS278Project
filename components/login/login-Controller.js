"use strict";

cs142App.controller('LoginController', ['$scope', '$http', '$routeParams', '$timeout', '$location',
  function($scope, $http, $routeParams, $timeout, $location) {
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
        console.log("logged in")
        //Fill in the user list and redirect to front page with customized welcome message
        angular.element(document.getElementById('listView')).scope().fillUpList(true);
        var user_logged_in = response;
        $scope.userIsLoggedIn = "true";
        $location.url('/front_page')
        console.log('teehee')
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

      console.log("here")
      console.log($scope.specialtiesUsed)

      var specialtiesFound = []
      var allCheckboxes = $("input:checkbox")

      for (var i = 0; i < allCheckboxes.length; i++) {
        if ($(allCheckboxes[i]).is(":checked")) {
          specialtiesFound.push($(allCheckboxes[i]).val())
        }
      }
      //Make an http request with the given structure
      $http.post('/user',
      {"login_name" : $scope.user_name_register,
       "password": $scope.password_register,
       "first_name" : $scope.firstNameInput,
       "last_name" : $scope.lastNameInput,
       "specialties": specialtiesFound
      })
      .success(function(response)
      {
        //Fill up the previous user list and set up a welcome message and redirect to front page
        angular.element(document.getElementById('listView')).scope().fillUpList(true);
        var user_logged_in = response;
        $scope.userIsLoggedIn = "true";
        $scope.$parent.main.welcome_message = "Welcome " + user_logged_in.first_name + " " + user_logged_in.last_name;
        $location.url('/front_page')
      })
      .error(function(error)
      {
        //Error has to be username was taken
        $scope.errorMessage = "Username is already taken";
      });
     };
  }
]);
