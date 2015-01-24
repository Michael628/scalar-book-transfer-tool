/**
 * Scalar    
 * Copyright 2013 The Alliance for Networking Visual Culture.
 * http://scalar.usc.edu/scalar
 * Alliance4NVC@gmail.com
 *
 * Licensed under the Educational Community License, Version 2.0 
 * (the "License"); you may not use this file except in compliance 
 * with the License. You may obtain a copy of the License at
 * 
 * http://www.osedu.org/licenses/ECL-2.0 
 * 
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS"
 * BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.       
 */  

/**
 * @projectDescription  Import RDF-JSON to a Scalar book
 * @author              Michael Lynch
 * @author				Craig Dietrich
 * @version             1.0
 */

(function($) {

	var defaults = {
			dest_url: '',
			relations: {
			  'tag':{},
			  'path':{},
			  'reply':{},
			  'anno':{}
			}		
	};
	var opts = {};
	
	var rdfimporter_methods = {
			
		init : function(options) {
			opts = $.extend( {}, defaults, options );
			return this.each(function() {
				var $this = $(this);
				opts['$this'] = $this;
			});	 
		},
		book_rdf : function(options, callback) {
			var url = options.url.replace(/\/$/, "")+'/rdf?format=json&callback=?';
			$.getJSON(url, function(rdf) {
				for (var uri in rdf) break;  // First node
				if ('http://scalar.usc.edu/2012/01/scalar-ns#Book' != rdf[uri]['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'][0].value) {
					callback();
					return;
				}
				callback(rdf[uri]);
			});
		},		
		rdf : function(options, callback) {
			// RDF-JSON string
			if ('undefined'!=typeof(options.rdf)) {
				var rdf = options.rdf;
				try {
					rdf = JSON.parse(rdf);
				} catch (e) {
					callback();
					return;
				}
				callback(rdf);
			// URL to RDF-JSON
			} else if ('undefined'!=typeof(options.url)) {
				var url = options.url+'/rdf/instancesof/content?rec=1&ref=1&format=json&callback=?';
			    $.getJSON( url, function(rdf) {
			    	callback(rdf);
			    }).fail(function() {
			        callback();
			    });			
			} else {
				callback();
			}
		},	
		rdf_value : function(options) {
			var rdf = options.rdf;
			var p = options.p;
			var value = rdf[p][0].value;
			return value;
		},		
		import : function(options, callback) {

		}
	};

	$.fn.rdfimporter = function(methodOrOptions) {		

		if ( rdfimporter_methods[methodOrOptions] ) {
			return rdfimporter_methods[ methodOrOptions ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof methodOrOptions === 'object' || ! methodOrOptions ) {
			// Default to "init"
			return rdfimporter_methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  methodOrOptions + ' does not exist on jQuery.rdfimporter' );
		}    
		
	};
	
})(jQuery);
