exchange = []

const zeroPad = (num, places) => String(num).padStart(places, '0')
const groupBy = (items, key) => items.reduce(
  (result, item) => ({
    ...result,
    [item[key]]: [
      ...(result[item[key]] || []),
      item,
    ],
  }),
  {},
);
const getObjectFromLocalStorage = async function (key) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(key, function (value) {
        resolve(value[key]);
      });
    } catch (ex) {
      reject(ex);
    }
  });
};
const saveObjectInLocalStorage = async function (obj) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set(obj, function () {
        resolve();
      });
    } catch (ex) {
      reject(ex);
    }
  });
};


chrome.runtime.onInstalled.addListener(async function (details) {
  await saveObjectInLocalStorage({ 'telephonebook': exchange });
  await saveObjectInLocalStorage({ 'incOffset': 0 });
  await saveObjectInLocalStorage({ 'usrsOffset': 0 });
  await saveObjectInLocalStorage({ 'time': "2020-12-18T07:39:24.704Z" });
});


//Setup listener from page
chrome.runtime.onMessageExternal.addListener(
  async function (request, sender, sendResponse) {

    let response = null;

    switch (request.type) {

      case "TIME":

        lastUpdateTime = new Date(await getObjectFromLocalStorage('time'));
        incOffset = await getObjectFromLocalStorage('incOffset')
        usrsOffset = await getObjectFromLocalStorage('usrsOffset')

        response = [lastUpdateTime, usrsOffset, incOffset];
        sendResponse({ response });


        break;
      case "DOWNLOAD":

        await saveObjectInLocalStorage({ 'time': new Date().toString() });

        break;

      case "DATA":

        await CreateEexpressTelephonebook(request.data);
        console.log("Files updated")

        break;
      case "NUMBER":

        //New incident open

        response = await SearchEexpressTelephonebook(request.callingnumber)
        sendResponse({ response });

        break;

      default:
        break;
    }


  });


async function SearchEexpressTelephonebook(callingnumber) {

  let arr = await getObjectFromLocalStorage('telephonebook')

  let formattedNumber = callingnumber.replace(/^(00\d\d|0)(\d+)/, "$2")

  if (!arr.some(x => x.u_phone_number.includes(formattedNumber))) return;

  var matches = arr.filter(x => x.u_phone_number.includes(formattedNumber));

  let incident = matches.reduce((a, b) => a.number > b.number ? a : b);

  return { "incident": incident }
}



async function CreateEexpressTelephonebook([users, incidents]) {

  let newIncOffset = await getObjectFromLocalStorage('incOffset')
  let newUsrsOffset = await getObjectFromLocalStorage('usrsOffset')
  let eexpressTelephonebook = await getObjectFromLocalStorage('telephonebook')

  if (incidents.length > 0) {
    incidents.forEach(item => {
      var obj = {};
      obj["number"] = item.number
      obj["company"] = item.company.value;
      obj["caller_id"] = item.caller_id.value;
      obj["u_phone_number"] = item.u_phone_number;

      if (eexpressTelephonebook.some(x => x.number == item.number)) return;

      if (eexpressTelephonebook.some(x => x.u_phone_number == item.u_phone_number)) {
        var matches = eexpressTelephonebook.filter(x => x.u_phone_number == item.u_phone_number);
        let incident = matches.reduce((a, b) => a.number > b.number ? a : b);
        if (incident.number < item.number) {
          eexpressTelephonebook = eexpressTelephonebook.filter(x => x.u_phone_number != item.u_phone_number);
          eexpressTelephonebook.push(obj)
        }
      } else {
        eexpressTelephonebook.push(obj);
      }
      newIncOffset++;
    })
  }

  if (users.length > 0) {
    users.forEach(item => {
      var obj = {};
      obj["number"] = `INC${zeroPad(newUsrsOffset, 7)}`
      obj["company"] = item.company.value;
      obj["caller_id"] = item.sys_id;
      obj["u_phone_number"] = [item.mobile_phone, item.phone, item.home_phone].map(function (x) { return x.replace(/[^0-9]/g, "") }).join("");

      if (!eexpressTelephonebook.some(x => x.u_phone_number == obj.u_phone_number)) {
        eexpressTelephonebook.push(obj);
      }
      newUsrsOffset++;
    })
  }


  await saveObjectInLocalStorage({ 'telephonebook': eexpressTelephonebook });
  await saveObjectInLocalStorage({ 'incOffset': newIncOffset });
  await saveObjectInLocalStorage({ 'usrsOffset': newUsrsOffset });

  return;
}



