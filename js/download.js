var extensionId = document.getElementById("emblaexpress").text;
const currTime = new Date();
const sysparm_limit = 1000;
const refreshTime = 900000;
const incidentLink = `/api/now/table/incident?sysparm_limit=${sysparm_limit}&sysparm_display_value=false&sysparm_fields=number,caller_id,u_phone_number,company&sysparm_query=caller_id.active=true^u_phone_numberISNOTEMPTY^u_phone_numberLIKE0^ORDERBYnumber&sysparm_offset=`;
const usersLink = `/api/now/table/sys_user?sysparm_limit=${sysparm_limit}&sysparm_display_value=false&sysparm_fields=sys_id,mobile_phone,phone,home_phone,company&sysparm_query=mobile_phoneISNOTEMPTY^ORphoneISNOTEMPTY^ORhome_phoneISNOTEMPTY^active=true^mobile_phoneLIKE0^ORphoneLIKE0^ORhome_phoneLIKE0&sysparm_offset=`;
const downloadDelay = 10000;

//1800000 = 30 min

const getData = (offset, link, array) => new Promise((resolve) => {
  resolvePromise(`${link}${offset}`).then(value => {
    array = array.concat(value.result)
    if (value.result.length == sysparm_limit) {
      setTimeout(() => {
        resolve(getData(offset + sysparm_limit, link, array))
      }, downloadDelay)
    } else {
      resolve(array)
    }
  }
  )
})

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

chrome.runtime.sendMessage(extensionId, { type: "TIME" }, async function (response) {

  let { response: [lastUpdateTime, usrsOffset, incOffset] } = response
  const diffTime = Math.abs(new Date(lastUpdateTime) - currTime);

  console.log(`Emblaexpress: ${usrsOffset}`)
  console.log(`Emblaexpress: ${incOffset}`)
  try {
    if (diffTime > refreshTime) {
      chrome.runtime.sendMessage(extensionId, { type: "DOWNLOAD" });
      if (usrsOffset == 0) {
        let [incidents, users] = await Promise.all([getData(incOffset, incidentLink, []), getData(usrsOffset, usersLink, [])])
        console.log(`Emblaexpress: ${users.length} users & ${incidents.length} incidents added`);
        chrome.runtime.sendMessage(extensionId, { data: [users, incidents], type: "DATA" });
      } else {
        setTimeout(async () => {
          let [incidents] = await Promise.all([getData(incOffset + 2, incidentLink, [])])
          console.log(`Emblaexpress: ${incidents.length || "no"} new incidents added`);
          chrome.runtime.sendMessage(extensionId, { data: [[], incidents], type: "DATA" });
        }, downloadDelay);
      }
    } else {
      console.log(`Emblaexpress: next update in ${Math.round((refreshTime - diffTime) / 60000)} minutes`)
    }
  } catch {

  }


});


