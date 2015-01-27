$(document).ready(function() {

	var $wrapper = $('#wrapper');
	
	// Commit user input
	var commit = function() {
		if ('undefined'==typeof(commit.active)) commit.active = 0;
		commit.active++;
		if (commit.active<2) return;
		$commitform = $('#commitform');
		$source_rdf = $commitform.find('#source_rdf');
		$source_rdf.val('Loading ...');
		$modal = $commitform.closest('.modal');
		$modal.find('.book_title').html($commitform.find('#dest_title').val());
		$modal.modal('show');
		$modal.find('button').attr('disabled', 'disabled');
		$modal.find('button.cancel').click(function() {
			$modal.modal('hide');
			commit.active = 0;
		});
		$modal.find('button[type="submit"]').click(function() {
			$dest_id = $commitform.find('#dest_id').val()
			$dest_urn = $commitform.find('#dest_urn').val();
			$dest_url = $commitform.find('#dest_url').val().replace(/\/$/, "");
			$modal.rdfimporter({rdf:$commitform.data('rdf'),dest_urn:$dest_urn,dest_id:$dest_id,dest_url:$dest_url}, function() {
				var $this = $modal.find('button[type="submit"]');
				$this.button('finished');
				$this.unbind('click');
				$this.click(function() {
					$this.unbind('click');
					$this.button('reset');
					$modal.find('#progress').css('width', '0%');
					$modal.modal('hide');
				});
				commit.active = 0;
			});
		});
		if ($commitform.data('rdf')) {
			$source_rdf.val(JSON.stringify($commitform.data('rdf'), null, 1));
			commit.active = 0;
			$modal.find('button').removeAttr('disabled');
		} else {
			$.fn.rdfimporter('rdf', {url:$commitform.find('#source_url').val()}, function(rdf) {
				if ('undefined'==typeof(rdf) || !rdf) {
					$source_rdf.val('Could not retrieve source RDF-JSON.  Please try again.');
					return;
				}
				$source_rdf.val(JSON.stringify(rdf, null, 1));
				$commitform.data('rdf', rdf);
				commit.active = 0;
				$modal.find('button').removeAttr('disabled');
			});
		}
	}

	// Validate user input from url form
	$('#urlform').submit(function() {
		commit.active = 0;
		var $form = $(this);
		var $commitform = $('#commitform');
		$commitform.removeData('rdf');
		var $source_msg = $form.find('.source_msg');
		var $dest_msg = $form.find('.dest_msg');
		var source_url = $form.find('.source_url').val();
		var dest_url = getURLParameter('dest_url');
		$source_msg.html('Loading source book ...').parent().removeClass('alert-danger').addClass('alert-success').fadeIn();
		$dest_msg.html('Loading destination book ...').parent().removeClass('alert-danger').addClass('alert-success').fadeIn();
		$.fn.rdfimporter('book_rdf', {url:source_url}, function(rdf) {
			if ('undefined'==typeof(rdf) || !rdf) {
				$source_msg.html('<span class="glyphicon glyphicon-remove" aria-hidden="true"></span> Could not find source book!').parent().removeClass('alert-success').addClass('alert-danger');
				return;
			}
			var title = $.fn.rdfimporter('rdf_value',{rdf:rdf,p:'http://purl.org/dc/terms/title'});
			var urn = $.fn.rdfimporter('rdf_value',{rdf:rdf,p:'http://scalar.usc.edu/2012/01/scalar-ns#urn'});			
			$source_msg.html('<span class="glyphicon glyphicon-ok" aria-hidden="true"></span> Source book <b title="'+urn+'">'+title+'</b> found!');
			$commitform.find('#source_url').val(source_url);
			commit();
		});
		$.fn.rdfimporter('book_rdf', {url:dest_url}, function(rdf) {
			if ('undefined'==typeof(rdf) || !rdf) {
				$dest_msg.html('<span class="glyphicon glyphicon-remove" aria-hidden="true"></span> Could not find destination book!').parent().removeClass('alert-success').addClass('alert-danger');;
				return;
			}
			var title = $.fn.rdfimporter('rdf_value',{rdf:rdf,p:'http://purl.org/dc/terms/title'});
			var urn = $.fn.rdfimporter('rdf_value',{rdf:rdf,p:'http://scalar.usc.edu/2012/01/scalar-ns#urn'});
			$dest_msg.html('<span class="glyphicon glyphicon-ok" aria-hidden="true"></span> Destination book <b title="'+urn+'">'+title+'</b> found!');
			$commitform.find('#dest_url').val(dest_url);
			$commitform.find('#dest_urn').val(urn);
			$commitform.find('#dest_id').val($form.find('.dest_id').val());
			$commitform.find('#dest_title').val(title);
			commit();
		});		
		return false;
	});

	// Validate user input from rdf form
	$('#rdfform').submit(function() {
		commit.active = 0;
		var $form = $(this);
		var $commitform = $('#commitform');
		$commitform.removeData('rdf');
		var $source_msg = $form.find('.source_msg');
		var $dest_msg = $form.find('.dest_msg');
		var source_rdf = $form.find('.source_rdf').val();
		var dest_url = getURLParameter('dest_url');
		$source_msg.html('Loading source RDF ...').parent().removeClass('alert-danger').addClass('alert-success').fadeIn();
		$dest_msg.html('Loading destination book ...').parent().removeClass('alert-danger').addClass('alert-success').fadeIn();
		$.fn.rdfimporter('rdf', {rdf:source_rdf}, function(rdf) {
			if ('undefined'==typeof(rdf) || !rdf) {
				$source_msg.html('<span class="glyphicon glyphicon-remove" aria-hidden="true"></span> Invalid RDF-JSON!').parent().removeClass('alert-success').addClass('alert-danger');;
				return;
			}			
			$source_msg.html('<span class="glyphicon glyphicon-ok" aria-hidden="true"></span> Valid RDF-JSON!');
			$commitform.find('#source_rdf').val(JSON.stringify(rdf, null, 1));
			$commitform.data('rdf', rdf);
			commit();
		});
		$.fn.rdfimporter('book_rdf', {url:dest_url}, function(rdf) {
			if ('undefined'==typeof(rdf) || !rdf) {
				$dest_msg.html('<span class="glyphicon glyphicon-remove" aria-hidden="true"></span> Could not find destination book!').parent().removeClass('alert-success').addClass('alert-danger');;
				return;
			}
			var title = $.fn.rdfimporter('rdf_value',{rdf:rdf,p:'http://purl.org/dc/terms/title'});
			var urn = $.fn.rdfimporter('rdf_value',{rdf:rdf,p:'http://scalar.usc.edu/2012/01/scalar-ns#urn'});
			$dest_msg.html('<span class="glyphicon glyphicon-ok" aria-hidden="true"></span> Destination book <b title="'+urn+'">'+title+'</b> found!');
			$commitform.find('#dest_url').val(dest_url);
			$commitform.find('#dest_urn').val(urn);
			$commitform.find('#dest_id').val($form.find('.dest_id').val());
			$commitform.find('#dest_title').val(title);
			commit();
		});				
		return false;
	});	
	
});

function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
    );
}