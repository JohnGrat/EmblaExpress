var port = null;
var computername = null;

connect()


//Setup tab script
chrome.tabs.onUpdated.addListener(function(tabid, changeInfo, tab) {
  // make sure the status is 'complete' and it's the right tab
  if (tab.url.indexOf('https://embla.nordlo.com/incident.do?sys_id=-1&sysparm_template=IncidentDefaults&CallerID') != -1 && changeInfo.status == 'complete' ) {
    chrome.tabs.executeScript( {
        file: 'js/tab.js' 
    });
  }
});
    


//Setup listener from tab
chrome.runtime.onMessage.addListener(
function(request, sender, sendResponse) {
      (sender.tab ?
              "from a content script:" + sender.tab.url :
              "from the extension");
  if (request.username.length > 1 && request.organization.length > 1){
    sendNativeMessage(request)  
    setTimeout(function() {
      sendResponse({farewell: computername});
    }, 250);

    return true;
  }
});

function connect() {
  var hostName = "com.google.chrome.example.echo";
  //alert("Connecting to native messaging host <b>" + hostName + "</b>");
  port = chrome.runtime.connectNative(hostName);
  port.onMessage.addListener(onNativeMessage);
  port.onDisconnect.addListener(onDisconnected);
}

function onNativeMessage(message) {
  //alert("Received message: <b>" + JSON.stringify(message) + "</b>");
  computername = (JSON.stringify(message.Datornamn)).replace(/"/g, '');
};

 

function onDisconnected() {
  //alert("Failed to connect: " + chrome.runtime.lastError.message);
  port = null;
}

function sendNativeMessage(data) {
  message = {"username": data.username, "company": data.organization};
  //alert(JSON.stringify(message));
  port.postMessage(message);
  //alert("Sent message: <b>" + JSON.stringify(message) + "</b>");
}

    
    
    
      



