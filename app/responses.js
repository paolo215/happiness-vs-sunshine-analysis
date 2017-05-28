'use strict';


// TODO: Reduce calculation done here by doing it in python

angular.module("main").directive("responses", function() {
    return {
        restrict: "E",
        scope: {},
        controller: ["$scope","$http", function mapController($scope, $http) {

            var latlong;

            $scope.selectedCountry = "";

            var mapData;
            var mapChart;
            $scope.scaleIds = [];
            $scope.closedIds = [];
            var scaleKey = "scale";
            var closedKey = "yes_no";
            var dropDown = [""];
            

            // Contains lat and long of each locations
            $http.get("locations.json").then(function(data) {
                latlong = data["data"];
                $http.get("responses.json").then(function(data) {
                    mapData = data["data"];
                    $scope.selection = [];
                    var closedCounter = 0;
                    var scaleCounter = 0;
                    for(var question in mapData["questions"]) {
                      if(mapData["questions"][question] == closedKey) {
                        $scope.closedIds.push(closedKey + closedCounter.toString());
                        closedCounter+=1;
                      }
                      if(mapData["questions"][question] == scaleKey) {
                        $scope.scaleIds.push(scaleKey + scaleCounter.toString());
                        scaleCounter+=1;
                      }
                      $scope.selection.push(question);
                    }
                    $scope.key = $scope.selection[0];

                    // Create map
                    calculateMinAndMax($scope.key);
                    var images = evaluateResponseMap($scope.key);
                    mapChart = createMap(images);
                    mapChart.addListener("clickMapObject", function(event) {
                        $scope.selectedCountry = event.mapObject.label;

                        // Update charts
                        updateInfo(event.mapObject.label);
                        $scope.$apply();
                    });
                }, function(error) {
                    console.log(error);
                });


            }, function(error) {});
      



            var updateInfo = function(place) {
                var closedCounter = 0;
                var scaleCounter = 0;
                for(var question in mapData[place]) {
                    if(mapData[place][question]["type"] == "yes_no") {
                        var closed = evaluateResponseClosed(place, question);
                        var closedChart = createBar(closed, question, place, closedKey + closedCounter.toString());
                        closedCounter +=1;
                    }

                    if(mapData[place][question]["type"] == "scale") {
                        var scale = evaluateResponseScale(place, question);
                        var scaleChart = createBar(scale, question, place, scaleKey + scaleCounter.toString());
                        scaleCounter += 1;
                    }


                }
            }


            // get min and max values
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
            var evaluateResponseClosed = function(country, key) {
                var closed = {}
                
                var counter = mapData[country][key]["count"];
                var yes = counter["Yes"];
                var no = counter["No"];
                closed = [{
                   "title" : "Yes",
                   "value" : yes,
                   "color" : "#0000FF",
                }, 
                {
                    "title" : "No",
                    "value" : no,
                    "color" : "#FF0000"
                }];
                return closed;
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


            // create circle for each country
            var evaluateResponseMap = function(key) {
                var images = [];
            
                //for ( var i = 0; i < mapData.length; i++ ) {
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



            // build map
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



    
           var createBar = function(closed, question, place, id) {
                var closedChart = AmCharts.makeChart(id, {
                    "titles" : [ { "text" : question, "size" : 15 }, { "text" : place, "size" : 8}],
                    "type" : "serial",
                    "theme" : "light",
                    "dataProvider" : closed,
                    "valueAxes": [ {
                        "minimum" : 0,
                        "title" : "Number of responses"
                    }],
                    "categoryField" : "title",
                    "graphs" : [ {
                        "balloonText" : "[[category]]: <b>[[value]]</b>",
                        "type" : "column",
                        "valueField" : "value",
                        //"lineColorsField" : "color",
                        //"fillColorsField" : "color",
                        "fillAlphas" : 0.9,
                    }],
                    "categoryAxis" : {
                        "gridPosition" : "start",
                        "tickPosition": "start",
                        "tickLength" : 5,
                        "title" : "Response",

                    },

                });
                return closedChart;

           };



        }],
        templateUrl: 'responses.html'
    }           

});
