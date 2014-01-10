/*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 */

 //add onerror handler to catch js errors
window.onerror = function(message, url, linenumber) {
	return;//too much errors due to errored js downloads (missing funcs)
	//ignore cross-domain script loading issues (google maps js)
	if ((message === 'Script error.' || message === 'Script error') && linenumber === 0) return;
	//ignore errors from some bad extensions...
	if (typeof url === 'string' && url.indexOf('resource://') === 0) return;
	var linestr = '';
	var location = '';
	try {
		location = '' + document.location.href;
		if (linenumber > 1 && '' + url === location) {
			var html = document.documentElement.outerHTML;
			var lines = html.split("\n");
			linestr = lines[linenumber-5];
		}
	}catch(e) {}
	if (typeof message === 'undefined') message = '';
	try{
		var msg_str = '{';
		if (typeof message === 'object') {
			for (var i in message) { msg_str += '"' + i + '":"' + message[i] + '",'; }
			message = msg_str + '}';
		}
	}catch(e2) {}
	$.post(spl.request.webroot + 'fileupload.php', {"logexception": "url="+location+" scripturl="+url+" linenr="+linenumber+" msg="+message+" line="+linestr+" trace="+printStackTrace().join("\n"), "rnd": Math.random()});
};
//override alert functions to catch where they occur, mostly against left-in debug alerts
(function() {
	var f_alert = window.alert;
	window.alert = function(msg) {
		var ret = f_alert(msg);
		try {
			var trace = printStackTrace().join("\n");
			$.post(spl.request.webroot + 'fileupload.php', {"logexception": "alert called: msg="+msg+" trace="+trace, "rnd": Math.random()});
		} catch(e) {}
		return ret;
	};
})();

var dateFormat = function () {
	var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
		timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
		timezoneClip = /[^-+\dA-Z]/g,
		pad = function (val, len) {
			val = String(val);
			len = len || 2;
			while (val.length < len) val = "0" + val;
			return val;
		};
	// Regexes and supporting functions are cached through closure
	return function (date, mask, utc) {
		var dF = dateFormat;
		// You can't provide utc if you skip other args (use the "UTC:" mask prefix)
		if (arguments.length === 1 && Object.prototype.toString.call(date) === "[object String]" && !/\d/.test(date)) {
			mask = date;
			date = undefined;
		}
		// Passing date through Date applies Date.parse, if necessary
		date = date ? new Date(date) : new Date;
		if (isNaN(date)) throw SyntaxError("invalid date");
		mask = String(dF.masks[mask] || mask || dF.masks["default"]);
		// Allow setting the utc argument via the mask
		if (mask.slice(0, 4) === "UTC:") {
			mask = mask.slice(4);
			utc = true;
		}
		var	_ = utc ? "getUTC" : "get",
			d = date[_ + "Date"](),D = date[_ + "Day"](),m = date[_ + "Month"](),y = date[_ + "FullYear"](),
			H = date[_ + "Hours"](),M = date[_ + "Minutes"](),s = date[_ + "Seconds"](),L = date[_ + "Milliseconds"](),
			o = utc ? 0 : date.getTimezoneOffset(),
			flags = {
				d:d,dd:pad(d),ddd:dF.i18n.dayNames[D],dddd:dF.i18n.dayNames[D + 7],
				m:m + 1,mm:pad(m + 1),mmm:dF.i18n.monthNames[m],mmmm:dF.i18n.monthNames[m + 12],
				yy:String(y).slice(2),yyyy: y,h:H % 12 || 12,hh:pad(H % 12 || 12),
				H:H,HH:pad(H),M:M,MM:pad(M),s:s,ss:pad(s),l:pad(L, 3),L:pad(L > 99 ? Math.round(L / 10) : L),
				t:H < 12 ? "a"  : "p",tt:   H < 12 ? "am" : "pm",T:H < 12 ? "A"  : "P",TT:   H < 12 ? "AM" : "PM",
				Z:utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
				o:(o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
				S:["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 !== 10) * d % 10]
			};
		return mask.replace(token, function ($0) {
			return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
		});
	};
}();
// Some common format strings
dateFormat.masks = {
	"default":      "ddd mmm dd yyyy HH:MM:ss",
	isoDate:        "yyyy-mm-dd",
	isoTime:        "HH:MM:ss",
	isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
	isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};
// Internationalization strings
dateFormat.i18n = {
	dayNames: [
		"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
		"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
	],
	monthNames: [
		"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
		"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
	]
};

// For simplicity...
Date.fromString = function (string) {
	var splits = string.substr(0, 10).split('-');
	for (var i in splits) {
		splits[i] = parseInt(splits[i], 10);
	}
	return new Date(splits[0], --splits[1], splits[2]);
};

// For convenience...
Date.prototype.format = function (mask, utc) {
	return dateFormat(this, mask, utc);
};

Date.prototype.getMysqlYearWeek = function() {
	//truncate date
	var tmp = new Date(this.getFullYear(), this.getMonth(), this.getDate());
	//use mode 7
	return _MysqlYearWeek(7, tmp);
	//internal function to avoid overlapping with other js functions
	function _getDayOfYear(date) {
		//since we use floor anyways, now date must be greater than year start date to zero out the DST effect
		var now = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 14, 0, 0);
		var then = new Date(date.getFullYear(), 0, 0, 12, 0, 0);
		var time = now - then;
		return Math.floor(time / 86400000);
	}
	function _MysqlYearWeek($mode, $time) {
		var $dayOfYear = _getDayOfYear($time); //1-366
		var $weekDay = $time.getDay(); //1-7
		if ($weekDay === 0) $weekDay = 7;//0 - sunday
		if ($mode % 2 === 0)
			$weekDay %= 7;
		var $moreThan3 = $mode === 1 || $mode === 3 || $mode === 4 || $mode === 6;
		if (!$moreThan3 && $weekDay > $dayOfYear) {
			//simple week case and week has monday in previous year, return yearweek of last year's last monday
			$time.setDate($time.getDate() + ($dayOfYear - $weekDay));
			return _MysqlYearWeek($mode, $time);
		} else if ($moreThan3) {
			var $daysInYear = 365 + (new Date($time.getFullYear(), 1, 29).getDate() === 29 ? 1 : 0);
			if ($daysInYear - $dayOfYear <= 2 && $weekDay < 4) {
				$time.setDate($time.getDate() + ($daysInYear - $dayOfYear + 1));
				return _MysqlYearWeek($mode, $time);
			} else if ($weekDay - 4 >= $dayOfYear) {//use last year's week nr because we don't have > 3 days of first week in this year
				$time.setDate($time.getDate() + ($dayOfYear - $weekDay + 3));
				return _MysqlYearWeek($mode, $time);
			}
		}
		var $weekNr = 0;
		//calculate week number
		switch ($mode) {
			case 5:
			case 7:
			case 0:
			case 2:
				$weekNr = 1 + Math.floor(($dayOfYear - $weekDay) / 7);
				break;
			case 1:
			case 3:
				$weekNr = 1 + Math.floor(($dayOfYear - $weekDay + 3) / 7);
				break;
			case 4:
			case 6:
			default:
				try {
					spl.log('Usupported mysql yearweek type requested: ' + $mode);
				} catch (ex) {}
				$weekNr = 1 + Math.floor(($dayOfYear - $weekDay) / 7);
				break;
		}
		function str_pad(str) {
			str = '' + str;
			while (str.length < 2) str = '0' + str;
			return str;
		}
		return $time.getFullYear() + '' + str_pad($weekNr);
	}
};

// StringDate conversions
// Depends $.DatePickerParseDate and spl.user
String.prototype.toInternalDate = function () {
	try {
		var d = $.DatePickerParseDate(this.toString(), spl.user.datepicker_format);
		return d.format('yyyy-mm-dd'); 
	} catch (e) {
		return false;
	}
};

String.prototype.toUserDate = function () {
	try {
		var d = $.DatePickerParseDate(this.toString(), 'Y-m-d');
		return d.format(spl.user.date_format);
	} catch (e) {
		return false;
	}
};

if (typeof Object.create !== 'function') {
	Object.create = function (o) {
		function F() {}
		F.prototype = o;
		return new F();
	};
}
$.plugin = function(name, object) {
	$.fn[name] = function(options) {
		var args = Array.prototype.slice.call(arguments, 1);
		return this.each(function() {
			var instance = $.data(this, name);
			if (instance) {
				instance[options].apply(instance, args);
			}else {
				instance = $.data(this, name, Object.create(object).init(options, this));
			}
		});
	};
};
//if (!window.console)
//	var console = new function() {return {log: function() {}, clear: function() {}, debug: function() {}}}();

var Slide = {
	init: function(options, elem) {
		if (elem.sliderInited && options && options.singleInit) {
			//recalculate sliders when reiniting
			this.opts.$anchor = $('.track', this.$elem);
			this.opts.scale = [];
			var $this = this;
			if (options.coords) {
				$.each(options.coords, function(i, c) {
					$this.opts.scale[$this.opts.scale.length] = c;
				});
			} else if (!options.loose) {
				$('.scale li', this.$elem).each(function() {
					$this.opts.scale[$this.opts.scale.length] = $($this).offset().left + $($this).outerWidth(false) / 2;
				});
			}
			return;
		}
		elem.sliderInited = true;
		this.elem  = elem;
		this.$elem = $(elem);
		this.$elem.data('slider', this);
		var opts = {};
		opts.handler = $('.handler', this.$elem);
		opts.bar = $('.active', this.$elem);
		opts.handlerWidth = opts.handler.outerWidth(false);
		opts.scaleWidth = $('.track', this.$elem).width();
		opts.$anchor = $('.track', this.$elem);
		var anchor = opts.$anchor.offset().left;
		opts.scale = [];
		if (options.coords) {
			$.each(options.coords, function(i, c) {
				opts.scale[opts.scale.length] = c;
			});
		}else if (!options.loose) {
			$('.scale li', this.$elem).each(function() {
				opts.scale[opts.scale.length] = $(this).offset().left - anchor + $(this).outerWidth(false) / 2;
			});
		}
		if (options.loose) {
			options.index = Math.round(options.index * (opts.scaleWidth - (options.restrain ? opts.handlerWidth : 0)) / 100);
		}
		this.opts = $.extend({}, opts, this.opts, options);
		$('.track', this.$elem).on('click',{
			instance: this
		},this.move);
		var el = this;
		opts.handler.on('mousedown touchstart', function(event) {
			cancelEvent(event);
			$(document).bind('mousemove touchmove', {
				instance: el
			}, el.move);
			$(document).bind('mouseup touchend', function() {
				$(document).unbind('mousemove touchmove', el.move);
			});
		});
		this.change(this.opts.index, false);
		this.change(this.opts.index, !!options.triggerfirstchange);
	},
	move: function(event) {
		var opts = event.data.instance.opts;
		var touche = $.findTouchEvent(event);
		var x = touche ? touche.pageX : event.pageX;
		var left;
		var anchor = opts.$anchor.offset().left;
		if (opts.restrain)
			left = Math.max(anchor, Math.min(anchor + opts.scaleWidth - opts.handlerWidth, x - opts.handlerWidth / 2)) - anchor;
		else
			left = Math.max(anchor, Math.min(anchor + opts.scaleWidth, x)) - anchor;
		if (opts.loose) {
			event.data.instance.change(left - anchor, true);
		} else {
			$.each(opts.scale, function(i, c) {
				var a = c, b = opts.scale[i + 1];
				if (typeof b === 'undefined') {
					event.data.instance.change(i, true);
					return false;
				}
				if (left > b)
					return true;
				if (left - a < b - left)
					event.data.instance.change( i , true);
				else
					event.data.instance.change( i + 1 , true);
				return false;
			});
		}
	},
	change : function(index, update) {
		var opts = this.opts;
		if (update) {
			if (opts.loose)
				this.$elem.trigger('change.slide',[Math.round(index / (opts.scaleWidth - (opts.restrain ? opts.handlerWidth : 0)) * 100)]);
			else
				this.$elem.trigger('change.slide', [index]);

			this.$elem.trigger('changed.slide');
		}
		var left;
		var anchor = opts.$anchor.offset().left;
		if (opts.loose)
			left = index + anchor;
		else
			left = opts.scale[index];

		if (!opts.restrain)
			left -= opts.handlerWidth /2;
		left = parseInt(left, 10);
		opts.handler.css({
			'left': left
		});
		opts.handler.css({
			'left': left
		});
		opts.bar.css('width', (opts.handler.offset().left - anchor + opts.handlerWidth/2) + "px");
	},
	opts: {}
};

$.plugin('slide', Slide);

Date.createByFormat = function (date, format, time) {
	var year = '', month = '', day = '', hours = 0, minutes = 0;
	for(var i = 0; i < format.length; i++) {
		var f = format.substr(i, 1);
		var d = date.substr(i, 1);
		if (f === 'm')
			month += d;
		else if (f === 'd')
			day += d;
		else if (f === 'y')
			year += d;
	}
	if (time) {
		var meridian = time.substr(time.length-2,2);
		if (meridian !== "AM" && meridian !== "PM")
			meridian = false;
		else
			time = time.substr(0,time.length-2);
		var t = time.split(':');
		hours = t[0];
		minutes = t[1];
		if (hours !== '12' && meridian === 'PM')
			hours = 12+toInt(hours,0);
		if (hours === '12' && meridian === 'AM')
			hours = '0';
	}
	return new Date(year, toInt(month, 1)-1, toInt(day,1), toInt(hours,0), toInt(minutes,0));
};

var sportlyzer = spl = {
	feeds: {
		init: function(context) {
			if (typeof context === 'undefined')
				context = document;

			var $dplinks = $('.discuss-post a').not('.button-pri');
			var $dptype = $('.discuss-post .post-type');
			$dplinks.on('click', function (e) {
				e.preventDefault();
				var $li = $(this).closest('li');
				$dplinks.closest('li').filter('.act').removeClass('act');
				$li.addClass('act');
				$li.closest('.discuss-post').find('textarea').attr('placeholder', $li.data('msg'));
				$dptype.val($li.data('type'));
			});

			$('.post-publish:first').click(function() {
				var message = $('.post-message').val();
				$.ajax({
					url: $(this).attr('href'),
					data: {
						message: message,
						page: $('.post-page').val(),
						type: $('.post-type').val(),
						clubgroup: $('.post-clubgroup').val()
					},
					dataType: 'json',
					type: 'POST',
					success: function(response) {
						if (response && response.html) {
							$('.post-message').val('');
							$('.posts').prepend(response.html)
									   .find('.bubble:first').addClass('bubble-new');
						}
					}
				});
				return false;
			});
			var $feed = $('#posts'); // TODO
			$feed.on('click', '.post-comment-link', function () {
				var $post = $(this).closest('.id');
				var $cf = $post.find('.comment-form');
				$cf.show()
					.find('textarea').focus().val('');
			});
			$('.post-message').keypress(function (e) {
				if (e.which === 13 && e.ctrlKey || e.which === 10 && e.ctrlKey)//ctrl+enter submits form
					$('.post-publish:first').click();
			});
			$feed.offon('click.post-remove', '.post-remove', function() {
				$(this).requestPOST(function (response) {
					if (response && response.post) $(this).closest('.removable').remove();
				});
				return false;
			});
			$feed.on('focus', '.add-comment-deact textarea', function () {
				$(this)
				.parent()
				.removeClass('add-comment-deact')
				.addClass('add-comment-act')
				.end()
				.siblings().show();
			});
			$feed.on('blur', '.add-comment-act textarea', function () {
				if ($(this).val() === '') {
					var $parent = $(this)
					.parent()
					.removeClass('add-comment-act')
					.addClass('add-comment-deact');

					if ($parent.closest('.has-comments').length>0)
						$(this).siblings().hide();
					else
						$parent.hide();
				}
			});
			// Some states that should be included with every request
			var states = function ($post) {
				var tail = '&state=1';
				if ($post.find('.more-comments').filter(':hidden').size())
					tail += '&allComments=1';
				if ($post.find('.comment-form').filter(':visible').size())
					tail += '&showForm=1';
				return tail;
			};
			$feed.offon('click','.add-comment-btn',function () {
				var $post = $(this).closest('.id');
				var data = {
					post: $post.getID(),
					message: $(this).siblings('textarea').val()
				};
				$.post($(this).attr('href')+states($post), data)
					.success(function (r) {
						$post.replaceWith(r);
						bindAjaxForms();
					});
				return false;
			});

			$feed.offon('click', '.post-like, .comment-like, .post-unlike, .comment-unlike, .comment-remove', function() {
				$(this).attr('href',$(this).attr('href')+states($(this).closest('.id')));
				$(this).requestPOST(function (resp) {
					$(this).closest('.replaceable').replaceWith(resp);
					bindAjaxForms();
				});
				return false;
			});
			$feed.offon('click', '.comments-show', function() {
				// If this post has comments show all
				if ($(this).closest('.has-comments').length) {
					if (!$(this).closest('.all-comments').length) {
						var textVal = $(this).closest('.post-comments').find('textarea').val() || '';
						var postId = $(this).closest('.com-post').attr('id');
						$(this).requestPOST(function (resp) {
							var repl = $(this).closest('.replaceable').replaceWith(resp);
							$('#' + postId).find('textarea').val(textVal);
							bindAjaxForms();
						});
					} else
						$(this).closest('.replaceable').find('textarea').focus();
				} else {
					$(this).closest('.replaceable').find('.add-comment').show().find('textarea').focus();
				}

				return false;
			});
			//this.compress(document.getElementById('posts'));
		},
		compress: function (feed) {
			var $posts = $(feed).filter('.allow-grouping').children('.com-post:visible');
			var last_author = -1;
			var ac = 1;
			var author_name, author_pic_src, post_id;
			$posts.not('.has-comments, .packed').each(function (i) {
				$(this).addClass('packed');
				var author = $(this).data('author-id');
				if (author && author === last_author) {
					$(this).hide().addClass('hide-'+post_id);
					var $expand = $(feed).children('.expand-'+post_id);
					if (!$expand.size()) {

						$(this).after('<div class="packed-posts expand-'+post_id+'"><img src="'+author_pic_src+'" alt="'+author_name+'" class="pic" width="35" height="35" /><a href="javascript:;" data-expand="'+post_id+'" class="link expand">See <span class="c">'+ac+'</span> more posts from '+author_name+'</a></div>');
					}
					$expand.find('span.c').html(ac);

					ac++;
				} else {
					last_author = author;
					author_name = $(this).data('author-name');
					author_pic_src = $(this).children('.pic:first').attr('src');
					ac = 1;
					post_id = $(this).getID();
				}
			});
			$(feed)
				.offon('click', '.expand', function () {
					$(feed).children('.hide-'+$(this).data('expand')).slideDown('fast');
					$(this).parent().remove();
				});
		},
		openVideo: function (post_id) {
			var $post = $('#post-'+post_id);
			var v = $post.find('.video-descr').data('id');
			$post.find('.bubble-cont').html('<iframe width="586" height="298" src="'+document.location.protocol+'//www.youtube.com/embed/'+v+'?wmode=transparent&autoplay=1&rel=0" wmode="Opaque" frameborder="0" allowfullscreen></iframe><div class="clear7"></div>');
		}
	},
	Friends: function ($friends) {
		var endpoint = '?page=friends';
		var phrase = $('#search_friends_name').val();

		return {
			init: function () {
				var friends = this;
				$friends
					.on('click', '.outrequest-remove, .request-ignore', function () {
						var btn = this;
						$.get(friends.uri(this), function () {
							$(btn).closest('.friend').fadeOut('fast');
						});
					})
					.on('click', '.friend-add', function () {
						var btn = this;
						var id = $(btn).closest('.friend').data('id');
						$.get(friends.uri(this), function (data) {
							$('#mayknow-'+id).fadeOut('fast');
							if (friends.asButton) {
								$(btn).replaceWith(data);
							}else {
								friends.reload_cb(data);
							}
						});
					})
					.on('click', '.request-accept, .friend-remove', function () {
						$.post(friends.uri(this), friends.reload_cb);
					});
			},
			params: {
				q: phrase
			},
			search: function (phrase) {
				this.params.q = phrase;
				return this;
			},
			reload: function () {
				$.post(endpoint,this.params, this.reload_cb);
			},
			reload_cb: function (data) {
				if (data)
					$friends.html(data);
			},
			uri: function (that) {
				var id = $(that).closest('.friend').data('id');
				var action = $(that).data('action');
				var uri = endpoint+'&action='+action+'&id='+id;
				if (this.params.q)
					uri += '&q='+this.params.q;
				if (this.asButton)
					uri += '&button=1';
				uri += '&confirm=' + spl.request.nonce;
				return uri;
			}
		};
	},
	mayknow: {
		init: function () {
			var $mayknow = $('#peopleYouMayKnow');
			$mayknow.offon('click','.friend-add2', function(e) {
				var $friend = $(this).closest('.friend');

				$.get($(this).attr('href'), function(html) {
					if ($mayknow.find('.friend').size()<=6)
						$mayknow.replaceWith(html);
					else
						$friend.remove();
					if (spl.friends)
						spl.friends.reload();
				});
				return false;
			})
			.offon('click','.del', function (e) {
				var list_size = $(this).closest('.appendable').children().size();
				$(this).requestGET(function (data) {
					if (list_size<=6)
						$(this).closest('.replaceable').replaceWith(data);
					else
						$(this).closest('.removable').remove();
				});
				return false;
			});
		},
		more: function (btn) {
			var ipr = 6;
			var $list = $(btn).closest('.suggestions').find('.appendable');
			var offset = $list.children().size();
			$.get('?page=sidebar&action=mayknow', {offset: offset}, function (data) {
				$list.append(data);
				showDarkQtip($('.qtip-black'));
				if ($list.children().size()<offset+ipr) {
					$(btn).text('End of suggestions!').removeAttr('onclick').remove();
				}
			});
		}
	},
	goals: {
		activityInit: function() {
			var time, timeout, entertime = 0;
			$('.day').on('click', function(event) {
				if (event.type === 'click') {
					var div = $(this);
					$('#bubble').appendTo(div.closest('.wo-days'));

					clearTimeout(timeout);
					clearTimeout(entertime);
					entertime = 0;
					time = setTimeout(function() {
						var overlay = $('#bubble');
						var input = div.siblings(':hidden');
						var position = div.parent().position();
						overlay.css({
							'left' : position.left - Math.floor((overlay.width()) / 2.0) + 6,
							'top' : position.top + div.parent().height()
						});
						overlay.show();
						var change = function(e, index) {
							var val = index * 0.5;
							div.html(val === 0 ? '-' : val + " h");
							input.val(val);
						};
						$('.slider').slide({
							index: Math.floor(input.val() / 0.5)
						}).unbind('change.slide').bind('change.slide', change);
						div.bind('mouseleave', function() {
							if (!entertime)
								entertime = setTimeout(function() {
									overlay.hide();
								}, 1000);
						});
						overlay.on('mouseenter mouseleave', function(event) {
							if (event.type === 'mouseleave') {
								timeout = setTimeout(function() {
									overlay.hide();
								}, 500);
							}
							else {
								clearTimeout(entertime);
								entertime = 0;
								clearTimeout(timeout);
							}
						});
					}, 50);
				} else {
					clearTimeout(time);
				}
			});
		},
		showStepOne: function (button, extra) {
			var url = 'index.php?page=goals&action=stepOne';
			if (extra)
				url += extra;
			new MyModal(button)
			.close()
			.url(url)
			.show('GoalPopup');
		},
		showStepTwo: function (button, type, extra) {
			var url = 'index.php?page=goals&action=stepTwo&type='+type;
			if (extra)
				url += extra;
			new MyModal(button)
			.close()
			.url(url)
			.show('GoalPopup');
		},
		initStepTwo: function () {
			addAutocompleter($('input.u-autocompleter'));
			var $input = $("#activity_name");
			var $loader = $input.siblings('.loader');
			$input.autocomplete({
				delay: 200,
				source: function(request, response) {
					$loader.show();
					$.post('autocompleter.php', {
						'mode':'useractivities',
						'q': request.term
					}, function(data){
						var mod = $.map(data, function(item) {
							return {
								label: item.name,
								value: item.name,
								activity_id: item.id,
								notdistance: !!item.notdistance
							};
						});
						response(mod);
						$loader.hide();
					},
					'json');
				},
				select: function(e, ui) {
					$('#activity_id').val(ui.item.activity_id);
					if (typeof runningActivities !== 'undefined') {
						var $gcalc = $('div.goal-calc');
						if (runningActivities[ui.item.activity_id])
							$gcalc.find('.step1, .step2, .step3').hide().end().find('.step1').show().end().slideDown('fast');
						else
							$gcalc.slideUp('fast');
					}
					$('#aim').focus();
				},
				'autoFocus': true
			});
			var $gname = $("#goal_name_field");
			var $gloader = $gname.siblings('.loader');
			var $gdate = $("#goal_date_field");
			$gname.autocomplete({
				delay: 200,
				source: function(request, response) {
					$gloader.show();
					$.post('autocompleter.php', {
						'mode':'goals',
						'q': request.term,
						'date': $gdate.val()
					}, function(data) {
						var mod = $.map(data, function(item) {
							return {
								label: item.name + ' (' + item.gdate + ')',
								value: item.name,
								gdate: item.gdate
							};
						});
						response(mod);
						$gloader.hide();
					},
					'json');
				},
				select: function(e, ui) {
					$gdate.val(ui.item.gdate).trigger('change');
					$gdate.closest('form').intelliNext();
				},
				'autoFocus': true
			});
		},
		submit: function (button, params) {
			if (($(button).hasClass('button-pri') || $(button).hasClass('button-sec')) && !$(button).hasClass('disabled'))
				$(button).closest('form').simpleAjaxSubmit(params, function () {
					if (!params.backward && params.closeAfter) new MyModal().close();
					if (parseInt(params.step, 10) === 3 && spl.graph)
						spl.graph.reload();
				});
		},
		isValid: function ($form) {
			// If there is aim. Check it
			var $aim = $form.find('.aim-cb');
			if ($aim.length) {
				if ($aim.filter(':checked').length === 0) {
					showWarningQtip($aim.last(), "Please select at least one aim", true, true);
					return false;
				}
			}
			return spl.validate($form);
		},

		initStepFour: function () {
			$('.slider').each(function () {
				var $slider = $(this);
				var $input = $slider.siblings('input.slidervalue');

				$slider.slide({
					index: $input.val()
				}).bind('change.slide',
					function (e, index) {
						$input.val(index);
					});
			});
		}
	},
	show: {
		cycleInfo: function () {
			MyModal.create('cycleInfo')
				.url('?page=help&action=cycleInfo')
				.show('CycleInfo', function () {
					var $modal = $('#modal_cycleInfo');
					var $readmore = $modal.find('.readmore');
					$modal.find('.readmore, .readless').unbind('click').click(function () {
						$modal.find('.more').fadeToggle('fast');
						if ($(this).is('.readless'))
							$readmore.fadeIn('fast');
						else
							$(this).hide();
					});
				});
		},
		zoneInfo : function (nr, anonymous) {
			nr = 4-nr;
			MyModal.create('zoneInfo')
				   .url('?page=help&action=zoneInfo&zone='+nr+(anonymous ? '&anonymous=1' : ''))
				   .show('ZoneInfo');
		}
	},
	replaceable: function (response) {
		$(this).closest('.replaceable').replaceWith(response);
		bindAjaxForms();
	},
	user: new function () {
		return {
			getFullName: function () {
				return this.firstname+' '+this.lastname;
			},
			isMetric: function () {
				return this.units === "km";
			},
			isImperial: function () {
				return !this.isMetric();
			},
			is24hTime: function () {
				return this.time_format === "24H";
			},
			is12hTime: function () {
				return !this.is24hTime();
			},
			dateTimeFormat: function(date, showSeconds) {
				var format = this.date_format + ' ';
				if (this.time_format === '24H')
					format += 'HH:MM' + (showSeconds ? ':ss' : '');
				else
					format += 'h:MM' + (showSeconds ? ':ss' : '') + ' TT';
				return date.format(format);
			},
			distance: function (systemvalue) {
				if (this.isImperial()) {
					return parseInt(systemvalue, 10) * 0.000621371192237;
				}
				return parseInt(systemvalue, 10) * 0.001;
			},
			time: function (systemtime) {
				var splits = systemtime.split(':');
				var date = new Date(2001, 0, 1, splits[0], splits[1], splits[2]);
				var format = 'HH:MM';
				if (this.time_format === 'AM/PM')
					format = 'h:MMTT';
				return date.format(format);
			}
			
		};
	}(),
	system: new function () {
		return {
			distance: function (uservalue) {
				if (spl.user.isImperial()) {
					return parseFloat(uservalue) / 0.000621371192237;
				}
				return parseFloat(uservalue) * 1000;
			},
			time: function (usertime) {
				try {
					if (usertime) {
						var object = parseAndSuggestTime(usertime, spl.user.time_format === 'AM/PM')[0];
						var value = '';
						for (var i in object) {
							value = object[i];
							break;
						}
						if (spl.user.time_format === 'AM/PM')
							 // headache
							return $.DatePickerParseDate(value,'H:MP').format('HH:MM');
						else
							return usertime; // simply pass SI-time
					}
				} catch (e) {}
			}
		}
	}(),
	stats: {
		onBreakDown: function (event) {
			var $row = $(this);
			if ($row.hasClass('opened')) {
				$row.removeClass('opened').nextAll().each(function () {
					if ($(this).hasClass('ux-bd-sub'))
						$(this).remove();
					else
						return false;
				});
				return false;
			}
			if ($row.hasClass('requesting'))
				return false;
			var url = $(this).closest('table').data('bd-uri')+$row.data('id');
//			triggerEvent('stats-summary', $row.data('id'));
			$row.addClass('requesting');
			$.get(url, function (data) {
				$row.after(data).addClass('opened');
				var maxlen = 17;
				$row.nextAll().each(function () {
					if (!$(this).hasClass('ux-bd-sub'))
						return false;
					$(this).find('.name').each(function () {
						var text = $(this).text();
						$(this).prop('title', text);
						var lpi = text.indexOf('(');
						if (lpi <= 0)
							text = text.substr(0, maxlen)+ (text.length > maxlen ? '...':'');
						else {
							text = text.substr(0, Math.min(lpi, maxlen - (text.length - lpi))) + '...'+text.substr(lpi);
						}
						$(this).text(text);
					});
				});	
				$row.removeClass('requesting');
			});
			return true;
		}
	},
	coach: {
		remind: function (button) {
			var $li = $(button).closest('li');
			if ($li.hasClass('sent'))
				return;
			if (confirm('You\'re about to send an email reminder to your coach to update your plan? Do you want to continue?')) {
				var id = $li.data('id');
				$.post('?page=workouts2&action=remindCoach&coach=' + id + '&confirm=' + spl.request.nonce)
					.success(function () {
						$li.addClass('sent').children('a').append('<span>Sent!</span>');
					});
			}
		}
	},
	sync: {
		doSync: function (btn, provider) {
			var $status = $(btn).siblings('div.status');
			$status.text(t_syncing_in_progress + ' ...');
			$(btn).hide();
			$.get('?page=trackers&action=sync&provider='+provider+'&confirm=' + spl.request.nonce, function (status) {
				status = parseInt(status, 10);
				if (status < -1) {
					$status.html(t_invalid_login);
				} else if (status < 0) {
					$status.html(t_an_error_occured);
				} else {
					if (status > 0)
						setTimeout(spl.graph.reload, 1000);
					$status.html(t(t_count_workouts_were_synced, {'count': status}));
				}
				$(btn).show();
			});
		},
		open: function (btn) {
			if ($(btn).siblings().find('.service').size()) {
				$(btn).siblings().fadeToggle('fast');
			} else {
				this.show($(btn).siblings().find('.manage a'));
			}
		},
		connect: function (btn) {
			this.doSync(btn, 'garmin');
		},
		checkMovescount: function () {
			$.get('?page=trackers&action=checkMovescount', function (data) {
				if (data === 'success') {
					$('.mc-waiting').hide();
					$('.mc-success').show();
				}
			});
		},
		polar: function (btn) {
			this.doSync(btn, "polar");
		},
		withings: function (btn) {
			this.doSync(btn, "withings");
		},
		movescount: function (btn) {
			this.doSync(btn, "movescount");
		},
		show: function (btn) {
			$.get('?page=trackers&action=edit', function (data) {
				$('body').modal(data);
			});
		},
		submit: function (btn) {
			var $btn = $(btn);
			if ($btn.closest('.connect').size()) {
				$btn.hide();
				spl.graph.loader.show(t_connecting + ' ...');
				$btn.form().simpleAjaxSubmit(function () {
					spl.graph.loader.hide();
				});
			} else
				$btn.form().simpleAjaxSubmit();
		}
	},
	request: new function () {
		return { };
	}(),
	log: function () {
		try{
			if (typeof arguments[0]==="object") {
				console.log.apply(console, arguments);
				return arguments[0];
			}
			var pad = function (num) {
				return num > 10 ? num : "0"+num;
			};

			var d = new Date();
			console.log('['+pad(d.getHours())+':'+pad(d.getMinutes()) +':'+ pad(d.getSeconds()) +'] ' + arguments[0]);
		}catch(Ex){}
	},
	validate: function ($form) {
		var result = true;
		$form.find('.required').each(function () {
			var value = $(this).val();
			if (!value) {
				var message = $(this).attr('message');
				if (!message) {
					$(this).attr("message", "This field is required!");
				}
				//showWarningQtip($(this), message, true, true);
				$(this).addClass('error');

				result = false;
			}

		}).end().find('.error').first().focus().showWarningQTip();
		return result;
	}
};

function profilePictureUpload(sender, removeMode) {
	var data = {
		'ug_save':'Save',
		'onlypicture':'1'
	};
	if (removeMode) data['removecurrentpicture'] = '1';
	$('#profile_general').simpleAjaxSubmit(data);
}

function uploaderFileUpload(sender) {
	var data = {
		'file_save':'Save'
	};
	$('#fileupload_form').simpleAjaxSubmit(data);
}

function removeCurrentPicture() {
	profilePictureUpload(null, true);
}

$(function() {
	showDarkQtip($('.qtip-black'));
	$('.img-repl').imageToBackground();
	var offset = getTimezoneOffset();
	var offset_sec = offset.seconds + (offset.dst ? 3600 : 0);
	var $sysmsg = $('#sys-msg');
	//old planner, new planner combo
	var $planCont = $('#plan-cont, #planner-wrapper');
	if ($planCont.length > 0)
		$sysmsg.css({'top':'auto','bottom':0});
	if (spl.user.profileCompleted && spl.request.currentOffset !== offset_sec) {
		//timezone message is already in html
		//$('#sys-msg .wrp').html('Looks like your Sportlyzers time-zone doesn\'t match with your computers. Please check your <a href="'+sportlyzer.request.webroot+'?page=settings"><strong>time-zone here</strong></a>.');
		var $cont = $('.wrapper .content');
		if ($cont.length) {
			var marginTop = toInt($cont.css('marginTop'), 0);
			$sysmsg.data('opened', 'timezone').delay(500).slideDown(400, 'linear');
			if ($planCont.length === 0) {
				$('.header').delay(500).animate({'top': 35}, 400, 'linear');
				$cont.delay(500).animate({'marginTop': marginTop + 35}, 400, 'linear');
			}
		}
	}
	function manageZooming() {
		if ($sysmsg.data('opened') === 'timezone') return;//do nothing if timezone already shown
		if (detectZoom() !== 1) {
			//zoom msg already open
			if ($sysmsg.data('opened') === 'zoom') return;
			var $wrp = $sysmsg.find('.wrp');
			$wrp.html($wrp.data('zoommessage'));
			var $cont = $('.wrapper .content');
			$sysmsg.data('opened', 'zoom');
			if ($cont.length) {
				var cur_marginTop = toInt($cont.css('marginTop'), 0);
				var old_marginTop = $sysmsg.data('cont_marginTop');
				if (old_marginTop === null || typeof old_marginTop === 'undefined')
					old_marginTop = cur_marginTop;
				$sysmsg.data('cont_marginTop', old_marginTop);
				$sysmsg.stop(true, true).delay(500).slideDown(400, 'linear');
				if ($planCont.length === 0) {
					$('.header').stop(true, true).delay(500).animate({'top': 35}, 400, 'linear');
					$cont.stop(true, true).delay(500).animate({'marginTop': old_marginTop + 35}, 400, 'linear');
				}
			}
		} else {
			//zoom msg already closed
			if ($sysmsg.data('opened') !== 'zoom') return;
			var $cont = $('.wrapper .content');
			$sysmsg.data('opened', '');
			if ($cont.length) {
				var old_marginTop = $sysmsg.data('cont_marginTop');
				$sysmsg.stop(true, true).delay(500).slideUp(400, 'linear');
				if ($planCont.length === 0) {
					$('.header').stop(true, true).delay(500).animate({'top': 0}, 400, 'linear');
					$cont.stop(true, true).delay(500).animate({'marginTop': old_marginTop}, 400, 'linear');
				}
			}			
		}
	}
	$(window).on('resize', manageZooming);
	manageZooming();
	$('.content')
		.on('click', '.dropwrap', function (e) {
			var $t = $(e.target);
			var $l = $(this).children('.droplist');
			 // Click on button
			if ($t.closest('.drop').length) {
				$l.fadeToggle(50);
			} else if ($t.closest('.droplist').length) {
				e.stopPropagation();
			}
		})
		.on('click', function(e) {
			var $t = $(e.target);
			if (!$t.hasClass('ico') && !$t.is('.dropdown:visible'))
				$('.options:visible').fadeOut(100);
			if (!$t.closest('.sync').size() && !$t.closest('.syncmenu').size()) {
				$('.syncmenu').hide();
			}
			if (!$t.closest('.dropwrap').length)
				$('.droplist:visible').fadeOut(50);
		})
		.on('click', 'a.dropdown', function (e) {
			e.stopPropagation();
			$('.content').click();
			$(this).siblings('.options').toggle();
		});
});

function chooseWActivity(aid, name, elem, notdistance) {
	var $wo_head = $(elem).closest('.wo-head');
	var $aname = $wo_head.find('[name=activity_name]');
	if (!$aname.length) return;
	var $form = $wo_head.find('[name=activity_id]').val(aid).closest('form');
	$aname.val(name);
	setWActivityDistance($form, notdistance, $form.find('[name=route_name]').val() === '');
}
function setWActivityDistance($container, notdistance, doClear) {
	$container.find('.distance-sport').css('visibility', notdistance ? 'hidden' : 'visible');
	if (notdistance) {
		$container.find('.distance-sport .u-distance').val('');
		$container.find('.distance-sport .laps input').val('1');
	}
}
function chooseWMap(route_id, name, laps, totaldistance, wid, target) {
	var $mname = $('input[id=w_route_name_'+wid+']');
	if (!$mname.length) return;
	var $dist = $('input[id=w_route_distance_'+wid+']');
	var $lapdist = $('input[id=w_route_lap_distance_'+wid+']');
	var $laps = $('input[id=w_route_laps_'+wid+']');
	var $mid = $('input[id=w_route_id_'+wid+']');
	$mname.val(name);
	totaldistance = parseFloat('' + totaldistance);
	if (isNaN(totaldistance)) totaldistance = 0;
	var visible = $dist.isVisible();
	if (visible) {
		$mid.val(route_id);
		if (totaldistance > 0) {
			$lapdist.val(totaldistance / laps);
			$laps.val(laps);
			$dist.val((totaldistance * 1).toFixed(2));
		}
	} else {
		$mid.val('');
		$dist.val('');
		$lapdist.val('');
		$laps.val('1');
	}
	//trigger text field updates
	lapsChanged($laps[0], wid);
	if (target) {
		jModalNew.close($(target).parents('.newPopup').attr('id'), true);
		triggerEvent('Route', 'ChooseForWorkout');
	}
}

var jModalNew = {
	close: function(wid, notrigger) {
		$('#'+wid).remove();
		var category = $('#'+wid+'-overlay span').text();
		if (category !== '' && notrigger !== true)
			triggerEvent(category, 'Close');
		$('#'+wid+'-overlay').remove();
	},
	open: function(wid, content, category, closable, popupClass) {
		var modal = '';
		var addon = (typeof category === 'string') ? '<span style="display:none">'+category+'</span>' : '';
		if (typeof category === 'string') triggerEvent(category, 'Open');
		if (content.indexOf('<body') !== -1 && content.indexOf('<html') !== -1)
			content = content.substring(content.indexOf('<body'), content.indexOf('</body')).replace(/<body[^>]>/, '');
		modal += '<div id="'+wid+'-overlay" class="modal-overlay">'+addon+'</div>';
		modal += '<div id="' + wid + '" class="newPopup'+(popupClass ? ' ' + popupClass : '')+'"><div class="inner">';
		if (closable !== false) modal += '<a href="javascript:;" onclick="jModalNew.close(\''+wid+'\')" class="close-popup">Close</a>';
		modal += content;
		modal += '</div></div>';
		$('body').append(modal);
	}
};

function fixWModalNew(modal_id, toFixed) {
	var $win = $('#' + modal_id);
	var w = $win.width();
	var h = $win.height();
	var wh = $(window).height();
	$win.css({
		'marginTop':-Math.round(Math.min(wh / 2 - 10, h/2.0)),
		'marginLeft':-Math.round(w/2.0),
		'left': '50%',
		'top': Math.round(wh / 2)
	});
	if (toFixed)
		$win.css('position', 'fixed');
	else if (toFixed === false) {
		//use the fixed position offset to position window to absolute
		$win.css('position', 'fixed');
		var offset = $win.offset();
		$win.css({
			'top': Math.max(100, offset.top),
			'left': Math.max(100, offset.left),
			'marginTop': 0,
			'marginLeft': 0,
			'position': 'absolute'
		});
	}
	bindAjaxForms();
}

var LoadManager = {
	times: {},
	canStart: function(name) {
		var time = (new Date()).getTime();
		return !this.times[name] || time - this.times[name] > 10000;
	},
	start: function(name) {
		this.times[name] = (new Date()).getTime();
	},
	stop: function(name) {
		this.times[name] = 0;
	}
};

var MyModal = function (idOrObj) {

	if(typeof idOrObj ==="string")
		this.id = idOrObj;
	else if (typeof idOrObj === 'undefined')
		this.id = $('.newPopup').attr('id');
	else
		this.id = $(idOrObj).closest('.newPopup').attr('id');


	this.close = function () {
		jModalNew.close(this.id);
		return this;
	};

	this.url = function (href) {
		if (typeof href === 'undefined')
			return this;
		this.uri = href;
		return this;
	};

	this.post = function (str) {
		if (typeof str === 'undefined')
			return this;
		this._post = str;
		return this;
	};

	this.show = function (category, cb) {
		var parent = this;
		if (!LoadManager.canStart('workoutpopup')) return;
		LoadManager.start('workoutpopup');
		$.post(this.uri, this._post ? this._post : null, function(html) {
			var id = "modal_"+parent.id;

			LoadManager.stop('workoutpopup');
			jModalNew.open(id, html, category, true);
			// Automate close button in top right corner of the window.
			// Futhrermore, you can declare extra close buttons by defining a class "close-extra"
			$('#'+id).find('a.close,.close-extra').attr("href", "javascript:;").click(function () {
				jModalNew.close($(this).parents('.newPopup').attr('id'));
			});
			if (typeof cb === 'function')
				cb.call(this, html);

			fixWModalNew(id, false);

		}, 'html');

	};
};
MyModal.create = function (idOrObj) {
	return new MyModal(idOrObj);
};
var myModal = new MyModal('sl-modal');

function openHealthinfoEx(wdate, nonce, user, saveCallback) {
	if (!LoadManager.canStart('healthpopup2')) return;
	LoadManager.start('healthpopup2');
	var suf = '';
	if (user)
		suf = '&user='+user;
	$.get('?page=workouts2&action=healthinfo&date='+wdate+suf, {
		'___nonce':nonce
	}, function(data) {
		LoadManager.stop('healthpopup2');
		showHealthinfoEx(data, false, user, saveCallback);
	}, 'html');
}

function showHealthinfoEx(html, replaceMode, user, saveCallback) {
	if (replaceMode) {
		$('#healthinfo2_container').html(html);
		return;
	}
	var id = 'healthinfo2_modal';
	jModalNew.open(id, html, 'HealthInfo2', !!user, 'daily-inf');
	fixWModalNew(id);
	$('#' + id + ' form').data('saveCallback', saveCallback);
	initHealthSliders(id);
}

function initHealthSliders(id) {
	var $overlay = $('#' + id);
	var $sliders = $('.slider-feel-n', $overlay);
	$sliders.bind('change.slide', function(e, index) {
		$(this).next('.feel-emoticon')
		.replaceClass('feel-5 feel-4 feel-3 feel-2 feel-1 feel-0', 'feel-' + (index > 0 ? 6-index : 0));

		$(this).find('.slidervalue').val(index > 0 ? 6-index : '');
	}).each(function(e) {
		var val = toInt($(this).find('.slidervalue').val(), 6);
		$(this).slide({
			index: Math.max(0, Math.min(5, 6-val)),
			coords: [15, 56, 97, 138, 179, 220],
			triggerfirstchange: true
		});
	});
}

function saveHFormsEx() {
	var $form = $('#all_healthinfo_forms');
	if (!$form.length) return;
	var req = {
		'healthinfo2_save':'Save_Close'
	};
	var saveCallback = $form.data('saveCallback');
	$form.simpleAjaxSubmit(req, function () {
		if (saveCallback)
			saveCallback();
		if (spl.graph)
			spl.graph.reload(null, true);
	});

	triggerEvent('HealthInfo2', 'Save_Close');
}

function reloadHealthinfo(userdate, nonce) {
	if (!LoadManager.canStart('healthpopup')) return;
	LoadManager.start('healthpopup');
	$.post('workouts.php?userdate='+userdate, {
		'___nonce':nonce,
		'healthinfo_save':'Save',
		'___ajax':'dummy',
		'replacemode':'1'
	}, function(data) {
		LoadManager.stop('healthpopup');
		showHealthinfo(data, true);
	}, 'html');
}

function openFileUpload(upload_id, nonce, upload_exts, callback) {
	if (!LoadManager.canStart('filepopup')) return;
	LoadManager.start('filepopup');
	$.post('fileupload.php', {
		'nonce':nonce,
		'upload_id':upload_id,
		'upload_exts':(typeof upload_exts !== 'undefined' && upload_exts !== '' ? upload_exts : ''),
		'fetchhtml':'1'
	}, function(data) {
		LoadManager.stop('filepopup');
		showFileUpload(upload_id, data, callback);
	}, 'html');
}

function openWMaps(wid, nonce, mapid, laps, distance, name) {
	if (!LoadManager.canStart('mappopup')) return;
	LoadManager.start('mappopup');
	var data = {
		'nonce':nonce,
		'wid': wid
	};
	if (mapid) data['mapid'] = mapid;
	if (laps !== '' && typeof laps !== 'undefined') data['laps'] = laps;
	if (distance !== '' && typeof distance !== 'undefined') data['distance'] = distance;
	if (name !== '' && typeof name !== 'undefined') data['name'] = name;
	$.post('index.php?page=maps&action=index', data, function(data) {
		LoadManager.stop('mappopup');
		showWMaps(wid, data);
	}, 'html');
}

function openMaps(mapid, nonce) {
	if (!LoadManager.canStart('mapspopup')) return;
	LoadManager.start('mapspopup');
	var data = {
		'nonce':nonce,
		'mapid':mapid,
		'previewmode':1
	};
	$.post('index.php?page=maps&action=index', data, function(data) {
		LoadManager.stop('mapspopup');
		showMaps(mapid, data);
	}, 'html');
}

function showMaps(mapid, html) {
	var id = 'maps_modal_'+mapid;
	jModalNew.open(id, html, 'Route', true);
	fixWModalNew(id);
}

function showWMaps(wid, html) {
	var id = 'workout_maps_modal_'+wid;
	jModalNew.open(id, html, 'WorkoutRoute', true);
	fixWModalNew(id);
}

var uploadhandlers = {};
function showFileUpload(upload_id, html, callback) {
	var id = 'fileupload_modal_'+upload_id;
	uploadhandlers[upload_id] = function() {
		try {
			if(callback)callback(upload_id);
		} catch (ex) {}
		delete uploadhandlers[upload_id];
		setTimeout(function() {
			jModalNew.close(id, true);
			triggerEvent('FileUpload', 'Upload');
		}, 10);
	};
	jModalNew.open(id, html, 'FileUpload', true);
	fixWModalNew(id);
}

function initIntensitySlider(mini) {
	var coords = mini ? [8,	36, 66, 98, 128, 160, 191, 222, 253, 284, 311] : [2, 46, 90, 134, 178, 222, 266, 310, 354, 398, 442];
	// first bind, then init slider and notify binders
	$('.slider'+(mini?'-mini':'')+'-int').bind('change.slide', function(e, index) {
		$('.sldr-prg',this).width(coords[index]);
		if (index === 0) index = '';
		$('input.slidervalue', this).val(index);
	}).each(function(e) {
		var val = $('input.slidervalue', this).val();
		val = parseInt(''+val, 10);
		if (isNaN(val)) val = 0;
		val = Math.max(0, Math.min(10, Math.round(val)));
		if ($(this).is(':visible'))
			$(this).slide({
				loose: false,
				restrain: false,
				coords: coords,
				index: val,
				triggerfirstchange: true,
				singleInit: mini ? false : true
			});
		if (mini) {
			var $slider = $(this);
			$slider.find('.handler').unbind('mousedown.blur touchstart.blur').bind('mousedown.blur touchstart.blur', function(){
				$('.lbl-u, .lbl-d', $slider).fadeIn('fast');
				$('.blur', $slider.parent()).animate({
					opacity: 0.1
				});
			});
		}
	});

}

$(document).bind('mouseup touchend', function(){
	var $slider = $('div.slider:visible');
	if (!$slider.length) return;
	$('.lbl-u, .lbl-d', $slider).fadeOut('fast');
	$slider.each(function() {
		$('.blur', $(this).parent()).animate({
			opacity: 1.0
		});
	});
});

$.getID = function(s) {
	if (!s) return '';
	return s.split('-').pop();
};
$.fn.getID = function() {
	return $.getID(this.attr('id'));
};

function toggleBuddy(uid, uname, displayid, simpleinvitemode) {
	var $span = $('#'+displayid+'_user_'+uid);
	var $input = $('#'+displayid+'_users');
	var ids = $input.val().split(',');
	if (simpleinvitemode) {
		for(var j = 0; j < ids.length; j++) {
			var span = $('#'+displayid+'_user_'+ids[j]);
			span.removeClass('buddy-act');
		}
		ids = [];
		$('div.selected div.name').remove();
	}
	var newids = [];
	for (var i = 0; i < ids.length; i++)
		if (ids[i] !== uid)
			newids[newids.length] = ids[i];
	if ($.inArray(uid, ids) !== -1) {
		$span.removeClass('buddy-act');
		$('#'+displayid+'_seluser_'+uid).remove();
	}else {
		$span.addClass('buddy-act');
		newids[newids.length] = uid;
		var html = '<div id="'+displayid+'_seluser_'+uid+'" class="name"><span class="txt">'+uname+
		'</span> <a href="javascript:;" onclick="toggleBuddy(\''+uid+'\',\'\',\''+displayid+'\')" class="del">Delete</a></div>';
		$(html).insertBefore($('#'+displayid+'_selusers_marker'));
	}
	$input.val(newids.join(','));
}

function initWorkoutAutocompletes(wid, wdate, context) {
	if (!context) context = document;
	var $route = $("input.w-route-name", context);
	var $route_loader = $route.siblings('.loader');
	$route.autocomplete({
		source: function(request, response) {
			$route_loader.show();
			$.post('autocompleter.php', {
				'mode':'userroutes',
				'date': wdate,
				'q': request.term
			}, function(data){
				var mod = $.map(data, function(item) {
					return {
						label: item.name,
						value: item.name,
						route_id: item.id,
						laps: item.laps,
						distance: item.distance
					};
				});
				response(mod);
				$route_loader.hide();
			}, 'json');
		},
		select: function(e, ui) {
			chooseWMap('', ui.item.label, ui.item.laps, ui.item.distance, wid, null);
			return false;
		},
		'autoFocus': true
	});
	var $activity = $("input.w-activity-name", context);
	var $activity_loader = $activity.siblings('.loader');
	$activity.autocomplete({
		source: function(request, response) {
			$activity_loader.show();
			$.post('autocompleter.php', {
				'mode':'useractivities',
				'date': wdate,
				'q': request.term
			}, function(data){
				var mod = $.map(data, function(item) {
					return {
						label: item.name,
						value: item.name,
						activity_id: item.id,
						notdistance: !!item.notdistance
					};
				});
				if (!mod.length)
					$('td.distance-sport, th.distance-sport').css('visibility', 'visible');
				response(mod);
				$activity_loader.hide();
			},
			'json');
		},
		select: function(e, ui) {
			chooseWActivity(ui.item.activity_id, ui.item.label, this, ui.item.notdistance);
			return false;
		},
		'autoFocus': true
	});
}

function addAutocompleter($this, mode, successfunc) {
	if (!$this || !$this.length) return;
	$this.addAutocompleter(mode, successfunc);
}

function bindDatePicker(id, format, options) {
	if (!format) format = 'Y-m-d';
	var $elem = null;
	if (typeof id === 'string')
		$elem = $('#' + id);
	else
		$elem = $(id);
	if (!$elem.length) return;
	var val = $elem.val();
	if (!val) val = new Date();
	var time = new Date();
	var mintime = null, maxtime = null;
	function date_trunc(time) {
		var d = new Date();
		d.setTime(time);
		return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
	}
	if (options && options.mintime && options.maxtime) {
		mintime = date_trunc(options.mintime);
		mintime.setSeconds(mintime.getSeconds() - 1);//previous day, 23:59:59
		maxtime = date_trunc(options.maxtime);
		maxtime.setDate(maxtime.getDate()+1);//next day, 00:00:00
	}

	var defaults = {
		'format':format,
		'date': val,
		'current': val,
		'starts': 1,
		'position': 'bottom',
		'onBeforeShow': function(){
			var val = $elem.val();
			if (!val) val = new Date();
			$elem.DatePickerSetDate(val, true);
		},
		'onChange': function(formated, date){
			if (mintime && maxtime) {
				if (date.getTime() <= mintime.getTime() || date.getTime() >= maxtime.getTime())
					return;
			}
			$elem.val(formated).change();
			$elem.DatePickerHide();
		},
		'onRender': function (date) {
			if (mintime && maxtime) {
				return { 'disabled': date.getTime() <= mintime.getTime() || date.getTime() >= maxtime.getTime(), 'disabled_warning': options.t_interval_error };
			}
			if (!options || !options.time)
				return {};
			return {
				disabled: date.valueOf() < time
			};
		}
	};
	if (spl.locale) {
		defaults.locale = spl.locale;
	}
	$elem.DatePicker(defaults);
}

//handle error cases with live events for all fields that have required class on them
$('input.required, select.required, textarea.required').on('keyup keypress keydown blur change', function(e) {
	var $this = $(this);
	var $form;
	if (e.keyCode === 9)
		return;

	if ($this.val() === '') {
		if (!$this.hasClass('error')) {
			$form = $this.closest('form');
			$this.addClass('error');
			$form.checkFormFields();
		}
	} else if ($this.hasClass('error')) {
		$this.removeClass('error');
		$form = $this.closest('form');
		$form.checkFormFields();
	}
});

function setStatsChartLine(key, series, params, mode) {
	var c = statsCharts[key], i = 0, color = '#43C9FF';
	if ($.browser.msie /*&& $.browser.version < 9*/ && (c && (!c.xAxis || !c.xAxis.length || !c.yAxis || !c.yAxis.length))) {
		setTimeout(function() {
			setStatsChartLine(key, series, params);
		}, 333);
		return;
	}
	if (!c) return;
	for(i = 0; i < series.length; i++) {
		var count = toInt(series[i].data.length, 0);
		var markerRadius = count <= 28 ? 6 : (count <= 56 ? 4 : 3);
		var markerEnabled = true;//count < 75;
		var ser = {
			data: series[i].data,
			name: series[i].name,
			lineWidth: 4,
			shadow: false,
			marker: {
				enabled: markerEnabled,
				radius: markerRadius,
				symbol: 'circle',
				lineWidth: 1,
				lineColor: '#fcfaf3',
				fillColor: color
			},
			type: 'line',
			yAxis: params.idx,
			visible: true,
			_spl_graphtype: params.graphtype,
			color: color
		};
		if (mode === 'datetime') {
			ser.lineWidth = 2;
			ser.marker.enabled = false;
			ser.states = {
				hover: {
					enabled: false
				}
			};
		}
		if (params.friend_idx) {
			var colors_map = ['#EF5B50','#BE31BC','#7C5229',
				'#FF1873',
				//'#0CFFF2',//light blue, too light
				'#FFCD19','#A757AB','#7CFF82','#FF5D51',
				//'#38C6E2',//darker blue, too similar to first blue
				//'#EBFF13',//hard to read yellow
				'#EC1289',
				'#37FFC7',//light blue
				'#FFA22E','#7D81C0','#A6FF58','#FF3266',
				'#0DF1F8',//light blue
				'#FFE70B','#C23C9E','#61FF9D',
				'#52ACD5'//darker blue
			];
			ser.color = colors_map[(params.friend_idx - 1) % colors_map.length];
		}
		ser.marker.fillColor = ser.color;
		if(params.idx === 0 && mode !== 'datetime') {
			ser.type = 'column';
			ser.borderWidth = 0;
			ser.borderRadius = 3;
			ser.color = '#D0CDC7';
			ser.states = {
				hover: {
					color: '#ABA7A2'
				}
			};
		}
		if (!params.friend_idx) {
			if (params.color)
				ser.color = params.color;
			if (params.hovercolor && ser.states)
				ser.states.hover.color = params.hovercolor;
		}
		if (typeof params._chart_minval !== 'undefined' && typeof params._chart_maxval !== 'undefined') {
			var min = params._chart_minval, max = params._chart_maxval;
			var c_min = min - ((max-min) * 0.05);
			var c_max = max + ((max-min) * 0.05);
			c.yAxis[params.idx].setExtremes(c_min, c_max, false);
		}
		c.addSeries(ser, false);
	}
}

function setChartLine(series, color, params) {
	var c = chart2, i = 0, idx = 0;
	if ($.browser.msie /*&& $.browser.version < 9*/ && (c && (!c.xAxis || !c.xAxis.length || !c.yAxis || !c.yAxis.length))) {
		setTimeout(function() {
			setChartLine(series, color, params);
		}, 333);
		return;
	}
	if (!c) return;
	for(i = 0; i < series.length; i++) {
		var ser = {
			data: series[i].data,
			name: series[i].name,
			lineWidth: 3,
			marker: {
				radius: 4,
				symbol: 'circle',
				lineWidth: 3,
				lineColor: color,
				fillColor: '#FFFFFF'
			},
			type: 'spline',
			yAxis: idx,
			visible: true,
			_spl_graphtype: params.graphtype,
			color: color
		};
		if (params.graphtype === 'dur_done') {
			ser.type = 'spline';
			ser.color = 'rgba(205, 60, 0, 1)';
			ser.marker.enabled = false;
		}else if (params.graphtype === 'dur_target') {
			ser.type = 'areaspline';
			ser.color = 'rgba(69, 209, 255, 1)';
			ser.fillColor = 'rgba(69, 209, 255, 0.2)';
			ser.marker.enabled = false;
		}
		c.addSeries(ser, false);
	}
}

function fixTimeAxis(c) {
	var idx = 3;
	if (c !== chart2) return;
	var axis = c.yAxis[idx];
	if (!axis) return;
	var oldextr = axis.getExtremes();
	var a_max = Math.max(210, Math.ceil(oldextr.dataMax)) + 20;//default to 3.5h + 20min for top padding
	var extr = {
		'min': 0,
		'max': a_max
	};
	if (oldextr.userMin !== extr.min || oldextr.userMax !== extr.max) {
		axis.setExtremes(extr.min, extr.max, false, false);
	}
}

function redrawCharts(labels) {
	var c = chart2;
	if (!c) return;
	var j = 0;
	//delay chart drawing until older browsers have actually finished fbuilding the chart structure
	if ($.browser.msie /*&& $.browser.version < 9*/ && (c && (!c.xAxis || !c.xAxis.length || !c.yAxis || !c.yAxis.length))) {
		setTimeout(function() {
			redrawCharts(labels);
		}, 333);
		return;
	}
	c.redraw();
	fixTimeAxis(c);
	if (labels && labels.length) {
		c.xAxis[0].setCategories(labels, true);
	}
	c.xAxis[0].removeAllPlotLines();
	
	c.xAxis[0].removeAllPlotLines();
	var now = new Date();
	c.xAxis[0].addPlotLine({
		'color': 'rgb(190,190,190)',
		'value': 8.0,//Math.round(100 * (7.5 + ((now.getDay()+6)%7 + 1) / 8)) / 100,
		'width': 2,
		'zIndex': 3,
		'id': 'todayline',
		'label':{
			'textAlign': 'right',
			'verticalAlign':'top',
			'text': 'THIS WEEK',
			'rotation': -90,
			'x':-3,
			'y':15,
			'style': {
				'color':'#999999',
				'fontSize':'11px',
				'textTransform':'uppercase',
				'font-weight':'bold'
			}
		}
	});
	now.setDate(now.getDate() - (now.getDay()+6)%7 - 3 * 7);
	var names = [];
	var months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
	for (var ni = 0; ni < 8; ni++) {
		names[names.length] = now.getDate()+' '+months[now.getMonth()];
		now.setDate(now.getDate() + 7);
	}
	for (ni = 0; ni < names.length; ni++)
		c.xAxis[0].addPlotLine({
			'color': 'rgba(190,190,190,0.0)',
			'value': ni + 4.5,
			'width': 1,
			'zIndex': 1,
			'id': 'plotline_'+(ni+0.5).toFixed(1),
			'label':{
				'textAlign': 'center',
				'verticalAlign':'top',
				'text': names[ni],
				'rotation': 0,
				'x':0,
				'y':15,
				'style': {
					'color':'#000000',
					'fontSize':'11px',
					'textTransform':'uppercase',
					'font-weight':'normal'
				}
			}
		});
	if (profileGoals && profileGoals.length)
		for (ni = 0; ni < profileGoals.length; ni++) {
			c.xAxis[0].addPlotLine({
				'color': 'rgba(190,190,190,0.5)',
				'value': profileGoals[ni],
				'width': 2,
				'zIndex': 3,
				'id': 'goalline_'+ni,
				'label':{
					'textAlign': 'right',
					'verticalAlign':'top',
					'text': 'GOAL',
					'rotation': -90,
					'x':-3,
					'y':15,
					'style': {
						'color':'#999999',
						'fontSize':'11px',
						'textTransform':'uppercase',
						'font-weight':'bold'
					}
				}
			});
		}
}

function redrawStatsCharts(key, labels) {
	clearedStatsIndexes[key] = {};
	var c = statsCharts[key];
	if (!c) return;
	//delay chart drawing until older browsers have actually finished fbuilding the chart structure
	if ($.browser.msie /*&& $.browser.version < 9*/ && (c && (!c.xAxis || !c.xAxis.length || !c.yAxis || !c.yAxis.length))) {
		setTimeout(function() {
			redrawStatsCharts(key,labels);
		}, 333);
		return;
	}
	if (labels && labels.length) {
		var cutRatio = Math.floor((labels.length-1)/28)+1;
		if (cutRatio > 1) {
			for(var i = 0; i < labels.length; i++) {
				if (i === 0 || i === labels.length - 1) continue;
				if (i % cutRatio === 0 && labels.length - i >= cutRatio) continue;
				labels[i] = '|' + labels[i].split('|')[1];
			}
		}
		c.xAxis[0].setCategories(labels, true);
	}else
		c.redraw();
}

function clearStatsChartName(key, name, idx) {
	var c = statsCharts[key];
	clearChartSeries(c, name, idx);
}

function clearChartName(name) {
	clearChartSeries(chart2, name);
}

function clearChartSeries(c, name, idx) {
	if (!c) return;
	for(var i = 0; i < c.series.length; i++) {
		var ser = c.series[i];
		if (!ser) continue;
		var idxMatch = false;
		try {idxMatch = ser.yAxis.options.index === idx;}catch(Ex) { }
		if (ser.name === name || idxMatch) {
			ser.remove();
			i--;
		}
	}
}

var chart2;

function showAccelerationChart(target, accels) {
	if (!document.getElementById(target)) return;
	var ser = {
		data: accels,
		name: 'Acceleration',
		lineWidth: 1,
		shadow: false,
		marker: {
			enabled: false,
		},
		type: 'line',
		yAxis: 0,
		visible: true,
		color: '#CC0000'
	};

	var chartt = new Highcharts.Chart({
		chart: {
			renderTo: target,
			defaultSeriesType: 'line',
			margin: [0, 0, 0, 0],
			spacingTop: 0,
			borderRadius: 5,
			borderWidth: 0,
			backgroundColor: 'rgba(252,249,242,0)',
			shadow: false,
			plotBorderWidth: 0,
			plotShadow: false,
			style: {
				fontFamily: 'sans-serif, Arial, Helvetica',
				fontSize: '12px'
			},
			showAxes: false,
			zoomType: 'x'
		},
		title: {text: ''},
		legend: {enabled: false, backgroundColor: 'rgba(255,255,255,0.6)'},
		xAxis: {
			gridLineWidth: 0,
			lineWidth: 0,
			tickWidth: 0,
			//categories: def_labels,//no labels for datetime
			//tickInterval: 1000,//no tickinterval for datetime
			labels: {enabled: false},
			title: {text:''},
			opposite: true
		},
		//11 axis for up to 3 line types
		yAxis: [{
			labels: {enabled: false},
			title: {text:''},
			gridLineWidth: 1,
			lineWidth: 0,
			minTickInterval: 1,
			startOnTick: false,
			endOnTick: false,
			alignTicks: false,
			id: 0
		}],
		tooltip: {
			formatter: function() {
				var idx = this.x;
				var msecs = idx * 2;
				var msecpart = padStr(msecs % 100, 2, '0', true);
				var secs = Math.floor(msecs / 100);
				var mins = Math.floor(secs / 60);
				var hrs = Math.floor(mins / 60);
				var time = hrs + ':' + padStr(mins % 60, 2, '0', true) + ':' + padStr(secs % 60, 2, '0', true) + '.' + msecpart;
				return time + ': ' + this.y;
			}
		},
		credits: {
			enabled: false
		},
		series: []
	});
	chartt.addSeries(ser, true);
}
var statsCharts = {};
function showStatsChart(target) {
	if (!document.getElementById(target)) return;
	var chartt = statsCharts[target];
	try{
		if(chartt)chartt.destroy();
		chartt=null;
	}catch(Ex){}
	var dummy = {
		series: []
	};
	var min_x = null, max_x = null;
	chartt = new Highcharts.Chart({
		chart: {
			renderTo: target,
			defaultSeriesType: 'line',
			margin: [0, 0, 0, 0],
			spacingTop: 0,
			borderRadius: 5,
			borderWidth: 0,
			backgroundColor: 'rgba(252,249,242,0)',
			shadow: false,
			plotBorderWidth: 0,
			plotShadow: false,
			style: {
				fontFamily: 'sans-serif, Arial, Helvetica',
				fontSize: '12px'
			},
			showAxes: false,
			zoomType: 'x'
		},
		title: {text: ''},
		legend: {enabled: true, backgroundColor: 'rgba(255,255,255,0.6)'},
		xAxis: {
			gridLineWidth: 0,
			lineWidth: 0,
			tickWidth: 0,
			//categories: def_labels,//no labels for datetime
			//tickInterval: 1000,//no tickinterval for datetime
			labels: {enabled: false},
			min: min_x,
			max: max_x,
			title: {text:''},
			opposite: true,
			type: 'datetime'
		},
		//11 axis for up to 3 line types
		yAxis: [{
			labels: {enabled: false},
			title: {text:''},
			gridLineWidth: 0,
			min: 0,
			startOnTick: false,
			endOnTick: false,
			alignTicks: false,
			id: 0
		}, {
			labels: {enabled: false},
			title: {text:''},
			gridLineWidth: 0,
			min: 0,
			startOnTick: false,
			endOnTick: false,
			alignTicks: false,
			id: 1
		}, {
			labels: {enabled: false},
			title: {text:''},
			gridLineWidth: 0,
			min: 0,
			startOnTick: false,
			endOnTick: false,
			alignTicks: false,
			id: 2
		}, {
			labels: {enabled: false},
			title: {text:''},
			gridLineWidth: 0,
			min: 0,
			startOnTick: false,
			endOnTick: false,
			alignTicks: false,
			id: 3
		}, {
			labels: {enabled: false},
			title: {text:''},
			gridLineWidth: 0,
			min: 0,
			startOnTick: false,
			endOnTick: false,
			alignTicks: false,
			id: 4
		}, {
			labels: {enabled: false},
			title: {text:''},
			gridLineWidth: 0,
			min: 0,
			startOnTick: false,
			endOnTick: false,
			alignTicks: false,
			id: 5
		}],
		tooltip: {
			formatter: function() {
				if (!this.points.length) return false;
				var title = '';
				try {
					var minTime = this.points[0].series.xAxis.dataMin;
					var offset = Math.round((this.x - minTime) / 1000);
					var h = Math.floor(offset / 3600);
					var m = Math.floor(offset / 60) % 60;
					var s = offset % 60;
					title = padStr(h, 2, '0', true) + ':' + padStr(m, 2, '0', true) + ':' + padStr(s, 2, '0', true);
				} catch(ex) {
					title = spl.user.dateTimeFormat(new Date(this.x), true);
				}

				var t_units = {
					'speed': spl.user.isMetric() ? 'km/h' : 'mi/h',
					'elevation': spl.user.isMetric() ? 'm' : 'ft',
					'hr': 'bpm',
					'cad': '',
					'pow': 'W',
					'torque': 'Nm'
				};

				var str = '<b>' + title + '</b>';
				var hasinfo = false;
				var pts_list = [];
				var rawData = false;
				var distance = false;
				for(var j = 0; j < this.points.length; j++)
					pts_list.push(this.points[j]);
				for(var i = 0; i < pts_list.length; i++) {
					var pt = pts_list[i];
					var val = pt.y;
					var type = pt.series.options._spl_graphtype;
					var unit = t_units[type];
					if (distance === false && (type === 'speed' || type === 'elevation')) {
						rawData = pt.series.options.data;
					}
					if (type === 'speed') {
						val = (val * 3.6).toFixed(1);
					}else if (type === 'hr' || type === 'cad' || type === 'pow') {
						val = Math.round(val);
					} else {
						val = (val * 1).toFixed(2);
					}
					hasinfo = true;
					var color = pt.series.color;
					if (pt.series.options.states.hover && pt.series.options.states.hover.color)
						color = pt.series.options.states.hover.color;
					if (color.indexOf('rgba') === 0) {
						color = color.replace(/,[^,]+\)/, ',1)');
					}
					var seriesName = pt.series.name;
					if (distance === false && rawData) {
						for (var ii = 0; ii < rawData.length; ii++) {
							var rawP = rawData[ii];
							if (rawP[0] > this.x) break;
							if (rawP[0] === this.x) {
								if (typeof rawP[2] !== 'undefined' && rawP[2] !== null)
									distance = rawP[2];
								break;
							}
						}
					}
					str += '<br/><span style="color:'+color+';">'+ seriesName +': '+ val +' '+ unit+'</span>';
				}
				if (distance !== false) {
					color = '#000000';
					unit = spl.user.isMetric() ? 'km' : 'mi';
					val = distance / 1000;
					if (spl.user.isImperial())
						val /= 1.609344;
					str += '<br/><span style="color:'+color+';">'+t_Distance+': '+ val.toFixed(2) +' '+ unit+'</span>'
				}
				if (!hasinfo) return false;
				return str;
			},
			shared: true,
			borderColor: '#000000',
			shadow: false,
			crosshairs: false
		},
		credits: {
			enabled: false
		},
		series: dummy.series
	});
	chartt.$isDateTime = true;
	statsCharts[target] = chartt;
}
var eleCharts = {};
function showElevationChart(target, waypoints) {
	var key = 'default', title = '';
	var chartt = eleCharts[key];
	try{
		if(chartt)chartt.destroy();
		chartt=null;
	}catch(Ex){}
	var series = {
		data: [],
		name: 'Elevation',
		type: 'areaspline',
		visible: true,
		lineWidth: 2,
		marker: {enabled: false},
		shadow: false,
		yAxis: 0
	};
	var ele_max = null, ele_min = null, ele_last = null;
	var ele_gain = 0, ele_loss = 0, v_ele = 0, j;
	for (var i = 0; i < waypoints.length; i++) {
		var ele = parseFloat(waypoints[i].ele);
		if (isNaN(ele)) continue;
		if (ele_max === null || ele > ele_max) ele_max = ele;
		if (ele_min === null || ele < ele_min) ele_min = ele;
		series.data.push(ele);
		var eles = [ele];
		//always try to count in all waypoint vertexes
		if (waypoints[i].vertexes && waypoints[i].vertexes.length) {
			eles = [];
			var verts = waypoints[i].vertexes;
			for(j = 0; j < verts.length; j++) {
				v_ele = parseFloat(verts[j].ele);
				if (isNaN(v_ele)) continue;
				eles.push(v_ele);
			}
		}
		for (j = 0; j < eles.length; j++) {
			v_ele = eles[j];
			if (ele_last === null) {
				ele_last = v_ele;
			} else {
				var e_diff = v_ele - ele_last;
				ele_last = v_ele;
				if (e_diff > 0) ele_gain += e_diff;
				else ele_loss -= e_diff;
			}
		}
	}
	if (ele_min === null || ele_min === 0.0 && ele_max === 0.0) return;
	//no need to smoothen things up when there is big number of points
	if (series.data.length > 120) series.type = 'area';
	var ele_diff = ele_max - ele_min;
	if (ele_diff < 40) {
		ele_diff = (40 - ele_diff) / 2;
	} else
		ele_diff *= 0.05;
	ele_min -= ele_diff;
	ele_max += ele_diff;
	$('#'+target+', #'+target+'_container').show();
	$('#elevation_loss').html(ele_loss > 0 ? ele_loss.toFixed(1) + 'm' : '-');
	$('#elevation_gain').html(ele_gain > 0 ? ele_gain.toFixed(1) + 'm' : '-');
	//disable chart animations for MSIE 8 and older
	var canAnimate = !($.browser.msie && $.browser.version < 9);
	chartt = new Highcharts.Chart({
		chart: {
			renderTo: target,
			defaultSeriesType: 'areaspline',
			animation: canAnimate,
			borderRadius: 8,
			borderWidth: 0,
			shadow: false,
			plotBackgroundColor: null,
			plotBorderWidth: null,
			showAxes: false,
			margin: [0, 0, 0, 0],
			spacingTop: 0,
			plotShadow: false
		},
		title: {
			text: title
		},
		xAxis: {
			labels: {enabled: false},
			title: {text:''},
			gridLineWidth: 0,
			lineWidth: 0,
			minPadding: 0,
			maxPadding: 0,
			tickWidth: 0
		},
		yAxis: {
			labels: {enabled: false},
			title: {text:''},
			gridLineWidth: 0,
			lineWidth: 0,
			endOnTick: false,
			startOnTick: false,
			min: ele_min,
			max: ele_max,
			id: 0,
			tickWidth: 0
		},
		legend: {
			enabled: false
		},
		tooltip: {
			formatter: function() {
				return this.point.series.name + ': ' + this.y + 'm';
			},
			borderColor: '#0167CC'
		},
		credits: {
			enabled: false
		},
		plotOptions: {
			areaspline: {
				animation: canAnimate,
				lineWidth: 0,
				lineColor: 'rgba(239,104,66,1.0)',
				fillColor: 'rgba(239,104,66,0.5)',
				states: {
					hover: {
						enabled: false
					}
				}
			},
			area: {
				animation: canAnimate,
				lineWidth: 0,
				lineColor: 'rgba(239,104,66,1.0)',
				fillColor: 'rgba(239,104,66,0.5)',
				states: {
					hover: {
						enabled: false
					}
				}
			}
		},
		'series': [series]
	});
	eleCharts[key] = chartt;
}

var profileGoals = false;
function showProfileGraph(target) {
	var i = 0;
	try{
		if(chart2)chart2.destroy();
		chart2=null;
	}catch(Ex){}
	var dummy = {
		series: []
	};//one series has to be set otherwise not grid lines will be drawn etc
	//disable chart animations for MSIE 8 and older
	var canAnimate = !($.browser.msie && $.browser.version < 9);
	var chartt = new Highcharts.Chart({
		chart: {
			renderTo: target,
			defaultSeriesType: 'spline',
			margin: 0,
			padding:0,
			animation: canAnimate,
			borderRadius: 5,
			borderWidth: 0,
			shadow: false,
			plotBorderWidth: 0,
			plotShadow: false,
			showAxes: false
		},
		title: {
			text: ''
		},
		legend: {
			enabled: false
		},
		xAxis: {
			gridLineWidth: 1,
			gridLineColor: 'rgb(237,237,237)',
			lineWidth: 0,
			tickWidth: 0,
			categories: [
			'','','','','','','','','','','','','','','','',''
			],
			labels: [
			'','','','','','','','','','','','','','','','',''
			],
			min: 4.03,
			max: 11.97
		},
		//5 axis for up to 5 line types
		yAxis: [{
			gridLineWidth: 0,
			min: 0,
			id: 0
		}],
		tooltip: {
			formatter: function(e) {
				var maxY = 0, maxX = 0, i = 0;
				var seriesmap = {};
				for(i = 0; i < this.points.length; i++) {
					maxY = Math.max(maxY, this.points[i].point.plotY);
					maxX = Math.max(maxX, this.points[i].point.plotX);
					var sname = this.points[i].series.name;
					seriesmap[sname] = this.points[i].y;
				}
				if (!this.points.length) return false;
				var units = {
					'Done duration':'min',
					'Target duration':'min'
				};
				if (this.x < 0 || this.x > 16) {
					return false;
				}
				var str = '<b>'+this.x+'</b>';
				var hasinfo = false;
				for(i = 0; i < this.points.length; i++) {
					var pt = this.points[i];
					var val = pt.y;
					var unit = '';
					for(var j in units) {
						if (pt.series.name.indexOf(j) === 0) {
							unit = units[j];
							break;
						}
					}
					hasinfo = true;
					var color = pt.series.color;
					if (color.indexOf('rgba') === 0) {
						color = color.replace(/,[^,]+\)/, ',1)');
					}
					str += '<br/><span style="color:'+color+'">'+pt.series.name+': '+ val +' '+ unit+'</span>';
				}
				if (!hasinfo) return false;
				return str;
			},
			shared: true,
			borderColor: '#0167CC'
		},
		credits: {enabled: false},
		plotOptions: {
			spline: {
				animation: canAnimate,
				marker: {
					enabled: false,
					states: {hover: {enabled: false}}
				}
			},
			areaspline: {
				animation: canAnimate,
				marker: {
					enabled: false,
					states: {hover: {enabled: false}}
				}
			}
		},
		series: dummy.series
	});
	chart2 = chartt;
}

function toInt(val, def) {
	val = parseInt(val+'', 10);
	if (isNaN(val))
		val = def;
	return val;
}

function toFloat(val, def) {
	val = parseFloat(val+'');
	if (isNaN(val))
		val = def;
	return val;
}

function padStr(str, length, pad, toLeft) {
	if (!str) str = '';
	else str = '' + str;
	if (!pad) pad = ' ';
	while (str.length < length) {
		if (toLeft) str = pad + str;
		else str += pad;
	}
	return str;
}

function parseAndSuggestTime(str, amPmMode) {
	if (!str) return {};
	str = str.replace(/[^0-9,.:apm]/i, '').replace(/[,.:]/, '_');//uniform separators
	if (/^[0-9]{4}$/.test(str)) str = str.substr(0, 2) + '_' + str.substr(2, 2);
	var params = str.split('_', 2);
	if (params.length < 2)
		params[1] = '0';
	if (params[1].length < 2) params[1] += '0';
	var wasPM = $.trim(params[1]);
	wasPM = wasPM.substr(wasPM.length - 2, 2).toUpperCase() === 'PM';
	var h = Math.max(0, toInt(params[0], 0));
	var m = Math.max(0, toInt(params[1], 0));
	h += Math.floor(m / 60);
	m %= 60;
	var origh = h % 24;
	h %= 12;//mod it down to show two values
	var ret = [], str1, str2;
	if (!amPmMode) {
		str1 = padStr(h, 2, '0', true)+':'+padStr(m, 2, '0', true);
		str2 = padStr(h + 12, 2, '0', true)+':'+padStr(m, 2, '0', true);
	}else {
		str1 = padStr(h === 0 ? 12 : h, 1, '0', true)+':'+padStr(m, 2, '0', true)+'AM';
		str2 = padStr(h === 0 ? 12 : h, 1, '0', true)+':'+padStr(m, 2, '0', true)+'PM';
	}
	//if typed time was 18:00 for example, show 18:00 as first selection
	if (origh === h + 12 || amPmMode && wasPM) {
		var tmp = str1;
		str1 = str2;
		str2 = tmp;
	}
	ret[0] = {};
	ret[0][str1] = str1;
	ret[1] = {};
	ret[1][str2] = str2;
	return ret;
}

function parseAndSuggestDuration(str, retMode, preferMode) {
	if (!str && (retMode === 'h' || retMode === 'm')) return '';
	if (!str) return {};
	var commaIdx = str.indexOf(','), pointIdx = str.indexOf('.'), colonIdx = str.indexOf(':');
	if (colonIdx === -1) colonIdx = 99999;//easier to compare
	var multiplyMin = commaIdx !== -1 && commaIdx < colonIdx || pointIdx !== -1 && pointIdx < colonIdx || colonIdx === 99999;
	//multiplyMin = false;//always convert 10.5 to 10:50
	str = str.replace(/[^0-9,.:]/i, '').replace(/[,.:]/, '_');//uniform separators
	var params = str.split('_', 3);
	if (params.length < 2)
		params[1] = '0';
	if (params[1].length < 2) params[1] += '0';
	var h = Math.max(0, toInt(params[0], 0));
	var m = Math.max(0, toInt(params[1], 0));
	var preciseM = m;
	if (multiplyMin) {
		m = parseFloat('0.' + params[1]);
		preciseM = m * 60;//keep precise value in special variable for later on
		m = Math.floor(m * 60);
	} else {
		h += Math.floor(m / 60);
		m %= 60;
	}
	var ret = [], str1, str2, disp1, disp2, mDec = Math.round(100 * preciseM / 60) / 100, hDec = h + mDec;
	if (hDec.toFixed(2) === Math.floor(hDec).toFixed(2)) {
		hDec = Math.floor(hDec);
		mDec = 0;
	}
	if (multiplyMin) {
		disp1 = hDec.toFixed(2) + ' hr' + (hDec > 1 ? 's' : '');
		str1 = padStr(h, 1, '0', true) + ':' + padStr(Math.round(mDec * 60), 2, '0', true);
		disp2 = hDec.toFixed(2) + ' min';
		var h1 = Math.floor(hDec / 60);
		hDec -= h1 * 60;
		str2 = padStr(h1, 1, '0', true)+':'+padStr(Math.round(hDec), 2, '0', true);
	} else {
		str1 = padStr(h, 1, '0', true) + ':' + padStr(m, 2, '0', true);
		disp1 = str1 + ' (hh:mm)';
		var h1c = Math.floor(hDec / 60);
		hDec -= h1c * 60;
		str2 = padStr(h1c, 1, '0', true)+':' + padStr(Math.round(hDec), 2, '0', true);
		disp2 = str1 + ' (mm:ss)';
	}
	if (retMode === 'h')
		return str1;
	else if (retMode === 'm')
		return str2;
	if (h >= 10 && preferMode !== 'h' || preferMode === 'm') {
		var tmp = disp1;
		disp1 = disp2;
		disp2 = tmp;
		tmp = str1;
		str1 = str2;
		str2 = tmp;
	}
	ret[0] = {};
	ret[0][str1] = disp1;
	ret[1] = {};
	ret[1][str2] = disp2;
	return ret;
}

function parseAndSuggestDurationM(str) {
	if (!str) return {};
	var commaIdx = str.indexOf(','), pointIdx = str.indexOf('.'), colonIdx = str.indexOf(':');
	if (colonIdx === -1) colonIdx = 99999;//easier to compare
	var multiplyMin = commaIdx !== -1 && commaIdx < colonIdx || pointIdx !== -1 && pointIdx < colonIdx || colonIdx === 99999;
	//multiplyMin = false;//always convert 10.5 to 10:50
	str = str.replace(/[^0-9,.:]/i, '').replace(/[,.:]/, '_');//uniform separators
	var params = str.split('_', 3);
	if (params.length < 2)
		params[1] = '0';
	if (params[1].length < 2) params[1] += '0';
	var h = Math.max(0, toInt(params[0], 0));
	var m = Math.max(0, toInt(params[1], 0));
	var preciseM = m;
	if (multiplyMin) {
		m = parseFloat('0.' + params[1]);
		preciseM = m * 60;//keep precise value in special variable for later on
		m = Math.floor(m * 60);
	} else {
		h += Math.floor(m / 60);
		m %= 60;
	}
	var ret = [], str1, str2, disp1, disp2, mDec = Math.round(100 * preciseM / 60) / 100, hDec = h + mDec;
	if (hDec.toFixed(2) === Math.floor(hDec).toFixed(2)) {
		hDec = Math.floor(hDec);
		mDec = 0;
	}
	if (multiplyMin) {
		disp1 = hDec.toFixed(2) + ' min' + (hDec > 1 ? 's' : '');
		str1 = padStr(h, 1, '0', true) + ':' + padStr(Math.round(mDec * 60), 2, '0', true);
		disp2 = hDec.toFixed(2) + ' sec';
		var h1 = Math.floor(hDec / 60);
		hDec -= h1 * 60;
		str2 = padStr(h1, 1, '0', true)+':'+padStr(Math.round(hDec), 2, '0', true);
	} else {
		str1 = padStr(h, 1, '0', true) + ':' + padStr(m, 2, '0', true);
		disp1 = str1 + ' (mm:ss)';
		ret[0] = {};
		ret[0][str1] = disp1;
		return ret;
	}
	ret[0] = {};
	ret[0][str1] = disp1;
	ret[1] = {};
	ret[1][str2] = disp2;
	return ret;
}

function numberToPlaces(val, places) {
	//make sure we have number, convert it to defined places
	val = parseFloat('' + val).toFixed(places);
	//clean out any ending zeros (1.230 => 1.23)
	if (places > 0)
		val = val.replace(/0*$/, '');
	//clean out dangling . or .000 cases
	return val.replace(/\.0*$/, '');
}

function parseAndSuggestDistance(str, miMode) {
	if (!str) return {};
	str = str.replace(/[^0-9,.]/i, '').replace(/[,.]/, '_');//uniform separators
	var params = str.split('_', 3);
	if (params.length < 2)
		params[1] = '0';
	var km = Math.max(0, toInt(params[0], 0));
	var kmstr = miMode ? ' mi' : ' km';
	var mstr = miMode ? ' ft' : ' m';
	var mDec = parseFloat('0.' + params[1]);
	var kmDec = numberToPlaces(km + mDec, 3);
	var kmMult = miMode ? 5280 : 1000;//mile has 5280 feet in it
	var ret = [], str1, str2 = '', disp1, disp2 = '';
	if (kmDec < 100) {
		str1 = '' + kmDec;
		disp1 = '' + kmDec + kmstr;
	} else if (kmDec < 300) {
		str1 = '' + kmDec;
		disp1 = '' + kmDec + kmstr;
		disp2 = '' + kmDec + mstr;
		str2 = numberToPlaces(kmDec / kmMult, 3);
	}else {
		str2= '' + kmDec;
		disp2 = '' + kmDec + kmstr;
		disp1 = '' + kmDec + mstr;
		str1 = numberToPlaces(kmDec / kmMult, 3);
	}
	ret[0] = {};
	ret[0][str1] = disp1;
	if (str2 !== '') {
		ret[1] = {};
		ret[1][str2] = disp2;
	}
	return ret;
}

function parseAndSuggestWeight(str, miMode) {
	if (!str) return {};
	str = str.replace(/[^0-9,.]/i, '').replace(/[,.]/, '_');//uniform separators
	var params = str.split('_', 3);
	if (params.length < 2)
		params[1] = '0';
	var kg = Math.max(0, toInt(params[0], 0));
	var kgstr = miMode ? ' lb' : ' kg';
	var gstr = miMode ? ' oz' : ' g';
	var gDec = parseFloat('0.' + params[1]);
	var kgDec = kg + gDec;
	var kgMult = miMode ? 16 : 1000;//pound has 16 ounces in it
	var ret = [], str1 = '', str2 = '', disp1, disp2 = '';
	var realDec = kgDec;
	if (sportlyzer.user.isImperial())
		realDec *= 0.45359237;
	kgDec = numberToPlaces(kgDec, 3);
	if (realDec < 500) {//anyone at 300Kg or smaller
		str1 = '' + kgDec;
		disp1 = '' + kgDec + kgstr;
	} else if (kgDec > 1000) {
		disp1 = '' + kgDec + gstr;
		str1 = numberToPlaces(kgDec / kgMult, 3);
	} else {
		disp2 = '' + kgDec + gstr;
		str2 = numberToPlaces(kgDec / kgMult, 3);
	}
	if (str1 !== '') {
		ret[0] = {};
		ret[0][str1] = disp1;
	}
	if (str2 !== '') {
		ret[1] = {};
		ret[1][str2] = disp2;
	}
	return ret;
}

function parseAndSuggestCircumference(str, miMode) {
	if (!str) return {};
	str = str.replace(/[^0-9,.]/i, '').replace(/[,.]/, '_');//uniform separators
	var params = str.split('_', 3);
	if (params.length < 2)
		params[1] = '0';
	var km = Math.max(0, toInt(params[0], 0));
	var kmstr = miMode ? ' ft' : ' m';
	var mstr = miMode ? ' in' : ' cm';
	var mDec = parseFloat('0.' + params[1]);
	var kmDec = km + mDec;
	var kmMult = miMode ? 12 : 100;//foot has 12 inches in it
	var ret = [], str1 = '', str2 = '', disp1, disp2 = '';
	var realDec = kmDec;
	if (sportlyzer.user.isImperial())
		realDec *= 0.3048;
	if (realDec < 4) {
		str1 = '' + (kmDec * kmMult).toFixed(0);
		disp1 = '' + kmDec.toFixed(2) + kmstr;
	} else {
		disp2 = '' + kmDec.toFixed(2) + mstr;
		kmDec = Math.round(1000 * kmDec / kmMult) / 1000;
		str2 = '' + (kmDec * kmMult).toFixed(0);
	}
	if (str1 !== '') {
		ret[0] = {};
		ret[0][str1] = disp1;
	}
	if (str2 !== '') {
		ret[1] = {};
		ret[1][str2] = disp2;
	}
	return ret;
}

function verifyWorkoutForm(wid, pastMode) {
	var $form = $('#all_workout_forms_'+wid);
	if (!$form.length) return false;
	var arr = [];
	arr[arr.length] = {
		'elem':$form.find('.w-date'),
		'msg':'Please enter date'
	};
	arr[arr.length] = {
		'elem':$form.find('.w-time'),
		'msg':'Please enter time'
	};
	arr[arr.length] = {
		'elem':$form.find('.w-activity-name'),
		'msg':'Please enter activity name'
	};
	var $duration = $form.find('.w-duration');
	arr[arr.length] = {
		'elem':$duration,
		'msg':'Please enter duration'
	};
	arr[arr.length] = {
		'elem':$form.find('.w-route-name'),
		'msg':'Please enter place or route name'
	};
	if ($('#hrblock').is(':visible'))
		arr[arr.length] = {
			'elem':$form.find('.w-effort'),
			'tipelem':$form.find('.slider-int .track'),
			'msg':'Please select effort'
		};
	var ok = true;
	var qtipped = false;
	for(var i = 0; i < arr.length; i++) {
		if (!arr[i].elem.length) continue;
		if (arr[i].elem.val() === '') {
			//must add error class always, qtip is only shown for first error
			arr[i].elem.addClass('error required');
			if (!qtipped) {
				qtipped = true;
				var elem = arr[i].tipelem ? arr[i].tipelem : arr[i].elem;
				showWarningQtip(elem, arr[i].msg);
			}
			ok = false;
		}
	}
	return ok;
}

function showWarningQtip(elem, msg, noFocus, noErrorClass) {
	if (!elem) return;
	if (typeof elem === 'string')
		elem = $('#'+elem);
	if (!noFocus)
		elem.focus();
	if (!noErrorClass)
		elem.addClass('error required');
	if (!elem.qtip) return;
	elem.qtip({
		'style':{
			'classes':'ui-tooltip-red',
			'tip':true
		},
		'content':{
			'text':msg
		},
		'hide':{
			'fixed':true,
			'delay':400,
			'event':'blur keyup'
		},
		'show':{
			'ready':true,
			'solo':true
		},
		'position':{
			'my':'top center',
			'at':'bottom center'
		},
		'events':{
			'hide': function(event, api) {
				api.disable();
				api.destroy();
			}
		}
	});
}

function showDarkQtip($elem) {
	if (!$elem.qtip) return;
	$elem.showDarkQTip();
}

var ChartSelector = {
	getColor: function(idx) {
		switch (idx) {
			case 0://blue
				return '#0167CC';
			case 1://red
				return '#CD0606';
			case 2://green
				return '#679901';
			case 3://yellow
				return '#FF9900';
			case 4://my duration color
				return '#D7D7D7';
			default:
				return '#000000';
		}
	}
};

function fillChartSeries(idx, data) {
	for (var j = 0; j < data.series.length; j++) {
		clearChartName(data.series[j].name);
	}
	setChartLine(data.series, ChartSelector.getColor(idx), data.params);
}

var clearedStatsIndexes = {};
function fillStatsChartSeries(key, data, mode) {
	if (!clearedStatsIndexes[key]) clearedStatsIndexes[key] = {};
	for (var j = 0; j < data.series.length; j++) {
		var idx = toInt(data.params.idx, 0);
		if (clearedStatsIndexes[key][idx]) continue;
		clearStatsChartName(key, data.series[j].name, idx);
		clearedStatsIndexes[key][idx] = true;
	}
	setStatsChartLine(key, data.series, data.params, mode);
}

function addStatsChartZoneLinesEx(key, zoneLevels) {
	var c = statsCharts[key];
	if (!c)
		return;
	
	for (var i=0; i < zoneLevels.length; i++) {
		if (!zoneLevels[i].color) continue;
		var band = {
			id: 'zone-band-' + i,
			color: 'rgba('+parseInt(zoneLevels[i].color.substr(0,2), 16)+','+parseInt(zoneLevels[i].color.substr(2,2), 16)+','+parseInt(zoneLevels[i].color.substr(4,2), 16)+',0.2)',
			from: i === 0 ? 0 : zoneLevels[i].min,
			to: i === zoneLevels.length-1 ? 300 : zoneLevels[i+1].min
		};
		c.yAxis[0].addPlotBand(band);
	}
}

function triggerEvent(category, action, opt_label, opt_value_numeric) {
	//too early event, try again some time later
	if (typeof _gaq === 'undefined')
		return setTimeout(function() {
			triggerEvent(category, action, opt_label, opt_value_numeric);
		}, 50);
	try {
		_gaq.push(['_trackEvent', category, action, opt_label, opt_value_numeric]);
	}catch(ex){}
	return true;
}

function trackPageview(page) {
	if (typeof _gaq === 'undefined')
		return setTimeout(function() {
			trackPageview(page);
		}, 50);
	page = page || '';
	if (page.indexOf('/') !== 0) {
		if (page.indexOf('http:') === 0 || page.indexOf('https:') === 0) {
			spl.log('Bad trackPageview value: ' + page);
			return false;
		}
		page = '/' + page;
	}
	try {
		_gaq.push(['_trackPageview', page]);
	}catch(ex){}
	return true;
}

function getTimezoneOffset() {
	var rightNow = new Date();
	var jan1 = new Date(rightNow.getFullYear(), 0, 1, 0, 0, 0, 0);
	var temp = jan1.toGMTString();
	var jan2 = new Date(temp.substring(0, temp.lastIndexOf(" ")-1));
	var std_time_offset = (jan1 - jan2) / (1000);
	var daylight_time_offset = rightNow.getTimezoneOffset() * -60;
	return {
		'seconds':std_time_offset,
		'dst': std_time_offset !== daylight_time_offset
	};
}

function detectTimezone() {
	var offset = getTimezoneOffset();
	var std_time_offset = offset.seconds / 3600;
	if (std_time_offset === 0) return '';
	var str = (std_time_offset > 0 ? '+' : '-');
	std_time_offset = Math.abs(std_time_offset);
	str += (std_time_offset < 10 ? '0' : '') + Math.floor(std_time_offset)+':';

	std_time_offset -= Math.floor(std_time_offset);
	std_time_offset = Math.round(60 * std_time_offset);
	str += (std_time_offset < 10 ? '0' : '') + std_time_offset;
	return {
		'tz': str,
		'dst': offset.dst
	};
}

function matchesTimezone(tz, str) {
	return str.indexOf('(GMT'+tz+')') !== -1;
}

function selectMatchingTimezone(id) {
	var $select = $('#'+id);
	if (!$select.length || $select.val() !== '') return;
	var opts = $select[0].options;
	//first try jstz library
	var tz_name = jstz.determine().name();
	for(var i = 0; i < opts.length; i++) {
		if (opts[i].value === tz_name) {
			opts[i].selected = true;
			return;
		}
	}
	//fallback
	var zone = detectTimezone();
	for(var i = 0; i < opts.length; i++) {
		if (matchesTimezone(zone.tz, opts[i].text)) {
			opts[i].selected = true;
			return;
		}
	}
}

function cancelEvent(e) {
	if (!e && window.event) e = window.event;
	if (!e) return false;
	e.preventDefault && e.preventDefault();
	e.stopPropagation && e.stopPropagation();
	e.cancelBubble = true;
	return false;
}

function showGeoLink(id) {
	if(navigator.geolocation || typeof google !== 'undefined' && google.gears)
		$(id).css("visibility","visible");
}

function fillAddress(address) {
	$('#uc_city_').val(address.city);
	if (address.postalCode)
		$('#uc_zip_').val(address.postalCode);
	$('#uc_country_').val(address.countryCode);
	if (address.address)
		$('#uc_address_').val(address.address);
}

var geocoder = false;
function geocodeToAddress(latitude, longitude, origAddress) {
	if (!geocoder) geocoder = new google.maps.Geocoder();
	var latLng = new google.maps.LatLng(latitude, longitude);
	geocoder.geocode({
		'latLng': latLng
	}, function(results, status) {
		if (status === google.maps.GeocoderStatus.OK) {
			if (results[0]) {
				var adr = results[0].address_components;
				var map = { }, minimap = { };
				for (var i = 0; i < adr.length; i++) {
					var atype = adr[i];
					for (var j = 0; j < atype.types.length; j++) {
						map[atype.types[j]] = atype.long_name;
						minimap[atype.types[j]] = atype.short_name;
					}
				}
				var city = map.locality || '';
				var countryCode = minimap.country;
				var country = map.country;
				var address = {
					'city':city,
					'country':country,
					'countryCode':countryCode
				};
				if (map.postal_code) address.postalCode = map.postal_code;
				if (map.route) address.address = map.route + (map.street_number ? ' ' + map.street_number : '');
				if (!address.postalCode && origAddress.postalCode) address.postalCode = origAddress.postalCode;
				fillAddress(address);
			} else alert('Failed to ask geocode: '+JSON.stringify(results));
		} else {
			alert("Geocode was not successful for the following reason: " + status);
		}
	});
}
function handleGeoError(e) {
	switch(e.code) {
		case e.PERMISSION_DENIED:
			alert('Position information permissions denied in your browser, please enable them and try again');
			break;
		case e.POSITION_UNAVAILABLE:
			alert('Position information unavailable from your browser');
			break;
		case e.TIMEOUT:
			alert('Position information timed out in your browser');
			break;
		default:
			alert('Unknow error occured when asking position information from your browser, perhaps your browser does not support this functionality?');
			break;
	}
}
function autoFillAddress() {
	try {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
				geocodeToAddress(position.coords.latitude, position.coords.longitude, position.address ? position.address : { });
			}, handleGeoError, {
				'enableHighAccuracy':false
			});
		} else if (google.gears) {
			var geolocation = google.gears.factory.create('beta.geolocation');
			geolocation.getCurrentPosition(function(position) {
				geocodeToAddress(position.coords.latitude, position.coords.longitude, position.address ? position.address : { });
			}, handleGeoError, {
				'enableHighAccuracy':false
			});
		}
	} catch(Ex) {
		alert('An error occured');
	}
}

/* workouts2 related functions */

function pickActivityEx(id, name, btn, hasdistance) {
	var $wo_head = $(btn).closest('.wo-head');
	$wo_head.find('[name=activity_id]').val(id);
	var $form = $wo_head.find('[name=activity_name]').val(name).closest('form');
	setWActivityDistance($form, !hasdistance);
	$form.find('.u-duration').focus();
}

function pickRouteEx(id, name, distance, laps, btn) {
	var $wo_head = $(btn).closest('.wo-head');
	var $dist = $wo_head.find('[name=route_distance]');
	$('[name=route_name]').val(name);
	distance = parseFloat(''+distance);
	if (isNaN(distance)) distance = 0;
	var $laps = $wo_head.find('[name=laps]');
	if (!$dist.isVisible()) {
		$dist.val('');
		$laps.val('1');
		$wo_head.find('[name=route_id]').val('');
	} else {
		$wo_head.find('[name=route_id]').val(id);
		if (distance > 0) {
			$dist.val(distance);
			$laps.val(laps);
		}
	}
}

function openWExport(nonce, dateFrom, dateTo) {
	if (!LoadManager.canStart('exportpopup')) return;
	LoadManager.start('exportpopup');
	$.post('?page=workouts2&action=showExport', {
		'___nonce':nonce,
		'export_open':'Open',
		'date_from': dateFrom,
		'date_to': dateTo,
		'___ajax':'dummy'
	}, function(data) {
		LoadManager.stop('exportpopup');
		showWExport(data);
	}, 'html');
}

function showWExport(html) {
	var id = 'wexport_modal';
	jModalNew.open(id, html, 'HealthInfo', true);
	fixWModalNew(id);
}

function handleWorkoutFileUploadEx(upload_id, mode) {
//	spl.graph.popupSave(function() {}, true);
	spl.graph.reloadForm();
	spl.graph.loader.delay('Processing file');
}
function handleSyncFileUpload(upload_id, mode) {
	spl.graph.loader.delay('Processing ...');
	$.post('?page=multiupload&action=open', {'upload_id':upload_id}, function (data) {
		spl.graph.loader.hide();
		if (data === '') {//special case when all files uploaded were custom xlsx
			spl.graph.reload();
			return;
		}
		var modal_id = "jurakas";
		jModalNew.open(modal_id, data, "Batch upload", true);
		fixWModalNew(modal_id);
	});
}

function lapsChanged(elem) {
	var val = toInt($(elem).val(), 0);
	$(elem).closest('.wo-head').find('.count').text(val + ' lap' + (val === 1 ? '' : 's'));
}

function incLapsEx(diff, btn) {
	var $wo_head = $(btn).closest('.wo-head');
	var $route_dist = $wo_head.find('[name=distance]');
	var $route_laps = $wo_head.find('[name=laps]');
	var oldDist = parseFloat($route_dist.val());
	if (isNaN(oldDist) || oldDist < 0) oldDist = 0.0;
	var oldLaps = Math.max(1, toInt($route_laps.val(), 0));
	var lapDist = oldDist / oldLaps;
	var laps = Math.max(1, oldLaps + diff);
	$route_dist.val((lapDist * laps).toFixed(2));
	$route_laps.val(laps).trigger('change');
}

function openStatsBuddies(selector, url) {
	if (!LoadManager.canStart('sbuddypopup')) return false;
	LoadManager.start('sbuddypopup');
	var stats2 = true;
	$.post(url+'&action=chooseBuddies', {
		'___nonce': spl.request.nonce,
		'original_user': selector.getValue(),
		'___ajax': 'dummy'
	}, function(data) {
		LoadManager.stop('sbuddypopup');
		if (data === '') return;
		jModalNew.open('statsbuddies_modal', data, 'StatsBuddies');
		fixWModalNew('statsbuddies_modal');
		var $modal = $('#statsbuddies_modal');
		$modal.find('.ux-save').click(function () {
			var ids = [];
			$modal.find('.buddy-selected').each(function () {
				ids.push($(this).data('id'));
			});
			url = url.replace(/&athletes=([1-9]+[0-9-]*){0,1}/,'');
			if (ids.length)
				url += '&athletes='+ids.join('-');
			$(this).prop('href', spl.request.webroot+url);
		});
		if (stats2) {
			var $close = $modal.find('.close-popup').hide();
			$modal.find('.ux-close').click(function () {
				$close.click();
			});
		}
		$modal.find('span.buddy').click(function() {
			var $this = $(this);
			var val = $this.data('id'), name = $this.data('shortname'), fullname = $this.data('fullname');
			if (stats2) {
				$this.toggleClass('buddy-selected');
			} else {
				jModalNew.close('statsbuddies_modal', true);
				selector.setValue(val, name, fullname);
			}
			
		});
	}, 'html');
	return false;
}

function filterBuddies(event, input, container_id) {
	var $container = $('#'+container_id);
	if (event && event.which === 13) {
		var visibles = $container.children(':visible');
		if (visibles.length === 1) {
			visibles.trigger('click');
			return false;
		}
	}
	var search = $.trim(input.value);
	if (search === '') {
		$container.children().show();
		return null;
	}
	var list = $container.data('list');
	if (!list) {
		list = {};
		$container.children().each(function() {
			var $buddy = $(this);
			list[$buddy.data('id')] = $buddy.data('fullname').toLowerCase();
		});
		$container.data('list', list);
	}
	var matches = search.toLowerCase().split(' ');
	var mlength = matches.length, i, name, mcount;
	for(var id in list) {
		name = list[id];
		mcount = 0;
		for(i = 0; i < mlength; i++)
			if (name.indexOf(matches[i]) >= 0)
				mcount++;
		if (mcount === mlength)
			$('#buddy_'+id).show();
		else
			$('#buddy_'+id).hide();
	}
	return null;
}

function printStackTrace(options){options=options||{guess:true};var ex=options.e||null,guess=!!options.guess;var p=new printStackTrace.implementation(),result=p.run(ex);return(guess)?p.guessAnonymousFunctions(result):result;}
printStackTrace.implementation=function(){};printStackTrace.implementation.prototype={run:function(ex,mode){ex=ex||this.createException();mode=mode||this.mode(ex);if(mode==='other'){return this.other(arguments.callee);}else{return this[mode](ex);}},createException:function(){try{this.undef();}catch(e){return e;}},mode:function(e){if(e['arguments']&&e.stack){return'chrome';}else if(e.stack&&e.sourceURL){return'safari';}else if(e.stack&&e.number){return'ie';}else if(typeof e.message==='string'&&typeof window!=='undefined'&&window.opera){if(!e.stacktrace){return'opera9';}
if(e.message.indexOf('\n')>-1&&e.message.split('\n').length>e.stacktrace.split('\n').length){return'opera9';}
if(!e.stack){return'opera10a';}
if(e.stacktrace.indexOf("called from line")<0){return'opera10b';}
return'opera11';}else if(e.stack){return'firefox';}
return'other';},instrumentFunction:function(context,functionName,callback){context=context||window;var original=context[functionName];context[functionName]=function instrumented(){callback.call(this,printStackTrace().slice(4));return context[functionName]._instrumented.apply(this,arguments);};context[functionName]._instrumented=original;},deinstrumentFunction:function(context,functionName){if(context[functionName].constructor===Function&&context[functionName]._instrumented&&context[functionName]._instrumented.constructor===Function){context[functionName]=context[functionName]._instrumented;}},chrome:function(e){var stack=(e.stack+'\n').replace(/^\S[^\(]+?[\n$]/gm,'').replace(/^\s+(at eval )?at\s+/gm,'').replace(/^([^\(]+?)([\n$])/gm,'{anonymous}()@$1$2').replace(/^Object.<anonymous>\s*\(([^\)]+)\)/gm,'{anonymous}()@$1').split('\n');stack.pop();return stack;},safari:function(e){return e.stack.replace(/\[native code\]\n/m,'').replace(/^(?=\w+Error\:).*$\n/m,'').replace(/^@/gm,'{anonymous}()@').split('\n');},ie:function(e){var lineRE=/^.*at (\w+) \(([^\)]+)\)$/gm;return e.stack.replace(/at Anonymous function /gm,'{anonymous}()@').replace(/^(?=\w+Error\:).*$\n/m,'').replace(lineRE,'$1@$2').split('\n');},firefox:function(e){return e.stack.replace(/(?:\n@:0)?\s+$/m,'').replace(/^[\(@]/gm,'{anonymous}()@').split('\n');},opera11:function(e){var ANON='{anonymous}',lineRE=/^.*line (\d+), column (\d+)(?: in (.+))? in (\S+):$/;var lines=e.stacktrace.split('\n'),result=[];for(var i=0,len=lines.length;i<len;i+=2){var match=lineRE.exec(lines[i]);if(match){var location=match[4]+':'+match[1]+':'+match[2];var fnName=match[3]||"global code";fnName=fnName.replace(/<anonymous function: (\S+)>/,"$1").replace(/<anonymous function>/,ANON);result.push(fnName+'@'+location+' -- '+lines[i+1].replace(/^\s+/,''));}}
return result;},opera10b:function(e){var lineRE=/^(.*)@(.+):(\d+)$/;var lines=e.stacktrace.split('\n'),result=[];for(var i=0,len=lines.length;i<len;i++){var match=lineRE.exec(lines[i]);if(match){var fnName=match[1]?(match[1]+'()'):"global code";result.push(fnName+'@'+match[2]+':'+match[3]);}}
return result;},opera10a:function(e){var ANON='{anonymous}',lineRE=/Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;var lines=e.stacktrace.split('\n'),result=[];for(var i=0,len=lines.length;i<len;i+=2){var match=lineRE.exec(lines[i]);if(match){var fnName=match[3]||ANON;result.push(fnName+'()@'+match[2]+':'+match[1]+' -- '+lines[i+1].replace(/^\s+/,''));}}
return result;},opera9:function(e){var ANON='{anonymous}',lineRE=/Line (\d+).*script (?:in )?(\S+)/i;var lines=e.message.split('\n'),result=[];for(var i=2,len=lines.length;i<len;i+=2){var match=lineRE.exec(lines[i]);if(match){result.push(ANON+'()@'+match[2]+':'+match[1]+' -- '+lines[i+1].replace(/^\s+/,''));}}
return result;},other:function(curr){var ANON='{anonymous}',fnRE=/function\s*([\w\-$]+)?\s*\(/i,stack=[],fn,args,maxStackSize=10;while(curr&&curr['arguments']&&stack.length<maxStackSize){fn=fnRE.test(curr.toString())?RegExp.$1||ANON:ANON;args=Array.prototype.slice.call(curr['arguments']||[]);stack[stack.length]=fn+'('+this.stringifyArguments(args)+')';curr=curr.caller;}
return stack;},stringifyArguments:function(args){var result=[];var slice=Array.prototype.slice;for(var i=0;i<args.length;++i){var arg=args[i];if(arg===undefined){result[i]='undefined';}else if(arg===null){result[i]='null';}else if(arg.constructor){if(arg.constructor===Array){if(arg.length<3){result[i]='['+this.stringifyArguments(arg)+']';}else{result[i]='['+this.stringifyArguments(slice.call(arg,0,1))+'...'+this.stringifyArguments(slice.call(arg,-1))+']';}}else if(arg.constructor===Object){result[i]='#object';}else if(arg.constructor===Function){result[i]='#function';}else if(arg.constructor===String){result[i]='"'+arg+'"';}else if(arg.constructor===Number){result[i]=arg;}}}
return result.join(',');},sourceCache:{},ajax:function(url){var req=this.createXMLHTTPObject();if(req){try{req.open('GET',url,false);req.send(null);return req.responseText;}catch(e){}}
return'';},createXMLHTTPObject:function(){var xmlhttp,XMLHttpFactories=[function(){return new XMLHttpRequest();},function(){return new ActiveXObject('Msxml2.XMLHTTP');},function(){return new ActiveXObject('Msxml3.XMLHTTP');},function(){return new ActiveXObject('Microsoft.XMLHTTP');}];for(var i=0;i<XMLHttpFactories.length;i++){try{xmlhttp=XMLHttpFactories[i]();this.createXMLHTTPObject=XMLHttpFactories[i];return xmlhttp;}catch(e){}}},isSameDomain:function(url){return typeof location!=="undefined"&&url.indexOf(location.hostname)!==-1;},getSource:function(url){if(!(url in this.sourceCache)){this.sourceCache[url]=this.ajax(url).split('\n');}
return this.sourceCache[url];},guessAnonymousFunctions:function(stack){for(var i=0;i<stack.length;++i){var reStack=/\{anonymous\}\(.*\)@(.*)/,reRef=/^(.*?)(?::(\d+))(?::(\d+))?(?: -- .+)?$/,frame=stack[i],ref=reStack.exec(frame);if(ref){var m=reRef.exec(ref[1]);if(m){var file=m[1],lineno=m[2],charno=m[3]||0;if(file&&this.isSameDomain(file)&&lineno){var functionName=this.guessAnonymousFunction(file,lineno,charno);stack[i]=frame.replace('{anonymous}',functionName);}}}}
return stack;},guessAnonymousFunction:function(url,lineNo,charNo){var ret;try{ret=this.findFunctionName(this.getSource(url),lineNo);}catch(e){ret='getSource failed with url: '+url+', exception: '+e.toString();}
return ret;},findFunctionName:function(source,lineNo){var reFunctionDeclaration=/function\s+([^(]*?)\s*\(([^)]*)\)/;var reFunctionExpression=/['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*function\b/;var reFunctionEvaluation=/['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*(?:eval|new Function)\b/;var code="",line,maxLines=Math.min(lineNo,20),m,commentPos;for(var i=0;i<maxLines;++i){line=source[lineNo-i-1];commentPos=line.indexOf('//');if(commentPos>=0){line=line.substr(0,commentPos);}
if(line){code=line+code;m=reFunctionExpression.exec(code);if(m&&m[1]){return m[1];}
m=reFunctionDeclaration.exec(code);if(m&&m[1]){return m[1];}
m=reFunctionEvaluation.exec(code);if(m&&m[1]){return m[1];}}}
return'(?)';}};

function validate_email(email) {
	return /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))+$/.test(email);
}

function hrDataToSeries(chart_id, hrdata, caddata, powerdata) {
	var series = [], data = null, i = 0;
	function dataToSeries(series, data, chart_idx, chart_type, chart_title, chart_color) {
		if (!data || !data.length) return;
		var finalData = [];
		var data_starttime = data[0][0];
		var data_max = null, data_min = null;
		for (i = 0; i < data.length; i++) {
			var data_tmp = data[i][1];
			if (data_tmp !== null && !isNaN(data_tmp) && data_tmp > 0) {
				data_tmp = parseInt(data_tmp, 10);
				finalData.push([(i !== 0 ? data_starttime + data[i][0] : data[i][0]) * 1000, data_tmp]);
				if (data_max === null || data_tmp > data_max) data_max = data_tmp;
				if (data_min === null || data_tmp < data_min) data_min = data_tmp;
			}
		}
		if (finalData.length)
			series[series.length] = {
				'series': [{ 'data': finalData, 'name': chart_title }], 'type': chart_type,
				'params': {
					'graphtype': chart_type,
					'_chart_maxval': data_max,
					'_chart_minval': data_min,
					'idx': chart_idx,
					'color': chart_color
				}
			};
	}
	function buildTorqueData(powerdata, caddata) {
		if (!caddata || !caddata.length || !powerdata || !powerdata.length)
			return false;
		var cadmap = {}, i = 0;
		var caddata_starttime = caddata[0][0];
		for (i = 0; i < caddata.length; i++) {
			var data_tmp = caddata[i][1];
			var data_time = i === 0 ? caddata[i][0] : caddata[i][0] + caddata_starttime;
			if (data_tmp !== null && !isNaN(data_tmp) && data_tmp > 0) {
				data_tmp = parseInt(data_tmp, 10);
				cadmap[data_time] = data_tmp;
			}
		}
		var torquedata = [];
		var powerdata_starttime = powerdata[0][0], torquedata_starttime = 0;
		for (i = 0; i < powerdata.length; i++) {
			var data_tmp = powerdata[i][1];
			var data_time = i === 0 ? powerdata[i][0] : powerdata[i][0] + powerdata_starttime;
			if (data_tmp === null || isNaN(data_tmp) || data_tmp <= 0)
				continue;
			data_tmp = parseInt(data_tmp, 10);	
			var cad = cadmap[data_time];
			if (typeof cad !== 'number')
				continue;
			var torque = data_tmp / 2.0 / Math.PI / cad * 60.0;
			if (torquedata_starttime === 0) {
				torquedata_starttime = data_time;
				torquedata.push([data_time, torque])
			} else
				torquedata.push([data_time - torquedata_starttime, torque]);
		}
		if (torquedata.length <= 1)
			return false;
		return torquedata;
	}
	//ele=2, speed=3
	dataToSeries(series, caddata, 4, 'cad', 'Cadence', '#4646FF');
	dataToSeries(series, powerdata, 1, 'pow', 'Power', '#464646');
	dataToSeries(series, hrdata, 0, 'hr', 'Heartrate', '#FF0000');
	//var torquedata = buildTorqueData(powerdata, caddata);
	//if (torquedata)	dataToSeries(series, torquedata, 5, 'torque', 'Torque', '#880000');
	for(var ii = 0; ii < series.length; ii++)
		fillStatsChartSeries(chart_id, series[ii], 'datetime');
}

function showSpeedChart(speedChartTarget, waypoints) {
	var e = Math, ra = e.PI/180;
	var distDiffM = function(lat1, lng1, lat2, lng2) {
		var b = lat1 * ra, c = lat2 * ra, d = b - c;
		var g = (lng1 - lng2) * ra;
		return 2 * e.asin(e.sqrt(e.pow(e.sin(d/2), 2) + e.cos(b) * e.cos(c) * e.pow(e.sin(g/2), 2))) * 6378137;
	};

	var speeds = [];
	var eles = [];

	var lastP = null, j, speed_max = null, hasTime = false;
	var dists_arr = [];
	var dists_total = 0;
	var dists_time_total = 0;
	var is_imperial = spl.user.isImperial();
	var totaldistance = 0;
	var distancemap = {};
	for (var i = 0; i < waypoints.length; i++) {
		var pt = {'lat': parseFloat(waypoints[i].lat), 'lng': parseFloat(waypoints[i].lng), 'time': parseInt(waypoints[i].time, 10), 'ele': waypoints[i].ele};
		if (isNaN(pt.time) && waypoints[i].vertexes && waypoints[i].vertexes.length)
			pt.time = parseInt(waypoints[i].vertexes[0].time, 10);
		var pts = [pt];
		//always try to count in all waypoint vertexes
		if (waypoints[i].vertexes && waypoints[i].vertexes.length) {
			pts = [];
			var verts = waypoints[i].vertexes;
			for(j = 0; j < verts.length; j++) {
				pts.push({'lat': parseFloat(verts[j].lat), 'lng': parseFloat(verts[j].lng), 'time': parseInt(verts[j].time, 10), 'ele': verts[j].ele});
			}
		}
		var last_speed = null;
		for (var k = 1; k < pts.length; k++) {
			if (lastP !== null) {
				var dist = distDiffM(pts[k].lat, pts[k].lng, lastP.lat, lastP.lng);
				var secs = pts[k].time - lastP.time;
				if (dist > 300000) {
					lastP = pts[k];
					continue;
				}
				totaldistance += dist;
				if (secs > 0) {
					//speed existed
					if (last_speed > 0.7 && dist / secs / last_speed > 20 || dist / secs >= 40 && dist / secs / last_speed > 20) {
						lastP = pts[k];
						dists_arr = [];
						dists_time_total = dists_total = 0;
						continue;//skip points that have suddenly sped up over 10 times from walking speeds
					}
					dists_time_total += secs;
					dists_total += dist;
					dists_arr.push({'d':dist,'i':secs});
					hasTime = true;
					var speed_tmp = dists_total / dists_time_total;
					last_speed = speed_tmp;
					if (is_imperial)
						speed_tmp /= 1.609344;
					if (dists_arr.length > 2) {
						speeds.push([pts[k].time * 1000, speed_tmp, totaldistance]);
						speed_max = Math.max(speed_max, speed_tmp);
					}
				}
				//average speed to last 6 gpx points or 40 seconds with 3+ points
				while (dists_arr.length > 6 || dists_time_total >= 40 && dists_arr.length > 3) {
					var dist_pop = dists_arr.shift();
					dists_total -= dist_pop.d;
					dists_time_total -= dist_pop.i;
				}
			}
			lastP = pts[k];
			distancemap[lastP.time] = totaldistance;
			var ele_tmp = lastP.ele !== null && lastP.ele !== undefined ? parseFloat(lastP.ele) : null;
			var lastEle = eles.length > 0 ? eles[eles.length - 1][1] : 0;
			if (ele_tmp === 0.0 && Math.abs(lastEle - ele_tmp) >= 30 && secs < 30)
				ele_tmp = lastEle;
			if (ele_tmp !== null && !isNaN(ele_tmp)) {
				if (is_imperial) ele_tmp /= 0.3048;
				eles.push([lastP.time * 1000, ele_tmp, totaldistance]);
			}
		}
	}

	var ele_max = null, ele_min = null, ele_last = null;
	var ele_gain = 0, ele_loss = 0, v_ele = 0;
	for (j = 0; j < eles.length; j++) {
		var ele = eles[j][1];
		if (ele_max === null || ele > ele_max) ele_max = ele;
		if (ele_min === null || ele < ele_min) ele_min = ele;

		v_ele = eles[j][1];
		if (ele_last === null) {
			ele_last = v_ele;
		} else {
			var e_diff = v_ele - ele_last;
			ele_last = v_ele;
			if (e_diff > 0) ele_gain += e_diff;
			else ele_loss -= e_diff;
		}
	}

	if (!(ele_min === null || ele_min === 0.0 && ele_max === 0.0)) {
		var ele_diff = ele_max - ele_min;
		if (ele_diff < 40) {
			ele_diff = (40 - ele_diff) / 2;
		} else
			ele_diff *= 0.05;
		ele_min -= ele_diff;
		ele_max += ele_diff;
		var ele_unit = spl.user.isMetric() ? 'm' : 'ft';
		$('#elevation_loss').html(ele_loss > 0 ? ele_loss.toFixed(1) + ' ' + ele_unit : '-');
		$('#elevation_gain').html(ele_gain > 0 ? ele_gain.toFixed(1) + ' ' + ele_unit : '-');
	}
	if (speed_max !== null) {
		var km_h = (speed_max * 3.6).toFixed(1);
		$('#speed_max').html(km_h + ' '+(spl.user.isMetric() ? 'km' : 'mi') + '/h');
	}
	if (!hasTime)
		eles = [];
	if (speeds.length === 0 && eles.length === 0) {
		//TODO: hide chart ?
		redrawStatsCharts(speedChartTarget, null);
		return;
	}
	if (speeds.length) {
		var speedSeries = {
			'series': [{
				'data': speeds,
				'name': 'Speed'
			}],
			'type': 'speed',
			'params': {
				'graphtype': 'speed',
				'idx': 2,
				'color': '#80C800'
			}
		};
		fillStatsChartSeries(speedChartTarget, speedSeries, 'datetime');
	}
	if (eles.length) {
		var eleSeries = {
			'series': [{
				'data': eles,
				'name': 'Elevation'
			}],
			'type': 'elevation',
			'params': {
				'graphtype': 'elevation',
				'idx': 3,
				'_chart_minval': ele_min,
				'_chart_maxval': ele_max,
				'color': '#808000'
			}
		};
		fillStatsChartSeries(speedChartTarget, eleSeries, 'datetime');
	}
	redrawStatsCharts(speedChartTarget, null);
}

function SPLTour(args) {
	var tour = this;
	var $tooltips = $('.ux-tour.'+args.tour).detach().appendTo('body');
	var $t = $tooltips.filter('.'+args.step);
	var index = $tooltips.index($t);
	var redir_url = '';
	// Placing tooltip
	this.placeTooltip = function (forceScroll) {
		redir_url = '';
//		$t.find('.progress').text((index+1)+' / '+count)
		var $a = $($t.data('selector')).first();
		if (!$a.isVisible()) {
			$t.hide();
			return;
		} else $t.show();
		var aoffset = $a.offset();
		var $h = $a.closest('.sticky-header');
		if ($h.length) {
			var htop = $h.offset().top;
			if ($h.is('.sticky-header-scrolling')) {
				$t.css('position', 'fixed');
				$t.css('margin-top', -htop+12+($('body').hasClass('dark') ? 33 : 0));
			} else {
				$t.css('position', 'absolute');
				$t.css('margin-top', 12);
			}
		}
		if (aoffset) {
			redir_url = $a.data('tour-uri');
			if ($t.hasClass('bottom-left'))
				$t.css('top', (aoffset.top-$t.height()-20)+'px');
			else
				$t.css('top', aoffset.top+$a.height()+'px');
			//weird bug in chrome
			aoffset = $a.offset();
			var left = aoffset.left;
			if ($(document).width()/2 > left) {
				$t.css('left', left+'px');
				$t.css('margin-left', ($a.width()/2-22)+'px');
			} else {
				$t.addClass('right');
				$t.css('left', left+'px');
				$t.css('margin-left', -$t.width()+$a.width()/2+24+'px');
			}
			if (forceScroll) {
				var toffset = $t.offset();
				var viewport = {'top': $('html, body').scrollTop()};
				viewport.bottom = viewport.top + $(window).height();
				//scroll only when needed
				if (!(viewport.top <= toffset.top && viewport.bottom >= toffset.top + $t.height()))
					$('html, body').scrollTop(Math.max(0, toffset.top - 100));
			}
		}
		$t.fadeIn(200);
	};
	tour.placeTooltip(true);
	// Window resizing
	$(window).bind('resize scroll', function () {
		setTimeout(function() {
			tour.placeTooltip();
		}, 5);
	});
	// Handling events
	$tooltips.on('click', '.ux-next, .ux-back', function (e) {
		var $this = $(this);
		var href = $this.attr('href');
		if ($this.data('redir'))
			redir_url = $this.data('redir');
		var target_link_href = '';
		if ($this.data('target_link'))
			target_link_href = $.trim($($this.data('target_link')).first().prop('href'));
		if (target_link_href === 'javascript:;')
			target_link_href = '';
		if (target_link_href)
			redir_url = '';
		if (href === '#next' || href === '#back') {
			e.preventDefault();
			//do not do default redirection
			if (!target_link_href) {
				$t.hide();
				if (href === '#next') index++;
				else index--;
				$t = $tooltips.eq(index);
				if ($t.length) {
					tour.placeTooltip();
					if ($(this).hasClass('ux-scroll-top'))
						$('html, body').scrollTop(0);
					else {
						var toffset = $t.offset();
						var viewport = {'top': $('html, body').scrollTop()};
						viewport.bottom = viewport.top + $(window).height();
						//scroll only when needed
						if (!(viewport.top <= toffset.top && viewport.bottom >= toffset.top + $t.height()))
							$('html, body').scrollTop(Math.max(0, toffset.top - 100));
					}
				}
			}
			function handler() {
				if (target_link_href) {
					document.location.href = target_link_href;
				}
			}
			if (href === '#next')
				$.get('?page=tour&action=advance&tour='+args.id+redir_url, handler);
			else
				$.get('?page=tour&action=retreat&tour='+args.id+redir_url, handler);
			return false;
		} else
			if (redir_url)
				$(this).prop('href', $(this).prop('href') + '&redir=' + escape(redir_url));
	});
	// Handling events
	$tooltips.on('click', '.ux-skip', function (e) {
		$.get('?page=tour&action=skip&tour='+args.id);
		$(this).closest('.ux-tour').hide().remove();
	});
}

var stats2_format_units = {};
function formatTypeValue(type, val) {
	if (!type) return '';
	var unit = stats2_format_units[type] || '';
	if (type.indexOf('sum_') === 0 || type.indexOf('avg_') === 0 || type.indexOf('str_') === 0 || type.indexOf('max_') === 0 || type.indexOf('min_') === 0)
		type = type.substr(4);
	var mins, hrs, secs;
	if (type.indexOf('zon_') === 0)
		return val.toFixed(0) + (unit !== '' ? ' ' + unit : '');
	switch (type) {
		case 'strength':
		case 'not_strength':
		case 'duration':
		case 'sleep':
			mins = Math.round(val / 60);
			hrs = Math.floor(mins / 60);
			mins %= 60;
			val = hrs + ':' + padStr(mins, 2, '0', true);
			break;
		case 'duration__hms':			
		case 'duration__ms':
			var secs_precise = val.toFixed(2).split('.');
			secs = secs_precise[0] * 1;
			mins = Math.floor(secs / 60);
			secs %= 60;
			if (type === 'duration__hms') {
				hrs = Math.floor(mins / 60);
				mins %= 60;
				val = hrs + ':' + padStr(mins, 2, '0', true) + ':' + padStr(secs, 2, '0', true);// + '.' + secs_precise[1];
			} else
				val = mins + ':' + padStr(secs, 2, '0', true) + '.' + secs_precise[1];
			break;
		case 'duration__s':
			val = val.toFixed(2);
			break;
		case 'distance__km':
			val = val.toFixed(3);
			break;
		case 'distance__m':
			val = val.toFixed(2);
			break;
		case 'distance__cm':
			val = (val * 100).toFixed(0);
			break;
		case 'pace':
		case 'pace___500m':
		case 'pace__min_km':
		case 'pace__min_500m':
			secs = Math.ceil(val * 60);
			mins = Math.floor(secs / 60);
			secs %= 60;
			val = mins + ':' + padStr(secs, 2, '0', true);
			break;
		case 'distance':
			val = (val / 1000).toFixed(2);
			break;
		case 'heartrate':
		case 'sickness_days':
		case 'cnt_all'://total wo count
			val = val.toFixed(0);
			break;
		case 'work_load':
		case 'intensity':
		case 'activity_score':
		case 'feeling':
		case 'training_load':
		case 'calories':
			val = (val * 1).toFixed(1);
			break;
		case 'weight':
		default:
			val = (val * 1).toFixed(2);
			break;
	}
	return val + (unit !== '' ? ' ' + unit : '');
}

var stats2Charts = [];
function showStats2Chart(target, dataLength) {
	if (!document.getElementById(target)) return;
	var chartt = stats2Charts[target];
	try{
		if(chartt)chartt.destroy();
		chartt=null;
	}catch(Ex){}
	var dummy = {
		series: []
	};
	//disable chart animations for MSIE 8 and older
	var canAnimate = !($.browser.msie && $.browser.version < 9);
	var def_labels = ['','','','','','','','','','','',''];
	var min_x = 0, max_x = dataLength;
	chartt = new Highcharts.Chart({
		chart: {
			renderTo: target,
			defaultSeriesType: 'line',
			spacingTop: 0,
			animation: canAnimate,
			borderRadius: 0,
			borderWidth: 0,
			backgroundColor: 'rgba(252,249,242,0)',
			shadow: false,
			plotBorderWidth: 0,
			plotShadow: false,
			style: {
				fontFamily: 'sans-serif, Arial, Helvetica',
				fontSize: '12px'
			},
			showAxes: true,
			zoomType: 'x'
		},
		title: {text: ''},
		legend: {enabled: false},
		xAxis: {
			gridLineWidth: 0,
			//gridLineColor: 'rgb(237,237,237)',
			lineWidth: 0,
			tickWidth: 0,
			categories: def_labels,
			labels: {enabled: true, formatter: function() {return (this.value + '').split('|')[0];}/*, style: {textDecoration: 'underline', cursor: 'pointer'}*/},
			min: min_x,
			max: max_x,
			title: {text:''},
			opposite: true,
			//tickInterval: 1,
			type: 'linear'
		},
		//11 axis for up to 3 line types
		yAxis: [{
			labels: {enabled: true, formatter: function() { return formatTypeValue(this.axis._spl_graphtype, this.value); }, style: {color: '#3EABE8'}},
			title: {text:''},
			gridLineWidth: 1,
			tickWidth: 1,
			min: 0,
			minTickInterval: 1,
			//startOnTick: false,
			//endOnTick: false,
			//alignTicks: false,
			id: 0,
			opposite: false
		}, {
			labels: {enabled: true, formatter: function() { return formatTypeValue(this.axis._spl_graphtype, this.value); }, style: {color: '#666666'}},
			title: {text:''},
			gridLineWidth: 1,
			tickWidth: 1,
			min: null,
			//minTickInterval: 1,
			//startOnTick: false,
			//endOnTick: false,
			//alignTicks: false,
			id: 1,
			opposite: true
		}],
		tooltip: {
			formatter: function() {
				if (!this.points.length) return false;

				var nameArr = (this.x + '').split('|');
				var str = '<b>'+nameArr[1]+'</b>';
				var hasinfo = false;
				var pts_list = [];
				var zon_sum = 0;
				var str_sum = 0;
				for(var j = 0; j < this.points.length; j++) {
					pts_list.push(this.points[j]);
					var pt_type = (pts_list[j].series.options._spl_graphtype || '');
					if (pt_type.indexOf('zon_') === 0)
						zon_sum += pts_list[j].y;
					else if (pt_type.indexOf('str_') === 0)
						str_sum += pts_list[j].y;
				}
				for(var i = 0; i < pts_list.length; i++) {
					var pt = pts_list[i];
					var val = pt.y;
					var type = pt.series.options._spl_graphtype || '';
					var f_val = formatTypeValue(type, val);
					if (type.indexOf('zon_') === 0)
						f_val += ' ('+(zon_sum > 0 ? 100 * val / zon_sum : 0).toFixed(1)+'%)';
					else if (type.indexOf('str_') === 0)
						f_val += ' ('+(str_sum > 0 ? 100 * val / str_sum : 0).toFixed(1)+'%)';
					hasinfo = true;
					var color = pt.series.color;
					if (pt.series.options.states.hover && pt.series.options.states.hover.color)
						color = pt.series.options.states.hover.color;
					if (color.indexOf('rgba') === 0) {
						color = color.replace(/,[^,]+\)/, ',1)');
					}
					var seriesName = pt.series.name;
					str += '<br/><span style="color:'+color+';">'+ seriesName +': '+ f_val + '</span>';
				}
				if (!hasinfo) return false;
				return str;
			},
			shared: true,
			borderColor: '#000000',
			shadow: false,
			crosshairs: false
		},
		credits: {enabled: false},
		plotOptions: {
			line: {animation: canAnimate},
			spline: {animation: canAnimate},
			column: {animation: canAnimate,stacking: 'normal'},
			areaspline: {animation: canAnimate,stacking: 'normal'}
		},
		series: dummy.series
	});
	if (stats2Charts[target])
		try { stats2Charts[target].destroy(); } catch (e) { }
	stats2Charts[target] = chartt;
}

function setStats2ChartLine(key, series) {
	var c = stats2Charts[key], i = 0, color = '#43C9FF', labels = [];
	if ($.browser.msie /*&& $.browser.version < 9*/ && (c && (!c.xAxis || !c.xAxis.length || !c.yAxis || !c.yAxis.length))) {
		setTimeout(function() {
			setStats2ChartLine(key, series);
		}, 333);
		return;
	}
	if (!c) return;
	for(i = 0; i < series.length; i++) {
		var serie = series[i];
		var markerRadius = serie.count <= 28 ? 5 : (serie.count <= 56 ? 4 : 3);
		var markerLineW = serie.count <= 28 ? 3 : (serie.count <= 56 ? 2 : 2);
		var lineW = serie.count <= 28 ? 4 : (serie.count <= 56 ? 3 : 2);
		var markerEnabled = true;//count < 75;
		var ser = {
			data: serie.data,
			name: serie.name,
			lineWidth: lineW,
			shadow: false,
			marker: {
				enabled: markerEnabled,
				radius: markerRadius,
				symbol: 'circle',
				lineWidth: markerLineW,
				lineColor: color,
				fillColor: '#fcfaf3'
			},
			type: 'line',
			yAxis: serie.idx,
			visible: true,
			_spl_graphtype: serie.type,
			_spl_unit: serie.unit,
			color: color
		};
		stats2_format_units[serie.type] = serie.unit;
		c.yAxis[serie.idx]._spl_graphtype = serie.type;
		if(serie.idx === 0) {
			ser.type = 'column';
			ser.borderWidth = 0;
			ser.borderRadius = 0;
			ser.color = '#3EABE8';
			ser.states = {hover: {color: '#3188B7'}};
		}
		if (serie.color)
			ser.marker.lineColor = ser.color = serie.color;
		if (serie.hovercolor && ser.states)
			ser.states.hover.color = serie.hovercolor;
		if (typeof serie._chart_minval !== 'undefined' && typeof serie._chart_maxval !== 'undefined') {
			var min = serie._chart_minval, max = serie._chart_maxval;
			var c_min = min - ((max-min) * 0.05);
			var c_max = max + ((max-min) * 0.05);
			c.yAxis[serie.idx].setExtremes(c_min, c_max, false);
		}
		c.addSeries(ser, false);
		labels = serie.labels;
	}
	if (labels && labels.length) {
		var cutRatio = Math.floor((labels.length-1)/28)+1;
		if (cutRatio > 1) {
			for(var ii = 0; ii < labels.length; ii++) {
				if (ii === 0 || ii === labels.length - 1) continue;
				if (ii % cutRatio === 0 && labels.length - ii >= cutRatio) continue;
				labels[ii] = '|' + labels[ii].split('|')[1];
			}
		}
		c.xAxis[0].setCategories(labels, false);
	}
	c.redraw();//TODO: optimize
}

function require(file,callback){
	var head = document.getElementsByTagName("head")[0];
	var script = document.createElement('script');
	script.src = file;
	script.type = 'text/javascript';
	script.onload = callback;
	script.onreadystatechange = function() {
		if (this.readyState === 'complete') {
			callback();
		}
	};
	head.appendChild(script);
}

function t(str, args) {
	var trans = str;//typeof transl == 'undefined' || typeof transl[str] == 'undefined' ? str : transl[str];
	if (args)
		$.each(args, function(key, value) {
			var reg = new RegExp('\\[' + key + '\\]', 'g');
			trans = trans.replace(reg, value);
		});
	return trans;
}

function detectZoom() {
	//skip zooming detection for mobile browsers
	if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) return 1;
	var body = document.body || document.documentElement;
	var cont = document.createElement('div');
	var childrenc = 50;
	var targetLineCount = 25;
	var itemw = 3;
	var targetwidth = targetLineCount * itemw;
	cont.setAttribute('style', 'width:'+targetwidth+'px;position:absolute;');
	var children = [];
	for (var i = 0; i < childrenc; i++) {
		var child = document.createElement('div');
		child.setAttribute('style', 'width:1px;height:1px;float:left;border:1px solid transparent;margin:0;padding:0;');
		children[children.length] = child;
		cont.appendChild(child);
	}
	body.appendChild(cont);
	//with sum
	var realwidth = 0;
	//if all params match
	var matching = true;
	//how many items were per line
	var lineCount = false;
	for (i = 0; i < childrenc; i++) {
		var reqTop = i >= targetLineCount ? itemw : 0;
		child = children[i];
		if (child.offsetTop > 0 && lineCount === false) lineCount = i;
		realwidth += child.offsetWidth;
		matching &= child.offsetWidth === itemw && child.offsetTop === reqTop;
	}
	if (lineCount === false) lineCount = childrenc;
	body.removeChild(cont);
	var zoom = Math.round(100 * lineCount / targetLineCount) / 100;
	//try with widths
	if (!matching && zoom === 1)
		zoom = Math.round(1000 * (targetwidth * 2) / realwidth) / 1000;
	//still messed up? force zoome not to be 1
	if (!matching && zoom === 1) {
		zoom = 0.9;
	}
	return zoom;
};

function htmlspecialchars_decode(string, quote_style) {
	if (string === null || typeof string === 'undefined')
		return '';
	var optTemp = 0;
	var i = 0;
	var noquotes = false;
	if (typeof quote_style === 'undefined') {
		quote_style = 3;
	}
	string = string.toString().replace(/&lt;/g, '<').replace(/&gt;/g, '>');
	var OPTS = {
		'ENT_NOQUOTES': 0,
		'ENT_HTML_QUOTE_SINGLE': 1,
		'ENT_HTML_QUOTE_DOUBLE': 2,
		'ENT_COMPAT': 2,
		'ENT_QUOTES': 3,
		'ENT_IGNORE': 4
	};
	if (quote_style === 0) {
		noquotes = true;
	}
	if (typeof quote_style !== 'number') { // Allow for a single string or an array of string flags
		quote_style = [].concat(quote_style);
		for (i = 0; i < quote_style.length; i++) {
			// Resolve string input to bitwise e.g. 'PATHINFO_EXTENSION' becomes 4
			if (OPTS[quote_style[i]] === 0) {
				noquotes = true;
			} else if (OPTS[quote_style[i]]) {
				optTemp = optTemp | OPTS[quote_style[i]];
			}
		}
		quote_style = optTemp;
	}
	if (quote_style & OPTS.ENT_HTML_QUOTE_SINGLE) {
		string = string.replace(/&#0*39;/g, "'"); // PHP doesn't currently escape if more than one 0, but it should
		// string = string.replace(/&apos;|&#x0*27;/g, "'"); // This would also be useful here, but not a part of PHP
	}
	if (!noquotes) {
		string = string.replace(/&quot;/g, '"');
	}
	// Put this in last place to avoid escape being double-decoded
	string = string.replace(/&amp;/g, '&');

	return string;
}

/**
 * This script gives you the zone info key representing your device's time zone setting.
 *
 * @name jsTimezoneDetect
 * @version 1.0.5
 * @author Jon Nylander
 * @license MIT License - http://www.opensource.org/licenses/mit-license.php
 *
 * For usage and examples, visit:
 * http://pellepim.bitbucket.org/jstz/
 *
 * Copyright (c) Jon Nylander
 */

/*jslint undef: true */
/*global console, exports*/

(function(root) {
	/**
	 * Namespace to hold all the code for timezone detection.
	 */
	var jstz = (function () {
		'use strict';
		var HEMISPHERE_SOUTH = 's',

			/**
			 * Gets the offset in minutes from UTC for a certain date.
			 * @param {Date} date
			 * @returns {Number}
			 */
			get_date_offset = function (date) {
				var offset = -date.getTimezoneOffset();
				return (offset !== null ? offset : 0);
			},

			get_date = function (year, month, date) {
				var d = new Date();
				if (year !== undefined) {
				  d.setFullYear(year);
				}
				d.setMonth(month);
				d.setDate(date);
				return d;
			},

			get_january_offset = function (year) {
				return get_date_offset(get_date(year, 0 ,2));
			},

			get_june_offset = function (year) {
				return get_date_offset(get_date(year, 5, 2));
			},

			/**
			 * Private method.
			 * Checks whether a given date is in daylight saving time.
			 * If the date supplied is after august, we assume that we're checking
			 * for southern hemisphere DST.
			 * @param {Date} date
			 * @returns {Boolean}
			 */
			date_is_dst = function (date) {
				var is_southern = date.getMonth() > 7,
					base_offset = is_southern ? get_june_offset(date.getFullYear()) : 
												get_january_offset(date.getFullYear()),
					date_offset = get_date_offset(date),
					is_west = base_offset < 0,
					dst_offset = base_offset - date_offset;

				if (!is_west && !is_southern) {
					return dst_offset < 0;
				}

				return dst_offset !== 0;
			},

			/**
			 * This function does some basic calculations to create information about
			 * the user's timezone. It uses REFERENCE_YEAR as a solid year for which
			 * the script has been tested rather than depend on the year set by the
			 * client device.
			 *
			 * Returns a key that can be used to do lookups in jstz.olson.timezones.
			 * eg: "720,1,2". 
			 *
			 * @returns {String}
			 */

			lookup_key = function () {
				var january_offset = get_january_offset(),
					june_offset = get_june_offset(),
					diff = january_offset - june_offset;

				if (diff < 0) {
					return january_offset + ",1";
				} else if (diff > 0) {
					return june_offset + ",1," + HEMISPHERE_SOUTH;
				}

				return january_offset + ",0";
			},

			/**
			 * Uses get_timezone_info() to formulate a key to use in the olson.timezones dictionary.
			 *
			 * Returns a primitive object on the format:
			 * {'timezone': TimeZone, 'key' : 'the key used to find the TimeZone object'}
			 *
			 * @returns Object
			 */
			determine = function () {
				var key = lookup_key();
				return new jstz.TimeZone(jstz.olson.timezones[key]);
			},

			/**
			 * This object contains information on when daylight savings starts for
			 * different timezones.
			 *
			 * The list is short for a reason. Often we do not have to be very specific
			 * to single out the correct timezone. But when we do, this list comes in
			 * handy.
			 *
			 * Each value is a date denoting when daylight savings starts for that timezone.
			 */
			dst_start_for = function (tz_name) {

			  var ru_pre_dst_change = new Date(2010, 6, 15, 1, 0, 0, 0), // In 2010 Russia had DST, this allows us to detect Russia :)
				  dst_starts = {
					  'America/Denver': new Date(2011, 2, 13, 3, 0, 0, 0),
					  'America/Mazatlan': new Date(2011, 3, 3, 3, 0, 0, 0),
					  'America/Chicago': new Date(2011, 2, 13, 3, 0, 0, 0),
					  'America/Mexico_City': new Date(2011, 3, 3, 3, 0, 0, 0),
					  'America/Asuncion': new Date(2012, 9, 7, 3, 0, 0, 0),
					  'America/Santiago': new Date(2012, 9, 3, 3, 0, 0, 0),
					  'America/Campo_Grande': new Date(2012, 9, 21, 5, 0, 0, 0),
					  'America/Montevideo': new Date(2011, 9, 2, 3, 0, 0, 0),
					  'America/Sao_Paulo': new Date(2011, 9, 16, 5, 0, 0, 0),
					  'America/Los_Angeles': new Date(2011, 2, 13, 8, 0, 0, 0),
					  'America/Santa_Isabel': new Date(2011, 3, 5, 8, 0, 0, 0),
					  'America/Havana': new Date(2012, 2, 10, 2, 0, 0, 0),
					  'America/New_York': new Date(2012, 2, 10, 7, 0, 0, 0),
					  'Europe/Helsinki': new Date(2013, 2, 31, 5, 0, 0, 0),
					  'Pacific/Auckland': new Date(2011, 8, 26, 7, 0, 0, 0),
					  'America/Halifax': new Date(2011, 2, 13, 6, 0, 0, 0),
					  'America/Goose_Bay': new Date(2011, 2, 13, 2, 1, 0, 0),
					  'America/Miquelon': new Date(2011, 2, 13, 5, 0, 0, 0),
					  'America/Godthab': new Date(2011, 2, 27, 1, 0, 0, 0),
					  'Europe/Moscow': ru_pre_dst_change,
					  'Asia/Amman': new Date(2013, 2, 29, 1, 0, 0, 0),
					  'Asia/Beirut': new Date(2013, 2, 31, 2, 0, 0, 0),
					  'Asia/Damascus': new Date(2013, 3, 6, 2, 0, 0, 0),
					  'Asia/Jerusalem': new Date(2013, 2, 29, 5, 0, 0, 0),
					  'Asia/Yekaterinburg': ru_pre_dst_change,
					  'Asia/Omsk': ru_pre_dst_change,
					  'Asia/Krasnoyarsk': ru_pre_dst_change,
					  'Asia/Irkutsk': ru_pre_dst_change,
					  'Asia/Yakutsk': ru_pre_dst_change,
					  'Asia/Vladivostok': ru_pre_dst_change,
					  'Asia/Baku': new Date(2013, 2, 31, 4, 0, 0),
					  'Asia/Yerevan': new Date(2013, 2, 31, 3, 0, 0),
					  'Asia/Kamchatka': ru_pre_dst_change,
					  'Asia/Gaza': new Date(2010, 2, 27, 4, 0, 0),
					  'Africa/Cairo': new Date(2010, 4, 1, 3, 0, 0),
					  'Europe/Minsk': ru_pre_dst_change,
					  'Pacific/Apia': new Date(2010, 10, 1, 1, 0, 0, 0),
					  'Pacific/Fiji': new Date(2010, 11, 1, 0, 0, 0),
					  'Australia/Perth': new Date(2008, 10, 1, 1, 0, 0, 0)
				  };

				return dst_starts[tz_name];
			};

		return {
			determine: determine,
			date_is_dst: date_is_dst,
			dst_start_for: dst_start_for 
		};
	}());

	/**
	 * Simple object to perform ambiguity check and to return name of time zone.
	 */
	jstz.TimeZone = function (tz_name) {
		'use strict';
		  /**
		   * The keys in this object are timezones that we know may be ambiguous after
		   * a preliminary scan through the olson_tz object.
		   *
		   * The array of timezones to compare must be in the order that daylight savings
		   * starts for the regions.
		   */
		var AMBIGUITIES = {
				'America/Denver':       ['America/Denver', 'America/Mazatlan'],
				'America/Chicago':      ['America/Chicago', 'America/Mexico_City'],
				'America/Santiago':     ['America/Santiago', 'America/Asuncion', 'America/Campo_Grande'],
				'America/Montevideo':   ['America/Montevideo', 'America/Sao_Paulo'],
				'Asia/Beirut':          ['Asia/Amman', 'Asia/Jerusalem', 'Asia/Beirut', 'Europe/Helsinki','Asia/Damascus'],
				'Pacific/Auckland':     ['Pacific/Auckland', 'Pacific/Fiji'],
				'America/Los_Angeles':  ['America/Los_Angeles', 'America/Santa_Isabel'],
				'America/New_York':     ['America/Havana', 'America/New_York'],
				'America/Halifax':      ['America/Goose_Bay', 'America/Halifax'],
				'America/Godthab':      ['America/Miquelon', 'America/Godthab'],
				'Asia/Dubai':           ['Europe/Moscow'],
				'Asia/Dhaka':           ['Asia/Yekaterinburg'],
				'Asia/Jakarta':         ['Asia/Omsk'],
				'Asia/Shanghai':        ['Asia/Krasnoyarsk', 'Australia/Perth'],
				'Asia/Tokyo':           ['Asia/Irkutsk'],
				'Australia/Brisbane':   ['Asia/Yakutsk'],
				'Pacific/Noumea':       ['Asia/Vladivostok'],
				'Pacific/Tarawa':       ['Asia/Kamchatka', 'Pacific/Fiji'],
				'Pacific/Tongatapu':    ['Pacific/Apia'],
				'Asia/Baghdad':         ['Europe/Minsk'],
				'Asia/Baku':            ['Asia/Yerevan','Asia/Baku'],
				'Africa/Johannesburg':  ['Asia/Gaza', 'Africa/Cairo']
			},

			timezone_name = tz_name,

			/**
			 * Checks if a timezone has possible ambiguities. I.e timezones that are similar.
			 *
			 * For example, if the preliminary scan determines that we're in America/Denver.
			 * We double check here that we're really there and not in America/Mazatlan.
			 *
			 * This is done by checking known dates for when daylight savings start for different
			 * timezones during 2010 and 2011.
			 */
			ambiguity_check = function () {
				var ambiguity_list = AMBIGUITIES[timezone_name],
					length = ambiguity_list.length,
					i = 0,
					tz = ambiguity_list[0];

				for (; i < length; i += 1) {
					tz = ambiguity_list[i];

					if (jstz.date_is_dst(jstz.dst_start_for(tz))) {
						timezone_name = tz;
						return;
					}
				}
			},

			/**
			 * Checks if it is possible that the timezone is ambiguous.
			 */
			is_ambiguous = function () {
				return typeof (AMBIGUITIES[timezone_name]) !== 'undefined';
			};

		if (is_ambiguous()) {
			ambiguity_check();
		}

		return {
			name: function () {
				return timezone_name;
			}
		};
	};

	jstz.olson = {};

	/*
	 * The keys in this dictionary are comma separated as such:
	 *
	 * First the offset compared to UTC time in minutes.
	 *
	 * Then a flag which is 0 if the timezone does not take daylight savings into account and 1 if it
	 * does.
	 *
	 * Thirdly an optional 's' signifies that the timezone is in the southern hemisphere,
	 * only interesting for timezones with DST.
	 *
	 * The mapped arrays is used for constructing the jstz.TimeZone object from within
	 * jstz.determine_timezone();
	 */
	jstz.olson.timezones = {
		'-720,0'   : 'Pacific/Majuro',
		'-660,0'   : 'Pacific/Pago_Pago',
		'-600,1'   : 'America/Adak',
		'-600,0'   : 'Pacific/Honolulu',
		'-570,0'   : 'Pacific/Marquesas',
		'-540,0'   : 'Pacific/Gambier',
		'-540,1'   : 'America/Anchorage',
		'-480,1'   : 'America/Los_Angeles',
		'-480,0'   : 'Pacific/Pitcairn',
		'-420,0'   : 'America/Phoenix',
		'-420,1'   : 'America/Denver',
		'-360,0'   : 'America/Guatemala',
		'-360,1'   : 'America/Chicago',
		'-360,1,s' : 'Pacific/Easter',
		'-300,0'   : 'America/Bogota',
		'-300,1'   : 'America/New_York',
		'-270,0'   : 'America/Caracas',
		'-240,1'   : 'America/Halifax',
		'-240,0'   : 'America/Santo_Domingo',
		'-240,1,s' : 'America/Santiago',
		'-210,1'   : 'America/St_Johns',
		'-180,1'   : 'America/Godthab',
		'-180,0'   : 'America/Argentina/Buenos_Aires',
		'-180,1,s' : 'America/Montevideo',
		'-120,0'   : 'America/Noronha',
		'-120,1'   : 'America/Noronha',
		'-60,1'    : 'Atlantic/Azores',
		'-60,0'    : 'Atlantic/Cape_Verde',
		'0,0'      : 'UTC',
		'0,1'      : 'Europe/London',
		'60,1'     : 'Europe/Berlin',
		'60,0'     : 'Africa/Lagos',
		'60,1,s'   : 'Africa/Windhoek',
		'120,1'    : 'Asia/Beirut',
		'120,0'    : 'Africa/Johannesburg',
		'180,0'    : 'Asia/Baghdad',
		'180,1'    : 'Europe/Moscow',
		'210,1'    : 'Asia/Tehran',
		'240,0'    : 'Asia/Dubai',
		'240,1'    : 'Asia/Baku',
		'270,0'    : 'Asia/Kabul',
		'300,1'    : 'Asia/Yekaterinburg',
		'300,0'    : 'Asia/Karachi',
		'330,0'    : 'Asia/Kolkata',
		'345,0'    : 'Asia/Kathmandu',
		'360,0'    : 'Asia/Dhaka',
		'360,1'    : 'Asia/Omsk',
		'390,0'    : 'Asia/Rangoon',
		'420,1'    : 'Asia/Krasnoyarsk',
		'420,0'    : 'Asia/Jakarta',
		'480,0'    : 'Asia/Shanghai',
		'480,1'    : 'Asia/Irkutsk',
		'525,0'    : 'Australia/Eucla',
		'525,1,s'  : 'Australia/Eucla',
		'540,1'    : 'Asia/Yakutsk',
		'540,0'    : 'Asia/Tokyo',
		'570,0'    : 'Australia/Darwin',
		'570,1,s'  : 'Australia/Adelaide',
		'600,0'    : 'Australia/Brisbane',
		'600,1'    : 'Asia/Vladivostok',
		'600,1,s'  : 'Australia/Sydney',
		'630,1,s'  : 'Australia/Lord_Howe',
		'660,1'    : 'Asia/Kamchatka',
		'660,0'    : 'Pacific/Noumea',
		'690,0'    : 'Pacific/Norfolk',
		'720,1,s'  : 'Pacific/Auckland',
		'720,0'    : 'Pacific/Tarawa',
		'765,1,s'  : 'Pacific/Chatham',
		'780,0'    : 'Pacific/Tongatapu',
		'780,1,s'  : 'Pacific/Apia',
		'840,0'    : 'Pacific/Kiritimati'
	};

	if (typeof exports !== 'undefined') {
	  exports.jstz = jstz;
	} else {
	  root.jstz = jstz;
	}
})(this);
