const renderer = document.querySelector('#renderer');
const stageHeight = renderer.clientHeight;
const stageWidth = renderer.clientWidth;
const yearSlider = document.getElementById('yearSlider');
const yearLabel = document.getElementById('yearLabel');
const genderCheckbox = document.getElementById('genderCheckbox');
const generationCheckbox = document.getElementById('generationCheckbox');
genderCheckbox.addEventListener('change', function () {
  drawForYear(Number(yearSlider.value));
});
generationCheckbox.addEventListener('change', function () {
  drawForYear(Number(yearSlider.value));
});

let allLines = [];
let header = [];
let countryIdx, ageIdx, suicidesIdx, yearIdx, gdpPerCapitaIdx, generationIdx;
let allCountries = [];

let colorScale = chroma.scale(['#0066bb', '#990099', '#ffff00']).domain([0, 0.2, 1]).mode('lch');
// console.log("Color scale initialized:", colorScale(0.5).hex());
fetch('data/Suicides_Tabelle.csv')
  .then(response => response.text())
  .then(csvText => {
    allLines = csvText.trim().split('\n');
    header = allLines[0].split(';').map(h => h.replace(/"/g, '').trim());
    header.forEach((h, i) => console.log(i, JSON.stringify(h)));

    countryIdx = header.indexOf('country');
    ageIdx = header.indexOf('age');
    suicidesIdx = header.indexOf('suicides_no');
    yearIdx = header.indexOf('year');
    gdpPerCapitaIdx = header.indexOf('gdp_per_capita ($)');
    generationIdx = header.indexOf('generation');

    console.log('generationIdx:', generationIdx, 'suicidesIdx:', suicidesIdx, 'yearIdx:', yearIdx);
    const countrySet = new Set();
    allLines.slice(1).forEach(line => {
      const cols = line.split(';');
      countrySet.add(cols[countryIdx].trim());
    });
    allCountries = Array.from(countrySet).sort();
    drawForYear(Number(yearSlider.value));
  });

yearSlider.addEventListener('input', function () {
  yearLabel.textContent = yearSlider.value;
  drawForYear(Number(yearSlider.value));
});

function drawForYear(selectedYear) {
  const showGender = genderCheckbox && genderCheckbox.checked;
  const showGeneration = generationCheckbox && generationCheckbox.checked;

  if (showGeneration) {
    // 1. Generationen definieren (ggf. anpassen)
    const generations = ['Silent', 'Boomers', 'Generation X', 'Millenials'];

    // 2. Suizide pro Generation im ausgewählten Jahr berechnen
    const generationSuicides = {};
    allLines.slice(1).forEach(line => {
      const cols = line.split(';');
      if (!cols[generationIdx] || !cols[yearIdx]) return;
      if (Number(cols[yearIdx]) !== selectedYear) return;
      const generation = cols[generationIdx].trim();
      const suicides = Number(cols[suicidesIdx].replace(/\s/g, ''));
      if (!generationSuicides[generation]) generationSuicides[generation] = 0;
      generationSuicides[generation] += suicides;
    });

    // 3. Visualisierung zeichnen
    drawGenerationBarCircles(generations, generationSuicides);
    return; // Rest der Funktion überspringen
  }

  const lines = allLines.slice(1).filter(line => {
    const cols = line.split(';');
    return Number(cols[yearIdx]) === selectedYear;
  });

  const countryGDP = {};
  const countryAgesSuicides = {};
  let minGDP = Infinity, maxGDP = -Infinity;
  lines.forEach(line => {
    const cols = line.split(';');
    const country = cols[countryIdx].trim();
    const age = cols[ageIdx].trim();
    const suicides = Number(cols[suicidesIdx].replace(/\s/g, ''));
    const gdp = Number(cols[gdpPerCapitaIdx].replace(/\s/g, ''));
    const sex = cols[header.indexOf('sex')].trim();
    if (showGender) {
      if (!countryAgesSuicides[country]) countryAgesSuicides[country] = {};
      if (!countryAgesSuicides[country][sex]) countryAgesSuicides[country][sex] = 0;
      countryAgesSuicides[country][sex] += suicides;
    } else {
      if (!countryAgesSuicides[country]) countryAgesSuicides[country] = {};
      if (!countryAgesSuicides[country][age]) countryAgesSuicides[country][age] = 0;
      countryAgesSuicides[country][age] += suicides;
    }
    if (!countryGDP[country] && gdp > 0) {
      countryGDP[country] = gdp;
      if (gdp < minGDP) minGDP = gdp;
      if (gdp > maxGDP) maxGDP = gdp;
    }
  });

  const countries = allCountries.slice(0, 100);
  let countryAges = {};
  if (showGender) {
    countries.forEach(country => {
      countryAges[country] = ['male', 'female'];
    });
  } else {
    countries.forEach(country => {
      countryAges[country] = countryAgesSuicides[country]
        ? Object.keys(countryAgesSuicides[country]).slice(0, 5)
        : [];
    });
  }

  drawSunburst(countries, countryAges, countryAgesSuicides, countryGDP, minGDP, maxGDP, showGender);
}
console.log("drawForYear function called");

function drawSunburst(countries, countryAges, countryAgesSuicides, countryGDP, minGDP, maxGDP, showGender) {
  renderer.innerHTML = '';
  const centerX = stageWidth / 2;
  const centerY = stageHeight / 2;
  const radius = Math.min(stageWidth, stageHeight) / 4;
  const totalPoints = countries.length;
  const strahlLength = 5;
  const abstand = 18;

  let globalMaxMale = 0, globalMaxFemale = 0;
  countries.forEach(country => {
    if (!countryAgesSuicides[country]) return;
    globalMaxMale = Math.max(globalMaxMale, countryAgesSuicides[country].male || 0);
    globalMaxFemale = Math.max(globalMaxFemale, countryAgesSuicides[country].female || 0);
  });

  let maxSuicides = 0;
  countries.forEach(country => {
    if (!countryAgesSuicides[country]) return;
    countryAges[country].forEach(age => {
      const val = countryAgesSuicides[country][age] || 0;
      if (val > maxSuicides) maxSuicides = val;
    });
  });

  for (let i = 0; i < totalPoints; i++) {
    const angle = (2 * Math.PI * i) / totalPoints;
    const baseX = centerX + Math.cos(angle) * radius;
    const baseY = centerY + Math.sin(angle) * radius;

    // Land-Kreis
    const dot = document.createElement('div');
    dot.classList.add('dot');
    dot.style.position = 'absolute';
    const landCircleSize = 10;
    dot.style.left = `${baseX - landCircleSize / 2}px`;
    dot.style.top = `${baseY - landCircleSize / 2}px`;
    dot.style.width = `${landCircleSize}px`;
    dot.style.height = `${landCircleSize}px`;
    const gdp = countryGDP[countries[i]];
    let t = 0;
    if (maxGDP > minGDP && gdp) {
      t = (gdp - minGDP) / (maxGDP - minGDP);
    }
    const val = Math.round(60 + t * (255 - 60));
    dot.style.background = `rgb(${val},${val},${val})`;
    dot.style.borderRadius = '50%';
    dot.setAttribute('data-country', countries[i]);
    dot.setAttribute('data-gdp', gdp);
    renderer.appendChild(dot);

    dot.addEventListener('mouseenter', function (e) {
      tooltip.innerHTML = `<b>Land:</b> ${countries[i]}<br><b>GDP per Capita:</b> ${gdp}`;
      tooltip.style.left = (e.clientX + 15) + 'px';
      tooltip.style.top = (e.clientY + 15) + 'px';
      tooltip.style.display = 'block';
    });
    dot.addEventListener('mouseleave', function () {
      tooltip.style.display = 'none';
    });

    if (!countryAgesSuicides[countries[i]]) continue;
    const ages = countryAges[countries[i]];

    // ...existing code...
    if (showGender) {
      const male = countryAgesSuicides[countries[i]].male || 0;
      const female = countryAgesSuicides[countries[i]].female || 0;
      let innerSex = 'male', outerSex = 'female';
      if (female > male) { innerSex = 'female'; outerSex = 'male'; }
      const values = [
        { sex: innerSex, suicides: countryAgesSuicides[countries[i]][innerSex] || 0 },
        { sex: outerSex, suicides: countryAgesSuicides[countries[i]][outerSex] || 0 }
      ];
      const maxSuicides = Math.max(male, female, 1);

const ovalWidth = 12;
const maxLength = 90; // Die Gesamtlänge, die aufgeteilt wird

const maleColor = colorScale(0).brighten(0.2).hex();
const femaleColor = chroma(colorScale(0.5)).set('hsl.s', 0.55).hex();

const sum = male + female;
const lengths = sum > 0
  ? [
      (male / sum) * maxLength,
      (female / sum) * maxLength
    ]
  : [0, 0];

const fixedGap = 3;
const ovalOffset = 10 + lengths[0] / 2;
const centerToCenter = (lengths[0] / 2) + fixedGap + (lengths[1] / 2);

['male', 'female'].forEach((sex, idx) => {
  const suicides = sex === 'male' ? male : female;
  if (suicides === 0) return;
  const ovalLength = lengths[idx];
  let posOffset = idx === 0 ? ovalOffset : ovalOffset + centerToCenter;
  const x = baseX + Math.cos(angle) * posOffset;
  const y = baseY + Math.sin(angle) * posOffset;
  const oval = document.createElement('div');
  oval.classList.add('dot');
  oval.style.position = 'absolute';
  oval.style.left = `${x - ovalLength / 2}px`;
  oval.style.top = `${y - ovalWidth / 2}px`;
  oval.style.width = `${ovalLength}px`;
  oval.style.height = `${ovalWidth}px`;
  oval.style.background = sex === 'male' ? maleColor : femaleColor;
  oval.style.borderRadius = `${ovalWidth / 2}px / ${ovalLength / 2}px`;
  oval.style.transform = `rotate(${angle * 180 / Math.PI}deg)`;
  oval.setAttribute('data-country', countries[i]);
  oval.setAttribute('data-sex', sex);
  oval.setAttribute('data-suicides', suicides);
  oval.onmouseenter = e => {
    tooltip.innerHTML = `<b>${sex === 'male' ? 'Männlich' : 'Weiblich'}</b><br>${suicides} Suizide`;
    tooltip.style.left = (e.clientX + 15) + 'px';
    tooltip.style.top = (e.clientY + 15) + 'px';
    tooltip.style.display = 'block';
  };
  oval.onmouseleave = () => tooltip.style.display = 'none';
  renderer.appendChild(oval);
});
    } else {
      for (let j = 0; j < strahlLength; j++) {
        const age = ages && ages[j] ? ages[j] : '';
        const suicides = (countryAgesSuicides[countries[i]][age] || 0);
        let size = 15;
        const x = baseX + Math.cos(angle) * abstand * (j + 1);
        const y = baseY + Math.sin(angle) * abstand * (j + 1);

        const ageDot = document.createElement('div');
        ageDot.classList.add('dot');
        ageDot.style.position = 'absolute';
        ageDot.style.left = `${x - size / 2}px`;
        ageDot.style.top = `${y - size / 2}px`;
        ageDot.style.width = `${size}px`;
        ageDot.style.height = `${size}px`;

        // Heatmap: Blau → Türkis → Violett → Pink → Rot
        let t = 0;
        if (maxSuicides > 0) {
          t = Math.pow(suicides / maxSuicides, 0.5);
        }
        let r, g, b;
        if (t < 0.25) {
          const f = t / 0.25;
          r = 0;
          g = Math.round(120 + (255 - 120) * f);
          b = 255;
        } else if (t < 0.5) {
          const f = (t - 0.25) / 0.25;
          r = Math.round(0 + (120 - 0) * f);
          g = Math.round(255 - 255 * f);
          b = 255;
        } else if (t < 0.75) {
          const f = (t - 0.5) / 0.25;
          r = Math.round(120 + (255 - 120) * f);
          g = 0;
          b = 255;
        } else {
          const f = (t - 0.75) / 0.25;
          r = 255;
          g = 0;
          b = Math.round(255 - 255 * f);
        }
        let color = colorScale(t).hex();
        // ageDot.style.background = `rgb(${r},${g},${b})`;
        ageDot.style.background = color;
        ageDot.style.borderRadius = '50%';
        ageDot.setAttribute('data-country', countries[i]);
        ageDot.setAttribute('data-age', age);
        ageDot.setAttribute('data-suicides', suicides);
        renderer.appendChild(ageDot);

        ageDot.addEventListener('mouseenter', function (e) {
          tooltip.innerHTML = `<b>Land:</b> ${countries[i]}<br><b>Altersgruppe:</b> ${age}<br><b>Suizide:</b> ${suicides}`;
          tooltip.style.left = (e.clientX + 15) + 'px';
          tooltip.style.top = (e.clientY + 15) + 'px';
          tooltip.style.display = 'block';
        });
        ageDot.addEventListener('mouseleave', function () {
          tooltip.style.display = 'none';
        });
      }
    }
  }
}
// Tooltip
const tooltip = document.createElement('div');
tooltip.style.position = 'fixed';
tooltip.style.pointerEvents = 'none';
tooltip.style.background = 'rgba(30,30,30,0.95)';
tooltip.style.color = '#fff';
tooltip.style.padding = '6px 12px';
tooltip.style.borderRadius = '6px';
tooltip.style.fontSize = '14px';
tooltip.style.zIndex = '9999';
tooltip.style.display = 'none';
document.body.appendChild(tooltip);

function drawGenerationBarCircles(generations, generationSuicides) {
  renderer.innerHTML = '';
  const genRadius = 36;
  const squareSize = 550;
  const centerX = renderer.clientWidth / 2;
  const centerY = renderer.clientHeight / 2;

  // Farben für die Generationen bestimmen
  const genColors = [
    colorScale(0).hex(),
    colorScale(0.28).hex(),
    colorScale(0.66).hex(),
    colorScale(1).hex()
  ];

  // Positionen für ein Quadrat (Viereck)
  const positions = [
    { x: centerX - squareSize / 2, y: centerY - squareSize / 2 }, // oben links
    { x: centerX + squareSize / 2, y: centerY - squareSize / 2 }, // oben rechts
    { x: centerX - squareSize / 2, y: centerY + squareSize / 2 }, // unten links
    { x: centerX + squareSize / 2, y: centerY + squareSize / 2 }  // unten rechts
  ];

  generations.forEach((gen, i) => {
    const color = genColors[i];
    const pos = positions[i];
    // Generationskreis
    const genDot = document.createElement('div');
    genDot.classList.add('dot');
    genDot.style.position = 'absolute';
    genDot.style.left = `${pos.x - genRadius / 2}px`;
    genDot.style.top = `${pos.y - genRadius / 2}px`;
    genDot.style.width = `${genRadius}px`;
    genDot.style.height = `${genRadius}px`;
    genDot.style.background = '#bbb';
    genDot.style.borderRadius = '50%';
    genDot.setAttribute('data-generation', gen);
    genDot.title = gen;
    renderer.appendChild(genDot);

    // Tooltip für Generation
    genDot.addEventListener('mouseenter', function (e) {
      tooltip.innerHTML = `<b>Generation:</b> ${gen}`;
      tooltip.style.left = (e.clientX + 15) + 'px';
      tooltip.style.top = (e.clientY + 15) + 'px';
      tooltip.style.display = 'block';
    });
    genDot.addEventListener('mouseleave', function () {
      tooltip.style.display = 'none';
    });

    // Kleine Kreise für 1000 Suizide, zufällig um den Generationskreis
    const suicides = generationSuicides[gen] || 0;
    const numSuicideDots = Math.floor(suicides / 1000);
    const suicideRadius = genRadius * 0.8 + 24; // Abstand vom Mittelpunkt, nach Geschmack anpassen
    const dotRadius = 14;

    for (let k = 0; k < numSuicideDots; k++) {
      // Zufälliger Winkel für die Platzierung
      const angle = Math.random() * 2 * Math.PI;
      // Optional: leicht zufälligen Abstand, damit es nicht zu regelmäßig aussieht
      const r = suicideRadius + (Math.random() - 0.5) * 18;
      const x = pos.x + Math.cos(angle) * r;
      const y = pos.y + Math.sin(angle) * r;

      const suicideDot = document.createElement('div');
      suicideDot.classList.add('dot');
      suicideDot.style.position = 'absolute';
      suicideDot.style.left = `${x - dotRadius / 2}px`;
      suicideDot.style.top = `${y - dotRadius / 2}px`;
      suicideDot.style.width = `${dotRadius}px`;
      suicideDot.style.height = `${dotRadius}px`;
      suicideDot.style.background = color;
      suicideDot.style.borderRadius = '50%';
      suicideDot.setAttribute('data-generation', gen);

      suicideDot.onmouseenter = e => {
        tooltip.innerHTML = '1000 Suizide';
        tooltip.style.left = (e.clientX + 15) + 'px';
        tooltip.style.top = (e.clientY + 15) + 'px';
        tooltip.style.display = 'block';
      };
      suicideDot.onmouseleave = () => tooltip.style.display = 'none';

      renderer.appendChild(suicideDot);
    }
  });
}