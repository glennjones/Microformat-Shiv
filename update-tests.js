/*!
	unpdate-test.js
	run  $node unpdate-test.js
	Downloads github repo of microfomats tests then:
	* updates mocha tests
	* updates data.js file for testrunner
	
	Copyright (C) 2015 Glenn Jones. All Rights Reserved.
	MIT License: https://raw.github.com/glennjones/microformat-shiv/master/license.txt
	*/


var path			= require('path'),
	request 		= require('request'),
	fs 				= require('fs-extra'),
	download 		= require('download-github-repo');


var repo = 'glennjones/tests',  // glennjones/tests or microformats/tests
	tempDir = path.resolve(__dirname,'temp-tests'),
	testDir = 'standards-tests',
	testDirResolve = path.resolve(__dirname,'test', testDir),
	clientTestPagePath = path.resolve(__dirname,'test/mocha-tests-client.html'),
	serverTestPagePath = path.resolve(__dirname,'test/mocha-tests-server.html'),
	testJSPath = path.resolve(__dirname,'test/javascript/data.js'),
	livingStandardPath = path.resolve(__dirname,'lib/living-standard.js');


// write living standard date
writeLivingStandard( repo, livingStandardPath )


download(repo, tempDir, function(err, data){
	clearDirectory(function(err){
		if(err){
			console.err(err);
		}else{
			var fileList = getFileList(path.resolve(tempDir,'tests')),
				testStructure  = getGetTestStructure( fileList ),
				version = getTestSuiteVersion(),
				relativeTestPaths = [],
				dataCollection = [];
			
			
			testStructure.forEach(function(item){
				getDataFromFiles( item, function(err, data){
					if(data){
						
						// build mocha tests
						var test = buildTest( data, item, version, repo ),
							filePath = shortenFilePath( item[0] + '-' + item[1] + '-' + item[2].replace('.json','') + '.js' );
							
						relativeTestPaths.push( filePath );
						writeFile(path.resolve(testDirResolve,filePath), test);
						
						// add to data collection
						data.name = shortenFilePath( item[0] + '-' + item[1] + '-' + item[2].replace('.json',''));
						dataCollection.push( data );
						
						
						console.log(path.resolve(testDirResolve,filePath));
						
						
					}else{
						console.log(err);
					}
				});
			});
			
			// build client and server test pages
			writeFile(clientTestPagePath, buildTestPage( relativeTestPaths, version, true));
			writeFile(serverTestPagePath, buildTestPage( relativeTestPaths, version, false));
			
			// build json data for testrunner
			writeFile(testJSPath, 'var testData = ' + JSON.stringify({ 
				date: new Date(), 
				repo: repo, 
				version: version, 
				data: dataCollection
			}));
			
			
			fs.removeSync(tempDir);
			console.log('done');
		}
	});
});


// get a list of file paths
function getFileList (dir, files_){
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files){
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()){
            getFileList(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}




// get format directories
function getGetTestStructure( fileList ){
	var out = [];
	fileList.forEach(function(item){
		item = item.replace( path.resolve(tempDir,'tests') + '/', '' );
		if(item.indexOf('.html') === -1){
			if(item.indexOf('/') > -1){
				var items = item.split('/');
				out.push(items);	
			}
		}
	});
	return out;
}


// gets the test suite version
function getTestSuiteVersion(){
	var pack = fs.readFileSync(path.resolve(tempDir,'package.json'), {encoding: 'utf8'});
	if(pack){
		pack = JSON.parse(pack)
		if(pack && pack.version){
			return pack.version;
		}
	}
	return '';
}



function getDataFromFiles( testStructure, callback ){
	var jsonFile = 'tests/' + testStructure[0] + '/' + testStructure[1] + '/' + testStructure[2],
		htmlFile = jsonFile.replace('.json','.html'),
		json = fs.readFileSync(path.resolve(tempDir,jsonFile), {encoding: 'utf8'}),
		html = fs.readFileSync(path.resolve(tempDir,htmlFile), {encoding: 'utf8'});
	
	if(json && html){
		callback(null, { 'json':json, 'html': html});
	}else{
		callback('error loading files: ' + jsonFile, null);
	}
}
	

function buildTest( testData, testStructure, version, repo ){
	var out = '',
	 	fileName = testStructure[0] + '/' + testStructure[1] + '/' + testStructure[2].replace('.json',''),
	 	date = new Date().toString();
	
	
	out += '/*\r\nMicroformats Test Suite - Downloaded from github repo: ' + repo + ' version v' + version + ' \r\n';
	out += 'Mocha integration test from: ' + fileName + '\r\nThe test was built on ' + date + '\r\n*/\r\n\r\n';
	out += "assert = chai.assert;\r\n\r\n\r\n";
	
	out += "describe('" + testStructure[1]  + "', function() {\r\n";
    out += "   var htmlFragment = " + JSON.stringify(testData.html) + ";\r\n";
   	//out += "   var found = helper.parseHTML(htmlFragment,'http://example.com/');\r\n";
   	out += "   var expected = " + JSON.stringify(JSON.parse(testData.json)) + ";\r\n\r\n";
	out += "   it('" + testStructure[2].replace('.json','')  + "', function(){\r\n";   
	out += "       var doc, node, options, parser, found;\r\n";
    out += "       doc = document.implementation.createHTMLDocument('New Document');\r\n";
    out += "       node =  document.createElement('div');\r\n";
    out += "       node.innerHTML = htmlFragment;\r\n";
    out += "       doc.body.appendChild(node);\r\n";    
    out += "       options ={\r\n";
    out += "       		'document': doc,\r\n";
    out += "       		'node': node,\r\n";
    out += "       		'baseUrl': 'http://example.com'\r\n";
    out += "       };\r\n";
    out += "       parser = new Modules.Parser();\r\n";
    out += "       found = parser.get( options );\r\n";
	out += "       assert.deepEqual(found, expected);\r\n";   
	out += "   });\r\n";
	out += "});\r\n";
	return out;
}


 function buildTestPage( relativeTestPaths, version, client ){
	var date = new Date().toString(),
		out = '';
	out += '<html><head><title>Mocha</title>\r\n';
    out += '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\r\n';
    out += '<link rel="stylesheet" href="../node_modules/mocha/mocha.css" />\r\n';
	out += '<link rel="stylesheet" href="css/mocha-custom.css" />\r\n\r\n';
	
	out += '<script src="../node_modules/chai/chai.js"></script>\r\n';
    out += '<script src="../node_modules/mocha/mocha.js"></script>\r\n\r\n';
	
	out += '<!--  loads Modules to help with debugging ie windows.Modules -->\r\n';
    out += '<script data-cover src="../lib/parser.js"></script>\r\n';
	out += '<script data-cover src="../lib/parser-implied.js"></script>\r\n';
	out += '<script data-cover src="../lib/parser-includes.js"></script>\r\n';
	out += '<script data-cover src="../lib/parser-rels.js"></script>\r\n';
    out += '<script data-cover src="../lib/utilities.js"></script>\r\n';
    out += '<script src="../lib/domparser.js"></script>\r\n';
    out += '<script data-cover src="../lib/domutils.js"></script>\r\n';
    out += '<script data-cover src="../lib/isodate.js"></script>\r\n';
    out += '<script data-cover src="../lib/dates.js"></script>\r\n';
    out += '<script data-cover src="../lib/text.js"></script>\r\n';
    out += '<script data-cover src="../lib/html.js"></script>\r\n';
    out += '<script data-cover src="../lib/maps.js"></script>\r\n\r\n';
	
    out += '<script data-cover src="../lib/maps/h-adr.js"></script>\r\n';
    out += '<script data-cover src="../lib/maps/h-card.js"></script>\r\n';
    out += '<script data-cover src="../lib/maps/h-entry.js"></script>\r\n';
    out += '<script data-cover src="../lib/maps/h-event.js"></script>\r\n';
    out += '<script data-cover src="../lib/maps/h-geo.js"></script>\r\n';
    out += '<script data-cover src="../lib/maps/h-item.js"></script>\r\n';
    out += '<script data-cover src="../lib/maps/h-listing.js"></script>\r\n';
    out += '<script data-cover src="../lib/maps/h-news.js"></script>\r\n';
    out += '<script data-cover src="../lib/maps/h-org.js"></script>\r\n';
    out += '<script data-cover src="../lib/maps/h-product.js"></script>\r\n';
    out += '<script data-cover src="../lib/maps/h-recipe.js"></script>\r\n';
    out += '<script data-cover src="../lib/maps/h-resume.js"></script>\r\n';
    out += '<script data-cover src="../lib/maps/h-review-aggregate.js"></script>\r\n';
    out += '<script data-cover src="../lib/maps/h-review.js"></script>\r\n';
    out += '<script data-cover src="../lib/maps/rel.js"></script>\r\n\r\n';
	
	
	out += '<!-- loads Microformats the full umd version ie windows.Microformat -->\r\n';
	out += '<script src="microformat-shiv.js"></script>\r\n\r\n';
	
	
    out += '<script src="javascript/helper.js"></script>\r\n';
    out += '<script>mocha.setup("bdd")</script>\r\n';
	
	relativeTestPaths.forEach(function(item){
		out += '<script src="' + testDir + '/' + item + '"></script>\r\n';
	});
	
	out += '\r\n';
	out += '<script src="unit-tests/dates-test.js"></script>\r\n';
	out += '<script src="unit-tests/isodate-test.js"></script>\r\n';
	out += '<script src="unit-tests/domutils-test.js"></script>\r\n';
	out += '<script src="unit-tests/html-test.js"></script>\r\n';
	out += '<script src="unit-tests/text-test.js"></script>\r\n';
	out += '<script src="unit-tests/utilities-test.js"></script>\r\n';
	out += '<script src="unit-tests/parser-get-test.js"></script>\r\n';
	out += '<script src="unit-tests/parser-count-test.js"></script>\r\n\r\n';
	
	
	
	// do not load blank for server test page it will be injected 
	if(client === true){
		out += '\r\n<script src="../node_modules/poncho/node_modules/blanket/dist/qunit/blanket.min.js"> </script>\r\n';
    	out += '<script src="../node_modules/poncho/node_modules/blanket/src/adapters/mocha-blanket.js"></script>\r\n\r\n';
	}
	

    //out += '<script>window.onload= function(){\r\n';
	//out += 'if (window.mochaPhantomJS) {\r\nmochaPhantomJS.run();\r\n}else{\r\n mocha.run();\r\n}\r\n';
	//out += '};</script>\r\n';
    //out += '</head><body>\r\n';
    out += '<h3>Microformats test suite - v' + version + '</h3>\r\n';
	out += '<p>Mocha tests built on ' + date + '. Downloaded from github repo: ' + repo + ' version v' + version + '</p>\r\n';
    out += '<div id="mocha"></div>\r\n';
    out += '</body></html>\r\n';	
	return out;
 }


 
function shortenFilePath( filepath ){
	return 'mf-' + filepath.replace('microformats-mixed','mixed').replace('microformats-v1','v1').replace('microformats-v2','v2');
}


// delete all files with prefix mf- from current test directory
function clearDirectory( callback ){
	var fileList = getFileList (testDirResolve);
	fileList.forEach(function(filePath){
		if(filePath.indexOf('/mf-') > -1){
			fs.removeSync(filePath);
		}
	});

	callback(null);
}


// write a file
function writeFile(path, content){
	fs.writeFile(path, content, 'utf8', function(err) {
		if(err) {
			console.log(err);
		} else {
			console.log('The file: ' + path + ' was saved');
		}
	}); 
}


function getLastCommitDate( repo, callback ){
	
	var options = {
	  url: 'https://api.github.com/repos/' + repo + '/commits?per_page=1',
	  headers: {
	    'User-Agent': 'request'
	  }
	};
	
	request(options, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		var date = null,
			json = JSON.parse(body);
			if(json && json.length && json[0].commit && json[0].commit.author ){
				date = json[0].commit.author.date;
			}
	    callback(null, date);
	  }else{
		  console.log(error, response, body);
		  callback('fail to get last commit date', null); 
	  }
	});
}



function writeLivingStandard( repo, livingStandardPath ){
	getLastCommitDate( repo, function( err, date ){
		var out = '	modules.livingStandard = \'' + date + '\';';
		writeFile(livingStandardPath, out);
	});
}