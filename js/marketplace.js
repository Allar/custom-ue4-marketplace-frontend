// Epic has intentionally malformed HTML in asset descriptions for internal reasons
// This fixes the malformed HTML, makes all links open a new window, and auto-embeds videos
function fixUpAssetDescriptions() {
	$('.fix-html').each(function(index) {
		var fixed = $(this).html();
		fixed = fixed.replace(/&lt;/g, '<');
		fixed = fixed.replace(/&gt;/g, '>');
		var badTagIndex = fixed.indexOf('</>');
		while (badTagIndex != -1) {
			var badDOM = $.parseHTML(fixed.substring(0, badTagIndex));
			var elementTag = $(badDOM).last().get(0).tagName.toLowerCase();
			fixed = fixed.replace('</>', '</' + elementTag + '>')
			badTagIndex = fixed.indexOf('</>');
		}
		fixed = fixed.replace(/(?:\r\n|\r|\n)/g, "<br>"); // Makes newlines pretty
		fixed = fixed.replace(/<\/h1>/g, "</h1><hr>"); // Adds <hr> to <h1> i.e. Contact and Support
		fixed = fixed.replace(/<br><br><h1>/g, "<br><h1>"); // Removes extra newline before <h1>'s
		fixed = fixed.replace(/<hr><br>/g, "<hr>"); // Removes extra newline after <h1>'s        
		$(this).html(fixed);
		
		// All links in these descriptions should open in a new browser
		$(this).find('a').on('click', function(){
			open(this.href);
			return false;
		});
		
		
		// Look for any YouTube long links to put in our looper
		// https://www.youtube.com/watch?v=wjNtB5g70ic
		$(this).find(':contains("youtube.com/watch")').each(function(){ 
			var vid = $(this).html().match(/(?:v=|\/)([\w-]+)(?:&.+)?$/g)[0].substring(2);
			$('#detailsLooper .looper-inner').prepend('<div class="item"><div class="auto-resizable-iframe"><div><iframe width="1280" height="720" src="https://www.youtube.com/embed/' + vid + '?controls=1&fs=0" frameborder="0"></iframe></div></div></div>');
		});
		
		// @TODO: There is probably a cleaner way to merge this with above
		// Look for any YouTube short links to put in our looper
		// https://youtu.be/NoJQLX9dtRs
		$(this).find(':contains("youtu.be/")').each(function(){
			var vid = $(this).html().match(/(?:v=|\/)([\w-]+)(?:&.+)?$/g)[0].substring(1);
			$('#detailsLooper .looper-inner').prepend('<div class="item"><div class="auto-resizable-iframe"><div><iframe width="1280" height="720" src="https://www.youtube.com/embed/' + vid + '?controls=1&fs=0" frameborder="0"></iframe></div></div></div>');
			console.log(vid);
		});
	});
}

var details_template = common.getTemplateFromFile('./templates/marketplace_asset_details.html');

// Given a category path and an asset's id, we generate a details page for it and show it
// It is important to note here that you should be using paths from the category fetches and
// not using an asset's "categories" array. There are major mismatches in an asset's "categories" array
// that make that data simply unusable, i.e. official category 'assets/characters-animations' but an asset
// may list itself as 'assets/characters' instead.
function showDetailsFor(path, assetid) {
	console.log("Showing details for " + path + " -> " + assetid);
	var asset = $.grep(global.marketplace_ajax[path].assets, function(e){ return e.id === assetid; })[0];
	
	$('#details-wrapper').empty();
	$('#details-wrapper').html(details_template(asset)); 
	
	fixUpAssetDescriptions();
	
	// Builds nav buttons under looper
	var item_count = $('#detailsLooper .looper-inner .item').length;
	for (var i = 0; i < item_count; ++i) {
		$('#detailsLooper nav ul').append('<li><a href="#detailsLooper" data-looper="to" data-args="' + (i+1) + '">&bull;</a></li>')
	}
	
	// Initializes looper
	$('#detailsLooper').looper({interval:false, pause:false});
	
	// Updates nav buttons on looper change
	$('#detailsLooper').on('shown', function(e) {
	$('nav ul li', this).removeClass('active').eq(e.relatedIndex).addClass('active');
	});
	
	$('#details-wrapper').show();
	$('#main').hide();
	$('#toolbar').hide();
}

function MarketplaceDataLoaded() {
	var cat_template = common.getTemplateFromFile('./templates/marketplace_category.html');
	var cat_item_template = common.getTemplateFromFile('./templates/marketplace_category_item.html'); 
	for (var cat_path in global.marketplace_ajax) {
		$('#categories').append(cat_template({path: cat_path, info: global.marketplace_ajax[cat_path]}));
		for (var asset in global.marketplace_ajax[cat_path].assets) {
			$('.categorylist[data-category="' + cat_path + '"] .wrapper ul').append(cat_item_template({cat_path: cat_path, asset: global.marketplace_ajax[cat_path].assets[asset]}));
		}
	}

	var nav_template = common.getTemplateFromFile('./templates/marketplace_nav_items.html'); 
	$('#navlist').append(nav_template({cats: global.marketplace_categories}));	
	
	$("#loading").hide();
	
	// Useful for looking at Epic's asset JSON data during development
	console.log("Marketplace Data:");
	console.log(global.marketplace_ajax);	
	
	// Default to sort by most recent
	$('#sortby').val('asset_sort_date_recent');
	$(".categorylist ul").each(function(index, element) {
	$(element).find('li').sort(sorts[$('#sortby').val()]).appendTo(element);
	});
	
	//applyNonSortFilters();
}

// When page is loaded and ready for javascript...
$(document).ready(function() {
	// Add case-insensitive 'Contains' to jQuery
	jQuery.expr[':'].Contains = function(a,i,m){
		return jQuery(a).text().toUpperCase().indexOf(m[3].toUpperCase())>=0;
	};

	global.$ = $;
	
	global.epic_api.GetMarketplaceCategories(function (success) {
		if (success) {
			global.epic_api.getAllMarketplaceAssets(function (done) {
				MarketplaceDataLoaded();
			});
		}
	});
	
	// Sort filter changed handler
	$('#sortby').change(function() {
		$(".categorylist ul").each(function(index, element) {
			$(element).find('li').sort(sorts[$('#sortby').val()]).appendTo(element);
		});
	});
		
	// Apply non-sort filter when any non-sort filter option has been changed.
	$('#owned-filter').change(applyNonSortFilters);
	$('#search-for').change(applyNonSortFilters);
	$('#search-input').on("input", applyNonSortFilters);
	
	// Hide details on load
	$('#details-wrapper').hide();
  
});