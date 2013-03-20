#Hacker News Sidebar for Chrome

*Displays a pop-out sidebar with comments from the Hacker News submission for any webpage, if it exists.*

You can [install this Chrome extension from the Chrome Store](https://chrome.google.com/webstore/detail/hacker-news-sidebar/ngljhffenbmdjobakjplnlbfkeabbpma).

If you'd like to run your own fork of it, clone this repository and [load its directory as an unpacked extension](https://developer.chrome.com/extensions/getstarted.html#unpacked).

<img src="https://raw.github.com/powerpak/hn-sidebar/master/screenshot-lg.png" width=640/>

**NOTE:** This extension, by necessity, **MUST** submit the URLs of pages that you visit to http://api.thriftdb.com/ to search for the corresponding Hacker News items.  It fetches the corresponding HN comments thread via AJAX and inserts it into an `<iframe>` attached to the side of each page (because HN disallows traditional framing).  Please do not use this extension if the privacy implications of this are not acceptable or at all unclear to you!

This is a resuscitation of [an old extension](https://chrome.google.com/webstore/detail/hacker-news-sidebar/hhedbplnihmkekhgmaoikgfbkjjaocnl?hl=en) of the same name by Omar Gertel that no longer functions due to changes in APIs and HN's move to HTTPS.  Details on the search API used by this extension are available [from HNSearch](https://www.hnsearch.com/api).