var WildRydes = window.WildRydes || {};
WildRydes.map = WildRydes.map || {};
var authToken;

var app = angular.module('myApp', []);
app.controller('myCtrl', function($scope, $http) {
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
        } else {
            window.location.href = '../signin.html';
        }
    }).catch(function handleTokenError(error) {
         //alert(error);
         //window.location.href = '/signin.html';
    });

   $scope.init = function () {   
      var audio = new Audio('siren.mp3');
      $scope.getDevices();
   }

   var audio = new Audio('siren.mp3');

   //$scope.getDevices();

   $scope.toggleSidebar = function(){
      var element = document.getElementById("sidebar");
      element.classList.toggle("active");
   }


    //
// Instantiate the AWS SDK and confi$httpguration objects.  The AWS SDK for 
// JavaScript (aws-sdk) is used for Cognito Identity/Authentication, and 
// the AWS IoT SDK for JavaScript (aws-iot-device-sdk) is used for the
// WebSocket connection to AWS IoT and device shadow APIs.
// 
var AWS = require('aws-sdk');
var AWSIoTData = require('aws-iot-device-sdk');
var AWSConfiguration = require('./aws-configuration.js');

console.log('Loaded AWS SDK for JavaScript and AWS IoT SDK for Node.js');

//
// Remember our current subscription topic here.
//
var currentlySubscribedTopic = 'bell';

//
// Remember our message history here.
//
var messageHistory = '';

//
// Create a client id to use when connecting to AWS IoT.
//
var clientId = 'mqtt-explorer-' + (Math.floor((Math.random() * 100000) + 1));

//
// Initialize our configuration.
//
AWS.config.region = AWSConfiguration.region;

AWS.config.credentials = new AWS.CognitoIdentityCredentials({
   IdentityPoolId: AWSConfiguration.poolId
});

//
// Create the AWS IoT device object.  Note that the credentials must be 
// initialized with empty strings; when we successfully authenticate to
// the Cognito Identity Pool, the credentials will be dynamically updated.
//
const mqttClient = AWSIoTData.device({
   //
   // Set the AWS region we will operate in.
   //
   region: AWS.config.region,
   //
   ////Set the AWS IoT Host Endpoint
   host:AWSConfiguration.host,
   //
   // Use the clientId created earlier.
   //
   clientId: clientId,
   //
   // Connect via secure WebSocket
   //
   protocol: 'wss',
   keepalive: 40000,
   //
   // Set the maximum reconnect time to 8 seconds; this is a browser application
   // so we don't want to leave the user waiting too long for reconnection after
   // re-connecting to the network/re-opening their laptop/etc...
   //
   maximumReconnectTimeMs: 8000,
   //
   // Enable console debugging information (optional)
   //
   debug: true,
   //
   // IMPORTANT: the AWS access key ID, secret key, and sesion token must be 
   // initialized with empty strings.
   //
   accessKeyId: '',
   secretKey: '',
   sessionToken: ''
});

//
// Attempt to authenticate to the Cognito Identity Pool.  Note that `this
// example only supports use of a pool which allows unauthenticated 
// identities.
//
var cognitoIdentity = new AWS.CognitoIdentity();
AWS.config.credentials.get(function(err, data) {
   if (!err) {
      console.log('retrieved identity: ' + AWS.config.credentials.identityId);
      console.log('AWS.config', AWS.config);
      console.log('AWS', AWS);
      var params = {
         IdentityId: AWS.config.credentials.identityId
      };
      cognitoIdentity.getCredentialsForIdentity(params, function(err, data) {
         if (!err) {
            //
            // Update our latest AWS credentials; the MQTT client will use these
            // during its next reconnect attempt.
            //
            mqttClient.updateWebSocketCredentials(data.Credentials.AccessKeyId,
               data.Credentials.SecretKey,
               data.Credentials.SessionToken);
         } else {
            console.log('error retrieving credentials: ' + err);
            alert('error retrieving credentials: ' + err);
         }
      });
   } else {
      console.log('error retrieving identity:' + err);
      alert('error retrieving identity: ' + err);
   }
});

//
// Connect handler; update div visibility and fetch latest shadow documents.
// Subscribe to lifecycle events on the first connect event.
//
window.mqttClientConnectHandler = function() {
   mqttClient.subscribe('device/#');
};

//
// Reconnect handler; update div visibility.
//
// window.mqttClientReconnectHandler = function() {
//    console.log('reconnect');
//    document.getElementById("connecting-div").style.visibility = 'visible';
//    document.getElementById("explorer-div").style.visibility = 'hidden';
// };

window.mqttClientMessageHandler = function(topic, payload) {
   console.log('topic: ' + topic + ', msg:' + payload.toString());
   if(topic.includes('sensor')) {
      $scope.msg = JSON.parse(payload);
      console.log(($scope.msg).sensor);
      document.getElementById('notif-header').innerHTML = $scope.msg.deviceId;
      document.getElementById('notif-sensor').innerHTML = $scope.msg.sensor;
      document.getElementById('notif-time').innerHTML = $scope.msg.time;
      $('#exampleModal').modal('toggle');    
      audio.play();   
   }   
};

$scope.openDialog = function(){
   $('#exampleModal').modal('toggle'); 
}

$scope.openAddDeviceModal = function(){
   $scope.mobileNumbersString = null;
   $('#addDeviceModal').modal('toggle'); 
}

$scope.openEditDeviceModal = function(device) {
   $scope.mobileNumbersString = device.mobileNumbers.toString();
   $('#editDeviceModal').modal('toggle');
   console.log('device:', device);
   $scope.editModalDevice = device;
   $scope.getDeviceNotifications(device.deviceId);
   $scope.getDeviceCameras(device.deviceId);
}


$scope.stopSiren = function() {
   audio.pause();
   audio.currentTime = 0;
}

//
// Install connect/reconnect event handlers.
//
mqttClient.on('connect', window.mqttClientConnectHandler);
//mqttClient.on('reconnect', window.mqttClientReconnectHandler);
mqttClient.on('message', window.mqttClientMessageHandler);

$scope.getDevices = function () {
        $http({
            method: "GET",
            url: 'https://kjp1y833xk.execute-api.ap-south-1.amazonaws.com/test/device',
            contentType: 'application/json'
        }).then(function mySuccess(response) {
            if(response.status == 200) {
                $scope.deviceArray = response.data;
                console.log('deviceArr', $scope.deviceArray);
            }
        }, function myError(response) {
            console.log(response);
        });
 }

$scope.postDevice = function (editDevice) {
   $scope.mobileNumbersArray = $scope.mobileNumbersString.split(',');
   if(editDevice) {
      $scope.mobilePubTopic = "device/"+ $scope.editModalDevice.deviceId + "/mobile";
      $scope.mobilePubMessage = $scope.mobileNumbersString;
      mqttClient.publish($scope.mobilePubTopic, $scope.mobilePubMessage);
      var data = JSON.stringify({
         "deviceId": $scope.editModalDevice.deviceId,
         "customerName": $scope.editModalDevice.customerName,
         "mobileNumbers": $scope.mobileNumbersArray,
         "mode": $scope.editModalDevice.mode
      });
   } else {
      var data = JSON.stringify({
         "deviceId": $scope.deviceId,
         "customerName": $scope.customerName,
         "mobileNumbers": $scope.mobileNumbersArray,
         "mode": $scope.mode
      });
   }

        $http({
            method: "POST",
            url: 'https://kjp1y833xk.execute-api.ap-south-1.amazonaws.com/test/device',
            data: data,
            contentType: 'application/json'
        }).then(function mySuccess(response) {
            if(response.status == 201) {
                editDevice ? $('#editDeviceModal').modal('toggle') : $('#addDeviceModal').modal('toggle');               
                //$('#addDeviceModal').modal('toggle');
                $scope.getDevices();
                $scope.deviceId = $scope.customerName = $scope.mobileNumbersString = $scope.mode = null;
            }
        }, function myError(response) {
            console.log(response);
        });
    }

$scope.getDeviceNotifications = function (deviceId) {
        $http({
            method: "GET",
            params: {'deviceId': deviceId},
            url: 'https://kjp1y833xk.execute-api.ap-south-1.amazonaws.com/test/sensors'
        }).then(function mySuccess(response) {
            if(response.status == 200) {
                console.log('notifs', response.data)
                $scope.notifications = response.data;
                //console.log('persons', $scope.persons);
            }
        }, function myError(response) {
            console.log(response);
        });
    }

$scope.getDeviceCameras = function (deviceId) {
        $http({
            method: "GET",
            url: 'https://kjp1y833xk.execute-api.ap-south-1.amazonaws.com/test/device/'+ deviceId + 'cameras'
        }).then(function mySuccess(response) {
            if(response.status == 200) {
                console.log('cameras', response.data);
                //console.log('persons', $scope.persons);
            }
        }, function myError(response) {
            console.log(response);
        });
    }


    var init = function () {

       $scope.getDevices();
   };
// and fire it after definition
init();

});

