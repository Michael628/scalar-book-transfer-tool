<html>
	<head>

		<script src="//code.jquery.com/jquery-1.11.0.min.js"></script>
    <script src="bootstrap/js/bootstrap.min.js"></script>
		<script src="book_import.js" ></script>
		<link href="bootstrap/css/bootstrap.min.css" rel="stylesheet">
	</head>
	<body>
  	<div class="container">
    	<div class="row">
  	    <div class="col-md-9 center-block">
        	<div role="tabpanel" data-example-id="togglable-tabs">
            <ul id="myTab" class="nav nav-tabs" role="tablist">
              <li role="presentation" class="active"><a href="#url" id="url-tab" role="tab" data-toggle="tab" aria-controls="url" aria-expanded="true">Book Url</a></li>
              <li role="presentation"><a href="#rdf" role="tab" id="rdf-tab" data-toggle="tab" aria-controls="rdf">Paste RDF</a></li>
            </ul>
            <div id="tabContent" class="tab-content">
              <div role="tabpanel" class="tab-pane fade in active" id="url" aria-labelledby="url-tab">
                <form id="urlForm">
                  <div class="form-group">
                    <label for="urlSourceBook">Source book URL</label>
                    <input type="text" class="form-control" id="urlSourceBook" placeholder="Enter source URL" required>
                  </div>
                  <div class="form-group">
                    <label for="urlEmail">Destination email address</label>
                    <input type="email" class="form-control" id="urlEmail" placeholder="Enter email" required>
                  </div>
                  <div class="form-group">
                    <label for="urlDestinationBook">Destination book URL</label>
                    <input type="text" class="form-control" id="urlDestinationBook" placeholder="Enter destination URL" required>
                  </div>
                  <button type="submit" class="btn btn-default">Submit</button>
                </form>
              </div>
              <div role="tabpanel" class="tab-pane fade" id="rdf" aria-labelledby="rdf-tab">
                <form id="rdfForm">
                  <div class="form-group">
                    <label for="rdfEmail">Destination email address</label>
                    <input type="email" class="form-control" id="rdfEmail" placeholder="Enter email" required>
                  </div>
                  <div class="form-group">
                    <label for="rdfDestinationBook">Destination book URL</label>
                    <input type="text" class="form-control" id="rdfDestinationBook" placeholder="Enter destination URL" required>
                  </div>
                  <div class="form-group">
                    <label for="rawRDF">Source Book RDF</label>
                    <textarea class="form-control" id="rawRDF" rows="5" placeholder="Paste book RDF" required></textarea>
                  </div>
        <!--          <div class="form-group">
                    <label for="exampleInputFile">Book</label>
                    <input type="file" id="exampleInputFile">
                    <p class="help-block">Example block-level help text here.</p>
                  </div> -->
                  <button type="submit" class="btn btn-default">Submit</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
	</body>
</html>
