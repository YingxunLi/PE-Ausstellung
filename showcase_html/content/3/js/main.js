import { migrantData, genderAndChildrenData, causeOfDeathByRegion } from '../data.js';

const continentBaseColors = {
  America: "#C93737",   // Amaranth pink
  Europe: "#DB3069",
  Africa: "#F5D547",   // Fluorescent cyan
  Asia: "#46B051"      // Emerald
};

let stageHeight;
let stageWidth;
let renderer;
const continentGroups = {};
const continentTotals = [];
let regionHeight;

// NEU: Abstand zwischen den Jahren
const yearGap = 20;
let selectedYear = null; // Für die Filterung in drawDiagram2

// State für aktives Diagramm
let activeDiagram = 'missing'; // 'missing', 'cause', 'gender'

init();

function resizeRenderer(height) {
  renderer.style.height = `${height}px`;
}

function init() {
  renderer = document.querySelector("#renderer");
  // Entferne paddingTop und top, damit die Grafik oben bündig startet
  renderer.style.paddingTop = "0px";
  renderer.style.top = "0px";
  stageWidth = renderer.clientWidth;
  stageHeight = renderer.clientHeight;

  regionHeight = stageHeight / 16;
  prepareData();
  drawDiagram();
}

function prepareData() {
  const groupedData = gmynd.groupData(migrantData, [
    "Region of Incident",
    "Incident year",
    "Reported Month"
  ]);

  const monthMap = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11
  };

  const continentRegions = {
    America: ["North America", "Central America", "South America", "Caribbean"],
    Europe: ["Europe", "Mediterranean"],
    Africa: [
      "Northern Africa",
      "Eastern Africa",
      "Southern Africa",
      "Western Africa",
      "Middle Africa"
    ],
    Asia: [
      "Western Asia",
      "Central Asia",
      "Southern Asia",
      "Eastern Asia",
      "South-Eastern Asia"
    ] // Großes E
  };

  // Hilfsfunktion für tolerant Matching
  function findRegionKeyInsensitive(obj, regionName) {
    const keys = Object.keys(obj);
    const found = keys.find(k => k.toLowerCase() === regionName.toLowerCase());
    return found || regionName;
  }

  for (const continent in continentRegions) {
    const regionList = [];
    let continentTotal = 0;

    for (const region of continentRegions[continent]) {
      // Nutze tolerant Matching für Regionsnamen
      const regionKey = findRegionKeyInsensitive(groupedData, region);
      if (!groupedData[regionKey]) continue;

      const yearsObj = groupedData[regionKey];
      const transformedYears = {};
      let regionTotal = 0;

      for (const year in yearsObj) {
        const monthsObj = yearsObj[year];
        const monthsArray = Array(12)
          .fill(null)
          .map(() => ({
            incidents: [],
            totalDeadAndMissing: 0
          }));

        for (const monthName in monthsObj) {
          const monthIndex = monthMap[monthName];
          const incidents = monthsObj[monthName] || [];

          monthsArray[monthIndex].incidents = incidents;
          monthsArray[monthIndex].totalDeadAndMissing = incidents.reduce(
            (sum, entry) => sum + (entry["Total Number of Dead and Missing"] || 0),
            0
          );

          regionTotal += monthsArray[monthIndex].totalDeadAndMissing;
        }

        transformedYears[year] = monthsArray;
      }

      regionList.push({ region, data: transformedYears, total: regionTotal });
    }

    regionList.sort((a, b) => b.total - a.total);
    continentGroups[continent] = regionList.map(entry => ({ [entry.region]: entry.data }));

    continentTotal = regionList.reduce((sum, entry) => sum + entry.total, 0);
    continentTotals.push({ continent, total: continentTotal, regions: continentGroups[continent] });
  }

  // Sortiere Kontinente nach neuer gewünschter Reihenfolge
  const continentOrder = ['America', 'Europe', 'Africa', 'Asia'];
  continentTotals.sort((a, b) => continentOrder.indexOf(a.continent) - continentOrder.indexOf(b.continent));
}

function renderTabs() {
  // Entferne alte Tabs, falls vorhanden
  document.querySelectorAll('.diagram-tab').forEach(el => el.remove());

  // Tab-Container
  const tabContainer = document.createElement('div');
  tabContainer.style.position = 'absolute';
  tabContainer.style.left = '80px';
  tabContainer.style.top = '60px';
  tabContainer.style.display = 'flex';
  tabContainer.style.gap = '40px';
  tabContainer.style.zIndex = '10';

  // Helper für Hover-Effekt und Styling
  function addHoverEffect(tab, isActive) {
    tab.style.fontWeight = '400'; // Lato Regular 400 für Überschriften
    tab.style.fontFamily = "'Lato', Arial, sans-serif";
    tab.style.transition = 'transform 0.15s, color 0.15s';
    if (!isActive) {
      tab.addEventListener('mouseenter', () => {
        tab.style.transform = 'scale(1.08)';
        tab.style.color = '#fff';
      });
      tab.addEventListener('mouseleave', () => {
        tab.style.transform = 'scale(1)';
        tab.style.color = '#888';
      });
    }
  }

  // Tab 1: Missing & Dead Migrants
  const tabMissing = document.createElement('div');
  tabMissing.className = 'diagram-tab';
  tabMissing.innerText = 'Dead & Missing Migrants';
  tabMissing.style.fontSize = '18px';
  tabMissing.style.cursor = activeDiagram === 'missing' ? 'default' : 'pointer';
  tabMissing.style.color = activeDiagram === 'missing' ? '#fff' : '#888';
  tabMissing.style.fontWeight = '400'; // Lato Regular 400
  tabMissing.style.fontFamily = "'Lato', Arial, sans-serif";
  addHoverEffect(tabMissing, activeDiagram === 'missing');
  tabMissing.onclick = () => {
    if (activeDiagram !== 'missing') {
      activeDiagram = 'missing';
      renderTabs();
      drawDiagram();
    }
  };
  tabContainer.appendChild(tabMissing);

  // Tab 2: Cause of Death
  const tabCause = document.createElement('div');
  tabCause.className = 'diagram-tab';
  tabCause.innerText = 'Cause of Death';
  tabCause.style.fontSize = '18px';
  tabCause.style.cursor = activeDiagram === 'cause' ? 'default' : 'pointer';
  tabCause.style.color = activeDiagram === 'cause' ? '#fff' : '#888';
  tabCause.style.fontWeight = '400'; // Lato Regular 400
  tabCause.style.fontFamily = "'Lato', Arial, sans-serif";
  addHoverEffect(tabCause, activeDiagram === 'cause');
  tabCause.onclick = () => {
    if (activeDiagram !== 'cause') {
      activeDiagram = 'cause';
      renderTabs();
      drawCauseOfDeathBars();
    }
  };
  tabContainer.appendChild(tabCause);

  // Tab 3: Deaths by Gender
  const tabGender = document.createElement('div');
  tabGender.className = 'diagram-tab';
  tabGender.innerText = 'Deaths by Gender';
  tabGender.style.fontSize = '18px';
  tabGender.style.cursor = activeDiagram === 'gender' ? 'default' : 'pointer';
  tabGender.style.color = activeDiagram === 'gender' ? '#fff' : '#888';
  tabGender.style.fontWeight = '400'; // Lato Regular 400
  tabGender.style.fontFamily = "'Lato', Arial, sans-serif";
  addHoverEffect(tabGender, activeDiagram === 'gender');
  tabGender.onclick = () => {
    if (activeDiagram !== 'gender') {
      activeDiagram = 'gender';
      renderTabs();
      drawDiagram2()
    }
  };
  tabContainer.appendChild(tabGender);

  document.body.appendChild(tabContainer);
}

// Passe drawDiagram und drawCauseOfDeathBars an, damit sie die Tabs nicht überschreiben
function drawDiagram() {
  renderer.innerHTML = "";
  renderTabs();

  // Entferne ggf. die "Deaths in Total"-Box, wenn sie existiert (nur für Cause of Death anzeigen)
  const statsBox = document.getElementById('cod-stats-box');
  if (statsBox) statsBox.remove();

  // Filter-UI für Gender (nur bei Deaths by Gender anzeigen, daher hier immer entfernen)
  let filterContainer = document.getElementById('gender-filter-container');
  if (filterContainer) filterContainer.remove();

  // Tooltip-Element für Balken-Hover (nur einmal anlegen)
  let tooltip = document.getElementById('bar-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'bar-tooltip';
    tooltip.style.position = 'fixed';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.background = 'rgba(30,30,30,0.97)';
    tooltip.style.color = '#fff';
    tooltip.style.padding = '10px 18px';
    tooltip.style.borderRadius = '12px';
    tooltip.style.fontSize = '12px';
    tooltip.style.fontFamily = 'inherit';
    tooltip.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18)';
    tooltip.style.zIndex = '9999';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
  }

  // Berechne dynamisch die vertikalen und horizontalen Offsets und Größen, damit alles ins Canvas passt
  // HIER kannst du das gesamte Diagramm nach unten verschieben:
  const paddingTop = 120; // Erhöhe diesen Wert, um alles weiter nach unten zu schieben (z.B. 120 statt 40)
  const paddingLeft = 200; // Mehr Platz für Labels links
  const paddingBottom = 60; // Platz für Achsenbeschriftung unten
  const paddingRight = 150;

  // Dynamische Höhe pro Region, damit alles ins Canvas passt
  let totalRegionCount = 0;
  continentTotals.forEach(c => totalRegionCount += c.regions.length);
  // Anzahl der Kontinente
  const continentCount = continentTotals.length;
  // Definiere den gewünschten Abstand zwischen Kontinenten
  const extraContinentSpacing = 60;
  // Ziehe die Gesamthöhe der Abstände von der verfügbaren Höhe ab
  const availableHeight = stageHeight - paddingTop - paddingBottom - (extraContinentSpacing * (continentCount - 1));
  regionHeight = availableHeight / totalRegionCount;

  // Dynamische Breite pro Monat, damit alles ins Canvas passt
  const allYears = new Set();
  continentTotals.forEach(c => {
    c.regions.forEach(r => {
      const years = Object.values(r)[0];
      Object.keys(years).forEach(y => allYears.add(parseInt(y)));
    });
  });
  const sortedYears = Array.from(allYears).sort((a, b) => a - b);
  const startYear = sortedYears[0];
  const endYear = sortedYears[sortedYears.length - 1];
  const totalMonths = (endYear - startYear + 1) * 12;

  // NEU: Abstand zwischen den Jahren in der Available Width berücksichtigen
  const availableWidth = stageWidth - paddingLeft - paddingRight - yearGap * 10;
  const monthWidth = availableWidth / totalMonths;

  // NEU: Bars schmaler machen, damit alle Monate in den Renderer passen
  const barWidth = Math.max(monthWidth * 0.5, 3.0); // Schmalere Balken für länglicheren Look
  const xOffset = paddingLeft + 150; // Balken starten näher an den Labels

  let maxDeaths = 0;

  console.log(continentTotals)
  continentTotals.forEach(continent => {
    continent.regions.forEach(region => {
      const years = Object.values(region)[0];
      Object.values(years).forEach(months => {
        months.forEach(m => {
          if (m.totalDeadAndMissing > maxDeaths) {
            maxDeaths = m.totalDeadAndMissing;
          }
        });
      });
    });
  });

  let yPosContinent = paddingTop;
  continentTotals.forEach((continentData, continentIdx) => {
    const continentColor = continentBaseColors[continentData.continent] || "#ccc";
    let yPosRegion = 0;

    const continentLabel = document.createElement('div');
    continentLabel.className = 'label';
    continentLabel.innerText = continentData.continent;
    continentLabel.style.position = 'absolute';
    const continentStartY = yPosContinent;
    const continentEndY = yPosContinent + continentData.regions.length * regionHeight;
    const continentMiddleY = (continentStartY + continentEndY) / 2;
    continentLabel.style.left = '80px';
    continentLabel.style.top = `${continentMiddleY}px`;
    continentLabel.style.fontSize = '14px'; // 14px für Kontinentnamen
    continentLabel.style.color = '#fff';
    continentLabel.style.transform = 'rotate(-90deg) translateX(-45%) translateY(-30%)';
    continentLabel.style.transformOrigin = 'left top';
    renderer.appendChild(continentLabel);

    continentData.regions.forEach((regionData, regionIndex) => {
      const [region, years] = Object.entries(regionData)[0];

      // NEU: Leere Jahre hinzufügen, falls nicht vorhanden, um die Balken gleichmäßig zu verteilen
      const completeYears = Array.from({ length: 10 }, (_, i) => (2014 + i).toString());
      completeYears.forEach(year => {
        if (!years.hasOwnProperty(year)) {
          years[year] = Array.from({ length: 12 }, () => ({})); // 12 leere Objekte
        }
      });

      yPosRegion = yPosContinent + (regionIndex * regionHeight);
      const yDot = yPosRegion + regionHeight / 2;

      // Regionslabel
      const regionLabel = document.createElement('div');
      regionLabel.className = 'label region-label-dynamic';
      regionLabel.innerText = region;
      regionLabel.style.position = 'absolute';
      regionLabel.style.left = '220px';
      regionLabel.style.top = `${yPosRegion + regionHeight / 2 - 8}px`;
      regionLabel.style.fontSize = '13px';
      regionLabel.style.color = '#ccc';
      regionLabel.style.fontWeight = '100'; // Lato Thin 100
      regionLabel.style.fontFamily = "'Lato', Arial, sans-serif";
      renderer.appendChild(regionLabel);

      // Grundfarbe für diese Region = Kontinentfarbe
      const baseColor = continentColor;

      // Ermittle das Maximum für diese Region (über alle Monate/Jahre)
      let regionMax = 0;
      Object.values(years).forEach(months => {
        months.forEach(m => {
          if (m.totalDeadAndMissing > regionMax) regionMax = m.totalDeadAndMissing;
        });
      });

      let yearIndex = 0;

      Object.entries(years).forEach(([year, months]) => {
        const yearOffset = (parseInt(year) - startYear) * 12; // <-- FEHLTE!
        months.forEach((monthData, monthIndex) => {
          if (monthData.totalDeadAndMissing > 0) {
            // NEU: Berechne die X-Position basierend auf dem Jahr und Monat
            const xPos = xOffset + (yearOffset + monthIndex) * monthWidth + yearIndex * yearGap;
            // Logarithmische Skalierung für die Balkenhöhe, max. 120% der Regionhöhe
            const minValue = 1;
            const logMin = Math.log(minValue);
            const logMax = Math.log(maxDeaths + 1);
            const logValue = Math.log(monthData.totalDeadAndMissing + 1);
            const maxBarHeight = regionHeight * 1.2;
            const scaledHeight = Math.max(((logValue - logMin) / (logMax - logMin)) * maxBarHeight, 4);

            // Farbverlauf: Sättigung/Alpha je nach Anteil am Maximum der Region
            let intensity = monthData.totalDeadAndMissing / regionMax;
            intensity = Math.max(0.15, Math.min(1, intensity));
            // Nutze HSL, falls möglich, sonst Alpha
            let barColor = baseColor;
            function hexToHSL(hex) {
              let r = 0, g = 0, b = 0;
              if (hex.length === 7) {
                r = parseInt(hex.slice(1, 3), 16) / 255;
                g = parseInt(hex.slice(3, 5), 16) / 255;
                b = parseInt(hex.slice(5, 7), 16) / 255;
              }
              const max = Math.max(r, g, b), min = Math.min(r, g, b);
              let h, s, l = (max + min) / 2;
              if (max === min) {
                h = s = 0;
              } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                  case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                  case g: h = (b - r) / d + 2; break;
                  case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
              }
              return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
            }
            if (baseColor.startsWith('#')) {
              const [h, s, l] = hexToHSL(baseColor);
              barColor = `hsl(${h}, ${s}%, ${Math.round(20 + 60 * intensity)}%)`;
            } else {
              barColor = baseColor.replace('rgb', 'rgba').replace(')', `,${intensity})`);
            }

            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.position = 'absolute';
            bar.dataset.month = monthIndex
            bar.style.left = `${xPos}px`;
            bar.style.top = `${yDot - scaledHeight / 2}px`;
            bar.style.width = `${barWidth}px`;
            bar.style.height = `${scaledHeight}px`;
            bar.style.backgroundColor = barColor;
            bar.style.borderRadius = `${Math.min(barWidth / 3)}px`;
            bar.removeAttribute('title'); // Entfernt Browser-Tooltip

            renderer.appendChild(bar);

            // --- Hover-Effekt: Balken heller machen + Tooltip ---
            bar.addEventListener('mouseenter', (e) => {
              // Balken heller machen
              let hoverColor = barColor;
              if (barColor.startsWith('hsl')) {
                hoverColor = barColor.replace(/(\d+)%\)$/, (m, l) => `${Math.min(100, parseInt(l) + 20)}%)`);
              } else if (barColor.startsWith('#')) {
                hoverColor = '#fff';
              }
              bar.style.filter = 'brightness(1.3)';
              bar.style.backgroundColor = hoverColor;

              // Tooltip anzeigen (Englisch, Dead & Missing)
              let missing = 0, dead = 0;
              if (monthData.incidents && Array.isArray(monthData.incidents)) {
                monthData.incidents.forEach(entry => {
                  // Nutze beide Varianten für Missing (Minimum Estimated Number of Missing und Number of Missing)
                  missing += (entry["Minimum Estimated Number of Missing"] != null
                    ? entry["Minimum Estimated Number of Missing"]
                    : (entry["Number of Missing"] || 0));
                  dead += entry["Number of Dead"] || 0;
                });
              }
              // Fallback falls keine Differenzierung möglich
              if (missing === 0 && dead === 0) {
                missing = 0;
                dead = monthData.totalDeadAndMissing || 0;
              }
              tooltip.innerHTML =
                `<div style="font-size:15px;font-weight:600;margin-bottom:2px;">${getMonthName(monthIndex)} ${year}</div>
                <div style="margin-bottom:2px;">Missing: <b>${missing}</b></div>
                <div>Dead: <b>${dead}</b></div>`;
              tooltip.style.display = 'block';
            });
            bar.addEventListener('mousemove', (e) => {
              tooltip.style.left = (e.clientX + 18) + 'px';
              tooltip.style.top = (e.clientY + 8) + 'px';
            });
            bar.addEventListener('mouseleave', () => {
              bar.style.filter = '';
              bar.style.backgroundColor = barColor;
              tooltip.style.display = 'none';
            });
          }
        });
        yearIndex++;
      }); // <-- Diese schließende Klammer schließt Object.entries(years).forEach

    }); // <-- Diese schließende Klammer schließt continentData.regions.forEach

    // Nur nach dem letzten Regioneneintrag eines Kontinents, außer beim letzten Kontinent, extra Abstand hinzufügen
    if (continentIdx < continentTotals.length - 1) {
      yPosContinent = yPosRegion + regionHeight + extraContinentSpacing;
    } else {
      yPosContinent = yPosRegion + regionHeight;
    }
  }); // <-- Diese schließende Klammer schließt continentTotals.forEach

  // Die Zeitachse soll direkt nach dem letzten Kontinent erscheinen, ohne extra Abstand
  const axisY = yPosContinent - extraContinentSpacing + 80;
  // Verschiebe die gesamte Zeitachse nach links, z.B. um 50px:
  const axisXOffset = -9; // Negativ = nach links, positiv = nach rechts

  for (let year = startYear; year <= endYear; year++) {
    let xPos = xOffset + (year - startYear) * (12 * monthWidth + yearGap);
    if (year === 2014) {
      xPos += 10;
    }
    // Wende den Offset an:
    xPos += axisXOffset;
    const tick = document.createElement('div');
    tick.className = 'year-label';
    tick.innerText = year;
    tick.style.position = 'absolute';
    tick.style.left = `${xPos}px`;
    tick.style.top = `${axisY}px`;
    tick.style.fontSize = '12px';
    tick.style.color = '#aaa';
    tick.style.textAlign = 'center';
    tick.style.minWidth = '40px';
    renderer.appendChild(tick);
  }
}

// Hilfsfunktion: Zeichnet horizontale Balken für Cause of Death pro Region
function drawCauseOfDeathBars() {
  renderer.innerHTML = "";
  renderTabs();

  // Filter-UI für Gender (nur bei Deaths by Gender anzeigen, daher hier immer entfernen)
  let filterContainer = document.getElementById('gender-filter-container');
  if (filterContainer) filterContainer.remove();

  // --- Definiere Farben für alle Todesursachen, auch bei abweichender Schreibweise ---
  const causeColorMap = {
    "drowning": "#00CFFF",
    "violence": "#FF005C",
    "mixed or unknown": "#FFD600",
    "harsh environmental conditions": "#00FF85",
    "vehicle accident": "#FF6B00",
    "sickness": "#A259F7",
    "accidental death": "#FF00E6"
  };

  function getCauseColor(cause, value = 1, maxValue = 1, baseColor = "#888", idx = 0, total = 1) {
    // Farbverlauf von dunkel (niedrige Werte) zu hell (hohe Werte) in der jeweiligen Kontinentfarbe
    function hexToHSL(hex) {
      let r = 0, g = 0, b = 0;
      if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16) / 255;
        g = parseInt(hex.slice(3, 5), 16) / 255;
        b = parseInt(hex.slice(5, 7), 16) / 255;
      }
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;
      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    }
    const [h, , l] = hexToHSL(baseColor);
    // Verlauf von l=28% (dunkel) bis l=92% (hell), aber UMGEKEHRT: hohe Werte = hell, niedrige = dunkel
    const minLight = 30;
    const maxLight = 60;
    // Umdrehen: idx = 0 (niedrig) => dunkel, idx = total-1 (hoch) => hell
    const t = idx / Math.max(1, total - 1);
    const light = minLight + (maxLight - minLight) * t;
    const sat = 70;
    return `hsl(${h}, ${sat}%, ${light}%)`;
  }

  // --- Fehlerbehebung: paddingTop, paddingBottom, extraContinentSpacing ---
  const paddingTop = 120;
  const paddingBottom = 60;
  const extraContinentSpacing = 60;

  // Entferne ggf. alte Cause-of-Death-Balken
  document.querySelectorAll('.cause-bar, .cause-bar-label').forEach(el => el.remove());

  // Entferne die Zeitachse (year-labels), falls vorhanden
  document.querySelectorAll('.year-label').forEach(el => el.remove());

  // Alle möglichen Gründe (Keys) aus allen Regionen sammeln (aus echten Daten!)
  const allCausesSet = new Set();
  Object.values(causeOfDeathByRegion).forEach(regionObj => {
    Object.keys(regionObj).forEach(cause => allCausesSet.add(cause));
  });
  let allCauses = Array.from(allCausesSet);

  // --- Sortiere Todesursachen nach globaler Summe (absteigend) ---
  const causeTotals = {};
  Object.values(causeOfDeathByRegion).forEach(regionObj => {
    Object.entries(regionObj).forEach(([cause, val]) => {
      // Verwende verkürzte Schreibweise für Aggregation
      let key = cause.split(",")[0].split("/")[0].trim().toLowerCase();
      if (key.startsWith("sickness")) key = "sickness";
      if (key.startsWith("harsh environmental conditions")) key = "harsh environmental conditions";
      if (key.startsWith("vehicle accident")) key = "vehicle accident";
      if (key.startsWith("mixed or unknown")) key = "mixed or unknown";
      if (key.startsWith("accidental death")) key = "accidental death";
      if (key.startsWith("violence")) key = "violence";
      if (key.startsWith("drowning")) key = "drowning";
      causeTotals[key] = (causeTotals[key] || 0) + val;
    });
  });

  // Gesamttote (Summe aller Todesursachen)
  const totalDeaths = Object.values(causeTotals).reduce((a, b) => a + b, 0);
  // Fallback für leere Daten
  const globalMax = Object.values(causeTotals).length > 0 ? Math.max(...Object.values(causeTotals)) : 1;

  // --- Anzeige rechts: Deaths in Total ---
  let statsBox = document.getElementById('cod-stats-box');
  // --- Deaths in Total: Summe aller Dead+Missing aus allen Regionen (inkl. Unknown) ---
  let deathsInTotal = 0; // <-- Variable muss VOR der Verwendung definiert werden!
  if (!statsBox) {
    statsBox = document.createElement('div');
    statsBox.id = 'cod-stats-box';
    statsBox.style.position = 'fixed';
    statsBox.style.right = '-30px';
    statsBox.style.top = '120px';
    statsBox.style.background = 'none';
    statsBox.style.color = '#fff';
    // statsBox.style.fontSize = '10px';
    statsBox.style.boxShadow = 'none';
    statsBox.style.zIndex = '10010';
    statsBox.style.minWidth = '0';
    statsBox.style.width = '320px';
    statsBox.style.textAlign = 'left';
    // Lato Schriftart für das gesamte Stats-Box-Element
    statsBox.style.fontFamily = "'Lato', Arial, sans-serif";
    document.body.appendChild(statsBox);
  }

  // deathsInTotal berechnen
  continentTotals.forEach(continentData => {
    continentData.regions.forEach(regionData => {
      const [region] = Object.entries(regionData)[0];
      // Finde die Region in den Rohdaten (continentGroups)
      let rawRegionData = null;
      for (const continent of Object.keys(continentGroups)) {
        for (const regObj of continentGroups[continent]) {
          if (regObj[region]) {
            rawRegionData = regObj[region];
            break;
          }
        }
        if (rawRegionData) break;
      }
      if (rawRegionData) {
        Object.values(rawRegionData).forEach(monthsArr => {
          monthsArr.forEach(monthObj => {
            deathsInTotal += monthObj.totalDeadAndMissing || 0;
          });
        });
      }
    });
  });

  // Für die einzelnen Teile der Anzeige (z.B. Überschrift, Zahl) kannst du die Schriftgröße und Farbe direkt im innerHTML anpassen:
  // Der Abstand zwischen "Deaths in Total" und der Zahl wird durch "margin-bottom" im ersten div bestimmt:
  statsBox.innerHTML = `<div style="font-size:18px;font-weight:550;margin-bottom:3px;color:#FEFCFF;font-family:'Lato',Arial,sans-serif;">Deaths in Total</div>
    <div style="font-size:15px;font-weight:400;color:#FEFCFF;margin-bottom:10px;font-family:'Lato',Arial,sans-serif;" id="cod-total-number">${deathsInTotal.toLocaleString()}</div>
    <div id="cod-cause-detail" style="margin-top:18px;font-family:'Lato',Arial,sans-serif;"></div>`;
  // ---------------------------------------------------------

  let yPosContinent = paddingTop;
  continentTotals.forEach((continentData, continentIdx) => {
    // Kontinentslabel anzeigen (wie in drawDiagram)
    const continentColor = continentBaseColors[continentData.continent] || "#ccc";
    const continentStartY = yPosContinent;
    const continentEndY = yPosContinent + continentData.regions.length * regionHeight;
    const continentMiddleY = (continentStartY + continentEndY) / 2;
    const continentLabel = document.createElement('div');
    continentLabel.className = 'label';
    continentLabel.innerText = continentData.continent;
    continentLabel.style.position = 'absolute';
    continentLabel.style.left = '80px';
    continentLabel.style.top = `${continentMiddleY}px`;
    continentLabel.style.fontSize = '14px'; // 14px für Kontinentnamen
    continentLabel.style.color = '#fff';
    continentLabel.style.transform = 'rotate(-90deg) translateX(-45%) translateY(-30%)';
    continentLabel.style.transformOrigin = 'left top';
    renderer.appendChild(continentLabel);

    continentData.regions.forEach((regionData, regionIndex) => {
      const [region] = Object.entries(regionData)[0];
      const yPosRegion = yPosContinent + (regionIndex * regionHeight);

      // Regionslabel anzeigen (wie in drawDiagram)
      const regionLabel = document.createElement('div');
      regionLabel.className = 'label region-label-dynamic';
      regionLabel.innerText = region;
      regionLabel.style.position = 'absolute';
      regionLabel.style.left = '220px';
      regionLabel.style.top = `${yPosRegion + regionHeight / 2 - 8}px`;
      regionLabel.style.fontSize = '13px';
      regionLabel.style.color = '#ccc';
      regionLabel.style.fontWeight = '100'; // Lato Thin 100
      regionLabel.style.fontFamily = "'Lato', Arial, sans-serif";
      renderer.appendChild(regionLabel);

      // --- ACHTUNG: Schreibweise prüfen ---
      if (!causeOfDeathByRegion.hasOwnProperty(region)) {
        console.warn('Region nicht gefunden in causeOfDeathByRegion:', region);
      }

      // Daten für diese Region (aus echten Daten)
      const codData = causeOfDeathByRegion[region] || {};

      // --- Sortiere die Todesursachen für diese Region nach Wert (aufsteigend, wenig links, viel rechts) ---
      const regionCauses = allCauses.map(cause => ({
        cause,
        value: codData[cause] || 0,
        globalIdx: allCauses.indexOf(cause)
      }));

      // --- Füge "Unknown" Balken hinzu, damit die Summe stimmt ---
      // Berechne die Summe aller bekannten Todesursachen
      const sumKnown = regionCauses.reduce((sum, entry) => sum + entry.value, 0);
      // Berechne die Summe aller Dead+Missing für diese Region aus den Rohdaten
      let totalDead = 0;
      // Finde die Region in den Rohdaten (continentGroups)
      let rawRegionData = null;
      for (const continent of Object.keys(continentGroups)) {
        for (const regObj of continentGroups[continent]) {
          if (regObj[region]) {
            rawRegionData = regObj[region];
            break;
          }
        }
        if (rawRegionData) break;
      }
      if (rawRegionData) {
        Object.values(rawRegionData).forEach(monthsArr => {
          monthsArr.forEach(monthObj => {
            totalDead += monthObj.totalDeadAndMissing || 0;
          });
        });
      }
      const unknownValue = Math.max(0, totalDead - sumKnown);
      if (unknownValue > 0) {
        regionCauses.push({ cause: "Unknown", value: unknownValue, globalIdx: 999 });
      }

      // Sortiere aufsteigend nach value (kleine Werte links, große rechts)
      regionCauses.sort((a, b) => {
        if (a.value !== b.value) return a.value - b.value;
        return a.globalIdx - b.globalIdx;
      });

      let currentX = 350;
      const barSpacing = 1.5; // Abstand zwischen den Balken
      const maxBarAreaWidth = stageWidth - 600;

      // Nur Balken mit Wert > 0 anzeigen, sortiert nach Wert (aufsteigend)
      const regionCausesSorted = regionCauses.filter(entry => entry.value > 0);
      const totalCauses = regionCausesSorted.length;
      const totalBarAreaWidth = Math.max(200, Math.min(220, maxBarAreaWidth));
      regionCausesSorted.forEach((entry, i) => {
        let width = 0;
        // totalBarAreaWidth MUSS hier im Scope stehen!
        if (globalMax > 0) {
          width = (Math.sqrt(entry.value) / Math.sqrt(globalMax)) * totalBarAreaWidth;
        }
        if (width > 0 && width < 2) width = 1;

        // Balken von links nach rechts aufbauen
        const bar = document.createElement('div');
        bar.className = 'cause-bar';
        bar.style.position = 'absolute';
        bar.style.left = `${currentX}px`;
        bar.style.top = `${yPosRegion + regionHeight / 2 - (typeof barHeight !== "undefined" ? barHeight : 8) / 2}px`;
        bar.style.width = `${width}px`;
        bar.style.height = `${typeof barHeight !== "undefined" ? barHeight : 8}px`;
        // Nutze Kontinentfarbe + Verlauf von hell nach dunkel (links nach rechts)
        const barColor = getCauseColor(entry.cause, entry.value, globalMax, continentColor, i, totalCauses);
        bar.style.background = barColor;
        bar.style.borderRadius = `2px`;
        bar.style.opacity = '1';
        bar.removeAttribute('title');
        bar.dataset.cause = entry.cause;
        renderer.appendChild(bar);

        // --- Hover-Effekt: Balken heller machen ---
        bar.addEventListener('mouseenter', () => {
          // Heller machen (wie bei drawDiagram)
          let hoverColor = barColor;
          if (barColor.startsWith('hsl')) {
            hoverColor = barColor.replace(/(\d+)%\)$/, (m, l) => `${Math.min(100, parseInt(l) + 20)}%)`);
          } else if (barColor.startsWith('#')) {
            hoverColor = '#fff';
          }
          bar.style.filter = 'brightness(1.3)';
          bar.style.background = hoverColor;
          bar.style.cursor = 'pointer';
        });
        bar.addEventListener('mouseleave', () => {
          bar.style.filter = '';
          bar.style.background = barColor;
          bar.style.cursor = 'pointer';
        });

        // --- Klick auf Balken: Detailanzeige für Todesursache ---
        bar.addEventListener('click', () => {
          // Nutze den Wert direkt aus entry.value (nicht aus causeTotals[key])
          const color = barColor;
          const value = entry.value;
          const label = entry.cause.charAt(0).toUpperCase() + entry.cause.slice(1);
          const detailDiv = document.getElementById('cod-cause-detail');
          if (detailDiv) {
            // Feste Breite und Zeilenumbruch für lange Texte
            detailDiv.style.width = '320px';
            detailDiv.style.wordBreak = 'break-word';
            // HIER kannst du die Schriftgröße der Anzeige ändern:
            detailDiv.innerHTML = `<div style="font-size:18px;font-weight:600;margin-bottom:2px;color:${color};">${label}</div>
              <div style="font-size:15px;font-weight:500;color:${color};">${value.toLocaleString()}</div>`;
          }
        });

        currentX += width + barSpacing;
      }); // <--- Diese schließende Klammer fehlte!
    }); // <--- Diese schließende Klammer schließt continentData.regions.forEach

    if (continentIdx < continentTotals.length - 1) {
      yPosContinent += continentData.regions.length * regionHeight + extraContinentSpacing;
    } else {
      yPosContinent += continentData.regions.length * regionHeight;
    }
  }); // <--- Diese schließende Klammer schließt continentTotals.forEach

} // <--- Diese schließende Klammer schließt die Funktion drawCauseOfDeathBars

function drawDiagram2() {
  renderer.innerHTML = '';
  renderTabs();

  // Entferne ggf. die "Deaths in Total"-Box, wenn sie existiert (nur für Cause of Death anzeigen)
  const statsBox = document.getElementById('cod-stats-box');
  if (statsBox) statsBox.remove();

  // --- Filter für Gender NUR bei Deaths by Gender anzeigen ---
  // Vorherige Filter-UI entfernen, falls noch vorhanden (z.B. nach Tab-Wechsel)
  let filterContainer = document.getElementById('gender-filter-container');
  if (filterContainer) filterContainer.remove();

  // Stelle sicher, dass selectedGenders immer definiert ist
  if (!drawDiagram2.selectedGenders) {
    drawDiagram2.selectedGenders = { male: true, female: true, children: true };
  }
  // Definiere selectedGenders IMMER, nicht nur im if-Block unten!
  const selectedGenders = drawDiagram2.selectedGenders;

  if (activeDiagram === 'gender') {
    filterContainer = document.createElement('div');
    filterContainer.id = 'gender-filter-container';
    filterContainer.style.position = 'absolute';
    filterContainer.style.left = '78px';
    filterContainer.style.top = 'calc(50% + 220px)';
    filterContainer.style.display = 'flex';
    filterContainer.style.flexDirection = 'column';
    filterContainer.style.gap = '10px';
    filterContainer.style.alignItems = 'flex-start';
    filterContainer.style.zIndex = '10001';
    filterContainer.style.fontSize = '11px';
    filterContainer.style.color = '#fff';
    filterContainer.style.userSelect = 'none';
    const genders = [
      { key: 'male', label: 'Male', color: '#FEB95F' },
      { key: 'female', label: 'Female', color: '#F71735' },
      { key: 'children', label: 'Children', color: '#C2095A' }
    ];

    genders.forEach(g => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '12px';
      row.style.cursor = 'pointer';

      // Checkbox-artiges Kästchen
      const box = document.createElement('div');
      box.style.width = '14px';
      box.style.height = '14px';
      box.style.borderRadius = '5px';
      box.style.border = '2px solid #BEBEBE';
      box.style.transition = 'background 0.4s, border 0.4s';
      box.style.display = 'flex';
      box.style.alignItems = 'center';
      box.style.justifyContent = 'center';
      box.style.marginRight = '2px';
      box.style.background = selectedGenders[g.key] ? '#BEBEBE' : 'transparent';

      // Kein Punkt, nur Füllung wenn aktiv

      // Label
      const label = document.createElement('span');
      label.innerText = g.label;
      label.style.fontWeight = '400';
      label.style.color = g.color;
      label.style.fontSize = '11px';
      label.style.letterSpacing = '0.5px';

      row.appendChild(box);
      row.appendChild(label);

      row.onclick = () => {
        // selectedGenders ist jetzt immer definiert!
        selectedGenders[g.key] = !selectedGenders[g.key];
        drawDiagram2.selectedGenders = selectedGenders;
        drawDiagram2();
      };

      filterContainer.appendChild(row);
    });
    document.body.appendChild(filterContainer);
  }

  const yearCount = genderAndChildrenData.length;
  const circleColor = '#4A90E2';

  // Berechne die Mitte des Renderers
  const centerX = stageWidth / 2;
  const centerY = stageHeight / 2;

  // --- Vertikale Zeitachse mit allen Jahreslabels ---
  const axisContainer = document.createElement('div');
  axisContainer.style.position = 'absolute';
  axisContainer.style.left = '80px';
  axisContainer.style.top = `${centerY - 180}px`;
  axisContainer.style.height = '360px';
  axisContainer.style.width = '90px';
  axisContainer.style.transform = 'rotate(0deg)';
  axisContainer.style.transformOrigin = 'left top';
  renderer.appendChild(axisContainer);

  if (selectedYear === null) selectedYear = 2014;

  // Zeitachse: alle Jahre anzeigen, das ausgewählte weiß (nicht fett), kein Punkt mehr
  for (let i = 0; i < yearCount; i++) {
    const year = genderAndChildrenData[i].year;
    const yPos = (340) * (i / (yearCount - 1));

    const yearRow = document.createElement('div');
    yearRow.style.position = 'absolute';
    yearRow.style.left = '0px';
    yearRow.style.top = `${yPos}px`;
    yearRow.style.width = '80px';
    yearRow.style.height = '28px';
    yearRow.style.display = 'flex';
    yearRow.style.alignItems = 'center';
    yearRow.style.cursor = 'pointer';

    // Nur die Jahreszahl, kein Punkt mehr
    const tick = document.createElement('div');
    tick.className = 'year-label';
    tick.innerText = year;
    tick.style.fontSize = selectedYear === year ? '13px' : '10px';
    tick.style.color = selectedYear === year ? '#fff' : '#aaa';
    tick.style.fontWeight = 'normal';
    tick.style.textAlign = 'left';
    tick.style.width = '50px';
    tick.style.userSelect = 'none';
    yearRow.appendChild(tick);

    yearRow.addEventListener('click', () => {
      selectedYear = year;
      drawDiagram2();
    });

    axisContainer.appendChild(yearRow);
  }

  // --- Monatslabels immer anzeigen ---
  for (let m = 0; m < 12; m++) {
    const angle = (m / 12) * 2 * Math.PI - Math.PI / 2;
    const ringRadius = 300; // außen, für die Labels
    const maxRadius = 70;
    const labelRadius = ringRadius + maxRadius + 10;
    const xLabel = centerX + labelRadius * Math.cos(angle);
    const yLabel = centerY + labelRadius * Math.sin(angle);

    const monthLabel = document.createElement('div');
    monthLabel.style.position = 'absolute';
    monthLabel.style.left = `${xLabel - 18}px`;
    monthLabel.style.top = `${yLabel - 12}px`;
    monthLabel.style.width = '36px';
    monthLabel.style.height = '24px';
    monthLabel.style.display = 'flex';
    monthLabel.style.alignItems = 'center';
    monthLabel.style.justifyContent = 'center';
    monthLabel.style.fontSize = '11px';
    monthLabel.style.color = '#C4C4CC';
    monthLabel.style.borderRadius = '8px';
    monthLabel.style.userSelect = 'none';
    monthLabel.style.fontWeight = '100'; // Lato Thin 100 für Monate
    monthLabel.style.fontFamily = "'Lato', Arial, sans-serif";
    const tangentDeg = angle * 180 / Math.PI + 90;
    monthLabel.style.transform = `rotate(${tangentDeg}deg)`;
    monthLabel.innerText = getMonthShortName(m);
    renderer.appendChild(monthLabel);
  }

  // --- Kreise für Male, Female, Children pro Monat, für das ausgewählte Jahr ---
  const yearData = genderAndChildrenData.find(d => d.year === selectedYear);
  if (!yearData) return;
  const monthsMale = yearData.maleByMonth || [];
  const monthsFemale = yearData.femaleByMonth || [];
  const monthsChildren = yearData.childrenByMonth || [];

  // Die Abstände zwischen den Ringen für Male, Female, Children werden durch diese Variablen bestimmt:
  const ringRadiusMale = 300;
  const ringRadiusFemale = 200;
  const ringRadiusChildren = 100;
  const maxRadius = 70;

  let globalMax = 1;
  genderAndChildrenData.forEach(d => {
    ['maleByMonth', 'femaleByMonth', 'childrenByMonth'].forEach(key => {
      if (d[key]) d[key].forEach(val => { globalMax = Math.max(globalMax, val); });
    });
  });

  function scaleRadius(val, globalMax, maxRadius) {
    const minRadius = 2.5;
    const maxVal = globalMax > 0 ? globalMax : 1;
    return minRadius + ((val / maxVal) * (maxRadius - minRadius));
  }

  function getMonthShortName(monthNumber) {
    const shortNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return shortNames[monthNumber] || "";
  }

  for (let m = 0; m < 12; m++) {
    const angle = (m / 12) * 2 * Math.PI - Math.PI / 2;

    // Male (außen)
    const maleColor = '#FEB95F';      // HIER wird die Farbe für Male-Kreise definiert
    const valMale = monthsMale[m] || 0;
    if (selectedGenders.male && valMale > 0) {
      const radiusMale = scaleRadius(valMale, globalMax, maxRadius);
      const xMale = centerX + ringRadiusMale * Math.cos(angle);
      const yMale = centerY + ringRadiusMale * Math.sin(angle);

      // --- Hover-Funktion für Male ---
      const circle = document.createElement('div');
      circle.style.position = 'absolute';
      circle.style.left = `${xMale - radiusMale}px`;
      circle.style.top = `${yMale - radiusMale}px`;
      circle.style.width = `${radiusMale * 2}px`;
      circle.style.height = `${radiusMale * 2}px`;
      circle.style.borderRadius = '50%';
      circle.style.background = maleColor;
      circle.style.opacity = '0.7';
      circle.removeAttribute('title');
      renderer.appendChild(circle);

      circle.addEventListener('mouseenter', (e) => {
        circle.style.opacity = '1.0';
        showGenderHoverLine({
          x: xMale,
          y: yMale,
          value: valMale,
          gender: 'Male',
          color: maleColor,
          month: getMonthName(m),
          year: selectedYear,
          r: radiusMale
        });
      });
      circle.addEventListener('mouseleave', () => {
        circle.style.opacity = '0.7';
        hideGenderHoverLine();
      });
    }

    // Female (Mitte)
    const femaleColor = '#F71735';    // HIER wird die Farbe für Female-Kreise definiert
    const valFemale = monthsFemale[m] || 0;
    if (selectedGenders.female && valFemale > 0) {
      const radiusFemale = scaleRadius(valFemale, globalMax, maxRadius);
      const xFemale = centerX + ringRadiusFemale * Math.cos(angle);
      const yFemale = centerY + ringRadiusFemale * Math.sin(angle);
      const circle = document.createElement('div');
      circle.style.position = 'absolute';
      circle.style.left = `${xFemale - radiusFemale}px`;
      circle.style.top = `${yFemale - radiusFemale}px`;
      circle.style.width = `${radiusFemale * 2}px`;
      circle.style.height = `${radiusFemale * 2}px`;
      circle.style.borderRadius = '50%';
      circle.style.background = femaleColor;
      circle.style.opacity = '0.7';
      circle.removeAttribute('title');
      renderer.appendChild(circle);

      circle.addEventListener('mouseenter', (e) => {
        circle.style.opacity = '1.0';
        showGenderHoverLine({
          x: xFemale,
          y: yFemale,
          value: valFemale,
          gender: 'Female',
          color: femaleColor,
          month: getMonthName(m),
          year: selectedYear,
          r: radiusFemale
        });
      });
      circle.addEventListener('mouseleave', () => {
        circle.style.opacity = '0.7';
        hideGenderHoverLine();
      });
    }

    // Children (innen)
    const childrenColor = '#C2095A';  // HIER wird die Farbe für Children-Kreise definiert
    const valChildren = monthsChildren[m] || 0;
    if (selectedGenders.children && valChildren > 0) {
      const radiusChildren = scaleRadius(valChildren, globalMax, maxRadius);
      const xChildren = centerX + ringRadiusChildren * Math.cos(angle);
      const yChildren = centerY + ringRadiusChildren * Math.sin(angle);
      const circle = document.createElement('div');
      circle.style.position = 'absolute';
      circle.style.left = `${xChildren - radiusChildren}px`;
      circle.style.top = `${yChildren - radiusChildren}px`;
      circle.style.width = `${radiusChildren * 2}px`;
      circle.style.height = `${radiusChildren * 2}px`;
      circle.style.borderRadius = '50%';
      circle.style.background = childrenColor;
      circle.style.opacity = '0.7';
      circle.removeAttribute('title');
      renderer.appendChild(circle);

      circle.addEventListener('mouseenter', (e) => {
        circle.style.opacity = '1.0';
        showGenderHoverLine({
          x: xChildren,
          y: yChildren,
          value: valChildren,
          gender: 'Children',
          color: childrenColor,
          month: getMonthName(m),
          year: selectedYear,
          r: radiusChildren
        });
      });
      circle.addEventListener('mouseleave', () => {
        circle.style.opacity = '0.7';
        hideGenderHoverLine();
      });
    }
  }

  // --- Hover-Linie und Info-Box für Gender-Kreise ---
  function showGenderHoverLine({ x, y, value, gender, color, month, year, r }) {
    hideGenderHoverLine();

    const infoOffset = 18 + Math.max(18, r);
    const infoX = x + infoOffset;
    const infoY = y - 30;

    let svg = document.getElementById('gender-hover-svg');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('id', 'gender-hover-svg');
      svg.style.position = 'absolute';
      svg.style.left = '0';
      svg.style.top = '0';
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.pointerEvents = 'none';
      svg.style.zIndex = '9999';
      renderer.appendChild(svg);
    }

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x + r);
    line.setAttribute('y1', y);
    line.setAttribute('x2', x + r);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('id', 'gender-hover-line');
    svg.appendChild(line);

    const targetX = infoX;
    const targetY = infoY + 28;

    let progress = 0;
    function animateLine() {
      progress += 0.16;
      if (progress > 1) progress = 1;
      const curX = x + r + (targetX - (x + r)) * progress;
      const curY = y + (targetY - y) * progress;
      line.setAttribute('x2', curX);
      line.setAttribute('y2', curY);
      if (progress < 1) {
        requestAnimationFrame(animateLine);
      }
    }
    animateLine();

    let infoBox = document.getElementById('gender-hover-info');
    if (!infoBox) {
      infoBox = document.createElement('div');
      infoBox.id = 'gender-hover-info';
      infoBox.style.position = 'absolute';
      infoBox.style.zIndex = '10000';
      infoBox.style.minWidth = '140px';
      infoBox.style.minHeight = '54px';
      infoBox.style.background = 'rgba(30,30,30,0.98)';
      infoBox.style.color = '#fff';
      infoBox.style.borderRadius = '14px';
      infoBox.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18)';
      infoBox.style.padding = '14px 18px 10px 18px';
      infoBox.style.fontSize = '15px';
      infoBox.style.fontFamily = 'inherit';
      infoBox.style.pointerEvents = 'none';
      renderer.appendChild(infoBox);
    }
    infoBox.style.left = `${infoX}px`;
    infoBox.style.top = `${infoY}px`;
    infoBox.innerHTML = `
      <div style="font-size:15px;font-weight:600;margin-bottom:2px;color:${color};">${gender}</div>
      <div style="margin-bottom:2px;">${month} ${year}</div>
      <div style="font-size:17px;font-weight:700;">${value} deaths</div>
    `;
    infoBox.style.display = 'block';
  }

  function hideGenderHoverLine() {
    const svg = document.getElementById('gender-hover-svg');
    if (svg) svg.remove();
    const infoBox = document.getElementById('gender-hover-info');
    if (infoBox) infoBox.remove();
  }
}

function getMonthName(monthNumber) {
  const monthMap = {
    0: "January",
    1: "February",
    2: "March",
    3: "April",
    4: "May",
    5: "June",
    6: "July",
    7: "August",
    8: "September",
    9: "October",
    10: "November",
    11: "December"
  };
  return monthMap[monthNumber] || "Invalid month";
}

// Initiales Rendering: Tabs und Diagramm
document.addEventListener('DOMContentLoaded', () => {
  // Fehler: removeOldToggleButtons ist nicht definiert
  // Lösung: Funktion nur aufrufen, wenn sie existiert
  if (typeof removeOldToggleButtons === 'function') {
    removeOldToggleButtons();
  }
  renderTabs();
  drawDiagram();
});

// Optional: Lato Schriftart global für das ganze Dokument laden (nur einmal beim ersten Laden)
if (!document.getElementById('lato-font-link')) {
  const link = document.createElement('link');
  link.id = 'lato-font-link';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css?family=Lato:100,300,400,700&display=swap';
  document.head.appendChild(link);
  document.body.style.fontFamily = "'Lato', Arial, sans-serif";
}