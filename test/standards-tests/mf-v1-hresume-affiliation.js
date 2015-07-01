/*
Microformats Test Suite - Downloaded from github repo: glennjones/tests version v0.1.18 
Mocha integration test from: microformats-v1/hresume/affiliation
The test was built on Wed Jul 01 2015 12:00:56 GMT+0100 (BST)
*/

assert = chai.assert;


describe('hresume', function() {
   var htmlFragment = "<div class=\"hresume\">\n    <p>\n        <span class=\"contact vcard\"><span class=\"fn\">Tim Berners-Lee</span></span>, \n        <span class=\"summary\">invented the World Wide Web</span>.\n    </p>\n    Belongs to following groups:\n    <p>   \n        <a class=\"affiliation vcard\" href=\"http://www.w3.org/\">\n            <img class=\"fn photo\" alt=\"W3C\" src=\"http://www.w3.org/Icons/WWW/w3c_home_nb.png\" />\n        </a>\n    </p>   \n</div>";
   var expected = {"items":[{"type":["h-resume"],"properties":{"contact":[{"value":"Tim Berners-Lee","type":["h-card"],"properties":{"name":["Tim Berners-Lee"]}}],"summary":["invented the World Wide Web"],"affiliation":[{"type":["h-card"],"properties":{"name":["W3C"],"photo":["http://www.w3.org/Icons/WWW/w3c_home_nb.png"],"url":["http://www.w3.org/"]}}],"name":["Tim Berners-Lee, \n        invented the World Wide Web.\n    \n    Belongs to following groups:"]}}],"rels":{},"rel-urls":{}};

   it('affiliation', function(){
       var doc, node, options, parser, found;
       doc = document.implementation.createHTMLDocument('New Document');
       node =  document.createElement('div');
       node.innerHTML = htmlFragment;
       doc.body.appendChild(node);
       options ={
       		'document': doc,
       		'node': node,
       		'baseUrl': 'http://example.com'
       };
       parser = new Modules.Parser();
       found = parser.get( options );
       assert.deepEqual(found, expected);
   });
});
