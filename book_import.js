// var source_url = 'http://scalar.usc.edu/dev/dev-book/index';
//   $source_url = 'http://localhost/scalar/cantaloupe-test/index';
// var destination_email = 'michaellynch628@gmail.com';
// var destination_url = 'http://localhost/scalar/test-book-transfer/index';
var source_url = '';
var destination_email = '';
var destination_url = '';
var destination_book_urn = '';
var data_req = '';
var relations = {
  'tag':{},
  'path':{},
  'reply':{},
  'anno':{}
};
var urns = {};
var post_queue = {};

$(function() {

  // On form submission using native source book
  $('#urlForm').on('submit', function(event) {
    event.preventDefault();
    
    destination_url = $('#urlDestinationBook').val();
    source_url = $('#urlSourceBook').val();
    destination_email = $('#urlEmail').val();
    data_req = source_url+'/rdf/instancesof/content?rec=1&format=json&callback=?';
    
    $.getJSON( data_req, function(source) {
      source_data = source;
      processBook();
    });
  });
  
  // On form submission using raw RDF
  $('#rdfForm').on('submit', function(event) {
    event.preventDefault();
    
    destination_url = $('#rdfDestinationBook').val();
    source_data = $('#rawRDF').val();
    destination_email = $('#rdfEmail').val();
    
    processBook();
  });
});

function processBook() {
  var attr_req = destination_url+'/rdf?format=json&callback=?';
  var add_to = destination_url+'/api/add';
  var relate_to = destination_url+'/api/relate';
  
  // get destination book urn
  $.getJSON(attr_req, function(attr) {
    $.each(attr, function(key,value) {
      var temp = value['http://scalar.usc.edu/2012/01/scalar-ns#urn'];
      if(temp !== undefined) {
        destination_book_urn = temp[0]['value'];
        //exit loop
        return false;
      }
    });
    if(destination_book_urn === '') {
      console.log('BOOK DOES NOT EXIST');
    }

    //process source data
    $.each(source_data, function(key,value) {

      // gather all book relations using old version numbers
      var res = key.match(/urn:scalar:([a-zA-Z]*?):([0-9]+?):([0-9]+)/);
      if(res !== null) {
        if(relations[res[1]][res[2]] === undefined){
          relations[res[1]][res[2]] = [res[3]];
        }
        else {
          relations[res[1]][res[2]].push(res[3]);
        }
      // process book pages
      } else if(value['http://www.w3.org/1999/02/22-rdf-syntax-ns#type']) {
        res = value['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'][0].value.match(/Media|Composite|Version/);
        if(res !== undefined) {
          if(res[0] != 'Version') {
            if(post_queue[key] === undefined) {
          	  post_queue[key] = {};
            }
          	post_queue[key].action = 'ADD';
          	post_queue[key].native = 'true';
          	post_queue[key]['scalar:urn'] = '';
          	post_queue[key].id = destination_email;
          	post_queue[key].api_key = '';
          	post_queue[key]['scalar:child_urn'] = destination_book_urn;
          	post_queue[key]['scalar:child_type'] = 'http://scalar.usc.edu/2012/01/scalar-ns#Book';
          	post_queue[key]['scalar:child_rel'] = 'page';
          	post_queue[key]['urn:scalar:book'] = destination_book_urn;
        		post_queue[key]['rdf:type'] = value['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'][0].value;
          } else {
            // Use page url as key to post_queue
            var k = key.match(/^(.*)\.[0-9]*$/)[1];

            if(post_queue[k] === undefined) {
          	  post_queue[k] = {};
            }
            var old_version_number = value['http://scalar.usc.edu/2012/01/scalar-ns#urn'][0].value.match(/[0-9]*$/)[0];

            // save old version number to create new relations
            if(urns[k]) {
              urns[k].old = old_version_number;
            } else {
              urns[k] = {'old':old_version_number};
            }
            
        		// Incomplete, must handle additional metadata
        		if(value['http://purl.org/dc/terms/title'] !== undefined) {
          		post_queue[k]['dcterms:title'] = value['http://purl.org/dc/terms/title'][0].value;
        		}
        		if(value['http://purl.org/dc/terms/description'] !== undefined) {
          		post_queue[k]['dcterms:description'] = value['http://purl.org/dc/terms/description'][0].value;
        		}
        		if(value['http://simile.mit.edu/2003/10/ontologies/artstor#url'] !== undefined) {
          		post_queue[k]['scalar:url'] = value['http://simile.mit.edu/2003/10/ontologies/artstor#url'][0].value;
        		}
        		if(value['http://rdfs.org/sioc/ns#content'] !== undefined) {
         		  post_queue[k]['sioc:content'] = value['http://rdfs.org/sioc/ns#content'][0].value;
        	  }
          }
        }
      }
    });
    
    // Process queue
    var post_count = 0;
    var total = 0;
		$.each(post_queue,function(key,value) {
		  total++;
  		$.post(add_to, value, function( data ) {
          post_count++;
          $.each(data, function(k,v) {
            var new_version_urn = v['http://scalar.usc.edu/2012/01/scalar-ns#urn'][0].value;

            // build relationships where old version number is key to new version urn
            urns[urns[key].old] = new_version_urn;
          });
          
          // once all post requests are processed, process relations
          if(post_count == total) {
            // do_connections();
          }
  		});
		});
  });
}

function do_connections(){
	var post = {};
	post['action'] = 'RELATE';
	post['native'] = 'true';
	post['id'] = 'destination_email';
	post['api_key'] = '';
	post['scalar:child_rel'] = 'annotated';
	post['scalar:fullname'] = '';
  
  $.each(relations, function(type, rel) {
    $.each(rel, function(body_ver, target_ver) {
  		post['scalar:child_urn']     = vid_urns[annot_info_array[j].video_id];
	    post['scalar:urn']           = annot_info_array[j].urn;
      
    });
  });
}