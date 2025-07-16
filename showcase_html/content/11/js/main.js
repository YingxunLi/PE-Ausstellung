let stageHeight, stageWidth, renderer, groupedData, animationTimeout = null;

const colorDarkblue = "#3665A4";
const colorRed = "#d32f2f";
const colorBlack = "#000";

init();

// Zeiche Startdiagramm nach kurzer Verzögerung
setTimeout(drawStartDiagram, 100);

function init() {
  renderer = document.querySelector('#renderer');
  stageWidth = renderer.clientWidth;
  stageHeight = renderer.clientHeight;
  prepareData();
  createCircles();
}

function prepareData() {
  groupedData = gmynd.groupData(data, ['pclass', 'survived']);
}

function createCircles() {
  data.forEach(item => {
    const circle = document.createElement('div');
    circle.className = 'circle';
    circle.style.position = 'absolute';
    circle.style.left = `${Math.random() * (stageWidth - 50)}px`;
    circle.style.top = `${Math.random() * (stageHeight - 50)}px`;
    circle.style.borderRadius = '50%';
    circle.style.backgroundColor = colorBlack;

    circle.addEventListener('mouseover', (event) => {
      const tooltip = document.querySelector('.toolTip');
      const ageText = (item.age === undefined || item.age === null || item.age === "") 
        ? "Age: unknown" 
        : `Age: ${item.age} Jahre`;
      tooltip.innerText = `${item.name}\n${ageText}\nClass: ${item.pclass}`;
      tooltip.style.display = 'block';
      tooltip.style.left = `${event.pageX + 10}px`;
      tooltip.style.top = `${event.pageY + 10}px`;
    });

    circle.addEventListener('mouseleave', () => {
      const tooltip = document.querySelector('.toolTip');
      tooltip.style.display = 'none';
    });

    renderer.appendChild(circle);
    item.element = circle;
  });
}

function drawStartDiagram() {
  if (animationTimeout) clearTimeout(animationTimeout);

  data.forEach(item => {
    if (item.element) {
      item.element.style.display = "block";
      item.element.style.opacity = "1";
    }
  });

  let startX = 300, startY = 160, xCount = Math.round(Math.sqrt(data.length));
  data.forEach((item, index) => {
    let x = startX + (index % xCount) * 20;
    let y = startY + Math.floor(index / xCount) * 20;
    item.element.style.left = `${x}px`;
    item.element.style.top = `${y}px`;
  });
}

// Gender-Button Event
document.getElementById('genderButton').addEventListener('click', function () {
  if (animationTimeout) clearTimeout(animationTimeout);
  document.querySelectorAll('.circle').forEach(circle => circle.classList.add('fastAnimation'));
  this.classList.toggle('active');
  if (!this.classList.contains('active')) data.forEach(item => item.element.style.backgroundColor = colorBlack);
  updateDiagram();
});

document.getElementById('splitButton').addEventListener('click', function () {
  if (animationTimeout) clearTimeout(animationTimeout);

  const ageActive = document.getElementById('ageButton').classList.contains('active');

  document.querySelectorAll('.circle').forEach(circle => {
    if (!ageActive) circle.classList.add('fastAnimation');
    else circle.classList.remove('fastAnimation');
  });


  this.classList.toggle('active');
  if (!this.classList.contains('active')) {
    data.forEach(item => {
      // 
      setTimeout(() => {
        item.element.style.borderWidth = "0px";
      }, 2000)
      item.element.style.backgroundColor = colorBlack;
    });
  }
  updateDiagram();
});

document.getElementById('ageButton').addEventListener('click', function () {
  if (animationTimeout) clearTimeout(animationTimeout);
  document.querySelectorAll('.circle').forEach(circle => circle.classList.remove('fastAnimation'));
  const wasActive = this.classList.contains('active');
  this.classList.toggle('active');
  document.getElementById('classButton').classList.remove('active');
  if (wasActive) drawStartDiagram();
  else updateDiagram();
});

document.getElementById('classButton').addEventListener('click', function () {
  if (animationTimeout) clearTimeout(animationTimeout);
  document.querySelectorAll('.circle').forEach(circle => circle.classList.remove('fastAnimation'));
  const wasActive = this.classList.contains('active');
  this.classList.toggle('active');
  document.getElementById('ageButton').classList.remove('active');
  if (wasActive) drawStartDiagram();
  else updateDiagram();
});

// updateDiagram erweitert:
function updateDiagram() {
  const survivedActive = document.getElementById('splitButton').classList.contains('active');
  const ageActive = document.getElementById('ageButton').classList.contains('active');
  const classActive = document.getElementById('classButton').classList.contains('active');
  const genderActive = document.getElementById('genderButton').classList.contains('active');

  if (ageActive) arrangeByAge();
  else if (classActive) arrangeByClass();
  else drawStartDiagram();

  // Gender-Button: Farbe nach Geschlecht
  if (genderActive) {
    data.forEach(item => {
      item.element.style.backgroundColor = item.sex === "male" ? colorDarkblue : colorRed;
    });
  }

  // Survived-Button: Border je nach Gender-Status
  if (survivedActive) {
    data.forEach(item => {
      if (item.survived === 0) {
        item.element.style.backgroundColor = "transparent";
        item.element.style.border = genderActive
          ? `2px solid ${item.sex === "male" ? colorDarkblue : colorRed}`
          : `2px solid ${colorBlack}`;
      } else {
        // item.element.style.border = "none";
        item.element.style.backgroundColor = genderActive
          ? (item.sex === "male" ? colorDarkblue : colorRed)
          : colorBlack;
      }
    });
  }
}

function splitBySurvived() {
  // Zeige nur den Zustand (Survived/Not Survived) durch Fill/Stroke, keine Sortierung/Positionierung mehr
  data.forEach((item) => {
    if (item.survived === 0) {
      item.element.style.backgroundColor = "transparent";
      if (item.sex === "male") {
        item.element.style.border = `2px solid ${colorDarkblue}`; // dunkelblau
      } else {
        item.element.style.border = `2px solid ${colorRed}`; // rot
      }
    } else {
      item.element.style.border = "none";
      if (item.sex === "male") {
        item.element.style.backgroundColor = colorDarkblue;
      } else {
        item.element.style.backgroundColor = colorRed;
      }
    }
  });
}

function arrangeByAge() {
  const ageGroups = [
    { name: "Zehn", min: 0, max: 10.5 },
    { name: "Zwanzig", min: 10.5, max: 19.5 },
    { name: "Dreißig", min: 20, max: 29.5 },
    { name: "Vierzig", min: 30, max: 39.5 },
    { name: "Fünfzig", min: 40, max: 49.5 },
    { name: "Sechzig", min: 50, max: 59.5 },
    { name: "Siebzig", min: 60, max: 100 },
  ];

  data.forEach(item => {
    const group = ageGroups.find(g => typeof item.age === "number" && item.age >= g.min && item.age <= g.max);
    item.ageGroup = group ? group.name : "Unbekannt";
  });

  const groupOrder = ageGroups.map(g => g.name);
  const grouped = {};
  groupOrder.forEach(name => grouped[name] = []);
  grouped["Unbekannt"] = [];
  data.forEach(item => { if (grouped[item.ageGroup]) grouped[item.ageGroup].push(item); });

  const maxRows = Math.round(Math.sqrt(data.length));
  const spacingX = 20, spacingY = 20, startX = 300, startY = 160;
  if (animationTimeout) clearTimeout(animationTimeout);
  data.forEach(item => { if (item.element) item.element.style.display = "block"; });

  const survivedActive = document.getElementById('splitButton').classList.contains('active');
  let currentX = startX;
  groupOrder.forEach(groupName => {
    let group = grouped[groupName];
    if (!group.length) return;
    if (survivedActive) {
      const survived = group.filter(i => i.survived === 1);
      const notSurvived = group.filter(i => i.survived === 0);
      const cols = Math.ceil(group.length / maxRows);
      const halfRows = Math.ceil(maxRows / 2);
      survived.forEach((item, i) => {
        const x = currentX + (i % cols) * spacingX;
        const y = (startY - 10) + (halfRows * spacingY) - 20 - Math.floor(i / cols) * spacingY;
        item.element.style.left = `${x}px`;
        item.element.style.top = `${y}px`;
        item.element.style.display = "";
      });
      notSurvived.forEach((item, i) => {
        const x = currentX + (i % cols) * spacingX;
        const y = startY + (halfRows * spacingY) + 20 + Math.floor(i / cols) * spacingY;
        item.element.style.left = `${x}px`;
        item.element.style.top = `${y}px`;
        item.element.style.display = "";
      });
    } else {
      group = group.slice().sort((a, b) => b.survived - a.survived || (a.age ?? 0) - (b.age ?? 0));
      const cols = Math.ceil(group.length / maxRows);
      group.forEach((item, i) => {
        const x = currentX + (i % cols) * spacingX;
        const y = startY + Math.floor(i / cols) * spacingY;
        item.element.style.left = `${x}px`;
        item.element.style.top = `${y}px`;
        item.element.style.display = "";
      });
    }
    currentX += Math.ceil(group.length / maxRows) * spacingX + 40;
  });

  // Unbekannte Altersangaben ganz rechts anordnen, als eigenen Block
  const unknownGroup = grouped["Unbekannt"];
  if (unknownGroup.length) {
    const unknownStartX = currentX;
    // Für "Unbekannt" mehr Spalten, damit das Raster breiter ist:
    const unknownCols = Math.ceil(unknownGroup.length / (maxRows / 2)); // <-- geändert
    const halfRows = Math.ceil(maxRows / 2);
    if (survivedActive) {
      const survived = unknownGroup.filter(i => i.survived === 1);
      const notSurvived = unknownGroup.filter(i => i.survived === 0);
      survived.forEach((item, i) => {
        const x = unknownStartX + (i % unknownCols) * spacingX; // <-- geändert
        const y = startY + (halfRows * spacingY) - 20 - Math.floor(i / unknownCols) * spacingY; // <-- geändert
        item.element.style.left = `${x}px`;
        item.element.style.top = `${y}px`;
        item.element.style.display = "";
        item.element.style.opacity = "0.5";
      });
      notSurvived.forEach((item, i) => {
        const x = unknownStartX + (i % unknownCols) * spacingX; // <-- geändert
        const y = startY + (halfRows * spacingY) + 20 + Math.floor(i / unknownCols) * spacingY; // <-- geändert
        item.element.style.left = `${x}px`;
        item.element.style.top = `${y}px`;
        item.element.style.display = "";
        item.element.style.opacity = "0.5";
      });
    } else {
      unknownGroup.forEach((item, i) => {
        const x = unknownStartX + (i % unknownCols) * spacingX; // <-- geändert
        const y = startY + Math.floor(i / unknownCols) * spacingY; // <-- geändert
        item.element.style.left = `${x}px`;
        item.element.style.top = `${y}px`;
        item.element.style.display = "";
        item.element.style.opacity = "0.5";
      });
    }
  }

  // Border/Stroke zurücksetzen, wenn Survived NICHT aktiv ist
  if (!survivedActive) {
    const genderActive = document.getElementById('genderButton').classList.contains('active');
    data.forEach(item => {
      item.element.style.backgroundColor = genderActive
        ? (item.sex === "male" ? colorDarkblue : colorRed)
        : colorBlack;
    });
  }
}

function arrangeByClass() {
  data.forEach(item => item.element.style.opacity = "1");
  const classGroups = ["1", "2", "3"];
  const grouped = { "1": [], "2": [], "3": [] };
  data.forEach(item => { if (grouped[item.pclass]) grouped[item.pclass].push(item); });

  const maxRows = Math.round(Math.sqrt(data.length));
  const spacingX = 20, spacingY = 20, startX = 300, startY = 160;
  if (animationTimeout) clearTimeout(animationTimeout);
  data.forEach(item => { if (item.element) item.element.style.display = "block"; });

  let currentX = startX;
  classGroups.forEach(className => {
    let group = grouped[className];
    if (!group.length) return;
    group = group.slice().sort((a, b) => b.survived - a.survived || (a.age ?? 0) - (b.age ?? 0));
    const cols = Math.ceil(group.length / maxRows);
    group.forEach((item, i) => {
      const x = currentX + (i % cols) * spacingX;
      const y = startY + Math.floor(i / cols) * spacingY;
      item.element.style.left = `${x}px`;
      item.element.style.top = `${y}px`;
      item.element.style.display = "";
    });
    currentX += Math.ceil(group.length / maxRows) * spacingX + 40;
  });

  // Border/Stroke zurücksetzen, wenn Survived NICHT aktiv ist
  const survivedActive = document.getElementById('splitButton').classList.contains('active');
  if (!survivedActive) {
    const genderActive = document.getElementById('genderButton').classList.contains('active');
    data.forEach(item => {
      item.element.style.backgroundColor = genderActive
        ? (item.sex === "male" ? colorDarkblue : colorRed)
        : colorBlack;
    });
  }
}
