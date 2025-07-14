let stageHeight;
let stageWidth;
let renderer;
let groupedData;
let toggleView = "bubble"; // 'bar' or 'bubble'
let colors = chroma.scale(['#ff2d7f', '#ff9900', '#ffff00']).mode('lab').colors(10); // #ff2d7f = Pink, #ff9900 = Orange, #ffff00 = Gelb

init();

function init() {
  renderer = document.querySelector('#renderer');
  stageWidth = renderer.clientWidth;
  stageHeight = renderer.clientHeight;
  prepareData();

  // Zuerst NUR Bubble-Chart anzeigen
  drawBubbleChart(window.data, 'bubble-chart');
  let barChart = document.querySelector('.bar-chart');
  if (barChart) barChart.style.display = 'none';
  let bubbleChart = document.querySelector('.bubble-chart');
  if (bubbleChart) bubbleChart.style.display = 'grid';

  // Event Listener für den Button zum Wechseln der Diagrammansicht
  const viewButtonAge = document.querySelector('.viewButton.age');
  const viewButtonStress = document.querySelector('.viewButton.stress');

  viewButtonAge.addEventListener('click', () => {
    viewButtonStress.classList.remove('active');
    viewButtonAge.classList.add('active');
    if (bubbleChart) bubbleChart.style.display = 'none';
    if (barChart) barChart.style.display = 'grid';
    drawDiagram();
  });
  viewButtonStress.addEventListener('click', () => {
    viewButtonAge.classList.remove('active');
    viewButtonStress.classList.add('active');
    if (barChart) barChart.style.display = 'none';
    if (bubbleChart) bubbleChart.style.display = 'grid';
    drawBubbleChart(window.data, 'bubble-chart');
  });

}

function prepareData() {
  // console.log(data)
}

function drawDiagram() {
  if (!window.data) return;
  // console.log(window.data);
  const data = window.data;

  // Stelle sicher, dass das Diagramm in #renderer eingefÃ¼gt wird
  let renderer = document.getElementById('renderer');
  let container = renderer.querySelector('.bar-chart');
  if (!container) {
    container = document.createElement('div');
    container.classList.add('bar-chart');
    renderer.appendChild(container);
  }
  container.innerHTML = ''; // lÃ¶scht diagramm immer wieder

  const ageGroups = [
    { label: "55-64", min: 55, max: 64 },
    { label: "46-54", min: 46, max: 54 },
    { label: "37-45", min: 37, max: 45 },
    { label: "28-36", min: 28, max: 36 },
    { label: "18-27", min: 18, max: 27 },
  ];

  const genders = ["Female", "Male", "Other"];

  ageGroups.forEach(group => {
    const row = document.createElement('div');
    row.classList.add('row');

    const ageLabel = document.createElement('div');
    ageLabel.classList.add('age-label');
    ageLabel.textContent = group.label;
    row.appendChild(ageLabel);

    genders.forEach(gender => {
      const barGroup = document.createElement('div');
      barGroup.classList.add('bar-group');

      // Filter die Daten fÃ¼r dieses Alter und Geschlecht
      const filtered = data.filter(d =>
        d.Gender === gender &&
        d.Age >= group.min &&
        d.Age <= group.max
      );

      const levelCounts = {};
      filtered.forEach(entry => {
        const level = entry["Anxiety Level (1-10)"];
        levelCounts[level] = (levelCounts[level] || 0) + 1;
      });

      for (let level = 1; level <= 10; level++) {
        const count = levelCounts[level] || 0;
        const bar = document.createElement('div');
        bar.classList.add('bar', `level${level}`);
        bar.title = `Anxiety Level ${level}\nGender: ${gender}\nAge: ${group.label} – ${count} Person${count !== 1 ? 'en' : ''}`;
        const max = 50;
        const unit = 1.9;
        const width = count * unit;
        bar.style.width = `${width}px`;
        bar.style.backgroundColor = colors[level - 1]; // <--- Farbe anwenden!
        bar.addEventListener('mouseenter', () => {
          console.log(`Anxiety Level ${level}\nGender: ${gender}\nAge: ${group.label} – ${count} Person${count !== 1 ? 'en' : ''}`);
        });
        barGroup.appendChild(bar);
      }

      row.appendChild(barGroup);
    });

    container.appendChild(row);
  });
  // X-Achse (Gender)
  const xAxis = document.createElement('div');
  xAxis.classList.add('x-axis');

  const emptySpace = document.createElement('div');
  emptySpace.classList.add('age-label');
  xAxis.appendChild(emptySpace);

  const genderLabels = ['Female', 'Male', 'Other']; // Erstes Element leer fÃ¼r Alterslabel-Spalte

  const genderLabelsContainer = document.createElement('div');
  genderLabelsContainer.className = 'gender-labels';

  genderLabels.forEach(label => {
    const div = document.createElement('div');
    div.textContent = label;
    genderLabelsContainer.appendChild(div);
  });
  xAxis.appendChild(genderLabelsContainer);
  container.appendChild(xAxis);
}

function drawBubbleChart(dataset = window.data, chartClass = 'bubble-chart') {
  const renderer = document.getElementById('renderer');
  let container = renderer.querySelector(`.${chartClass}`);
  if (!container) {
    container = document.createElement('div');
    container.classList.add(chartClass);
    renderer.appendChild(container);
  }
  container.innerHTML = '';
  container.style.height = `${renderer.clientHeight}px`;

  const stressLevels = Array.from({ length: 10 }, (_, i) => i + 1);  // 1 bis 10

  const anxietyLevels = Array.from({ length: 10 }, (_, i) => 10 - i);  // Also: 10 bis 1

  const maxCount = Math.max(...stressLevels.flatMap(stress =>
    anxietyLevels.map(anxiety => dataset.filter(d =>
      d["Stress Level (1-10)"] === stress &&
      d["Anxiety Level (1-10)"] === anxiety
    ).length)
  ));

  const chart = document.createElement('div');
  chart.classList.add('bubble-grid');

  anxietyLevels.forEach(level => {
    if (level === 0) return;  // ← Skip wenn level = 0

    const row = document.createElement('div');
    row.classList.add('bubble-row');

    const levelLabel = document.createElement('div');
    levelLabel.classList.add('y-label');
    levelLabel.textContent = (level % 2 === 0) ? level : '';
    row.appendChild(levelLabel);

    const stressLabelsContainer = document.createElement('div');
    stressLabelsContainer.className = 'stresslevel-labels';

    stressLevels.forEach(stress => {
      const cell = document.createElement('div');
      cell.classList.add('bubble-cell');

      // Leere Zelle unten links
      if (level === 0 && stress === 0) {
        row.appendChild(cell);
        return;
      }

      const count = dataset.filter(d =>
        d["Stress Level (1-10)"] === stress &&
        d["Anxiety Level (1-10)"] === level
      ).length;

      if (count > 20) {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble', `level${level}`);

        const unit = 0.3;  // ← Hier bestimmst du, wie stark jeder einzelne „Count“ die Bubble wachsen lässt
        const size = count * unit;//  bubble.style.width = `${size}px`;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.backgroundColor = colors[level - 1];
        bubble.title = `Stress Level: ${stress}\nAnxiety Level: ${level}\nCount: ${count}`;
        cell.appendChild(bubble);
      }

      row.appendChild(cell);
    });

    chart.appendChild(row);
  });

  // X-Achse Beschriftung (Stress Levels)
  const xAxis = document.createElement('div');
  xAxis.classList.add('bubble-x-axis');

  const stressLabelsContainer = document.createElement('div');
  stressLabelsContainer.className = 'stresslevel-labels';

  // Leeres erstes Div für die Y-Achsen-Lücke
  const emptyDiv = document.createElement('div');
  stressLabelsContainer.appendChild(emptyDiv);

  // Danach die Stress-Level-Labels 1–10
  stressLevels.forEach(stress => {
    const div = document.createElement('div');
    div.textContent = stress;
    stressLabelsContainer.appendChild(div);
  });

  xAxis.appendChild(stressLabelsContainer);
  container.appendChild(chart);
  container.appendChild(xAxis);
}
