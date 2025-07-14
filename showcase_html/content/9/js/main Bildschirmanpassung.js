let stageHeight;
let stageWidth;
let mergedData;

let mouseX = 0;
let mouseY = 0;
let currentHeatmapData = [];
let isGrobHeatmap = false;
let globalTooltip = null; // Global tooltip variable
let currentScreen = 1; // 1: Heatmap 1, 2: Heatmap 2, 3: Country Diagram, 4: Bar Chart
let countriesData = null;
let activeCountry = 'USA';
let countryListInitialized = false;

// Globale Variable für die aktuell ausgewählte Target Bar
let selectedTargetBar = null;
let selectedTargetBarData = null;

const bounds = {
  latMin: 34, latMax: 56,
  lonMin: -6, lonMax: 30
};

let activeFilters = {
  yellow: true,
  orange: true,
  red: true
};

// Globale Einstellungen für die Schriftgröße in Target Bars
let TARGET_BAR_FONT_MIN = 16; // px
let TARGET_BAR_FONT_MAX = 28; // px

// Filter-Status für Target Bars auf Screen 3
let targetBarFilter = { yellow: false, orange: false, red: false };

init();

function init() {
  renderer = document.querySelector('#heatmap');
  updateStageSize();
  window.addEventListener('resize', onResize);
  initLegendControls();
  document.querySelectorAll('.screen-switch').forEach(el => {
    el.addEventListener('click', () => {
      const screen = parseInt(el.getAttribute('data-screen'));
      if (!isNaN(screen)) {
        currentScreen = screen;
        loadScreen();
      }
    });
  });
  window.addEventListener('keydown', handleKeyPress);
  
  // Load countries data, then load the initial screen
  fetch('data/countries.json')
    .then(response => response.json())
    .then(data => {
      countriesData = data;
      loadScreen(); // Load screen 1 after data is ready
    });

  console.log(gmynd.groupData(data, 'Aircraft Series'))
}

function initLegendControls() {
  document.querySelectorAll('.legend-text.clickable').forEach(el => {
    el.addEventListener('click', () => {
      const color = el.getAttribute('data-color');
      toggleFilter(color);
      // Filter für Screen 3 (Bar Chart)
      if (currentScreen === 3) {
        // Prüfe für alle drei Bereiche
        ['yellow', 'orange', 'red'].forEach(col => {
          const legendText = document.querySelector('.legend-text[data-color="' + col + '"]');
          targetBarFilter[col] = legendText.classList.contains('disabled');
        });
        drawCountryBarChart();
      }
    });
  });
}

function toggleFilter(color) {
  activeFilters[color] = !activeFilters[color];
  updateLegendCircle(color);
  updateHeatmapPoints();
}

function updateLegendCircle(color) {
  const text = document.querySelector(`.legend-text[data-color="${color}"]`);
  if (activeFilters[color]) {
    text.classList.remove('disabled');
  } else {
    text.classList.add('disabled');
  }
}

function updateHeatmapPoints() {
  const points = document.querySelectorAll('.heatmap-point');
  points.forEach(point => {
    const weight = parseInt(point.getAttribute('data-weight'));
    let shouldShow = false;

    if (weight <= 1000 && activeFilters.yellow) {
      shouldShow = true;
    } else if (weight > 1000 && weight <= 10000 && activeFilters.orange) {
      shouldShow = true;
    } else if (weight > 10000 && activeFilters.red) {
      shouldShow = true;
    }

    point.style.display = shouldShow ? 'block' : 'none';
  });
}

function mapCoords(lat, lon) {
  const x = ((lon - bounds.lonMin) / (bounds.lonMax - bounds.lonMin)) * stageWidth;
  const y = stageHeight - (((lat - bounds.latMin) / (bounds.latMax - bounds.latMin)) * stageHeight); 
  return { x, y };
}

function updateStageSize() {
  stageWidth = renderer.clientWidth;
  stageHeight = renderer.clientHeight;
}

function onResize() {
  updateStageSize();
  drawHeatmap(); // Zeichne die Heatmap neu
}

function handleKeyPress(event) {
  switch (event.key) {
    case '1':
      toggleFilter('yellow');
      break;
    case '2':
      toggleFilter('orange');
      break;
    case '3':
      toggleFilter('red');
      break;
    case ' ': // Leertaste
      event.preventDefault(); // Verhindert Standardverhalten wie Scrollen
      switchScreen();
      break;
    case 'ArrowUp': // Pfeil nach oben
      if (currentScreen === 3 || currentScreen === 4) {
        event.preventDefault();
        navigateCountries('up');
      }
      break;
    case 'ArrowDown': // Pfeil nach unten
      if (currentScreen === 3 || currentScreen === 4) {
        event.preventDefault();
        navigateCountries('down');
      }
      break;
  }
}

function navigateCountries(direction) {
  const countryButtons = document.querySelectorAll('#country-list .country-btn');
  const currentIndex = Array.from(countryButtons).findIndex(btn => btn.classList.contains('active'));
  
  let newIndex;
  if (direction === 'up') {
    newIndex = currentIndex <= 0 ? countryButtons.length - 1 : currentIndex - 1;
  } else {
    newIndex = currentIndex >= countryButtons.length - 1 ? 0 : currentIndex + 1;
  }

  const newButton = countryButtons[newIndex];
  if (newButton) {
    // Simuliere einen Klick auf den Button
    newButton.click();
  }
}

function loadScreen() {
  const legendMenu = document.getElementById('heatmap-legend');
  const countryMenu = document.getElementById('country-menu');
  const legendWeight = document.getElementById('legend-weight');
  const legendAttacks = document.getElementById('legend-attacks');

  if (currentScreen === 1 || currentScreen === 2) {
    legendMenu.style.display = 'block';
    countryMenu.style.display = 'none';
    isGrobHeatmap = (currentScreen === 2);
    loadHeatmapData();
    if (legendWeight) legendWeight.style.display = '';
    if (legendAttacks) legendAttacks.style.display = 'none';
  } else if (currentScreen === 3) {
    legendMenu.style.display = 'block';
    countryMenu.style.display = 'none';
    drawCountryBarChart();
    if (legendWeight) legendWeight.style.display = 'none';
    if (legendAttacks) legendAttacks.style.display = '';
  }
  setActiveScreenSwitcher();
}

function switchScreen() {
  currentScreen = currentScreen % 3 + 1; // 1->2->3->1
  // Remove any existing tooltip when switching screens
  if (globalTooltip) {
    globalTooltip.remove();
    globalTooltip = null;
  }
  loadScreen();
}

function loadHeatmapData() {
  if (isGrobHeatmap) {
    fetch('data/heatmap_grob.json')
      .then(response => response.json())
      .then(data => {
        currentHeatmapData = data;
        drawHeatmap();
      });
  } else {
    currentHeatmapData = heatmapData;
    drawHeatmap();
  }
}

function drawHeatmap() {
  renderer.innerHTML = '';

  currentHeatmapData.forEach(point => {
    const { x, y } = mapCoords(point.latitude, point.longitude);
    const radius = Math.sqrt(point.weight * stageWidth) * 0.005;

    const div = document.createElement('div');
    div.className = 'heatmap-point';

    if (isGrobHeatmap) {
      // Heatmap 2 (grob): Squares, linear scaling
      const size = radius;
      div.style.width = div.style.height = `${size}px`;
      div.style.left = `${x - size / 2}px`;
      div.style.top = `${y - size / 2}px`;
      div.style.borderRadius = '50'; // Override to make squares
    } else {
      // Heatmap 1 (default): Circles, logarithmic scaling
      let size = 0.1 + Math.log(radius * 3);
      size = Math.max(2, Math.min(size, 40));
      div.style.width = div.style.height = `${size}px`;
      div.style.left = `${x - size / 2}px`;
      div.style.top = `${y - size / 2}px`;
      // border-radius will be 50% from the .heatmap-point class in CSS
    }

    div.setAttribute('data-weight', point.weight);

    // Bestimme die Farbe basierend auf dem Weight-Wert
    let color;
    if (isGrobHeatmap) {
      // Farbskala wie Bar Chart: lila (klein) bis blau (groß) + Sättigungsskala + Transparenz
      const minHue = 270;
      const maxHue = 230;
      const minSaturation = 40;
      const maxSaturation = 90;
      const minAlpha = 0.2;
      const maxAlpha = 0.9;
      const minWeight = 0;
      const maxWeight = 20000; // Passe ggf. an, je nach Daten
      const tRaw = Math.min(1, Math.max(0, (point.weight - minWeight) / (maxWeight - minWeight)));
      const t = Math.pow(tRaw, 0.6); // verschiebt die Mitte Richtung lila
      const hue = minHue + (maxHue - minHue) * t;
      const saturation = minSaturation + (maxSaturation - minSaturation) * t;
      const alpha = minAlpha + (maxAlpha - minAlpha) * t;
      color = `hsla(${hue}, ${saturation}%, 55%, ${alpha})`;
    } else {
      // Farbskala wie Bar Chart: lila (klein) bis blau (groß) + Sättigungsskala + Transparenz
      const minHue = 270;
      const maxHue = 230;
      const minSaturation = 40;
      const maxSaturation = 90;
      const minAlpha = 0.5;
      const maxAlpha = 1;
      const minWeight = 0;
      const maxWeight = 20000; // Passe ggf. an, je nach Daten
      const tRaw = Math.min(1, Math.max(0, (point.weight - minWeight) / (maxWeight - minWeight)));
      const t = Math.pow(tRaw, 0.3); // gleiche Transparenzskala wie Heatmap Screen 1
      const hue = minHue + (maxHue - minHue) * t;
      const saturation = minSaturation + (maxSaturation - minSaturation) * t;
      const alpha = minAlpha + (maxAlpha - minAlpha) * t;
      color = `hsla(${hue}, ${saturation}%, 55%, ${alpha})`;
    }
    div.style.backgroundColor = color;

    // Remove any existing tooltip before creating a new one
    if (globalTooltip) {
      globalTooltip.remove();
    }

    div.addEventListener('mouseover', (e) => {
      // Remove any existing tooltip
      if (globalTooltip) {
        globalTooltip.remove();
      }
      globalTooltip = document.createElement('div');
      globalTooltip.className = 'tooltip';
      globalTooltip.textContent = `Weight: ${formatNumberWithSpaces(point.weight)}`;
      document.body.appendChild(globalTooltip);
    });

    div.addEventListener('mousemove', (e) => {
      if (globalTooltip) {
        globalTooltip.style.left = `${e.pageX + 10}px`;
        globalTooltip.style.top = `${e.pageY - 20}px`;
      }
    });

    div.addEventListener('mouseout', () => {
      if (globalTooltip) {
        globalTooltip.remove();
        globalTooltip = null;
      }
    });

    renderer.appendChild(div);
  });
}

// Funktion zum Zeichnen der Linien für Längen- und Breitengrade
function drawGridLines() {
  const latitudes = []; // Array für Breitengrade
  const longitudes = []; // Array für Längengrade

  // Breitengrade (-90 bis 90 in Schritten von 10)
  for (let lat = -90; lat <= 90; lat += 10) {
    latitudes.push(lat);
  }

  // Längengrade (-180 bis 180 in Schritten von 10)
  for (let lon = -180; lon <= 180; lon += 10) {
    longitudes.push(lon);
  }

  // Linien für Breitengrade zeichnen
  latitudes.forEach(lat => {
    const y = gmynd.map(lat, -90, 90, stageHeight, 0);

    let line = document.createElement("div");
    line.classList.add("latitude-line");
    line.style.top = `${y}px`;
    line.style.width = "100%";
    line.style.height = "1px";
    line.style.position = "absolute";

    document.querySelector('#renderer').appendChild(line);
  });

  // Linien für Längengrade zeichnen
  longitudes.forEach(lon => {
    const x = gmynd.map(lon, -180, 180, 0, stageWidth);

    let line = document.createElement("div");
    line.classList.add("longitude-line");
    line.style.left = `${x}px`;
    line.style.height = "100%";
    line.style.width = "1px";
    line.style.position = "absolute";

    document.querySelector('#renderer').appendChild(line);
  });
}

function formatCountryName(name) {
 
  // Liste von Länderabkürzungen, die in Großbuchstaben bleiben sollen
  const abbreviations = ['USA', 'UK', 'USSR'];
  
  if (abbreviations.includes(name)) {
    return name;
  }
  
  // Teile den String an Leerzeichen und formatiere jeden Teil
  return name.split(' ').map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

// Hilfsfunktion für Tausendertrennzeichen mit Leerzeichen
function formatNumberWithSpaces(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function setupCountryListOnce() {
  if (countryListInitialized) return;

  const countryList = document.getElementById('country-list');
  countryList.innerHTML = ''; // Clear previous list

  if (!countriesData) {
    countryList.innerHTML = '<li>Loading data...</li>';
    return;
  }

  const countryCounts = gmynd.groupData(countriesData, 'Country');
  const sortedCountries = Object.entries(countryCounts).sort(([,a],[,b]) => b.length - a.length);

  const topCountries = sortedCountries.slice(0, 5);

  topCountries.forEach(([countryName, data]) => {
    const formattedName = formatCountryName(countryName);
    const listItem = document.createElement('li');
    const button = document.createElement('button');
    button.className = 'country-btn';
    if (countryName === activeCountry) {
      button.classList.add('active');
    }

    button.addEventListener('click', () => {
      document.querySelectorAll('#country-list .country-btn').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      activeCountry = countryName;

      // Redraw the current screen
      if (currentScreen === 3) {
      drawCountryBarChart();
      }
    });

    const label = document.createElement('span');
    label.textContent = formattedName;
    listItem.appendChild(button);
    listItem.appendChild(label);
    countryList.appendChild(listItem);
  });
  
  countryListInitialized = true;
}

function drawCountryBarChart() {
    renderer.innerHTML = '';
    if (!countriesData) return;

    // Top 5 Länder bestimmen
    const countryCounts = gmynd.groupData(countriesData, 'Country');
    const sortedCountries = Object.entries(countryCounts).sort(([,a],[,b]) => b.length - a.length);
    const topCountries = sortedCountries.slice(0, 5);

    // Container für alle Länder nebeneinander
    const allCountriesContainer = document.createElement('div');
    allCountriesContainer.style.display = 'flex';
    allCountriesContainer.style.justifyContent = 'space-between';
    allCountriesContainer.style.alignItems = 'flex-end';
    allCountriesContainer.style.width = '100%';
    allCountriesContainer.style.height = '100%';
    allCountriesContainer.style.gap = '2vw';
    allCountriesContainer.style.boxSizing = 'border-box';
    allCountriesContainer.style.padding = '4vh 2vw 0 2vw';

    // Filter für Target Bars bestimmen
    let filterFn = null;
    if (targetBarFilter.yellow || targetBarFilter.orange || targetBarFilter.red) {
      filterFn = (count) => {
        if (targetBarFilter.yellow && count < 1000) return false;
        if (targetBarFilter.orange && count >= 1000 && count <= 10000) return false;
        if (targetBarFilter.red && count > 10000) return false;
        return true;
      };
    }

    // Für Skalierung: Finde die Summe der gefilterten Targets der USA
    let usaFilteredTotal = 1;
    if (filterFn) {
      const usa = topCountries.find(([name]) => name === 'USA');
      if (usa) {
        const attacksByCountry = usa[1];
        const targetCounts = gmynd.groupData(attacksByCountry, 'Target Country');
        const filtered = Object.values(targetCounts).map(arr => arr.length).filter(filterFn);
        usaFilteredTotal = filtered.reduce((a, b) => a + b, 0) || 1;
      }
    }

    // Für Animation: Sammle alle Target Bars
    let allTargetBars = [];

    topCountries.forEach(([countryName, attacksByCountry]) => {
        const totalAttackCount = attacksByCountry.length;
        // Targets für dieses Land
        const targetCounts = gmynd.groupData(attacksByCountry, 'Target Country');
        const sortedTargets = Object.entries(targetCounts).sort(([,a],[,b]) => b.length - a.length);
        let processedTargets = {};
        if (sortedTargets.length > 20) {
            const top19 = sortedTargets.slice(0, 19);
            const others = sortedTargets.slice(19);
            top19.forEach(([name, data]) => { processedTargets[name] = data.length; });
            const othersCount = others.reduce((sum, [, data]) => sum + data.length, 0);
            if (othersCount > 0) processedTargets['Others'] = othersCount;
        } else {
            sortedTargets.forEach(([name, data]) => { processedTargets[name] = data.length; });
        }
        let finalTargets = Object.entries(processedTargets).sort(([,a],[,b]) => a - b);
        if (filterFn) {
          finalTargets = finalTargets.filter(([, count]) => filterFn(count));
        }

        let filteredTotal = totalAttackCount;
        if (filterFn) {
          filteredTotal = finalTargets.reduce((sum, [, count]) => sum + count, 0) || 1;
        }

        let scaleFactor = 1;
        if (filterFn) {
          scaleFactor = filteredTotal / usaFilteredTotal;
        } else {
          const usaAttacks = topCountries.find(([name]) => name === 'USA')?.[1]?.length || 1;
          scaleFactor = Math.pow(filteredTotal / usaAttacks, 0.6);
        }

        // Einzelner Länder-Container
        const container = document.createElement('div');
        container.className = 'bar-chart-container custom-country-container';

        // Länder-Box links
        const countryBar = document.createElement('div');
        countryBar.className = 'country-bar custom-country-bar';

        const countryBarLabel = document.createElement('span');
        countryBarLabel.className = 'country-bar-label';
        const countryBarName = document.createElement('span');
        countryBarName.className = 'country-bar-name';
        countryBarName.textContent = formatCountryName(countryName);
        const countryBarCount = document.createElement('span');
        countryBarCount.className = 'country-bar-count';
        countryBarCount.textContent = formatNumberWithSpaces(totalAttackCount);
        countryBarLabel.appendChild(countryBarName);
        countryBarLabel.appendChild(countryBarCount);
        // Hover-Flächen für das Label
        const hoverLeft = document.createElement('div');
        hoverLeft.style.position = 'absolute';
        hoverLeft.style.left = 0;
        hoverLeft.style.top = 0;
        hoverLeft.style.bottom = 0;
        hoverLeft.style.width = '50%';
        hoverLeft.style.cursor = 'pointer';
        hoverLeft.addEventListener('mouseenter', () => {
          countryBarLabel.classList.add('hover-left');
        });
        hoverLeft.addEventListener('mouseleave', () => {
          countryBarLabel.classList.remove('hover-left');
        });
        const hoverRight = document.createElement('div');
        hoverRight.style.position = 'absolute';
        hoverRight.style.right = 0;
        hoverRight.style.top = 0;
        hoverRight.style.bottom = 0;
        hoverRight.style.width = '100%';
        hoverRight.style.cursor = 'pointer';
        hoverRight.addEventListener('mouseenter', () => {
          countryBarLabel.classList.add('hover-right');
        });
        hoverRight.addEventListener('mouseleave', () => {
          countryBarLabel.classList.remove('hover-right');
        });
        countryBarLabel.style.position = 'relative';
        countryBarLabel.appendChild(hoverLeft);
        countryBarLabel.appendChild(hoverRight);
        countryBar.appendChild(countryBarLabel);

        // Targets als Balken oben
        const targetsContainer = document.createElement('div');
        targetsContainer.className = 'targets-container custom-targets-container';
        
        // Für Animation: Sortiere von groß nach klein
        const sortedForAnim = [...finalTargets].sort(([,a],[,b]) => b - a);
        const barRefs = [];
        finalTargets.forEach(([targetName, targetCount], index) => {
            const targetBar = document.createElement('div');
            targetBar.className = 'target-bar custom-target-bar';
            // Für Animation: Start mit Höhe 0
            targetBar.style.height = `0%`;
            // Zielhöhe berechnen
            const targetHeight = (targetCount / totalAttackCount) * 100 * scaleFactor;
            // Speichere für Animation
            barRefs.push({bar: targetBar, targetHeight, value: targetCount});
            // Farbverlauf wie vorher:
            const minHue = 270;
            const maxHue = 230;
            const minSaturation = 30;
            const maxSaturation = 95;
            const minAlpha = 0.4;
            const maxAlpha = 1;
            const minWeight = 0;
            const maxWeight = 20000; // Passe ggf. an, je nach Daten
            const tRaw = Math.min(1, Math.max(0, (targetCount - minWeight) / (maxWeight - minWeight)));
            const t = Math.pow(tRaw, 0.4); // gleiche Transparenzskala wie Heatmap Screen 1
            const hue = minHue + (maxHue - minHue) * t;
            const saturation = minSaturation + (maxSaturation - minSaturation) * t;
            const alpha = minAlpha + (maxAlpha - minAlpha) * t;
            targetBar.style.backgroundColor = `hsla(${hue}, ${saturation}%, 55%, ${alpha})`;
            // Speichere für Outline
            targetBar._outlineColor = `hsla(${hue}, ${saturation}%, 60%, 1)`;

            // Textbereiche
            const countrySpan = document.createElement('span');
            countrySpan.className = 'target-bar-country';
            let displayTargetName = formatCountryName(targetName);
            if (displayTargetName === 'Holland Or Netherlands') displayTargetName = 'Netherlands';
            countrySpan.textContent = displayTargetName;

            const countSpan = document.createElement('span');
            countSpan.className = 'target-bar-count';
            countSpan.textContent = formatNumberWithSpaces(targetCount);

            setTimeout(() => {
              const barHeight = targetBar.offsetHeight;
              const fontSize = calcTargetBarFontSize(barHeight);
              countrySpan.style.fontSize = fontSize + 'px';
              countSpan.style.fontSize = fontSize + 'px';
            }, 0);

            // Vergleichsfunktion: Hover über andere Bars
            targetBar.addEventListener('mousemove', (e) => {
              if (selectedTargetBar && selectedTargetBarData) {
                // Immer beide anzeigen
                selectedTargetBarData.countrySpan.style.opacity = '1';
                selectedTargetBarData.countSpan.style.opacity = '1';
                // Hover-Style synchronisieren
                const rect = targetBar.getBoundingClientRect();
                const x = e.clientX - rect.left;
                selectedTargetBar.classList.remove('hover-left', 'hover-right');
                if (x < rect.width / 2) {
                  selectedTargetBar.classList.add('hover-left');
                  selectedTargetBar.classList.remove('hover-right');
                } else {
                  selectedTargetBar.classList.add('hover-right');
                  selectedTargetBar.classList.remove('hover-left');
                }
              }
            });
            targetBar.addEventListener('mouseleave', () => {
              if (selectedTargetBar && selectedTargetBarData) {
                selectedTargetBar.classList.remove('hover-left', 'hover-right');
                selectedTargetBarData.countrySpan.style.opacity = '1';
                selectedTargetBarData.countSpan.style.opacity = '1';
              }
            });

            // Hover-Flächen für links und rechts (für Vergrößerung Name/Zahl in der Bar selbst)
            const hoverLeft = document.createElement('div');
            hoverLeft.className = 'target-bar-hover-left';
            hoverLeft.addEventListener('mouseenter', () => {
              targetBar.classList.add('hover-left');
              countrySpan.style.opacity = '1';
              countSpan.style.opacity = '1';
              // Auch auf die aktive Bar anwenden
              if (selectedTargetBar && selectedTargetBar !== targetBar) {
                selectedTargetBar.classList.add('hover-left');
                selectedTargetBar.classList.remove('hover-right');
              }
            });
            hoverLeft.addEventListener('mouseleave', () => {
              targetBar.classList.remove('hover-left');
              countrySpan.style.opacity = '0';
              countSpan.style.opacity = '0';
              if (selectedTargetBar && selectedTargetBar !== targetBar) {
                selectedTargetBar.classList.remove('hover-left');
              }
            });
            const hoverRight = document.createElement('div');
            hoverRight.className = 'target-bar-hover-right';
            hoverRight.addEventListener('mouseenter', () => {
              targetBar.classList.add('hover-right');
              countrySpan.style.opacity = '1';
              countSpan.style.opacity = '1';
              if (selectedTargetBar && selectedTargetBar !== targetBar) {
                selectedTargetBar.classList.add('hover-right');
                selectedTargetBar.classList.remove('hover-left');
              }
            });
            hoverRight.addEventListener('mouseleave', () => {
              targetBar.classList.remove('hover-right');
              countrySpan.style.opacity = '0';
              countSpan.style.opacity = '0';
              if (selectedTargetBar && selectedTargetBar !== targetBar) {
                selectedTargetBar.classList.remove('hover-right');
              }
            });
            targetBar.appendChild(hoverLeft);
            targetBar.appendChild(hoverRight);

            // Vergleichsfunktion: Klick auf Bar (Einzelauswahl)
            targetBar.addEventListener('click', (e) => {
              if (selectedTargetBar === targetBar) {
                targetBar.classList.remove('selected');
                targetBar.style.outline = '';
                selectedTargetBar = null;
                selectedTargetBarData = null;
              } else {
                if (selectedTargetBar) {
                  if (selectedTargetBarData) {
                    selectedTargetBarData.countrySpan.style.opacity = '0';
                    selectedTargetBarData.countSpan.style.opacity = '0';
                  }
                  selectedTargetBar.classList.remove('selected');
                  selectedTargetBar.style.outline = '';
                }
                targetBar.classList.add('selected');
                targetBar.style.outline = `2px solid ${targetBar._outlineColor}`;
                targetBar.style.outlineOffset = '-2px';
                selectedTargetBar = targetBar;
                selectedTargetBarData = {countrySpan, countSpan};
              }
            });

            targetBar.appendChild(countrySpan);
            targetBar.appendChild(countSpan);
            targetsContainer.appendChild(targetBar);
        });
        container.appendChild(targetsContainer);
        container.appendChild(countryBar);
        allCountriesContainer.appendChild(container);
        // Für Animation: Speichere Referenzen
        allTargetBars.push(barRefs);
    });
    renderer.appendChild(allCountriesContainer);

    // Animation: Bars von groß nach klein aufstacken
    if (currentScreen === 3) {
      const maxBars = Math.max(...allTargetBars.map(arr => arr.length));
      const totalDuration = 300; // ms, Gesamtdauer der Animation für alle Segmente
      allTargetBars.forEach(barRefs => {
        const n = barRefs.length;
        barRefs.forEach((ref, i) => {
          // Die Verzögerung wird so berechnet, dass alle Segmente gleichzeitig fertig sind
          const delay = (i / (n - 1 || 1)) * totalDuration;
          setTimeout(() => {
            ref.bar.style.transition = 'height 0.5s cubic-bezier(.4,2,.6,1)';
            ref.bar.style.height = `${ref.targetHeight}%`;
          }, delay);
        });
      });
    }

    // Nach dem Zeichnen: Falls eine Bar ausgewählt ist, setze deren Opacity auf 1 (immer sichtbar)
    if (selectedTargetBarData) {
      selectedTargetBarData.countrySpan.style.opacity = '1';
      selectedTargetBarData.countSpan.style.opacity = '1';
    }
}

function calcTargetBarFontSize(barHeight) {
  // 60% der Barhöhe, aber begrenzt durch min/max
  return Math.max(TARGET_BAR_FONT_MIN, Math.min(TARGET_BAR_FONT_MAX, barHeight * 0.6));
}

function setActiveScreenSwitcher() {
  document.querySelectorAll('.screen-switch').forEach(el => {
    el.classList.remove('active');
    const screen = parseInt(el.getAttribute('data-screen'));
    if (screen === currentScreen) {
      el.classList.add('active');
    }
  });
}
