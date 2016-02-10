$(document).ready(function () {
	var EXCLUDE = /\.(xml|txt|jpg|png|avi|mp3|pdf|mpg)$/,
		HN_BASE = 'https://news.ycombinator.com/',
		HNSEARCH_API_URL = 'https://hn.algolia.com/api/v1/search?tags=story&',
		HNSEARCH_PARAM = 'query=';

	var port = chrome.extension.connect({}),
		callbacks = [];

	port.onMessage.addListener(function (msg) {
		callbacks[msg.id](msg.text);
		delete callbacks[msg.id];
	});

	function doXHR(params, callback) {
		params.id = callbacks.push(callback) - 1;
		port.postMessage(params);
	}

	function searchHN() {
		// don't run on frames or iframes.
		// from http://stackoverflow.com/questions/1535404/how-to-exclude-iframe-in-greasemonkey
		if (window.top != window.self) {
			return;
		}

		var urls = [window.location.href],
			urlWithoutSlash = urls[0].replace(/\/$/, "");
		if (EXCLUDE.test(urls[0])) {
			return;
		}

		// TODO: find a way to search algolia by URL.  Right now it is keyword searching only.
		// Therefore we need to filter the matches by URL.

		var queryURL = HNSEARCH_API_URL + HNSEARCH_PARAM + urls.map(encodeURIComponent).join('&' + HNSEARCH_PARAM);
		doXHR({'action': 'get', 'url': queryURL}, function (response) {
			// JSON.parse will not evaluate any malicious JavaScript embedded into JSON
			var data = JSON.parse(response),
				matches;

			// We have to filter the matches by URL and sort by comment number
			matches = data.hits.filter(function (hit) {
				return hit.url && hit.url.replace(/\/$/, "") == urlWithoutSlash;
			}).sort(function (l, r) {
				return r.num_comments - l.num_comments;
			});

			// No results, maybe it's too new
			if (matches.length == 0) {
				doXHR({'action': 'get', 'url': HN_BASE + "newest"}, function (response) {
					searchNewestHN(response);
				});
				return;
			}

			// If there is a result, create the orange tab and panel
			var foundItem = matches[0];
			createPanel(HN_BASE + 'item?id=' + foundItem.objectID, foundItem.title);
		});
	}

	function searchNewestHN(html) {
		html = html.replace(/<img src="[^"]+"/g, '<img');
		var titleAnchor = $('a[href=\'' + window.location.href.replace(/'/g, "\\'") + '\']', html),
			linkAnchor = titleAnchor.parent().parent().next().find('a').get(1);
		if (linkAnchor) {
			createPanel(HN_BASE + $(linkAnchor).attr('href'));
		}
	}

	function toggleElement(elemName) {
		var element = $(elemName);
		if (element.style.display == 'none') {
			element.style.display = 'block';
			return;
		}
		element.style.display = 'none';
	}

	function createPanel(HNurl, title) {
		if ($(".HNembed").length > 0) {
			return;
		} // avoid situations where multiple results might be triggered.

		var tabTitle = title ? ('HN - ' + title) : 'Hacker News';

		var HNembed = $("<div />").attr({'id': 'HNembed'});
		var HNsite = $("<iframe />").attr({'id': 'HNsite', 'src': 'about: blank'});
		var HNtabText = $("<div>Hacker News</div>").attr({'id': 'HNtabText'});
		var HNtab = $("<div></div>").attr({'id': 'HNtab'});
		var HNtabWrap = $("<div></div>").attr({'id': 'HNtabWrap'});

		// var HNtitle = $('<span id="HNtitleNormal">' + tabTitle + '</span><span id="HNtitleHover">Hide</span>');
		// var HNheader = $("<div/>").attr({'id': 'HNheader'});

		$(window).resize(fixIframeHeight);

		function fixIframeHeight() {
			var windowHeight = $(window).height();
			HNembed.height(windowHeight);
			HNsite.height(windowHeight - (typeof HNheader == 'undefined' ? 0 : HNheader.height()));
		}

		function togglePanel() {
			var openPanel = ! HNembed.is(":visible");

			var embedWidth = 638; // from css
			var embedPosition = openPanel ? '0px' : -embedWidth + 'px';
			var tabPosition = openPanel ? embedWidth + 'px' : '0px';

			var easing = "swing",
				tabAnimationTime = 50,
				embedAnimationTime = 100;

			if (openPanel) {
				fixIframeHeight();
				HNtabWrap.animate({right: tabPosition}, tabAnimationTime, easing, function () {
					// HNtab.hide();
					HNtabText.text('Close HN ×');
				});
				HNembed.show();
				HNembed.animate({right: embedPosition}, embedAnimationTime, easing);
				HNtabWrap.addClass('hntab-open');
			} else {
				HNembed.animate({right: embedPosition}, embedAnimationTime, easing, function () {
					HNembed.hide();
				});
				HNtabWrap.animate({right: tabPosition}, tabAnimationTime, easing, function() {
					// HNtab.show();
					HNtabText.text('Hacker News');
				});
				HNtabWrap.removeClass('hntab-open');
			}
		}

		// HNheader.click(togglePanel);
		HNtab.click(togglePanel);

		// HNheader.append(HNtitle);

		// HNembed.append(HNheader); -- no header
		HNembed.append(HNsite);

		HNtab.append(HNtabText);
		HNtabWrap.append(HNtab);

		HNembed.hide();

		$('body').append(HNtabWrap);
		$('body').append(HNembed);

		doXHR({'action': 'get', 'url': HNurl}, function (response) {
			var doc = HNsite.get(0).contentDocument;
			response = response
				// replace non-absolute urls
				.replace(/(href|src)="([a-zA-Z0-9][^"]*)/g, function(match, attr, url) {
					return attr + '="https://news.ycombinator.com/' + url;
				})
				.replace(/<head>/, '<head><base target="_blank" href="' + HN_BASE + '"/>')
			;
			doc.open();
			doc.write(response);
			doc.close();
		});
	}

	searchHN();

});