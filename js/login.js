require('./js/common.js');

function skipLogin() {
	console.log('what');
	window.location.href="./marketplace.html";
}

function doLogin() {
	global.epic_api.WebLogin($('#epic_username').val(), $('#password').val(), waitForLogin);
}

function waitForLogin(status, complete) {
	$('body').html(status);
	if (complete == true) {
		window.location.href="./marketplace.html";
	}
}

function rebuildLogin(form) {
	$('body').html($(form).find('form'));
	$('#rememberMeCheckContainer').remove();
	$('.resetPass').remove();
	
	$('#epic_username').removeAttr('oninput');
	$('#password').removeAttr('oninput');
	$('#password').removeAttr('oninput');
	$('#signIn').attr('onclick','doLogin()');
	
	//$('form').append("<button id='skipLoginBtn' onclick='skipLogin()'>Skip Logging In</button>");
}
	
$(document).ready(function() {
	global.$ = $;
	global.epic_api.GetWebLoginForm(function (form) {
		rebuildLogin(form);
	});
});