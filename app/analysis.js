'use strict';


angular.module("main").directive("analysis", function() {
    return {
        restrict: "E",
        scope: {},
        controller: ["$scope", "$http", function analysisController($scope, $http) {

        var barChart;
                
        // hard coded annual hours worth of sunshine values. 
        //I couldn't find an easy to use and easy to understand API
        var sunshine = {
            "South East Asia": 1876.7,
            "Northern Europe": 1633,
            "Ontario, Canada": 2066.4,
            "Sacramento, CA": 3607.8,
            "Portland, OR": 2340.9,
            "Middle East": 3248.2,
            "Southern California": 3054.6,

        };

        for(var loc in sunshine) {
            sunshine[loc] = Number((sunshine[loc] / 24.0).toPrecision(3));
        }
        
        // Sort by value
        var tempArray = [];
        for(var loc in sunshine) {
            tempArray.push([loc, sunshine[loc]]);
        };

        tempArray.sort(function(a,b) { return a[1] - b[1]});
         
        // Obtain only the keys
        var sorted = [];
        for(var item in tempArray) {
            sorted.push(tempArray[item][0]);
        };



        $http.get("analysis.json").then(function(data) {
            data = data.data;
            var scale_data = data["scale"];
            var scale_locations_data = scale_data["locations"];

            var evaluated_scale_data = evaluate_scale(scale_locations_data);
            barChart = createBarChart(evaluated_scale_data);              

        });


        var evaluate_scale = function(data) {
            var scale = [];
            for(var item in sorted) {
                var location = sorted[item];
                scale.push({ 
                    "region" : location,
                    "mean" : Number(data[location]["mean"].toPrecision(3)),
                    "error" : Number(data[location]["error"].toPrecision(3)),
                    "sunshine": sunshine[location],
                   });
            };
            return scale;
        };

        var createBarChart = function(data) {
            var chart = AmCharts.makeChart("analysisBarChart", {
                "type": "serial",
                "dataProvider": data,
                "startDuration": 1,
                "valueAxes": [{
                    "id": "v1",
                    "axisAlpha": 0,
                    "minimum": 0,
                    "maximum": 70,
                    "title": "Average score",
                }],
                "graphs": [{
                    "balloonText" : "Value:<b>[[mean]]</b><br>Error:<b>[[error]]</b>" +
                                    "<br>Sunshine:<b>[[sunshine]] days</b>",
                    "labelText": "[[mean]]",
                    "type": "column",
                    "bullet": "yError",
                    "bulletColor": "#000",
                    "errorField": "error",
                    "lineThickness": 2,
                    "valueField": "mean",
                    "bulletAxis": "v1",
                    "fillAlphas": 1,

                }],
                "categoryField": "region",
                "categoryAxis": {
                    "gridPosition": "start",
                    "axisAlpha": 0,
                    "labelFunction": function(value) {
                        return value + "<br>" + sunshine[value] + " days";
                    },
                    "title" : "Region",
                },
                "export": {
                    "enabled" : true,
                },

            });
            return chart;
        };


        }],
        templateUrl: 'analysis.html'


    }



});
