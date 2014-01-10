/**
 * Configures the daily info form fields.
 */
function DailyInfoToggle(form) {
	this.form = form;
	this.fields = [];
}
DailyInfoToggle.prototype = {
	/**
	 * Masks the daily info form and allows turning the various fields
	 * on/off.
	 */
	open: function() {
		var me = this;

		me.mask = $("<div class='healthinfo-mask'><h2>Enable/Disable form fields</h2><div class='mask'></div></div>");
		me.form.append(me.mask);
		
		// accompany each field with an on/off switch
		$(".daily-form", me.form).each(function() {
			me.maskField($(this));
		});
		
		// Button to save the settings
		me.saveBtn = $("<button class='save-form-fields'>Save settings</button>");
		me.saveBtn.bind("click", me.close.bind(me));

		me.form.append(me.saveBtn);
	},

	maskField: function(field) {
		var me = this;

		// check if field is visible.
		var visible = field.css("display") !== "none";
		// force it visible
		field.css("display", "block");
		
		if (visible) {
			var addRemove = $("<div class='add-remove enabled'><a href='#' class='minus'>-</a></div>");
		} else {
			var addRemove = $("<div class='add-remove'><a href='#' class='plus'>+</a></div>");
		}

		// position the mask right above the field
		var pos = field.position();
		addRemove.css(pos);
		addRemove.css("width", field.width());
		addRemove.css("height", field.height() - 2);

		// change styles when the on/off switched clicked
		$("a", addRemove).bind("click", function(e) {
			e.preventDefault();
			
			var btn = $(this);
			btn.html(btn.html() === "+" ? "-" : "+");
			btn.toggleClass("plus");
			btn.toggleClass("minus");
			
			addRemove.toggleClass("enabled");
		});
		
		me.fields.push(addRemove);
		me.form.append(addRemove);
	},

	close: function(e) {
		var me = this;
		e.preventDefault();

		me.applySettings();

		me.mask.remove();
		me.saveBtn.remove();
		me.fields.forEach(function(el) { el.remove(); });
	},

	// turns fields on/off as configured
	applySettings: function() {
		var me = this;
		var i = 0;
		$(".daily-form", me.form).each(function() {
			var enabled = ($("a", me.fields[i]).html() === "-");
			$(this).css("display", enabled ? "block" : "none");
			i++;
		});
	}
};

$("a.open-daily-info-config").bind("click", function(e) {
	e.preventDefault();
	new DailyInfoToggle($("#all_healthinfo_forms")).open();
});