global.request = (global.request === undefined) ? require('request') : global.request;
global.request = request.defaults({followRedirect: false, followAllRedirects: false});
global.open = (global.open === undefined) ? require('open') : global.open;
global.Handlebars = (global.Handlebars === undefined) ? require('handlebars') : global.Handlebars;
global.fs = (global.fs === undefined) ? require('fs') : global.fs;
global.epic_api = (global.epic_api === undefined) ? require('../js/epic_api.js') : global.epic_api;

require('events').EventEmitter.prototype._maxListeners = 100;

// http://stackoverflow.com/questions/8853396/logical-operator-in-a-handlebars-js-if-conditional
Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
	switch (operator) {
	case '==':
		return (v1 == v2) ? options.fn(this) : options.inverse(this);
	case '===':
		return (v1 === v2) ? options.fn(this) : options.inverse(this);
	case '<':
		return (v1 < v2) ? options.fn(this) : options.inverse(this);
	case '<=':
		return (v1 <= v2) ? options.fn(this) : options.inverse(this);
	case '>':
		return (v1 > v2) ? options.fn(this) : options.inverse(this);
	case '>=':
		return (v1 >= v2) ? options.fn(this) : options.inverse(this);
	case '&&':
		return (v1 && v2) ? options.fn(this) : options.inverse(this);
	case '||':
		return (v1 || v2) ? options.fn(this) : options.inverse(this);
	default:
		return options.inverse(this);
	}
});

Handlebars.registerHelper('ISODateToUnix', function(ISODate) {
	return Date.parse(ISODate);
});

Handlebars.registerHelper('ISODateToMonthDayYear', function(ISODate) {
	return (new Date(ISODate).toLocaleDateString(window.navigator.language, {month: 'long', day: 'numeric', year: 'numeric'}));
});

global.window.nwDispatcher.requireNwGui().Window.get().title = "Allar's UE4 Marketplace Frontend";

var common = function () {};

common.prototype.getTemplateFromFile = function(template_path) {
	var data = fs.readFileSync(template_path);
	return Handlebars.compile(''+data);
}

module.exports = new common();