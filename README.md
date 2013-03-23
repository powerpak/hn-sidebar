#Hacker News Sidebar for Chrome

*Displays the Hacker News comment thread that corresponds to the page you are currently viewing in a sidebar, if it was submitted to Hacker News.*

You can [install this Chrome extension from the Chrome Store](https://chrome.google.com/webstore/detail/hacker-news-sidebar/ngljhffenbmdjobakjplnlbfkeabbpma).

If you'd like to run your own fork of it, clone this repository and [load its directory as an unpacked extension](https://developer.chrome.com/extensions/getstarted.html#unpacked).  A lengthy introduction to the code is available [on my blog](http://tedpak.com/2013/03/20/hacker-news-sidebar-a-chrome-extension).

<img src="https://raw.github.com/powerpak/hn-sidebar/master/screenshot-lg.png" width=640/>

**NOTE:** This extension, by necessity, **MUST** submit the URLs of pages that you visit to https://api.thriftdb.com/ to search for the corresponding Hacker News items.  They could conceivably use this data to reconstruct your browsing history if they were inclined enough and able to uniquely identify the requests your browser is making.  Please do not use this extension if you do not trust that site with this sort of data!

This is a resuscitation of [an old extension](https://chrome.google.com/webstore/detail/hacker-news-sidebar/hhedbplnihmkekhgmaoikgfbkjjaocnl?hl=en) of the same name by [Omer Gertel](http://www.omergertel.com) that no longer functions due to changes in APIs and HN's move to HTTPS.  Details on the search API used by this extension are available [from HNSearch](https://www.hnsearch.com/api).

This source is released under an [MIT license](http://en.wikipedia.org/wiki/MIT_license); see LICENSE.txt for the full text.