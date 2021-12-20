// Initialize butotn with users's prefered color
let calculateWorkingTime = document.getElementById("calculateWorkingTime");
let workedTime = document.getElementById("workedTime");
let missingWorkingHours = document.getElementById("missingWorkingHours");
let hasToken = window.localStorage.token != undefined;
let isCorrectUrl = "app2.pontomais.com.br" == window.location.host;

console.log("", { hasToken, isCorrectUrl });

calculateWorkingTime.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: updateWorkingTime,
  });
});



function updateWorkingTime() {

  String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this / 1000);
    var secsUsed = 0;
    var years = Math.floor(sec_num / 31536000);
    if (years > 0) { secsUsed += (years * 31536000); }
    var months = Math.floor((sec_num - secsUsed) / 2628288);
    if (months > 0) {
      secsUsed += (months * 2628288);
    }
    var weeks = Math.floor((sec_num - secsUsed) / 604800);
    if (weeks > 0) {
      secsUsed += (weeks * 604800);
    }
    var days = Math.floor((sec_num - secsUsed) / 86400);
    if (days > 0) {
      secsUsed += (days * 86400);
    }
    var hours = Math.floor((sec_num - secsUsed) / 3600);
    if (hours > 0) {
      secsUsed += (hours * 3600);
    }
    var minutes = Math.floor((sec_num - secsUsed) / 60);
    if (minutes > 0) {
      secsUsed += (minutes * 60);
    }
    var seconds = sec_num - secsUsed;
    if (years > 0) {
      return years + ' Years ' + months + ' Months ' + weeks + ' Weeks ' + days + ' Days ' + hours + ' Hours ' + minutes + ' Minutes ' + seconds + ' Seconds';
    } else if (months > 0) {
      return months + ' Months ' + weeks + ' Weeks ' + days + ' Days ' + hours + ' Hours ' + minutes + ' Minutes ' + seconds + ' Seconds';
    } else if (weeks > 0) {
      return weeks + ' Weeks ' + days + ' Days ' + hours + ' Hours ' + minutes + ' Minutes ' + seconds + ' Seconds';
    } else if (days > 0) {
      return days + ' Days ' + hours + ' Hours ' + minutes + ' Minutes ' + seconds + ' Seconds';
    } else if (hours > 0) {
      return hours + ' Hours ' + minutes + ' Minutes ' + seconds + ' Seconds';
    } else if (minutes > 0) {
      return minutes + ' Minutes ' + seconds + ' Seconds';
    } else if (seconds > 0) {
      return seconds + ' Seconds';
    } else if (seconds == 0) {
      return this + ' Milliseconds (not enough for seconds!)';
    } else {
      return days + ' Days ' + hours + ' Hours ' + minutes + ' Minutes ' + seconds + ' Seconds';
    }
  }

  function updatemilliseconds(val) {

    if (val == "") { return; }
    return val.toHHMMSS();
  }


  let token = JSON.parse(window.localStorage.token);
  let accessToken = token.token;
  let clientId = token.client_id;
  let uuid = token.uuid;
  let email = token.data.email;

  console.log("", { accessToken, clientId, uuid, email });


  function myReduce(acc, value, index) {
    console.log("", { acc, value, index });
    if (index % 2 == 0) {
      return { in: new Date(value.untreated.datetime).getTime(), acc: acc.acc };
    } else {
      console.log("acc", { acc });
      let result = acc.acc + (new Date(value.untreated.datetime).getTime() - acc.in);
      return { in: null, acc: result };
    }

  }

  let startDate = new Date().toLocaleString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
  let endDate = new Date().toLocaleString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });

  let perPage = 10;
  let sort = "asc,asc";
  let url = `https://api.pontomais.com.br/api/time_cards/current/?page=1&per_page=${perPage}&count=true&start_date=${startDate}&end_date=${endDate}&sort_direction=${sort}&sort_property=date,time`;

  let init = {
    method: "GET",
    headers: {
      authority: "api.pontomais.com.br",
      accept: "application/json, text/plain, */*",
      'access-token': accessToken,
      'api-version': 2,
      client: clientId,
      'content-type': "application/json",
      token: accessToken,
      uid: email,
      uuid: uuid
    }
  };

  console.log("init", init);
  fetch(url, init).then(r => r.text()).then(result => {
    let response = JSON.parse(result);
    console.log("", { response });

    response.time_cards.forEach(card => {
      console.log(card.untreated.time);
    });

    
    if (response.time_cards.length > 0) {
      let calculatedTime = response.time_cards.reduce(myReduce, { acc: 0 });
      console.log("calculatedTime", { calculatedTime });
      console.log("Worked Time", updatemilliseconds(calculatedTime.acc.toString()));

      if (calculatedTime.in != null) {
        let now = new Date();
        let nowString = now.toLocaleString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
        calculatedTime.acc = calculatedTime.acc + (now.getTime() - calculatedTime.in);
        console.log(`Worked until [${nowString}]`, updatemilliseconds(calculatedTime.acc.toString()));
      }
    } else {
      console.log("Not working yet");
    }
  });
}

