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
			relations: {
			  'tag':{},
			  'path':{},
			  'reply':{},
			  'anno':{}
			},
			queue: {},
			urn_map: {},
			ontologies: {
				'dc':'http://purl.org/dc/elements/1.1/',
				'dcterms':'http://purl.org/dc/terms/',
				'art':'http://simile.mit.edu/2003/10/ontologies/artstor#',
				'sioc':'http://rdfs.org/sioc/ns#',
				'sioctypes':'http://rdfs.org/sioc/types#',
				'ov':'http://open.vocab.org/terms/',
				'scalar':'http://scalar.usc.edu/2012/01/scalar-ns#'		
			}
	};

	var opts = {};

	var rdfimporter_methods = {
			
		init : function(options, callback) {
			opts = $.extend( {}, defaults, options );
			return this.each(function() {
				var $this = $(this);
				opts['$this'] = $this;
		        $.fn.rdfimporter('queue', options, function() {
		        	$progress = $this.find('#progress'); 
		        	$progress_text = $progress.find('span');
		        	$.fn.rdfimporter('pages', function(pagination, error_msg) {
		        		var progress = ((pagination.count/pagination.total)*100)+'%';
		        		$progress.css('width', progress);
		        		$progress_text.text(pagination.count + ' of '+pagination.total);
		        		if (pagination.error) $.fn.rdfimporter('error', {msg:error_msg});
		        		if (pagination.count==pagination.total) callback();
		        	});
		        });
			});	 
		},
		perms : function(options, callback) {
			var url = options.url.replace(/\/$/, "")+'/login_status';
			$.getJSON(url, function(status) {
				callback(status)
			}).fail(function() {
				callback({});
			});
		},
		book_rdf : function(options, callback) {
			var url = options.url.replace(/\/$/, "")+'/rdf?format=json&callback=?';
			$.getJSON(url, function(rdf) {
				for (var uri in rdf) break;  // First node
				if ('http://scalar.usc.edu/2012/01/scalar-ns#Book' != rdf[uri]['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'][0].value) {
					callback({err:'The returned RDF-JSON does not represent a Scalar book'});
					return;
				}
				callback({rdf:rdf[uri]});
			}).fail(function() {
			    callback({err:'The request to external RDF-JSON failed'});
			});
		},		
		rdf : function(options, callback) {
			// RDF-JSON string
			if ('undefined'!=typeof(options.rdf)) {
				var rdf = options.rdf;
				try {
					rdf = JSON.parse(rdf);
					$.fn.rdfimporter('valid_scalar_rdf',rdf);
				} catch (e) {	
					callback({err:e});
					return;
				}
				callback({rdf:rdf});
			// URL to RDF-JSON
			} else if ('undefined'!=typeof(options.url)) {
				var url = options.url.replace(/\/$/, "")+'/rdf/instancesof/content?rec=1&ref=1&format=json&callback=?';
			    $.getJSON( url, function(rdf) {
			    	callback({rdf:rdf});
			    }).fail(function() {
			        callback({err:'Failed to get external RDF-JSON'});
			    });			
			} else {
				callback({err:'Request was improperly formatted'});
			}
		},	
		queue : function(options, callback) {
			if ('function'==typeof(options)) callback = options;
			$.each(opts.rdf, function(key,value) {
	            // Value is a Relation
				var res = key.match(/urn:scalar:([a-zA-Z]*?):([0-9]+?):([0-9]+)/);
				if(res !== null) {
					if(opts.relations[res[1]][res[2]] === undefined){
						opts.relations[res[1]][res[2]] = [res[3]];
					}
					else {
						opts.relations[res[1]][res[2]].push(res[3]);
					}
				} else {
					var entry_type = $.fn.rdfimporter('rdf_value',{rdf:value,p:'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'});
					if(entry_type !== null) {
						// Value is a Page
						if(entry_type.match(/Media|Composite/) !== null) {
							if(opts.queue[key] === undefined) {
								opts.queue[key] = {};
							}
							// Required API handshake fields
							opts.queue[key].action = 'ADD';
							opts.queue[key].native = 'true';
							opts.queue[key]['scalar:urn'] = '';
							opts.queue[key].id = opts.dest_id;
							opts.queue[key].api_key = '';
							opts.queue[key]['scalar:child_urn'] = opts.dest_urn;
							opts.queue[key]['scalar:child_type'] = 'http://scalar.usc.edu/2012/01/scalar-ns#Book';
							opts.queue[key]['scalar:child_rel'] = 'page';
							opts.queue[key]['urn:scalar:book'] = opts.dest_urn;
							opts.queue[key]['rdf:type'] = entry_type;
							// Extrapolated page fields
							opts.queue[key]['scalar:slug'] = key.substr(key.lastIndexOf('/')+1); // Orig author might have a multi-segmented URL slug, but no good way to determine that if key is coming from cut-and-paste
							opts.queue[key]['scalar:thumbnail'] = $.fn.rdfimporter('rdf_value',{rdf:value,p:'http://simile.mit.edu/2003/10/ontologies/artstor#thumbnail'});
						// Value is a Version
						} else if(entry_type.match(/Version/) !== null) {
				            // Use page url as key to the opts.queue
				            var k = key.match(/^(.*)\.[0-9]*$/)[1];
				            // Init queue if doesn't exist
				            if(opts.queue[k] === undefined) {
				            	opts.queue[k] = {};
				            }
				            // Save old version number to create new relations
				            var old_version_number = $.fn.rdfimporter('rdf_value',{rdf:value,p:'http://scalar.usc.edu/2012/01/scalar-ns#urn'}).match(/[0-9]*$/)[0];
				            if(opts.urn_map[k]) {
				            	opts.urn_map[k].old = old_version_number;
				            } else {
				            	opts.urn_map[k] = {old:old_version_number};
				            }
				            // Extrapolated version fields
				            opts.queue[k]['scalar:url'] = $.fn.rdfimporter('rdf_value',{rdf:value,p:'http://simile.mit.edu/2003/10/ontologies/artstor#url'});
				            // All other fields (including title, description, and additional metadata)
				            var disallowed = ['art:url'];  // Items covered earlier
				            //console.log(value);
				            for (var p in value) {
				            	var pnode = $.fn.rdfimporter('pnode',p);
				            	if (null==pnode || -1!=disallowed.indexOf(pnode)) continue;
				            	opts.queue[k][pnode] = $.fn.rdfimporter('rdf_values',{rdf:value,p:p,collapse:true});
				            }
				        }
				    }
				}
			});		
			console.log(opts.queue);
			callback();
		},
		pages : function(options, callback) {
			if ('function'==typeof(options)) callback = options;
			var page_count = 0;
			var page_total = 0;
			$.each(opts.queue,function(key,value) {
				page_total++;
				var url = opts.dest_url+'/api/add';
				$.post(url, value, function( page_data ) {
					if ('object'!=typeof(page_data)) return;
					$.each(page_data, function(k,v) {
						// TODO
						var new_version_urn = $.fn.rdfimporter('rdf_value',{rdf:v,p:'http://scalar.usc.edu/2012/01/scalar-ns#urn'});
                        // build relationships where old version number is key to new version urn
						opts.urn_map[opts.urn_map[key].old] = new_version_urn;
					});
				}).always(function(err) {
					page_count++;
					var msg = '';
					if ('object'!=typeof(err)) {
						var msg = 'URL isn\'t a Scalar Save API URL ['+url+'] for "'+value['dcterms:title']+'"';
					} else if ('error'==err.statusText) {
						var msg = 'There was an error resolving the Save API URL ['+url+'] for "'+value['dcterms:title']+'"';
					}
					callback({dest_url:dest_url,url:url,count:page_count,total:page_total,error:((msg.length)?true:false)}, msg);
				});
				opts.queue = {};
			});
		},
		relations : function(callback) {
			var relate_count = 0;
			var relate_total = 0;
			var url = opts.dest_url+'/api/relate';
			var post = {};
			post['action'] = 'RELATE';
			post['native'] = 'true';
			post['id'] = opts.dest_id;
			post['api_key'] = '';
			post['scalar:child_rel'] = 'annotated';
			post['scalar:fullname'] = '';
  
			$.each(opts.relations, function(type, rel) {
				$.each(rel, function(body_ver, target_ver) {
					relate_total++;
					post['scalar:child_urn'] = opts.urn_map[target_ver];
					post['scalar:urn']  = opts.urn_map[body_ver];
					$.post(url, post, function( relation_data ) {
						relate_count++;
                        // once all relations are processed, execute callback
						if(relate_count == relate_total) {
							callback();
						}
					});
				});
			});
			opts.urn_map = {}
			opts.relations = {};
		},
		error : function(options) {
			$progress = opts['$this'].find('#progress'); 
			$progress_log = $progress.closest('.row').find('#progress_log');
			$progress.addClass('progress-bar-danger');
			if ($progress_log.is(':hidden')) $progress_log.fadeIn();
			$progress_log.append(options.msg+"<br />");
		},
		pnode : function(_uri) {
			for (var prefix in defaults.ontologies) {
				var uri = defaults.ontologies[prefix];
				if (_uri.substr(0,uri.length)==uri) {
					return _uri.replace(uri,prefix+':');
				}
			}
			return null;
		},
		valid_scalar_rdf : function(rdf) {
			// Check RDF-JSON string to make sure it's styled in valid Scalar format
			var content = 0;
			var versions = 0;
			for (var uri in rdf) {
				if ('undefined'!=typeof(rdf[uri]["http://purl.org/dc/terms/hasVersion"])) {
					content++;
					continue;
				} else if ('undefined'!=typeof(rdf[uri]["http://purl.org/dc/terms/isVersionOf"])) {
					versions++;
					continue;
				}
				throw "A node is present that doesn't have a dcterms:hasVersion or a dcterms:isVersionOf";
			}	
			if (content != versions) throw "Number of content nodes does not match number of verion nodes";
			return true;
		},		
		rdf_values : function(options) {
			var rdf = options.rdf;
			var p = options.p;
			if('undefined' == typeof(rdf[p]) || !rdf[p]) return null;
			var values = [];
			for (var j = 0; j < rdf[p].length; j++) {
				values.push(rdf[p][j].value);
			}
			if (options.collapse) {
				if (1==values.length) return values[0];
			}
			return values;
		},	
		rdf_value : function(options) {
			var rdf = options.rdf;
			var p = options.p;
			if('undefined' == typeof(rdf[p]) || !rdf[p]) return null;
			var value = rdf[p][0].value;
			return value;
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
