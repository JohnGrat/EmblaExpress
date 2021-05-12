var extensionId = document.getElementById("emblaexpress").text;
var caller_id = "";
var incident_caller_id = document.getElementById("incident.caller_id");
var caller_box = document.getElementById("sys_display.incident.caller_id");
var company_box = document.getElementById("sys_display.incident.company");
var employeenumber_box = document.getElementById('incident.caller_id.employee_number');
var description_box = document.getElementById("incident.description");
var telephonenumber_box = document.getElementById("incident.u_phone_number");
var computername_box = document.getElementById("incident.u_computer_name");
var shortdescription_box = document.getElementById("incident.short_description");
var show_incidents = document.querySelectorAll('[id^=show_incidents_]')[0];


//#region new incident
let computerPattern = /(Datornamn:)(.*)([\r\n]Plats:)/;
let numberPattern = /(Telefonnummer:)(.*)([\r\n]+Problembeskrivning:)/;
let url = new URL(window.document.location); 
let params = new URLSearchParams(url.search.slice(1));

extractUrlInfo(); 

function extractUrlInfo() {
    for (let p of params) {
        if (p.includes("Number")) {

            let number = p[1]
            pageLoad(number)

        };
    }
}

function pageLoad(number) {

    telephonenumber_box.value = number;
    description_box.value = description_box.value.replace(numberPattern, `$1 ${number || ""}$3`);

    if (number.length > 7) {

        chrome.runtime.sendMessage(extensionId, {
            callingnumber: number,
            type: "NUMBER"
        }, function(response) {

            let {
                response: {
                    incident: {
                        user_sys_id,
                        company_sys_id
                    }
                }
            } = response;

            if (user_sys_id) {

               g_form.setValue('caller_id', user_sys_id)
               shortdescription_box.focus();

            }
            else if (company_sys_id) {

               g_form.setValue('company', company_sys_id)
                  
            }    
        });
    }
};
//#region new incident

//#region dynamic update functions
setInterval( async function() {

    if (caller_id != incident_caller_id.value) {

        //#region active incident notification
        const json = await resolvePromise(`/api/now/table/incident?&sysparm_query=caller_id=${incident_caller_id.value}^active=true^state!=6`);

        if(json.result.length > 0){
            show_incidents.style.borderColor = "red"
        } else {
            show_incidents.style.borderColor = "#cbcbcb"
        }
        //#endregion active incident notification

        

        //#region computer
        chrome.runtime.sendMessage(extensionId, {
            employeenumber: employeenumber_box.value,
            type: "USERNAME"
        }, function(response) {

            let {
                response: {
                    computer: {
                        Computername : name
                    }
                }
            } = response;
            description_box.value = description_box.value.replace(computerPattern, `$1 ${name || ""}$3`);

        });
        //#region computer
    }
    caller_id = incident_caller_id.value;

}, 2000);
//#region 



//#region private functions
async function resolvePromise(url) {
    const headers = new Headers({
      //g_ck is the session token
      'X-UserToken': g_ck,
      'Cache-Control': 'no-cache',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: headers
      });
      const json = await res.json(); // eller .text();
      return json;
    } catch (ex) {
      console.log(ex);
    }
    return null;
  }
//#endregion private functions