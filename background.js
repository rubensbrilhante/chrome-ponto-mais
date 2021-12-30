let color = '#3aa757';

// chrome.runtime.onInstalled.addListener(() => {
//   chrome.storage.sync.set({ color });
//   console.log('Default background color set to %cgreen', `color: ${color}`);
// });

const icons = {
  enabled: "/images/ponto128x128.png",
  disabled: "/images/ponto_disabled128x128"
};

function isWhitelisted(url) {
  let hostName = new URL(url).hostname;
  let isWhitelisted = "app2.pontomais.com.br" == hostName;
  console.log("", { url, isWhitelisted })
  return isWhitelisted;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log("on Update", { tab, tabId, changeInfo })
  if (!tab.active || changeInfo.status != "complete") {
    console.log("Not on active tab")
    return;
  }
  console.log("", { action: chrome.action })
  if (isWhitelisted(tab.url)) {
    chrome.action.enable();
    chrome.action.setIcon({ tabId, path: icons.enabled });
    // chrome.action.setPopup({ popup: "index.html" });
    console.log("enabled")

    chrome.scripting.executeScript({
      target: { tabId },
      function: injectDiv,
    });

  } else {
    chrome.action.disable();
    // chrome.action.setIcon({ tabId, path: icons.disabled });
    // chrome.action.setPopup({ popup: "" });
    console.log("disabled")
  };
});

function injectDiv() {
  let rawHtml =
    '<div id="extPontoDiv">' +
    '  <div id="extPontoDivHeader">Extensão para Pontomais</div>' +
    '  <div id="extPontoFrame">' +
    '    <p >Verifique a quantidade de horas trabalhadas hoje.</p>' +
    '    <table id="extTimeTable">' +
    '      <tr>' +
    '        <td>Horas trabalhadas</td>' +
    '        <td id="workedTime">Não calculado</td>' +
    '      </tr>' +
    '      <tr>' +
    '        <td>Horas faltantes</td>' +
    '        <td id="missingWorkingHours">Não calculado</td>' +
    '      </tr>' +
    '      <tr>' +
    '        <td>Horas extras</td>' +
    '        <td id="extraWorkingHours">Não calculado</td>' +
    '      </tr>' +
    '    </table>' +
    '    <button type="button" id="calculateWorkingTime"><i _ngcontent-goi-c11 class="pm-icon-Union-16" ></i>Atualizar</button>' +
    '  </div>' +
    '</div>';
  console.log("injectDiv");
  document.body.insertAdjacentHTML('afterbegin', rawHtml);

  // add style

  let styleString =
    '#extPontoDiv {' +
    '  position: absolute;' +
    '  z-index: 9;' +
    '  background-color: #f1f1f1;' +
    '  border: 1px solid #d3d3d3;' +
    '  text-align: center;' +
    '}' +
    '#extPontoFrame {' +
    '  margin: 8px;' +
    '}' +
    '#extTimeTable {' +
    '  width: 100%;' +
    '}' +
    '#missingWorkingHours {' +
    '  color: #EE4444;' +
    '}' +
    '#extraWorkingHours {' +
    '  color: #44EE44;' +
    '}' +
    '#calculateWorkingTime {' +
    '  width: 80%;' +
    '  margin: 8px 0px 0px 0px;' +
    '  padding: 6px;' +
    '}' +
    '#extPontoDivHeader {' +
    '  padding: 10px;' +
    '  cursor: move;' +
    '  z-index: 10;' +
    '  background-color: #2196F3;' +
    '  color: #fff;' +
    '}';

  const style = document.createElement("style");
  style.textContent = styleString;
  document.head.append(style);


  // drag script

  function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "header")) {
      // if present, the header is where you move the DIV from:
      document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    } else {
      // otherwise, move the DIV from anywhere inside the DIV:
      elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:
      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
      // stop moving when mouse button is released:
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  dragElement(document.getElementById("extPontoDiv"));


  // get time script 

  let calculateWorkingTime = document.getElementById("calculateWorkingTime");
  let workedTime = document.getElementById("workedTime");
  let missingWorkingHours = document.getElementById("missingWorkingHours");
  let extraWorkingHours = document.getElementById("extraWorkingHours");
  let hasToken = window.localStorage.token != undefined;
  let isCorrectUrl = "app2.pontomais.com.br" == window.location.host;
  let eightHourShift = 8 * 60 * 60 * 1000;

  console.log("", { hasToken, isCorrectUrl });

  calculateWorkingTime.addEventListener("click", async () => {
    workedTime.innerText = "Calculando";
    extraWorkingHours.innerText = "Calculando";
    missingWorkingHours.innerText = "Calculando";


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
        return years + 'anos ' + months + 'meses ' + weeks + 'semanas ' + days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's';
      } else if (months > 0) {
        return months + 'm ' + weeks + 'semanas ' + days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's';
      } else if (weeks > 0) {
        return weeks + 'semanas ' + days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's';
      } else if (days > 0) {
        return days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's';
      } else if (hours > 0) {
        return hours + 'h ' + minutes + 'm ' + seconds + 's';
      } else if (minutes > 0) {
        return minutes + 'm ' + seconds + 's';
      } else if (seconds > 0) {
        return seconds + 's';
      } else if (seconds == 0) {
        return this + ' menos de 1 segundo!';
      } else {
        return days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's';
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

    // let startDate = new Date().toLocaleString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
    // let endDate = new Date().toLocaleString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
    let startDate = "2021-12-23";
    let endDate = "2021-12-23";

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
        workedTime.innerText = updatemilliseconds(calculatedTime.acc.toString());

        let deltaTime = calculatedTime.acc - eightHourShift;
        console.log("", { deltaTime })
        if (deltaTime < 0) {
          extraWorkingHours.innerText = "Vazio";
          missingWorkingHours.innerText = updatemilliseconds(Math.abs(deltaTime).toString());
        } else {
          extraWorkingHours.innerText = updatemilliseconds(Math.abs(deltaTime).toString());
          missingWorkingHours.innerText = "Vazio";
        }
      } else {
        console.log("Not working yet");
        workedTime.innerText = "Not working yet";
        extraWorkingHours.innerText = "Not working yet";
        missingWorkingHours.innerText = "Not working yet";
      }
    });
  });

}