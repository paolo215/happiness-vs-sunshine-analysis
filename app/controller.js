app.controller("mainController", ["$scope", function($scope) {

    $scope.showMain = true;

    // These are used to switch responses to analysis

    $scope.showMap = function() {
        $scope.showMain = true;
    }

    $scope.showAnalysis = function() {
        $scope.showMain = false;
    }


}]);
