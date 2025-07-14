import { data } from "../data/data.js";
import { data_walc } from "../data_walc/data_walc.js";
import { data_health } from "../data_health/data_health.js";

let stageHeight;
let stageWidth;
let renderer;
let groupedData;
let isHealth = false;

init();

function init() {
  renderer = document.querySelector("#renderer");
  renderer.style.display = "flex";
  renderer.style.alignItems = "center"; // vertikal zentriert
  renderer.style.justifyContent = "flex-start"; // linksbündig
  renderer.style.height = "130vh"; // volle Fensterhöhe für vertikale Zentrierung
  renderer.style.paddingLeft = "20px"; // optional: etwas Abstand vom linken Rand
  renderer.style.paddingRight = "50px"; // optional: etwas Abstand vom rechten Rand

  stageWidth = renderer.clientWidth;
  stageHeight = renderer.clientHeight;
  prepareData();
  drawDiagram();
}

function prepareData() {
  groupedData = gmynd.groupData(data, ["AlcoholConsumption", "age"]);
  //console.log(test[1][15]);

  console.log(groupedData);
}

function drawDiagram() {
  renderer.innerHTML = "";
  let tabelle = document.createElement("table");
  renderer.appendChild(tabelle);

  const labels = {
    //look up object für welche labels wo hin sollen
    1: "very low",
    2: "low",
    3: "medium",
    4: "high",
    5: "very high",
  };

  const labelhealth = {
    //look up object für welche labels wo hin sollen
    1: "very bad",
    2: "bad",
    3: "medium",
    4: "good",
    5: "very good",
  };

  for (let row = 5; row > 0; row--) {
    let htmlRow = document.createElement("tr");
    tabelle.appendChild(htmlRow);
    let htmlCell = document.createElement("td");
    let description = document.createElement("div");
    description.classList.add("circle");
    description.innerText = isHealth ? labelhealth[row] : labels[row]; //nimm die werte aus der labels constante und die position von row

    htmlRow.appendChild(htmlCell);
    htmlCell.appendChild(description);

    // Fuegt die Kreise dynamisch hinzu
    for (let column = 15; column < 23; column++) {
      let htmlCell = document.createElement("td");
      if (isHealth) {
        drawBigCircle(groupedData[row][column], htmlCell);
      } else {
        drawCircle(groupedData[row][column], htmlCell);
      }
      htmlRow.appendChild(htmlCell);
    }
  }

  let htmlRow = document.createElement("tr");
  tabelle.appendChild(htmlRow);
  for (let column = 14; column < 23; column++) {
    // Fuegt die Beschreibung hinzu in der letzten Reihe
    let htmlCell = document.createElement("td");
    let description = document.createElement("div");
    description.style.width = "200px";
    description.style.height = "50px";
    description.style.paddingbottom = "1000px";  
      if (column != 14) {
      //description.style.backgroundColor = 'black';
      description.style.gap = "0px";
      description.innerText = column;
      description.style.textAlign = "center";
      description.style.textAlign = "middle";
      description.style.fontWeight = "bold";
      description.style.color = "white";
      description.style.fontSize = "15px";
    }
    htmlRow.appendChild(htmlCell);
    htmlCell.appendChild(description);
  }
}

function drawBigCircle(persons, htmlCell) {
  let personsCount = 0;
  if (Array.isArray(persons)) {
    personsCount = persons.length;
  }

  let circles = document.createElement("div");
  circles.classList.add("center-circles");
  circles.style.width = "200px";
  circles.style.height = "150px";

  // console.log(persons)
  if (persons !== undefined) {
    let malesCount = persons.filter((item) => item.sex === "M").length;
    let femalesCount = persons.length - malesCount;

    let circleWrapper = document.createElement("div");
    circleWrapper.classList.add("circle-wrapper");
    circleWrapper.style.width = `${
      (femalesCount > malesCount ? femalesCount : malesCount) * 1.5
    }px`;
    circleWrapper.style.height = `${
      (femalesCount > malesCount ? femalesCount : malesCount) * 1.5
    }px`;

    console.log(`males: ${malesCount}    females: ${femalesCount}`);

    let maleCircle = document.createElement("div");
    maleCircle.classList.add("round", "bloom");
    maleCircle.style.width = `${malesCount * 2.5}px`;
    maleCircle.style.height = `${malesCount * 2.5}px`;
    maleCircle.style.backgroundColor = "#ffff0080";
    maleCircle.style.zIndex = 2;

    let femaleCircle = document.createElement("div");
    femaleCircle.classList.add("round", "bloom");
    femaleCircle.style.width = `${femalesCount * 2.5}px`;
    femaleCircle.style.height = `${femalesCount * 2.5}px`;
    femaleCircle.style.backgroundColor = "#ffa50080";

    circleWrapper.appendChild(maleCircle);
    circleWrapper.appendChild(femaleCircle);
    circles.appendChild(circleWrapper);
  }

  //umgedreht.forEach(c => circles.appendChild(c));
  htmlCell.appendChild(circles);
}

function drawCircle(persons, htmlCell) {
  let personsCount = 0;
  if (Array.isArray(persons)) {
    personsCount = persons.length;
  }

  let circles = document.createElement("div");
  circles.classList.add("circle");
  circles.style.width = "200px";
  circles.style.height = "150px";
  //circles.style.backgroundColor = 'black';
  circles.style.padding = "5px";
  circles.style.display = "flex";
  circles.style.gridTemplateColumns = "repeat(10, 1fr)";
  circles.style.gridTemplateRows = "repeat(10, 1fr)";
  circles.style.alignContent = "flex-start";
  circles.style.justifyContent = "flex-start";
  circles.style.flexWrap = "wrap-reverse";
  circles.style.gap = "0px";

  let umgedreht = [];
  for (let i = 0; i < personsCount; i++) {
    let mini = document.createElement("div");
    mini.style.transform = "translateY(-900px)";
    mini.style.width = "10px";
    mini.style.height = "10px";
    mini.style.borderRadius = "50%";
    mini.classList.add("drop");
    let delay = (Math.random() * 2).toFixed(2); // you can tweak max value
    mini.style.animationDelay = `${delay}s`;
    if (persons[i].sex == "F") {
      mini.style.backgroundColor = "yellow"; // Rot für Frauen
    } else {
      mini.style.backgroundColor = "orange"; // Gelb für Männer
    }
    circles.appendChild(mini);
    //umgedreht.unshift(mini);
  }
  //umgedreht.forEach(c => circles.appendChild(c));
  htmlCell.appendChild(circles);
}
// gruppieren die variable austauschen

document.querySelector(".button.workday").addEventListener("click", () => {
  console.log("week");
  groupedData = gmynd.groupData(data, ["AlcoholConsumption", "age"]);
  drawDiagram();
  document.querySelector(".button.workday").classList.add("active");
  document.querySelector(".button.weekend").classList.remove("active");
  document.querySelector(".button.health").classList.remove("active");
});

document.querySelector(".button.weekend").addEventListener("click", () => {
  console.log("weekend");

  groupedData = gmynd.groupData(data_walc, ["Weekend", "age"]);
  drawDiagram();
  document.querySelector(".button.weekend").classList.add("active");
  document.querySelector(".button.workday").classList.remove("active");
  document.querySelector(".button.health").classList.remove("active");
});

document.querySelector(".button.health").addEventListener("click", () => {
  console.log("health");

  groupedData = gmynd.groupData(data_health, ["health", "age"]);
  isHealth = true;
  drawDiagram();
  isHealth = false;
  document.querySelector(".button.health").classList.add("active");
  document.querySelector(".button.workday").classList.remove("active");
  document.querySelector(".button.weekend").classList.remove("active");
});

// // fuege einen switch button hinzu das interaktiv ist
// letbutton = document.createElement('button');

// function drawButton() {
//   let button = document.createElement('button');
//   button.innerText = 'Switch View';
//   button.innerText = 'Dalc';
//   button.style.position = 'fixed';
//   button.style.top = '10px';
//   button.style.right = '10px';
//   button.addEventListener('click', () => {
//     // Logik zum Umschalten der Ansicht
//     console.log('Switching view...');
//   });
//   renderer.appendChild(button);
//
