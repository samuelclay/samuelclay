window.BC = {
  
  init: function() {
    this.setupSvg();
    this.loadData();
    this.handleZoomClick();
    this.handleLiveDriving();
  },
  
  setupSvg: function() {
    BC.states = {
      liveDriving: false
    };

    BC.width = window.innerWidth - 30;
    BC.height = 800;
    
    BC.waitingDataLoads = 2;
    BC.waitingImgLoads = 0;
    
    BC.zoom = [
      {
        center: [-71.1283, 42.2862],
        polygon: [[-71.128, 42.284],
                  [-71.130, 42.286],
                  [-71.143, 42.275],
                  [-71.141, 42.273]],
        drive: [[-71.1395, 42.2762], 
                [-71.13011, 42.28463]]
      },
      {
        center: [-71.0662, 42.3260],
        polygon: [[-71.073, 42.332],
                  [-71.071, 42.333],
                  [-71.061, 42.319],
                  [-71.060, 42.320]],
        drive: [[-71.062, 42.321],
                [-71.0713, 42.3322]],
        reverse: 170
      },
      {
        center: [-71.1132, 42.3318],
        polygon: [[-71.114, 42.333],
                  [-71.110, 42.330],
                  [-71.110, 42.333],
                  [-71.114, 42.330]],
        drive: false
      },
      {
        center: [-71.043, 42.3467],
        polygon: [[-71.049, 42.351],
                  [-71.052, 42.351],
                  [-71.038, 42.345],
                  [-71.039, 42.343]],
        drive: [[-71.0501, 42.3502], 
                [-71.0386, 42.3444]],
        reverse: 210
      },
      {
        center: [-71.0749, 42.3422],
        polygon: [[-71.082, 42.340],
                  [-71.081, 42.337],
                  [-71.070, 42.344],
                  [-71.070, 42.346]],
        drive: [[-71.0793, 42.3399], 
                [-71.0704, 42.3447]],
        reverse: 340
      },
      {
        center: [-71.1476, 42.2866],
        polygon: [[-71.150, 42.295],
                  [-71.142, 42.295],
                  [-71.150, 42.275],
                  [-71.142, 42.275]],
        drive: [[-71.1460, 42.2949], 
                [-71.1476, 42.2866]],
        reverse: 70
      },
      {
        center: [-71.072, 42.290],
        polygon: [[-71.071, 42.298],
                  [-71.073, 42.298],
                  [-71.070, 42.282],
                  [-71.072, 42.282]],
        drive: [[-71.0711, 42.2868], 
                [-71.0724, 42.2974]],
        reverse: 100
      },
      {
        center: [-71.070, 42.357],
        polygon: [[-71.071, 42.361],
                  [-71.071, 42.355],
                  [-71.069, 42.361],
                  [-71.069, 42.355]],
        drive: [[-71.0692, 42.3559], 
                [-71.0708, 42.3591]],
        reverse: 150
      }
    ];
    window.svg = d3.select('.map')
    .append('svg')
    .attr('width', BC.width)
    .attr('height', BC.height)
    .append('g');

    window.projection = d3.geoAzimuthalEqualArea();
    BC.setZoomLevel(290000);
  },
  
  setupScroll: function() {
    if (BC.waitingDataLoads) {
      return;
    }
    
    console.log(['data loaded']);
    d3.graphScroll()
      .graph(d3.selectAll('.map'))
      .container(d3.select('#container'))
      .sections(d3.selectAll('#sections > div'))
      .on('active', _.bind(function(i) {
        console.log(i + 'th section active');
        if (i >= 1 && !BC.states.bikeLanes) {
          BC.states.bikeLanes = true;
          showBikeLanes();
        } else if (i < 1 && BC.states.bikeLanes) {
          BC.states.bikeLanes = false;
          hideBikeLanes();
        }
    
        if (i >= 2 && !BC.states.bikeRequests) {
          BC.states.bikeRequests = true;
          showBikeRequests();
        } else if (i < 2 && BC.states.bikeRequests) {
          BC.states.bikeRequests = false;
          hideBikeRequests();
        }
    
        if (i >= 3 && !BC.states.crashData) {
          BC.states.crashData = true;
          showCrashData();
        } else if (i < 3 && BC.states.crashData) {
          BC.states.crashData = false;
          hideCrashData();
        }
    
        if (i >= 4 && !BC.states.zoomInCrashes) {
          BC.states.zoomInCrashes = true;
          this.zoomIn(1);
        } else if (i < 4 && BC.states.zoomInCrashes) {
          BC.states.zoomInCrashes = false;
          zoomOut();
        }
      }, this));
  },
  
  loadData: function() {
    BC.neighborhoods = svg.append("g").selectAll("path")
      .data(neighborhoods_json.features)
      .enter()
      .append("path")
      .attr("fill", "#FCFCFC")
      // .attr("stroke", "#d6d6d6")
    .style('opacity', 0.05)
    .attr("d", geoPath);

    BC.parks = svg.append("g");
    d3.json("data/Open_Space.geojson", function(error, data) {
      BC.parks.selectAll("path")
        .data(data.features)
        .enter()
        .append("path")
        .attr("fill", "#D3E3E2")
        .style('opacity', 0.05)
        // .attr("stroke", "#447454")
        .attr("d", geoPath);
    });

    // BC.mainStreet = svg.append("g");
    // d3.json("data/Main_Street_Districts.geojson", function(error, data) {
    //   BC.mainStreet.selectAll("path")
    //     .data(data.features)
    //     .enter()
    //     .append("path")
    //     .attr("fill", "#E343E2")
    //     .attr("stroke", "#447454")
    //     .attr("d", geoPath);
    // });
        
    BC.bike_network = svg.append("g");
    BC.bike_network.selectAll("path")
      .data(window.bike_network_json.features)
      .enter()
      .append("path")
      .attr("fill", "transparent")
      .attr("d", geoPath)
      .style("opacity", 0)
      .style("stroke", "#45789C");

    // var bike_racks = svg.append("g");
    //
    // bike_racks.selectAll("path")
    //     .data(bike_racks_json.features)
    //     .enter()
    //     .append("path")
    //     .attr("d", geoPath)
    //     .attr("fill", "#A7DCD4")
    //     .style("stroke", "#FCFCFC")
    //     .transition()
    //     .duration(1000)
    //     .style("stroke", "#99f")
    // ;
    // var hubway_stations = svg.append("g");
    //
    // hubway_stations.selectAll("path")
    //     .data(window.hubway_json.features)
    //     .enter()
    //     .append("path")
    //     // .attr("fill", "#900")
    //     .attr("stroke", "#999")
    //     .attr("d", geoPath);

    d3.csv("data/Vision_Zero_entry.csv", _.bind(function(error, data) {
      var requests = _.filter(data, function(d) { return d.REQUESTTYPE.indexOf("bike") != -1; });
      this.drawRequests(requests);
      if (BC.waitingDataLoads) BC.waitingDataLoads -= 1;
      if (BC.waitingDataLoads == 0 && BC.fontsLoaded) this.setupScroll();
    }, this));

    d3.csv("data/crashopendata.csv", _.bind(function(error, data) {
      window.crash_open_data = data;
      var bikeData = _.filter(data, function(d) { return d.mode_type == 'bike'; });
      this.drawCrashes(bikeData);
      if (BC.waitingDataLoads) BC.waitingDataLoads -= 1;
      if (BC.waitingDataLoads == 0 && BC.fontsLoaded) this.setupScroll();
    }, this));
  },

  setZoomLevel: function(level) {
    window.projection = window.projection
      .scale(level)
      .rotate([71.057, 0])
      .center([0, 42.313])
      .translate([BC.width / 2, BC.height / 2]);

    window.geoPath = d3.geoPath()
      .projection(window.projection);
  },
  
  handleZoomClick: function() {
    $(".zoom-street").on('click', _.bind(function(e) {
      var $zoom = $(e.target).closest('.zoom-street');
      console.log(['zoom click', $zoom, e.target, e]);
      if ($zoom.is(".zoom-street-1")) {
        this.zoomIn(1);
      } else if ($zoom.is(".zoom-street-2")) {
        this.zoomIn(2);
      } else if ($zoom.is(".zoom-street-3")) {
        this.zoomIn(3);
      } else if ($zoom.is(".zoom-street-4")) {
        this.zoomIn(4);
      } else if ($zoom.is(".zoom-street-5")) {
        this.zoomIn(5);
      } else if ($zoom.is(".zoom-street-6")) {
        this.zoomIn(6);
      } else if ($zoom.is(".zoom-street-7")) {
        this.zoomIn(7);
      } else if ($zoom.is(".zoom-street-8")) {
        this.zoomIn(8);
      } 
    }, this));
  },
  
  handleLiveDriving: function() {
    $(".live-driving").on('click', _.bind(function() {
      BC.states.liveDriving = !BC.states.liveDriving;
      this.updateLiveDriving();
    }, this));
    
    this.updateLiveDriving();
  },
  
  updateLiveDriving: function() {
    $(".live-driving").toggleClass('off', !BC.states.liveDriving);
    $(".live-driving-text").text("Live driving is " + (BC.states.liveDriving ? "on" : "off"));
    $(".driver").toggleClass("off", !BC.states.liveDriving);
  },
  
  zoomIn: function(level) {
    BC.states.zoomIn = level;

    _.defer(zoom, 4, BC.zoom[level-1].center);

    var polygon = d3.polygonHull([
      window.projection(BC.zoom[level-1].polygon[0]),
      window.projection(BC.zoom[level-1].polygon[1]),
      window.projection(BC.zoom[level-1].polygon[2]),
      window.projection(BC.zoom[level-1].polygon[3])
    ]);

    highlightBikeRequests(false);
    _.delay(function() {
      highlightBikeRequests(true, polygon);  
    }, 1500);

    $(".zoom-street").removeClass('active');
    $(".zoom-street-"+level).addClass('active');

    if (BC.zoom[level-1].drive) {
      driveStreetview(BC.states.zoomIn, BC.zoom[level-1].drive, BC.zoom[level-1].reverse);
    }
  },

  drawRequests: function(data) {  
    $(window).on('mouseup', function(e) {
      console.log(['click', e.target.offsetX, e.target.offsetY]);
      if ($(e.target).closest("circle").length) return;
      $(".bike-request-point.selected").removeClass('selected');
      
      BC.states.activePoint = null;
      renderStreetview();
    });
      
    BC.bikeRequestsContainer = svg.append("g")
      .attr('class', 'bike-requests')
      .style('opacity', 0);

    BC.bikeRequests = BC.bikeRequestsContainer
      .selectAll("g")
      .data(data)
      .enter()
      .append('g')
      .attr("transform", function(d) {return "translate(" + window.projection([+d.X,+d.Y]) + ")";})
      .on('mouseenter', function(d) {
        if (BC.states.activePoint) return;
        BC.states.hoverPoint = d;
        renderStreetview(d);
      })
      .on('mouseleave', function() {
        if (BC.states.activePoint) return;
        BC.states.hoverPoint = null;
        renderStreetview();
      })
      .on('mouseup', function(d) {
        $(".bike-request-point.selected").removeClass('selected');
        console.log(['click', d, d.X, d.Y]);
        BC.states.hoverPoint = null;
        if (BC.states.activePoint && BC.states.activePoint == d) {
          BC.states.activePoint = null;
          renderStreetview();
        } else {
          BC.states.activePoint = d;
          $(this).find(".bike-request-point").addClass("selected");
          renderStreetview(d);
        }
      });
    
    BC.bikeRequests.append("circle")
      .attr("r", 1.5)
      .style('opacity', 0.8)
      .attr("class", "bike-request-point");
    
    BC.bikeRequests.append("circle")
      .attr("r", 3)
      .attr("stroke", "none")
      .attr("fill", "transparent");
      
    var legendCoords1 = window.projection([-71.08, 42.25]);
    var legendCoords2 = window.projection([-71.08, 42.247]);
    BC.legend = svg.append("g").attr("class", "legend");
    BC.legendRequests = BC.legend.append("g")
      .attr("class", "legend-requests")
      .style("opacity", 0)
      .attr("transform", function(d) { return "translate(" + legendCoords1 + ")"; });
    BC.legendRequests
      .append("circle")
      .attr('cx', -8)
      .attr('cy', -4)
      .attr("r", 4)
      .attr("class", "bike-request-point");
    BC.legendRequests
      .append("text")
      .attr('class', 'legend-text')
      .text("Complaint about missing bike lanes");
    BC.legendCrashes = BC.legend.append("g")
      .attr("class", "legend-crashes")
      .style("opacity", 0)
      .attr("transform", function(d) { return "translate(" + legendCoords2 + ")"; });
    BC.legendCrashes
      .append("circle")
      .attr('cx', -8)
      .attr('cy', -4)
      .attr("r", 4)
      .attr("class", "bike-crash");
    BC.legendCrashes.append("text")
      .attr('class', 'legend-text')
      .text("Bike crash involving 911");
  },
  
  drawCrashes: function(data) {
    BC.crashes = svg.append("g").attr("class", "crashes").style("opacity", 0);
    BC.crashes.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr('class', 'bike-crash')
      .attr("transform", function(d) { return "translate(" + window.projection([+d['long'], +d['lat']]) + ")";})
      .attr("r", function(d) { return 1.5; })
      // .attr("stroke", function(d, i) { return "#f00"; })
    ;
      // console.log(['draw crashes', BC.crashes.selectAll('circle')]);
  }
};


function showBikeLanes() {
  BC.bike_network.selectAll("path")
    .interrupt()
    .transition()
    .duration(1000)
    .style("opacity", 1)
  ;
}

function hideBikeLanes() {
  BC.bike_network.selectAll("path")
    .interrupt()
    .transition()
    .duration(1000)
    .style("opacity", 0)
  ;
}

function showBikeRequests() {
  BC.bikeRequestsContainer
    .interrupt()
    .transition()
    .duration(2000)
    .style("opacity", 0.8)
  ;
  BC.legendRequests.transition().duration(2000).style("opacity", 1);
}

function hideBikeRequests() {
  BC.bikeRequestsContainer
    .interrupt()
    .transition()
    .duration(1000)
    .style("opacity", 0)
  ;
  BC.legendRequests.transition().duration(2000).style("opacity", 0);
}

function showCrashData() {
  BC.crashes
    .interrupt()
    .transition()
    .duration(1000)
    .style("opacity", 0.8);

  BC.legendCrashes.transition().duration(2000).style("opacity", 1);
}

function hideCrashData() {
  console.log(['hideCrashData']);
  BC.crashes
    .interrupt()
    .transition()
    .duration(2000)
    .style("opacity", 0);
    BC.legendCrashes.transition().duration(2000).style("opacity", 0);
}

function zoomOut() {
  _.defer(zoom, 1, 0);
  highlightBikeRequests(false);
}

function zoom(scale, center) {
  var coords = center ? window.projection([+center[0]+.015, +center[1]]) : [BC.width/2, BC.height/2];
  // console.log(['zoom coords', coords]);
  svg.transition()
    .duration(2000)
    .attr("transform", "translate("+(BC.width/2 - coords[0]*scale)+","+(BC.height/2 - coords[1]*scale)+")scale("+scale+")");
}

function highlightBikeRequests(on, polygon) {
  // console.log(['polygon 1', polygon]);
  if (polygon && false) {
    svg.append('g')
    .attr('class', 'polygon')
    .append('polygon')
    .attr('points', function() {
      return polygon.map(function(p) { return p.join(','); }).join(' ');
    }).attr('stroke', '#F0F').attr('fill', '#0F0').style('opacity', 0.1);
  }
  
  BC.bikeRequests.selectAll('circle.bike-request-point').each(function(d, i) {
    point = [window.projection([+d.X, +d.Y])];
    if (polygon && d3.polygonContains(polygon, point[0])) {
      // console.log(['point in poly', this, point]);
      d3.select(this).transition().duration(1000).style('opacity', 0.85);
    } else {
      // console.log(['point not in poly', point, polygon]);
      d3.select(this).transition().duration(1000).style('opacity', on ? 0.15 : 0.85);
    }
  });
  
  BC.crashes.selectAll('circle.bike-crash').each(function(d, i) {
    // console.log(['crash', d]);
    point = [window.projection([+d['long'], +d['lat']])];
    if (polygon && d3.polygonContains(polygon, point[0])) {
      // console.log(['point in poly', point]);
      d3.select(this).transition().duration(1000).style('opacity', 0.85);
    } else {
      d3.select(this).transition().duration(1000).style('opacity', on ? 0.15 : 0.85);
    }
  });
}

function driveStreetview(zoomRegion, coords, reverse) {
  if (!BC.states.driving) {
    BC.states.driving = {};
  }
  if (BC.states.driving["zoom"+zoomRegion]) return;
  BC.states.driving["zoom"+zoomRegion] = true;
  
  var start = window.projection(coords[0]);
  var end = window.projection(coords[1]);
  
  var path = window.svg.append("line")
    .attr('x1', start[0])
    .attr('y1', start[1])
    .attr('x2', end[0])
    .attr('y2', end[1])
    .attr('fill', 'none')
    .attr('stroke', 'blue')
    .attr('stroke-width', 0)
  ;
    
  var driver = svg.append("svg:image");
  driver
    .attr('class', 'driver ' + (!BC.states.liveDriving && "off"))
    .attr('width', 16)
    .attr('height', 16)
    .attr('xlink:href', "gps.png")
    .style("opacity", 0);
    
  BC.waitingImgLoads = _.throttle(renderStreetview, 500, {'leading': false, 'trailing': false});  
  transition();

    function transition() {
      driver.attr('transform', pathRoad(0))
      .transition()
        .duration(3000)
        .style('opacity', 1)
      .transition()
        .duration(40000)
        .ease(d3.easeLinear)
        .attrTween("transform", translateAlong(path))
      .on("end", function() {
        console.log(['end drive']);
        renderStreetview();
      })
      .transition()
        .duration(2000)
        .style('opacity', 0)
        .attrTween("transform", function() {})
      .on("end", function() {
          transition();
        });
    }

    // Returns an attrTween for translating along the specified path element.
    function translateAlong() {
      return function(d, i, a) {
        return pathRoad;
      };
    }
    
    function pathRoad(t) {
      var l = path.node().getTotalLength();
      var p = path.node().getPointAtLength(t * l);
      var me = driver.node();
      var offsetX = me.getBBox().width/2;
      var offsetY = me.getBBox().height/2;
      var x1 = me.getBBox().x + offsetX;
      var y1 = me.getBBox().y + offsetY;
      var px = p.x - offsetX;
      var py = p.y - offsetY;
      var angle = getSlopeAngle(coords[0], coords[1])
      angle = (reverse ? (angle - reverse) : angle) % 360;
      if (angle < 0) angle = 360 + angle;
      var invertedCoords = window.projection.invert([px, py]);
      // console.log(['path', px, py, invertedCoords[0], invertedCoords[1]]);
      
      if (BC.states.zoomIn == zoomRegion) {
        BC.waitingImgLoads({'X': invertedCoords[0], 'Y': invertedCoords[1]}, parseInt(angle, 10));
      }
      
      return `translate(${px},${py}), rotate(${angle-45}, ${x1}, ${y1})`;
    }
}

function getSlopeAngle(s1, s2) {
  return Math.atan2((s2[1] - s1[1]), (s2[0] - s1[0])) * 180/Math.PI;
}

function renderStreetview(d, angle) {
  if (BC.states.activePoint && BC.states.activePoint != d) return;
  if (BC.states.hoverPoint && BC.states.hoverPoint != d) return;
  if (!BC.states.liveDriving && !BC.states.activePoint && !BC.states.hoverPoint) {
    $(".streetview").css('opacity', 0);
    return;
  }
  if (!d || !BC.states.bikeRequests) {
    $(".streetview").css('opacity', 0);
    return;
  }
  
  $(".streetview").css('opacity', 1);
  
  angle = angle || 0;
  console.log(['Streetview', Math.round(d.Y*10000)/10000, Math.round(d.X*10000)/10000, angle]);
  _.each([0, 90, 180, 270], function(heading) {
    var $img = $(".streetview-img-heading-"+heading);
    var pitch = -10;
    var forwardAngle = (angle+heading) % 360;
    if (heading == 90 || heading == 270) pitch = -45;
    console.log(['--', heading, forwardAngle, pitch, angle]);
    $img.attr('src', "https://maps.googleapis.com/maps/api/streetview?location=" + d.Y + "," + d.X + "&heading="+forwardAngle+"&fov=120&radius=50&pitch="+pitch+"&size=" + parseInt($(".streetview").width(), 10) + "x" + parseInt($(".streetview").width()*0.65, 10) + "&key=AIzaSyByf1ObpvTStqKZjeZm3ed5o55foYMQfv4");
  });
}


$(document).ready(function() {
  BC.init();
});
