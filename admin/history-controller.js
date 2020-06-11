var app = angular.module('myApp', []);
app.controller('historyCtrl', function($scope, $http) {

   $scope.toggleSidebar = function(){
      var element = document.getElementById("sidebar");
      element.classList.toggle("active");
   }

    $scope.getNotifications = function () {
        $http({
            method: "GET",
            url: 'https://kjp1y833xk.execute-api.ap-south-1.amazonaws.com/test/sensors',
            contentType: 'application/json',
            params: {'pageCount': 40}
        }).then(function mySuccess(response) {
            if(response.status == 200) {
                $scope.notificationsArray = response.data;
                console.log('res:', response.data);
            }
        }, function myError(response) {
            console.log(response);
        });
 	}

	 $scope.timeConverter = function(UNIX_timestamp){
	  var d = new Date(parseInt(UNIX_timestamp)).toString("HH:mm:ss - d MMM yyyy ");
	  return (d);
	 }

	 $scope.generateImagesLink = function(data) {
	 	var imagesLink = "http://35.239.70.45/image_retrival.php?deviceid=" + 
                        data.deviceId + "&sensor=" + data.sensor + "&time1=" + data.time;
	 	return imagesLink
	 };

 	var init = function () {
      $scope.toggleSidebar();
      $scope.getNotifications();
      //$scope.getDevices();
    };

    init();
});