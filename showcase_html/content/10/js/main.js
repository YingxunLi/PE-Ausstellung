let stageHeight;
let stageWidth;
let renderer;
let groupedData;
let tenGroup = [];

let viewModeColor = 'gender';
let viewModeRings = 'age';

const ringThicknessRatio = 0.7;
const ringSpacingRatio = 1 - ringThicknessRatio;

init();

function init() {
  renderer = document.querySelector('#renderer');
  stageWidth = renderer.clientWidth;
  stageHeight = renderer.clientHeight;

  // Anfangswerte
  viewModeColor = 'gender';
  viewModeRings = 'age';

  // Farbmodus-Wechsel mit Toggle
  document.querySelectorAll('input[name="viewModeColor"]').forEach(radio => {
    radio.addEventListener('click', () => {
      if (radio.value === viewModeColor) {
        radio.checked = false;
        viewModeColor = 'none';
      } else {
        viewModeColor = radio.value;
      }

      prepareData();
      drawDiagram();
    });
  });

  // Ringmodus-Wechsel mit Toggle
  document.querySelectorAll('input[name="viewModeRings"]').forEach(radio => {
    radio.addEventListener('click', () => {
      if (radio.value === viewModeRings) {
        radio.checked = false;
        viewModeRings = 'none';
      } else {
        viewModeRings = radio.value;
      }

      prepareData();
      drawDiagram();
    });
  });

  // Initialer Aufbau
  prepareData();
  drawDiagram();
}


function prepareData() {
  tenGroup = [];

  const groupKey =
    viewModeColor === 'gender'
      ? 'Gender'
      : viewModeColor === 'suizid'
        ? 'Have you ever had suicidal thoughts ?'
        : 'Family History of Mental Illness';

  const filteredData = data.filter(person => {
    person.Gender = person.Gender?.toLowerCase();
    person.Suizid = person["Have you ever had suicidal thoughts ?"]?.toLowerCase();
    person.Familie = person["Family History of Mental Illness"]?.toLowerCase();

    // 🟡 Wenn kein Ringmodus: alle in eine Gruppe
    if (viewModeRings === 'none') {
      person.ageGroup = 'all';
      return true;
    }

    // 📦 Bisherige Ring-Modi bleiben wie gehabt:
    if (viewModeRings === 'studyhours') {
      let hoursRaw = person["Work/Study Hours"];
      if (typeof hoursRaw === "string") {
        hoursRaw = hoursRaw.trim().replace(",", ".");
      }
      const hours = parseFloat(hoursRaw);
      if (!isNaN(hours) && hours >= 0 && hours <= 12) {
        person.ageGroup = `${Math.floor(hours)}h`;
        return true;
      }
      return false;

    } else if (viewModeRings === 'financial') {
      const stressRaw = person["Financial Stress"];
      const stress = parseInt(stressRaw);
      if (!isNaN(stress) && stress >= 0 && stress <= 5) {
        person.ageGroup = `Stress ${stress}`;
        return true;
      }
      return false;

    } else if (viewModeRings === 'cgpa') {
      let cgpaRaw = person.CGPA;
      if (typeof cgpaRaw === "string") {
        cgpaRaw = cgpaRaw.trim().replace(",", ".");
      }
      const cgpa = parseFloat(cgpaRaw);
      if (!isNaN(cgpa) && cgpa >= 0 && cgpa < 10) {
        const lower = Math.floor(cgpa);
        person.ageGroup = `${lower}-${lower + 1}`;
        return true;
      } else if (cgpa === 10) {
        person.ageGroup = '9-10';
        return true;
      }
      return false;

    } else {
      const age = parseInt(person.Age);
      if (!isNaN(age) && age >= 10) {
        if (age < 18) {
          person.ageGroup = '<18';
        } else {
          const start = Math.floor((age - 18) / 2) * 2 + 18;
          const end = start + 1;
          person.ageGroup = start > 35 ? null : `${start}-${end}`;
        }
        return person.ageGroup !== null;
      }
      return false;
    }
  });

  groupedData = gmynd.groupData(filteredData, ['ageGroup', groupKey, 'Depression']);

  for (let ageGroup in groupedData) {
    for (let key in groupedData[ageGroup]) {
      for (let depression in groupedData[ageGroup][key]) {
        const persons = groupedData[ageGroup][key][depression];
        const count = persons.length;
        const points = Math.max(1, Math.floor(count / 10));

        for (let i = 0; i < points; i++) {
          tenGroup.push({
            ageGroup: ageGroup,
            group: key?.toLowerCase() ?? 'unbekannt',
            depression: depression,
            person: persons[0]
          });
        }
      }
    }
  }
}

function drawDiagram() {
  const diagramContainer = document.querySelector('#diagram-container');
  diagramContainer.innerHTML = '';

  const centerX = stageWidth / 2;
  const centerY = stageHeight / 2;
  const innerGap = 40;
  const dotRadius = 8.5;
  const dotDiameter = dotRadius * 2;
  const spacingFactor = (viewModeRings === 'none') ? 2.0 : 1.2;

  const sortedAgeGroups = getSortedAgeGroups(tenGroup);
  const totalGroups = sortedAgeGroups.length;
  const scaleFactor = 0.87;
  const maxRadius = Math.min(stageWidth, stageHeight) / 2 * scaleFactor;
  const radiusStep = (maxRadius + 10 * totalGroups * (totalGroups - 1) / 2) / totalGroups;

  if (viewModeRings === 'none') {
    const rMin = innerGap;
    const rMax = maxRadius;
    const segments = {};

    tenGroup.forEach(point => {
      const group = viewModeColor === 'none' ? 'neutral' : point.group;
      const key = `${group}-${point.depression}`;
      if (!segments[key]) segments[key] = [];
      segments[key].push(point);
    });

    Object.entries(segments).forEach(([key, points]) => {
      const [group, depression] = key.split('-');
      const [angleStart, angleEnd] = getAngleRange(group, depression);

      const coords = generateSegmentRingGrid(
        centerX, centerY,
        rMin, rMax,
        angleStart, angleEnd,
        dotRadius, spacingFactor,
        points.length
      );

      const axisPadding = 12;
      const filteredCoords = coords.filter(([x, y]) => {
        const dx = Math.abs(x - centerX);
        const dy = Math.abs(y - centerY);

        const isTooCloseToVertical = dx < axisPadding;
        const isTooCloseToHorizontal = dy < axisPadding;

        if (isTooCloseToVertical) return false;
        if (viewModeColor !== 'none' && isTooCloseToHorizontal) return false;

        return true;
      });

      const limitedPoints = points.slice(0, filteredCoords.length);
      limitedPoints.forEach((point, i) => {
        const pos = filteredCoords[i];
        if (!pos) return;
        const dot = createDotElement(point, pos[0] - dotRadius, pos[1] - dotRadius);
        diagramContainer.appendChild(dot);
      });
    });

    drawHoverSegments(sortedAgeGroups, centerX, centerY, radiusStep, innerGap, 10, diagramContainer);
    drawQuarterLines(centerX, centerY, rMax, diagramContainer);
    return;
  }

  tenGroup.forEach(point => {
    const { x, y } = getDotPosition(point, sortedAgeGroups, radiusStep, centerX, centerY, 10);
    if (isNaN(x) || isNaN(y)) return;
    const dot = createDotElement(point, x, y);
    diagramContainer.appendChild(dot);
  });

  let radius = innerGap;
  let step = radiusStep;
  for (let i = 0; i < totalGroups; i++) {
    if (i > 0) step = Math.max(1, step - 10);
    radius += step;
  }

  drawRingScale(sortedAgeGroups, radiusStep, centerX, centerY, innerGap, 10, diagramContainer);
  drawQuarterLines(centerX, centerY, radius, diagramContainer);
  drawHoverSegments(sortedAgeGroups, centerX, centerY, radiusStep, innerGap, 10, diagramContainer);
}


function getSortedAgeGroups(data) {
  if (viewModeRings === 'studyhours') {
    const groups = new Set(data.map(p => p.ageGroup));
    return Array.from(groups).sort((a, b) => parseFloat(a) - parseFloat(b));
  } else if (viewModeRings === 'financial') {
    return ["Stress 0", "Stress 1", "Stress 2", "Stress 3", "Stress 4", "Stress 5"];
  } else if (viewModeRings === 'cgpa') {
    const fullRange = [];
    for (let i = 0; i < 10; i++) {
      fullRange.push(`${i}-${i + 1}`);
    }
    return fullRange;
  } else {
    const groups = new Set(data.map(p => p.ageGroup));
    return Array.from(groups).sort((a, b) => {
      if (a === '<18') return -1;
      if (b === '<18') return 1;
      const aStart = parseInt(a.split('-')[0]);
      const bStart = parseInt(b.split('-')[0]);
      return aStart - bStart;
    });
  }
}

function getDotPosition(point, sortedAgeGroups, radiusStep, centerX, centerY, decrement) {
  const group = point.group;
  const depressed = point.depression === '1';

  if (viewModeRings === 'none') {
    const [angleMinDeg, angleMaxDeg] = getAngleRange(group, point.depression);
    const angleMin = (Math.PI / 180) * angleMinDeg;
    const angleMax = (Math.PI / 180) * angleMaxDeg;

    const angle = angleMin + Math.random() * (angleMax - angleMin);
    const radius = Math.min(stageWidth, stageHeight) * 0.45 * Math.sqrt(Math.random());

    const dotOffset = 17 / 2;
    const x = centerX + radius * Math.cos(angle) - dotOffset;
    const y = centerY + radius * Math.sin(angle) - dotOffset;

    return { x, y };
  }

  const index = sortedAgeGroups.indexOf(point.ageGroup);
  if (index === -1) return { x: NaN, y: NaN };

  const innerGap = 0;
  const lineGap = 20;

  let x, y;
  let safetyCounter = 0;

  do {
    const [angleMinDeg, angleMaxDeg] = getAngleRange(group, point.depression);
    const angleMin = (Math.PI / 180) * angleMinDeg;
    const angleMax = (Math.PI / 180) * angleMaxDeg;
    const angle = angleMin + Math.random() * (angleMax - angleMin);

    let radius = innerGap;
    let currentStep = radiusStep;

    for (let i = 0; i < index; i++) {
      if (i > 0) currentStep = Math.max(1, currentStep - decrement);
      radius += currentStep;
    }

    const ringStart = radius;
    if (index > 0) currentStep = Math.max(1, currentStep - decrement);
    const ringWidth = currentStep;
    const maxRingWidth = index === sortedAgeGroups.length - 1 ? ringWidth * 0.9 : ringWidth;
    const r = ringStart + Math.random() * maxRingWidth;

    const dotOffset = 17 / 2;
    x = centerX + r * Math.cos(angle) - dotOffset;
    y = centerY + r * Math.sin(angle) - dotOffset;

    safetyCounter++;
    if (safetyCounter > 100) break;
  } while (
    Math.abs(x - centerX) < lineGap ||
    (viewModeColor !== 'none' && Math.abs(y - centerY) < lineGap)
  );

  return { x, y };
}

function createDotElement(point, x, y) {
  const dot = document.createElement('div');
  dot.classList.add('dot');
  dot.removeAttribute("title");
  dot.title = "";

  const group = point.group;
  const depressed = point.depression === '1';

  const ringKey = viewModeRings === 'none' ? 'all' : point.ageGroup;
  const groupKey = viewModeColor === 'none' ? 'neutral' : group;
  const typeString = `${ringKey}-${groupKey}-${point.depression}`;
  dot.dataset.type = typeString;

  if (viewModeColor === 'gender') {
    dot.classList.add(group.startsWith('m')
      ? (depressed ? 'male-depressed' : 'male-nondepressed')
      : (depressed ? 'female-depressed' : 'female-nondepressed'));
  } else if (viewModeColor === 'suizid') {
    dot.classList.add(group === 'yes'
      ? (depressed ? 'suizid-yes-depressed' : 'suizid-yes-nondepressed')
      : (depressed ? 'suizid-no-depressed' : 'suizid-no-nondepressed'));
  } else if (viewModeColor === 'familie') {
    dot.classList.add(group === 'yes'
      ? (depressed ? 'familie-yes-depressed' : 'familie-yes-nondepressed')
      : (depressed ? 'familie-no-depressed' : 'familie-no-nondepressed'));
  } else {
    dot.classList.add(depressed ? 'neutral-depressed' : 'neutral-nondepressed');
  }

  dot.style.left = `${x}px`;
  dot.style.top = `${y}px`;

  return dot;
}

function getAngleRange(group, depression) {
  const depressed = depression === '1';
  group = group?.toLowerCase();

  if (viewModeColor === 'gender') {
    if (group === 'male') return depressed ? [90, 180] : [0, 90];
    if (group === 'female') return depressed ? [180, 270] : [270, 360];
  } else if (viewModeColor === 'suizid' || viewModeColor === 'familie') {
    if (group === 'no') return depressed ? [90, 180] : [0, 90];
    if (group === 'yes') return depressed ? [180, 270] : [270, 360];
  }

  if (viewModeColor === 'none') {
    return depressed ? [90, 270] : [-90, 90];
  }

  return [0, 360];
}

function drawRingScale(groups, initialStep, centerX, centerY, innerGap, decrement = 10, container) {
  let radius = innerGap;
  let step = initialStep;

  groups.forEach((groupLabel, index) => {
    if (index > 0) step = Math.max(1, step - decrement);
    radius += step;

    const diameter = radius * 2;
    const ring = document.createElement('div');
    ring.classList.add('age-ring', 'ring-position');

    ring.style.setProperty('--ring-diameter', `${diameter}px`);
    ring.style.setProperty('--ring-left', `${centerX - radius}px`);
    ring.style.setProperty('--ring-top', `${centerY - radius}px`);
    ring.dataset.label = groupLabel;

    container.appendChild(ring);
  });
}

function drawQuarterLines(centerX, centerY, radius, container) {
  const vLine = document.createElement('div');
  vLine.classList.add('line-vertical');
  vLine.style.height = `${radius * 2}px`;
  vLine.style.top = `${centerY - radius}px`;
  vLine.style.left = `${centerX - 1}px`;
  container.appendChild(vLine);

  if (viewModeColor !== 'none') {
    const hLine = document.createElement('div');
    hLine.classList.add('line-horizontal');
    hLine.style.width = `${radius * 2}px`;
    hLine.style.left = `${centerX - radius}px`;
    hLine.style.top = `${centerY - 1}px`;
    container.appendChild(hLine);
  }
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = (Math.PI / 180) * angleDeg;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad)
  };
}

function createSegmentPath(cx, cy, r1, r2, startDeg, endDeg) {
  const start1 = polarToCartesian(cx, cy, r1, endDeg);
  const end1 = polarToCartesian(cx, cy, r1, startDeg);
  const start2 = polarToCartesian(cx, cy, r2, endDeg);
  const end2 = polarToCartesian(cx, cy, r2, startDeg);

  const largeArcFlag = endDeg - startDeg <= 180 ? "0" : "1";

  return `
    M ${start1.x} ${start1.y}
    A ${r1} ${r1} 0 ${largeArcFlag} 0 ${end1.x} ${end1.y}
    L ${end2.x} ${end2.y}
    A ${r2} ${r2} 0 ${largeArcFlag} 1 ${start2.x} ${start2.y}
    Z
  `.trim();
}

function drawHoverSegments(ageGroups, centerX, centerY, radiusStep, innerGap, decrement, container) {
  const groupKeys = (viewModeColor === 'gender') ? ['male', 'female'] :
                    (viewModeColor === 'suizid' || viewModeColor === 'familie') ? ['no', 'yes'] :
                    ['neutral'];
  const depressions = ['0', '1'];

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", stageWidth);
  svg.setAttribute("height", stageHeight);
  svg.style.position = "absolute";
  svg.style.left = 0;
  svg.style.top = 0;
  svg.style.pointerEvents = "auto";
  svg.style.zIndex = "10";

  const isRingMode = viewModeRings !== 'none';

  // 🔧 Neue Radiusgrenzen abhängig vom Modus
  let rGlobalStart, rGlobalEnd;

  if (isRingMode) {
    rGlobalStart = innerGap;
    rGlobalEnd = innerGap;
    let step = radiusStep;
    for (let i = 0; i < ageGroups.length; i++) {
      if (i > 0) step = Math.max(1, step - decrement);
      rGlobalEnd += step;
    }
  } else {
    rGlobalStart = innerGap;
    rGlobalEnd = Math.min(stageWidth, stageHeight) * 0.45;
  }

  const ringKeys = isRingMode ? ageGroups : ['all'];

  ringKeys.forEach((ringKey, ringIndex) => {
    groupKeys.forEach(group => {
      depressions.forEach(depression => {
        const groupKey = viewModeColor === 'none' ? 'neutral' : group;
        const dataType = `${ringKey}-${groupKey}-${depression}`;
        const [startDeg, endDeg] = getAngleRange(groupKey, depression);

        let ringStart = innerGap;
        let step = radiusStep;

        for (let i = 0; i < ringIndex; i++) {
          if (i > 0) step = Math.max(1, step - decrement);
          ringStart += step;
        }

        // 🔧 Segment-Radius für aktuellen Ring oder gesamten Kreis
        const rStartSegment = isRingMode ? ringStart : rGlobalStart;
        const rEndSegment = isRingMode ? (ringStart + step) : rGlobalEnd;

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", createSegmentPath(centerX, centerY, rStartSegment, rEndSegment, startDeg, endDeg));
        path.classList.add('segment-hover');
        path.setAttribute("data-type", dataType);
        path.style.cursor = "pointer";
        path.style.pointerEvents = "auto";

        path.addEventListener("mouseenter", () => {
          const dots = document.querySelectorAll(`.dot[data-type="${dataType}"]`);
          dots.forEach(dot => dot.classList.add('highlighted'));

          const infoBox = document.querySelector('#info-box');
          if (!infoBox) return;

          const depressionTitle = (depression === '1') ? 'Depression' : 'No depression';

          const groupLabel = viewModeColor === 'none'
            ? ''
            : {
                gender: `Gender: ${group}`,
                suizid: `Suicidal thoughts: ${group}`,
                familie: `Family mental illness: ${group}`
              }[viewModeColor] || `Group: ${group}`;

          const ringLabel = (viewModeRings === 'none') ? ''
            : (viewModeRings === 'age') ? `Age: ${ringKey}`
            : (viewModeRings === 'studyhours') ? `Study Hours: ${ringKey}`
            : (viewModeRings === 'financial') ? `Financial stress level: ${ringKey.replace('Stress ', '')}`
            : (viewModeRings === 'cgpa') ? `Academic average: ${ringKey}`
            : `Group: ${ringKey}`;

          infoBox.textContent = [
            depressionTitle,
            `${dots.length * 10} students`,
            ringLabel,
            groupLabel
          ].filter(Boolean).join('\n');

          infoBox.style.display = 'block';
        });

        path.addEventListener("mouseleave", () => {
          document.querySelectorAll('.dot.highlighted').forEach(dot => {
            dot.classList.remove('highlighted');
          });

          const infoBox = document.querySelector('#info-box');
          if (infoBox) infoBox.style.display = 'none';
        });

        svg.appendChild(path);
      });
    });
  });

  container.appendChild(svg);
}


function generateSegmentRingGrid(cx, cy, r_min, r_max, angle_start_deg, angle_end_deg, dot_radius, spacing_factor = 1.2, maxPoints = 9999) {
  const points = [];
  const spacing = dot_radius * 2 * spacing_factor;
  const angle_span = angle_end_deg - angle_start_deg;
  const ringGap = spacing;
  let r = r_min + spacing / 2;

  while (r + dot_radius <= r_max && points.length < maxPoints) {
    const arc_length = (Math.PI * r * angle_span) / 180;
    const points_on_ring = Math.max(1, Math.floor(arc_length / spacing));

    for (let i = 0; i < points_on_ring; i++) {
      const angle_deg = angle_start_deg + (i * angle_span) / points_on_ring;
      const angle_rad = (Math.PI / 180) * angle_deg;
      const x = cx + r * Math.cos(angle_rad);
      const y = cy + r * Math.sin(angle_rad);
      points.push([x, y]);
      if (points.length >= maxPoints) break;
    }

    r += ringGap;
  }

  return points;
}
