var extensionId = document.getElementById("emblaexpress").text;
const currTime = new Date();


chrome.runtime.sendMessage(extensionId, {type: "TIME"}, function (response) {

        let {response : lastUpdateTime} = response

        const diffTime = Math.abs(new Date(lastUpdateTime) - currTime );
        console.log(Math.round((3600000 - diffTime) / 60000))

        //this makes sure the files only update every 1 hour
         if (diffTime > 3600000){
           
           downloadFiles()

         }
        });

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
  
    async function downloadFiles() {
      const state = {
        Telephonebook: { file_name: "EexpressTelephonebook.json", sysid: null, dataResponse: null, promise: null },
        Partillecomputers: { file_name: "EexpressPartillecomputers.json", sysid: null, dataResponse: null, promise: null },
        Lerumcomputers: { file_name: "EexpressLerumcomputers.json", sysid: null, dataResponse: null, promise: null },
        Bräckecomputers: { file_name: "EexpressBräckecomputers.json", sysid: null, dataResponse: null, promise: null },
        Greencarriercomputers: { file_name: "EexpressGreencarriercomputers.json", sysid: null, dataResponse: null, promise: null },
        Upplandsbrocomputers: { file_name: "EexpressUpplandsbrocomputers.json", sysid: null, dataResponse: null, promise: null },
        Sidacomputers: { file_name: "EexpressSidacomputers.json", sysid: null, dataResponse: null, promise: null }
      }
       const json = await resolvePromise('/api/now/table/sys_attachment?&sysparm_display_value=true&sysparm_fields=sys_updated_on,file_name,sys_id&sysparm_query=file_nameLIKEEexpress');
       Object.keys(state).forEach
         (element => {
           json.result.forEach(item => {
             if (item.file_name == state[element].file_name) {
               state[element].sysid = item.sys_id;
               state[element].promise = resolvePromise('/api/now/attachment/' + item.sys_id + '/file').then(resp => { state[element].dataResponse = resp });
             }
           });
         });
 
        await Promise.all(Object.keys(state).map(element => state[element].promise))

       //laddar in telefonbooken och alla datorer
       const usersfile = state.Telephonebook.dataResponse;
       let computerfile = [];
       Object.keys(state).forEach(k => { const file = state[k].dataResponse; if (state[k].file_name.includes("computers")) { computerfile = [].concat(file, computerfile) } });
       if(!Object.keys(state).some(item => state[item].dataResponse == null)){
       console.log("all files downloaded")
       chrome.runtime.sendMessage(extensionId, {users: usersfile, computers: computerfile, timestamp: new Date() , type: "INFO"});
       return;
      }
     };

    