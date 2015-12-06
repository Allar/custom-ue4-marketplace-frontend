global.request = (global.request === undefined) ? require('request') : global.request;

// Get the current window
global.win = global.window.nwDispatcher.requireNwGui().Window.get();

global.fakeJar = {};

var api = function () {};

api.prototype.getSSOSession = function () {
	
	var opts = {
		uri: 'https://accounts.unrealengine.com/login/doLogin',
	};
	
	//global.jar.setCookie(request.cookie("EPIC_SSO_SESSION=1azvl2lqqgvug1sh96q5mkqokj;Path=/;Domain=.unrealengine.com;Secure;HttpOnly", ".unrealengine.com"));
	
	request.get(opts, function (error, response, body) {
		//if (response.headers['set-cookie'])
		for (var i = 0; i < response.headers['set-cookie'].length; ++i) {
			var cookie_pair = response.headers['set-cookie'][i].split(';',1)[0].split('=');
			fakeJar[cookie_pair[0]] = cookie_pair[1];
		}
		
		
		
		console.log(fakeJar);
		
	});
}

api.prototype.doLogin = function() {
	var username = window.document.getElementById('epic_username').value;
	var password = window.document.getElementById('password').value;
	
	var cookieString = "";
	for(var key in fakeJar) {
    	cookieString += key + '=' + fakeJar[key] + '; ';
	}
	console.log(cookieString);
	
	var opts = {
		uri: 'https://accounts.unrealengine.com/login/doLogin',
		form:{fromForm:'yes',epic_username:username, password:password},
		headers: { Cookie:cookieString }
	};
	
	request.post(opts , function(error, response, body){
		console.log(response.headers);
		if (response.statusCode == 400)
		{
			console.log('ohshit');
		}
		if (response.headers['access-control-expose-headers'] === 'X-EPIC-LOGIN-COMPLETE-REDIRECT') {
			console.log('holy shit');
		}
		console.log(response.statusCode);
	});
}

module.exports = new api();