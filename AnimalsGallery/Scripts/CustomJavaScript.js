var underscore = angular.module('underscore', []);
underscore.factory('_', ['$window', function ($window) {
    return $window._; // assumes underscore has already been loaded on the page
}]);

angular.module("main", ["ngRoute", "ngCookies", "underscore"])
    .run(["$rootScope", "$location", "$cookies", "$http", function ($rootScope, $location, $cookies, $http) {
        
        console.log("App started");

        $rootScope.globals = $cookies.getObject("globals") || {};
        if ($rootScope.globals.currentUser) {
            $http.defaults.headers.common["Authorization"] = "Basic " + $rootScope.globals.currentUser.authdata;
        }
 
        $rootScope.$on("$locationChangeStart", function (event, next, current) {
            var restrictedPage = $.inArray($location.path(), ["/Angular/Index", "/Angular/Gallery"]) === -1;
            var loggedIn = $rootScope.globals.currentUser;
            if (restrictedPage && !loggedIn) {
                $location.path("/Angular/Index");
            }
        });
    }])
    .config(["$locationProvider", "$routeProvider",
        function ($locationProvider, $routepProvider) {
            $routepProvider
                .when("/Angular",
                {
                    templateUrl: "Views/Home/Main.html",
                    controller: "GalleryController"
                })
                .when("/Angular/Index",
                {
                    templateUrl: "Views/Home/Main.html",
                    controller: "GalleryController"
                })
                .when("/Angular/About",
                {
                    templateUrl: "Views/Home/About.html",
                    controller: "GalleryController"
                })
                .when("/Angular/Gallery",
                {
                    templateUrl: "Views/Gallery/Gallery.html",
                    controller: "GalleryController"
                })
                .when("/Angular/AddImage",
                {
                    templateUrl: "Views/Gallery/AddImage.html",
                    controller: "ImageUploaderController"
                })
                .when("/Angular/Moderate",
                {
                    templateUrl: "Views/Moderator/ModeratePage.html",
                    controller: "ModeratorController"
                })/*
                .otherwise(
                {
                    templateUrl: "Views/Errors/404.html",
                    redirecTo: "/AngularJS/Gallery"
                })*/;

            $locationProvider.html5Mode(true);
        }])
    .controller("ModeratorController",
        ["$scope", "FileService", function ($scope, FileService) {

            FileService.LoadImageForModeration().then(function (response) {
                $scope.data = response.data;
            });

        }]
    )
    .controller("GalleryController",
        ["$rootScope", "$scope", "_", "FileService", function ($rootScope, $scope, _,FileService) {
            console.log("ActionController created");

            FileService.GetAllAlbums().then(function (response) {
                $scope.data = response.data;
                $scope.formats = [];
                _.each($scope.data, function(value, key, list) {
                    _.each(value.images, function (value, key, list) {
                        $scope.formats.push(value.format);
                         });
                });

                $scope.formats = _.uniq($scope.formats);
            });

            $scope.getRating = function (image) {

                FileService.LoadPersonalImageVote(image.id, $rootScope.CurrentUser.id)
                    .then(function (response) {
                        image.personalRating = response.data;
                    });

                FileService.LoadImageRating(image.id)
                    .then(function (response) {
                        image.globalRating = response.data;
                    });

                $scope.data;
            };

            $scope.updateRating = function (imageId, rating, albumId) {
                FileService.UpdateImageRating(imageId, rating, $rootScope.CurrentUser.id, albumId)
                    .then(function(response) {
                        if (response.data.success) {
                            image.personalRating = rating;
                            image.globalRating = data.newRating;
                        }
                });
            };

            $scope.close = function() {

                var modal = document.getElementById("myModal");

                modal.style.display = "none";
            };
        }]
    )
    .controller("HeaderController",
        ["$rootScope", "$scope", "$http", "$cookies", "AuthenticationService", "UserService", function ($rootScope, $scope, $http, $cookies, AuthenticationService, UserService) {

            $scope.isUserLoggedIn = !!$rootScope.globals.currentUser;
            $scope.LoginOrRegister = "Login";

            if ($scope.isUserLoggedIn) {
                UserService.GetByUsername($rootScope.globals.currentUser.username)
                    .then(function (response) {
                        $rootScope.CurrentUser = response.data;
                        $scope.isUserModerator = $rootScope.CurrentUser.roles.includes("moderator");
                        $scope.isUserAdmin = $rootScope.CurrentUser.roles.includes("admin");
                    });
            }

            $scope.Switch = function() {
                if ($scope.LoginOrRegister === "Login")
                    $scope.LoginOrRegister = "Register";
                else
                    $scope.LoginOrRegister = "Login";
            }

            $scope.Register = function(user) {
                if (user.Password === user.ConfirmPassword) {
                    AuthenticationService.Register(user,
                        function (response) {
                            if (response.success) {
                                authenticate(user.UserName, user.Password);                          
                            }
                    });
                }
            }

            $scope.Logout = function() {
                AuthenticationService.ClearCredentials();
                $scope.CurrentUser = {};

                $scope.isUserLoggedIn = false;
                $scope.isUserModerator = false;
                $scope.isUserAdmin = false;
            }

            $scope.Login = function (userName,password) {
                AuthenticationService.Login(userName, password,
                    function(response) {
                        if (response.success) {
                            authenticate(userName, password);
                        }
                    });
            }

            function authenticate(userName, password) {

                AuthenticationService.SetCredentials(userName, password);
                $scope.isUserLoggedIn = true;

                UserService.GetByUsername($rootScope.globals.currentUser.username)
                    .then(function (response) {
                        $rootScope.CurrentUser = response.data;
                        $scope.isUserModerator = $rootScope.CurrentUser.roles.includes("moderator");
                        $scope.isUserAdmin = $rootScope.CurrentUser.roles.includes("admin");
                    });
            }
        }]
    )
    .controller("ImageUploaderController",
        ["$rootScope", "$scope", "FileService", function ($rootScope, $scope, FileService) {
            console.log("ActionController created");

            $scope.items = ["byFileSystem", "byUrl"];
            $scope.selection = $scope.items[0];

            $scope.Albums = $rootScope.CurrentUser.albums;

            $scope.Upload = function (image) {
                if ($rootScope.CurrentUser.roles.includes("moderator") || $rootScope.CurrentUser.roles.includes("admin")) {
                    image.Allowable = true;
                } else {
                    image.Allowable = false;
                }

                image.AlbumId = image.AlbumId.id;

                FileService.UploadImage(image);
            };

            $scope.AddAlbum = function (title) {
                FileService.AddAlbum(title, $rootScope.CurrentUser.id);

            };

        }]
    )
    .directive("fileread", [function () {
        return {
            scope: {
                fileread: "="
            },
            link: function (scope, element, attributes) {
                element.bind("change", function (changeEvent) {
                    var reader = new FileReader();
                    reader.onload = function (loadEvent) {
                        scope.$apply(function () {
                            scope.fileread = loadEvent.target.result;
                        });
                    }
                    reader.readAsDataURL(changeEvent.target.files[0]);
                });
            }
        }
    }])
    .directive("ngImagePreview", [
        function() {
            return {
                restrict: "E", 
                replace: true, 
                templateUrl: "Views/Gallery/ImagePreview.html", 
                scope: { image: "=" },
                controller: ["$scope",function ($scope) {

                        $scope.zoom = function (imageId) {

                            var modal = document.getElementById("myModal");

                            var img = document.getElementById("img"+ imageId);
                            var modalImg = document.getElementById("img01");
                            var captionText = document.getElementById("caption");
                          
                            modal.style.display = "block";
                            modalImg.src = img.src;
                            captionText.innerHTML = $scope.image.description;
                        }                     
                    }
                ]
            }
        }
    ])
    .directive("ngStarRating", [
        function starRating() {
            return {
                restrict: "EA",
                template:
                  "<ul class='star-rating' ng-class='{readonly: readonly}'>" +
                  "  <li ng-repeat='star in stars' class='star' ng-class='{filled: star.filled}' ng-click='toggle($index)'>" +
                  "    <i class='fa fa-star'></i>" +
                  "  </li>" +
                  "</ul>",
                scope: {
                    ratingValue: "=ngModel",
                    max: "=?", // optional (default is 5)
                    onRatingSelect: "&?",
                    readonly: "=?"
                },
                link: function (scope, element, attributes) {
                    if (scope.max == undefined) {
                        scope.max = 5;
                    }

                    scope.stars = [];
                    for (var i = 0; i < scope.max; i++) {
                        scope.stars.push({
                            filled: i < scope.ratingValue
                        });
                    }

                    function updateStars() {
                        scope.stars = [];
                        for (var i = 0; i < scope.max; i++) {
                            scope.stars.push({
                                filled: i < scope.ratingValue
                            });
                        }
                    };

                    scope.toggle = function (index) {
                        if (scope.readonly == undefined || scope.readonly === false) {
                            scope.ratingValue = index + 1;
                            scope.onRatingSelect({
                                rating: index + 1
                            });
                        }
                    };

                    scope.$watch("ratingValue", function (oldValue, newValue) {
                        if (newValue) {
                            updateStars();
                        }
                    });
                }
            };
        }
    ])
    .directive("ngSpoiler", [
        function () {
            return {
                restrict: "E", //E - element <ng-dir/>, A- attr <div ng-dir/>
                replace: true, //do we need replace element content
                templateUrl: "Views/Gallery/ImagePreview.html", //for what we raplace
                scope: {    //model ("=" - binding for both side)
                    text: "=",
                    description: "="
                }, 
                controller: ["$scope", "service", //controller
                    function($scope, service) {
                        $scope.isActive = false;

                        $scope.Activate = function() {
                            $scope.isActive = !$scope.isActive;
                        };
                    }
                ]
            }
        }
    ])
    .service("AuthenticationService", ["$rootScope", "$http", "$cookieStore", "$timeout", "Base64", "UserService", function ($rootScope, $http, $cookieStore, $timeout, Base64, UserService) {

        return {

            Login: function (username, password, callback) {
                $http.post("/Api/Authenticate", { username: username, password: password })
                    .then(function successCallback(response)  {
                        callback(response.data);
                    },function errorCallback(response) {
                        callback(response.data);
                    });
            },

            Register: function (user, callback) {
                UserService.Create(user, callback);
            },

            SetCredentials : function (username, password) {

                var authdata = Base64.encode(username + ":" + password);
  
                $rootScope.globals = {
                    currentUser: {
                        username: username,
                        authdata: authdata
                    }
                };
  
                $http.defaults.headers.common["Authorization"] = "Basic " + authdata;
                $cookieStore.put("globals", $rootScope.globals);
            },
  
            ClearCredentials: function () {
                $rootScope.CurrentUser = {};
                $rootScope.globals = {};
                $cookieStore.remove("globals");
                $http.defaults.headers.common.Authorization = "Basic ";
            }
        }
    }])
    .service("FileService", ["$http", function ($http) {

        return {

            GetAllAlbums: function() {
                return $http.get("/Api/GetAllAlbums");
            },

            AddAlbum: function(title, userId) {
                $http.post("/Api/AddAlbum", { title: title, userId: userId });
            },

            LoadAlbums: function(userId) {
                return $http.get("/Api/LoadAlbums", { params: { userId: userId } });
            },

            UploadImage: function (image) {
                $http.post("/Api/UploadImage", { image });
            },

            LoadImage: function(imageId) {
                return $http.get("/Api/LoadImage", { params: { imageId: imageId } });
            },

            LoadImageForModeration: function() {
                return $http.get("/Api/LoadImageForModeration");
            },

            LoadPersonalImageVote: function (imageId, userId) {
                return $http.get("/Api/LoadPersonalImageVote", { params: { imageId: imageId, userId: userId } });
            },

            UpdateImageRating: function (imageId, rating, userId, albumId) {
                $http.post("/Api/UpdateImageRating", { imageId: imageId, rating: rating, userId: userId, albumId: albumId });
            },

            ModerateImage: function (imageId, allowable) {
                $http.post("/Api/ModerateImage",  { imageId: imageId, allowable: allowable } );
            },

            LoadImageRating: function (imageId) {
                return $http.get("/Api/LoadImageRating", { params: { imageId: imageId } });
            }
        }
    }])
    .service("UserService",["$http", function($http) {
        
        return {     
            GetByUsername: function (nickname) {
                return $http.get("/Api/GetUser", { params: { username: nickname } });
            },
            Create : function(user, callback) {
                 $http.post("/Api/CreateUser",
                        JSON.stringify(user),
                        {
                            headers: {
                                "Content-Type": "application/json"
                            }
                        }
                ).then(function successCallback(response)  {
                    callback(response.data);
                },function errorCallback(response) {
                    callback(response.data);
                });
            }
        }
    }])
    .service("Base64", function () {

        var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

        return {
            encode: function (input) {
                var output = "";
                var chr1, chr2, chr3 = "";
                var enc1, enc2, enc3, enc4 = "";
                var i = 0;

                do {
                    chr1 = input.charCodeAt(i++);
                    chr2 = input.charCodeAt(i++);
                    chr3 = input.charCodeAt(i++);

                    enc1 = chr1 >> 2;
                    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                    enc4 = chr3 & 63;

                    if (isNaN(chr2)) {
                        enc3 = enc4 = 64;
                    } else if (isNaN(chr3)) {
                        enc4 = 64;
                    }

                    output = output +
                        keyStr.charAt(enc1) +
                        keyStr.charAt(enc2) +
                        keyStr.charAt(enc3) +
                        keyStr.charAt(enc4);
                    chr1 = chr2 = chr3 = "";
                    enc1 = enc2 = enc3 = enc4 = "";
                } while (i < input.length);

                return output;
            },

            decode: function (input) {
                var output = "";
                var chr1, chr2, chr3 = "";
                var enc1, enc2, enc3, enc4 = "";
                var i = 0;

                // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
                var base64test = /[^A-Za-z0-9\+\/\=]/g;
                if (base64test.exec(input)) {
                    window.alert("There were invalid base64 characters in the input text.\n" +
                        "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                        "Expect errors in decoding.");
                }
                input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

                do {
                    enc1 = keyStr.indexOf(input.charAt(i++));
                    enc2 = keyStr.indexOf(input.charAt(i++));
                    enc3 = keyStr.indexOf(input.charAt(i++));
                    enc4 = keyStr.indexOf(input.charAt(i++));

                    chr1 = (enc1 << 2) | (enc2 >> 4);
                    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                    chr3 = ((enc3 & 3) << 6) | enc4;

                    output = output + String.fromCharCode(chr1);

                    if (enc3 != 64) {
                        output = output + String.fromCharCode(chr2);
                    }
                    if (enc4 != 64) {
                        output = output + String.fromCharCode(chr3);
                    }

                    chr1 = chr2 = chr3 = "";
                    enc1 = enc2 = enc3 = enc4 = "";

                } while (i < input.length);

                return output;
            }
        };
    })