const renderer = document.querySelector('#renderer');
const style = document.createElement('style');
style.textContent = `
/* Chrome, Safari, Edge */
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type=number] {
  -moz-appearance: textfield;
}
`;
document.head.appendChild(style);

// const stageHeight = renderer.clientHeight;
// const stageWidth = renderer.clientWidth;
const stageHeight = window.innerHeight;
const stageWidth = window.innerWidth;
// let currentView = "glon"; // oder "discoveryyear"
let currentView = localStorage.getItem("viewMode") || "glon";
let yearLimit = parseInt(localStorage.getItem("yearLimit")) || Infinity;

let activeMethodFilter = localStorage.getItem("activeMethod") || null;
let galacticMode = localStorage.getItem("galacticMode") || "cluster";
let methodMode = localStorage.getItem("methodMode") || "dominant";



console.log("Aktueller ViewMode:", currentView);
console.log("Aktiver Filter beim Laden:", activeMethodFilter);





fetch('newDataFull.json')
  .then(res => res.json())
  .then(locations => {

        // Tooltip-Element
    const hoverTooltip = document.createElement('div');
    hoverTooltip.style.position = 'absolute';
    hoverTooltip.style.background = 'rgba(0, 0, 0, 0.8)';
    hoverTooltip.style.color = '#fff';
    hoverTooltip.style.padding = '20px 20px';
    hoverTooltip.style.borderRadius = '5px';
    hoverTooltip.style.fontFamily = 'tektur, sans-serif';
    hoverTooltip.style.fontSize = '12px';
    hoverTooltip.style.pointerEvents = 'none';
    hoverTooltip.style.border = '3px solid rgba(255, 255, 255, 1)'; // Rahmenfarbe weiß mit Transparenz
    hoverTooltip.style.zIndex = '10000';
    hoverTooltip.style.display = 'none';
    document.body.appendChild(hoverTooltip);


      // Zähler initialisieren
      let count_rade = 0;
      let count_radj = 0;
      let count_orbsmax = 0;
      let count_dens = 0;
      let count_eqt = 0;
      let count_insol = 0;
      let count_masse = 0;
      let count_complete = 0;
      let count_disc_locale_space = 0; 
      let count_disc_locale_earth = 0; 
      let count_disc_locale_mixed = 0; 


      locations.forEach(p => {

        if (p.disc_locale === 'Space') count_disc_locale_space++;
        if (p.disc_locale === 'Ground') count_disc_locale_earth++;
        if (p.disc_locale === 'Multiple Locales') count_disc_locale_mixed++;

        if (p.pl_rade !== undefined && p.pl_rade !== null && p.pl_rade !== "") count_rade++;
        if (p.pl_radj !== undefined && p.pl_radj !== null && p.pl_radj !== "") count_radj++;
        if (p.pl_orbsmax !== undefined && p.pl_orbsmax !== null && p.pl_orbsmax !== "") count_orbsmax++;
        if (p.pl_dens !== undefined && p.pl_dens !== null && p.pl_dens !== "") count_dens++;
        if (p.pl_eqt !== undefined && p.pl_eqt !== null && p.pl_eqt !== "") count_eqt++;
        if (p.pl_insol !== undefined && p.pl_insol !== null && p.pl_insol !== "") count_insol++;
        if (p.pl_masse !== undefined && p.pl_masse !== null && p.pl_masse !== "") count_masse++;

      });

      // // Ausgabe in der Konsole
      // console.log("Planeten mit pl_rade:", count_rade);
      // console.log("Planeten mit pl_orbsmax:", count_orbsmax);
      // console.log("Planeten mit pl_dens:", count_dens);
      // console.log("Planeten mit pl_eqt:", count_eqt);
      // console.log("Planeten mit pl_insol:", count_insol);
      // console.log("Planeten mit pl_radj:", count_radj);
      // console.log("Planeten mit pl_masse:", count_masse);
      // console.log("Planeten mit pl_complete:", count_complete);
      // console.log("Planeten mit disc_locale_ground:", count_disc_locale_space);
      // console.log("Planeten mit disc_locale_earth:", count_disc_locale_earth);
      // console.log("Planeten mit disc_locale_mixed:", count_disc_locale_mixed);


      // Gebe von den oberen werten jeweils den maximalen und minimalen wert an
      const maxRade = Math.max(...locations.map(p => p.pl_rade || 0));
      const minRade = Math.min(...locations.map(p => p.pl_rade || Infinity));
      const maxOrbsmax = Math.max(...locations.map(p => p.pl_orbsmax || 0));
      const minOrbsmax = Math.min(...locations.map(p => p.pl_orbsmax || Infinity));
      const maxDens = Math.max(...locations.map(p => p.pl_dens || 0));
      const minDens = Math.min(...locations.map(p => p.pl_dens || Infinity));
      const maxEqt = Math.max(...locations.map(p => p.pl_eqt || 0));
      const minEqt = Math.min(...locations.map(p => p.pl_eqt || Infinity));
      const maxInsol = Math.max(...locations.map(p => p.pl_insol || 0));
      const minInsol = Math.min(...locations.map(p => p.pl_insol || Infinity));
      const maxOrbit = Math.max(...locations.map(p => p.pl_orbper || 0));
      const minOrbit = Math.min(...locations.map(p => p.pl_orbper || Infinity));
      const maxRadj = Math.max(...locations.map(p => p.pl_radj || 0));
      const minRadj = Math.min(...locations.map(p => p.pl_radj || Infinity));
      const minMasse = Math.min(...locations.map(p => p.pl_masse || Infinity));
      const maxMasse = Math.max(...locations.map(p => p.pl_masse || 0));
      

      // // Ausgabe der Maximal- und Minimalwerte in der Konsole
      // console.log("Max pl_orbper:", maxOrbit, "Min pl_orbper:", minOrbit);
      // console.log("Max pl_rade:", maxRade, "Min pl_rade:", minRade);
      // console.log("Max pl_orbsmax:", maxOrbsmax, "Min pl_orbsmax:", minOrbsmax);
      // console.log("Max pl_dens:", maxDens, "Min pl_dens:", minDens);
      // console.log("Max pl_eqt:", maxEqt, "Min pl_eqt:", minEqt);
      // console.log("Max pl_insol:", maxInsol, "Min pl_insol:", minInsol);
      // console.log("Max pl_radj:", maxRadj, "Min pl_radj:", minRadj);
      // console.log("Max pl_masse:", maxMasse, "Min pl_masse:", minMasse);

      
      // const comparison = localStorage.getItem("count_complete") || 0; // Anzahl der Planeten mit Masse, Radius und Dichte aus dem Local Storage


    // const binSizeDeg = 3; // NEU: oben setzen bei den anderen Einstellungen
    // const binSizeDeg = parseFloat(localStorage.getItem('degreeValue')) || 3;
    let binSizeDeg = parseFloat(localStorage.getItem('degreeValue')) || 3;
    if (methodMode === "single") binSizeDeg = 0.1;
    
    // const binSize = 100; // Bin-Größe in Lichtjahren
    const binSize = parseFloat(localStorage.getItem('distanceValue')) || 107.29;  // Standardwert 107.29 parsec (1 Parsec = 3.26156
    // if {(methodMode === "single") binSize = 0.1; // Setze die Bin-Größe für den Single-Method-Modus

    // const scale = 10; // Skaliert die Entfernungen (damit sie auf dem Bildschirm darstellbar sind)
    const scale = parseFloat(localStorage.getItem('scaleValue')) || 1;


    const yearMethodData = {}; // { 1995: { 'Transit': 3, 'Imaging': 1, ... }, 1996: { ... }, ... }

    locations.forEach(p => {
      const year = +p.disc_year;
      const method = p.discoverymethod || "unknown";
      if (isNaN(year)) return;

      if (!yearMethodData[year]) yearMethodData[year] = {};
      if (!yearMethodData[year][method]) yearMethodData[year][method] = 0;
      yearMethodData[year][method]++;
    });

    const allYears = locations
      .map(p => +p.disc_year) // alle disc_year-Werte extrahieren
      .filter(y => !isNaN(y)); // nur gültige Zahlen behalten

    const minYear = Math.min(...allYears); // kleinster disc_year-Wert 
    const maxYear = Math.max(...allYears); //   größter disc_year-Wert

    if (currentView === "glon") {
      const customSlider = document.createElement("div");
      customSlider.style.position = "fixed";
      customSlider.style.bottom = "80px";
      customSlider.style.left = "50%";
      customSlider.style.transform = "translateX(-50%)";
      customSlider.style.width = "1200px";
      customSlider.style.height = "4px";
      customSlider.style.background = "rgba(255,255,255,0.1)";
      customSlider.style.borderRadius = "2px";
      customSlider.style.cursor = "pointer";
      customSlider.style.zIndex = "1000";
      renderer.appendChild(customSlider);
    
      const handle = document.createElement("div");
      handle.style.position = "absolute";
      handle.style.top = "-6px";
      handle.style.left = "0px";
      handle.style.width = "16px";
      handle.style.height = "16px";
      handle.style.borderRadius = "50%";
      handle.style.background = "#fff";
      handle.style.border = "1px solid #aaa";
      handle.style.cursor = "grab";
      customSlider.appendChild(handle);
    
      const label = document.createElement("div");
      label.style.position = "absolute";
      label.style.top = "-30px";
      label.style.left = "0px";
      label.style.color = "#fff";
      label.style.fontFamily = "tektur, sans-serif";
      label.style.fontSize = "14px";
      label.innerText = "Max Year: ???";
      // customSlider.appendChild(label);

      // Min-Tick
const minTick = document.createElement("div");
minTick.style.position = "absolute";
minTick.style.left = "0px";
minTick.style.top = "4px";
minTick.style.width = "1px";
minTick.style.height = "8px";
minTick.style.background = "#fff";
customSlider.appendChild(minTick);

const minLabel = document.createElement("div");
minLabel.style.position = "absolute";
minLabel.style.left = "-5px";
minLabel.style.top = "-24px";
minLabel.style.color = "#fff";
minLabel.style.fontSize = "12px";
minLabel.style.fontFamily = "tektur, sans-serif";
minLabel.innerText = `${minYear}`;
customSlider.appendChild(minLabel);

// Max-Tick
const maxTick = document.createElement("div");
maxTick.style.position = "absolute";
maxTick.style.right = "0px";
maxTick.style.top = "4px";
maxTick.style.width = "1px";
maxTick.style.height = "8px";
maxTick.style.background = "#fff";
customSlider.appendChild(maxTick);

const maxLabel = document.createElement("div");
maxLabel.style.position = "absolute";
maxLabel.style.right = "-5px";
maxLabel.style.top = "-24px";
maxLabel.style.color = "#fff";
maxLabel.style.fontSize = "12px";
maxLabel.style.fontFamily = "tektur, sans-serif";
maxLabel.innerText = `${maxYear}`;
customSlider.appendChild(maxLabel);


    
      let isDragging = false;
    
      handle.addEventListener("mousedown", () => {
        isDragging = true;
        handle.style.cursor = "grabbing";
      });
    
      document.addEventListener("mouseup", () => {
        if (isDragging) {
          isDragging = false;
          handle.style.cursor = "grab";
          localStorage.setItem("yearLimit", currentYear);
          location.reload();
        }
      });
    
      let currentYear;
      const sliderWidth = 1200;
      const sliderLeft = customSlider.getBoundingClientRect().left;
    
      document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        let x = e.clientX - customSlider.getBoundingClientRect().left;
        x = Math.max(0, Math.min(x, sliderWidth));
        handle.style.left = `${x - 8}px`;
    
        const mappedYear = Math.round(gmynd.map(x, 0, sliderWidth, minYear, maxYear));
        currentYear = mappedYear;
        label.innerText = `Planets found until ${mappedYear}`;
      });
    
      // Startposition des Sliders setzen
      if (yearLimit !== Infinity) {
        const startX = gmynd.map(yearLimit, minYear, maxYear, 0, sliderWidth);
        handle.style.left = `${startX - 8}px`;
        label.innerText = `${yearLimit}`;
        // text zentriert vom slider schreiben
        
      } else {
        handle.style.left = `${sliderWidth - 8}px`;
        label.innerText = `Max Year: All`;

        
      }

      // Kleine Ticks für alle Zwischenjahre
const yearCount = maxYear - minYear;
for (let y = minYear + 1; y < maxYear; y++) {
  const x = gmynd.map(y, minYear, maxYear, 0, sliderWidth);

  const tick = document.createElement("div");
  tick.style.position = "absolute";
  tick.style.left = `${x}px`;
  tick.style.top = "6px"; // leicht nach unten versetzt
  tick.style.width = "1px";
  tick.style.height = "4px"; // kürzer als min/max-Ticks
  tick.style.background = "rgba(255, 255, 255, 0.4)";
  customSlider.appendChild(tick);
}

    }
    

    // if (currentView === "glon") {

    //             // create a center dot from the
    //             const centerDot = document.createElement('div');
    //             centerDot.style.position = 'absolute';
    //             centerDot.style.left = `${stageWidth / 2}px`;
    //             centerDot.style.top = `${stageHeight / 2}px`;
    //             centerDot.style.width = '10px';
    //             centerDot.style.height = '10px';
    //             centerDot.style.backgroundColor = 'lime';
    //             centerDot.style.borderRadius = '50%';
    //             centerDot.style.transform = 'translate(-50%, -50%)';
    //             centerDot.style.zIndex = '9999';
    //             // renderer.appendChild(centerDot);

    //   const middleline = document.createElement('div');
    //   middleline.style.position = 'absolute';
    //   middleline.style.left = `${stageWidth / 2}px`;
    //   middleline.style.top = `${stageHeight / 2}px`;
    //   middleline.style.width = '3px';
    //   middleline.style.backgroundColor = 'rgba(255, 255, 255, 1)';
    //   middleline.style.height = `${stageHeight}px`;
    //   // middleline.style.transform = 'translateX(-50%)';
    //   middleline.style.zIndex = '9999'; // Über den Punkten
    //   middleline.style.pointerEvents = 'none'; // Damit die Punkte darüber liegen können
    //   // middleline.style.align = 'center'; // Zentriert die Linie vertikal
    //   // renderer.appendChild(middleline);

    //   const middleline2 = document.createElement('div');
    //   middleline2.style.position = 'absolute';
    //   middleline2.style.left = '0';
    //   middleline2.style.top = `${stageHeight / 2}px`;
    //   middleline2.style.width = `${stageWidth}px`;
    //   middleline2.style.backgroundColor = 'rgba(255, 255, 255, 1)';
    //   middleline2.style.height = '3px';
    //   // renderer.appendChild(middleline2);

    //   const yearSliderContainer = document.createElement("div");
    //   yearSliderContainer.style.position = "fixed";
    //   yearSliderContainer.style.top = "230px";
    //   yearSliderContainer.style.left = "50%";
    //   yearSliderContainer.style.transform = "translateX(-50%)";
    //   yearSliderContainer.style.zIndex = "1000";
    //   yearSliderContainer.style.display = "flex";
    //   yearSliderContainer.style.flexDirection = "column";
    //   yearSliderContainer.style.alignItems = "center";
    //   yearSliderContainer.style.fontFamily = "tektur, sans-serif";
    //   yearSliderContainer.style.color = "#fff";
    //   yearSliderContainer.style.fontSize = "14px";
    
    //   const yearLabel = document.createElement("div");
    //   yearLabel.textContent = `Max Year: ${yearLimit === Infinity ? "All" : yearLimit}`;
    //   yearSliderContainer.appendChild(yearLabel);
    
    //   const yearSlider = document.createElement("input");

    //   yearSlider.type = "range";
    //   yearSlider.classList.add("custom-slider");

    //   yearSlider.min = minYear; // wird unten im fetch gesetzt
    //   yearSlider.max = maxYear; // wird unten im fetch gesetzt
    //   yearSlider.value = isFinite(yearLimit) ? yearLimit : maxYear;
    //   yearSlider.style.width = "600px";
    //   yearSlider.style.background = 'transparent'; // Hintergrund transparent
    //   yearSlider.addEventListener("input", () => {
    //     yearLimit = parseInt(yearSlider.value);
    //     localStorage.setItem("yearLimit", yearLimit);
    //     yearLabel.textContent = `Max Year: ${yearLimit}`;
    //   });
    //   yearSlider.addEventListener("change", () => {
    //     location.reload(); // später durch render() ersetzbar
    //   });
    
    //   yearSliderContainer.appendChild(yearSlider);
    //   document.body.appendChild(yearSliderContainer);
    // }

    
    


    // const binSize = 100; // Bin-Größe in Lichtjahren
    const maxDistance = 8000; // Maximale Distanz in Lichtjahren
    const centerRadiusPx = 140; // Radius des Zentrums in Pixeln
    // const centerRadiusPx = 0;
    const mapInfo = {}; // { 0: { 0: 5, 100: 3, 200_methods: { 'Transit': 2, 'Radial Velocity': 1 } }, ... }
    const allMethods = new Set(); // Set für alle Entdeckungsmethoden
    const methodCounts = {}; // { 'Transit': 100, 'Radial Velocity': 50, ... }

    for (let i = 0; i < locations.length; i++) { // Iteriere durch alle Planeten
      const planet = locations[i]; // Aktueller Planet
      if (planet.sy_dist === "" || isNaN(planet.sy_dist) || planet.sy_dist > maxDistance) continue; // Falls keine oder ungültige Distanz vorhanden → überspringen

      // const angleDeg = Math.round(planet.glon);
      const angleSource = currentView === "glon" ? planet.glon : planet.disc_year; // Quelle für den Winkel (glon oder disc_year)
      if (!angleSource || isNaN(angleSource)) continue; // Falls kein gültiger Winkel vorhanden → überspringen
      // const angleDeg = Math.round(angleSource);
      let angleDeg;


      // const binSizeDeg = 2; // NEU: oben setzen bei den anderen Einstellungen

      if (currentView === "glon") {
        angleDeg = Math.round(planet.glon / binSizeDeg) * binSizeDeg;
      } else {
        angleDeg = gmynd.map(planet.disc_year, minYear, maxYear, 0, 360);
      }

      angleDeg = angleDeg % 360;

      // Berechne den Distanz-Bin
      const distBin = Math.floor(planet.sy_dist / binSize) * binSize;

      // Initialisiere die Datenstruktur für den Winkel und Distanz-Bin
      if (!mapInfo[angleDeg]) mapInfo[angleDeg] = {};
      if (!mapInfo[angleDeg][distBin]) mapInfo[angleDeg][distBin] = 0;
      if (!mapInfo[angleDeg][distBin + "_methods"]) {
        mapInfo[angleDeg][distBin + "_methods"] = {};
      }
      if (!mapInfo[angleDeg][distBin + "_planets"]) {
        mapInfo[angleDeg][distBin + "_planets"] = [];
      }
      mapInfo[angleDeg][distBin + "_planets"].push({
        glon: planet.glon,
        sy_dist: planet.sy_dist,
        pl_discmethod: planet.discoverymethod,
        pl_name: planet.pl_name
      });
      
      

      // Füge die Entdeckungsmethode hinzu
      const method = planet.discoverymethod || "unknown";
      allMethods.add(method);

      // Zähle die Entdeckungsmethode für den aktuellen Winkel und Distanz-Bin
      if (!mapInfo[angleDeg][distBin + "_methods"][method]) {
        mapInfo[angleDeg][distBin + "_methods"][method] = 0;
      }
      mapInfo[angleDeg][distBin + "_methods"][method]++;

      // Zähle die Entdeckungsmethode insgesamt
      if (!methodCounts[method]) methodCounts[method] = 0;
      methodCounts[method]++;

      // Zähle die Anzahl der Planeten für den aktuellen Winkel und Distanz-Bin
      if (!(angleDeg === 0 && distBin === 0)) {
        mapInfo[angleDeg][distBin]++;
      }
    }

    let maxCount = 0;
    let maxAngle = null;
    let maxDist = null;

    const methodColorsInactive = {
      "Transit": "hsl(0, 70%, 45%)",                    // rot
      "Radial Velocity": "hsl(40, 70%, 45%)",           // orange
      "Imaging": "hsl(80, 60%, 40%)",                   // grünlich
      "Microlensing": "hsl(200, 70%, 50%)",             // cyan/blau
      "Pulsar Timing": "hsl(280, 60%, 55%)",            // violett
    
      "Timing": "hsl(160, 50%, 50%)",                   // türkisgrün
      "Astrometry": "hsl(220, 60%, 50%)",               // mittelblau
    
      "Eclipse Timing Variations": "hsl(30, 50%, 50%)", // warmes orange
      "Orbital Brightness Modulation": "hsl(340, 60%, 50%)", // pink/rot
      "Direct Imaging": "hsl(100, 50%, 50%)",           // grün
      "Transit Timing Variations": "hsl(250, 50%, 60%)",// lavendel
      "Pulsation Timing Variations": "hsl(180, 50%, 55%)", // cyan
      "Disk Kinematics": "hsl(60, 60%, 45%)",           // gelb
      "Gravitational Microlensing": "hsl(320, 50%, 50%)", // magenta
      "unknown": "hsl(0, 0%, 30%)"                      // grau
    };


    const methodArray = Array.from(allMethods); // Array aus dem Set der Entdeckungsmethoden

    const legend = document.createElement('div'); // Neues <div>-Element für die Legende
    legend.classList.add('legend'); // CSS-Klasse für die Legende hinzufügen

    
    methodArray.forEach(method => { // Iteriere durch alle Entdeckungsmethoden
      const item = document.createElement('div'); // Neues <div>-Element für die einzelne Legendenzeile
      item.classList.add('legend-item'); // CSS-Klasse für die Legendenzeile hinzufügen

      const colorDot = document.createElement('div');
      colorDot.classList.add('legend-color');
      colorDot.style.backgroundColor = methodColorsInactive[method] || 'gray';
      colorDot.title = method; // Damit beim Hover der Name sichtbar bleibt
      // legend.appendChild(colorDot);
    

legend.style.display = 'flex'; // Flexbox für die Anordnung der Legendenzeilen
      legend.style.flexWrap = 'wrap'; // Zeilenumbruch für die Legendenzeilen
      legend.style.gap = '4px'; // Abstand zwischen den Legendenzeilen


          legend.appendChild(item); // Füge die Legendenzeile zur Legende hinzu
    });


    renderer.appendChild(legend);

    const filterContainer = document.createElement('div');
    filterContainer.style.position = 'absolute';

    filterContainer.style.top = '50px';
    filterContainer.style.left = '50%';   // Zentriere den Container horizontal
    filterContainer.style.transform = 'translateX(-50%)';   // Zentriere den Container horizontal
    filterContainer.style.display = 'flex'; // Flexbox für die Anordnung der Buttons

    filterContainer.style.flexWrap = 'nowrap'; // kein Zeilenumbruch
    filterContainer.style.overflowX = 'auto'; // scrollbar, falls zu breit

    filterContainer.style.gap = '4px'; // Neu: Abstand zwischen den Buttons




    methodArray.forEach(method => {

      // Prüfe, ob die Methode irgendwo dominante Methode war → wenn nein, dann als „inaktiv“ darstellen
  let isDominantSomewhere = false;
  for (const angle in mapInfo) {
    for (const dist in mapInfo[angle]) {
      const methods = mapInfo[angle][dist + "_methods"];
      if (!methods) continue;

      let dominantMethod = "unknown";
      let highest = 0;
      for (const m in methods) {
        if (methods[m] > highest) {
          highest = methods[m];
          dominantMethod = m;
        }
      }

      if (dominantMethod === method) {
        isDominantSomewhere = true;
        break;
      }
    }
    if (isDominantSomewhere) break;
  }

      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = '4px';

      const btn = document.createElement('button');
      btn.textContent = method;
      btn.style.fontFamily = 'tektur, sans-serif'; // Schriftart der Buttons
      btn.style.fontSize = '12px'; // Schriftgröße der Buttons

      btn.style.margin = '1px';
      btn.style.padding = '4px 8px';
      btn.style.background = methodColorsInactive[method]; // Könnte auch none einfach
      btn.style.background = 'transparent'; // Hintergrund transparent
      btn.style.border = `1px solid rgba(255, 255, 255, 0.2)`; // Rahmenfarbe weiß mit Transparenz
      btn.style.color = '#ffffff'; // Schriftfarbe entsprechend der Methode
      btn.style.borderRadius = '30px';
      btn.style.cursor = 'pointer';
      btn.style.whiteSpace = 'nowrap'; // Kein Zeilenumbruch im Button-Text
      btn.style.overflow = 'hidden';   // Optional: Überlauf ausblenden
      btn.style.textOverflow = 'ellipsis'; // Optional: "…" bei zu langem Text
      // btn.style.top = '0px'; // Setze den Button auf die obere Kante des Containers

      const isActive = activeMethodFilter === method;

if (isDominantSomewhere) {
    btn.style.cursor = 'pointer';
    btn.style.color = isActive ? methodColorsInactive[method] || 'gray' : '#ffffff'; // Schriftfarbe entsprechend der Methode oder weiß

    btn.dataset.active = isActive ? 'true' : 'false';  // aktiven Zustand merken

    // Hover-Effekt
    btn.addEventListener('mouseenter', () => {
        btn.style.color = isActive ? '#ffffff' : methodColorsInactive[method] || 'gray';
        btn.style.borderColor = methodColorsInactive[method] || '#ffffff';
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.color = btn.dataset.active === 'true' ? methodColorsInactive[method] || 'gray' : '#ffffff';
        btn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    });

    btn.addEventListener('click', () => {
        if (activeMethodFilter === method) {
            activeMethodFilter = null;
            localStorage.removeItem("activeMethod");
            console.log("Filter entfernt");
        } else {
            activeMethodFilter = method;
            localStorage.setItem("activeMethod", method);
            console.log("Filter gesetzt auf:", method);
        }
        location.reload(); // später ersetzen durch: renderMap()
    });

} else {
    btn.style.color = 'rgba(255, 255, 255, 0.2)';
    btn.style.cursor = 'default';
}

      

wrapper.appendChild(btn);

// Farbpunkte
const colorDot = document.createElement('div');
colorDot.style.width = '35px';
colorDot.style.height = '1px';
colorDot.style.borderRadius = '';
colorDot.style.backgroundColor = methodColorsInactive[method] || 'gray';

wrapper.appendChild(colorDot);

// Statt btn direkt:
filterContainer.appendChild(wrapper);
  });

renderer.appendChild(filterContainer);





    // Methode zählen – entweder aus methodCounts (glon) oder yearMethodData (discoveryyear)
    let sortedMethods;

    if (currentView === "glon") {
      sortedMethods = Object.entries(methodCounts).sort((a, b) => b[1] - a[1]);
    } else {
      // Aggregiertes Jahr-Ranking aus yearMethodData
      const yearlyTotal = {};
      for (const year in yearMethodData) {
        for (const method in yearMethodData[year]) {
          if (!yearlyTotal[method]) yearlyTotal[method] = 0;
          yearlyTotal[method] += yearMethodData[year][method];
        }
      }
      sortedMethods = Object.entries(yearlyTotal).sort((a, b) => b[1] - a[1]);
    }

    const toggleMethodModeButton = document.createElement('button');
toggleMethodModeButton.textContent = 'Switch Method View';
toggleMethodModeButton.style.fontFamily = 'tektur, sans-serif';
toggleMethodModeButton.style.fontSize = '12px';
// toggleMethodModeButton.style.marginTop = '10px';
toggleMethodModeButton.style.padding = '8px 12px';
toggleMethodModeButton.style.border = '1px solid #fff';
toggleMethodModeButton.style.background = 'transparent';
toggleMethodModeButton.style.color = '#fff';
toggleMethodModeButton.style.borderRadius = '20px';
toggleMethodModeButton.style.cursor = 'pointer';
toggleMethodModeButton.style.position = 'absolute'; // Positionieren des Buttons
toggleMethodModeButton.style.textAlign = 'center'; // Text zentrieren
// toggleMethodModeButton.style.alignSelf = 'center';
toggleMethodModeButton.style.top = '50px';
toggleMethodModeButton.style.right = '40px'; // Zentriere den Button horizontal

// let methodMode = localStorage.getItem("methodMode") || "dominant";
toggleMethodModeButton.textContent = methodMode === "dominant" ? "Single Method Filter" : "Dominant Method Filter";

toggleMethodModeButton.addEventListener("click", () => {
  methodMode = methodMode === "dominant" ? "single" : "dominant";
  localStorage.setItem("methodMode", methodMode);
  if (methodMode === "single") {
    binSizeDeg = 0.1; // Setze die Bin-Größe für den Single-Method-Modus
    // binSize = 0.1; // Setze die Bin-Größe für den Single-Method-Modus
    // setze standardmäßig den aktiven Filter auf "Transit"
    activeMethodFilter = "Transit";
  } else {
    // lasse den aktiven Filter unverändert
    binSizeDeg = parseFloat(localStorage.getItem('degreeValue')) || 3; // Setze die Bin-Größe auf den Standardwert
  }

  location.reload();
});

// filterContainer.appendChild(toggleMethodModeButton);
document.body.appendChild(toggleMethodModeButton);


    // Neues Ranking-Element
    const ranking = document.createElement('div');
    ranking.classList.add('ranking');
    ranking.style.position = 'absolute';
    ranking.style.top = '70px';
    ranking.style.left = '20px';
    // ranking.style.background = 'rgba(255,255,255,0.15)';
    ranking.style.background = 'transparent'; // Hintergrund transparent
    ranking.style.padding = '10px';
    ranking.style.borderRadius = '10px';
    ranking.style.fontSize = '12px';

    ranking.style.visibility = 'hidden';  // Standardmäßig unsichtbar

    // ranking.innerHTML = `Anzahl an Entdeckungen pro Art<br><br>`;

    // Titel separat erstellen
    const title = document.createElement('div');
    title.innerText = 'Anzahl an Entdeckungen pro Art';
    title.style.fontSize = '16px';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '10px';

    ranking.appendChild(title);


// Maximalwert zur Skalierung der Balken
const maxMethodCount = sortedMethods[0][1] || 1;

// Nur die Top 3 anzeigen
sortedMethods.slice(0, 12).forEach(([method, count]) => {  // Iteriere durch die Top 5 Methoden
  const barContainer = document.createElement('div');
  barContainer.style.marginBottom = '6px';

  const label = document.createElement('div');
  label.innerText = `${method}: ${count}`;
  label.style.marginBottom = '2px';

  const bar = document.createElement('div');
  bar.style.height = '10px';

  const width = gmynd.map(count, 0, maxMethodCount, 0, 100); // Werte von 20% bis 100%
  bar.style.width = `${width}%`;

  bar.style.background = methodColorsInactive[method];
  bar.style.opacity = '0.8'; // Leicht transparent
  bar.style.borderRadius = '5px';

  barContainer.appendChild(label);
  barContainer.appendChild(bar);
  ranking.appendChild(barContainer);
});
renderer.appendChild(ranking); // Füge das Ranking zur Renderer-Box hinzu

// function renderMap() {
    const allDots = []; // Array für alle Punkte (Dots)

    let dominantMethodGlobal = "unknown"; // Globale dominante Entdeckungsmethode
    for (const angle in mapInfo) { // Iteriere durch alle Winkel
      
      for (const dist in mapInfo[angle]) { // Iteriere durch alle Distanz-Bins
        
        const count = mapInfo[angle][dist]; // Anzahl der Planeten im aktuellen Winkel und Distanz-Bin
        const methods = mapInfo[angle][dist + "_methods"] || {}; // Entdeckungsmethoden für den aktuellen Winkel und Distanz-Bin
        let dominantMethod = "unknown"; // Dominante Entdeckungsmethode
        let highest = 0; // Höchste Anzahl für die dominante Methode
        const methodList = mapInfo[angle][dist + "_methods"];
if (yearLimit !== Infinity && methodList) {
  let skip = true;
  for (const method in methodList) {
    const yearCandidates = locations.filter(p => {
      return p.discoverymethod === method &&
             Math.round((p.glon || 0) / binSizeDeg) * binSizeDeg % 360 == angle &&
             Math.floor((p.sy_dist || 0) / binSize) * binSize == dist &&
             p.disc_year <= yearLimit;
    });
    if (yearCandidates.length > 0) {
      skip = false;
      break;
    }
  }
  if (skip) continue; // Diesen Punkt nicht anzeigen
}

        for (const method in methods) { // Iteriere durch alle Entdeckungsmethoden
          if (methods[method] > highest) { // Falls die aktuelle Methode häufiger ist als die bisherige dominante Methode
            highest = methods[method]; // Setze die neue höchste Anzahl
            dominantMethod = method; // Setze die neue dominante Methode
          }
        }
        if (count > maxCount) { // Falls die Anzahl der Planeten im aktuellen Winkel und Distanz-Bin höher ist als die bisherige maximale Anzahl
          maxCount = count; // Setze die neue maximale Anzahl
          maxAngle = angle; // Setze den neuen maximalen Winkel
          maxDist = dist; // Setze die neue maximale Distanz
        }

        dominantMethodGlobal = dominantMethod; // Setze die globale dominante Entdeckungsmethode
        
      }
    }
  
    const infoBox = document.createElement('div'); // Neues <div>-Element für die Infobox
    infoBox.classList.add('info-box');
    infoBox.style.position = 'absolute';
    infoBox.style.left = '50%'; // Zentriere die Infobox horizontal
    infoBox.style.top = '50%'; // Zentriere die Infobox vertikal
    infoBox.style.transform = 'translate(-50%, -50%)'; // Zentriere die Infobox
    infoBox.style.background = 'transparent'; // Hintergrund transparent
    infoBox.style.padding = '20px 20px'; // Innenabstand der Infobox
    infoBox.style.borderRadius = '100%';  // Abgerundete Ecken der Infobox
// infobox font color depending on current discovery method

    infoBox.style.fontSize = '12px';
    infoBox.style.width = '250px';
    infoBox.style.height = '250px'; // Maximale Breite der Infobox
    infoBox.style.textAlign = 'center';
    infoBox.style.display = 'flex';
    infoBox.style.flexDirection = 'column';
    infoBox.style.justifyContent = 'center';
    infoBox.style.alignItems = 'center';
    infoBox.style.pointerEvents = 'none';

    renderer.appendChild(infoBox);

    if (currentView === "discoveryyear") {
//       binSizeDeg = 0.1;
// localStorage.setItem("degreeValue", "0.1"); // falls du sliderspeicherung nutzt

      infoBox.style.display = "none";
    }
    

    const totalPlanetCount = locations.length;
    infoBox.innerHTML = `${totalPlanetCount} planets have been found`; // Textinhalt der Infobox setzen
    // Berechnung des maximalen Radius für die Grid-Linien
const maxDistanceBin = Math.ceil(maxDistance / binSize) * binSize;
const maxBinIndex = maxDistanceBin / binSize;
const gridRadiusPx = centerRadiusPx + maxBinIndex * scale;  


    if (currentView === "glon") { // Wenn die aktuelle Ansicht "glon" ist
    if (galacticMode === "cluster") {

      // Radial Grid erstellen
    const gridContainer = document.createElement('div');
    gridContainer.style.position = 'absolute';
    gridContainer.style.top = '0';
    gridContainer.style.left = '0';
    gridContainer.style.width = '100%';
    gridContainer.style.height = '100%';
    gridContainer.style.pointerEvents = 'none';
    gridContainer.style.zIndex = '0'; // hinter den Punkten
    // renderer.appendChild(gridContainer);

    // Kreislinien für die Distanzen
    for (let d = 0; d <= maxDistance; d += binSize) {
        const radiusPx = centerRadiusPx + (d / binSize) * scale;
        const circle = document.createElement('div');
        circle.style.position = 'absolute';
        circle.style.width = `${radiusPx * 2}px`;
        circle.style.height = `${radiusPx * 2}px`;
        circle.style.left = `${stageWidth / 2 - radiusPx}px`;
        circle.style.top = `${stageHeight / 2 - radiusPx}px`;
        circle.style.border = '1px dashed rgba(255,255,255,0.1)';
        circle.style.borderRadius = '50%';
        circle.style.zIndex = '1'; // hinter den Punkten
        // gridContainer.appendChild(circle);
    }

    const gridCenterX = stageWidth / 2;
    const gridCenterY = stageHeight / 2;
    
    for (let angle = 0; angle < 360; angle += binSizeDeg) {
        const angleRad = angle * (Math.PI / 180);
        const innerRadius = centerRadiusPx;
        const outerRadius = gridRadiusPx;  // maximaler Radius deiner Visualisierung
    
        const startX = gridCenterX + Math.cos(angleRad) * innerRadius;
        const startY = gridCenterY + Math.sin(angleRad) * innerRadius;
        const endX = gridCenterX + Math.cos(angleRad) * outerRadius;
        const endY = gridCenterY + Math.sin(angleRad) * outerRadius;
    
        const line = document.createElement('div');
        line.style.position = 'absolute';
        line.style.left = `${startX}px`;
        line.style.top = `${startY}px`;
        line.style.width = `${outerRadius - innerRadius}px`;
        line.style.height = '1px';
        line.style.background = 'linear-gradient(to right, transparent, #333)';
        line.style.transformOrigin = 'left center';
        line.style.transform = `rotate(${angle}deg)`;
        line.style.zIndex = '1'; // hinter den Punkten
    
        // renderer.appendChild(line);
    }
    

      
      for (const angle in mapInfo) { // Iteriere durch alle Winkel
        const angleRad = angle * (Math.PI / 180); // Winkel in Bogenmaß umrechnen
        for (const dist in mapInfo[angle]) { // Iteriere durch alle Distanz-Bins
          if (angle == 0 && dist == 0) continue; // Überspringe den Nullpunkt (0° und 0 Lichtjahre)
          // const count = mapInfo[angle][dist]; // Anzahl der Planeten im aktuellen Winkel und Distanz-Bin
          // Ersetze count durch countFiltered, also: wie viele Planeten in diesem Bin UND gültig fürs Jahr
// let countFiltered = 0;

// if (mapInfo[angle][dist + "_methods"]) {
//   for (const method in mapInfo[angle][dist + "_methods"]) {
//     const matching = locations.filter(p =>
//       p.discoverymethod === method &&
//       Math.round((p.glon || 0) / binSizeDeg) * binSizeDeg % 360 == angle &&
//       Math.floor((p.sy_dist || 0) / binSize) * binSize == dist &&
//       p.disc_year <= yearLimit
//     );
//     countFiltered += matching.length;
//   }
// }
let countFiltered = 0;
if (methodMode === "single") {
  if (activeMethodFilter) {
    const matching = locations.filter(p =>
      p.discoverymethod === activeMethodFilter &&
      Math.round((p.glon || 0) / binSizeDeg) * binSizeDeg % 360 == angle &&
      Math.floor((p.sy_dist || 0) / binSize) * binSize == dist &&
      p.disc_year <= yearLimit
    );
    countFiltered = matching.length;
  }
} else {
  if (mapInfo[angle][dist + "_methods"]) {
    for (const method in mapInfo[angle][dist + "_methods"]) {
      const matching = locations.filter(p =>
        p.discoverymethod === method &&
        Math.round((p.glon || 0) / binSizeDeg) * binSizeDeg % 360 == angle &&
        Math.floor((p.sy_dist || 0) / binSize) * binSize == dist &&
        p.disc_year <= yearLimit
      );
      countFiltered += matching.length;
    }
  }
}


// Nur wenn countFiltered > 0: Punkt zeichnen
if (countFiltered === 0) continue;

          const methods = mapInfo[angle][dist + "_methods"] || {}; // Entdeckungsmethoden für den aktuellen Winkel und Distanz-Bin
          let dominantMethod = "unknown"; // Dominante Entdeckungsmethode
          let highest = 0; // Höchste Anzahl für die dominante Methode
          
          // Bestimme die dominante Entdeckungsmethode
          for (const method in methods) { // Iteriere durch alle Entdeckungsmethoden
            if (methods[method] > highest) { // Falls die aktuelle Methode häufiger ist als die bisherige dominante Methode
              highest = methods[method];  // Setze die neue höchste Anzahl
              dominantMethod = method; // Setze die neue dominante Methode
            }
          }

              // Filter anwenden
              if (activeMethodFilter && dominantMethod !== activeMethodFilter) {
                continue; // Diesen Punkt nicht anzeigen
              }

          const distNum = +dist; // Distanz-Bin in eine Zahl umwandeln
          const binIndex = distNum / binSize; // Berechne den Index des Distanz-Bins
          const radius = centerRadiusPx + binIndex * scale; // Berechne den Radius für die Position des Punktes
          // const radius = binIndex * scale;

          const x = Math.cos(angleRad) * radius + stageWidth / 2; // x-Koordinate des Punktes
          const y = Math.sin(angleRad) * radius + stageHeight / 2; // y-Koordinate des Punktes




          
          // const size = 10; // Einheitliche Punktgröße
          // const size = gmynd.map(Math.log(countFiltered), Math.log(1), Math.log(maxCount), 4, 12);
          const size = methodMode === "single" ? 4 : gmynd.map(Math.log(countFiltered), Math.log(1), Math.log(maxCount), 4, 12);  // Größe des Punktes basierend auf der Anzahl der Planeten, logarithmisch skaliert
        

          const dot = document.createElement('div');
          dot.classList.add('dot');
          // const size = gmynd.map(count, 1, maxCount, 1, 20); // Größe des Punktes basierend auf der Anzahl der Planeten
          // const size = gmynd.map(Math.sqrt(count), 1, Math.sqrt(maxCount), 5, 10);
          // const size = gmynd.map(countFiltered, 1, maxCount, 2, 10); // Größe des Punktes basierend auf der Anzahl der Planeten

              // Start-Zustand
              dot.style.position = 'absolute';
              dot.style.transformOrigin = 'center center';
              dot.style.transform = 'scale(0)';
              dot.style.opacity = '0';
              dot.style.transition = 'transform 0.8s ease, opacity 0.8s ease';
              dot.style.width = `${size}px`; // Einheitliche Punktgröße
              dot.style.height = `${size}px`; // Einheitliche Punktgröße


              dot.style.position = 'absolute';
              // dot.style.width = `${size}px`;
              // dot.style.height = `${size}px`;
// style width is so groß wie ein bin
              // dot.style.width = `${binSizeDeg * 2}px`; // Größe des Punktes basierend auf der Bin-Größe
              // dot.style.height = `${binSizeDeg * 2}px`; // Größe des Punktes basierend auf der Bin-Größe
              // dot.style.backgroundColor = methodColors[dominantMethod] || "gray";
              dot.style.border = `1px solid ${methodColorsInactive[dominantMethod] || "gray"}`;
              // dot.style.backgroundColor = 'transparent';
// dot.style.backgroundColor = `${methodColorsInactive[dominantMethod] || "gray"}`;
const baseColor = methodColorsInactive[dominantMethod] || "gray";
const alpha2 = gmynd.map(countFiltered, 1, maxCount, 0.05, 1); // 0.2 bis 1
dot.style.backgroundColor = baseColor.replace('hsl', 'hsla').replace(')', `, ${alpha2})`);


              // dot.style.borderRadius = '50%';
              dot.style.left = `${x - size / 2}px`;
              dot.style.top = `${y - size / 2}px`;
              dot.dataset.originalBorder = dot.style.border;
              dot.style.zIndex = '10'; // Standard-Z-Index, damit sie hinter der Infobox liegen
              renderer.appendChild(dot);

              // Speichere den Punkt und evtl. ein Delay-Basiswert
              allDots.push({ dot, delay: distNum * 0.05 });


            dot.addEventListener("mouseenter", () => {
            dot.style.border = "3px solid white"; // Rahmenfarbe bei Hover
            dot.style.zIndex = '2000'; // Über anderen Elementen anzeigen
            dot.style.transform = 'scale(2)'; // Vergrößern bei Hover

            infoBox.style.color = methodColorsInactive[dominantMethod] || methodColorsInactive["default"] || "gray";
            infoBox.innerHTML = `
              <strong>${dominantMethod}</strong><br>
              ${countFiltered} exoplanets<br>
Galactic Longitudes ${(+angle).toFixed(1)}° – ${(+angle + binSizeDeg).toFixed(1)}°<br>
              ${Math.round(dist * 3.2615)}–${Math.round((+dist + binSize) * 3.2615)} light years`;  // Textinhalt der Infobox setzen
          });

          dot.addEventListener("mouseleave", () => {
            dot.style.border = dot.dataset.originalBorder;
            dot.style.zIndex = '1'; // Zurücksetzen des Z-Index
            dot.style.transform = 'scale(1)'; // Zurücksetzen der Vergrößerung

            // dot.style.border = "1px solid transparent"; // Rahmenfarbe zurücksetzen
            infoBox.innerHTML = `${totalPlanetCount} planets found`; // Textinhalt der Infobox setzzen
            infoBox.style.color = ''; // Schriftfarbe zurücksetzen
          });
          dot.addEventListener("mouseenter", (e) => {
            hoverTooltip.innerHTML = `
                <strong>${dominantMethod}</strong><br>
                ${countFiltered} exoplanets<br>
Galactic Longitudes ${(+angle).toFixed(1)}° – ${(+angle + binSizeDeg).toFixed(1)}°<br>
              ${Math.round(dist * 3.2615)}–${Math.round((+dist + binSize) * 3.2615)} light years`;  // Textinhalt der Infobox setzen
            hoverTooltip.style.display = 'block';
            // dot.style.boxShadow = `0 0 10px ${size / 2}px ${baseColor.replace('hsl', 'hsla').replace(')', `, ${alpha2})`)}`; // Leichter Schein um den Punkt

        });
        
        dot.addEventListener("mousemove", (e) => {
            hoverTooltip.style.left = (e.clientX + 12) + 'px';
            hoverTooltip.style.top = (e.clientY + 12) + 'px';

        });
        
        dot.addEventListener("mouseleave", () => {
            hoverTooltip.style.display = 'none';
            // dot.style.boxShadow = 'none'; // Schein entfernen
        });

        // dot.addEventListener('click', () => {
        //   // Vorherige Detailansicht schließen
        //   document.querySelectorAll('.zoom-detail').forEach(el => el.remove());
        
        //   // Punkt vergrößern
        //   dot.style.zIndex = '2000';
        //   dot.style.transition = 'transform 0.4s ease';
        //   dot.style.transform = 'scale(2.5)';
        
        //   // Detailpanel erstellen
        //   const detail = document.createElement('div');
        //   detail.className = 'zoom-detail';
        //   detail.style.position = 'absolute';
        //   detail.style.left = `${x + 20}px`;
        //   detail.style.top = `${y - 20}px`;
        //   detail.style.background = 'rgba(0, 0, 0, 0.95)';
        //   detail.style.padding = '12px 16px';
        //   detail.style.borderRadius = '12px';
        //   detail.style.border = '1px solid #555';
        //   detail.style.fontFamily = 'tektur, sans-serif';
        //   detail.style.fontSize = '12px';
        //   detail.style.color = '#fff';
        //   detail.style.zIndex = '3000';
        //   detail.style.boxShadow = '0 0 12px rgba(255,255,255,0.2)';
        //   detail.style.maxWidth = '200px';
        //   detail.style.pointerEvents = 'auto';
        
        //   const methods = mapInfo[angle][dist + "_methods"];
        //   const total = Object.values(methods).reduce((sum, val) => sum + val, 0);
        //   const sorted = Object.entries(methods).sort((a, b) => b[1] - a[1]);
        
        //   // Titel
        //   const headline = document.createElement('div');
        //   headline.textContent = `Methods in this bin`;
        //   headline.style.marginBottom = '10px';
        //   headline.style.fontWeight = 'bold';
        //   headline.style.fontSize = '13px';
        //   detail.appendChild(headline);
        
        //   sorted.forEach(([method, count]) => {
        //     const row = document.createElement('div');
        //     row.style.marginBottom = '6px';
        
        //     const label = document.createElement('div');
        //     label.textContent = `${method}: ${count}`;
        //     label.style.marginBottom = '2px';
        
        //     const bar = document.createElement('div');
        //     const width = gmynd.map(count, 0, total, 0, 100);
        //     bar.style.width = `${width}%`;
        //     bar.style.height = '6px';
        //     bar.style.background = methodColorsInactive[method] || 'gray';
        //     bar.style.borderRadius = '3px';
        
        //     row.appendChild(label);
        //     row.appendChild(bar);
        //     detail.appendChild(row);
        //   });
        
        //   // Close-Button
        //   const closeBtn = document.createElement('div');
        //   closeBtn.textContent = 'close';
        //   closeBtn.style.position = 'absolute';
        //   closeBtn.style.top = '6px';
        //   closeBtn.style.right = '10px';
        //   closeBtn.style.cursor = 'pointer';
        //   closeBtn.style.fontWeight = 'bold';
        //   closeBtn.style.fontSize = '14px';
        //   closeBtn.style.color = '#888';
        //   // closeBtn.style.background = 'rgba(0, 0, 0, 0.5)';
        //   // closeBtn.style.padding = '10px 8px';
        
        //   closeBtn.addEventListener('click', () => {
        //     detail.remove();
        //     dot.style.transform = 'scale(1)';
        //     dot.style.zIndex = '10';
        //   });
        //   detail.appendChild(closeBtn);
        
        //   renderer.appendChild(detail);
        // });
        
        dot.addEventListener('click', () => {
          // Vorherige Charts entfernen
          document.querySelectorAll('.zoom-detail').forEach(el => el.remove());
          
        

          
          // Punkt vergrößern
          dot.style.zIndex = '4000';
          dot.style.transition = 'transform 0.4s ease';
          dot.style.transform = 'scale(2.5)';
        
          const methods = mapInfo[angle][dist + "_methods"];
          const total = Object.values(methods).reduce((sum, val) => sum + val, 0);
          const sorted = Object.entries(methods).sort((a, b) => b[1] - a[1]);
        
          // Fester Chart-Container links im Viewport
          const chart = document.createElement('div');
          chart.className = 'zoom-detail';
          chart.style.position = 'fixed'; // Wichtig: fixed = immer sichtbar links
          chart.style.left = '100px';      // Abstand vom linken Rand
          // chart.style.bottom = '40%';      // Abstand von oben
          // abstand von oben soll genau hälfte höhe sein
          chart.style.bottom = '50%';      // Abstand von unten
          chart.style.width = 'auto';          // wichtig
          chart.style.maxWidth = '260px';      // optionaler Rahmen
          chart.style.minWidth = '180px';      // für Lesbarkeit
          chart.style.height = 'auto';         // wächst mit Inhalt
          // chart.style.overflow = 'visible';    // ✔ Inhalt darf raus
          chart.style.background = 'rgba(0, 0, 0, 0.95)';
          chart.style.border = '1px solid #555'; // Rahmenfarbe
          chart.style.borderRadius = '12px';
          chart.style.padding = '14px 14px'; // Innenabstand  
          chart.style.display = 'flex'; 
          chart.style.flexDirection = 'column';
          // chart.style.alignItems = 'flex-start'; // Horizontale Ausrichtung
          // chart.style.justifyContent = 'flex-start'; // Vertikale Ausrichtung
          chart.style.boxSizing = 'border-box'; // Box-Sizing für konsistente Größenangaben
          chart.style.gap = '2px';
          chart.style.zIndex = '3000';
          chart.style.fontFamily = 'tektur, sans-serif';
          chart.style.fontSize = '16px';
          chart.style.color = '#fff';
          chart.style.boxShadow = '0 0 20px rgba(255,255,255,0.5)';

//           // Titel bleibt gleich
// const title = document.createElement('div');
// title.textContent = 'Planets found in this segment of the Milky Way';
// title.style.fontWeight = 'bold';
// title.style.marginBottom = '10px';
// chart.appendChild(title);

// // Neues Mapping-Feld für Planeten
// const minimap = document.createElement('div');
// minimap.style.width = '200px';
// minimap.style.height = '400px';
// // minimap.style.transition = 'width 0.9s ease, height 0.9s ease';

// minimap.style.border = '1px solid #444';
// minimap.style.background = '#111';
// minimap.style.position = 'relative';
// minimap.style.marginTop = '12px';
// minimap.style.overflow = 'hidden';
// chart.appendChild(minimap);

// Hole die Planeten im Bin (muss vorher erzeugt worden sein!)
// const planets = mapInfo[angle][dist + "_planets"]; // Array mit { glon, sy_dist, pl_discmethod }

// if (planets && planets.length > 0) {
//   const glonMin = Math.min(...planets.map(p => p.glon));
//   const glonMax = Math.max(...planets.map(p => p.glon));
//   const distMin = Math.min(...planets.map(p => p.sy_dist));
//   const distMax = Math.max(...planets.map(p => p.sy_dist));

//   // minimap.style.width = '140px';
//   // minimap.style.height = '140px';
//   // minimap.style.transition = 'width 0.9s ease, height 0.9s ease';


//   planets.forEach(p => {
//     const px = document.createElement('div');

//     const x = gmynd.map(p.sy_dist, distMin, distMax, 0, 140 - 3);
//     const y = gmynd.map(p.glon, glonMin, glonMax, 140 - 3, 0); // invertiert Y

//     px.style.position = 'absolute';
//     px.style.left = `${x}px`;
//     px.style.top = `${y}px`;
//     px.style.width = '3px';
//     px.style.height = '3px';
//     px.style.backgroundColor = methodColorsInactive[p.pl_discmethod] || 'gray';
//     px.style.borderRadius = '0'; // Quadrat
//     px.style.opacity = '0.9';

//     // Optional: Tooltip
//     px.title = `${p.pl_name || 'Planet'}\n${p.pl_discmethod}`;


//     minimap.appendChild(px);
//   });
// } else {
//   const info = document.createElement('div');
//   info.textContent = 'No planet data.';
//   info.style.fontSize = '10px';
//   info.style.color = '#888';
//   info.style.marginTop = '12px';
//   chart.appendChild(info);
// }

          
          const title = document.createElement('div');
          title.textContent = `Planets discovered
            `; // Titel bleibt gleich ${countFiltered}
          // textcontent planets discovered <br> gesamtzahl in diesem bin
          // title.textContent = `Planets discovered in this segment of the Milky Way<br>${countFiltered} total`;
          title.style.fontWeight = 'bold';
          title.style.marginBottom = '5px';
          chart.appendChild(title);
        
          // Balkendiagramm (horizontal) für Methoden in diesem Segment
const barContainer = document.createElement('div');
barContainer.style.width = '100%';
barContainer.style.display = 'flex';
barContainer.style.flexDirection = 'column';
barContainer.style.gap = '10px';
barContainer.style.marginTop = '5px';
chart.appendChild(barContainer);

const maxVal = Math.max(...Object.values(methods));

sorted.forEach(([method, count]) => {
  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.alignItems = 'center';
  row.style.gap = '6px';

  const label = document.createElement('div');
  label.textContent = method;
  label.style.width = '80px';
  label.style.fontSize = '10px';
  label.style.color = '#aaa';
  label.style.flexShrink = '0';

  const bar = document.createElement('div');
  const width = gmynd.map(count, 0, maxVal, 0, 60); // max 60px breit
  bar.style.height = '8px';
  bar.style.width = `${width}px`;
  bar.style.backgroundColor = methodColorsInactive[method] || 'gray';
  bar.style.borderRadius = '4px';

  const value = document.createElement('div');
  value.textContent = count;
  value.style.fontSize = '11px';
  value.style.color = '#ccc';

  row.appendChild(label);
  row.appendChild(bar);
  row.appendChild(value);
  barContainer.appendChild(row);
});

        
          // // Close Button
          // const closeBtn = document.createElement('div');
          // closeBtn.textContent = '×';
          // closeBtn.style.position = 'absolute';
          // closeBtn.style.top = '6px';
          // closeBtn.style.right = '10px';
          // closeBtn.style.cursor = 'pointer';
          // closeBtn.style.fontWeight = 'bold';
          // closeBtn.style.fontSize = '14px';
          // closeBtn.style.color = '#888';
          // closeBtn.addEventListener('click', () => {
          //   // infoField.style.width = '0px';
          //   // infoField.style.height = '0px';
          
          //   chart.remove();
          //   dot.style.transform = 'scale(1)';
          //   dot.style.zIndex = '10';
          // });
          // chart.appendChild(closeBtn);
        
          document.body.appendChild(chart); // nicht renderer – weil es fixed ist
          // EventListener: Klick außerhalb der Chart-Box → entfernen
setTimeout(() => {
  document.addEventListener('click', function handleOutsideClick(e) {
    if (!chart.contains(e.target)) {
      chart.remove();                       // Entferne das Feld
      dot.style.transform = 'scale(1)';     // Rück-Animation des Dots
      dot.style.zIndex = '10';
      document.removeEventListener('click', handleOutsideClick); // nur 1x
    }
  });
}, 0); // setTimeout verhindert sofortiges Auslösen beim Öffnen
        });
        
        

        
        

          setTimeout(() => { // ca. Zeile 275 - 280, noch VOR discoveryyear-Block
            allDots.forEach(({ dot, delay }) => {
              dot.style.transitionDelay = `${delay}ms`;
              dot.style.transform = 'scale(1)';
              dot.style.opacity = '1'; // Regelt opacity nach auftauchen
            });
          }, 50);


          
        }
        
      }
    } else if (galacticMode === "all") {
      // HIER kommt der neue Code zum Zeichnen ALLER Planeten:
      locations.forEach(planet => {
          if (planet.sy_dist === "" || isNaN(planet.sy_dist) || planet.sy_dist > maxDistance) return;
          if (!planet.glon || isNaN(planet.glon)) return;
          if (activeMethodFilter && planet.discoverymethod !== activeMethodFilter) return;
  
          const angleRad = planet.glon * Math.PI / 180;
          // const radius = centerRadiusPx + (planet.sy_dist / binSize) * scale;
          const radius = centerRadiusPx + (Math.log10(planet.sy_dist + 1)) * scale * 30; // Logarithmische Skalierung für die Distanz
  
          const x = Math.cos(angleRad) * radius + stageWidth / 2;
          const y = Math.sin(angleRad) * radius + stageHeight / 2;
  
          const dot = document.createElement('div');
          dot.classList.add('dot');
          dot.style.position = 'absolute';
          dot.style.width = '4px';
          dot.style.height = '4px';
          dot.style.backgroundColor = methodColorsInactive[planet.discoverymethod] || 'gray';
          // dot.style.borderRadius = '50%';
          dot.style.left = `${x - 2}px`;
          dot.style.top = `${y - 2}px`;
  
          renderer.appendChild(dot);
      });
  }
  

} else if (currentView === "discoveryyear") {
  // if (currentView === "discoveryyear") {
  //   const binSize = 0.1;
  //   const binSizeDeg = 0.1;
  // }
    // discoveryyear-Ansicht (angepasst: jeder Jahresbalken ist ein Container)
// discoveryyear-Ansicht (angepasst: jeder Jahresbalken ist ein Container, mit Umschaltfunktion für akkumulativ/normal)
// discoveryyear-Ansicht (angepasst: jeder Jahresbalken ist ein Container, mit Umschaltfunktion für akkumulativ/normal)


let isCumulative = localStorage.getItem("cumulativeMode") === "true"; // Zustand: normal oder akkumulativ

// const binSize = 0.1;
const binSizeDeg = 0.1;
localStorage.setItem("degreeValue", "0.1");
// localStorage.setItem("distanceValue", "0.1");

// binsize soll 0.1 sein wenn modus discoveryyear ist




// localStorage.setItem("degreeValue", "0.1"); // falls du sliderspeicherung nutzt


const toggleButton = document.createElement("button");
toggleButton.textContent = isCumulative ? "Switch to Non-Cumulative" : "Switch to Cumulative";
toggleButton.style.position = "absolute";
toggleButton.style.top = "20px";
toggleButton.style.right = "20px";
toggleButton.style.zIndex = "1000";
toggleButton.style.padding = "8px 12px";
toggleButton.style.background = 'transparent'; // Hintergrund transparent
toggleButton.style.color = "#fff";
toggleButton.style.border = "1px solid #666";
toggleButton.style.borderRadius = "5px";
toggleButton.style.cursor = "pointer";
toggleButton.addEventListener("click", () => {
  isCumulative = !isCumulative;
  localStorage.setItem("cumulativeMode", isCumulative ? "true" : "false");
  location.reload();
});
renderer.appendChild(toggleButton);

const allYearsSorted = Object.keys(yearMethodData).sort((a, b) => a - b);
const barWidth = stageWidth / allYearsSorted.length - 10;
const maxBarHeight = stageHeight - 250; // Höhe der Balken, minus Platz für die X-Achse und den Button

const allMethods = [...new Set(Object.values(yearMethodData).flatMap((methods) => Object.keys(methods)))].sort();

// Berechne den höchsten Planetenwert eines Jahres (für non-cumulative scaling)
const maxCountPerYear = Math.max(
  ...allYearsSorted.map((year) => {
    const methods = yearMethodData[year] || {};
    return Object.values(methods).reduce((sum, val) => sum + val, 0);
  })
);

const maxTotal = totalPlanetCount;
const cumulativeScale = maxBarHeight / maxTotal;
const normalScale = maxBarHeight / maxCountPerYear;

let cumulativeTotals = {};
allMethods.forEach((method) => (cumulativeTotals[method] = 0));
let totalUpToYear = 0;

allYearsSorted.forEach((year, index) => {
  const methods = yearMethodData[year] || {};
const sumThisYear = Object.values(methods).reduce((sum, val) => sum + val, 0);

if (isCumulative) {
    totalUpToYear += sumThisYear;
} else {
    totalUpToYear = sumThisYear;
}

  // const methods = yearMethodData[year] || {};
  const startX = gmynd.map(index, 1, allYearsSorted.length, 100, stageWidth - 100);

  const yearContainer = document.createElement("div");
  yearContainer.style.position = "absolute";
  yearContainer.style.left = `${startX}px`;
  yearContainer.style.bottom = "50px";
  yearContainer.style.width = `${barWidth}px`;
  yearContainer.style.display = "flex";
  yearContainer.style.flexDirection = "column";
  yearContainer.style.justifyContent = "flex-end";
  yearContainer.style.cursor = "pointer";
  yearContainer.style.zIndex = "1";

  const methodOrder = [
    "Transit",
    "Radial Velocity",
    "Microlensing",
    "Imaging",
    "Timing",
    "Astrometry",
    "Pulsar Timing",
    "Eclipse Timing Variations",
    "Orbital Brightness Modulation",
    "Direct Imaging",
    "Transit Timing Variations",
    "Pulsation Timing Variations",
    "Disk Kinematics",
    "Gravitational Microlensing",
    "unknown",
  ];

  methodOrder.forEach((method) => {
    if (activeMethodFilter && method !== activeMethodFilter) return;
  
    const count = methods[method] || 0;
    if (count === 0 && !isCumulative) return; // ⚠️ NICHTS zeichnen bei 0 in non-cumulative
  
    if (isCumulative) {
      cumulativeTotals[method] += count;
      if (cumulativeTotals[method] === 0) return; // ⚠️ auch hier: nicht zeichnen
    } else {
      cumulativeTotals[method] = count;
    }
  
    const segmentHeight = isCumulative
      ? cumulativeTotals[method] * cumulativeScale
      : count * normalScale;
  
    const bar = document.createElement("div");
      bar.style.width = "100%";   
      bar.style.height = `${segmentHeight}px`;
      bar.style.backgroundColor = methodColorsInactive[method] || "gray";
      // bar.title = `${year} – ${method}: ${isCumulative ? cumulativeTotals[method] : count}`;

      bar.addEventListener("mouseenter", (e) => {
        hoverTooltip.innerHTML = `
            <strong>${method}</strong><br>
            ${isCumulative ? cumulativeTotals[method] : count} exoplanets<br>
            Year: ${year}
        `;
        hoverTooltip.style.display = 'block';

    });
    
    bar.addEventListener("mousemove", (e) => {
      const tooltipWidth = hoverTooltip.offsetWidth;
      const tooltipHeight = hoverTooltip.offsetHeight;
      const margin = 10;
    
      let left = e.clientX + margin;
      let top = e.clientY - tooltipHeight - margin;
    
      // Begrenzung rechts
      if (left + tooltipWidth > window.innerWidth) {
        left = window.innerWidth - tooltipWidth - margin;
      }
    
      // Begrenzung oben
      if (top < 0) {
        top = e.clientY + margin;
      }
    
      hoverTooltip.style.left = `${left}px`;
      hoverTooltip.style.top = `${top}px`;
    });
    
    bar.addEventListener("mouseleave", () => {
        hoverTooltip.style.display = 'none';
    });
    

      yearContainer.appendChild(bar);
  });
  let isZoomed = false;

  yearContainer.addEventListener('click', () => {
      if (!isZoomed) {
          yearContainer.style.transition = 'transform 0.5s ease, left 0.5s ease';
          yearContainer.style.transform = 'scale(1.5)';
          yearContainer.style.left = '100px';
          // yearContainer.style.bottom = '100px'; // Position anpassen
          yearContainer.style.zIndex = '1000';
          isZoomed = true;
      } else {
          yearContainer.style.transition = 'transform 0.5s ease, left 0.5s ease';
          yearContainer.style.transform = 'scale(1)';
          yearContainer.style.left = `${startX}px`; // Ursprüngliche Position
          // yearContainer.style.bottom = '100px'; // Position anpassen

          yearContainer.style.zIndex = '1';
          isZoomed = false;
      }
              let existingInput = yearContainer.querySelector('input');
        if (existingInput) return; // Nicht mehrfach hinzufügen
    
        // Textfeld erstellen
        const input = document.createElement('input');
        input.type = 'text';
        input.value = `Jahr: ${year}`; // Optional: Vorbefüllung mit dem Jahr
        input.style.marginTop = '8px';
        input.style.width = '200px';
        input.style.height = '100px';
        input.style.padding = '4px';
        input.style.border = '1px solid #666';
        input.style.borderRadius = '4px';
        input.style.background = '#222';
        input.style.color = '#fff';
        input.style.fontFamily = 'tektur, sans-serif';
        input.style.fontSize = '12px';
        input.style.top = '10px'; // Optional: Positionierung
        input.style.position = 'absolute';
        input.style.zIndex = '999'; // Über dem Container anzeigen

    
        yearContainer.appendChild(input);

      yearContainer.addEventListener('click', () => {
        // Prüfe, ob schon ein Textfeld existiert
        let existingInput = yearContainer.querySelector('input');
        if (existingInput) return; // Nicht mehrfach hinzufügen
    
        // Textfeld erstellen
        const input = document.createElement('input');
        input.type = 'text';
        input.value = `Jahr: ${year}`; // Optional: Vorbefüllung mit dem Jahr
        input.style.marginTop = '8px';
        input.style.width = '200px';
        input.style.height = '100px';
        input.style.padding = '4px';
        input.style.border = '1px solid #666';
        input.style.borderRadius = '4px';
        input.style.background = '#222';
        input.style.color = '#fff';
        input.style.fontFamily = 'tektur, sans-serif';
        input.style.fontSize = '12px';
        input.style.top = '10px'; // Optional: Positionierung
        input.style.position = 'absolute';
        input.style.zIndex = '999'; // Über dem Container anzeigen

    
        yearContainer.appendChild(input);
    
        // Optional: automatisch Fokus
        input.focus();
    
        // Optional: Entferne das Feld nach Enter oder Blur
        input.addEventListener('blur', () => input.remove());
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') input.remove();
        });
    });
  });yearContainer.addEventListener("mouseenter", () => {
    infoBox.innerHTML = `<strong>${year}</strong><br>${totalUpToYear} Planeten bis zu diesem Jahr`;
});
yearContainer.addEventListener("mouseleave", () => {
    infoBox.innerHTML = `${totalPlanetCount} planets found`;
});

  renderer.appendChild(yearContainer);
});

// === X-ACHSE (JAHRE) ===
const xAxis = document.createElement("div");
xAxis.style.position = "absolute";
xAxis.style.bottom = "33px";
xAxis.style.left = "30px";
xAxis.style.right = "100px";
xAxis.style.height = "1px";
xAxis.style.background = "rgba(255,255,255,0.2)";
xAxis.style.zIndex = "5";
renderer.appendChild(xAxis);

// Jahres-Ticks
allYearsSorted.forEach((year, index) => {
  if (index % 2 !== 0) return; // Nur alle 2 Jahre anzeigen, damit es nicht zu voll wird

  const tick = document.createElement("div");
  const x = gmynd.map(index, 1, allYearsSorted.length, 125, stageWidth - 75);

  tick.style.position = "absolute";
  tick.style.left = `${x}px`; // +1px für bessere Sichtbarkeit
  tick.style.bottom = "30px";
  tick.style.height = "8px";
  tick.style.width = "1px";
  tick.style.background = "#999";
  tick.style.zIndex = "6";

  const label = document.createElement("div");
  label.textContent = year;
  label.style.position = "absolute";
  label.style.left = `${x - 12}px`;
  label.style.bottom = "12px";
  label.style.color = "#ccc";
  label.style.fontSize = "10px";
  label.style.fontFamily = "tektur, sans-serif";
  label.style.zIndex = "6";

  renderer.appendChild(tick);
  renderer.appendChild(label);
});

const yMarks = [100, 1000, 3000, 5000]; // Referenzen wie Kepler-Wellen
yMarks.forEach(count => {
  const y = 50 + (isCumulative
    ? (count * cumulativeScale)
    : (count * normalScale)); // unterer Abstand + Skaliert

  const line = document.createElement("div");
  line.style.position = "absolute";
  line.style.left = "40px";
  line.style.right = "100px";
  line.style.bottom = `${y}px`;
  line.style.height = "1px";
  line.style.background = "rgba(255,255,255,0.15)";
  line.style.zIndex = "0";

  const label = document.createElement("div");
  label.textContent = `${count}`;
  label.style.position = "absolute";
  label.style.right = "60px";
  label.style.bottom = `${y - 6}px`;
  label.style.color = "#aaa";
  label.style.fontSize = "10px";
  label.style.fontFamily = "tektur, sans-serif";
  label.style.zIndex = "5";

  renderer.appendChild(line);
  renderer.appendChild(label);
});



// } else if (currentView === "earthlike") {
//   const planets = locations.filter(p => p.pl_orbper && p.pl_eqt);

//   const width = window.innerWidth;
//   const height = window.innerHeight;

//   // Logarithmierte Werte vorbereiten
//   const logOrbsMax = planets.map(p => Math.log10(p.pl_orbper));
//   const logTemp = planets.map(p => Math.log10(p.pl_eqt));

//   const minX = Math.min(...logOrbsMax);
//   const maxX = Math.max(...logOrbsMax);
//   const minY = Math.min(...logTemp);
//   const maxY = Math.max(...logTemp);

//   console.log(`X-Achse: ${minX} bis ${maxX}`);
//   console.log(`Y-Achse: ${minY} bis ${maxY}`);

//   planets.forEach(planet => {
//     const logX = Math.log10(planet.pl_orbper);
//     const logY = Math.log10(planet.pl_eqt);

//     // Werte auf den Viewport skalieren
//     const posX = gmynd.map(logX, minX, maxX, 100, width - 100);
//     const posY = gmynd.map(logY, minY, maxY, height - 50, 150); // Y umgedreht

//     // **Farbe jetzt auf logY basierend:**
//     const hue = gmynd.map(logY, minY, maxY, 240, 0); // 240 = kalt (blau), 0 = heiß (rot)
//     const color = `hsl(${hue}, 70%, 55%)`;  // HSL-Farbe basierend auf der Temperatur
//     let scaleRadius = 1; // Standard-Skalierung für den Radius

//     if (planet.pl_name && planet.pl_name.toLowerCase().includes("earth")) {
//       const planetEarth = document.createElement("div");
//       planetEarth.className = "planet-earth";
//       planetEarth.style.width = planetEarth.style.height = (planet.pl_rade * scaleRadius) + "px";
//       planetEarth.style.backgroundColor = 'transparent'; // Hintergrund transparent
//       planetEarth.style.border = `2px solid white`; // Randfarbe basierend auf der Temperatur
//       planetEarth.style.borderRadius = "50%"; // Runde Form
//       planetEarth.style.position = "absolute";
//       planetEarth.style.left = `${posX}px`;
//       planetEarth.style.top = `${posY}px`;
//       planetEarth.title = `Earth-like Planet: ${planet.pl_name}\nTemperature: ${planet.pl_eqt} K\nOrbital Period: ${planet.pl_orbper} days`; // Tooltip mit Informationen
//       planetEarth.addEventListener("mouseenter", () => {
//         infoBox.innerHTML = `
//           <strong>Earth-like Planet</strong><br>
//           Name: ${planet.pl_name}<br>
//           Temperature: ${planet.pl_eqt} K<br>
//           Orbital Period: ${planet.pl_orbper} days
//         `;
//       }
//       );
//       planetEarth.addEventListener("mouseleave", () => {
//         infoBox.innerHTML = `${totalPlanetCount} planets found`; // Textinhalt der Infobox setzen
//       }
//       );
//       renderer.appendChild(planetEarth);
//     }

//     const planetDot = document.createElement("div");
//     planetDot.className = "planet";
//     planetDot.style.width = planetDot.style.height = (planet.pl_rade * scaleRadius) + "px";
//     planetDot.style.backgroundColor = 'transparent'; // Hintergrund transparent
//     planetDot.style.border = `1px solid ${color}`; // Randfarbe basierend auf der Temperatur
//     planetDot.style.borderRadius = "50%"; // Runde Form
//     planetDot.style.position = "absolute";
//     planetDot.style.left = `${posX}px`;
//     planetDot.style.top = `${posY}px`;

//     renderer.appendChild(planetDot);
//   });
 }

    // Button "Wechsle Ansicht" direkt auf den Renderer setzen
    const switchBtn = document.createElement('button');
    // Button-Text abhängig vom aktuellen View setzen

    switchBtn.textContent = currentView === "glon" ? "Current view: Galactic" : "Current view: Yearly"; // "by year" für discoveryyear, "galactic" für glon
    // switchBtn.textContent = 'Wechsle Ansicht';
    switchBtn.id = 'switchView';
    switchBtn.style.position = 'fixed';
    switchBtn.style.minWidth = '130px';
    switchBtn.style.maxWidth = '130';
    switchBtn.style.textAlign = 'center'; // zentriert den Text
    switchBtn.style.fontFamily = 'tektur, sans-serif';
    switchBtn.style.fontSize = '12px';

    switchBtn.style.top = '50px';
    switchBtn.style.left = '40px';
    // switchBtn.style.transform = 'translate(50%, 50%)';
    switchBtn.style.zIndex = '1000';
    switchBtn.style.padding = '8px 12px';
    switchBtn.style.background = 'transparent'; // Hintergrund transparent
    switchBtn.style.color = '#fff';
    switchBtn.style.border = '1px solid #fff';
    switchBtn.style.borderRadius = '100px';
    switchBtn.style.cursor = 'pointer';
    switchBtn.style.outline = 'none';
    switchBtn.style.boxSizing = 'border-box';
    switchBtn.style.transition = 'none';
    switchBtn.style.userSelect = 'none';


    renderer.appendChild(switchBtn);  

//     const switchGalacticModeBtn = document.createElement('button');
// switchGalacticModeBtn.textContent = galacticMode === "cluster" ? "show all planets" : "show clusters";
// switchGalacticModeBtn.style.position = 'fixed';
// switchGalacticModeBtn.style.top = '180px';
// switchGalacticModeBtn.style.right = '50%';
// switchGalacticModeBtn.style.transform = 'translate(50%, 50%)';
// switchGalacticModeBtn.style.padding = '8px 12px';
// switchGalacticModeBtn.style.background = 'transparent';
// switchGalacticModeBtn.style.color = '#fff';
// switchGalacticModeBtn.style.border = '1px solid #fff';
// switchGalacticModeBtn.style.borderRadius = '100px';
// switchGalacticModeBtn.style.cursor = 'pointer';

// switchGalacticModeBtn.addEventListener("click", () => {
//   galacticMode = galacticMode === "cluster" ? "all" : "cluster";
//   localStorage.setItem("galacticMode", galacticMode);
//   location.reload();
// });
// renderer.appendChild(switchGalacticModeBtn);


    const degreeContainer = document.createElement('div');  
    degreeContainer.style.position = 'absolute';
    // degreeContainer.style.bottom = '60px';
    degreeContainer.style.right = '930px';
    degreeContainer.style.zIndex = '1000';
    degreeContainer.style.display = 'flex';
    degreeContainer.style.alignItems = 'center';
    degreeContainer.style.gap = '8px';
    degreeContainer.style.color = '#fff';
    degreeContainer.style.fontFamily = 'tektur, sans-serif';
    degreeContainer.style.fontSize = '14px';
    degreeContainer.style.fontFamily = 'tektur, sans-serif';
    degreeContainer.style.fontSize = '20px'; // Schriftgröße für die Zahleneingabe
    degreeContainer.style.textAlign = 'center'; // zentriert den Text in der Zahleneingabe
    degreeContainer.style.borderRadius = '4px'; // Abgerundete Ecken für die Zahleneingabe
    degreeContainer.style.top = '25px'; // Positioniert die Zahleneingabe unter der Beschriftung       
    
    // Beschriftung
    const degreeLabel = document.createElement('span');
    // degreeLabel.textContent = 'Degrees';
    
    // Zahleneingabe
    const degreeInput = document.createElement('input');
    degreeInput.type = 'number';
    degreeInput.min = '1';
    degreeInput.max = '100';
    degreeInput.value = binSizeDeg;
    degreeInput.style.textAlign = 'center'; // zentriert den Text in der Zahleneingabe
    degreeInput.style.width = '50px';
    degreeInput.style.background = '#111';
    degreeInput.style.color = '#fff';
    degreeInput.style.border = '1px solid #444';
    degreeInput.style.borderRadius = '100px';
    degreeInput.style.padding = '2px 4px';
    degreeInput.style.MozAppearance = 'textfield';     
    degreeInput.style.webkitAppearance = 'none';       
    degreeInput.style.appearance = 'textfield';        
    degreeInput.style.margin = '0';             
    degreeInput.style.fontFamily = 'tektur, sans-serif';
    // degreeInput.style.fontSize = '12px'; // Schriftgröße für die Zahleneingabe
    // degreeInput.style.textAlign = 'center'; // zentriert den Text in der Zahleneingabe
    // degreeInput.style.borderRadius = '4px'; // Abgerundete Ecken für die Zahleneingabe
    // degreeInput.style.top = '200px'; // Positioniert die Zahleneingabe unter der Beschriftung       

    const distanceContainer = document.createElement('div');
    distanceContainer.style.position = 'absolute';
    distanceContainer.style.top = '25px';
    distanceContainer.style.right = '50%';
    distanceContainer.style.zIndex = '1000';
    distanceContainer.style.display = 'flex';
    distanceContainer.style.alignItems = 'center';
    distanceContainer.style.gap = '8px';
    distanceContainer.style.color = '#fff';
    distanceContainer.style.fontFamily = 'tektur, sans-serif';
    distanceContainer.style.fontSize = '14px';
    
    // Beschriftung
    const distanceLabel = document.createElement('span');
    // distanceLabel.textContent = 'Distance';
    
    // Zahleneingabe
    const distanceInput = document.createElement('input');
    distanceInput.type = 'number';
    distanceInput.min = '1';
    distanceInput.max = '150';
    distanceInput.value = binSize;
    distanceInput.style.right = '50%'
    distanceInput.style.width = '50px';
    distanceInput.style.background = 'transparent'; // Hintergrund transparent
    distanceInput.style.color = '#fff';
    distanceInput.style.border = '1px solid #444';
    distanceInput.style.borderRadius = '100px';
    distanceInput.style.padding = '2px 4px';
    distanceInput.style.MozAppearance = 'textfield';
    distanceInput.style.webkitAppearance = 'none';
    distanceInput.style.appearance = 'textfield';
    distanceInput.style.margin = '0';
    distanceInput.style.fontFamily = 'tektur, sans-serif';
    distanceInput.style.fontSize = '14px'; // Schriftgröße für die Zahleneingabe
    distanceInput.style.textAlign = 'center'; // zentriert den Text in der Zahleneingabe
    // distanceInput.style.top = '200px'; // Positioniert die Zahleneingabe unter der Beschriftung

      const scaleContainer = document.createElement('div');
      scaleContainer.style.position = 'absolute';
      scaleContainer.style.top = '20px';
      scaleContainer.style.right = '1700px';
      scaleContainer.style.zIndex = '1000';
      scaleContainer.style.display = 'flex';
      scaleContainer.style.alignItems = 'center';
      scaleContainer.style.gap = '8px';
      scaleContainer.style.color = 'transparent'; // Schriftfarbe für die Zahleneingabe
      scaleContainer.style.fontFamily = 'tektur, sans-serif';
      scaleContainer.style.fontSize = '14px';
      scaleContainer.style.textAlign = 'center'; // zentriert den Text in der Zahleneingabe
      scaleContainer.style.borderRadius = '100px'; // Abgerundete Ecken für die Zahleneingabe

      // Beschriftung
      const scaleLabel = document.createElement('span');
      // scaleLabel.textContent = 'Scale';
      scaleLabel.style.color = '#fff'; // Schriftfarbe für die Beschriftung
      scaleLabel.style.fontFamily = 'tektur, sans-serif';
      scaleLabel.style.fontSize = '14px'; // Schriftgröße für die Beschriftung
      scaleLabel.style.textAlign = 'center'; // zentriert den Text
      scaleLabel.style.top = '100px'; // Positioniert die Beschriftung über der Zahleneingabe
      scaleLabel.style.marginRight = '8px'; // Abstand zwischen Beschriftung und Eingabefeld
      scaleLabel.style.marginLeft = '8px'; // Abstand zwischen Beschriftung und Eingabefeld
      scaleLabel.style.display = 'flex';
      scaleLabel.style.alignItems = 'center'; // Zentriert die Beschriftung vertikal
      scaleLabel.style.borderRadius = '100px'; // Abgerundete Ecken für die Beschriftung

      // Zahleneingabe
      const scaleInput = document.createElement('input');
      scaleInput.type = 'number';
      scaleInput.min = '1';
      scaleInput.max = '100';
      scaleInput.value = scale;
      scaleInput.style.width = '50px';
      scaleInput.style.background = 'transparent'; // Hintergrund transparent
      scaleInput.style.color = '#fff';
      scaleInput.style.border = '1px solid #444';
      scaleInput.style.borderRadius = '4px';
      scaleInput.style.fontFamily = 'tektur, sans-serif';
      scaleInput.style.fontSize = '12px';
      scaleInput.style.textAlign = 'center'; // zentriert den Text
      scaleInput.style.borderRadius = '4px';
      scaleInput.style.padding = '2px 4px';
      scaleInput.style.MozAppearance = 'textfield';
      scaleInput.style.webkitAppearance = 'none';
      scaleInput.style.appearance = 'textfield';
      scaleInput.style.margin = '0';
      // scaleInput.style.top = '200'; // Positioniert die Zahleneingabe unter der Beschriftung


      scaleInput.addEventListener('change', () => {
        // scaleInput.value = scaleInput.value;
        localStorage.setItem('scaleValue', scaleInput.value);
        location.reload();
      });

      degreeInput.addEventListener('change', () => {
        // scaleInput.value = scaleInput.value;
        localStorage.setItem('degreeValue', degreeInput.value);
        location.reload();
      });

      distanceInput.addEventListener('change', () => {
        // scaleInput.value = scaleInput.value;
        localStorage.setItem('distanceValue', distanceInput.value);
        location.reload();
      });

      const reset = document.createElement('div');
          reset.classList.add('reset-button');
          reset.textContent = 'Reset View';
          reset.style.position = 'absolute';
          reset.style.bottom = '25px';
          reset.style.right = '20px';
          reset.style.zIndex = '1000';
          reset.style.display = 'flex';
          reset.style.alignItems = 'center';
          reset.style.gap = '8px';
          reset.style.color = '#fff';
          reset.style.fontFamily = 'tektur, sans-serif';
          reset.style.fontSize = '12px';
          reset.style.cursor = 'pointer';

          renderer.appendChild(reset);

          reset.addEventListener('click', () => {
            // scaleInput.value = scaleInput.value;
            localStorage.setItem('distanceValue', 100);
            localStorage.setItem('degreeValue', 5);
            localStorage.setItem('scaleValue', 10);
            location.reload();
          });


          
      // degreeContainer.appendChild(degreeLabel);
      // degreeContainer.appendChild(degreeInput);
      // scaleContainer.appendChild(scaleInput);
      // scaleContainer.appendChild(scaleLabel);
      // distanceContainer.appendChild(distanceInput);
      // distanceContainer.appendChild(distanceLabel);

      // renderer.appendChild(degreeContainer);
      // renderer.appendChild(scaleContainer);
      // renderer.appendChild(distanceContainer); // Füge den Button zum Renderer hinzu

      console.log("degreeValue:", binSizeDeg);
      console.log("Distance Bin", binSize);
      console.log("Scale", scale);
      console.log("Alle Entdeckungsmethoden:", Array.from(allMethods));

      // switchBtn.
      document.getElementById("switchView").addEventListener("click", () => { // Event-Listener für den Button "Wechsle Ansicht"
        // const newMode = currentView === "glon" ? "discoveryyear" : "glon";  // Wechsle zwischen "glon" und "discoveryyear"
        const currentView = localStorage.getItem("viewMode") || "glon"; // Hole die aktuelle Ansicht aus dem Local Storage oder setze "glon" als Standard
        // const viewModes = ["glon", "discoveryyear", "earthlike"]; // Definiere die verfügbaren Ansichten
        const viewModes = ["glon", "discoveryyear"]; // Definiere die verfügbaren Ansichten, ohne earthlike
        const currentIndex = viewModes.indexOf(currentView); // Finde den aktuellen Index der Ansicht
        const newIndex = (currentIndex + 1) % viewModes.length; // Berechne den neuen Index (zyklisch)

        const newMode = viewModes[newIndex]; // Bestimme die neue Ansicht

        localStorage.setItem("viewMode", newMode);  // Speichere die neue Ansicht im Local Storage
        location.reload();  // Seite neu laden, um die neue Ansicht anzuzeigen
      });

});



