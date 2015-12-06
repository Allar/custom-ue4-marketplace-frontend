global.request = (global.request === undefined) ? require('request') : global.request;
global.request = request.defaults({followRedirect: false, followAllRedirects: false});
global.fakeJar = (global.fakeJar === undefined) ? {} : global.fakeJar;

global.marketplace = {};
global.categories = {};

require('events').EventEmitter.prototype._maxListeners = 100;

var api = function () {};

api.prototype.skipLogin = function() {
	window.location.href="./marketplace.html";
}

api.prototype.updateFakeJar = function(set_cookie_array) {
	for (var i = 0; i < set_cookie_array.length; ++i) {
		var cookie_pair = set_cookie_array[i].split(';',1)[0].split('=');
		global.fakeJar[cookie_pair[0]] = cookie_pair[1];
		if(cookie_pair[1] == 'invalid') {
			delete global.fakeJar[cookie_pair[0]];
		}
	}
}

api.prototype.getFakeJarCookieString = function () {
	var cookieString = "";
	for(var key in global.fakeJar) {
    	cookieString += key + '=' + global.fakeJar[key] + '; ';
	}
	return cookieString;
}

api.prototype.rebuildLogin = function (body) {
	$('body').html($(body).find('form'));
	$('#rememberMeCheckContainer').remove();
	$('.resetPass').remove();
	
	$('#epic_username').removeAttr('oninput');
	$('#password').removeAttr('oninput');
	$('#password').removeAttr('oninput');
	$('#signIn').attr('onclick','api.doLogin()');
	
	$('form').append("<button id='skipLogin' onclick='api.skipLogin()'>Skip Logging In</button>");
}

api.prototype.getLogin = function () {
	var opts = {
		uri: 'https://accounts.unrealengine.com/login/doLogin',
	};
	
	request.get(opts, function (error, response, body) {
		module.exports.updateFakeJar(response.headers['set-cookie']);		
		module.exports.rebuildLogin(body);
	});
}

api.prototype.getTracked = function () {
	var opts = {
		uri: 'https://tracking.unrealengine.com/track.png',
		qs: { client_id: '43e2dea89b054198a703f6199bee6d5b' }		
	};
	
	request.get(opts, function (error, response, body) {
		module.exports.updateFakeJar(response.headers['set-cookie']);
	});
}

api.prototype.doLogin = function() {
	var opts = {
		uri: 'https://accounts.unrealengine.com/login/doLogin',
		form:$('form#loginForm').serializeObject(),
		headers: { Cookie:module.exports.getFakeJarCookieString(), 'Origin': 'allar_alternative_marketplace' },
		qs: { client_id: '43e2dea89b054198a703f6199bee6d5b' }
	};
	
	request.post(opts, function(error, response, body) {
		module.exports.updateFakeJar(response.headers['set-cookie']);
	
		if (response.statusCode == 400) // login failure
		{
			module.exports.rebuildLogin(body);
		} else if (response.statusCode == 302) // success
		{
			$('body').html('Authorizing...');
			module.exports.authorize();
		}
		else {
			console.log(response.statusCode);
		}
		
	});
}

// Kick off what appears to be an OAuth attempt but this seems to get all the SSO information needed without
// exchanging the resulting OAuth token. Perhaps oauth flow is meant for non-web clients i.e. games
// OAuth generally requires a 'state' field as well but its not needed here?
api.prototype.authorize = function () {	
	var opts = {
		uri: 'https://accounts.unrealengine.com/authorize/index',
		headers: { Cookie:module.exports.getFakeJarCookieString(), 'Origin': 'allar_alternative_marketplace' },
		qs: { client_id: '43e2dea89b054198a703f6199bee6d5b', response_type: 'code', forWidget: 'true' }
	};
	
	request.get(opts, function(error, response, body) {
		module.exports.updateFakeJar(response.headers['set-cookie']);
		
		if (response.statusCode == 200 && response.headers['access-control-expose-headers'] == 'X-EPIC-LOGIN-COMPLETE-REDIRECT') {
			var json = JSON.parse(body);
			var code = json.redirectURL.split('?code=')[1];
			$('body').html('Successfully Authorized! Performing Exchange...');
			module.exports.exchange(code);
		} else {
			$('body').html(JSON.stringify(response, null, ' '));
		}
	});
}

// I don't really know what this does, its supposed to exchange our OAuth code for a token but
// Epic's web login process doesn't require one. Maybe their web side has an incomplete OAuth process
// or simply doesn't use it? SSO information got from 'authorize' appears to be enough. Scary?
api.prototype.exchange = function (code) {
	var opts = {
		uri: 'https://www.unrealengine.com/exchange',
		headers: { Cookie:module.exports.getFakeJarCookieString() },
		qs: { code: code }
	};
	
	request.get(opts, function(error, response, body) {
		module.exports.updateFakeJar(response.headers['set-cookie']);
		
		if (response.statusCode == 302) {
			$('body').html('Successfully Completed Auth Chain!');
			window.location.href = "./marketplace.html";
		} else {
			$('body').html(JSON.stringify(response, null, ' '));
		}
	});
}

// Only exposed marketplace asset api I could find
// Grabs 25 assets for specificied category
// Also lists all available categories
// Takes function 'cb' with signature (json, path, finished)
// json: The json object Epic returned for that single fetch
// path: The category path that was fetched
// finished: bool whether that category is finished fetching
api.prototype.getAssetsInCategory = function(category, start, addToTable, cb) {
	var opts = {
		uri: 'https://www.unrealengine.com/assets/ajax-get-categories',
		form: {category: category, start: start},
		headers: { Cookie:module.exports.getFakeJarCookieString() },
	};
	
	request.post(opts, function(error, response, body) {
		module.exports.updateFakeJar(response.headers['set-cookie']);
		
		if (response.statusCode == 200) {
			var json = JSON.parse(body);
			var finished = false;
			if (addToTable == true) {
				
				// Add category definition if it doesn't exist (it should though)
				if (marketplace[json.categoryPath] === undefined) {
					marketplace[json.categoryPath] = { name: json.category.name };
				}
				
				// Add first set of assets to this category definition
				if (marketplace[json.categoryPath].assets === undefined) {
					marketplace[json.categoryPath].assets = json.assets;
				} else { // Add assets to category definition
					json.assets.forEach(function(v) {marketplace[json.categoryPath].assets.push(v);});
				}
				
				// If this is the first grab for assets of this category, kick off grabbing the rest
				if (start == 0) {
					marketplace[json.categoryPath].assetCount = json.assetCount;
					for (var i = 0; i < Math.floor((json.assetCount-1) / json.assetPerPage); ++i) {
						module.exports.getAssetsInCategory(json.categoryPath, (i+1)*json.assetPerPage, true, function (nextjson, nextpath, nextfinished) {
							cb(nextjson, nextpath, nextfinished);
						});	
					}
				}
				
				if (marketplace[json.categoryPath].assets.length == marketplace[json.categoryPath].assetCount) {
					console.log("Done getting assets for category: " + json.categoryPath);
					finished = true;
				}
			}
			cb(json, json.categoryPath, finished);
		} else {
			console.error(body);
		}
	});
}

api.prototype.getAllAssets = function() {
	global.fetching = true;
	// Grabbing environments will allow us to get a full list of categories
	module.exports.getAssetsInCategory('assets/environments', 0, false, function (json) {
		
		var categoriesLeft = json.categories.length;
		global.categories = json.categories;
				
		// Build Category List
		for (var i = 0; i < json.categories.length; ++i) {
			marketplace[json.categories[i].path] = { name: json.categories[i].name };
			module.exports.getAssetsInCategory(json.categories[i].path, 0, true, function (json, path, finished) { 
				if(finished) {
					categoriesLeft--;
					if (categoriesLeft == 0) {
						global.fetching = false;
					}
				}
			});
		}		
	});
	
}

module.exports = new api();