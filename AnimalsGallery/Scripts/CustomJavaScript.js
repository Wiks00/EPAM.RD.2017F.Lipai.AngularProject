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
            $rootScope.globals.basket = $cookies.getObject("basket") || {};
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
                    controller: "MainController"
                })
                .when("/Angular/Index",
                {
                    templateUrl: "Views/Home/Main.html",
                    controller: "MainController"
                })
                .when("/Angular/About",
                {
                    templateUrl: "Views/Home/About.html",
                    controller: "AboutController"
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
                })
                .when("/Angular/Basket",
                {
                    templateUrl: "Views/Basket/Basket.html",
                    controller: "BasketController"
                })/*
                .otherwise(
                {
                    templateUrl: "Views/Errors/404.html",
                    redirecTo: "/AngularJS/Gallery"
                })*/;

            $locationProvider.html5Mode(true);
        }])
    .controller("BasketController",
        ["$rootScope", "$scope", "$cookieStore", function ($rootScope, $scope, $cookieStore) {

            $scope.data = $rootScope.globals.basket.images;
            $scope.total = 0;

            _.each($scope.data, function (value, key, list) {
                $scope.total += value.price;
            });

            $scope.deleteItem = function(index) {
                $scope.data.splice(index, 1);
                $rootScope.globals.basket.images = $scope.data;

                $cookieStore.remove("basket");
                $cookieStore.put("basket", $rootScope.globals.basket);

                $scope.total = 0;

                _.each($scope.data, function (value, key, list) {
                    $scope.total += value.price;
                });
            } 

            $scope.buy = function (images) {
                $rootScope.globals.basket = {};
                $scope.data = {};
                $scope.total = 0;

                $cookieStore.remove("basket");
            }
             
        }]
    ).controller("MainController",
        ["$rootScope", "$scope", "FileService", function ($rootScope, $scope, FileService) {

            $scope.data = [];
            $scope.isEdit = false;
            $scope.isUserAdmin = false;

            if ($rootScope.CurrentUser.roles) {
                $scope.isUserAdmin = $rootScope.CurrentUser.roles.includes("admin");
            }

            FileService.LoadTopThreeAlbums().then(function (response) {
                $scope.data = response.data;
            });

            $scope.edit = function () {
                $scope.isEdit = !$scope.isEdit;
            };

            $scope.changeDescription = function(text) {
                FileService.SaveDescription(text);
                $scope.isEdit = false;
            };

        }]
    )
    .controller("AboutController",
        ["$scope", function ($scope) {

            $scope.term = "provide";

            $scope.desc = "and i'm popup with alot of uisifull information!";
        }]
    )
    .controller("ModeratorController",
        ["$scope", "_", "FileService", function ($scope, _, FileService) {

            $scope.data = [];

            FileService.LoadImageForModeration().then(function (response) {
                $scope.data = response.data;
            });


            $scope.moderate = function(images) {
                _.each(images, function (value, key, list) {
                    FileService.ModerateImage(value.id, value.allowable);
                });
                $scope.data = {};
            }
        }]
    )
    .controller("GalleryController",
        ["$rootScope", "$scope", "$cookieStore", "$location", "_", "FileService", function ($rootScope, $scope, $cookieStore, $location, _,FileService) {
            console.log("ActionController created");

            $scope.data = [];

            FileService.GetAllAlbums().then(function (response) {
                $scope.data = response.data;
                var allImages = [];

                $scope.formats = ["all"];
                _.each($scope.data, function(value, key, list) {
                    _.each(value.images, function (value, key, list) {
                        allImages.push(value);
                        $scope.formats.push(value.format);
                         });
                });

                $scope.data.push({ images: allImages, title: "all" });

                if (!($location.search()).albumId) {
                    $scope.selectedAlbum = $scope.data[0];
                } else {
                    var album = _.find($scope.data, function(num) {
                        return num.id == ($location.search()).albumId;
                    });
                    $scope.selectedAlbum = $scope.data[$scope.data.indexOf(album)];
                }

                $scope.formats = _.uniq($scope.formats);
            });

            $scope.getRating = function (image) {

                FileService.LoadPersonalImageVote(image.id, $rootScope.CurrentUser.id)
                    .then(function (response) {
                        image.personalRating = { value: response.data };
                    });

                FileService.LoadImageRating(image.id)
                    .then(function (response) {
                        image.globalRating = { value: response.data };
                    });

            };

            $scope.updateRating = function (imageId, rating, albumId) {
                FileService.UpdateImageRating(imageId, rating, $rootScope.CurrentUser.id, albumId)
                    .then(function(response) {
                        if (response.data.success) {
                            image.personalRating = { value: rating };
                            image.globalRating = { value: data.newRating };
                        }
                });
            };

            $scope.isInBasket = function(image) {
                var button = document.getElementById("dtn" + image.id);

                if (!$cookieStore.get("basket") || !_.findWhere($rootScope.globals.basket.images,{id : image.id})) {
                    button.value = "buy";
                    return "buy";
                } else {                    
                    button.value = "in basket";
                    return "in basket";
                }

            };

            $scope.buyImage = function (image) {
                $scope.isInBasket(image);
                if (!$cookieStore.get("basket")) {

                    $rootScope.globals.basket = {
                            user: $rootScope.CurrentUser.id,
                            images: [image]
                    };

                    $cookieStore.put("basket", $rootScope.globals.basket);

                } else {

                    $cookieStore.remove("basket");

                    $rootScope.globals.basket.images.push(image);

                    $rootScope.globals.basket.images = _.uniq($rootScope.globals.basket.images);

                    $cookieStore.put("basket", $rootScope.globals.basket);
                }
            };

            $scope.filter = function(format, index) {

                var button = document.getElementById("format" + index);
                var cssClass = "active";
                
                if (!button.classList.contains(cssClass)) {
                    button.classList.add(cssClass);
                } else {
                    button.classList.remove(cssClass);
                }
                var images;

                if (format === "all") {
                    images = document.getElementsByClassName("filter");
                    _.each(images, function(value, key, list) {
                        value.style.display = (value.style.display == "none") ? "" : "none";
                    });
                } else {
                    images = document.getElementsByClassName(format);
                    _.each(images, function(value, key, list) {
                        value.style.display = (value.style.display == "none") ? "" : "none";
                    });

                }
            };

            $scope.close = function() {

                var modal = document.getElementById("myModal");

                modal.style.display = "none";
            };
        }]
    )
    .controller("HeaderController",
        ["$rootScope", "$scope", "$http", "$cookies", "$location", "AuthenticationService", "UserService", function ($rootScope, $scope, $http, $cookies, $location, AuthenticationService, UserService) {

            $rootScope.CurrentUser = {};
            $scope.isUserLoggedIn = !!$rootScope.globals.currentUser;
            $scope.LoginOrRegister = "Login";
            $scope.isUserModerator = false;
            $scope.isUserAdmin = false;

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

                $location.path("Angular/Index");
                $location.replace();
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

                $rootScope.globals.basket = $cookies.getObject("basket") || {} ;

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
        ["$rootScope", "$scope", "$http", "FileService", function ($rootScope, $scope, $http, FileService) {
            console.log("ActionController created");

            $scope.items = ["byFileSystem", "byUrl"];
            $scope.selection = $scope.items[0];

            $scope.image = {};

            $scope.Albums = $rootScope.CurrentUser.albums;

            $scope.Upload = function (image) {
                if ($rootScope.CurrentUser.roles.includes("moderator") || $rootScope.CurrentUser.roles.includes("admin")) {
                    image.Allowable = true;
                } else {
                    image.Allowable = false;
                }

                if ($scope.selection == "byUrl") {

                    //code will be heare
                }

                image.AlbumId = image.AlbumId.id;

                FileService.UploadImage(image);

                $scope.image = {};
            };

            $scope.AddAlbum = function (title) {
                FileService.AddAlbum(title, $rootScope.CurrentUser.id);

            };
        }]
    )
    .directive("ngPopupTerm", [function () {

        return {
            restrict: "E",
            replace: true,
            template:
              "<div style='display: inline-block;'><div ng-mouseover='showPopover()' ng-mouseleave='hidePopover()'>{{term}}</div>" +
              "<div style='position: absolute; z-index: 100; background-color: black; color: #ffffff;' ng-show='popoverIsVisible'>{{description}}</div></div>",
            scope: {
                term: "=",
                description:"="
            },
            link: function (scope, element, attrs) {
                scope.popoverIsVisible = false;

                scope.showPopover = function () {
                    scope.popoverIsVisible = true;
                };

                scope.hidePopover = function () {
                    scope.popoverIsVisible = false;
                };
            }
        };
    }])
    .directive("ngSpoiler", [ function() {

        return {
            restrict: "EA",
            replace: true,
            template:
              "<div ng-click='activate()' style='width: 50px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;'>{{text}}</div>",
            scope: {
                text: "=ngModel"
            },
            link: function(scope, element, attrs) {

                scope.activate = function () {
                    element[0].style.overflow = (element[0].style.overflow == "hidden") ? "visible" : "hidden";
                };
            }
        };
    }])
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
                    max: "=?",
                    onRatingSelect: "&?",
                    readonly: "=?"
                },
                link: function (scope, element, attributes) {
                    if (scope.max == undefined) {
                        scope.max = 5;
                    }

                    updateStars();

                    function updateStars() {
                        scope.stars = [];
                        for (var i = 0; i < scope.max; i++) {
                            scope.stars.push({
                                filled: i < scope.ratingValue.value
                            });
                        }
                    };

                    scope.toggle = function (index) {
                        if (scope.readonly == undefined || scope.readonly === false) {
                            scope.ratingValue.value = index + 1;
                            scope.onRatingSelect({
                                rating: index + 1
                            });
                        }
                    };

                    scope.$watch("ratingValue", function (oldValue, newValue) {
                        if (newValue.value) {
                            updateStars();
                        }
                    });
                }
            };
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
                $cookieStore.remove("basket");
                $http.defaults.headers.common.Authorization = "Basic ";
            }
        }
    }])
    .service("FileService", ["$http", function ($http) {

        return {
            SaveDescription: function (text) {
                $http.post("/Api/SaveDescription", { text: text });
            },

            GetAllAlbums: function() {
                return $http.get("/Api/GetAllAlbums");
            },

            AddAlbum: function(title, userId) {
                $http.post("/Api/AddAlbum", { title: title, userId: userId });
            },

            LoadAlbums: function(userId) {
                return $http.get("/Api/LoadAlbums", { params: { userId: userId } });
            },

            LoadTopThreeAlbums: function () {
                return $http.get("/Api/TopThreeAlbums");
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