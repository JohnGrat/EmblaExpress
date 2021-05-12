var eexpressTelephonebook = [];
var eexpressComputers = [];
var lastUpdateTime = Date.parse("2020-12-18T07:39:24.704Z");

//Setup listener from page
chrome.runtime.onMessageExternal.addListener(
  function (request, sender, sendResponse) {

      let response;

      switch (request.type) {
          
        case "INFO":

          eexpressTelephonebook = request.users;
          eexpressComputers = request.computers;
          lastUpdateTime = Date.parse(request.timestamp);
          console.log("Files updated")

          break;

        case "TIME":

          response = lastUpdateTime;
          sendResponse({ response });
              
          break;

        case "NUMBER":
        
          //New incident open
         
          response = searchIncidentDatabase(request.callingnumber)
          sendResponse({ response });

          break;
        case "USERNAME":
           
           //Dynamic Update Computername

          response = searchComputerDatabase(request.employeenumber)
          sendResponse({ response });

          break;
      
        default:
          break;
      }
      
      
  });


  function searchIncidentDatabase(callingnumber) {

    let formattedNumber = callingnumber.replace(/^(00\d\d|0)(\d+)/, "$2")
    
    if(!eexpressTelephonebook.some(x => x.telephone_number.includes(formattedNumber))) return;

    var matches = eexpressTelephonebook.filter(x => x.telephone_number.includes(formattedNumber));
    let incident = matches.reduce((a , b) => a.number > b.number ? a : b);
    
    return {"incident" : incident}
  }
  
  function searchComputerDatabase(username) {
    let matches = eexpressComputers.filter(x => x.Username.toLowerCase() == username.toLowerCase());
    let computer = matches.slice(-1)[0] || {};
    return {"computer" : computer};
  }




