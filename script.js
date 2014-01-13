$(document).ready(function() {
  var EXCLUDE = /\.(xml|txt|jpg|png|avi|mp3|pdf|mpg)$/,
    HN_BASE = 'https://news.ycombinator.com/',
    HNSEARCH_API_URL = 'https://api.thriftdb.com/api.hnsearch.com/items/_search?sortby=points+desc&',
    HNSEARCH_PARAM = 'filter[fields][url][]=';
  
  var port = chrome.extension.connect({}),
    callbacks = [];
  
  port.onMessage.addListener(function(msg) {
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
    if (window.top != window.self) { return; }

	// remove query parameters - they are rarely used on HN and often contain personal data
    var url = window.location.href,
		urlNoQuery = url.split('?')[0];

    var urls = [urlNoQuery];
    if (EXCLUDE.test(urls[0])) { return; }
    
    // Also try different normalization of trailing slashes
    if ((/\/$/).test(urls[0])) { urls.push(urls[0].replace(/\/$/, '')); }
    if (!(/\?/).test(urls[0]) && !(/(\.\w{2,4}|\/)$/).test(urls[0])) { urls.push(urls[0] + '/'); }

    var queryURL = HNSEARCH_API_URL + HNSEARCH_PARAM + urls.map(encodeURIComponent).join('&' + HNSEARCH_PARAM);
    doXHR({'action': 'get', 'url': queryURL}, function(response) {
      // JSON.parse will not evaluate any malicious JavaScript embedded into JSON
      var data = JSON.parse(response);

      // No results, maybe it's too new
      if (data.results.length < 1) {
        doXHR({'action':'get','url': HN_BASE + "newest"}, function(response) {
          searchNewestHN(response);
        });
        return;
      }

      // If there is a result, create the orange tab and panel
      var foundItem = data.results[0].item;
      createPanel(HN_BASE + 'item?id=' + foundItem.id, foundItem.title);
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
    if ($(".HNembed").length > 0) { return; } // avoid situations where multiple results might be triggered.

    var tabTitle = title ? ('HN - ' + title) : 'Hacker News';

    var HNembed = $("<div />").attr({'id' : 'HNembed'});
    var HNsite = $("<iframe />").attr({'id' : 'HNsite', 'src' : 'about: blank'});
    var HNtab = $("<div>Hacker News</div>").attr({'id' : 'HNtab'});

    var HNtitle = $('<span id="HNtitleNormal">' + tabTitle + '</span><span id="HNtitleHover">Hide</span>');
    var HNheader = $("<div/>").attr({'id' : 'HNheader'});

    $(window).resize(fixIframeHeight);

    function fixIframeHeight() {
      HNembed.height($(window).height());
      HNsite.height(HNembed.height()-20);  
    }

    function togglePanel() {
      var openPanel = HNtab.is(":visible");

      var embedPosition = openPanel ? "0px" : "-700px";
      var tabPosition = openPanel ? "-25px" : "0px";

	  var easing = "swing",
		  tabAnimationTime = 50,
		  embedAnimationTime = 100;

      if (openPanel) {
        fixIframeHeight();
        HNtab.animate({right: tabPosition}, tabAnimationTime, easing, function() {
          HNtab.hide();
        });
		HNembed.show();
		HNembed.animate({right: embedPosition}, embedAnimationTime,easing);
      } else {
        HNembed.animate({right: embedPosition}, embedAnimationTime, easing, function() {
		  HNembed.hide();
        });
		HNtab.show();
		HNtab.animate({right: tabPosition}, tabAnimationTime, easing);
      }
    }

    HNheader.click(togglePanel);
    HNtab.click(togglePanel);

    HNheader.append(HNtitle);

    HNembed.append(HNheader);
    HNembed.append(HNsite);
    HNembed.hide();

    $('body').append(HNtab);
    $('body').append(HNembed);

    doXHR({'action': 'get', 'url': HNurl}, function(response) {
      var doc = HNsite.get(0).contentDocument;
      response = response.replace(/<head>/, '<head><base target="_blank" href="'+HN_BASE+'"/>');
      doc.open();
      doc.write(response);
      doc.close();
    });
  }
  
  searchHN();
  
});