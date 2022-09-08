
function addScript(filePath) {
  var s = document.createElement('script');
  s.setAttribute("id", "emblaexpress");
  s.textContent = chrome.runtime.id;
  s.src = chrome.runtime.getURL(filePath);
  (document.head || document.documentElement).appendChild(s);
}

addScript('js/paste.js');

if (window == window.top) {


  addScript('js/download.js');

  if (/sys_id=-1&sysparm_template=IncidentDefaults&Number=/.test(window.location.href)) {
    addScript('js/newIncident.js');
  }

}
