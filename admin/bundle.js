(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*
 * Copyright 2015-2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *  http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

/*
 * NOTE: You must set the following string constants prior to running this
 * example application.
 */
var awsConfiguration = {
   poolId: 'ap-south-1:d42d6cf0-89cd-4a4d-9d00-c1aa7276aa79', // 'YourCognitoIdentityPoolId'
   host: 'a1gq176f0b2rcm-ats.iot.ap-south-1.amazonaws.com', // 'YourAwsIoTEndpoint', e.g. 'prefix.iot.us-east-1.amazonaws.com'
   region: 'ap-south-1' // 'YourAwsRegion', e.g. 'us-east-1'
};
module.exports = awsConfiguration;


},{}],2:[function(require,module,exports){
var WildRydes = window.WildRydes || {};
WildRydes.map = WildRydes.map || {};
var authToken;

var app = angular.module('myApp', []);
app.controller('myCtrl', function($scope, $http) {
  
  $scope.notifs = [];
  $scope.hi = "";
  $scope.modeOptions = [['MANUAL'],['AUTO']];
  $scope.showConfirmation = false;
  var notificationAudio = new Audio('notificationAudio.mp3');
  var sirenAudio = new Audio('sirenAudio.mp3');
  var offlineAudio = new Audio('device-offline.mp3');
  //var Audio = new Audio('siren.mp3');
  //$scope.xyz = [];
  document.getElementById('no-notif-div').style.display = "block";
  document.getElementById('notif-div').style.display = "none";
  $scope.dashboardLocation = "28.484993,77.094941";
  $scope.orderByField = 'deviceId';
  $scope.reverseSort = false;

  // cognito related stuff

    WildRydes.authToken.then(function setAuthToken(token) {
        if (token) {
            $scope.authToken = token;
            $scope.parsedAuthToken = $scope.parseAuthToken(token);
            $scope.deviceId = $scope.parsedAuthToken['custom:device_id'];
            $scope.email = $scope.parsedAuthToken.email;
            $scope.cognitoUserID = $scope.parsedAuthToken.sub
        } else {
            window.location.href = 'signin.html';
        }
    }).catch(function handleTokenError(error) {
         //alert(error);
         //window.location.href = '/signin.html';
    });

   $scope.toggleSidebar = function() {
      var element = document.getElementById("sidebar");
      element.classList.toggle("active");
   }


    //
// Instantiate the AWS SDK. The AWS SDK for 
// JavaScript (aws-sdk) is used for Cognito Identity/Authentication, and 
// the AWS IoT SDK for JavaScript (aws-iot-device-sdk) is used for the
// WebSocket connection to AWS IoT and device shadow APIs.
// 
var AWS = require('aws-sdk');
var AWSIoTData = require('aws-iot-device-sdk');
var AWSConfiguration = require('./aws-configuration.js');

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

const mqttClient = AWSIoTData.device({
   region: AWS.config.region,
   host:AWSConfiguration.host,
   clientId: clientId,
   protocol: 'wss',
   keepalive: 20,
   maximumReconnectTimeMs: 8000,
   debug: true,
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

//  stuff to do when mqtt connection is established

window.mqttClientConnectHandler = function() {
   console.log('Connected!');
   mqttClient.subscribe('device/+/sensor');
   mqttClient.subscribe('$aws/things/+/shadow/update');
   mqttClient.subscribe('device/+/sim_response');
   mqttClient.subscribe('device/+/sim_command');
   //mqttClient.subscribe('$aws/things/+/shadow/get/accepted');
};

//  stuff to do when mqtt message is received

window.mqttClientMessageHandler = function(topic, payload) {
   console.log('topic: ' + topic + ', msg:' + payload.toString());
   if(!topic.includes('Saurav_esp_ledstrip2') && !topic.includes('sim_response')) {
   
   var parsedMsg = JSON.parse(payload);

   if (topic.includes('update') && parsedMsg.state.reported && Object.keys(parsedMsg.state.reported).length != 2) {
     document.getElementById('wait-msg').style.display = "none";
     document.getElementById('confirmation-msg').style.display = "block";
     document.getElementById('last-reset').style.display = "block";
     $scope.lastReset = parsedMsg.state.reported.last_reset;
     //console.log('last reset', parsedMsg.state.reported.last_reset);
     setTimeout(function() {document.getElementById('confirmation-msg').style.display = "none"}, 4000);
     setTimeout(function() {document.getElementById('last-reset').style.display = "none"}, 4000);
   }

   if (topic.includes('update') && parsedMsg.state.reported && Object.keys(parsedMsg.state.reported).length == 2) {
     toastr.error('Device '+ parsedMsg.state.reported.deviceId + ' is offline!' );
     offlineAudio.play();
   }

   if(topic.includes('sensor')) {
      $scope.msg = JSON.parse(payload);
      $scope.addNotification($scope.msg);
      $scope.notifs.push($scope.msg);
      notificationAudio.play();
      //showLocalNotification('emergency at' + $scope.msg.deviceId, 'yo', swRegistration);
   }
 }

  if(topic.includes('sim_response')) {
   document.getElementById('simResponse').innerHTML = payload;
   //document.getElementById('simResponse').style.display = block;
  }

};

$scope.makeApiCall = function (parsedMsg) {
  parsedMsg.state.reported["deviceId"] = $scope.editModalDevice.deviceId; 
  var data = JSON.stringify(parsedMsg.state.reported);
  $http({
            method: "POST",
            url: 'https://kjp1y833xk.execute-api.ap-south-1.amazonaws.com/test/device',
            data: data,
            contentType: 'application/json'
        }).then(function mySuccess(response) {
            if(response.status == 201) {
               $scope.getDevices();
               document.getElementById('confirmation-msg').style.display = "block";
               console.log('var', $scope.showConfirmation);
               setTimeout(function() {document.getElementById('confirmation-msg').style.display = "none"}, 4000);
                //editDevice ? $('#editDeviceModal').modal('toggle') : $('#addDeviceModal').modal('toggle');               
                //$('#addDeviceModal').modal('toggle');
                //$scope.getDevices();
                //$scope.deviceId = $scope.customerName = $scope.mobileNumbersString = $scope.mode = null;
            }
        }, function myError(response) {
            console.log(response);
        });
}

$scope.commandPayload = "";

$scope.sendCmd = function(deviceId, infoType) {
  var message = {}

  if(infoType === 'CALL' || infoType === 'USSD') {
    message[infoType] = [$scope.commandPayload];
    //message.infoType = "92828";
    //message = { [infoType] : [$scope.commandPayload]};
  }
  else {
    message = { "command" : [infoType]};
  }
  mqttClient.publish('device/' + deviceId + '/sim_command', JSON.stringify(message));
}


$scope.clearCmd = function() {
  $scope.commandPayload = "";
  if($scope.infoType === 'OPERATOR' || $scope.infoType === 'SIGNAL') {
    document.getElementById("myInput").disabled = true;
  } else {
    document.getElementById("myInput").disabled = false;
  }
}


$scope.addNotification = function(notif) {
  document.getElementById('no-notif-div').style.display = "none";
  document.getElementById('notif-div').style.display = "block";
  var div = document.createElement("div");
  div.id = notif.deviceId + '-' + notif.time;
  div.className = 'n-div';
  var timee = $scope.timeConverter1(notif.time);
  var test = "<div style='margin-bottom:6px;'>" + notif.deviceId + ': ' + notif.sensor + " detected at " + timee + "</div>";
  test += "<button type='button' class='btn btn-outline-primary control-panel-btn'><i class='fas fa-video'></i>&nbsp;Live Feed</button>" +
          "<button class='btn btn-outline-danger control-panel-btn'><i class='fa fa-bell'></i>&nbsp;Play Siren</button>" +
          "<button class='btn btn-outline-danger control-panel-btn'><i class='fa fa-bell'></i>&nbsp;Stop Siren</button>" +
          "<button class='btn btn-outline-primary control-panel-btn'><i class='fas fa-paper-plane'></i>&nbsp;Trigger SMS</button>" +
          "<button class='btn btn-outline-primary control-panel-btn'><i class='fas fa-route'></i>&nbsp;Live Tracking</button>" + 
          "<button class='btn btn-outline-primary control-panel-btn'><i class='fas fa-eye'></i>&nbsp;Upload Evidence</button><br>" +
          "<a></a><a></a><br>";
  div.innerHTML = test;
  document.getElementById('notificationDiv').prepend(div);
  var childNodes = div.childNodes;
  var livePreviewLink = "http://35.222.21.172/image_retrival.php?deviceid=" + 
                        notif.deviceId + "&sensor=" + notif.sensor + "&time1=" + notif.time;
  childNodes[1].onclick = function() {openLiveFeed(notif.deviceId)};
  childNodes[2].onclick = function() {playSirenJs(notif.deviceId, 'ON')};
  childNodes[3].onclick = function() {playSirenJs(notif.deviceId, 'OFF')};
  childNodes[4].onclick = function() {sendMessagesJs()};
  childNodes[5].onclick = function() {window.open('http://ebs-track.s3-website.ap-south-1.amazonaws.com','_blank');}
  childNodes[6].onclick = function() {window.open('uploadEvidence.html?notificationId='+ notif.deviceId + '_' + notif.time, '_blank')};
  childNodes[9].innerHTML = 'Live Preview!'; 
  childNodes[9].href = livePreviewLink;
  childNodes[9].target = '_blank';
  childNodes[9].classList.add('m-l');
  childNodes[8].id = 'img-' + notif.deviceId + '-' + notif.time;
  childNodes[8].classList.add('pointer');
  childNodes[8].innerHTML = 'ESCALATE TO POLICE!';
  childNodes[8].onclick = function() {escalate(notif.deviceId, notif.time, notif.sensor, timee)};
}

function escalate(deviceId, time, sensor, timee) {
  var escMsg = {
    'deviceId': deviceId,
    'time': time,
    'sensor': sensor,
    'parsedTime': timee
  }

  mqttClient.publish('test', JSON.stringify(escMsg));
  $('#escModal').modal('show');
  //console.log('ih');
}

$scope.generateRouteLink = function(customerLocation) {
  return "https://www.google.com/maps/dir/?api=1&origin=" + $scope.dashboardLocation +
         "&destination=" + customerLocation;
}

function openLiveFeed(deviceId) {
  var cameraString = ''
  $http({
      method: "GET",
      url: 'https://kjp1y833xk.execute-api.ap-south-1.amazonaws.com/test/device/'+ deviceId + '/camera'
  }).then(function mySuccess(response) {
      if(response.status == 200) {
          console.log('cameras', (response.data).toString());
          cameraString = (response.data).toString();
          window.open('http://35.222.21.172/cam/play.php?cam_ID=' + cameraString,'_blank');     
      }
  }, function myError(response) {
      console.log(response);
  });
}

$scope.openLiveFeedFromDialog = function() {
  var cameraString = $scope.editModalCameras.toString();
  console.log($scope.editModalCameras.toString());
  window.open('http://35.222.21.172/cam/play.php?cam_ID=' + cameraString,'_blank');
}

    $scope.siren = 0;

    $scope.playSiren = function(deviceId, mode) {
     var sirenId = 'siren_' + deviceId;

     $scope.payload = {
         "state" : {
           "desired": {
             "mode" : [mode]
           }
         }
      }

     console.log(JSON.stringify($scope.payload));

     if(mode == 'ON') {
       sirenAudio.play();
     } else {
       sirenAudio.pause();
       sirenAudio.currentTime = 0;
     }

     mqttClient.publish('$aws/things/' + sirenId + '/shadow/update',
                         JSON.stringify($scope.payload));
    }


function playSirenJs(deviceId, mode) {
  $scope.playSiren(deviceId, mode);
}


$scope.openAddDeviceModal = function(){
   $scope.mobileNumbersString = null;
   $('#addDeviceModal').modal('toggle'); 
}

$scope.openEditDeviceModal = function(device) {

  document.getElementById('simResponse').innerHTML = '';
  $scope.commandPayload = "";
  document.getElementById('wait-msg').style.display = "none";
  console.log('device', device);
  $scope.xyz = device.mode;
  $scope.showConfirmation = false;
   //$scope.mobileNumbersString = device.mobileNumbers.toString();
   $('#editDeviceModal').modal('toggle');
   $scope.editModalDevice = device;
   $scope.editModalDevice.mode = device.mode[0];
   //$scope.editModalDevice.mode = device.mode[0];
   $scope.editModalDevice.msg_mode = device.msg_mode[0];
   $scope.editModalDevice.call_mode = device.call_mode[0];
   //$scope.editModalDevice.mode = ['MANUAL'];
   $scope.getDeviceNotifications(device.deviceId);
   $scope.getDeviceCameras(device.deviceId);
   $scope.editModalCameras = '';
}



//
// Install connect/reconnect event handlers.
//
mqttClient.on('connect', window.mqttClientConnectHandler);
//mqttClient.on('reconnect', window.mqttClientReconnectHandler);
mqttClient.on('message', window.mqttClientMessageHandler);

$scope.getDevices = function(){
         $http({
            method: "GET",
            url: 'https://kjp1y833xk.execute-api.ap-south-1.amazonaws.com/test/device',
            contentType: 'application/json'
        }).then(function mySuccess(response) {
            if(response.status == 200) {
              //console.log(response.data);
                $scope.deviceArray = response.data;
            }
        }, function myError(response) {
            console.log(response);
        }); 
 }

$scope.postDevice = function (editDevice, setting) {
   $scope.mobileNumbersArray = $scope.mobileNumbersString.split(',');
   if(editDevice) {

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
                $scope.notifications = response.data;
                console.log('notifs', $scope.notifications);
            }
        }, function myError(response) {
            console.log(response);
        });
    }

$scope.getDeviceCameras = function (deviceId) {
        $scope.editModalCameras = '';
        $http({
            method: "GET",
            url: 'https://kjp1y833xk.execute-api.ap-south-1.amazonaws.com/test/device/'+ deviceId + '/camera'
        }).then(function mySuccess(response) {
            if(response.status == 200) {
                console.log('cameras', response.data);
                $scope.editModalCameras = response.data;
            }
        }, function myError(response) {
            console.log(response);
        });
    }

$scope.editDeviceCameras = function (deviceId) {

   $http({
            method: "PUT",
            url: 'https://kjp1y833xk.execute-api.ap-south-1.amazonaws.com/test/device/'+ deviceId + '/camera',
            data: JSON.stringify({'deviceId': deviceId, 'cameras': $scope.editModalCameras.split(',')}),
            contentType: 'application/json'
        }).then(function mySuccess(response) {
            if(response.status == 204) {
              // document.getElementById('wait-msg').style.display = "none";
              // document.getElementById('confirmation-msg').style.display = "block";
              //  console.log('var', $scope.showConfirmation);
              //  setTimeout(function() {document.getElementById('confirmation-msg').style.display = "none"}, 4000);
              console.log("success");
              window.alert("Camera list updated successfully! ✌️");
            }
        }, function myError(response) {
            window.alert('Error updating camera list!')
        });
 
}

    function sendMessagesJs() {
        fetch('http://api.textlocal.in/send/?apiKey=4KyJdpNUImc-IfWruKM8yEXi1MPtzN3DobwnNOiQzb&sender=TXTLCL&group_id=1037625&message=Emergency%20at%20device0002-http://ebs-admin.s3-website.ap-south-1.amazonaws.com/admin/cam.html').then(function(response) {
            return response.json();
        }).then(function(data) {
            alert('Messages Triggered Successfully! :D');
        }).catch(function() {
            console.log("Error in sending messages :(");
        });
    }


    var init = function () {
      $scope.toggleSidebar(); 
      $scope.getDevices();
   };

   init();

   function yourFunction(){
    $scope.getDevices();
    setTimeout(yourFunction, 10000);
   }

   yourFunction();

   $scope.publishMode = function(deviceId, mode) {
     $scope.payload = {
         "state" : {
           "desired": {
             "mode" : [mode]
           }
         }
        }
     console.log(JSON.stringify($scope.payload));
     mqttClient.publish('$aws/things/' + deviceId + '/shadow/update',
                         JSON.stringify($scope.payload));
     document.getElementById('wait-msg').style.display = "block";
   }

   $scope.publishCallMode = function(deviceId, mode) {
     $scope.payload = {
         "state" : {
           "desired": {
             "call_mode" : [mode]
           }
         }
        }
        console.log(JSON.stringify($scope.payload));
     mqttClient.publish('$aws/things/' + deviceId + '/shadow/update',
                         JSON.stringify($scope.payload));
     document.getElementById('wait-msg').style.display = "block";
   }

   $scope.publishMsgMode = function(deviceId, mode) {
     $scope.payload = {
         "state" : {
           "desired": {
             "msg_mode" : [mode]
           }
         }
        }
        console.log(JSON.stringify($scope.payload));
     mqttClient.publish('$aws/things/' + deviceId + '/shadow/update',
                         JSON.stringify($scope.payload));
     document.getElementById('wait-msg').style.display = "block";
   }


   $scope.publishNumbers = function(deviceId, numberString, autoOrManualOrAdmin) {
     var numbersArray = numberString.split(',');
     console.log('NumbersArr', numbersArray);
     if (autoOrManualOrAdmin == 'auto') {
         $scope.payload = {
         "state" : {
           "desired": {
             "auto_num" : numbersArray
           }
         }
        }

        //$scope.putDevice(JSON.stringify({'deviceId': deviceId, 'auto_num': numbersArray}));

     } else if (autoOrManualOrAdmin == 'manual') {
       $scope.payload = {
       "state" : {
         "desired": {
           "man_num" : numbersArray
         }
       }
      }

      //$scope.putDevice(JSON.stringify({'deviceId': deviceId, 'man_num': numbersArray})) ;
     }

     else if(autoOrManualOrAdmin == 'admin') {
       $scope.payload = {
       "state" : {
         "desired": {
           "admin_num" : numbersArray
         }
       }
      }

      //$scope.putDevice(JSON.stringify({'deviceId': deviceId, 'admin_num': numbersArray})) ;
     }

     document.getElementById('wait-msg').style.display = "block";

     mqttClient.publish('$aws/things/' + deviceId +'/shadow/update',
                         JSON.stringify($scope.payload));
   }

   $scope.captureScreenshot = function (did, sensor, timestamp, triggerSrc) {
        var queryParams = {deviceId: did, sensor: sensor, timestamp: timestamp}
        $http({
            method: "GET",
            url: 'http://35.239.70.45/test.php',
            params: queryParams
        }).then(function mySuccess(response) {
          if(response.status == 200) {
            var link = (response.data).split('Success<br>').pop();
            if (triggerSrc == 'notification') {
              document.getElementById('img-'+ did + '-' + timestamp).href = link;
              document.getElementById('img-'+ did + '-' + timestamp).target = '_blank';
              document.getElementById('img-'+ did + '-' + timestamp).innerHTML = 'View Screenshot';

            } else {
              alert('Link: '+ link);
            }
          }
        }, function myError(response) {
            console.log('Error: ', response);
            alert('Error taking screenshot!')
        });
 }


$scope.timeConverter1 = function(UNIX_timestamp){
  var a = new Date(UNIX_timestamp * 1000);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
  return time;
}

$scope.timeConverter = function(UNIX_timestamp){
  var d = new Date(parseInt(UNIX_timestamp)).toString("HH:mm:ss - d MMM yyyy ");
  return (d);
}

// END OF CONTROLLER
});


},{"./aws-configuration.js":1,"aws-iot-device-sdk":"aws-iot-device-sdk","aws-sdk":"aws-sdk"}]},{},[2]);
