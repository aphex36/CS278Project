'use strict';

var cs142App = angular.module('cs142App', ['ngRoute', 'ngMaterial']);

cs142App.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.
            when('/users', {
                templateUrl: 'components/user-list/user-listTemplate.html',
                controller: 'UserListController'
            }).
            when('/users/:userId', {
                templateUrl: 'components/user-detail/user-detailTemplate.html',
                controller: 'UserDetailController'
            }).
            when('/photos/:userId', {
                templateUrl: 'components/user-photos/user-photosTemplate.html',
                controller: 'UserPhotosController'
            }).
            when('/comments/:userId', {
              templateUrl: 'components/user-comments/user-CommentTemplate.html',
              controller: 'UserCommentsController'
            }).
            when('/favorites', {
              templateUrl: 'components/favorites/favoritesTemplate.html',
              controller: 'FavoriteController'
            }).
            when('/search', {
              templateUrl: 'components/search/SearchTemplate.html',
              controller: 'SearchController'
            }).
            when('/front_page', {
              templateUrl: 'components/map/map.html',
              controller: 'mapController'
            }).
            when('/login-register', {
              templateUrl: 'components/login/login-view.html',
              controller: 'LoginController'
            }).
            when('/photos/:userId/:photoId', {
              templateUrl: 'components/specific-photo/specific-photoTemplate.html',
              controller: 'SpecificUserPhotoController'
            }).
            when('/feed', {
              templateUrl: 'components/feed/feedTemplate.html',
              controller: 'FeedController'
            }).
            when('/restaurant/:restaurantId', {
              templateUrl: 'components/restaurant/restaurant.html',
              controller: 'restaurantController'
            }).
            otherwise({
                redirectTo: '/front_page'
            });
    }]);

cs142App.controller('MainController', ['$scope', '$http', '$location', '$rootScope',
    function ($scope, $http, $location, $rootScope) {
        $scope.main = {};
        $scope.main.title = {title: 'Users'};

        $rootScope.$on( "$routeChangeStart", function(event, next, current) {
              $scope.redirectIfNotLoggedIn(event, next, current);
        });

        $scope.redirectIfNotLoggedIn = function(event, next, current)
        {
          $http.get('/current_user')
          .success(function(response)
          {
            //On a callback,get the results and call the doneCallback in a callback to $apply
            if(response === "No user logged in")
            {
              if (next.templateUrl !== "components/login-register/login-view.html") {
                  $location.path("/login-register");
                  $scope.main.welcome_message = 'Log in';
                  $scope.showList = undefined;
                  $scope.showCheckBox = undefined;
              }
              return;
            }
            var loggedInUser = response;
            $scope.main.welcome_message = 'Welcome ' + loggedInUser.user;
            $scope.userIsLoggedIn = "true";
            $scope.showList = "true";
            $scope.showCheckBox = "true";
          });
        };

        $scope.logoutUser = function(keepFromHistory)
        {
          if(keepFromHistory)
          {
            $http.post('/admin/logout', {'keepFromHistory': "true"})
            .success(function(response)
            {
              $scope.main.welcome_message = "Login to your account";
              $scope.main.current_location = "";
              $scope.userIsLoggedIn = undefined;
              $location.url('/login-register')
            })
            .error(function(response)
            {
              alert("No one was logged in the first place");
            });
          }
          else {
            $http.post('/admin/logout', {})
            .success(function(response)
            {
              $scope.main.welcome_message = "Login to your account";
              $scope.main.current_location = "";
              $scope.userIsLoggedIn = undefined;
              $location.url('/login-register')
            })
            .error(function(response)
            {
              alert("No one was logged in the first place");
            });
          }
        };
        //Fetch model function to be used later
        $scope.FetchModel = function(url, doneCallback)
        {
          //Make an http request with the given structure
          var request = new XMLHttpRequest();
          request.addEventListener('load', function(){
            //On a callback,get the results and call the doneCallback in a callback to $apply
            var givenResults;
            if(request.status === 401 || request.status === 400)
            {
              givenResults = request.responseText;
            }
            else
            {
              givenResults = JSON.parse(request.responseText);
            }
            $scope.$apply(function()
            {
              doneCallback(givenResults);
            });
          });
          request.open('GET', url);
          request.setRequestHeader('Content-type', 'application/json');
          request.send();
        };

        //Update model function to be used later
        $scope.updateModel = function(url, dataGiven, doneCallback)
        {
          //Make an http request with the given structure
          var request = new XMLHttpRequest();
          request.addEventListener('load', function(){
            //On a callback,get the results and call the doneCallback in a callback to $apply
            var givenResults = JSON.parse(request.responseText);
            $scope.$apply(function()
            {
              doneCallback(givenResults);
            });
          });
          request.open('POST', url);
          request.setRequestHeader('Content-type', 'application/json');
          request.send(JSON.stringify(dataGiven));
        };

        var selectedPhotoFile;   // Holds the last file selected by the user

        // Called on file selection - we simply save a reference to the file in selectedPhotoFile
        $scope.inputFileNameChanged = function (element) {
            selectedPhotoFile = element.files[0];
        };

        // Has the user selected a file?
        $scope.inputFileNameSelected = function () {
            return !!selectedPhotoFile;
        };

        // Upload the photo file selected by the user using a post request to the URL /photos/new
        $scope.uploadPhoto = function () {
            if (!$scope.inputFileNameSelected()) {
                alert("No image has been selected to upload");
                return;
            }
            console.log('fileSubmitted', selectedPhotoFile);
            // Create a DOM form and add the file to it under the name uploadedphoto
            var domForm = new FormData();
            domForm.append('uploadedphoto', selectedPhotoFile);

            $http.post('/photos/new', domForm, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            }).success(function(newPhoto){
                angular.element(document.getElementById('listView')).scope().fillUpList();
                alert("Photo successfully uploaded");
                // The photo was successfully uploaded. XXX - Do whatever you want on success.
            }).error(function(err){
                // Couldn't upload the photo. XXX  - Do whatever you want on failure.
                alert("Photo couldn't be uploaded");
            });

        };

        $scope.runSearch = function()
        {
          $location.url('/search?q=' + $scope.searchTerms)
        };


        $scope.loadOwnProfile = function() {
              $scope.FetchModel('/current_user', function(response) {
                 $scope.main.current_user = response.user_id
                 $location.url('/users/' + $scope.main.current_user)
            });
        };
        
        $scope.deleteAccount = function()
        {
          $http.get('/current_user')
          .success(function(response)
          {
            if (confirm("Are you sure you wish to delete your account") === true) {
              $http.delete('/users/' + response.user_id)
              .success(function(deletionMessage)
              {
                $scope.logoutUser(true);
              });
            }
          });
        };
    }]);
