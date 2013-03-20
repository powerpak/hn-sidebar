$(document).ready(function() {
  var exclude = /\.(xml|txt|jpg|png|avi|mp3|pdf|mpg)$/;
  
  var port = chrome.extension.connect({}),
    callbacks = [];
  
  var HN_BASE = 'https://news.ycombinator.com/';

  port.onMessage.addListener(function(msg) {
    callbacks[msg.id](msg.text);
    delete callbacks[msg.id];
  });

  function doXHR(params, callback) {
    params.id = callbacks.push(callback) - 1;
    port.postMessage(params);
  }

  function searchYC() {
    //don't run on frames or iframes. From http://stackoverflow.com/questions/1535404/how-to-exclude-iframe-in-greasemonkey
    if (window.top != window.self) { return; }

    var curPath = window.location.href;
    if (exclude.test(curPath)) { return; }

    var queryURL = "http://api.thriftdb.com/api.hnsearch.com/items/_search?filter[fields][url][]=" + encodeURIComponent(curPath);
    doXHR({'action': 'get', 'url': queryURL}, function(response) {
      // JSON.parse does not evaluate the attacker's scripts.
      var data = JSON.parse(response);

      // No results, maybe it's too new
      if (data.results.length < 1) {
        doXHR({'action':'get','url': HN_BASE + "newest"}, function(response) {
          searchHN(response);
        });
        return;
      }

      // fetch result
      var foundItem = data.results[0].item;
      if (cutoff(foundItem.create_ts, foundItem.num_comments)) {
        createPanel(HN_BASE + 'item?id=' + foundItem.id);
      }
    });
  }

  function searchHN(html) {
    var titleAnchor = $('a[href=\'' + window.location.href.replace(/'/g, "\\'") + '\']', html);
    var linkAnchor = titleAnchor.parent().parent().next().find('a').get(1);
    if (linkAnchor) {
      var itemURL = $(linkAnchor).attr('href');
      createPanel(HN_BASE + itemURL);
      return;
    }
  }

  function toggleElement(elemName) {
    var element = $(elemName);
    if (element.style.display == 'none') {
      element.style.display = 'block'; //http://stackoverflow.com/questions/1535404/how-to-exclude-iframe-in-greasemonkey
      return;
    }
    element.style.display = 'none';
  }

  function createPanel(HNurl) {
    if ($(".HNembed").length > 0) { return; } // avoid situations where multiple results might be triggered.

    var HNembed = $("<div />").attr({'id' : 'HNembed'});
    var HNsite = $("<iframe />").attr({'id' : 'HNsite', 'src' : 'about: blank'});
    var HNtab = $("<div>HackerNews</div>").attr({'id' : 'HNtab'});

    var panelTitle = ">>> <b>Hacker News</b> >>>";
    var HNtitle = $("<span>" + panelTitle + "</span>").attr({'id' : 'HNtitle'});
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

      if (openPanel) {
        fixIframeHeight();
        HNtab.animate({right: tabPosition}, 150, "linear", function() {
          HNembed.show();
          HNtab.hide();
          HNembed.animate({right: embedPosition},400,"linear");
        });
      } else {
        HNembed.animate({right: embedPosition}, 400, "linear", function() {
          HNtab.show();
          HNembed.hide();
          HNtab.animate({right: tabPosition}, 150, "linear");
        });
      }
    }

    HNheader.click(togglePanel);
    HNtab.click(togglePanel);

    HNheader.append(HNtitle);

    HNembed.append(HNheader);
    HNembed.append(HNsite);
    HNembed.hide()

    $('body').append(HNtab);
    $('body').append(HNembed);

    doXHR({'action': 'get', 'url': HNurl}, function(response) {
      var win = HNsite.get(0).contentDocument;
      response = response.replace(/<head>/, '<head><base target="_blank" href="'+HN_BASE+'"/>');
      win.open();
      win.write(response);
      win.close();
    });
  }

  function cutoff(date, points) {
    var difference = new Date() - new Date(date);
    var months = difference/(1000*60*60*24*30);
    if (months > points) {
      return false;
    } else {
      return true;
    }
  }
  
  searchYC();
  
});