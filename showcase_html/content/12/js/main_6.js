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
    header = allLines[0].split(';');
    countryIdx = header.indexOf('country');
    ageIdx = header.indexOf('age');
    suicidesIdx = header.indexOf('suicides_no');
    yearIdx = header.indexOf('year');
    gdpPerCapitaIdx = header.indexOf('gdp_per_capita ($)');
    generationIdx = header.indexOf('generation');
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

        if (!countryAgesSuicides[countries[i]]) continue;
    const ages = countryAges[countries[i]];

    if (showGender) {
      const male = countryAgesSuicides[countries[i]].male || 0;
      const female = countryAgesSuicides[countries[i]].female || 0;
      let innerSex = 'male', outerSex = 'female';
      if (female > male) { innerSex = 'female'; outerSex = 'male'; }
      const values = [
        { sex: innerSex, suicides: countryAgesSuicides[countries[i]][innerSex] || 0, pos: 1 },
        { sex: outerSex, suicides: countryAgesSuicides[countries[i]][outerSex] || 0, pos: 2 }
      ];
      const maxSuicides = Math.max(male, female, 1);

      values.forEach(({ sex, suicides, pos }) => {
  if (suicides === 0) return;
  let minSize = 1;
  let maxSize = 18;
  let size = minSize;
  if (suicides > 0) {
    size = minSize + (Math.log10(suicides + 1) / Math.log10(maxSuicides + 1)) * (maxSize - minSize);
  }
  const x = baseX + Math.cos(angle) * abstand * pos;
  const y = baseY + Math.sin(angle) * abstand * pos;
  const ageDot = document.createElement('div');
  ageDot.classList.add('dot');
  ageDot.style.position = 'absolute';
  ageDot.style.left = `${x - size / 2}px`;
  ageDot.style.top = `${y - size / 2}px`;
  ageDot.style.width = `${size}px`;
  ageDot.style.height = `${size}px`;
  let color;
  if (sex === 'male') {
    color = 'rgb(0,120,255)';
  } else {
    color = 'rgb(255,0,180)';
  }
  ageDot.style.background = color;
  ageDot.style.borderRadius = '50%';
  ageDot.setAttribute('data-country', countries[i]);
  ageDot.setAttribute('data-sex', sex);
  ageDot.setAttribute('data-suicides', suicides);
  renderer.appendChild(ageDot);
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

renderer.addEventListener('mousemove', function (e) {
  const target = e.target;
  if (target.classList.contains('dot')) {
    const country = target.getAttribute('data-country');
    const age = target.getAttribute('data-age');
    const suicides = target.getAttribute('data-suicides');
    const gdp = target.getAttribute('data-gdp');
    const sex = target.getAttribute('data-sex'); // <-- hier!
    let html = '';
    if (country) html += `<b>Land:</b> ${country}<br>`;
    if (age) html += `<b>Altersgruppe:</b> ${age}<br>`;
    if (sex) html += `<b>Geschlecht:</b> ${sex}<br>`; // <-- hier!
    if (suicides) html += `<b>Suizide:</b> ${suicides}`;
    if (gdp && !age) html += `<b>GDP per Capita:</b> ${gdp}`;
    tooltip.innerHTML = html;
    tooltip.style.left = (e.clientX + 15) + 'px';
    tooltip.style.top = (e.clientY + 15) + 'px';
    tooltip.style.display = 'block';
  } else {
    tooltip.style.display = 'none';
  }
});