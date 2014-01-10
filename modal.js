(function () {
	var $notes = $('.dly-notes');
	var $body = $('body');
	var $pops = $notes.find('.popup-miniform');
	var saveCallback = null;
	var lastPopup = null;
	$notes.on('click', 'a.pop-open', function(e) {
		e.preventDefault();
		var $icon = $(this);
		var $wrp = $notes.find('.'+$icon.data('target')+'-pop');
		var $pop = $wrp.find('.popup-miniform');
		$pops.hide();
		//re-click on same icon, don't open the popdown again
		if (lastPopup && lastPopup === $pop[0]) {
			lastPopup = null;
			return;
		}
		lastPopup = $pop[0];
		var model = $icon.data('model');
		$pop.css('top', $icon.position().top + 26);
		$pop.css('left', $icon.position().left - 19);
		if (model && model.length) {
			$pop.find('.fg-event.not-first').remove();
			$pop.find('.fg-event').fill(model);
			$pop.find('.fg-exercise').each(function (i) {
				$(this).fill(model[i].exercises);
			});
		}
		$pop.show();
	});
	$notes.on('click', 'a.test-open', function () {
		var $self = $(this);
		$self.attr('href', $self.data('href')+$self.siblings('.fv-id').val());
	});
	
	function modalOpen() {
		var $icon = $(this);
		$pops.hide();
		var $body = $('body');
		var $wrp = $notes.find('.'+$icon.data('target')+'-wrapper');
		$body.modal($wrp.html(), true);
		var $popup = $body.children('.newPopup:visible');
		$popup.find(':input').addWidgets();
		var model = $icon.closest('.fm-model').data('model');
		if (model && model.id) {
			$popup.fill(model);
			$popup.find('.delete').show();
		} else
			$popup.find('.date').val($icon.closest('.day').data('date-formatted') || spl.user.today);
		
		$popup.find('.close-popup').hide();
		$popup.find('.close-extra').click(function(e) {
			$popup.find('.close-popup').click();
		});
		$popup.find('.ux-save-event').click(function(e) {
			var $btn = $(this);
			if ($btn.hasClass('disabled'))
				return false;
			if ($btn.hasClass('delete')) {
				if (!confirm('Are you sure?')) return false;
				$btn.siblings('[name="delete"]').prop('disabled', false);
			}
			$btn.addClass('disabled').text($btn.data('loading'));
			var $form = $popup.find('form');
			$.post($form.attr('action'), $form.serialize(), function(data) {
				$popup.find('.close-popup').click();
				if (saveCallback) saveCallback(data);
				else spl.graph.reload(null, function() { /* TODO open overview popup here? */ });
			});
		});
	}
	
	$notes.on('click', 'a.modal-open', function(e) {
		e.preventDefault();
		modalOpen.call(this);
	});
	
	$(document).on('click', '.day .action.modal-open', function (e) {
		e.preventDefault();
		modalOpen.call(this);
	});
	
	$(document).on('click', function(e) {
		var $target = $(e.target);
		var $inside_popup = $target.closest('.popup-miniform').length > 0;
		if ($target.closest('.pop-open').length === 0 && !$inside_popup) {
			$pops.hide();
		}
		e.stopPropagation();
	});
	
	$(document).on('keyup', function(e) {
		if (e.which !== 27)
		return false;
		var $modal = $('body').children('.newPopup:visible');
		if ($body.children('.datepicker').filter(':visible').length > 0) {
			$body.children('.datepicker').hide();
			
		//	} else if ($modal.length > 0) {
			//		$modal.find('.close-popup').click();
		} else if ($modal.length === 0 && $pops.filter(':visible').length > 0) {
			$pops.hide();
		}
	});
})();
