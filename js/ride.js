/*global WildRydes _config*/

var WildRydes = window.WildRydes || {};
WildRydes.map = WildRydes.map || {};
var authToken;

var app = angular.module('myApp', ['ngMaterial', 'ngMessages']);
app.controller('myCtrl', function ($scope, $http) {

/*wildride code starts*/

    WildRydes.authToken.then(function setAuthToken(token) {
        if (token) {
            console.log('from ridejs', token);
            $scope.authToken = token;
            $scope.parsedAuthToken = $scope.parseAuthToken(token);
            console.log($scope.parsedAuthToken);
            $scope.deviceId = $scope.parsedAuthToken['custom:device_id'];
            $scope.email = $scope.parsedAuthToken.email;
            console.log('email', $scope.email);
            $scope.cognitoUserID = $scope.parsedAuthToken.sub
            $scope.getMobileNumber();
            $scope.getMode();
            $scope.getSensorValues();
            $scope.stopSiren();

        } else {
            //window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
         //alert(error);
         //window.location.href = '/signin.html';
    });

    $scope.getMobileNumber = function() {
        $http({
            method: "GET",
            params: {'deviceId': $scope.deviceId},
            url: _config.api.invokeUrl + '/mobilenumber',
            headers: {
                Authorization: $scope.authToken
            }
            
        }).then(function mySuccess(response) {
            if(response.status == 200) {
                $scope.persons = response.data;
                //console.log('persons', $scope.persons);
            }
        }, function myError(response) {
            console.log(response);
        });
    }

    $scope.postUnicorn = function () {
        console.log('post method called');
        $http({
            method: "POST",
            url: _config.api.invokeUrl + '/mobilenumber',
            headers: {
                Authorization: $scope.authToken
            },
            data: JSON.stringify({
                "mobileNumber": $scope.mobileNumber,
                "name": $scope.name,
                "deviceId": $scope.deviceId
            }),
            contentType: 'application/json'
        }).then(function mySuccess(response) {
            if(response.status == 201) {
                $scope.getMobileNumber();
            }
            console.log(response);
        }, function myError(response) {
            console.log(response);
        });
    }

    $scope.postMode = function (mode) {
        console.log('postMode method called');
        $http({
            method: "POST",
            url: _config.mode_api.invokeUrl + '/mode',
            headers: {
                Authorization: $scope.authToken
            },
            data: JSON.stringify({
                "mode": mode,
                "deviceId": $scope.deviceId
            }),
            contentType: 'application/json'
        }).then(function mySuccess(response) {
            if(response.status == 201) {
                console.log('response', response);
                //$scope.getMobileNumber();
            }
           // console.log(response);
        }, function myError(response) {
            console.log(response);
        });
    }

    $scope.getMode = function() {
        $http({
            method: "GET",
            params: {'deviceId': $scope.deviceId},
            url: _config.mode_api.invokeUrl + '/mode',
            headers: {
                Authorization: $scope.authToken
            }
            
        }).then(function mySuccess(response) {
            if(response.status == 200) {
                if(response.data.length) {
                    $scope.mode = response.data[0].mode;
                }
               
                console.log('mode', $scope.mode);
            }
        }, function myError(response) {
            console.log(response);
        });
    }


    $scope.deletePerson = function(mobileNumber) {
        console.log('delete method called');
        $http({
            method: "DELETE",
            url: _config.api.invokeUrl + '/mobilenumber',
            headers: {
                Authorization: $scope.authToken
            },
            data: JSON.stringify({
                "mobileNumber": mobileNumber,
                "deviceId": $scope.deviceId
            }),
            contentType: 'application/json'
        }).then(function mySuccess(response) {
            if(response.status == 200) {
                $scope.getMobileNumber();
            }
        }, function myError(response) {
            console.log(response);
        });
    }

    $scope.getSensorValues = function() {
        $http({
            method: "GET",
            params: {'deviceId': $scope.deviceId},
            url: _config.sensor_api.invokeUrl + '/sensors',
            headers: {
                Authorization: $scope.authToken
            }
            
        }).then(function mySuccess(response) {
            if(response.status == 200) {
                if(response.data.length) {
                    //$scope.mode = response.data[0].time;
                }
               
                //console.log('mode', $scope.mode);
            }
        }, function myError(response) {
            console.log(response);
        });
    }

    $scope.parseAuthToken = function(token) {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    }

    $scope.logout = function() {
        WildRydes.signOut();
        alert("You have been signed out.");
        window.location = "signin.html";
    }

    window.setIntervalVar;

    $scope.captureImg = function() {
        console.log('capture initiated');
        var iframe = document.getElementById('triggerCapture');
        iframe.src = iframe.src;
        window.setIntervalVar = setInterval("document.getElementById('screenshot').src='http://35.239.70.45:8008/snap.png';", 2000);
    }

    $scope.removeReload = function() {
        clearInterval(window.setIntervalVar);
    }

    $scope.siren = "off"

    $scope.checkSiren = function() {
        if($scope.siren == "off") {
            $scope.startSiren();
        }
        else {
            $scope.stopSiren();
        }
    }

    $scope.startSiren = function (mode) {
        $scope.siren = "on"
        console.log('postSiren method called');
        $http({
            method: "POST",
            url: _config.siren_api.invokeUrl + '/post',
            headers: {
                Authorization: $scope.authToken
            },
            data: JSON.stringify({
                "siren": "ON",
                "deviceId": $scope.deviceId
            }),
            contentType: 'application/json'
        }).then(function mySuccess(response) {
            if(response.status == 201) {
                console.log('response', response);
                //$scope.getMobileNumber();
            }
           // console.log(response);
        }, function myError(response) {
            console.log(response);
        });
    }

    $scope.stopSiren = function (mode) {
        console.log('stopSiren method called');
        $scope.siren = "off"
        $http({
            method: "POST",
            url: _config.siren_api.invokeUrl + '/post',
            headers: {
                Authorization: $scope.authToken
            },
            data: JSON.stringify({
                "siren": "OFF",
                "deviceId": $scope.deviceId
            }),
            contentType: 'application/json'
        }).then(function mySuccess(response) {
            if(response.status == 201) {
                console.log('response', response);
                //$scope.getMobileNumber();
            }
           // console.log(response);
        }, function myError(response) {
            console.log(response);
        });
    }

    
    


    
});
