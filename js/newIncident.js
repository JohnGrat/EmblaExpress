var extensionId = document.getElementById("emblaexpress").text;
var caller = "";
var description_box = document.getElementById("incident.description");
var telephonenumber_box = document.getElementById("incident.u_phone_number");
var shortdescription_box = document.getElementById("incident.short_description");
var show_incidents = document.querySelectorAll('[id^=show_incidents_]')[0];


let computerPattern = /(Datornamn:)(.*)([\r\n]Plats:)/;
let numberPattern = /(Telefonnummer:)(.*)([\r\n]+Problembeskrivning:)/;
let url = new URL(window.document.location);
let params = new URLSearchParams(url.search.slice(1));


window.addEventListener('load', function () {

    for (let p of params) {
        if (p.includes("Number")) {

            let number = p[1]
            pageLoad(number)

        };
    }


    function pageLoad(number) {

        telephonenumber_box.value = number;
        description_box.value = description_box.value.replace(numberPattern, `$1 ${number || ""}$3`);

        if (number.length > 7) {

            chrome.runtime.sendMessage(extensionId, {
                callingnumber: number,
                type: "NUMBER"
            }, function (response) {

                if (!jQuery.isEmptyObject(response)) {

                    let {
                        response: {
                            incident: {
                                caller_id,
                                company
                            }
                        }
                    } = response;

                    if (!caller_id) {

                        description_box.value = description_box.value.replace(numberPattern, `$1 ${"växel"}$3`);
                        g_form.setValue('company', company);

                    }
                    else {

                        console.log(`Emblaexpress: ${caller_id}`)
                        g_form.setValue('caller_id', caller_id)
                        setTimeout(() => {
                            if (caller_id != g_form.getValue('caller_id')) {
                                g_form.setValue('caller_id', caller_id)
                                console.log(`Emblaexpress: gform mismatch`)
                            }
                        }, 4000);
                        shortdescription_box.focus();

                    }
                }
            });
        }
    };
    //#region new incident


    //#region dynamic update functions
    setInterval(async function () {

        var new_caller = g_form.getValue('caller_id')

        if (caller != new_caller) {

            //#region active incident notification
            const openIncidents = await resolvePromise(`/api/now/table/incident?&sysparm_query=caller_id=${new_caller}^active=true^state!=6`);

            if (openIncidents.result.length > 0) {
                show_incidents.style.borderColor = "red"
                let message = `User has active incidents (${openIncidents.result.length})`
                jQuery(show_incidents).attr('title', message)
                jQuery(show_incidents).attr('data-original-title', message).tooltip('show');
                setTimeout(function () {
                    jQuery(show_incidents).tooltip('hide');
                }, 2500);
            } else {
                let message = 'Show related incidents'
                jQuery(show_incidents).attr('title', message)
                jQuery(show_incidents).attr('data-original-title', message)
                show_incidents.style.borderColor = "#cbcbcb"
            }
            //#endregion active incident notification
            const user = await resolvePromise(`/api/now/table/sys_user?sysparm_query=sys_id=${new_caller}`);

            if (!jQuery.isEmptyObject(user.result[0].employee_number)) {
                var employeenumber = user.result[0].employee_number
                var company = user.result[0].company.value

                var name;
                const clients = await resolvePromise(`/api/now/table/u_cmdb_ci_clients?sysparm_query=u_last_logged_on_user=${employeenumber}^hardware_status!=retired^company=${company}`);
                if (clients.result.length > 0) {
                    name = clients.result.reduce((a, b) => a.u_ls_last_update > b.u_ls_last_update ? a : b).name
                }


                description_box.value = description_box.value.replace(computerPattern, `$1 ${name || ""}$3`);
            }
        }
        caller = new_caller;

    }, 2000);
})
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