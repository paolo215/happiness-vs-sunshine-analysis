'use strict';


// TODO: Reduce calculation done here by doing it in python

angular.module("main").directive("responses", function() {
    return {
        restrict: "E",
        scope: {},
        controller: ["$scope","$http", function mapController($scope, $http) {

            // GPS locations for locations
            var latlong;

            // Selected country in drop list
            $scope.selectedCountry = "";

            // responses data from responses.json 
            var mapData;

            // Bubble map chart
            var mapChart;

            // Store ids for scale and yes and no questions
            $scope.scaleIds = [];
            $scope.yes_noIds = [];
            var scaleKey = "scale";
            var yes_noKey = "yes_no";

            
            

            // Get locations.json
            // Contains lat and long of each locations
            $http.get("locations.json").then(function(data) {

                // Store coordinates info
                latlong = data["data"];

                // Get responses.json
                $http.get("responses.json").then(function(data) {

                    // Store map data 
                    mapData = data["data"];

                    // Used for drop down list
                    $scope.selection = [];


                    var yes_noCounter = 0;
                    var scaleCounter = 0;

                    // Generate ids
                    for(var question in mapData["questions"]) {
                      if(mapData["questions"][question] == yes_noKey) {
                        $scope.yes_noIds.push(yes_noKey + yes_noCounter.toString());
                        yes_noCounter+=1;
                      }
                      if(mapData["questions"][question] == scaleKey) {
                        $scope.scaleIds.push(scaleKey + scaleCounter.toString());
                        scaleCounter+=1;
                      }
                      $scope.selection.push(question);
                    }

                    // Select first element
                    $scope.key = $scope.selection[0];

                    // Create map
                    // Create min and max radius for the bubble
                    calculateMinAndMax($scope.key);

                    // Evaluate data and use it to generate bubble image
                    var images = evaluateResponseMap($scope.key);

                    // Create bubble map
                    mapChart = createMap(images);
                    mapChart.addListener("clickMapObject", function(event) {
                        $scope.selectedCountry = event.mapObject.label;

                        // Show bar charts based on the label
                        showResponsesGraphs(event.mapObject.label);
                        // Show graphs
                        $scope.$apply();
                    });
                }, function(error) {
                    console.log(error);
                });


            }, function(error) {});
      



            // Show responses graphs 
            var showResponsesGraphs = function(place) {
                var yes_noCounter = 0;
                var scaleCounter = 0;

                // Iterate through each questions and generate graph for it
                for(var question in mapData[place]) {

                    // Evaluate and generate graph for yes_no question
                    if(mapData[place][question]["type"] == "yes_no") {
                        var yes_no = evaluateResponseYes_No(place, question);
                        var yes_noChart = createBar(yes_no, question, place, yes_noKey + yes_noCounter.toString());
                        yes_noCounter +=1;
                    }

                    // Evaluate and generate graph for scale type questions
                    if(mapData[place][question]["type"] == "scale") {
                        var scale = evaluateResponseScale(place, question);
                        var scaleChart = createBar(scale, question, place, scaleKey + scaleCounter.toString());
                        scaleCounter += 1;
                    }


                }
            }


            // get min and max values for bubble
            var minBulletSize = 3;
            var maxBulletSize = 20;
            var min = Infinity;
            var max = -Infinity;

            var calculateMinAndMax = function(key) {
                for (var country in mapData) {
                  if(country == "questions") {
                    continue;
                  }


                  var value = mapData[country]["count"];
                  if ( value < min ) {
                    min = value;
                  }
                  if ( value > max ) {
                    max = value;
                  }
                }
            }



            // it's better to use circle square to show difference between values, not a radius
            var maxSquare = maxBulletSize * maxBulletSize * 2 * Math.PI;
            var minSquare = minBulletSize * minBulletSize * 2 * Math.PI;

            // Evaluat responses for yes and no question
            var evaluateResponseYes_No = function(country, key) {
                var yes_no = {}
                
                var counter = mapData[country][key]["count"];
                var yes = counter["Yes"];
                var no = counter["No"];
                yes_no = [{
                   "title" : "Yes",
                   "value" : yes,
                   "color" : "#0000FF",
                }, 
                {
                    "title" : "No",
                    "value" : no,
                    "color" : "#FF0000"
                }];
                return yes_no;
            };

            var evaluateResponseScale = function(country, key) {
                var scale = [];
                
                var counter = mapData[country][key]["count"];
                for(var response in counter) {
                    var data = {
                        "title" : response,
                        "value" : counter[response],
                    }
                    scale.push(data);
                };
                return scale;
            };


            // Set up bubbles for each locations for the map
            var evaluateResponseMap = function(key) {
                var images = [];
            
                for(var country in mapData) {
                  if(country == "questions") {
                    continue;
                  }
                  var dataItem = mapData[country]; 
                  var value = dataItem["count"];
                  
                  // calculate size of a bubble
                  var square = ( value - min ) / ( max - min ) * ( maxSquare - minSquare ) + minSquare;
                  
                  if ( square < minSquare ) {
                    square = minSquare;
                  }
                  
                  var size = Math.sqrt( square / ( Math.PI * 2 ) );
                  images.push( {
                    "label" : country,
                    "type": "circle",
                    "width": size,
                    "height": size,
                    "longitude": latlong[country].longitude,
                    "latitude": latlong[country].latitude,
                    "title": country + " " + value,
                    "value": value,
                    "selectable" : true
                    
                  } );
                }

                return images;
            }



            // generate map
            var createMap = function(images) {
                var mapChart = AmCharts.makeChart("worldMap", {
                  "type": "map",
                  "projection": "eckert6",
                  "titles": [ {
                    "text": "Happiness Survey Results",
                    "size": 14
                  }],
                  "areasSettings": {
                  },
                  "dataProvider": {
                    "map": "worldLow",
                    "images": images,
                  },
                  "mouseWheelZoomEnabled" : true,
                } );
                return mapChart;
            };



            // Create bar charts
           var createBar = function(yes_no, question, place, id) {
                var barChart = AmCharts.makeChart(id, {
                    "titles" : [ { "text" : question, "size" : 15 }, { "text" : place, "size" : 8}],
                    "type" : "serial",
                    "theme" : "light",
                    "dataProvider" : yes_no,
                    "valueAxes": [ {
                        "minimum" : 0,
                        "title" : "Number of responses"
                    }],
                    "categoryField" : "title",
                    "graphs" : [ {
                        "balloonText" : "[[category]]: <b>[[value]]</b>",
                        "type" : "column",
                        "valueField" : "value",
                        "fillAlphas" : 0.9,
                    }],
                    "categoryAxis" : {
                        "gridPosition" : "start",
                        "tickPosition": "start",
                        "tickLength" : 5,
                        "title" : "Response",

                    },

                });
                return barChart;

           };



        }],
        templateUrl: 'responses.html'
    }           

});
