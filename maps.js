if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
	(function() {
		var PI_180 = 0.01745329251994329547; //M_PI / 180.0
		var INV_A_SQ_B_SQ = 0.01745329251994329547;
		var INV_a = 6378137.0; // WGS84 major axis
		var INV_b = 6356752.3142; // WGS84 semi-major axis
		var INV_f = 0.00335281067183098962;
		var INV_1_minus_f = 0.99664718932816901038;

		function dist($lat1, $lon1, $lat2, $lon2) {
			// Based on http://www.ngs.noaa.gov/PUBS_LIB/inverse.pdf
			// using the "Inverse Formula" (section 4)

			var $MAXITERS = 20;

			// Convert lat/long to radians
			$lat1 *= PI_180;
			$lat2 *= PI_180;
			$lon1 *= PI_180;
			$lon2 *= PI_180;

			var $L = $lon2 - $lon1;
			var $A = 0.0;
			var $U1 = Math.atan(INV_1_minus_f * Math.tan($lat1));
			var $U2 = Math.atan(INV_1_minus_f * Math.tan($lat2));

			var $cosU1 = Math.cos($U1);
			var $cosU2 = Math.cos($U2);
			var $sinU1 = Math.sin($U1);
			var $sinU2 = Math.sin($U2);
			var $cosU1cosU2 = $cosU1 * $cosU2;
			var $sinU1sinU2 = $sinU1 * $sinU2;

			var $sigma = 0.0;
			var $deltaSigma = 0.0;
			var $cosSqAlpha = 0.0;
			var $cos2SM = 0.0;
			var $cosSigma = 0.0;
			var $sinSigma = 0.0;
			var $cosLambda = 0.0;
			var $sinLambda = 0.0;

			var $lambda = $L; // initial guess
			for (var $iter = 0; $iter < $MAXITERS; $iter++) {
				var $lambdaOrig = $lambda;
				$cosLambda = Math.cos($lambda);
				$sinLambda = Math.sin($lambda);
				var $t1 = $cosU2 * $sinLambda;
				var $t2 = $cosU1 * $sinU2 - $sinU1 * $cosU2 * $cosLambda;
				var $sinSqSigma = $t1 * $t1 + $t2 * $t2; // (14)
				$sinSigma = Math.sqrt($sinSqSigma);
				$cosSigma = $sinU1sinU2 + $cosU1cosU2 * $cosLambda; // (15)
				$sigma = Math.atan2($sinSigma, $cosSigma); // (16)
				var $sinAlpha = ($sinSigma === 0) ? 0.0 :
						$cosU1cosU2 * $sinLambda / $sinSigma; // (17)
				$cosSqAlpha = 1.0 - $sinAlpha * $sinAlpha;
				$cos2SM = ($cosSqAlpha === 0) ? 0.0 :
						$cosSigma - 2.0 * $sinU1sinU2 / $cosSqAlpha; // (18)

				var $uSquared = $cosSqAlpha * INV_A_SQ_B_SQ; // defn
				$A = 1 + ($uSquared / 16384.0) * // (3)
						(4096.0 + $uSquared *
						(-768 + $uSquared * (320.0 - 175.0 * $uSquared)));
				var $B = ($uSquared / 1024.0) * // (4)
						(256.0 + $uSquared *
						(-128.0 + $uSquared * (74.0 - 47.0 * $uSquared)));
				var $C = (INV_f / 16.0) *
						$cosSqAlpha *
						(4.0 + INV_f * (4.0 - 3.0 * $cosSqAlpha)); // (10)
				var $cos2SMSq = $cos2SM * $cos2SM;
				$deltaSigma = $B * $sinSigma * // (6)
						($cos2SM + ($B / 4.0) *
						($cosSigma * (-1.0 + 2.0 * $cos2SMSq) -
						($B / 6.0) * $cos2SM *
						(-3.0 + 4.0 * $sinSigma * $sinSigma) *
						(-3.0 + 4.0 * $cos2SMSq)));

				$lambda = $L +
						(1.0 - $C) * INV_f * $sinAlpha *
						($sigma + $C * $sinSigma *
						($cos2SM + $C * $cosSigma *
						(-1.0 + 2.0 * $cos2SM * $cos2SM))); // (11)

				if ($lambda === 0.0)
					break;
				var $delta = ($lambda - $lambdaOrig) / $lambda;
				if (Math.abs($delta) < 1.0e-12)
					break;
			}
			return (INV_b * $A * ($sigma - $deltaSigma));
		}
		function definePrototypes() {
			//google.maps exists but LatLng or Polyline does not, delay prototype modification
			if (typeof google.maps.LatLng === 'undefined' || google.maps.Polyline === 'undefined') {
				setTimeout(definePrototypes, 200);
				return;
			}
			google.maps.LatLng.prototype.kmTo = function(a){
				return dist(this.lat(), this.lng(), a.lat(), a.lng()) / 1000;//m => km
			};
			google.maps.Polyline.prototype.inKm = function(n){
				var a = this.getPath(n), len = a.getLength(), dist = 0, i;
				for(i = 0; i < len - 1; i++){
					dist += a.getAt(i).kmTo(a.getAt(i+1));
				}
				return dist;
			};
		}
		definePrototypes();
	})();
}
//IE8 does not have array.indexOf...
if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(obj, start) {
		 for (var i = (start || 0), j = this.length; i < j; i++) {
			 if (this[i] == obj) {return i;}
		 }
		 return -1;
	};
}

if (!Array.prototype.remove) {
	Array.prototype.remove = function(from, to) {
		var rest = this.slice((to || from) + 1 || this.length);
		this.length = from < 0 ? this.length + from : from;
		return this.push.apply(this, rest);
	};
}

function Routes() {
	var $this = this;
	this.defaultLocation = new google.maps.LatLng(37.362517, -122.03476);

	this.options = {
		maps:  {
			draggableCursor: 'crosshair',
			zoom: 15,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			mapTypeControlOptions: {
				style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
			}
		}
	};
	this.laps = 1;
	this.status = {
		follow: true,
		returned: false,
		dragging_polyline: false,
		dragging_waypoint: false
	};
	this.waypoints = [];
	this.oldDirections = [];
	this.distance = 0;
	this.previewmode = false;

	this.init = function(previewmode, mapid) {
		if (!mapid) mapid = 'map';
		this.map =  new google.maps.Map(document.getElementById(mapid), this.options.maps);
		this.map.setCenter($this.defaultLocation);
		this.previewmode = !!previewmode;
		if (!this.previewmode)
			this.directions = new google.maps.DirectionsService();
		if (!this.previewmode)
			this.elevator = new google.maps.ElevationService();
		this.setBrowserLocation();
		this.createMarkers();
		if (!this.previewmode)
			google.maps.event.addListener(this.map, 'click', this.mapClicked);
	};
	this.resized = function() {
		var center = this.map.getCenter();
		var bounds = this.getBounds();
		google.maps.event.trigger(this.map, "resize");
		if (bounds)
			this.map.fitBounds(bounds);
		else
			this.map.setCenter(center);
	};
	this.mapClicked = function(e) {
		$this.updateHistory();
		var waypoint = {
			location: e.latLng
		};
		$this.waypoints.push(waypoint);
		var append = function(waypoint) {
			var index = $this.waypoints.indexOf(waypoint);
			$this.drawPolyline(waypoint);
			if (index) {
				var w;
				if (index === $this.waypoints.length - 1 && $this.waypoints.length > 2) {
					w = $this.waypoints[$this.waypoints.length - 2];
					w.icon = null;
				} else {
					w = waypoint;
				}
				$this.drawSnapPoint(w);
			}
			$this.drawEndpoints();
			$this.updateDistance();
			$this.getElevation(waypoint);
		};
		if ($this.status.follow) {
			$this.getDirections($this.waypoints.slice(-2), function(response, status) {
				if (status === google.maps.DirectionsStatus.OK) {
					waypoint.location = response.routes[0].legs[0].end_location;
					waypoint.vertexes = response.routes[0].overview_path;
					$this.waypoints.length > 1 && waypoint.vertexes.unshift($this.waypoints[$this.waypoints.length - 2].location);
					append(waypoint);
				}
				else {
					$this.waypoints.pop();
				}
			});
		} else {
			if ($this.waypoints.length > 1) {
				waypoint.vertexes = [$this.waypoints[$this.waypoints.length - 2].location, waypoint.location];
			}
			append(waypoint);
		}
	};
	this.drawPolyline = function(waypoint, no_events) {
		waypoint.polyline && waypoint.polyline.setMap(null);
		if (waypoint.vertexes && waypoint.vertexes.length > 0) {
			waypoint.polyline = this.getPolyline();
			waypoint.polyline.setPath(waypoint.vertexes);
			waypoint.polyline.setMap(this.map);
			if (!no_events) {
				this.registerPolyline(waypoint);
			}
		}
	};
	this.drawSnapPoint = function(w) {
		if (this.previewmode)
			return;
		if (!w.icon) {
			w.icon = this.getSnapPoint();
			this.registerWaypoint(w);
		}
		w.icon.setPosition(w.location);
		w.icon.setMap(this.map);
	};
	this.registerPolyline = function(w) {
		if (this.previewmode)
			return;
		var t = null;
		google.maps.event.addListener(w.polyline, 'mouseover', function(e) {
			clearTimeout(t);
			$this.snapPoint.setVisible(true);
			$this.status.drag_polyline_waypoint = w;
		});
		google.maps.event.addListener(w.polyline, 'mousemove', function(e) {
			$this.snapPoint.setPosition(e.latLng);
		});
		google.maps.event.addListener(w.polyline, 'mouseout', function(e) {
			t = setTimeout(function() {
				if (!$this.status.dragging_polyline)
					$this.snapPoint.setVisible(false);
			}, 400);
		});
	};
	this.registerPolylineSnapPoint = function() {
		if (this.previewmode)
			return;
		var m = this.snapPoint;
		var t = null;
		google.maps.event.addListener(m, 'dragstart', function(e) {
			$this.status.dragging_polyline = true;
			$this.updateHistory();
		});
		google.maps.event.addListener(m, 'drag', function(e) {
			$this.status.drag_polyline_coord = e.latLng;
			if (!t)
				t = setTimeout(function() {
					var index = $this.waypoints.indexOf($this.status.drag_polyline_waypoint);
					var prev = $this.waypoints[index - 1];
					var next = $this.waypoints[index];
					var waypoint = {
						location: $this.status.drag_polyline_coord
					};
					if ($this.status.follow) {
						$this.getDirections([prev, waypoint, next], function(response, status) {
							if (status === google.maps.DirectionsStatus.OK) {
								next.vertexes = response.routes[0].overview_path;
								next.vertexes.unshift(prev.location);
								next.vertexes.push(next.location);
								$this.drawPolyline(next, true);
							}
						});
					} else {
						next.vertexes = [prev.location, waypoint.location, next.location];
						$this.drawPolyline(next, true);
					}
					t = null;
				}, 300);
		});
		google.maps.event.addListener(m, 'dragend', function(e) {
			$this.status.dragging_polyline = false;
			$this.snapPoint.setVisible(false);
			var index = $this.waypoints.indexOf($this.status.drag_polyline_waypoint);
			var prev = $this.waypoints[index - 1];
			var next = $this.waypoints[index];
			var waypoint = {
				location: e.latLng
			};
			if ($this.status.follow) {
				$this.getDirections([prev, waypoint, next], function(response, status) {
					if (status === google.maps.DirectionsStatus.OK) {
						$this.waypoints.splice(index, 0, waypoint);
						waypoint.location = response.routes[0].legs[0].end_location;
						waypoint.vertexes = [];
						waypoint.vertexes.push(prev.location);
						$.each(response.routes[0].legs[0].steps, function(a, b) {
							$.each(b.path, function(c, v){
								waypoint.vertexes.push(v);
							});
						});
						waypoint.vertexes.push(waypoint.location);
						$this.drawPolyline(waypoint);
						$this.drawSnapPoint(waypoint);
						next.vertexes = [];
						next.vertexes.push(waypoint.location);
						$.each(response.routes[0].legs[1].steps, function(a, b) {
							$.each(b.path, function(c, v){
								next.vertexes.push(v);
							});
						});
						next.vertexes.push(next.location);
						$this.drawPolyline(next);
						$this.updateDistance();
					}
				});
			} else {
				$this.waypoints.splice(index, 0, waypoint);
				waypoint.vertexes = [prev.location, waypoint.location];
				$this.drawPolyline(waypoint);
				$this.drawSnapPoint(waypoint);
				next.vertexes = [waypoint.location, next.location];
				if ($this.waypoints.indexOf(next) !== $this.waypoints.length - 1)
					$this.drawSnapPoint(next);
				else
					$this.drawEndpoints();
				$this.updateDistance();
			}
		});
	};
	this.registerWaypoint = function(w) {
		if (this.previewmode)
			return;
		var t = null;
		google.maps.event.addListener(w.icon, 'dblclick', function() {
			var index = $this.waypoints.indexOf(w);
			$this.updateHistory();
			if (index === 0 || index === $this.waypoints.length - 1) {
				if (index === 0 && $this.waypoints.length > 1) {
					$this.waypoints[1].vertexes = [];
					$this.waypoints[1].polyline.setMap(null);
				}
				$this.waypoints.remove(index);
				w.polyline && w.polyline.setMap(null);
				w.icon.setMap(null);
				$this.drawEndpoints();
				$this.updateDistance();
				return;
			}
			var prev = $this.waypoints[index - 1];
			var next = $this.waypoints[index + 1];
			$this.waypoints.remove(index);
			w.polyline && w.polyline.setMap(null);
			w.icon.setMap(null);
			if ($this.status.follow) {
				$this.getDirections([prev, next], function(response, status) {
					next.vertexes = response.routes[0].overview_path;
					next.vertexes.unshift(prev.location);
					next.vertexes.push(next.location);
					$this.drawPolyline(next);
					$this.updateDistance();
				});
			} else {
				next.vertexes = [prev.location, next.location];
				$this.drawPolyline(next);
				$this.updateDistance();
			}
		});
		google.maps.event.addListener(w.icon, 'dragstart', function() {
			$this.updateHistory();
		});
		google.maps.event.addListener(w.icon, 'drag',
			function(e) {
				$this.status.drag_waypoint_coord = e.latLng;
				if (!t)
					t = setTimeout(function() {
						var waypoint = {
							location: $this.status.drag_waypoint_coord
						};
						var index = $this.waypoints.indexOf(w);
						if ($this.status.follow) {
							var ws = [];
							index !== 0 && ws.push($this.waypoints[index - 1]);
							ws.push(waypoint);
							index < $this.waypoints.length - 1 && ws.push($this.waypoints[index + 1]);

							$this.getDirections(ws, function(response, status) {
								if (status === google.maps.DirectionsStatus.OK) {
									var i = 0;
									if (index !== 0) {
										var prev = $this.waypoints[index - 1];
										w.vertexes = [];
										prev && w.vertexes.push(prev.location);
										$.each(response.routes[0].legs[i].steps, function(a, b) {
											$.each(b.path, function(c, v){
												w.vertexes.push(v);
											});
										});
										$this.drawPolyline(w, true);
										i++;
									}
									if (index < $this.waypoints.length - 1) {
										var next = $this.waypoints[index + 1];
										next.vertexes = [];
										$.each(response.routes[0].legs[i].steps, function(a, b) {
											$.each(b.path, function(c, v){
												next.vertexes.push(v);
											});
										});
										next.vertexes.push(next.location);
										$this.drawPolyline(next, true);
									}
								}
							});
						} else {
							if (index < $this.waypoints.length - 1) {
								var next = $this.waypoints[index + 1];
								next.vertexes = [waypoint.location, next.location];
								$this.drawPolyline(next, true);
							}
							if (index !== 0) {
								var prev = $this.waypoints[index - 1];
								w.vertexes = [prev.location, waypoint.location];
								$this.drawPolyline(w, true);
							}
						}
						t = null;
					}, 300);
			});
		google.maps.event.addListener(w.icon, 'dragend', function(e) {
			clearTimeout(t);
			w.location = e.latLng;
			var index = $this.waypoints.indexOf(w);
			if ($this.status.follow) {
				var ws = [];
				index !== 0 && ws.push($this.waypoints[index - 1]);
				ws.push(w);
				index < $this.waypoints.length - 1 && ws.push($this.waypoints[index + 1]);

				$this.getDirections(ws, function(response, status) {
					if (status === google.maps.DirectionsStatus.OK) {
						w.location = response.routes[0].legs[0].start_location;
						var i = 0;
						if (index !== 0) {
							var prev = $this.waypoints[index - 1];
							w.vertexes = [];
							prev && w.vertexes.push(prev.location);
							$.each(response.routes[0].legs[i].steps, function(a, b) {
								$.each(b.path, function(c, v){
									w.vertexes.push(v);
								});
							});
							w.location = response.routes[0].legs[i].end_location;
							$this.drawPolyline(w);
							i++;
						}
						if (index < $this.waypoints.length - 1) {
							var next = $this.waypoints[index + 1];
							next.vertexes = [];
							$.each(response.routes[0].legs[i].steps, function(a, b) {
								$.each(b.path, function(c, v){
									next.vertexes.push(v);
								});
							});
							next.vertexes.push(next.location);
							w.location = response.routes[0].legs[i].start_location;
							$this.drawPolyline(next);
						}
						if (index !== 0 && index !== $this.waypoints.length - 1) {
							$this.drawSnapPoint(w);
						} else {
							$this.drawEndpoints();
						}
						$this.updateDistance();
					}
				});
			} else {
				if (index < $this.waypoints.length - 1) {
					var next = $this.waypoints[index + 1];
					next.vertexes = [w.location, next.location];
					$this.drawPolyline(next);
				}
				if (index !== 0) {
					var prev = $this.waypoints[index - 1];
					w.vertexes = [prev.location, w.location];
					$this.drawPolyline(w);
				}
				if (index !== 0 && index !== $this.waypoints.length - 1) {
					$this.drawSnapPoint(w);
				} else {
					$this.drawEndpoints();
				}
				$this.updateDistance();
			}
		});
	};
	this.clearDisplay  = function() {
		for (var i = 0; i < $this.waypoints.length ; i++) {
			var w = $this.waypoints[i];
			w.icon.setMap(null);
			if (w.polyline)
				w.polyline.setMap(null);
		}
	};
	this.clear = function() {
		this.clearDisplay();
		this.updateHistory();
		this.waypoints = [];
		this.updateDistance();
	};
	this.updateHistory = function() {
		var waypoints = [];
		for (var i = 0; i < this.waypoints.length; i++) {
			var w = this.waypoints[i];
			waypoints.push({
				location: w.location,
				vertexes: w.vertexes
			});
		}
		$this.oldDirections.push(waypoints);
	};
	this.undo = function() {
		if ($this.oldDirections.length === 0)
			return;
		this.clearDisplay();
		$this.waypoints = $this.oldDirections.pop();
		for (var i = 0; i < $this.waypoints.length; i++) {
			if (i !== 0) {
				this.drawPolyline($this.waypoints[i]);
				if (i !== this.waypoints.length - 1)
					this.drawSnapPoint($this.waypoints[i]);
			}
		}
		this.drawEndpoints();
		this.updateDistance();
	};
	this.updateDistance = function() {
		var distance = 0;
		for (var i = 0; i < $this.waypoints.length; i++) {
			if ($this.waypoints[i].polyline)
				distance += $this.waypoints[i].polyline.inKm();
		}
		if (sportlyzer.user.isImperial()) {
			distance /= 1.609344;
		}
		//round to 2 places
		$this.distance = Math.round(distance * 100) / 100;
		if (this.status.returned)
			$('#routes-distance').val(($this.distance.toFixed(2) * 2 * $this.laps).toFixed(2));
		else
			$('#routes-distance').val(($this.distance.toFixed(2) * $this.laps).toFixed(2));
	};
	this.setLaps = function(laps)  {
		this.laps = laps;
		if (this.status.returned)
			$('#routes-distance').val(($this.distance * 2 * $this.laps).toFixed(2));
		else
			$('#routes-distance').val(($this.distance * $this.laps).toFixed(2));
	};
	this.getDistance = function() {
		var distance = 0;
		for (var i = 0; i < $this.waypoints.length; i++) {
			if ($this.waypoints[i].polyline) {
				distance += $this.waypoints[i].polyline.inKm();
			}
		}
		if (sportlyzer.user.isImperial()) {
			distance /= 1.609344;
		}
		return distance;
	};
	this.getSnapPoint = function() {
		return new google.maps.Marker({
			draggable:true,
			shape: {
				type: 'circle',
				coords: [0,0,12,12]
			},
			icon: new google.maps.MarkerImage('/gfx/map_anchor.png', new google.maps.Size(12, 12), new google.maps.Point(0, 0), new google.maps.Point(6, 6))
		});
	};
	this.getPolyline = function() {
		var line = new google.maps.Polyline({
			strokeColor: '#ef6842',
			strokeOpacity: 0.8,
			strokeWeight: 5
		});
		line.setMap(this.map);
		return line;
	};
	this.getDirections = function(waypoints, callback) {
		var w = [];
		for (var i = 1; i < waypoints.length - 1; i++) {
			w.push({
				location: waypoints[i].location,
				stopover: true
			});
		}
		var a = waypoints[0].location, b = waypoints.length > 1 ? waypoints[waypoints.length - 1].location : waypoints[0].location;
		$this.directions.route({
			origin: a,
			waypoints: w,
			destination: b,
			travelMode: google.maps.DirectionsTravelMode.WALKING
		}, callback);
	};
	this.getElevation = function(waypoint) {
		var w = [];
		w.push(waypoint.location);
		for (var i = 0; i < waypoint.vertexes.length - 1; i++) {
			w.push(waypoint.vertexes[i]);
		}
		var positionalRequest = {'locations': w};
		$this.elevator.getElevationForLocations(positionalRequest, function(results, status) {
			if (status === google.maps.ElevationStatus.OK) {
				if (!results[0])
					return;
				waypoint.location.ele = Math.round(results[0].elevation * 100) / 100;
				waypoint.vertexes[waypoint.vertexes.length - 1].ele = waypoint.location.ele;
				for (var i = 1; i < results.length; i++) {
					waypoint.vertexes[i-1].ele = Math.round(results[i].elevation * 100) / 100;
				}
			} else {
				try {
					spl.log("Elevation service failed due to: " + status);
				} catch (ex) {
				}
			}
		});
	};
	this.checkEndpoints = function() {
		this.startPoint = this.waypoints.length === 1 ? this.facilityPoint : (this.status.returned ? this.finishPoint : this.playPoint);
		this.endPoint = this.status.returned ? this.returnPoint : this.stopPoint;
	};
	this.drawEndpoints = function() {
		this.checkEndpoints();
		var w = this.waypoints[0];
		if (w) {
			w.icon && w.icon != this.startPoint && w.icon.setMap(null);
			w.icon = this.startPoint;
			google.maps.event.clearListeners(w.icon, 'drag');
			google.maps.event.clearListeners(w.icon, 'dragend');
			google.maps.event.clearListeners(w.icon, 'dblclick');
			google.maps.event.clearListeners(w.icon, 'dragstart');
			this.registerWaypoint(w);
			w.icon.setPosition(w.location);
			!w.icon.getMap() && w.icon.setMap(this.map);
		}
		if (this.waypoints.length > 1) {
			w = this.waypoints[this.waypoints.length - 1];
			w.icon && w.icon != this.endPoint && w.icon.setMap(null);
			w.icon = this.endPoint;
			google.maps.event.clearListeners(w.icon, 'drag');
			google.maps.event.clearListeners(w.icon, 'dragend');
			google.maps.event.clearListeners(w.icon, 'dblclick');
			google.maps.event.clearListeners(w.icon, 'dragstart');
			this.registerWaypoint(w);
			w.icon.setPosition(w.location);
			!w.icon.getMap() && w.icon.setMap(this.map);
		}
	};
	this.swapReturned = function() {
		this.status.returned = !this.status.returned;
		this.drawEndpoints();
		this.updateDistance();
	};
	this.swapFollow = function() {
		this.status.follow = !this.status.follow;
	};
	this.geocoder = new google.maps.Geocoder();
	this.getGeocoder = function() {
		return this.geocoder;
	};
	this.getMap = function() {
		return this.map;
	};
	this._lastPopup = null;
	this.showPopup = function(location, address) {
		var popup = new google.maps.InfoWindow({'content': address});
		popup.setPosition(location);
		if (this._lastPopup) {
			this._lastPopup.close(this.getMap());
		}
		popup.open(this.getMap());
		this._lastPopup = popup;
	};
	this.getWaypoints = function() {
		var waypoints = $this.waypoints;
		var w = [];
		for (var i = 0; i < waypoints.length; i++) {
			var vertexes = [];
			var wp = waypoints[i];
			if (i > 0) {
				for (var k = 0; k < wp.vertexes.length; k++) {
					vertexes.push({
						lat: wp.vertexes[k].lat(),
						lng: wp.vertexes[k].lng(),
						ele: wp.vertexes[k].ele
					});
				}
			}
			w.push({
				vertexes: vertexes,
				lat: wp.location.lat(),
				lng: wp.location.lng(),
				ele: wp.location.ele
			});
		}
		return w;
	};
	this.waypointsModified = false;
	this.setWaypoints = function(ws) {
		this.waypointsModified = true;
		this.updateHistory();
		var waypoints = [];
		var lastPoint = null;
		for (var i = 0; i < ws.length; i++) {
			var wp = ws[i];
			var vertexes = [];
			if (ws[i].vertexes)
				for (var k = 0; k < wp.vertexes.length; k++) {
					var vertLoc = new google.maps.LatLng(wp.vertexes[k].lat,wp.vertexes[k].lng);
					vertLoc.ele = wp.vertexes[k].ele;
					if (lastPoint && lastPoint.kmTo(vertLoc) > 300) {
						continue;
					}
					vertexes.push(vertLoc);
					lastPoint = vertLoc;
				}
			var wpLoc = new google.maps.LatLng(wp.lat, wp.lng);
			wpLoc.ele = wp.ele;
			if (lastPoint && lastPoint.kmTo(wpLoc) > 300) {
				if (!vertexes) continue;
				wpLoc = vertexes[vertexes.length - 1];
			}
			var waypoint = {
				vertexes: vertexes,
				location: wpLoc
			};
			lastPoint = wpLoc;
			waypoints.push(waypoint);
		}
		this.clearDisplay();
		$this.waypoints = waypoints;
		for (var m = 0; m < $this.waypoints.length; m++) {
				this.drawPolyline($this.waypoints[m]);
				if (m !== this.waypoints.length - 1 && m !== 0)
					this.drawSnapPoint($this.waypoints[m]);
		}
		this.drawEndpoints();
		this.updateDistance();
		if (waypoints.length === 1 && waypoints[0].vertexes.length === 0) {
			this.map.setCenter(waypoints[0].location);
			this.map.setZoom(16);
		} else {
			var bounds = this.getBounds();
			if (bounds)
				this.map.fitBounds(bounds);
		}
	};
	this.getBounds = function() {
		var waypoints = $this.waypoints;
		if (waypoints.length) {
			var bounds = new google.maps.LatLngBounds();
			for (var l = 0; l < waypoints.length; l++) {
				for (var n = 0; n < waypoints[l].vertexes.length; n++)
					bounds.extend(waypoints[l].vertexes[n]);
				bounds.extend(waypoints[l].location);
			}
			return bounds;
		}
		return null;
	};
	this.setBrowserLocation = function() {
		if ($this.waypointsModified)
			return;
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
				if ($this.waypointsModified)
					return;
				$this.map.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
			}, function() {
				if ($this.waypointsModified)
					return;
				$this.map.setCenter($this.defaultLocation);
			});
		} else if (google.gears) {
			var geo = google.gears.factory.create('beta.geolocation');
			geo.getCurrentPosition(function(position) {
				if ($this.waypointsModified)
					return;
				$this.map.setCenter(new google.maps.LatLng(position.latitude, position.longitude));
			}, function() {
				if ($this.waypointsModified)
					return;
				$this.map.setCenter($this.defaultLocation);
			});
		} else {
			$this.map.setCenter($this.defaultLocation);
		}
	};
	this.createMarkers = function() {
		this.playPoint = new google.maps.Marker({
			draggable:true,
			shape: {
				type: 'rectangle',
				coords: [0,0,29,38]
			},
			icon: new google.maps.MarkerImage('/gfx/map_start.png', new google.maps.Size(29, 38), new google.maps.Point(0, 0), new google.maps.Point(15, 38))
		});
		this.facilityPoint = new google.maps.Marker({
			draggable:true,
			shape: {
				type: 'rectangle',
				coords: [0,0,29,38]
			},
			icon: new google.maps.MarkerImage('/gfx/map_facility.png', new google.maps.Size(29, 38), new google.maps.Point(0, 0), new google.maps.Point(15, 38))
		});
		this.finishPoint = new google.maps.Marker({
			draggable:true,
			shape: {
				type: 'rectangle',
				coords: [0,0,30,74]
			},
			icon: new google.maps.MarkerImage('/gfx/map_merged.png', new google.maps.Size(30, 74), new google.maps.Point(0, 0), new google.maps.Point(15, 37))
		});
		this.returnPoint = new google.maps.Marker({
			draggable:true,
			shape: {
				type: 'rectangle',
				coords: [0,0,29,38]
			},
			icon: new google.maps.MarkerImage('/gfx/map_return.png', new google.maps.Size(29, 38), new google.maps.Point(0, 0), new google.maps.Point(15, 0))
		});
		this.stopPoint = new google.maps.Marker({
			draggable:true,
			shape: {
				type: 'rectangle',
				coords: [0,0,29,38]
			},
			icon: new google.maps.MarkerImage('/gfx/map_end.png', new google.maps.Size(29, 38), new google.maps.Point(0, 0), new google.maps.Point(15, 0))
		});
		this.snapPoint = new google.maps.Marker({
			draggable:true,
			shape: {
				type: 'circle',
				coords: [0,0,12,12]
			},
			icon: new google.maps.MarkerImage('/gfx/map_anchor.png', new google.maps.Size(12, 12), new google.maps.Point(0, 0), new google.maps.Point(6, 6))
		});
		this.snapPoint.setVisible(false);
		this.snapPoint.setMap(this.map);
		this.registerPolylineSnapPoint();
	};
}

function setMapToAddress(term) {
	var geocoder = routes.getGeocoder();
	geocoder.geocode( {
		'address': term
	}, function(results, status) {
		var map = $.map(results, function(item) {
			return {
				label: item.formatted_address,
				value: item.formatted_address,
				latitude: item.geometry.location.lat(),
				longitude: item.geometry.location.lng()
			};
		});
		if (map.length) {
			var location = new google.maps.LatLng(map[0].latitude, map[0].longitude);
			routes.getMap().setCenter(location);
		} else {
//			showWarningQtip($('.routes-address'), 'Please enter proper name of the location or use the map for defining it!', true, true);
		}
	});
}

var routes;

function initMapRoutes(previewmode, mapid) {
	routes = new Routes();
	routes.init(previewmode, mapid);
	var geocoder = routes.getGeocoder();
	if (previewmode)
		return;
	var $route_address = $(".routes-address");
	var $route_address_loader = $route_address.siblings('.loader');
	$route_address.autocomplete({
		source: function(request, response) {
			$route_address_loader.show();
			geocoder.geocode( {
				'address': request.term
			}, function(results, status) {
				response($.map(results, function(item) {
					return {
						label: item.formatted_address,
						value: item.formatted_address,
						latitude: item.geometry.location.lat(),
						longitude: item.geometry.location.lng()
					};
				}));
				$route_address_loader.hide();
			});
		},
		select: function(e, ui) {
			var location = new google.maps.LatLng(ui.item.latitude, ui.item.longitude);
			routes.getMap().setCenter(location);
			routes.showPopup(location, ui.item.value);
		},
		'autoFocus': true

	});
	$(".routes-search").click(function() {
		geocoder.geocode( {
			'address': $('.routes-address').val()
		}, function(results, status) {
			if (status === google.maps.GeocoderStatus.OK) {
				routes.getMap().setCenter(results[0].geometry.location);
				$('.routes-address').val(results[0].formatted_address);
				routes.showPopup(results[0].geometry.location, results[0].formatted_address);
			} else {
				showWarningQtip($('.routes-address'), 'No location found with such name!', false, true);
			}
		});
		return false;
	});
	$(".routes-laps .minus").click(function(e) {
		var i = $('.routes-laps input');
		i.val(Math.max(parseInt(i.val(), 10) - 1, 0));
		routes.setLaps(i.val());
		return false;
	});
	$(".routes-laps .plus").click(function(e) {
		var i = $('.routes-laps input');
		i.val(parseInt(i.val(), 10) + 1);
		routes.setLaps(i.val());
		return false;
	});

	$(".routes-save").click(function() {
		var $routeName = $('#routes-name');
		if ($routeName.val() == '') {
			$routeName.addClass('error required').focus();
			return false;
		}
		$routeName.removeClass('required');
		$.ajax({
			type: "POST",
			url: '?page=maps&action=save',
			dataType: 'json',
			data: {
				name: $routeName.val(),
				laps: $('.routes-laps input').val(),
				distance: routes.getDistance(),
				returned: routes.status.returned,
				jsonwaypoints: JSON.stringify(routes.getWaypoints())
			},
			success: function(data){
				if (data && data.error) {
					if (data.error === 'name_exists') {
						showWarningQtip('routes-name', 'You already have a route with that name!');
					}
				}
				if (data && data.listhtml) {
					$('.map-list').replaceWith(data.listhtml);
				} else {
					$.getJSON('?page=maps&action=list', function(response) {
						if (response && response.listhtml)
							$('.map-list').replaceWith(response.listhtml);
					});
				}
				if (data && data.selectroute)
					loadRouteInfo(data.selectroute);
			}
		});
		return true;
	});
	$('.map-list').parent().offon('click.maps', '.route-remove', function() {
		var answer = confirm('Are you sure you want to delete this route?');
		if (!answer)
			return false;
		$.ajax({
			type: "POST",
			url: '?page=maps&action=remove',
			data: {
				id: $(this).parents('li').first().getID()
			},
			success: function(){
				$.getJSON('?page=maps&action=list', function(response) {
					if (response && response.listhtml)
						$('.map-list').replaceWith(response.listhtml);
				});
			}
		});
		return false;
	});
	$('.map-list').parent().offon('click.maps', '.route', function(e) {
		$.ajax({
			type: "POST",
			url: '?page=maps&action=select',
			dataType: 'json',
			data: {
				id: $(this).getID()
			},
			success: function(response) {
				if (response)
					loadRouteInfo(response);
			}
		});
		return false;
	});
	$('#routes-back').click(function(e) {
		$(this).toggleClass('btn-act');
		routes.swapReturned();
		return false;
	});
	$('#routes-follow').click(function(e) {
		$(this).toggleClass('btn-act');
		routes.swapFollow();
		return false;
	});
	$('#routes-undo').click(function(e) {
		routes.undo();
		return false;
	});

	$('#routes-clear').click(function(e) {
		routes.clear();
		return false;
	});
}

function loadRouteInfo(response, elevationChartTarget, speedChartTarget) {
	if (!routes.previewmode) {
		$('li.route').removeClass('selected');
		$('li#route-'+response.id).addClass('selected');
		$('#routes-name').val(response.name);
		$('#routes-laps').val(response.laps);
		$('#routes-id').val(response.id);
	}
	if (response.laps != undefined) {
		routes.setLaps(response.laps);
	}
	if (!routes.previewmode) {
		if (response.distance != undefined)
			$('#routes-distance').val((response.distance * (response.returned ? 2 : 1)).toFixed(2));
		if (response.returned) {
			$('#routes-back').addClass('btn-act');
		} else {
			$('#routes-back').removeClass('btn-act');
		}
	}
	if (response.returned)
		routes.status.returned = true;
	else
		routes.status.returned = false;
	if (response.waypoints) {
		routes.setWaypoints(response.waypoints);
	} else if (!routes.previewmode) {
		$('input.routes-address').val(response.name);
		setMapToAddress(response.name);
	}
	if (elevationChartTarget) {
		showElevationChart(elevationChartTarget, response.waypoints);
	}
	if (speedChartTarget) {
		showSpeedChart(speedChartTarget, response.waypoints);
	}

	// Attach the tracking behavior to statsChart
	var behavior = new MarkerTrackingBahavior(routes.map, response.waypoints);
	behavior.bindChartSeries(statsCharts.speed_hr_chart.series[0]);
}

function uploadRoute() {
	$.ajax({
		type: "POST",
		url: '?page=maps&action=upload',
		dataType: 'json',
		success: function(response){
			if (response.listhtml)
				$('.map-list').replaceWith(response.listhtml);
			if (response.selectroute) {
				loadRouteInfo(response.selectroute);
			} else {
				routes.setWaypoints(response.waypoints);
			}
		}
	});
}