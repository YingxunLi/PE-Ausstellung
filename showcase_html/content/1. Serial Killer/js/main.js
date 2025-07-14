let renderer;
let stageHeight;
let stageWidth;
let sortedData;
const lineHeight = 6; // Höhe der Linien auf 3px erhöht
const lineGap = 3; // Abstand zwischen den Linien auf 6px erhöht

let groupData;
let mapInstance; // Globale Variable für die Karteninstanz
let markerGroup; // NEU: Eine Gruppe für alle Marker
let killerDots = {}; // Globale Variable zum Speichern der Punkt-Elemente
let currentDotView = null; // NEU: Speichert die aktuelle Cluster-Ansicht

// Warten, bis das DOM vollständig geladen ist
document.addEventListener('DOMContentLoaded', init);

const continentLabel = document.querySelector('.continentLabel');
let infoPanel; // Variable für das Info-Panel

function init() {
  renderer = document.querySelector('#renderer');
  infoPanel = document.querySelector('#info-panel');
  stageWidth = renderer.clientWidth;
  stageHeight = renderer.clientHeight;
  prepareData();
  // Entfernen Sie den direkten Aufruf von drawDiagram(),
  // damit der Renderer beim Start leer ist (oder eine Startansicht zeigt).
  drawDiagram();

  // Funktion aufrufen, um die Buttons hinzuzufügen
  addButton();
}

function prepareData() {
  // Jahre extrahieren
  data.forEach((element, index) => {
    const string = element.YearsActive.toString();
    const array = string.split('–');
    element.yearStart = parseInt(array[0]);
    element.yearEnd = parseInt(array[1]);

    // Eindeutige ID für jeden Killer hinzufügen
    element.uniqueId = `killer-${index}`;

    // NEU: Sicherstellen, dass Opferzahlen als Integer behandelt werden
    element.ProvenVictims = parseInt(element.ProvenVictims, 10) || 0;
    element.PossibleVictims = parseInt(element.PossibleVictims, 10) || 0;
  });

  filteredData = data.filter(element => {
    return element.yearStart >= 1900;
  });
  //console.log(filteredData); // Debug: Überprüfe die gefilterten Daten
  // Sortiere Daten absteigend nach Proven victims
  sortedData = filteredData.slice().sort((a, b) => (b["ProvenVictims"] || 0) - (a["ProvenVictims"] || 0));
  console.log(sortedData)

  console.log(filteredData)
  groupData = gmynd.groupData(filteredData, 'Continent')
  console.log(groupData); // Debug: Überprüfe die gruppierten Daten

}

function drawMap() {
  console.log('--- Start drawMap ---');
  currentDotView = 'map'; // Ansicht-Typ setzen
  const dotConfigs = [];

  // Positionen für die Cluster auf dem Bildschirm (in Prozent)
  const continentScreenCoords = {
    'North America': { x: '30%', y: '40%' },
    'South America': { x: '40%', y: '80%' },
    'Europe': { x: '55%', y: '50%' },
    'Asia': { x: '75%', y: '40%' },
    'Africa': { x: '65%', y: '80%' },
    'Oceania': { x: '90%', y: '65%' },
    'Australia': { x: '90%', y: '65%' }
  };

  // Feste Farbzuweisung für jeden Kontinent
  const continentColors = {
    'North America': '#FF0000',
    'Europe': '#D30404',
    'Asia': '#8E0000',
    'South America': '#B71C1C',
    'Africa': '#8E0000',
    'Oceania': '#5A0000 ',
    'Australia': '#5A0000 '
  };

  Object.entries(groupData).forEach(([continentName, killers]) => {
    if (continentName === 'undefined' || killers.length === 0) return;
    const center = continentScreenCoords[continentName];
    if (!center) return;

    const continentColor = continentColors[continentName] || '#FF8A80';
    const getDotPosition = initCircleOfDots_SimpleRings();
    const clusterScale = 16;

    killers.forEach((killer, index) => {
      const pos = getDotPosition(index);
      const offsetX = pos.x * clusterScale;
      const offsetY = pos.y * clusterScale;
      
      dotConfigs.push({
        id: killer.uniqueId,
        x: `calc(${center.x} + ${offsetX}px)`,
        y: `calc(${center.y} + ${offsetY}px)`,
        color: continentColor,
        info: `Continent: ${continentName}<br>Name: ${killer.Name}`
      });
    });
  });

  updateDots(dotConfigs);
}

function drawDiagram() {
  // WICHTIG: Bestehende Leaflet-Karte sauber entfernen
  if (mapInstance) {
    mapInstance.getContainer().style.display = 'none';
  }

  // Container zuerst leeren und Scrolling deaktivieren
  renderer.innerHTML = '';
  renderer.style.overflowY = 'hidden'; // Scrolling deaktivieren
  renderer.style.backgroundColor = '#1a1a2e'; // Hintergrund explizit setzen

  // Min und Max Jahre bestimmen
  const yearMin = 1900;
  const yearMax = 2024;

  console.log(sortedData, yearMin, yearMax);

  const verticalOffset = 100; // Startposition nach oben verschoben
  const horizontalOffset = 280; // Start-X-Position nach rechts verschoben
  const diagramHeight = stageHeight - verticalOffset - 20; // Verfügbare Höhe für das Diagramm

  // Dynamische Berechnung der Linienhöhe und des Abstands
  const totalLineHeight = diagramHeight / sortedData.length;
  const dynamicLineHeight = Math.max(1, totalLineHeight * 0.6); // 60% für die Linie
  const dynamicLineGap = totalLineHeight - dynamicLineHeight;

  sortedData.forEach((element, index) => {
    // console.log(element); // Debug: Überprüfe den Inhalt jedes Elements

    const x1 = map(element.yearStart, yearMin, yearMax, horizontalOffset, stageWidth - 50);
    const x2 = map(element.yearEnd, yearMin, yearMax, horizontalOffset, stageWidth - 50);
    const y = index * (dynamicLineHeight + dynamicLineGap) + verticalOffset;

    const lineDiv = document.createElement('div');
    lineDiv.classList.add('line');
    lineDiv.style.top = y + 'px';
    lineDiv.style.left = x1 + 'px';
    lineDiv.style.width = (x2 - x1) + 'px';
    lineDiv.style.height = dynamicLineHeight + 'px';
    lineDiv.style.backgroundColor = '#FF0000'; // Farbe auf leuchtendes Rot gesetzt

    // Tooltip erstellen
    const tooltip = document.createElement('div');
    tooltip.classList.add('tooltip');
    tooltip.style.display = 'none';
    const personName = element.Name || 'Unbekannt'; // Fallback, falls `name` fehlt
    tooltip.textContent = `${personName}: Aktiv von ${element.yearStart} bis ${element.yearEnd}`;
    document.body.appendChild(tooltip);

    lineDiv.addEventListener('mouseover', (event) => {
      lineDiv.style.height = (dynamicLineHeight * 2) + 'px'; // Hover-Effekt angepasst
      lineDiv.style.zIndex = '10'; // Linie im Vordergrund
      lineDiv.style.backgroundColor = '#ff6347';

      tooltip.style.display = 'block';
      tooltip.style.left = event.pageX + 'px';
      tooltip.style.top = (event.pageY - 30) + 'px';
    });

    lineDiv.addEventListener('mousemove', (event) => {
      tooltip.style.left = event.pageX + 'px';
      tooltip.style.top = (event.pageY - 30) + 'px';
    });

    lineDiv.addEventListener('mouseout', () => {
      lineDiv.style.height = dynamicLineHeight + 'px';
      lineDiv.style.zIndex = '1';
      lineDiv.style.backgroundColor = '#FF0000'; // Farbe zurücksetzen

      tooltip.style.display = 'none';
    });

    renderer.appendChild(lineDiv);
  });
  currentDotView = null; // NEU: Zurücksetzen, da dies keine Punkt-Ansicht ist
}

function cleanupViews() {
    // Bestehende Leaflet-Karte sauber entfernen
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }
    // Container leeren
    renderer.innerHTML = '';
}

function drawVictimDiagram(top40Killers) {
  cleanupViews(); // Alte Ansichten inkl. Punkte entfernen
  renderer.style.overflowY = 'auto'; // Scrolling erlauben
  currentDotView = null; // NEU: Zurücksetzen

  const verticalOffset = 150; // Startposition von oben
  const barHeight = 12; // Höhe der Balken
  const lineGap = 12; // Abstand zwischen den Zeilen
  const barStartX = 300; // Startpunkt der Balken wieder auf den ursprünglichen Wert gesetzt

  // Titel für die Ansicht hinzufügen
  const title = document.createElement('h2');
  title.textContent = 'Top 40';
  title.style.position = 'absolute';
  title.style.top = '80px';
  title.style.left = '50%';
  title.style.transform = 'translateX(-50%)';
  title.style.color = 'rgba(255, 255, 255, 0.8)';
  title.style.fontSize = '22px';
  renderer.appendChild(title);

  const provenValues = top40Killers.map(k => k["ProvenVictims"] || 0);
  const minProven = Math.min(...provenValues);
  const maxProven = Math.max(...provenValues);

  // Finde das absolute Maximum aus allen möglichen Opfern, um die Skala zu definieren
  const maxPossible = Math.max(...top40Killers.map(k => k["PossibleVictims"] || k["ProvenVictims"] || 0));

  top40Killers.forEach((element, index) => {
    const provenVictims = element["ProvenVictims"] || 0;
    // Nutze ProvenVictims als Fallback für PossibleVictims
    const possibleVictims = element["PossibleVictims"] || provenVictims;

    const y = index * (barHeight + lineGap) + verticalOffset;

    // Die Namens-Labels werden nicht mehr gezeichnet.

    // Balken zeichnen
    // Die Breite wird relativ zum maximal möglichen Wert aller Top 40 berechnet
    const possibleBarWidth = map(possibleVictims, 0, maxPossible, 0, stageWidth - barStartX - 150);
    const provenBarWidth = map(provenVictims, 0, maxPossible, 0, stageWidth - barStartX - 150);

    // Äußerer Balken (dunkler) für mögliche Opfer
    const possibleBar = document.createElement('div');
    possibleBar.classList.add('bar', 'possible-bar');
    possibleBar.style.position = 'absolute';
    possibleBar.style.top = y + 'px';
    possibleBar.style.left = barStartX + 'px';
    possibleBar.style.width = possibleBarWidth + 'px';
    possibleBar.style.height = barHeight + 'px';
    possibleBar.style.backgroundColor = '#8B0000'; // Dunkles Rot

    // Innerer Balken (heller) für bestätigte Opfer
    const provenBar = document.createElement('div');
    provenBar.classList.add('bar', 'proven-bar');
    provenBar.style.position = 'absolute';
    provenBar.style.top = y + 'px';
    provenBar.style.left = barStartX + 'px';
    provenBar.style.width = provenBarWidth + 'px';
    provenBar.style.height = barHeight + 'px';
    // Helligkeit basierend auf der Opferzahl für einen visuellen Effekt
    provenBar.style.backgroundColor = '#FF0000'; // Helles, kräftiges Rot

    const updateInfoPanel = (content) => {
      infoPanel.innerHTML = content;
      infoPanel.style.display = 'block';
    };

    // Event-Listener für beide Balken, da sie übereinander liegen
    const containerBar = document.createElement('div');
    containerBar.style.position = 'absolute';
    containerBar.style.top = y + 'px';
    containerBar.style.left = barStartX + 'px';
    containerBar.style.width = possibleBarWidth + 'px';
    containerBar.style.height = barHeight + 'px';
    containerBar.style.cursor = 'pointer';

    containerBar.addEventListener('mouseover', () => updateInfoPanel(`Proven Victims: ${provenVictims}<br>Possible Victims: ${possibleVictims}<br><br>Name: <strong>${element.Name}</strong>`));
    containerBar.addEventListener('mouseout', () => { infoPanel.style.display = 'none'; });

    // Zuerst den Container für die Events, dann die sichtbaren Balken hinzufügen
    renderer.appendChild(possibleBar);
    renderer.appendChild(provenBar);
    renderer.appendChild(containerBar); // Unsichtbarer Container für Hover-Events über beide Balken
  });
}

// Zeichne zuerst Possible Bar
// X-Wert immer gleich 
// Berechne die Länge

// Zeichne Proven Bar
// X-Wert ist die Länge vom Possible Bar
// Berechne die Länge mit Anzahl der

function addButton() {
  // Überschrift erstellen
  const heading = document.createElement('h1');
  heading.textContent = 'Serial Killer 1900 - 2024';
  heading.style.position = 'absolute';
  heading.style.left = '20px';
  heading.style.top = '10px';
  heading.style.fontSize = '24px';
  heading.style.color = 'white';
  heading.style.zIndex = '1000';
  document.body.appendChild(heading);

  const group1Container = document.querySelector('#group1');
  const group2Container = document.querySelector('#group2');
  group1Container.innerHTML = '';
  group2Container.innerHTML = '';

  // --- Buttons ---
  const overviewButton = document.createElement('button');
  overviewButton.textContent = 'Year Overview';
  overviewButton.id = 'overviewButton';
  overviewButton.className = 'btn btn-primary active'; // Standardmäßig aktiv

  const top40Button = document.createElement('button');
  top40Button.textContent = 'Top 40';
  top40Button.id = 'victimBarsButton';
  top40Button.className = 'btn btn-secondary';

  const continentsButton = document.createElement('button');
  continentsButton.textContent = 'Continents';
  continentsButton.id = 'secondButton';
  continentsButton.className = 'btn btn-primary';

  const victimGroupButton = document.createElement('button');
  victimGroupButton.textContent = 'Victim group';
  victimGroupButton.id = 'typificationButton';
  victimGroupButton.className = 'btn btn-secondary';

  const classificationButton = document.createElement('button');
  classificationButton.textContent = 'Classification';
  classificationButton.id = 'typeButton';
  classificationButton.className = 'btn btn-secondary';

  // --- Event Listeners ---
  overviewButton.addEventListener('click', () => {
    switchView(drawDiagram);
    // Active-Status der Hauptbuttons umschalten
    overviewButton.classList.add('active');
    continentsButton.classList.remove('active');
    
    // UI-Elemente für andere Ansichten ausblenden
    document.querySelector('.continentLabel').style.display = 'none';
    infoPanel.style.display = 'none';
  });

  top40Button.addEventListener('click', () => {
    switchView(() => {
        const top40Killers = sortedData.slice(0, 40);
        drawVictimDiagram(top40Killers);
        document.querySelector('.continentLabel').style.display = 'none';
    });
  });

  continentsButton.addEventListener('click', () => {
    switchView(drawMap);
    // Active-Status der Hauptbuttons umschalten
    continentsButton.classList.add('active');
    overviewButton.classList.remove('active');

    // UI-Elemente für diese Ansicht einblenden
    document.querySelector('.continentLabel').style.display = 'block';
  });

  victimGroupButton.addEventListener('click', (e) => {
    e.stopPropagation();
    switchView(drawByTypification);
  });

  classificationButton.addEventListener('click', (e) => {
    e.stopPropagation();
    switchView(drawByType);
  });

  // Buttons zu den Containern hinzufügen
  group1Container.appendChild(overviewButton);
  group1Container.appendChild(top40Button);
  group2Container.appendChild(continentsButton);
  group2Container.appendChild(victimGroupButton);
  group2Container.appendChild(classificationButton);
}

function switchView(drawFunction) {
    const isDotView = ['drawMap', 'drawByTypification', 'drawByType'].includes(drawFunction.name);

    // Immer faden, wenn die Zielansicht KEINE Punkt-Ansicht ist.
    // Oder faden, wenn von einer Nicht-Punkt- zu einer Punkt-Ansicht gewechselt wird.
    if (!isDotView || (isDotView && !currentDotView)) {
        renderer.style.opacity = '0';
        setTimeout(() => {
            drawFunction();
            // Wenn es keine Punkt-Ansicht ist, stellen wir sicher, dass der Renderer leer ist
            if (!isDotView) {
                Object.values(killerDots).forEach(dot => dot.remove());
                killerDots = {};
            }
            renderer.style.opacity = '1';
        }, 300);
    } else { // Nur zwischen Punkt-Ansichten wird direkt animiert (ohne Fade)
        drawFunction();
    }
}

function updateDots(dotConfigs) {
    const activeIds = new Set(dotConfigs.map(c => c.id));

    // 1. Vorhandene Punkte aktualisieren oder neue erstellen
    dotConfigs.forEach(config => {
        let dot = killerDots[config.id];

        if (!dot) { // Punkt existiert nicht -> neu erstellen
            dot = document.createElement('div');
            dot.className = 'killer-dot';
            dot.style.opacity = '0'; // Startet unsichtbar
            renderer.appendChild(dot);
            killerDots[config.id] = dot;

            dot.addEventListener('mouseover', () => {
                dot.style.transform = 'scale(1.5)';
                infoPanel.innerHTML = dot.dataset.info;
                infoPanel.style.display = 'block';
            });
            dot.addEventListener('mouseout', () => {
                dot.style.transform = 'scale(1)';
                infoPanel.style.display = 'none';
            });
        }

        // Daten für den Tooltip speichern
        dot.dataset.info = config.info;

        // Style-Änderungen mit kurzer Verzögerung anwenden, damit die Transition greift
        setTimeout(() => {
            dot.style.left = config.x;
            dot.style.top = config.y;
            dot.style.backgroundColor = config.color;
            dot.style.opacity = '1';
        }, 50);
    });

    // 2. Nicht mehr benötigte Punkte ausblenden und entfernen
    Object.keys(killerDots).forEach(id => {
        if (!activeIds.has(id)) {
            const dot = killerDots[id];
            dot.style.opacity = '0';
            dot.style.transform = 'scale(0)';
            setTimeout(() => {
                dot.remove();
                delete killerDots[id];
            }, 800); // Muss zur CSS-Transition-Dauer passen
        }
    });

    // Alte Ansichten (Linien, Balken) entfernen, falls vorhanden
    if (currentDotView) {
        renderer.querySelectorAll('.line, .bar, h2').forEach(el => el.remove());
    }
    renderer.style.overflowY = 'hidden';
}


function initCircleOfDots_SimpleRings() {
  let arr = [{ x: 0, y: 0 }];
  let r = 1;

  function getDotPosition(index) {
    if (index < arr.length) {
      return arr[index];
    }

    while (arr.length <= index) {
      let dotsOnRing = Math.round(2 * Math.PI * r);
      let angle = Math.PI;
      let angleInc = (-Math.PI * 2) / dotsOnRing;
      for (let j = 0; j < dotsOnRing; j++) {
        let x = Math.sin(angle) * r;
        let y = Math.cos(angle) * r;
        arr.push({ x, y });
        angle += angleInc;
      }
      r++;
    }
    return arr[index];
  }

  return getDotPosition;
}

// map Funktion wie bei Canvas
function map(value, min1, max1, min2, max2) {
  return ((value - min1) / (max1 - min1)) * (max2 - min2) + min2;
}

function drawByTypification() {
  console.log('--- Start drawByTypification ---');
  currentDotView = 'typification'; // Ansicht-Typ setzen
  const dotConfigs = [];

  const typificationGroups = gmynd.groupData(filteredData, 'OpferNotizen');
  const sortedGroups = Object.entries(typificationGroups).sort(([, a], [, b]) => b.length - a.length);

  const positions = [
    { x: '25%', y: '25%' }, { x: '80%', y: '30%' }, { x: '50%', y: '45%' },
    { x: '25%', y: '65%' }, { x: '75%', y: '70%' }, { x: '40%', y: '85%' },
    { x: '60%', y: '15%' }, { x: '85%', y: '50%' }
  ];
  const redPalette = ['#FF0000', '#E70000', '#D30404', '#B71C1C', '#B50404', '#8E0000', '#8E0000', '#8E0000'];

  const groupStyles = {};
  sortedGroups.forEach(([name], index) => {
    if (index < positions.length) {
      groupStyles[name] = {
        center: positions[index],
        color: redPalette[index] || redPalette[redPalette.length - 1]
      };
    }
  });
  if (groupStyles['undefined']) {
    groupStyles['undefined'].color = '#9E9E9E';
    groupStyles['undefined'].center = positions[positions.length - 1];
  }

  sortedGroups.forEach(([groupName, killers]) => {
    const style = groupStyles[groupName];
    if (!style) return;

    const { center, color } = style;
    const getDotPosition = initCircleOfDots_SimpleRings();
    const clusterScale = 16;

    killers.forEach((killer, index) => {
      const pos = getDotPosition(index);
      const offsetX = pos.x * clusterScale;
      const offsetY = pos.y * clusterScale;
      
      dotConfigs.push({
        id: killer.uniqueId,
        x: `calc(${center.x} + ${offsetX}px)`,
        y: `calc(${center.y} + ${offsetY}px)`,
        color: color,
        info: `Victim group: ${groupName}<br>Possible Victims: ${killer.PossibleVictims}<br><br>Name: <strong>${killer.Name}</strong>`
      });
    });
  });

  updateDots(dotConfigs);
}

function drawByType() {
  console.log('--- Start drawByType ---');
  currentDotView = 'type'; // Ansicht-Typ setzen
  const dotConfigs = [];

  const typeGroups = gmynd.groupData(filteredData, 'TypisierungNotizen');
  const sortedGroups = Object.entries(typeGroups).sort(([, a], [, b]) => b.length - a.length);

  const positions = [
    { x: '50%', y: '20%' }, 
    { x: '25%', y: '35%' }, { x: '75%', y: '35%' },
    { x: '15%', y: '55%' }, { x: '50%', y: '50%' }, { x: '85%', y: '55%' },
    { x: '25%', y: '75%' }, { x: '75%', y: '75%' },
    { x: '50%', y: '90%' },
    { x: '35%', y: '25%' }, 
    { x: '65%', y: '25%' },
    { x: '40%', y: '85%' }
  ];
  const redPalette = ['#FF0000', '#E70000', '#D30404', '#B71C1C', '#B50404', '#8E0000', '#8E0000', '#8E0000'];

  const typeStyles = {};
  sortedGroups.forEach(([name], index) => {
    if (index < positions.length) {
      typeStyles[name] = {
        center: positions[index],
        color: redPalette[index] || redPalette[redPalette.length - 1]
      };
    }
  });
  if (typeStyles['undefined']) {
    typeStyles['undefined'].color = '#9E9E9E';
    typeStyles['undefined'].center = positions[positions.length - 1];
  }

  sortedGroups.forEach(([typeName, killers]) => {
    const style = typeStyles[typeName];
    if (!style) return;

    const { center, color } = style;
    const getDotPosition = initCircleOfDots_SimpleRings();
    const clusterScale = 16;

    killers.forEach((killer, index) => {
      const pos = getDotPosition(index);
      const offsetX = pos.x * clusterScale;
      const offsetY = pos.y * clusterScale;
      
      dotConfigs.push({
        id: killer.uniqueId,
        x: `calc(${center.x} + ${offsetX}px)`,
        y: `calc(${center.y} + ${offsetY}px)`,
        color: color,
        info: `Classification: ${typeName}<br>Possible Victims: ${killer.PossibleVictims}<br><br>Name: <strong>${killer.Name}</strong>`
      });
    });
  });

  updateDots(dotConfigs);
}