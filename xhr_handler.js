function xhrCall(url, port, id) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.onreadystatechange = function () {
		if (xhr.readyState == 4) {
			port.postMessage({id: id, text: xhr.responseText});
		}
	};
	xhr.send();
}

chrome.extension.onConnect.addListener(function (port) {
	port.onMessage.addListener(function (request) {
		xhrCall(request.url, port, request.id);
	});
});