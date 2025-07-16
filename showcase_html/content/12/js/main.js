const slider = document.getElementById("slider");
const sliderTrack = document.getElementById("slider-track");
const sliderLeft = document.getElementById("slider-left");
const sliderRight = document.getElementById("slider-right");

let sliderMinValue = 1985;
let sliderMaxValue = 2015;
let sliderValue = sliderMinValue;
let dragging = false;
let offsetX = 0;

let sliderMinX = 0;
let sliderMaxX = 0;

function initSlider() {
  sliderMinX = 0;
  sliderMaxX = sliderTrack.offsetWidth - slider.offsetWidth;
  updateSliderPosition();
}

function updateSliderPosition() {
  let sliderRange = sliderMaxX - sliderMinX;
  let sliderValueRange = sliderMaxValue - sliderMinValue;
  let sliderPosition = ((sliderValue - sliderMinValue) / sliderValueRange) * sliderRange;
  slider.style.left = sliderPosition + "px";
  slider.innerHTML = sliderValue;
}

slider.addEventListener("mousedown", function (event) {
  offsetX = event.offsetX;
  dragging = true;
});

window.addEventListener("mousemove", function (event) {
  if (!dragging) return;
  let trackRect = sliderTrack.getBoundingClientRect();
  let moveX = event.clientX - trackRect.left - offsetX;
  if (moveX < sliderMinX) moveX = sliderMinX;
  if (moveX > sliderMaxX) moveX = sliderMaxX;

  let sliderRange = sliderMaxX - sliderMinX;
  let sliderValueRange = sliderMaxValue - sliderMinValue;
  sliderValue = Math.round(
    ((moveX - sliderMinX) * sliderValueRange) / sliderRange + sliderMinValue
  );
  updateSliderPosition();
  drawForYear(sliderValue);
});

window.addEventListener("mouseup", function () {
  dragging = false;
});

sliderLeft.addEventListener('click', function () {
  if (sliderValue > sliderMinValue) {
    sliderValue--;
    updateSliderPosition();
    drawForYear(sliderValue);
  }
});

sliderRight.addEventListener('click', function () {
  if (sliderValue < sliderMaxValue) {
    sliderValue++;
    updateSliderPosition();
    drawForYear(sliderValue);
  }
});

window.addEventListener("load", function () {
  initSlider();
});

// ... ab hier kommt dein fetch(...) und der Rest deines Codes ...
const renderer = document.querySelector('#renderer');
const stageHeight = renderer.clientHeight;
const stageWidth = renderer.clientWidth;

const genderCheckbox = document.getElementById('genderCheckbox');
const suicidesCheckbox = document.getElementById('suicidesCheckbox');
const generationCheckbox = document.getElementById('generationCheckbox');
suicidesCheckbox.addEventListener('change', function () {
  // Verhindere, dass alle Checkboxen aus sind
  if (!suicidesCheckbox.checked && !genderCheckbox.checked && !generationCheckbox.checked) {
    suicidesCheckbox.checked = true;
    return;
  }
  if (suicidesCheckbox.checked) {
    genderCheckbox.checked = false;
    generationCheckbox.checked = false;
  }
  drawForYear(sliderValue);
});

genderCheckbox.addEventListener('change', function () {
  if (!genderCheckbox.checked && !suicidesCheckbox.checked && !generationCheckbox.checked) {
    genderCheckbox.checked = true;
    return;
  }
  if (genderCheckbox.checked) {
    suicidesCheckbox.checked = false;
    generationCheckbox.checked = false;
  }
  drawForYear(sliderValue);
});

generationCheckbox.addEventListener('change', function () {
  if (!generationCheckbox.checked && !suicidesCheckbox.checked && !genderCheckbox.checked) {
    generationCheckbox.checked = true;
    return;
  }
  if (generationCheckbox.checked) {
    suicidesCheckbox.checked = false;
    genderCheckbox.checked = false;
  }
  drawForYear(sliderValue);
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
    drawForYear(sliderMinValue); // oder den Startwert deines neuen Sliders
  });

function drawForYear(selectedYear) {
  const showGender = genderCheckbox && genderCheckbox.checked;
  const showGeneration = generationCheckbox && generationCheckbox.checked;

  if (showGeneration) {
    // GDP-Daten für alle Länder im ausgewählten Jahr sammeln
    const lines = allLines.slice(1).filter(line => {
      const cols = line.split(';');
      return Number(cols[yearIdx]) === selectedYear;
    });

    const countryGDP = {};
    let minGDP = Infinity, maxGDP = -Infinity;
    lines.forEach(line => {
      const cols = line.split(';');
      const country = cols[countryIdx].trim();
      const gdp = Number(cols[gdpPerCapitaIdx].replace(/\s/g, ''));
      if (!countryGDP[country] && gdp > 0) {
        countryGDP[country] = gdp;
        if (gdp < minGDP) minGDP = gdp;
        if (gdp > maxGDP) maxGDP = gdp;
      }
    });

    const countries = allCountries.slice(0, 100);
    drawCountryGDPRow(countries, countryGDP, minGDP, maxGDP);
    return;
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
    const ageOrder = ['15-24 years', '25-34 years', '35-54 years', '55-74 years', '75+ years'];
    countries.forEach(country => {
      if (countryAgesSuicides[country]) {
        countryAges[country] = ageOrder.filter(age => countryAgesSuicides[country][age] !== undefined);
      } else {
        countryAges[country] = [];
      }
    });
  }
  // <-- drawSunburst muss HIER stehen, nicht im else!
  drawSunburst(countries, countryAges, countryAgesSuicides, countryGDP, minGDP, maxGDP, showGender);
}

function drawSunburst(countries, countryAges, countryAgesSuicides, countryGDP, minGDP, maxGDP, showGender) {
  const headerOffset = document.querySelector('.header-row')?.offsetHeight || 120; // Fallback falls nicht gefunden
  renderer.innerHTML = '';
  const centerX = stageWidth / 2;
  const centerY = headerOffset + (stageHeight - headerOffset) / 2.1; // 1.9 ist ein Faktor, um die Mitte etwas höher zu setzen
  const totalPoints = countries.length;
  const strahlLength = 5;
  const abstand = 40;
  const radius = Math.min(stageWidth, stageHeight - headerOffset) / 4; // Passe den Divisor ggf. an

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
    const landCircleSize = 20;
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
      tooltip.innerHTML = `<b>Country:</b> ${countries[i]}<br><b>GDP per Capita:</b> ${gdp}`;
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
      if (female > male) { innerSex = 'female'; outerSex = 'male'; }
      const maxSuicides = Math.max(male, female, 1);

      const ovalWidth = 20;
      const maxLength = 190; // Die Gesamtlänge, die aufgeteilt wird
      const maleColor = colorScale(0.00).hex();    // kräftiges Blau
      const femaleColor = colorScale(0.44).hex();   
      const sum = male + female;
      const lengths = sum > 0
        ? [
          (male / sum) * maxLength,
          (female / sum) * maxLength
        ]
        : [0, 0];

      const fixedGap = 3;
      const ovalOffset = 20 + lengths[0] / 2;
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
        oval.style.borderRadius = `5px`;
        oval.style.transform = `rotate(${angle * 180 / Math.PI}deg)`;
        oval.setAttribute('data-country', countries[i]);
        oval.setAttribute('data-sex', sex);
        oval.setAttribute('data-suicides', suicides);
        oval.onmouseenter = e => {
          tooltip.innerHTML = `<b>${sex === 'male' ? 'Male' : 'Female'}:</b> ${suicides} suicides`;
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
        let size = 23;
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
          tooltip.innerHTML = `<b>Country:</b> ${countries[i]}<br><b>Age group:</b> ${age}<br><b>Suicides:</b> ${suicides}`;
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

function drawCountryGDPRow(countries, countryGDP, minGDP, maxGDP) {
  const headerOffset = document.querySelector('.header-row')?.offsetHeight || 120;
  const circleSize = 15;
  const padding = 150;

  // Suizide pro 100k Einwohner pro Land berechnen
  const countrySuicidesPer100k = {};
  let minSuicidesPer100k = Infinity, maxSuicidesPer100k = -Infinity;
  allLines.slice(1).forEach(line => {
    const cols = line.split(';');
    const country = cols[countryIdx].trim();
    const year = Number(cols[yearIdx]);
    if (!countries.includes(country)) return;
    if (year !== Number(sliderValue)) return;
    const suicidesPer100k = Number(String(cols[header.indexOf('suicides/100k pop')]).replace(',', '.'));
    if (!isNaN(suicidesPer100k)) {
      if (!countrySuicidesPer100k[country]) countrySuicidesPer100k[country] = 0;
      countrySuicidesPer100k[country] += suicidesPer100k;
      if (countrySuicidesPer100k[country] < minSuicidesPer100k) minSuicidesPer100k = countrySuicidesPer100k[country];
      if (countrySuicidesPer100k[country] > maxSuicidesPer100k) maxSuicidesPer100k = countrySuicidesPer100k[country];
    }
  });

  // Merke, welche Länder dieses Jahr angezeigt werden
  const activeCountries = new Set();

  countries.forEach(country => {
    const gdp = countryGDP[country];
    const suicidesPer100k = countrySuicidesPer100k[country] || 0;
    if (!gdp || !suicidesPer100k) return;

    // X-Achse: Suizide pro 100k
    const x = padding + ((suicidesPer100k - minSuicidesPer100k) / (maxSuicidesPer100k - minSuicidesPer100k)) * (renderer.clientWidth - 2 * padding);

    // Diagramm nicht über Überschrift zeichnen>)
    const availableHeight = renderer.clientHeight - headerOffset;
    const y = headerOffset + availableHeight - padding - ((gdp - minGDP) / (maxGDP - minGDP)) * (availableHeight - 1.8 * padding);

    const dotId = 'dot-' + country.replace(/\s/g, '_');
    let dot = document.getElementById(dotId);

    if (!dot) {
      dot = document.createElement('div');
      dot.classList.add('dot');
      dot.id = dotId;
      dot.setAttribute('data-country', country);

      dot.addEventListener('mouseenter', function (e) {
        tooltip.innerHTML = `<b>Country:</b> ${country}<br><b>GDP per Capita:</b> ${gdp}<br><b>Suicides per 100k:</b> ${suicidesPer100k.toFixed(2)}`;
        tooltip.style.left = (e.clientX + 15) + 'px';
        tooltip.style.top = (e.clientY + 15) + 'px';
        tooltip.style.display = 'block';
      });
      dot.addEventListener('mouseleave', function () {
        tooltip.style.display = 'none';
      });

      renderer.appendChild(dot);
    }

    // Update Position und Größe (wird animiert durch CSS)
    dot.style.position = 'absolute';
    dot.style.left = `${x - circleSize / 2}px`;
    dot.style.top = `${y - circleSize / 2}px`;
    dot.style.width = `${circleSize}px`;
    dot.style.height = `${circleSize}px`;
    dot.style.background = colorScale(0.2).hex();
    dot.style.borderRadius = '50%';
    dot.style.display = 'block';

    activeCountries.add(dotId);
  });

  // Alle nicht mehr benötigten Punkte ausblenden
  Array.from(renderer.children).forEach(child => {
    if (child.classList.contains('dot') && !activeCountries.has(child.id)) {
      child.style.display = 'none';
    }
  });
}

// document.getElementById('slider-left').addEventListener('click', function () {
//   if (sliderValue > sliderMinValue) {
//     sliderValue--;
//     updateSliderPosition();
//     drawForYear(sliderValue);
//   }
// });

// document.getElementById('slider-right').addEventListener('click', function () {
//   if (sliderValue < sliderMaxValue) {
//     sliderValue++;
//     updateSliderPosition();
//     drawForYear(sliderValue);
//   }
// });

// // Funktion, um die Position des Sliders nach Klick zu aktualisieren
// function updateSliderPosition() {
//   let sliderRange = sliderMaxX - sliderMinX;
//   let sliderValueRange = sliderMaxValue - sliderMinValue;
//   let sliderPosition = ((sliderValue - sliderMinValue) / sliderValueRange) * sliderRange;
//   let moveOffsetX = sliderPosition;
//   slider.style.left = moveOffsetX + "px";
//   slider.innerHTML = sliderValue;
// }