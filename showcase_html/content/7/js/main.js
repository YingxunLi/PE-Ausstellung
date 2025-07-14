let renderer;
let groupedData;
const eruptionData = [];
let dataFilterd = [];

let stageHeight;
let stageWidth;

init();

async function init() {
  renderer = document.querySelector('#renderer');

  // Setze die Breite und Höhe des Canvas auf die Größe des Viewports
  renderer.style.width = `${window.innerWidth}px`;
  renderer.style.height = `${window.innerHeight}px`;

  stageWidth = window.innerWidth;
  stageHeight = window.innerHeight;

  renderer.dataset.view = '2'; // Setze die Standardansicht auf 2 (World Map)

  // Füge einen VEI Diagram Button unten rechts hinzu
  const veiDiagramButton = document.createElement('button');
  veiDiagramButton.innerText = 'Explore Eruptions';
  veiDiagramButton.className = 'world-map-button';
  document.body.appendChild(veiDiagramButton);

  // Event-Listener für den VEI Diagram Button
  veiDiagramButton.addEventListener('click', () => {
    animateViewTransition(() => {
      renderer.innerHTML = '';
      drawDiagramWithEruptionsXAxis();
    }, 'slideRight');
  });

  // console.log('Data:', eruptionData);
  await prepareData();
  
  console.log('Eruption data loaded:', eruptionData.length, 'volcanoes');
  
  // Debug: Check for duplicates
  const volcanoNames = eruptionData.map(v => v.volcano_name);
  const uniqueNames = [...new Set(volcanoNames)];
  console.log('Unique volcano names:', uniqueNames.length);
  console.log('Total volcanoes:', volcanoNames.length);
  
  if (uniqueNames.length !== volcanoNames.length) {
    console.log('WARNING: Duplicate volcanoes detected!');
    const duplicates = volcanoNames.filter((name, index) => volcanoNames.indexOf(name) !== index);
    console.log('Duplicates:', [...new Set(duplicates)]);
  }
  
  // Zeichne direkt die World Map nach der Datenvorbereitung
  drawWorldMap();
}

// Funktion für coole Animations-Übergänge
function animateViewTransition(callback, animationType = 'slideLeft') {
  const animationDuration = 800; // Längere Animation für smoothen Übergang
  
  if (animationType === 'slideLeft') {
    // Animation von VEI-Diagramm zu Weltkarte
    const circles = document.querySelectorAll('.circle');
    
    if (circles.length > 0) {
      // Starte den View-Wechsel sofort im Hintergrund
      callback();
      
      // Warte kurz, dann animiere zu Weltkarten-Positionen
      setTimeout(() => {
        const volcanoMarkers = document.querySelectorAll('.volcano-marker');
        
        // Erstelle ein Mapping zwischen Vulkannamen für präzise Animation
        const circleToMarkerMap = new Map();
        circles.forEach(circle => {
          const volcanoName = circle.getAttribute('data-volcano-name');
          const correspondingMarker = Array.from(volcanoMarkers).find(marker => 
            marker.dataset.volcanoName === volcanoName
          );
          if (correspondingMarker) {
            circleToMarkerMap.set(circle, correspondingMarker);
          }
        });
        
        // Animiere jeden Kreis zu seiner entsprechenden Weltkarten-Position
        circles.forEach((circle, index) => {
          const targetMarker = circleToMarkerMap.get(circle);
          
          if (targetMarker) {
            // Berechne Zielposition basierend auf dem Weltkarten-Marker
            const targetRect = targetMarker.getBoundingClientRect();
            const circleRect = circle.getBoundingClientRect();
            
            // Berechne relative Position
            const deltaX = targetRect.left - circleRect.left;
            const deltaY = targetRect.top - circleRect.top;
            
            // Setze Transition für ease-in-out
            circle.style.transition = `all ${animationDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
            circle.style.zIndex = '1001';
            
            // Animiere zur Zielposition mit sanfter Bewegung
            circle.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.8)`;
            circle.style.opacity = '0.8';
            
            // Nach der Hälfte der Animation: Morphing-Effekt zu Weltkarten-Farben
            setTimeout(() => {
              circle.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.3)`;
              circle.style.opacity = '0';
              circle.style.borderRadius = '50%';
              // Ändere Farbe zu Orange (Weltkarten-Farbe)
              circle.style.backgroundColor = 'rgba(255, 140, 60, 0.7)';
            }, animationDuration / 2);
            
          } else {
            // Fallback: Animiere zu zufälliger Position auf der Weltkarte
            const randomX = Math.random() * stageWidth - circle.offsetLeft;
            const randomY = Math.random() * stageHeight - circle.offsetTop;
            
            circle.style.transition = `all ${animationDuration}ms ease-in-out`;
            circle.style.transform = `translate(${randomX}px, ${randomY}px) scale(0.5) rotate(180deg)`;
            circle.style.opacity = '0';
          }
        });
        
        // Nach der Animation: Reinige alte Kreise und animiere Marker ein
        setTimeout(() => {
          // Entferne alte Kreise
          circles.forEach(circle => {
            if (circle.parentNode) {
              circle.parentNode.removeChild(circle);
            }
          });
          
          // Animiere die Weltkarten-Marker ein
        }, animationDuration);
        
      }, 100); // Kurze Verzögerung um sicherzustellen, dass die Weltkarte geladen ist
      
    } else {
      // Fallback wenn keine Kreise vorhanden sind
      callback();
    }
  } else if (animationType === 'slideRight') {
    // Animation von Weltkarte zu VEI-Diagramm
    const volcanoMarkers = document.querySelectorAll('.volcano-marker');
    
    if (volcanoMarkers.length > 0) {
      // Starte den View-Wechsel sofort im Hintergrund
      callback();
      
      // Warte kurz, dann animiere zu VEI-Diagramm-Positionen
      setTimeout(() => {
        const circles = document.querySelectorAll('.circle');
        
        // Erstelle ein Mapping zwischen Vulkannamen für bessere Animation
        const markerToCircleMap = new Map();
        volcanoMarkers.forEach(marker => {
          const volcanoName = marker.getAttribute('data-volcano-name');
          const correspondingCircle = Array.from(circles).find(circle => 
            circle.dataset.volcanoName === volcanoName
          );
          if (correspondingCircle) {
            markerToCircleMap.set(marker, correspondingCircle);
          }
        });
        
        // Animiere jeden Marker zu seiner entsprechenden VEI-Diagramm-Position
        volcanoMarkers.forEach((marker, index) => {
          const targetCircle = markerToCircleMap.get(marker);
          
          if (targetCircle) {
            // Berechne Zielposition basierend auf dem VEI-Diagramm-Kreis
            const targetRect = targetCircle.getBoundingClientRect();
            const markerRect = marker.getBoundingClientRect();
            
            // Berechne relative Position
            const deltaX = targetRect.left - markerRect.left;
            const deltaY = targetRect.top - markerRect.top;
            
            // Setze Transition für ease-in-out
            marker.style.transition = `all ${animationDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
            marker.style.zIndex = '1001';
            
            // Animiere zur Zielposition mit sanfter Bewegung
            marker.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.2)`;
            
            // Nach der Hälfte der Animation: Morphing-Effekt zu VEI-Farben
            setTimeout(() => {
              marker.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.8)`;
              marker.style.opacity = '0.6';
            }, animationDuration / 2);
            
          } else {
            // Fallback: Animiere zu zufälliger Position im VEI-Diagramm
            const randomX = (Math.random() * (stageWidth - 400)) + 200 - marker.offsetLeft;
            const randomY = (Math.random() * (stageHeight - 300)) + 150 - marker.offsetTop;
            
            marker.style.transition = `all ${animationDuration}ms ease-in-out`;
            marker.style.transform = `translate(${randomX}px, ${randomY}px) scale(0.8) rotate(-180deg)`;
            marker.style.opacity = '0.4';
          }
        });
        
        // Nach der Animation: Reinige alte Marker und zeige neue Kreise
        setTimeout(() => {
          // Entferne alte Marker
          volcanoMarkers.forEach(marker => {
            if (marker.parentNode) {
              marker.parentNode.removeChild(marker);
            }
          });
          
          // Animiere die VEI-Diagramm-Kreise ein
        }, animationDuration);
        
      }, 100); // Kurze Verzögerung um sicherzustellen, dass das VEI-Diagramm geladen ist
      
    } else {
      // Fallback wenn keine Marker vorhanden sind
      callback();
    }
  } else {
    // Normale Animation für andere Übergänge
    callback();
  }
}

async function prepareData() {
  // console.log(data);

  // Leere das eruptionData Array um Duplikate zu vermeiden
  eruptionData.length = 0;

  // Lade die events.json-Daten
  const eventsData = await loadJSONData('./data/events.json');

  if (!eventsData) {
    console.error('Failed to load events data.');
    return;
  }

  // Filtere die Eruptionen mit gültigem VEI-Wert
  dataFilterd = data.filter((eruption) => {
    if (typeof eruption.vei === 'number') return true;
    else return false;
  });

  groupedData = gmynd.groupData(dataFilterd, 'volcano_number');

  Object.entries(groupedData).forEach(([key, eruptions]) => {
    let vei_sum = 0;
    let erup_count = 0;
    eruptions.forEach((eruption) => {
      if (typeof eruption.vei === 'number') {
        vei_sum += eruption.vei;
        erup_count++;
      }
    });
    const vei_min = dataMin(eruptions, "vei");
    const vei_max = dataMax(eruptions, "vei");
    const first_eruption = dataMin(eruptions, "start_year");
    const last_eruption = dataMax(eruptions, "end_year");

    // Filtere Vulkane mit NaN-Duration heraus
    if (isNaN(last_eruption - first_eruption)) return;

    const volcano_name = eruptions[0].volcano_name || 'Unknown Volcano';
    const latitude = eruptions[0].latitude || 0;
    const longitude = eruptions[0].longitude || 0;

    const vei_average = erup_count > 0 ? parseFloat((vei_sum / erup_count).toFixed(2)) : 0;

    // Füge die event_type-Daten aus events.json hinzu
    const volcanoEvents = eventsData.filter(event => event.volcano_number === parseInt(key));

    eruptionData.push({
      volcano_number: key,
      volcano_name,
      eruptions: eruptions,
      vei_sum,
      vei_average,
      vei_min,
      vei_max,
      first_eruption,
      last_eruption,
      latitude,
      longitude,
      events: volcanoEvents // Füge die Events hinzu
    });
  });

  // console.log(eruptionData);
}

function dataMax(data, prop) {
  return Math.max.apply(Math, data.map(function (obj) {
    return Number.isFinite(obj[prop]) ? obj[prop] : -Infinity;
  }));
}

function dataMin(data, prop) {
  return Math.min.apply(Math, data.map(function (obj) {
    return Number.isFinite(obj[prop]) ? obj[prop] : Infinity;
  }));
}

// Funktion für die Weltkarte (Ansicht 2)
async function drawWorldMap() {
  // Entferne alle Kreise aus dem VEI-Diagramm
  const circles = document.querySelectorAll('.circle');
  circles.forEach(circle => {
    if (circle.parentNode) {
      circle.parentNode.removeChild(circle);
    }
  });
  
  // Entferne alle Textelemente aus dem Renderer (einschließlich "Vulcano Eruptions von 2000-2025")
  const rendererTexts = renderer.querySelectorAll('div, span, p, h1, h2, h3, h4, h5, h6');
  rendererTexts.forEach(textElement => {
    if (textElement.parentNode === renderer) {
      textElement.remove();
    }
  });
  
  // Blende alle Achsenlabels aus, die noch vom VEI-Diagramm übrig sein könnten
  const axisLabels = document.querySelectorAll('.axis-label, .axis-label-minor, .y-axis-label');
  axisLabels.forEach(label => {
    if (label.parentNode === document.body) {
      label.style.display = 'none';
    }
  });
  
  // Blende das Raster aus in der Atlas-Ansicht
  const gridContainers = document.querySelectorAll('.grid-container');
  gridContainers.forEach(grid => {
    grid.style.display = 'none';
  });
  
  const gridLines = document.querySelectorAll('.grid-line-vertical, .grid-line-horizontal');
  gridLines.forEach(line => {
    line.style.display = 'none';
  });
  
  const gridLabels = document.querySelectorAll('.grid-label');
  gridLabels.forEach(label => {
    label.style.display = 'none';
  });
  
  // Blende den Sort-Button aus, da er nur in der VEI-Diagramm-Ansicht relevant ist
  const sortButtons = document.querySelectorAll('.sort-button');
  sortButtons.forEach(button => {
    button.style.display = 'none';
  });
  
  // Zeige den VEI Diagram Button an, da wir jetzt in der World Map sind
  const worldMapButtons = document.querySelectorAll('.world-map-button');
  worldMapButtons.forEach(button => {
    button.style.display = 'block';
  });
  
  // Blende die "Vulcano Eruptions" Überschrift aus in der World Map Ansicht
  const mainTitles = document.querySelectorAll('.main-title');
  mainTitles.forEach(title => {
    title.style.display = 'none';
  });
  
  // Füge einen Back Button hinzu (versteckt, da World Map jetzt die Hauptansicht ist)
  let backButton = document.querySelector('.back-button');
  if (!backButton) {
    backButton = document.createElement('button');
    backButton.innerText = 'back';
    backButton.className = 'back-button';
    document.body.appendChild(backButton);
    
    // Event-Listener für den Back Button
    backButton.addEventListener('click', () => {
      renderer.innerHTML = '';
      drawWorldMap();
      
      // Zeige VEI Diagram Button wieder an
      const veiDiagramButtons = document.querySelectorAll('.world-map-button');
      veiDiagramButtons.forEach(button => {
        button.style.display = 'block';
      });
      
      // Zeige Search Container wieder an
      const searchContainers = document.querySelectorAll('.search-container');
      searchContainers.forEach(container => {
        container.style.display = 'block';
      });
      
      // Verstecke Back Button
      backButton.style.display = 'none';
      
      // Entferne VEI Diagramm Titel
      const mainTitles = document.querySelectorAll('.main-title');
      mainTitles.forEach(title => {
        if (title.parentNode) {
          title.parentNode.removeChild(title);
        }
      });
      
      // Entferne Sort-Buttons
      const sortButtons = document.querySelectorAll('.sort-button');
      sortButtons.forEach(button => {
        if (button.parentNode) {
          button.parentNode.removeChild(button);
        }
      });
      
      // Entferne Achsenlabels
      const axisLabels = document.querySelectorAll('.axis-label, .axis-label-minor, .y-axis-label');
      axisLabels.forEach(label => {
        if (label.parentNode === document.body) {
          label.parentNode.removeChild(label);
        }
      });
      
      // Hinweis: Suchcontainer NICHT entfernen - sie bleiben in der Atlas-Ansicht sichtbar
      
      // Entferne Regions-Filter Container
      const regionsFilterContainers = document.querySelectorAll('.regions-filter-container');
      regionsFilterContainers.forEach(container => {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      });
      
      // Entferne Slider Container
      const sliderContainers = document.querySelectorAll('.slider-container');
      sliderContainers.forEach(container => {
        if (container.parentNode === document.body) {
          container.parentNode.removeChild(container);
        }
      });
      
      // Entferne Legende
      const legends = document.querySelectorAll('.world-map-legend');
      legends.forEach(legend => {
        if (legend.parentNode === document.body) {
          legend.parentNode.removeChild(legend);
        }
      });
    });
  }
  
  backButton.style.display = 'none'; // Verstecke Back Button da World Map jetzt die Hauptansicht ist

  // Füge Überschrift für World Map hinzu
  const worldMapTitle = document.createElement('div');
  worldMapTitle.className = 'world-map-title';
  worldMapTitle.innerText = 'The Vulcanic Atlas';
  worldMapTitle.style.position = 'absolute';
  worldMapTitle.style.top = '40px';
  worldMapTitle.style.left = '30px';
  worldMapTitle.style.fontFamily = "'Kumbh Sans', sans-serif";
  worldMapTitle.style.fontSize = '28px';
  worldMapTitle.style.fontWeight = 'bold';
  worldMapTitle.style.color = 'white';
  worldMapTitle.style.zIndex = '20';
  document.body.appendChild(worldMapTitle);

  // Erstelle Suchfeld für Vulkane - positioniert links oben unter der Überschrift
  // Prüfe ob bereits ein Search Container existiert
  let searchContainer = document.querySelector('.search-container');
  
  if (!searchContainer) {
    searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.style.position = 'absolute';
    searchContainer.style.top = '80px'; // Unter der Überschrift "The Vulcanic Atlas"
    searchContainer.style.left = '20px'; // Etwas weiter links positioniert
    searchContainer.style.zIndex = '15';
    searchContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    searchContainer.style.padding = '10px';
    searchContainer.style.borderRadius = '8px';
    searchContainer.style.border = 'none';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search volcanoes...';
    searchInput.style.width = '200px'; // Breitere Eingabe für bessere Bündigkeit mit der Überschrift
    searchInput.style.padding = '8px';
    searchInput.style.borderRadius = '8px';
    searchInput.style.border = 'none';
    searchInput.style.outline = 'none';
    searchInput.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    searchInput.style.color = 'white';
    searchInput.style.fontSize = '12px';

    const searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    searchResults.style.position = 'absolute';
    searchResults.style.top = '100%';
    searchResults.style.left = '0';
    searchResults.style.right = '0';
    searchResults.style.maxHeight = '300px';
    searchResults.style.overflowY = 'auto';
    searchResults.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    searchResults.style.border = '1px solid rgba(255, 255, 255, 0.3)';
    searchResults.style.borderTop = 'none';
    searchResults.style.borderRadius = '0 0 8px 8px';
    searchResults.style.display = 'none';

    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(searchResults);
    document.body.appendChild(searchContainer);
  } else {
    // Falls bereits vorhanden, stelle sicher dass es sichtbar ist
    searchContainer.style.display = 'block';
  }

  // Get references to the search elements (whether newly created or existing)
  const searchInput = searchContainer.querySelector('input');
  const searchResults = searchContainer.querySelector('.search-results');

  // Erstelle Regions-Filter (Checkboxes) - positioniert rechts oben
  const regionsFilterContainer = document.createElement('div');
  regionsFilterContainer.className = 'regions-filter-container';
  regionsFilterContainer.style.position = 'absolute';
  regionsFilterContainer.style.top = '20px'; // Oben positioniert
  regionsFilterContainer.style.right = '20px'; // Rechts positioniert
  regionsFilterContainer.style.zIndex = '15';
  regionsFilterContainer.style.minWidth = '120px'; // Sehr schmal für einspaltige Ansicht
  regionsFilterContainer.style.maxWidth = '120px';
  regionsFilterContainer.style.height = 'auto';
  regionsFilterContainer.style.overflowY = 'visible';

  const regionsTitle = document.createElement('div');
  regionsTitle.className = 'filter-title';
  regionsTitle.innerText = 'Filter by continent:';
  regionsFilterContainer.appendChild(regionsTitle);

  // Erstelle Grid-Container für die Checkboxes
  const checkboxesGrid = document.createElement('div');
  checkboxesGrid.className = 'continent-checkboxes-grid';
  regionsFilterContainer.appendChild(checkboxesGrid);

  const jsonDataUrl = './data/vulcano.json'; // Pfad zur JSON-Datei
  const vulcanoData = await loadJSONData(jsonDataUrl);

  if (!vulcanoData) {
    console.error('Failed to load vulcano data.');
    return;
  }

  // Sammle alle einzigartigen Regionen aus den Daten
  const allRegions = [...new Set(vulcanoData.map(volcano => volcano.region))].sort();
  
  // Gruppiere Regionen nach Kontinenten
  const continentMapping = {
    'Africa': [
      'Africa and Red Sea'
    ],
    'Asia': [
      'Kamchatka and Mainland Asia',
      'Kuril Islands',
      'Japan, Taiwan, Marianas',
      'Indonesia',
      'Philippines and SE Asia',
      'Middle East and Indian Ocean',
      'Mediterranean and Western Asia'
    ],
    'Europe': [
      'Iceland and Arctic Ocean'
    ],
    'North America': [
      'Alaska',
      'Canada and Western USA',
      'México and Central America',
      'West Indies'
    ],
    'South America': [
      'South America'
    ],
    'Australia/Oceania': [
      'Melanesia and Australia',
      'New Zealand to Fiji',
      'Hawaii and Pacific Ocean'
    ],
    'Antarctica': [
      'Antarctica'
    ],
    'Ocean': [
      'Atlantic Ocean',
      'Pacific Ocean',
      'Indian Ocean'
    ]
  };
  
  // Erstelle eine umgekehrte Zuordnung von Region zu Kontinent
  const regionToContinent = {};
  Object.entries(continentMapping).forEach(([continent, regions]) => {
    regions.forEach(region => {
      regionToContinent[region] = continent;
    });
  });
  
  // Finde alle verfügbaren Kontinente basierend auf den tatsächlich vorhandenen Regionen
  const availableContinents = [...new Set(
    allRegions.map(region => regionToContinent[region]).filter(continent => continent)
  )].sort();
  
  // State für aktive Kontinente (alle standardmäßig aktiv)
  const activeContinents = new Set(availableContinents);
  
  // Funktion um aktive Regionen basierend auf aktiven Kontinenten zu berechnen
  const getActiveRegions = () => {
    const activeRegions = new Set();
    allRegions.forEach(region => {
      const continent = regionToContinent[region];
      if (continent && activeContinents.has(continent)) {
        activeRegions.add(region);
      } else if (!continent) {
        // Regionen ohne Kontinent-Zuordnung bleiben immer aktiv
        activeRegions.add(region);
      }
    });
    return activeRegions;
  };
  
  // Erstelle Checkboxen für jeden Kontinent
  availableContinents.forEach(continent => {
    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'continent-checkbox-container';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `continent-${continent.replace(/\s+/g, '-').replace(/\//g, '-')}`;
    checkbox.checked = true; // Alle Kontinente standardmäßig aktiv
    
    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.innerText = continent;
    
    // Update active state
    const updateActiveState = () => {
      if (checkbox.checked) {
        checkboxContainer.classList.add('active');
      } else {
        checkboxContainer.classList.remove('active');
      }
    };
    
    // Event-Listener für Checkbox-Änderungen
    checkbox.addEventListener('change', (e) => {
      updateActiveState();
      if (e.target.checked) {
        activeContinents.add(continent);
      } else {
        activeContinents.delete(continent);
      }
      
      // Filtere und redraw Vulkane basierend auf aktiven Kontinenten
      applyRegionFilter();
    });
    
    // Klick auf Container togglet auch die Checkbox
    checkboxContainer.addEventListener('click', (e) => {
      if (e.target !== checkbox && e.target !== label && e.target.parentNode !== label) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      }
    });
    
    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(label);
    checkboxesGrid.appendChild(checkboxContainer); // Append to grid instead of main container
    
    // Initialize active state
    updateActiveState();
  });
  
  // "Select All" / "Deselect All" Button hinzufügen
  const selectAllContainer = document.createElement('div');
  selectAllContainer.className = 'select-all-container';
  
  const selectAllButton = document.createElement('button');
  selectAllButton.className = 'select-all-button';
  selectAllButton.innerText = 'Deselect All';
  
  selectAllButton.addEventListener('click', () => {
    const checkboxes = regionsFilterContainer.querySelectorAll('input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    if (allChecked) {
      // Deselect all
      checkboxes.forEach(cb => {
        cb.checked = false;
        const continent = availableContinents.find(c => cb.id === `continent-${c.replace(/\s+/g, '-').replace(/\//g, '-')}`);
        if (continent) activeContinents.delete(continent);
        // Update active state
        const container = cb.parentNode;
        container.classList.remove('active');
      });
      selectAllButton.innerText = 'Select All';
    } else {
      // Select all
      checkboxes.forEach(cb => {
        cb.checked = true;
        const continent = availableContinents.find(c => cb.id === `continent-${c.replace(/\s+/g, '-').replace(/\//g, '-')}`);
        if (continent) activeContinents.add(continent);
        // Update active state
        const container = cb.parentNode;
        container.classList.add('active');
      });
      selectAllButton.innerText = 'Deselect All';
    }
    
    applyRegionFilter();
  });
  
  selectAllContainer.appendChild(selectAllButton);
  regionsFilterContainer.appendChild(selectAllContainer);
  document.body.appendChild(regionsFilterContainer);

  // Suchfunktionalität implementieren
  let originalOpacities = new Map(); // Speichert ursprüngliche Opazitäten der Kreise
  let highlightedVolcano = null; // Speichert den aktuell hervorgehobenen Vulkan
  
  // Funktion zum Anwenden des Regions-Filters
  function applyRegionFilter() {
    // Aktuelle Radius-Auswahl beibehalten
    const currentRadiusIndex = parseInt(slider.value);
    
    // Redraw volcanoes mit dem aktiven Regions-Filter
    drawVolcanoes(currentRadiusIndex);
    
    // Auch die Suchfunktion neu anwenden falls aktiv
    if (searchInput.value.trim()) {
      filterVolcanoes(searchInput.value);
    }
    
    // Hervorhebung wieder anwenden falls vorhanden
    if (highlightedVolcano) {
      const volcanoElement = document.querySelector(`[data-volcano-name="${highlightedVolcano}"]`);
      if (volcanoElement) {
        volcanoElement.style.backgroundColor = '#ffff00'; // Gelb
        volcanoElement.style.opacity = '1';
        volcanoElement.style.transform = 'scale(1.8)';
        volcanoElement.style.zIndex = '1000';
      }
    }
  }
  
  function filterVolcanoes(searchTerm) {
    searchTerm = searchTerm.toLowerCase().trim();
    
    // Berechne aktive Regionen basierend auf aktiven Kontinenten
    const activeRegions = getActiveRegions();
    
    // Wenn leer, alle Vulkane wieder einblenden (aber nur die aus aktiven Regionen) und Hervorhebung entfernen
    if (searchTerm === '') {
      // Entferne Hervorhebung
      if (highlightedVolcano) {
        const volcanoElement = document.querySelector(`[data-volcano-name="${highlightedVolcano}"]`);
        if (volcanoElement) {
          volcanoElement.style.backgroundColor = volcanoElement.dataset.originalBackgroundColor || 'rgba(255, 140, 60, 0.7)';
          volcanoElement.style.transform = 'scale(1)';
          volcanoElement.style.zIndex = '1';
        }
        highlightedVolcano = null;
      }
      
      vulcanoData.forEach(volcano => {
        const volcanoElement = document.querySelector(`[data-volcano-name="${volcano.volcano_name}"]`);
        if (volcanoElement && activeRegions.has(volcano.region)) {
          volcanoElement.style.opacity = originalOpacities.get(volcano.volcano_name) || '0.7';
        }
      });
      searchResults.style.display = 'none';
      return;
    }

    // Filtere nach Namen UND aktiven Regionen
    const matchingVolcanoes = vulcanoData.filter(volcano => 
      volcano.volcano_name.toLowerCase().includes(searchTerm) && 
      activeRegions.has(volcano.region)
    );

    // Alle Vulkane ausblenden/dimmen
    vulcanoData.forEach(volcano => {
      const volcanoElement = document.querySelector(`[data-volcano-name="${volcano.volcano_name}"]`);
      if (volcanoElement) {
        if (!originalOpacities.has(volcano.volcano_name)) {
          originalOpacities.set(volcano.volcano_name, volcanoElement.style.opacity || '0.7');
        }
        volcanoElement.style.opacity = '0.1';
      }
    });

    // Passende Vulkane hervorheben
    matchingVolcanoes.forEach(volcano => {
      const volcanoElement = document.querySelector(`[data-volcano-name="${volcano.volcano_name}"]`);
      if (volcanoElement) {
        volcanoElement.style.opacity = originalOpacities.get(volcano.volcano_name) || '0.7';
      }
    });

    // Suchergebnisse anzeigen
    displaySearchResults(matchingVolcanoes, searchTerm);
  }

  function displaySearchResults(matches, searchTerm) {
    searchResults.innerHTML = '';
    
    if (matches.length === 0) {
      const noResults = document.createElement('div');
      noResults.style.padding = '10px';
      noResults.style.color = 'rgba(255, 255, 255, 0.7)';
      noResults.style.fontSize = '12px';
      noResults.innerText = 'No volcanoes found';
      searchResults.appendChild(noResults);
    } else {
      // Begrenze auf die ersten 10 Ergebnisse
      const limitedMatches = matches.slice(0, 10);
      
      limitedMatches.forEach(volcano => {
        const resultItem = document.createElement('div');
        resultItem.style.padding = '8px 10px';
        resultItem.style.cursor = 'pointer';
        resultItem.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
        resultItem.style.fontSize = '12px';
        resultItem.style.color = 'white';
        resultItem.style.transition = 'background-color 0.2s';
        
        // Hervorhebung des Suchbegriffs
        const volcanoName = volcano.volcano_name;
        const highlightedName = volcanoName.replace(
          new RegExp(`(${searchTerm})`, 'gi'),
          '<span style="background-color: #ff6b35; color: white; padding: 1px 2px; border-radius: 2px;">$1</span>'
        );
        
        resultItem.innerHTML = `
          <div style="font-weight: bold;">${highlightedName}</div>
          <div style="color: rgba(255, 255, 255, 0.7); font-size: 10px;">
            Lat: ${volcano.latitude.toFixed(2)}° • Lon: ${volcano.longitude.toFixed(2)}°
          </div>
        `;

        // Hover-Effekt
        resultItem.addEventListener('mouseenter', () => {
          resultItem.style.backgroundColor = 'rgba(255, 107, 53, 0.2)';
        });
        
        resultItem.addEventListener('mouseleave', () => {
          resultItem.style.backgroundColor = 'transparent';
        });

        // Klick-Event: Zentriere auf Vulkan und behalte Hervorhebung
        resultItem.addEventListener('click', () => {
          const volcanoElement = document.querySelector(`[data-volcano-name="${volcano.volcano_name}"]`);
          if (volcanoElement) {
            // Entferne vorherige Hervorhebung falls vorhanden
            if (highlightedVolcano && highlightedVolcano !== volcano.volcano_name) {
              const previousElement = document.querySelector(`[data-volcano-name="${highlightedVolcano}"]`);
              if (previousElement) {
                previousElement.style.backgroundColor = previousElement.dataset.originalBackgroundColor || 'rgba(255, 140, 60, 0.7)';
                previousElement.style.transform = 'scale(1)';
                previousElement.style.zIndex = '1';
              }
            }
            
            // Speichere ursprüngliche Farbe falls noch nicht gespeichert
            if (!volcanoElement.dataset.originalBackgroundColor) {
              volcanoElement.dataset.originalBackgroundColor = volcanoElement.style.backgroundColor;
            }
            
            // Hervorhebung: gelb und viel größer - dauerhaft
            volcanoElement.style.backgroundColor = '#ffff00'; // Gelb
            volcanoElement.style.opacity = '1';
            volcanoElement.style.transform = 'scale(3.5)';
            volcanoElement.style.zIndex = '1000';
            
            // Speichere den hervorgehobenen Vulkan
            highlightedVolcano = volcano.volcano_name;
          }
          
          // Suchergebnisse ausblenden
          searchResults.style.display = 'none';
          searchInput.blur();
        });

        searchResults.appendChild(resultItem);
      });

      // "X more results" anzeigen falls mehr als 10
      if (matches.length > 10) {
        const moreResults = document.createElement('div');
        moreResults.style.padding = '8px 10px';
        moreResults.style.color = 'rgba(255, 255, 255, 0.7)';
        moreResults.style.fontSize = '11px';
        moreResults.style.fontStyle = 'italic';
        moreResults.style.textAlign = 'center';
        moreResults.innerText = `... and ${matches.length - 10} more`;
        searchResults.appendChild(moreResults);
      }
    }
    
    searchResults.style.display = matches.length > 0 || searchTerm.length > 0 ? 'block' : 'none';
  }

  // Event Listeners für das Suchfeld
  searchInput.addEventListener('input', (e) => {
    filterVolcanoes(e.target.value);
  });

  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim()) {
      searchResults.style.display = 'block';
    }
  });

  // Klick außerhalb schließt Suchergebnisse
  document.addEventListener('click', (e) => {
    if (!searchContainer.contains(e.target)) {
      searchResults.style.display = 'none';
    }
  });

  // Escape-Taste schließt Suche und setzt Filter zurück
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      filterVolcanoes('');
      searchInput.blur();
    }
  });

  // Definiere die Radius-Optionen
  const radiusOptions = [
    { key: 'population_within_5_km', label: '5 km', color: 'rgba(255, 140, 60, 0.7)' },
    { key: 'population_within_10_km', label: '10 km', color: 'rgba(255, 140, 60, 0.7)' },
    { key: 'population_within_30_km', label: '30 km', color: 'rgba(255, 140, 60, 0.7)' },
    { key: 'population_within_100_km', label: '100 km', color: 'rgba(255, 140, 60, 0.7)' }
  ];

  let volcanoCircles = []; // Array zum Speichern der Vulkan-Kreise

  // Slider Container erstellen - wird zu document.body hinzugefügt für bessere Positionierung
  const sliderContainer = document.createElement('div');
  sliderContainer.className = 'slider-container';
  sliderContainer.style.position = 'absolute';
  sliderContainer.style.bottom = '20px'; // Jetzt unten positioniert
  sliderContainer.style.left = '30px'; // Bündig mit der Überschrift "The Vulcanic Atlas"
  sliderContainer.style.zIndex = '15';
  sliderContainer.style.transform = 'none'; // Überschreibt das CSS-zentrierte Layout
  sliderContainer.style.width = 'auto'; // Kompakte Breite
  sliderContainer.style.minWidth = '280px'; // Vergrößert um mit der Legende zu matchen
  sliderContainer.style.padding = '10px 15px'; // Vergrößertes Padding
  sliderContainer.style.height = 'auto'; // Automatische Höhe
  sliderContainer.style.maxHeight = '80px'; // Vergrößerte maximale Höhe

  // Slider Label
  const sliderLabel = document.createElement('div');
  sliderLabel.className = 'slider-label';
  sliderLabel.innerText = 'Population within: 100 km'; // Startwert auf 100km setzen
  sliderLabel.style.marginBottom = '6px'; // Etwas vergrößerter Abstand
  sliderLabel.style.fontSize = '12px'; // Vergrößert auf 12pt
  sliderLabel.style.lineHeight = '1.3'; // Etwas vergrößerte Zeilenhöhe
  sliderContainer.appendChild(sliderLabel);

  // Slider erstellen
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = '3';
  slider.value = '3'; // Starte bei 100km (Index 3)
  slider.className = 'slider';
  slider.style.marginBottom = '4px'; // Etwas vergrößerter Abstand
  slider.style.width = '250px'; // Vergrößerte Breite um mit der Legende zu matchen
  slider.style.height = '6px'; // Etwas dicker
  sliderContainer.appendChild(slider);

  // Slider Beschriftungen
  const sliderLabels = document.createElement('div');
  sliderLabels.className = 'slider-labels';
  sliderLabels.innerHTML = '<span>5km</span><span>10km</span><span>30km</span><span>100km</span>';
  sliderLabels.style.marginTop = '3px'; // Etwas vergrößerter Abstand
  sliderLabels.style.fontSize = '10px'; // Etwas größere Schrift
  sliderLabels.style.lineHeight = '1.2'; // Etwas vergrößerte Zeilenhöhe
  sliderContainer.appendChild(sliderLabels);

  document.body.appendChild(sliderContainer);

  // Funktion zum Zeichnen der Vulkane basierend auf dem gewählten Radius
  function drawVolcanoes(radiusIndex) {
    // Entferne alte Kreise
    volcanoCircles.forEach(circle => circle.remove());
    volcanoCircles = [];

    const selectedRadius = radiusOptions[radiusIndex];
    sliderLabel.innerText = `Population within: ${selectedRadius.label}`;

    // Berechne aktive Regionen basierend auf aktiven Kontinenten
    const activeRegions = getActiveRegions();

    // Filtere Vulkane basierend auf dem gewählten Radius UND aktiven Regionen
    const filteredVulcanoData = vulcanoData.filter((vulcano) => 
      vulcano[selectedRadius.key] > 0 && activeRegions.has(vulcano.region)
    );

    // Berechne Min/Max Bevölkerung für Größenskalierung
    const populationValues = filteredVulcanoData.map(vulcano => vulcano[selectedRadius.key]);
    const minPopulation = Math.min(...populationValues);
    const maxPopulation = Math.max(...populationValues);

    // Zeichne Kreise für die gefilterten Vulkane
    filteredVulcanoData.forEach((vulcano) => {
      const circle = document.createElement('div');
      circle.className = 'volcano-marker';
      
      // Füge data-volcano-name Attribut für die Suchfunktion hinzu
      circle.setAttribute('data-volcano-name', vulcano.volcano_name);
      
      // Berechne Kreisgröße basierend auf Bevölkerung
      const populationValue = vulcano[selectedRadius.key];
      const normalizedPopulation = populationValues.length === 1 ? 0.5 : 
        (populationValue - minPopulation) / (maxPopulation - minPopulation);
      const circleSize = Math.max(6 + normalizedPopulation * 20, 6); // Größe zwischen 6px und 26px
      
      circle.style.width = `${circleSize}px`;
      circle.style.height = `${circleSize}px`;
      circle.style.left = `${(vulcano.longitude + 180) * (stageWidth / 360) - circleSize/2}px`;
      circle.style.top = `${(90 - vulcano.latitude) * (stageHeight / 180) - circleSize/2}px`;
      circle.style.backgroundColor = selectedRadius.color;
      circle.style.position = 'absolute';
      circle.style.borderRadius = '50%';
      circle.style.cursor = 'pointer';
      circle.style.transition = 'transform 0.2s, opacity 0.2s';

      // Detaillierter Hover-Tooltip
      const hoverTooltip = document.createElement('div');
      hoverTooltip.style.position = 'absolute';
      hoverTooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
      hoverTooltip.style.color = 'white';
      hoverTooltip.style.padding = '10px';
      hoverTooltip.style.borderRadius = '8px';
      hoverTooltip.style.fontSize = '12px';
      hoverTooltip.style.pointerEvents = 'none';
      hoverTooltip.style.zIndex = '9999';
      hoverTooltip.style.display = 'none';
      hoverTooltip.style.maxWidth = '250px';
      hoverTooltip.style.border = '1px solid rgba(255, 255, 255, 0.3)';
      hoverTooltip.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';

      // Event-Listener für Hover-Effekt
      circle.addEventListener('mouseenter', (e) => {
        circle.style.transform = 'scale(2)';
        circle.style.zIndex = '1000';
        
        // Erstelle detaillierten Tooltip-Inhalt - nur aktueller Radius
        hoverTooltip.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 8px; color: #ffcc00;">${vulcano.volcano_name}</div>
          <div style="margin-bottom: 6px; color: rgba(255, 255, 255, 0.8); font-style: italic;">
            ${vulcano.country}
          </div>
          <div style="margin-top: 8px;">
            <strong>Population within ${selectedRadius.label}:</strong><br>
            <span style="color: ${selectedRadius.color}; font-weight: bold; font-size: 14px;">${populationValue.toLocaleString()} people</span>
          </div>
        `;
        
        // Positioniere Tooltip
        const rect = circle.getBoundingClientRect();
        hoverTooltip.style.left = `${rect.right + 10}px`;
        hoverTooltip.style.top = `${rect.top - 10}px`;
        hoverTooltip.style.display = 'block';
        
        document.body.appendChild(hoverTooltip);
      });

      circle.addEventListener('mouseleave', () => {
        circle.style.transform = 'scale(1)';
        circle.style.zIndex = '1';
        
        // Entferne Tooltip
        if (hoverTooltip.parentNode) {
          hoverTooltip.parentNode.removeChild(hoverTooltip);
        }
      });

      // Mausbewegung für Tooltip-Positionierung
      circle.addEventListener('mousemove', (e) => {
        if (hoverTooltip.parentNode) {
          const mouseX = e.clientX;
          const mouseY = e.clientY;
          const tooltipWidth = 250;
          const tooltipHeight = 200;
          
          // Überprüfe, ob Tooltip über Bildschirmrand hinausgeht
          let left = mouseX + 15;
          let top = mouseY - 10;
          
          if (left + tooltipWidth > window.innerWidth) {
            left = mouseX - tooltipWidth - 15;
          }
          if (top + tooltipHeight > window.innerHeight) {
            top = mouseY - tooltipHeight + 10;
          }
          if (top < 0) {
            top = 10;
          }
          
          hoverTooltip.style.left = `${left}px`;
          hoverTooltip.style.top = `${top}px`;
        }
      });

      renderer.appendChild(circle);
      volcanoCircles.push(circle);
    });

  }

  // Legende hinzufügen - auf document.body und bündig links unten
  const legend = document.createElement('div');
  legend.className = 'world-map-legend';
  legend.style.position = 'absolute';
  legend.style.bottom = '110px'; // Jetzt über dem Slider positioniert
  legend.style.left = '20px';
  legend.style.padding = '10px';
  legend.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  legend.style.color = 'white';
  legend.style.borderRadius = '10px';
  legend.style.fontSize = '12pt';
  legend.style.zIndex = '10';

  function updateLegend(selectedRadius) {
    legend.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">Legend</div>
      <div><span style="display:inline-block;width:15px;height:15px;background-color:${selectedRadius.color};margin-right:10px;border-radius:50%;"></span>Volcanoes with population within ${selectedRadius.label}</div>
    `;
  }

  document.body.appendChild(legend);

  // Event-Listener für den Slider
  slider.addEventListener('input', (e) => {
    const radiusIndex = parseInt(e.target.value);
    drawVolcanoes(radiusIndex);
    updateLegend(radiusOptions[radiusIndex]);
  });

  // Initialisiere mit dem letzten Radius (100km)
  drawVolcanoes(3);
  updateLegend(radiusOptions[3]);
}

async function loadJSONData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch JSON data: ${response.status}`);
    }
    const data = await response.json();
    // console.log('JSON data loaded:', data);
    return data;
  } catch (error) {
    console.error('Error loading JSON data:', error);
    return null;
  }
}

async function drawDiagramWithEruptionsXAxis() {
  renderer.innerHTML = ''; // Entferne die aktuelle Ansicht

  // Lade Vulkan-Daten für Country-Information
  const jsonDataUrl = './data/vulcano.json';
  const vulcanoData = await loadJSONData(jsonDataUrl);

  // Blende alle World Map UI Elemente aus
  const worldMapButtons = document.querySelectorAll('.world-map-button');
  worldMapButtons.forEach(button => {
    button.style.display = 'none';
  });
  
  const worldMapTitles = document.querySelectorAll('.world-map-title');
  worldMapTitles.forEach(title => {
    title.style.display = 'none';
  });
  
  const searchContainersHide = document.querySelectorAll('.search-container');
  searchContainersHide.forEach(container => {
    container.style.display = 'none'; // Verstecke statt entfernen
  });
  
  const regionsFilterContainers = document.querySelectorAll('.regions-filter-container');
  regionsFilterContainers.forEach(container => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });
  
  const sliderContainers = document.querySelectorAll('.slider-container');
  sliderContainers.forEach(container => {
    if (container.parentNode === document.body) {
      container.parentNode.removeChild(container);
    }
  });
  
  const legends = document.querySelectorAll('.world-map-legend');
  legends.forEach(legend => {
    if (legend.parentNode === document.body) {
      legend.parentNode.removeChild(legend);
    }
  });

  // Füge einen Back Button hinzu
  let backButton = document.querySelector('.back-button');
  if (!backButton) {
    backButton = document.createElement('button');
    backButton.innerText = 'back';
    backButton.className = 'back-button';
    document.body.appendChild(backButton);
    
    // Event-Listener für den Back Button
    backButton.addEventListener('click', () => {
      renderer.innerHTML = '';
      drawWorldMap();
      
      // Zeige VEI Diagram Button wieder an
      const veiDiagramButtons = document.querySelectorAll('.world-map-button');
      veiDiagramButtons.forEach(button => {
        button.style.display = 'block';
      });
      
      // Zeige Search Container wieder an
      const searchContainers = document.querySelectorAll('.search-container');
      searchContainers.forEach(container => {
        container.style.display = 'block';
      });
      
      // Verstecke Back Button
      backButton.style.display = 'none';
      
      // Entferne VEI Diagramm Titel
      const mainTitles = document.querySelectorAll('.main-title');
      mainTitles.forEach(title => {
        if (title.parentNode) {
          title.parentNode.removeChild(title);
        }
      });
      
      // Entferne Sort-Buttons
      const sortButtons = document.querySelectorAll('.sort-button');
      sortButtons.forEach(button => {
        if (button.parentNode) {
          button.parentNode.removeChild(button);
        }
      });
      
      // Entferne Achsenlabels
      const axisLabels = document.querySelectorAll('.axis-label, .axis-label-minor, .y-axis-label');
      axisLabels.forEach(label => {
        if (label.parentNode === document.body) {
          label.parentNode.removeChild(label);
        }
      });
    });
  }
  
  backButton.style.display = 'block';

  // Entferne eventuell existierende Sort-Buttons vor dem Erstellen eines neuen
  const existingSortButtons = document.querySelectorAll('.sort-button');
  existingSortButtons.forEach(button => {
    if (button.parentNode) {
      button.parentNode.removeChild(button);
    }
  });

  // Sortier-Button hinzufügen
  const sortButton = document.createElement('button');
  sortButton.innerText = 'Sort by eruption frequency';
  sortButton.className = 'sort-button';
  
  // Überschrift hinzufügen - im Margin-Bereich positioniert
  const title = document.createElement('div');
  title.className = 'main-title';
  title.innerText = 'Vulcano Eruptions';
  title.style.position = 'absolute';
  title.style.top = '40px'; // Gleiche Höhe wie der Sort-Button für perfekte Ausrichtung
  title.style.left = '30px'; // Etwas weiter links vom Diagramm
  title.style.fontFamily = "'Kumbh Sans', sans-serif";
  document.body.appendChild(title);

  // Warte bis das DOM gerendert ist, dann positioniere den Sort-Button dynamisch
  requestAnimationFrame(() => {
    // Setze Position direkt unter der Überschrift - im Margin-Bereich
    sortButton.style.position = 'absolute';
    sortButton.style.top = '85px'; // Weiter unten unter der Überschrift (40px + 45px Abstand)
    sortButton.style.left = '30px'; // Aligned mit der Überschrift
    sortButton.style.zIndex = '20'; // Über anderen Elementen

    document.body.appendChild(sortButton);
  });

  // State für den Grid-Modus
  let isGridMode = false;

  // Definiere 5 Hauptkategorien für Ausbruchsarten - neue Reihenfolge: Scoria oben, Explosive unten
  const eventTypeCategories = {
    "Scoria": ["Scoria", "Cinder cone"],
    "Pyroclastic": ["Pyroclastic flow", "Pyroclastic surge"],
    "Effusive": ["Effusive", "Lava flow(s)", "Hawaiian"],
    "Unknown": ["Unknown", "Uncertain", "", "Phreatomagmatic", "Phreatic", "Surtseyan"],
    "Explosive": ["Explosion", "Plinian", "Vulcanian", "Strombolian"]
  };

  // Funktion zur Kategorisierung von Event Types
  const getEventCategory = (eventType) => {
    for (const [category, types] of Object.entries(eventTypeCategories)) {
      if (types.includes(eventType)) {
        return category;
      }
    }
    return "Unknown";
  };

  // Event-Type-Farben für Kategorien - angepasst an neue Reihenfolge
  const eventTypeColors = {
    "Scoria": "green",
    "Pyroclastic": "yellow",
    "Effusive": "orange", 
    "Unknown": "gray",
    "Explosive": "red"
  };

  // Berechne die minimalen und maximalen Werte
  const minVEI = Math.min(...eruptionData.map(e => e.vei_average));
  const maxVEI = Math.max(...eruptionData.map(e => e.vei_average));

  // Dedupliziere VEI-Werte
  const uniqueVEIValues = [...new Set(eruptionData.map(e => Math.round(e.vei_average)))].sort((a, b) => a - b);

  // Zeichne die X-Achse (VEI-Werte) - korrigierte Positionierung
  const xAxis = document.createElement('div');
  xAxis.className = 'x-axis';
  xAxis.style.width = `${stageWidth}px`;
  renderer.appendChild(xAxis);

  // Berechne die Positionen für VEI-Achse (0 bis 7) - mit genug Platz für Text und Kreise
  const sideMargin = 180; // Zurück zum ursprünglichen Wert für mehr Platz
  const startX = sideMargin; // Genug Platz links für die Y-Achsen Labels
  const endX = stageWidth - sideMargin; // Gleichmäßiger Rand rechts
  const veiWidth = endX - startX;

  // Zeichne VEI-Werte (0-7) entlang der X-Achse
  for (let vei = 0; vei <= 7; vei++) {
    const veiLabel = document.createElement('div');
    veiLabel.className = 'axis-label vei-label';
    veiLabel.style.position = 'absolute';
    veiLabel.style.color = 'white';
    veiLabel.style.fontSize = '12px';
    veiLabel.style.fontWeight = 'bold';
    veiLabel.style.fontFamily = "'Kumbh Sans', sans-serif";
    veiLabel.style.transform = 'translate(-50%, 0)';
    veiLabel.style.left = `${startX + (vei / 7) * veiWidth}px`;
    veiLabel.style.bottom = '60px';
    veiLabel.innerText = vei.toString();
    renderer.appendChild(veiLabel);
  }

  // X-Achse Beschriftung hinzufügen
  const xAxisLabel = document.createElement('div');
  xAxisLabel.className = 'x-axis-label';
  xAxisLabel.style.position = 'absolute';
  xAxisLabel.style.color = 'white';
  xAxisLabel.style.fontSize = '14px';
  xAxisLabel.style.fontWeight = 'bold';
  xAxisLabel.style.fontFamily = "'Kumbh Sans', sans-serif";
  xAxisLabel.style.textAlign = 'center';
  xAxisLabel.style.left = `${startX + veiWidth / 2}px`;
  xAxisLabel.style.bottom = '20px';
  xAxisLabel.style.transform = 'translateX(-50%)';
  xAxisLabel.style.cursor = 'pointer';
  xAxisLabel.innerText = 'VEI (Volcanic Explosivity Index)';
  
  // VEI Tooltip erstellen
  const veiTooltip = document.createElement('div');
  veiTooltip.style.position = 'absolute';
  veiTooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
  veiTooltip.style.color = 'white';
  veiTooltip.style.padding = '12px';
  veiTooltip.style.borderRadius = '8px';
  veiTooltip.style.fontSize = '12px';
  veiTooltip.style.pointerEvents = 'none';
  veiTooltip.style.zIndex = '9999';
  veiTooltip.style.display = 'none';
  veiTooltip.style.maxWidth = '300px';
  veiTooltip.style.border = '1px solid rgba(255, 255, 255, 0.3)';
  veiTooltip.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
  veiTooltip.style.lineHeight = '1.4';
  veiTooltip.innerText = 'The Volcanic Explosivity Index (VEI) is a scale from 0 to 8 that measures the intensity of volcanic eruptions based on the volume of erupted material, eruption cloud height, and overall explosiveness.';
  
  // Event-Listener für VEI Label Hover
  xAxisLabel.addEventListener('mouseenter', (e) => {
    const rect = xAxisLabel.getBoundingClientRect();
    veiTooltip.style.left = `${rect.left + rect.width / 2 - 150}px`; // Zentriert unter dem Label
    veiTooltip.style.top = `${rect.bottom + 10}px`; // 10px unter dem Label
    veiTooltip.style.display = 'block';
    document.body.appendChild(veiTooltip);
  });
  
  xAxisLabel.addEventListener('mouseleave', () => {
    if (veiTooltip.parentNode) {
      veiTooltip.parentNode.removeChild(veiTooltip);
    }
  });
  
  renderer.appendChild(xAxisLabel);

  // Erstelle versteckte Vulkan-Nummern-Labels für Grid-Modus
  const leftLabel = document.createElement('div');
  leftLabel.className = 'axis-label volcano-number-label';
  leftLabel.style.position = 'absolute';
  leftLabel.style.color = 'black';
  leftLabel.style.fontSize = '12px';
  leftLabel.style.fontWeight = 'bold';
  leftLabel.style.fontFamily = "'Kumbh Sans', sans-serif";
  leftLabel.style.transform = 'translate(-50%, 0)';
  leftLabel.style.left = `${startX}px`;
  leftLabel.style.bottom = '60px';
  leftLabel.style.display = 'none'; // Standardmäßig versteckt
  leftLabel.innerText = '1';
  renderer.appendChild(leftLabel);
  
  const rightLabel = document.createElement('div');
  rightLabel.className = 'axis-label volcano-number-label';
  rightLabel.style.position = 'absolute';
  rightLabel.style.color = 'black';
  rightLabel.style.fontSize = '12px';
  rightLabel.style.fontWeight = 'bold';
  rightLabel.style.fontFamily = "'Kumbh Sans', sans-serif";
  rightLabel.style.transform = 'translate(-50%, 0)';
  rightLabel.style.left = `${endX}px`;
  rightLabel.style.bottom = '60px';
  rightLabel.style.display = 'none'; // Standardmäßig versteckt
  rightLabel.innerText = '182';
  renderer.appendChild(rightLabel);

  // Zeichne die Y-Achse (Ausbruchsarten)
  const yAxis = document.createElement('div');
  yAxis.className = 'y-axis';
  yAxis.style.height = `${stageHeight}px`;
  renderer.appendChild(yAxis);

  // Y-Achse Beschriftung für die 5 Kategorien - mehr Platz für Kreise
  const categories = Object.keys(eventTypeCategories);
  const topBottomMargin = 80; // Vergrößert von 60 auf 80 für mehr Raum
  const startY = topBottomMargin;
  const endY = stageHeight - 180; // Vergrößert von 160 auf 180 für mehr Raum
  const categoryHeight = (endY - startY) / categories.length;

  categories.forEach((category, i) => {
    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.color = 'white'; // Sichtbar in VEI-Diagramm
    label.style.fontSize = '14px';
    label.style.fontWeight = 'bold';
    label.style.fontFamily = "'Kumbh Sans', sans-serif";
    label.style.transform = 'translate(0, -50%)';
    label.style.left = '20px'; // Weiter links für bessere Sichtbarkeit
    label.style.top = `${startY + i * categoryHeight + categoryHeight / 2}px`;
    label.innerText = category;
    renderer.appendChild(label);
  });

  // Y-Achse Beschriftung hinzufügen
  const yAxisLabel = document.createElement('div');
  yAxisLabel.className = 'y-axis-label';
  yAxisLabel.style.position = 'absolute';
  yAxisLabel.style.color = 'white';
  yAxisLabel.style.fontSize = '14px';
  yAxisLabel.style.fontWeight = 'bold';
  yAxisLabel.style.fontFamily = "'Kumbh Sans', sans-serif";
  yAxisLabel.style.textAlign = 'center';
  yAxisLabel.style.left = '50px';
  yAxisLabel.style.top = `${startY + (endY - startY) / 2}px`;
  yAxisLabel.style.transform = 'translateY(-50%) rotate(-90deg)';
  yAxisLabel.style.transformOrigin = 'center';
  yAxisLabel.innerText = 'Cause of eruption';
  document.body.appendChild(yAxisLabel);

  // Zeichne die Kreise für die Vulkane mit korrekter Positionierung
  // Erstelle eine Map um sicherzustellen, dass jeder Vulkan nur einmal dargestellt wird
  const uniqueVolcanoes = new Map();
  
  eruptionData.forEach((eruption) => {
    const key = `${eruption.volcano_number}_${eruption.volcano_name}`;
    if (!uniqueVolcanoes.has(key)) {
      uniqueVolcanoes.set(key, eruption);
    }
  });
  
  console.log(`Drawing ${uniqueVolcanoes.size} unique volcanoes out of ${eruptionData.length} total entries`);
  
  // Zeige die Verteilung der Ausbruchszahlen
  const eruptionCounts = Array.from(uniqueVolcanoes.values()).map(e => e.eruptions.length);
  const minEruptions = Math.min(...eruptionCounts);
  const maxEruptions = Math.max(...eruptionCounts);
  console.log(`Eruption counts range: ${minEruptions} to ${maxEruptions} eruptions`);
  console.log(`Circle sizes will range: 8px to 40px based on eruption frequency`);
  
  uniqueVolcanoes.forEach((eruption) => {
    const circle = document.createElement('div');
    circle.className = 'circle';

    // Berechnung der Größe des Kreises basierend auf der Anzahl der Ausbrüche
    const eruptionCount = eruption.eruptions.length;
    const minEruptions = Math.min(...eruptionData.map(e => e.eruptions.length));
    const maxEruptions = Math.max(...eruptionData.map(e => e.eruptions.length));
    const normalizedEruptionCount = (eruptionCount - minEruptions) / (maxEruptions - minEruptions);
    
    // Größerer Größenunterschied: 8px bis 40px (mehr Unterschied sichtbar)
    const circleSize = Math.max(8 + normalizedEruptionCount * 32, 12); // 8px bis 40px
    circle.style.width = `${circleSize}px`;
    circle.style.height = `${circleSize}px`;
    circle.style.borderRadius = '50%';
    
    // Debug: Log für Größenbeziehung (entferne später)
    if (Math.random() < 0.1) { // Nur 10% der Kreise loggen, um Spam zu vermeiden
      console.log(`Volcano: ${eruption.volcano_name}, Eruptions: ${eruptionCount}, Circle size: ${circleSize}px`);
    }

    // X-Position basierend auf exaktem VEI-Wert (0-7) - mit ausreichend Platz
    const vei = Math.max(0, Math.min(7, eruption.vei_average)); // Begrenze VEI auf 0-7, aber verwende exakte Werte
    const sideMargin = 180; // Zurück zum ursprünglichen Wert
    const startX = sideMargin;
    const endX = stageWidth - sideMargin; // Gleichmäßige Ränder
    const veiWidth = endX - startX;
    let xPosition = startX + (vei / 7) * veiWidth - circleSize / 2;
    
    // Bestimme die Kategorie des Event Types basierend auf dem häufigsten Event Type
    const eventTypeCounts = {};
    eruption.events?.forEach(event => {
      const eventType = event.event_type || 'Unknown';
      eventTypeCounts[eventType] = (eventTypeCounts[eventType] || 0) + 1;
    });
    
    // Finde den häufigsten Event Type
    let mostCommonEventType = 'Unknown';
    let maxCount = 0;
    Object.entries(eventTypeCounts).forEach(([eventType, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonEventType = eventType;
      }
    });
    
    const eventCategory = getEventCategory(mostCommonEventType);
    const categoryIndex = categories.indexOf(eventCategory);
    
    // Y-Position basierend auf der Event-Type-Kategorie - mehr Platz zwischen Kategorien
    const topBottomMargin = 80; // Aktualisiert auf gleichen Wert wie oben
    const startY = topBottomMargin;
    const endY = stageHeight - 180; // Aktualisiert auf gleichen Wert wie oben
    const categoryHeight = (endY - startY) / categories.length;
    const baseCategoryY = startY + categoryIndex * categoryHeight + categoryHeight / 2;
    
    // Füge größere zufällige Verschiebung hinzu für mehr Abstand zwischen Kreisen
    const randomOffsetX = (Math.random() - 0.5) * 120; // Vergrößert von 40 auf 120
    const randomOffsetY = (Math.random() - 0.5) * (categoryHeight * 0.8); // Vergrößert von 0.4 auf 0.8
    
    xPosition += randomOffsetX;
    let yPosition = baseCategoryY + randomOffsetY - circleSize / 2;
    
    // Stelle sicher, dass der Kreis im sichtbaren Bereich bleibt
    xPosition = Math.max(startX, Math.min(xPosition, endX - circleSize));
    yPosition = Math.max(startY, Math.min(yPosition, endY - circleSize));

    circle.style.left = `${xPosition}px`;
    circle.style.top = `${yPosition}px`;

    // Standardfarbe (Gelb-Orange basierend auf VEI) - custom colors
    const normalizedColor = Math.max(0, Math.min(1, eruption.vei_average / 7));
    
    // Custom hex colors: Yellow #DDBB3E (221, 187, 62) to Orange #C13F13 (193, 63, 19)
    const yellowRGB = { r: 221, g: 187, b: 62 };
    const orangeRGB = { r: 193, g: 63, b: 19 };
    
    // Interpolate between yellow and orange based on VEI
    const red = Math.round(yellowRGB.r + (orangeRGB.r - yellowRGB.r) * normalizedColor);
    const green = Math.round(yellowRGB.g + (orangeRGB.g - yellowRGB.g) * normalizedColor);
    const blue = Math.round(yellowRGB.b + (orangeRGB.b - yellowRGB.b) * normalizedColor);
    
    const originalColor = `rgb(${red}, ${green}, ${blue})`;
    circle.style.backgroundColor = originalColor;
    circle.style.opacity = '0.4'; // Füge Transparenz hinzu

    // Event-Type-Daten und ursprüngliche Werte speichern
    circle.dataset.eventType = eventCategory;
    circle.dataset.originalEventType = mostCommonEventType;
    circle.dataset.originalColor = originalColor;
    circle.dataset.originalWidth = `${circleSize}px`;
    circle.dataset.originalHeight = `${circleSize}px`;
    circle.dataset.volcanoName = eruption.volcano_name;
    circle.dataset.vei = eruption.vei_average; // Verwende exakten VEI-Wert
    
    // Speichere ursprüngliche Position für Reset-Funktion
    circle.dataset.originalX = xPosition;
    circle.dataset.originalY = yPosition;

    // Detaillierter Hover-Tooltip erstellen
    const hoverTooltip = document.createElement('div');
    hoverTooltip.style.position = 'absolute';
    hoverTooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    hoverTooltip.style.color = 'white';
    hoverTooltip.style.padding = '12px';
    hoverTooltip.style.borderRadius = '8px';
    hoverTooltip.style.fontSize = '12px';
    hoverTooltip.style.pointerEvents = 'none';
    hoverTooltip.style.zIndex = '9999';
    hoverTooltip.style.display = 'none';
    hoverTooltip.style.maxWidth = '220px';
    hoverTooltip.style.border = '1px solid rgba(255, 255, 255, 0.3)';
    hoverTooltip.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
    hoverTooltip.style.lineHeight = '1.4';

    // Event-Listener für Hover-Effekt
    circle.addEventListener('mouseenter', (e) => {
      // Vergrößere den Kreis beim Hover - etwas subtiler
      circle.style.transform = 'scale(1.2)';
      circle.style.zIndex = '1000';
      circle.style.transition = 'transform 0.2s ease-out';
      
      // Finde das entsprechende Vulkan-Objekt für Country-Information
      const volcanoInfo = vulcanoData.find(v => v.volcano_name === eruption.volcano_name);
      const volcanoCountry = volcanoInfo ? volcanoInfo.country : 'Unknown';
      
      // Create tooltip content based on current mode (normal or sorted)
      if (isGridMode) {
        // Calculate the last eruption date
        let lastEruptionDate = 'Unknown';
        if (eruption.eruptions && eruption.eruptions.length > 0) {
          const lastEruption = eruption.eruptions.reduce((latest, current) => {
            const currentEnd = current.end_year || current.start_year;
            const latestEnd = latest.end_year || latest.start_year;
            return currentEnd > latestEnd ? current : latest;
          });
          lastEruptionDate = lastEruption.end_year || lastEruption.start_year || 'Unknown';
          // Replace "NA" with "Unknown"
          if (lastEruptionDate === 'NA') {
            lastEruptionDate = 'Unknown';
          }
        }
        
        // In sorted mode: show eruptions count and last eruption date
        hoverTooltip.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 8px; color: #C13F13; font-size: 14px;">${eruption.volcano_name}</div>
          <div style="margin-bottom: 6px; color: white; font-style: italic;">
            ${volcanoCountry}
          </div>
          <div style="margin-bottom: 4px; color: white;"><strong>Total Eruptions:</strong> ${eruptionCount}</div>
          <div style="margin-bottom: 4px; color: white;"><strong>Last Eruption:</strong> ${lastEruptionDate}</div>
          <div style="margin-bottom: 4px; color: white;"><strong>Average VEI:</strong> ${eruption.vei_average}</div>
        `;
      } else {
        // In normal mode: show event type instead of eruption count
        hoverTooltip.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 8px; color: #C13F13; font-size: 14px;">${eruption.volcano_name}</div>
          <div style="margin-bottom: 6px; color: white; font-style: italic;">
            ${volcanoCountry}
          </div>
          <div style="margin-bottom: 4px; color: white;"><strong>Average VEI:</strong> ${eruption.vei_average}</div>
          <div style="margin-bottom: 4px; color: white;"><strong>Most Common Event Type:</strong> ${mostCommonEventType}</div>
        `;
      }
      
      // Positioniere Tooltip rechts neben dem Kreis
      const rect = circle.getBoundingClientRect();
      const tooltipWidth = 220; // Reduced width for simpler content
      const tooltipHeight = isGridMode ? 140 : 120; // Larger height for frequency mode with extra line
      
      // Berechne Position rechts vom Kreis
      let left = rect.right + 15; // 15px Abstand vom Kreis
      let top = rect.top + (rect.height / 2) - (tooltipHeight / 2); // Vertikal zentriert zum Kreis
      
      // Prüfe, ob der Tooltip über den rechten Bildschirmrand hinausgeht
      if (left + tooltipWidth > window.innerWidth) {
        // Wenn nicht genug Platz rechts, zeige links vom Kreis
        left = rect.left - tooltipWidth - 15;
      }
      
      // Prüfe vertikale Grenzen
      if (top < 10) top = 10;
      if (top + tooltipHeight > window.innerHeight) {
        top = window.innerHeight - tooltipHeight - 10;
      }
      
      hoverTooltip.style.left = `${left}px`;
      hoverTooltip.style.top = `${top}px`;
      hoverTooltip.style.display = 'block';
      document.body.appendChild(hoverTooltip);
    });

    circle.addEventListener('mouseleave', () => {
      // Setze den Kreis zurück
      circle.style.transform = 'scale(1)';
      circle.style.zIndex = '1';
      
      // Entferne Tooltip
      if (hoverTooltip.parentNode) {
        hoverTooltip.parentNode.removeChild(hoverTooltip);
      }
    });

    circle.style.position = 'absolute';
    renderer.appendChild(circle);
  });

  // Event-Listener für Sort-Button
  sortButton.addEventListener('click', () => {
    const circles = document.querySelectorAll('.circle');
    
    if (!isGridMode) {
      // Blende VEI-Achsenlabels und Ausbruchsarten-Labels aus
      const veiLabels = document.querySelectorAll('.vei-label');
      veiLabels.forEach(label => {
        label.style.display = 'none';
      });
      
      // Blende X- und Y-Achsenbeschriftungen aus
      const xAxisLabels = document.querySelectorAll('.x-axis-label');
      xAxisLabels.forEach(label => {
        label.style.display = 'none';
      });
      
      const yAxisTitleLabels = document.querySelectorAll('.y-axis-label');
      yAxisTitleLabels.forEach(label => {
        label.style.display = 'none';
      });
      
      const minorLabels = document.querySelectorAll('.axis-label-minor');
      minorLabels.forEach(label => {
        label.style.display = 'none';
      });
      
      // Zeige Vulkan-Nummern-Labels (1, 182)
      const volcanoNumberLabels = document.querySelectorAll('.volcano-number-label');
      volcanoNumberLabels.forEach(label => {
        label.style.display = 'block';
      });
      
      // Blende Y-Achse Kategorie-Labels aus (Event Type Categories)
      const yAxisLabels = document.querySelectorAll('.y-axis div');
      yAxisLabels.forEach(label => {
        label.style.display = 'none';
      });
      
      // Blende alle Event Type Category Labels aus, die direkt im Renderer erstellt wurden
      const eventTypeLabels = renderer.querySelectorAll('div');
      eventTypeLabels.forEach(label => {
        // Prüfe ob es ein Event Type Label ist (enthält einen der Kategorie-Namen)
        if (label.innerText && 
            (label.innerText === 'Scoria' || 
             label.innerText === 'Pyroclastic' || 
             label.innerText === 'Effusive' || 
             label.innerText === 'Unknown' || 
             label.innerText === 'Explosive') &&
            label.style.position === 'absolute' &&
            label.style.left === '20px') {
          label.style.display = 'none';
        }
      });
      
      // Sammle alle Vulkane mit ihrer Ausbruchshäufigkeit
      const volcanoData = [];
      circles.forEach(circle => {
        const volcanoName = circle.dataset.volcanoName;
        const volcano = eruptionData.find(v => v.volcano_name === volcanoName);
        if (volcano) {
          volcanoData.push({
            circle: circle,
            eruptionCount: volcano.eruptions.length,
            volcanoName: volcanoName
          });
        }
      });
      
      // Sortiere nach Ausbruchshäufigkeit (absteigend)
      volcanoData.sort((a, b) => b.eruptionCount - a.eruptionCount);
      
      // Gruppiere nach Ausbruchshäufigkeit
      const frequencyGroups = {};
      volcanoData.forEach(volcano => {
        const count = volcano.eruptionCount;
        if (!frequencyGroups[count]) {
          frequencyGroups[count] = [];
        }
        frequencyGroups[count].push(volcano);
      });
      
      // Berechne Trauben-Layout
      const sortedFrequencies = Object.keys(frequencyGroups).map(Number).sort((a, b) => a - b);
      const totalGroups = sortedFrequencies.length;
      
      // Layout-Parameter für die Traube
      const grapeWidth = stageWidth - 400; // Platz für UI-Elemente
      const grapeHeight = stageHeight - 200; // Platz für Titel und Achsen
      const grapeStartX = 200; // Startposition links
      const grapeStartY = 100; // Startposition oben
      
      let currentX = grapeStartX;
      
      sortedFrequencies.forEach((frequency, groupIndex) => {
        const group = frequencyGroups[frequency];
        const groupSize = group.length;
        
        // X-Position für diese Häufigkeitsgruppe (von links nach rechts)
        const groupX = grapeStartX + (groupIndex / (totalGroups - 1)) * grapeWidth;
        
        // Berechne Y-Positionen für Vulkane in dieser Gruppe (vertikal gestapelt)
        const circleSpacing = 50; // Mindestabstand zwischen Kreisen
        const groupHeight = Math.min(groupSize * circleSpacing, grapeHeight);
        const startY = grapeStartY + (grapeHeight - groupHeight) / 2; // Zentriert vertikal
        
        group.forEach((volcano, index) => {
          const circle = volcano.circle;
          const circleSize = parseInt(circle.style.width) || 20;
          
          // Y-Position: gleichmäßig verteilt innerhalb der Gruppe
          let targetY;
          if (groupSize === 1) {
            // Einzelner Vulkan: zentriert
            targetY = grapeStartY + grapeHeight / 2 - circleSize / 2;
          } else {
            // Mehrere Vulkane: gleichmäßig verteilt
            const spacing = Math.min(circleSpacing, grapeHeight / groupSize);
            targetY = startY + index * spacing;
          }
          
          // X-Position: zentriert um die Gruppen-X-Position mit leichter Streuung
          const randomOffsetX = (Math.random() - 0.5) * 30; // Kleine zufällige Streuung
          const targetX = groupX + randomOffsetX - circleSize / 2;
          
          // Stelle sicher, dass Kreise im sichtbaren Bereich bleiben
          const finalX = Math.max(grapeStartX, Math.min(targetX, grapeStartX + grapeWidth - circleSize));
          const finalY = Math.max(grapeStartY, Math.min(targetY, grapeStartY + grapeHeight - circleSize));
          
          // Animiere zur Zielposition
          circle.style.transition = 'left 1.2s ease-in-out, top 1.2s ease-in-out';
          circle.style.left = `${finalX}px`;
          circle.style.top = `${finalY}px`;
        });
      });
      
      // Zeige Frequenz-Labels - entzerrte Beschriftung
      const maxFrequency = Math.max(...sortedFrequencies);
      const minFrequency = Math.min(...sortedFrequencies);
      
      // Bestimme intelligente Tick-Intervalle basierend auf dem Frequenzbereich
      let tickInterval;
      const range = maxFrequency - minFrequency;
      if (range <= 10) {
        tickInterval = 1;
      } else if (range <= 50) {
        tickInterval = 5;
      } else if (range <= 100) {
        tickInterval = 10;
      } else {
        tickInterval = 20;
      }
      
      const startTick = Math.ceil(minFrequency / tickInterval) * tickInterval;
      const endTick = Math.floor(maxFrequency / tickInterval) * tickInterval;
      
      // Zeige Ticks/Linien für Ausbruchszahlen
      for (let tickValue = startTick; tickValue <= endTick; tickValue += tickInterval) {
        // Finde die Position basierend auf dem Frequenzwert (umgekehrt: niedrige Zahlen links, hohe rechts)
        const tickPosition = grapeStartX + ((tickValue - minFrequency) / (maxFrequency - minFrequency)) * grapeWidth;
        
        // Erstelle die Tick-Linie
        const tickLine = document.createElement('div');
        tickLine.className = 'frequency-tick';
        tickLine.style.position = 'absolute';
        tickLine.style.left = `${tickPosition}px`;
        tickLine.style.top = `${grapeStartY + grapeHeight + 10}px`;
        tickLine.style.width = '2px';
        tickLine.style.height = '10px';
        tickLine.style.backgroundColor = 'white';
        renderer.appendChild(tickLine);
        
        // Erstelle das Tick-Label für Ausbruchszahlen
        const tickLabel = document.createElement('div');
        tickLabel.className = 'frequency-label';
        tickLabel.style.position = 'absolute';
        tickLabel.style.left = `${tickPosition - 15}px`;
        tickLabel.style.top = `${grapeStartY + grapeHeight + 25}px`;
        tickLabel.style.color = 'white';
        tickLabel.style.fontSize = '11px';
        tickLabel.style.fontWeight = 'bold';
        tickLabel.style.textAlign = 'center';
        tickLabel.style.width = '30px';
        tickLabel.innerText = `${tickValue}`;
        renderer.appendChild(tickLabel);
      }
      
      // Zusätzlich zeige die Min/Max-Werte falls sie nicht durch 5 teilbar sind
      if (minFrequency % tickInterval !== 0) {
        const minPosition = grapeStartX + grapeWidth;
        const minLabel = document.createElement('div');
        minLabel.className = 'frequency-label';
        minLabel.style.position = 'absolute';
        minLabel.style.left = `${minPosition - 15}px`;
        minLabel.style.top = `${grapeStartY + grapeHeight + 25}px`;
        minLabel.style.color = 'rgba(255, 255, 255, 0.7)';
        minLabel.style.fontSize = '10px';
        minLabel.style.fontWeight = 'normal';
        minLabel.style.textAlign = 'center';
        minLabel.style.width = '30px';
        minLabel.innerText = `${minFrequency}`;
        renderer.appendChild(minLabel);
      }
      
      if (maxFrequency % tickInterval !== 0) {
        const maxPosition = grapeStartX;
        const maxLabel = document.createElement('div');
        maxLabel.className = 'frequency-label';
        maxLabel.style.position = 'absolute';
        maxLabel.style.left = `${maxPosition - 15}px`;
        maxLabel.style.top = `${grapeStartY + grapeHeight + 25}px`;
        maxLabel.style.color = 'rgba(255, 255, 255, 0.7)';
        maxLabel.style.fontSize = '10px';
        maxLabel.style.fontWeight = 'normal';
        maxLabel.style.textAlign = 'center';
        maxLabel.style.width = '30px';
        maxLabel.innerText = `${maxFrequency}`;
        renderer.appendChild(maxLabel);
      }
      
      // Erstelle Häufigkeits-Achse
      const axisLine = document.createElement('div');
      axisLine.style.position = 'absolute';
      axisLine.style.left = `${grapeStartX}px`;
      axisLine.style.top = `${grapeStartY + grapeHeight + 10}px`;
      axisLine.style.width = `${grapeWidth}px`;
      axisLine.style.height = '2px';
      axisLine.style.backgroundColor = 'white';
      renderer.appendChild(axisLine);
      
      // Achsenbeschriftung
      const axisLabel = document.createElement('div');
      axisLabel.className = 'frequency-axis-label';
      axisLabel.style.position = 'absolute';
      axisLabel.style.left = `${grapeStartX + grapeWidth / 2}px`;
      axisLabel.style.top = `${grapeStartY + grapeHeight + 60}px`;
      axisLabel.style.color = 'white';
      axisLabel.style.fontSize = '14px';
      axisLabel.style.fontWeight = 'bold';
      axisLabel.style.textAlign = 'center';
      axisLabel.style.transform = 'translateX(-50%)';
      axisLabel.innerText = 'number of eruptions';
      renderer.appendChild(axisLabel);
      
      sortButton.innerText = 'Reset Position';
      isGridMode = true;
    } else {
      // Zeige VEI-Achsenlabels wieder an, verstecke Vulkan-Nummern-Labels
      const veiLabels = document.querySelectorAll('.vei-label');
      veiLabels.forEach(label => {
        label.style.display = 'block';
      });
      
      // Zeige X- und Y-Achsenbeschriftungen wieder an
      const xAxisLabels = document.querySelectorAll('.x-axis-label');
      xAxisLabels.forEach(label => {
        label.style.display = 'block';
      });
      
      const yAxisTitleLabels = document.querySelectorAll('.y-axis-label');
      yAxisTitleLabels.forEach(label => {
        label.style.display = 'block';
      });
      
      const minorLabels = document.querySelectorAll('.axis-label-minor');
      minorLabels.forEach(label => {
        label.style.display = 'block';
      });
      
      // Verstecke Vulkan-Nummern-Labels (1, 182)
      const volcanoNumberLabels = document.querySelectorAll('.volcano-number-label');
      volcanoNumberLabels.forEach(label => {
        label.style.display = 'none';
      });
      
      // Zeige Y-Achse Kategorie-Labels wieder an
      const yAxisLabels = document.querySelectorAll('.y-axis div');
      yAxisLabels.forEach(label => {
        label.style.display = 'block';
      });
      
      // Zeige alle Event Type Category Labels wieder an
      const eventTypeLabels = renderer.querySelectorAll('div');
      eventTypeLabels.forEach(label => {
        // Prüfe ob es ein Event Type Label ist (enthält einen der Kategorie-Namen)
        if (label.innerText && 
            (label.innerText === 'Scoria' || 
             label.innerText === 'Pyroclastic' || 
             label.innerText === 'Effusive' || 
             label.innerText === 'Unknown' || 
             label.innerText === 'Explosive') &&
            label.style.position === 'absolute' &&
            label.style.left === '20px') {
          label.style.display = 'block';
        }
      });
      
      // Zurück zur ursprünglichen Position
      circles.forEach(circle => {
        const originalX = circle.dataset.originalX;
        const originalY = circle.dataset.originalY;
        
        circle.style.transition = 'left 1s ease-in-out, top 1s ease-in-out';
        circle.style.left = `${originalX}px`;
        circle.style.top = `${originalY}px`;
      });
      
      // Entferne Frequenz-Labels, Ticks und Achse
      const frequencyLabels = document.querySelectorAll('.frequency-label, .frequency-axis-label, .frequency-tick');
      frequencyLabels.forEach(label => {
        if (label.parentNode) {
          label.parentNode.removeChild(label);
        }
      });
      
      // Entferne Achsenlinie
      const axisLines = document.querySelectorAll('div[style*="background-color: white"][style*="height: 2px"]');
      axisLines.forEach(line => {
        if (line.parentNode === renderer) {
          line.parentNode.removeChild(line);
        }
      });
      
      sortButton.innerText = 'Sort by eruption frequency';
      isGridMode = false;
    }
  });

  // console.log('Diagram with VEI and event type categories axes drawn');
}

