'use strict';


angular.module("main").directive("analysis", function() {
    return {
        restrict: "E",
        scope: {},
        controller: ["$scope", "$http", function analysisController($scope, $http) {

        var barChart;
                
        $http.get("analysis.json").then(function(data) {
            data = data.data;
            var scale_data = data["scale"];
            var scale_locations_data = scale_data["locations"];

            var evaluated_scale_data = evaluate_scale(scale_locations_data);
            barChart = createBarChart(evaluated_scale_data);              

        });


        var evaluate_scale = function(data) {
            var scale = [];
            for(var location in data) {
                scale.push({ 
                    "region" : location,
                    "mean" : data[location]["mean"],
                    "std" : data[location]["std"],
                   });
            };
            return scale;
        };

        var createBarChart = function(data) {
            console.log(data);
            var chart = AmCharts.makeChart("analysisBarChart", {
                "type": "serial",
                "dataProvider": data,
                "startDuration": 1,
                "valueAxes": [{
                    "id": "v1",
                    "axisAlpha": 0,
                    "minimum": 0,
                }],
                "graphs": [{
                    "balloonText" : "Value:<b>[[mean]]</b><br>Error:<b>[[std]]</b>",
                    "labelText": "[[mean]]",
                    "type": "column",
                    "bullet": "yError",
                    "bulletColor": "#000",
                    "errorField": "std",
                    "lineThickness": 2,
                    "valueField": "mean",
                    "bulletAxis": "v1",
                    "fillAlphas": 1,

                }],
                "categoryField": "region",
                "categoryAxis": {
                    "gridPosition": "start",
                    "axisAlpha": 0,
                }

            });
            console.log(chart);
            return chart;
        };


        }],
        templateUrl: 'analysis.html'


    }



});
