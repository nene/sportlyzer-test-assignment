/**
 * When attached chart, displays a marker that follows the movement of
 * cursor over chart - displaying marker at the location corresponding
 * to the currently hovered time value in chart.
 *
 * @constructor
 * @param {google.maps.Map} map Initialized Google maps object.
 * @param {Object[]} waypoints Array of objects with `time`, `lat` and
 * `lng` fields.
 */
function MarkerTrackingBahavior(map, waypoints) {
	this.map = map;
	this.waypoints = waypoints;
	this.marker = this.createMarker();
}
MarkerTrackingBahavior.prototype = {
	/**
	 * Binds chart hover event to this behavior.
	 * @param {HighCharts.Series} series
	 */
	bindChartSeries: function(series) {
		series.update({
			point:{
				events: {
					mouseOver: this.hover.bind(this)
				}
			}
		});
	},

	// copy-paste config for start-of-track marker
	createMarker: function() {
		return new google.maps.Marker({
			shape: {
				type: 'rectangle',
				coords: [0,0,29,38]
			},
			icon: new google.maps.MarkerImage(
				'/gfx/map_start.png',
				new google.maps.Size(29, 38),
				new google.maps.Point(0, 0),
				new google.maps.Point(15, 38)
			),
			map: this.map
		});
	},

	hover: function(e) {
		// get timestamp out of event target and convert from
		// milliseconds to seconds.
		var time = e.target.x / 1000;
		// look up the waypoint
		var wp = this.findWaypoint(time);
		// display on map
		this.marker.setPosition(new google.maps.LatLng(wp.lat, wp.lng));
	},

	/**
	 * For some reason the timestamps in waypoints data don't
	 * correspond directly to the timestamps I get out of the chart
	 * event target.x field.  So I'm doing a binary search over the
	 * waypoints array to find the waypoint with the closest timestamp
	 * to the given timestamp.
	 * @private
	 */
	findWaypoint: function(timestamp) {
		return this.findWaypointIn(timestamp, 0, this.waypoints.length-1);
	},

	// binary search helper.
	findWaypointIn: function(timestamp, begin, end) {
		// calculate array index between begin and end
		var middle = begin + Math.floor((end - begin) / 2);

		if (this.waypoints[middle].time === timestamp || begin == middle || end == middle) {
			// we've either found the exact timestamp or reached the
			// end of our search. Return what we got.
			return this.waypoints[middle];
		} else if (timestamp < this.waypoints[middle].time) {
			return this.findWaypointIn(timestamp, begin, middle-1);
		} else {
			return this.findWaypointIn(timestamp, middle+1, end);
		}
	}
};
