app.controller("mainController", ["$scope", function($scope) {

    $scope.showMain = true;


    $scope.showMap = function() {
        $scope.showMain = true;
        console.log("showMap");
    }

    $scope.showAnalysis = function() {
        $scope.showMain = false;
    }


}]);
