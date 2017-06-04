'use strict';


angular.module("main").directive("analysis", function() {
    return {
        restrict: "E",
        scope: {},
        controller: ["$scope", "$http", function analysisController($scope, $http) {

        var barChart;
        $scope.yes_no_ids = [];
                
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
            var yes_no_data = data["yes_no"];
            for(var item in yes_no_data["questions"]) {
                $scope.yes_no_ids.push("bar" + item.toString());
            };
            var scale_data = data["scale"];
            var scale_locations_data = scale_data["locations"];

            var evaluated_scale_data = evaluate_scale(scale_locations_data);
            barChart = createBarChart(evaluated_scale_data);              


            var hasRegistered = false;

            $scope.$watch(function() {
                if(hasRegistered) return;
                hasRegistered = true;
                $scope.$$postDigest(function() {
                    hasRegistered = false;
                    for(var item in yes_no_data["questions"]) {
                        var question = yes_no_data["questions"][item];
                        var question_data = yes_no_data["results"][question];
                        var yes = question_data["yes"]["locations"];
                        var no = question_data["no"]["locations"];
                        var evaluate_yes_no_data = evaluate_yes_no(yes, no);
                        var yes_no_chart = createClusteredBarChart($scope.yes_no_ids[item], question, evaluate_yes_no_data);
                    };

                });
            });
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


        var evaluate_yes_no = function(yes, no) {
            var scale = [];
            for(var item in sorted) {
                var location = sorted[item];
                scale.push({ 
                    "region" : location,
                    "yes_mean" : Number(yes[location]["mean"].toPrecision(3)),
                    "yes_error" : Number(yes[location]["error"].toPrecision(3)),
                    "no_mean" : Number(no[location]["mean"].toPrecision(3)),
                    "no_error" : Number(no[location]["error"].toPrecision(3)),
                    "sunshine": sunshine[location],
                   });
            };
            return scale;
        };

        var createBarChart = function(data) {
            var chart = AmCharts.makeChart("analysisBarChart", {
                "type": "serial",
                "dataProvider": data,
                "startDuration": 0.2,
                "titles": [{"text": "Average Happiness Scores", "size": 15}],
                "valueAxes": [{
                    "id": "v1",
                    "axisAlpha": 0,
                    "minimum": 0,
                    "maximum": 70,
                    "title": "Average score",
                }],
                "graphs": [
                {
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
                    "title": "Bar",

                },
                {
                    "balloonText" : "Value:<b>[[mean]]</b><br>Error:<b>[[error]]</b>" +
                                    "<br>Sunshine:<b>[[sunshine]] days</b>",
                    "type": "smoothedLine",
                    "lineThickness": 2,
                    "valueField": "mean",
                    "bulletAxis": "v2",
                    "fillAlphas": 0,
                    "title": "Smoothed Line",
                    "hidden": true,
                },


                ],
                "legend": { "useGraphSettings": true },
                "categoryField": "region",
                "categoryAxis": {
                    "gridPosition": "start",
                    "axisAlpha": 0,
                    "labelFunction": function(value) {
                        return value + "<br>" + sunshine[value] + " days";
                    },
                    "title" : "Region",
                },

            });
            return chart;
        };

        var createClusteredBarChart = function(id, question, data) {
            var chart = AmCharts.makeChart(id, {
                "type": "serial",
                "dataProvider": data,
                "startDuration": 0.2,
                "titles": [ {"text": question, "size": 15 }],
                "valueAxes": [{
                    "id": "v1",
                    "axisAlpha": 0,
                    "minimum": 0,
                    "maximum": 70,
                    "title": "Average score",
                }],
                "graphs": [
                {
                    "balloonText" : "Value:<b>[[yes_mean]]</b><br>Error:<b>[[yes_error]]</b>" +
                                    "<br>Sunshine:<b>[[sunshine]] days</b>",
                    "labelText": "[[yes_mean]]",
                    "type": "column",
                    "bullet": "yError",
                    "bulletColor": "#000",
                    "errorField": "yes_error",
                    "lineThickness": 2,
                    "title": "Yes",
                    "valueField": "yes_mean",
                    "bulletAxis": "v1",
                    "fillAlphas": 1,
                    "color": "#FF0000",

                },
                {
                    "balloonText" : "Value:<b>[[yes_mean]]</b><br>Error:<b>[[yes_error]]</b>" +
                                    "<br>Sunshine:<b>[[sunshine]] days</b>",
                    "type": "smoothedLine",
                    "lineThickness": 2,
                    "valueField": "yes_mean",
                    "bulletAxis": "v2",
                    "fillAlphas": 0,
                    "title": "Yes Smoothed Line",
                    "hidden": true,
                },
                {
                    "balloonText" : "Value:<b>[[no_mean]]</b><br>Error:<b>[[no_error]]</b>" +
                                    "<br>Sunshine:<b>[[sunshine]] days</b>",
                    "labelText": "[[no_mean]]",
                    "type": "column",
                    "bullet": "yError",
                    "bulletColor": "#000",
                    "errorField": "no_error",
                    "title": "No",
                    "lineThickness": 2,
                    "valueField": "no_mean",
                    "bulletAxis": "v1",
                    "fillAlphas": 1,
                    "color": "#0000FF",
                },
                {
                    "balloonText" : "Value:<b>[[no_mean]]</b><br>Error:<b>[[no_error]]</b>" +
                                    "<br>Sunshine:<b>[[sunshine]] days</b>",
                    "type": "smoothedLine",
                    "lineThickness": 2,
                    "valueField": "no_mean",
                    "bulletAxis": "v2",
                    "fillAlphas": 0,
                    "title": "No Smoothed Line",
                    "hidden": true,
                },

                ],
                "legend": { "useGraphSettings": true },
                "categoryField": "region",
                "categoryAxis": {
                    "gridPosition": "start",
                    "axisAlpha": 0,
                    "labelFunction": function(value) {
                        return value + "<br>" + sunshine[value] + " days";
                    },
                    "title" : "Region",
                },
                
                //"export": {
                //    "enabled" : true,
                //},

            });
            return chart;

        };


        }],
        templateUrl: 'analysis.html'


    }



});
