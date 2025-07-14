let stage;
let stageHeight;
let stageWidth;
let data;
let selectedYear = 2019;
let sortMode = "total"; // "Total movement", "Incoming refugees", "Outgoing refugees"
let scalingMode = "linear"; // "sqrt" oder "linear", "sqrt" aktuell nicht visuell verwendet
let selectedDataField = "Asylum-seekers"; // oder "Refugees admitted"
let top100 = [];
let maxBarLength = 38;
let segmentGap = 0;
let centerGap = 25;
let graphicsContainer;
let maxValueLogarithmic;
let maxValueLinear;
let tooltip;
let tooltipYears;

init();

function init() {
  renderer = document.querySelector("#renderer");
  stageWidth = renderer.clientWidth;
  stageHeight = renderer.clientHeight;
  renderer.width = stageWidth;
  renderer.height = stageHeight;

  graphicsContainer = document.createElement("div");
  graphicsContainer.id = "graphicsContainer";
  renderer.appendChild(graphicsContainer);

  // Tooltip für Balken
  tooltip = document.createElement("div");
  tooltip.id = "customTooltip";
  tooltip.className = "tooltip";
  tooltip.style.position = "absolute";
  tooltip.style.pointerEvents = "none";
  tooltip.style.opacity = "0";
  tooltip.style.zIndex = "99999";
  renderer.appendChild(tooltip);

  // Tooltip für Jahreszahlen
  tooltipYears = document.createElement("div");
  tooltipYears.id = "tooltipYears";
  tooltipYears.className = "tooltip-years";
  tooltipYears.style.position = "absolute";
  tooltipYears.style.pointerEvents = "none";
  tooltipYears.style.opacity = "0";
  tooltipYears.style.zIndex = "9999";
  renderer.appendChild(tooltipYears);

  prepareData();
  drawData();

  let optionsContainer = document.createElement("div");
  optionsContainer.id = "optionsContainer";
  optionsContainer.className = "options-container";
  renderer.appendChild(optionsContainer);

  let headlineContainer = document.createElement("div");
  headlineContainer.className = "title-block";
  headlineContainer.innerHTML = `
  <div class="title">Refugees</div>
  <div class="subtitle">100 countries of origin and asylum</div>`;
  optionsContainer.appendChild(headlineContainer);

  createYearSelector();
  createDataFieldToggle();
  createSortSelector();
  createGapToggle();


}

function prepareData() {
  data = refugeesPositionData;
  gmynd.deletePropsInData(data, [
    "Unnamed: 0",
    "IDPs of concern to UNHCR",
    "Returned IDPss",
    "Stateless persons",
    "Others of concern",
    "Other people in need of international protection",
    "Host Community",
  ]);

  let filtered = gmynd.findAllByValue(data, "Year", selectedYear).filter(d =>
    d["Country of asylum"] !== "Unknown" && d["Country of origin"] !== "Unknown" && d["Refugees under UNHCR's mandate"] !== 0 && d["Asylum-seekers"] !== 0
  );


  let asylumStats = gmynd.cumulateData(
    filtered,
    ["Country of asylum"],
    [{ value: selectedDataField, method: "Sum", title: "incoming" }]
  );

  let originStats = gmynd.cumulateData(
    filtered,
    ["Country of origin"],
    [{ value: selectedDataField, method: "Sum", title: "outgoing" }]
  );


  let merged = gmynd.mergeData(asylumStats, originStats, "Country of asylum", "Country of origin");

  const filter = data.filter((el) => el.Year == 2019 && el["Country of asylum"] == "Germany");

  merged.forEach((d) => {
    d.total = (d.incoming || 0) + (d.outgoing || 0);
  });

  merged = merged.filter(d =>
    d["Country of asylum"] !== "Unknown" &&
    d["Code of asylum"] !== "UNK"
  );

  // Sortieren
  if (sortMode === "total") {
    merged.sort((a, b) => (b.total || 0) - (a.total || 0));
  } else if (sortMode === "incoming") {
    merged.sort((a, b) => (b.incoming || 0) - (a.incoming || 0));
  } else if (sortMode === "outgoing") {
    merged.sort((a, b) => (b.outgoing || 0) - (a.outgoing || 0));
  }


  top100 = merged.slice(0, 100);

  top100.forEach((country) => {
    const incomingCountries = filtered.filter(
      (el) => el["Country of asylum"] === country["Country of asylum"]
    );
    country.incomingCountries = incomingCountries;

    const outgoingCountries = filtered.filter(
      (el) => el["Country of origin"] === country["Country of asylum"]
    );
    country.outgoingCountries = outgoingCountries;

    // bereits vorberechnete Gruppen speichern
    country.incomingGroups = gmynd.cumulateData(
      incomingCountries,
      ["Country of origin"],
      [{ value: selectedDataField, method: "Sum", title: "count" }]
    );

    country.outgoingGroups = gmynd.cumulateData(
      outgoingCountries,
      ["Country of asylum"],
      [{ value: selectedDataField, method: "Sum", title: "count" }]
    );
  });


}


let allCounts = [];

top100.forEach((country) => {
  country.incomingCountries.forEach((entry) => {
    if (entry[selectedDataField]) allCounts.push(entry[selectedDataField]);
  });
  country.outgoingCountries.forEach((entry) => {
    if (entry[selectedDataField]) allCounts.push(entry[selectedDataField]);
  });
});

maxValueLogarithmic = Math.max(...allCounts);

function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => deg * (Math.PI / 180);

  const R = 6371; // Erdradius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}



function drawData() {
  graphicsContainer.innerHTML = "";
  tooltip.style.opacity = "0";

  let rowGap = 2.5;
  let verticalPadding = 3; // Abstand oben und unten
  let usableHeight = stageHeight - 2 * verticalPadding;
  let lineHeight = usableHeight / top100.length;
  let barHeight = lineHeight - rowGap;
  let rowHeight = barHeight + rowGap;


  let maxValue;

  if (scalingMode === "sqrt") {
    maxValue = maxValueLogarithmic;
  } else {
    if (sortMode === "total") {
      maxValue = top100[0].total;
    } else if (sortMode === "incoming") {
      maxValue = top100[0].incoming;
    } else if (sortMode === "outgoing") {
      maxValue = top100[0].outgoing;
    }
  }


  top100.forEach((d, i) => {
    const countryName = d["Country of asylum"];
    const countryCode = d["Code of asylum"] || countryName.slice(0, 3).toUpperCase();

    let row = document.createElement("div");
    row.dataset.country = countryName;
    row.classList.add("country-row");

    Object.assign(row.style, {
      position: "absolute",
      top: i * rowHeight + verticalPadding + "px",
      height: barHeight + "px",
      width: "100%",
    });

    graphicsContainer.append(row);


    // Länderkürzel in der Mitte
    let midLabel = document.createElement("div");
    midLabel.className = "mid-label";
    midLabel.textContent = countryCode;
    row.appendChild(midLabel);

    row.addEventListener("mouseenter", () => {
      midLabel.style.opacity = 1;
    });
    row.addEventListener("mouseleave", () => {
      midLabel.style.opacity = 0;
    });


    // --- INCOMING ---
    let xOffsetIn = 0;
    let incomingGroups = gmynd.cumulateData(
      d.incomingCountries,
      ["Country of origin"],
      [{ value: selectedDataField, method: "Sum", title: "count" }]
    );


    const sum = gmynd.dataSum(incomingGroups, "count");

    incomingGroups.sort((a, b) => b.count - a.count);

    incomingGroups.forEach((entry) => {
      let count = entry.count || 0;
      let scaled = scalingMode === "sqrt" ? Math.sqrt(count) : count;
      let maxRef = scalingMode === "sqrt" ? Math.sqrt(maxValue) : maxValue;

      let length = gmynd.map(scaled, 0, maxRef, 0, scalingMode === "sqrt" ? maxBarLength : (stageWidth / 2 - centerGap / 2));

      let minLightness = segmentGap > 0 ? 0.30 : 0.29; // Helligkeit einstellen kleine Segmente
      let lightness = Math.max(minLightness, Math.min(length, 1));



      const segmentWidth = Math.max(length, 1);
      const incomingLeft = stageWidth / 2 - xOffsetIn - segmentWidth - centerGap / 2;

      // Distanz berechnen
      let dist = null;

      if (segmentGap === 5) {
        const originEntry = data.find(
          (c) => c["Country of origin"] === entry["Country of origin"] &&
            c["Country of asylum"] === countryName &&
            c.Year === selectedYear
        );

        if (originEntry) {
          dist = getHaversineDistance(
            originEntry.origin_latitude,
            originEntry.origin_longitude,
            originEntry.asylum_latitude,
            originEntry.asylum_longitude
          );
        }
      }

      const isSmallIncoming = lightness < 0.3;

      const bgColor =
        segmentGap > 0 && dist !== null
          ? getIncomingColorByDistance(dist, lightness)
          : adjustLightness("#789dff", lightness);


      let segment = document.createElement("div");
      segment.style.backgroundColor = bgColor;
      segment.style.width = segmentWidth + "px";
      segment.style.height = "100%";
      segment.style.position = "absolute";
      segment.style.left = incomingLeft + "px";

      if (lightness < 0.3) {
        segment.classList.add("incoming-small");
        segment.style.opacity = 0.4;
      }

      segment.addEventListener("mouseenter", (e) => {
        if (segmentGap > 0) {
          tooltip.innerHTML = `
<div class="tooltip-title">
  ${entry["Country of origin"]}&nbsp;&nbsp;&nbsp;→&nbsp;&nbsp;&nbsp;${countryName}
</div>
<div class="tooltip-line">
  People: ${count.toLocaleString()}
</div>
<div class="tooltip-line compact">
  Distance: ${dist ? Math.round(dist).toLocaleString("de-DE") + " km" : "-"}
</div>
`;
          tooltip.style.opacity = "1";
        }
      });


      segment.addEventListener("mousemove", (e) => {
        tooltip.style.left = e.pageX + 10 + "px";
        tooltip.style.top = e.pageY + 10 + "px";
      });

      segment.addEventListener("mouseleave", () => {
        tooltip.style.opacity = "0";
      });


      row.append(segment);
      segment.classList.add("bar-animate");
      setTimeout(() => segment.classList.remove("bar-animate"), 400);

      xOffsetIn += length + segmentGap;
    });



    // --- OUTGOING ---
    let xOffsetOut = 0;
    let outgoingGroups = gmynd.cumulateData(
      d.outgoingCountries,
      ["Country of asylum"],
      [{ value: selectedDataField, method: "Sum", title: "count" }]
    );


    outgoingGroups.sort((a, b) => b.count - a.count);

    outgoingGroups.forEach((entry) => {
      let count = entry.count || 0;
      let scaled = scalingMode === "sqrt" ? Math.sqrt(count) : count;
      let maxRef = scalingMode === "sqrt" ? Math.sqrt(maxValue) : maxValue;

      let length = gmynd.map(scaled, 0, maxRef, 0, scalingMode === "sqrt" ? maxBarLength : (stageWidth / 2 - centerGap / 2));
      // Helligkeit einstellen kleine Segmente
      let minLightness = segmentGap > 0 ? 0.30 : 0.29;
      let lightness = Math.max(minLightness, Math.min(length, 1));


      const segmentWidth = Math.max(length, 1);
      const outgoingLeft = stageWidth / 2 + xOffsetOut + centerGap / 2;

      // Distanz berechnen
      const asylumEntry = data.find(
        (c) => c["Country of asylum"] === entry["Country of asylum"] &&
          c["Country of origin"] === countryName &&
          c.Year === selectedYear
      );

      let dist = null;
      let distanceText = "";

      if (asylumEntry) {
        dist = getHaversineDistance(
          asylumEntry.origin_latitude,
          asylumEntry.origin_longitude,
          asylumEntry.asylum_latitude,
          asylumEntry.asylum_longitude
        );
        distanceText = ` (Distanz: ${dist.toFixed(2)} km)`;
      }

      const isSmallOutgoing = lightness < 0.3;

      const bgColor =
        segmentGap > 0 && dist !== null
          ? getOutgoingColorByDistance(dist, lightness)
          : adjustLightness("#ffb139", lightness);


      let segment = document.createElement("div");
      segment.classList.add("outgoing-segment");
      segment.style.backgroundColor = bgColor;
      segment.style.width = segmentWidth + "px";
      segment.style.height = "100%";
      segment.style.position = "absolute";
      segment.style.left = outgoingLeft + "px";

      if (lightness < 0.3) {
        segment.classList.add("outgoing-small");
        segment.style.opacity = 0.4;
      }

      segment.addEventListener("mouseenter", (e) => {
        if (segmentGap > 0) {
          tooltip.innerHTML = `
<div class="tooltip-title">
  ${countryName}&nbsp;&nbsp;&nbsp;→&nbsp;&nbsp;&nbsp;${entry["Country of asylum"]}
</div>
<div class="tooltip-line">
  People: ${count.toLocaleString()}
</div>
<div class="tooltip-line compact">
  Distance: ${dist ? Math.round(dist).toLocaleString("de-DE") + " km" : "-"}
</div>
`;
          tooltip.style.opacity = "1";
        }
      });


      segment.addEventListener("mousemove", (e) => {
        tooltip.style.left = e.pageX + 10 + "px";
        tooltip.style.top = e.pageY + 10 + "px";
      });

      segment.addEventListener("mouseleave", () => {
        tooltip.style.opacity = "0";
      });


      row.append(segment);
      segment.classList.add("bar-animate");
      setTimeout(() => segment.classList.remove("bar-animate"), 400);

      xOffsetOut += length + segmentGap;
    });


  });
}

// Distanzen Farbkategorien

function getIncomingColorByDistance(km, lightnessFactor = 1) {
  let baseColor;

  if (km <= 1000) baseColor = "#78c7ff";
  else if (km <= 3000) baseColor = "#789dff";
  else if (km <= 6000) baseColor = "#789dff";
  else baseColor = "#7863ff";

  return adjustLightness(baseColor, lightnessFactor);
}



function getOutgoingColorByDistance(km, lightnessFactor = 1) {
  let baseColor;

  if (km <= 1000) baseColor = "#ffde39";
  else if (km <= 3000) baseColor = "#ffb139";
  else if (km <= 6000) baseColor = "#ff7a39";
  else baseColor = "#ff5439";

  return adjustLightness(baseColor, lightnessFactor);
}




// Sortier-Buttons

function createYearSelector() {
  let container = document.getElementById("yearSelector");

  if (!container) {
    container = document.createElement("div");
    container.id = "yearSelector";
    container.className = "year-selector";
    optionsContainer.appendChild(container);
  } else {
    container.innerHTML = "";
  }

  const startYear = 2019;
  const endYear = 2024;

  for (let year = startYear; year <= endYear; year++) {
    const box = document.createElement("div");
    box.classList.add("year-box");
    box.dataset.year = year;
    box.setAttribute("data-year", year);


    if (year === selectedYear) box.classList.add("active");

    box.addEventListener("click", () => {
      selectedYear = year;
      prepareData();
      drawData();
      updateYearBoxHighlight();
    });

    box.addEventListener("mouseenter", (e) => {
      tooltipYears.textContent = `${year}`;
      tooltipYears.style.opacity = "1";
    });

    box.addEventListener("mousemove", (e) => {
      tooltipYears.style.left = e.pageX + 10 + "px";
      tooltipYears.style.top = e.pageY + 10 + "px";
    });

    box.addEventListener("mouseleave", () => {
      tooltipYears.style.opacity = "0";
    });

    container.appendChild(box);
  }
}


function updateYearBoxHighlight() {
  document.querySelectorAll(".year-box").forEach((box) => {
    const isActive = parseInt(box.dataset.year) === selectedYear;
    box.classList.toggle("active", isActive);
  });
}


function createSortSelector() {
  let container = document.getElementById("sortSelector");

  if (!container) {
    container = document.createElement("div");
    container.id = "sortSelector";
    container.className = "sort-selector";
    optionsContainer.appendChild(container);
  } else {
    container.innerHTML = "";
  }

  const options = [
    { label: "Total movement", value: "total" },
    { label: "Incoming refugees", value: "incoming" },
    { label: "Outgoing refugees", value: "outgoing" },
  ];

  options.forEach((opt) => {
    const box = document.createElement("div");
    box.classList.add("sort-box");
    box.dataset.sort = opt.value;
    box.textContent = opt.label;
    if (opt.value === sortMode) box.classList.add("active");

    box.addEventListener("click", () => {
      sortMode = opt.value;
      prepareData();
      drawData();
      updateSortBoxHighlight();
    });

    container.appendChild(box);
  });
}

function updateSortBoxHighlight() {
  document.querySelectorAll(".sort-box").forEach((box) => {
    const isActive = box.dataset.sort === sortMode;
    box.classList.toggle("active", isActive);
  });
}

function createScaleSelector() {
  let container = document.getElementById("scaleSelector");

  if (!container) {
    container = document.createElement("div");
    container.id = "scaleSelector";
    container.className = "scale-selector";
    renderer.appendChild(container);
  } else {
    container.innerHTML = "";
  }

  const options = [
    { label: "Linear view", value: "linear" },
    { label: "Logarithmic view", value: "sqrt" },

  ];

  options.forEach((opt) => {
    const box = document.createElement("div");
    box.classList.add("scale-box");
    box.dataset.scale = opt.value;
    box.textContent = opt.label;
    if (opt.value === scalingMode) box.classList.add("active");

    box.addEventListener("click", () => {
      scalingMode = opt.value;
      drawData();
      updateScaleBoxHighlight();
    });

    container.appendChild(box);
  });
}

function updateScaleBoxHighlight() {
  document.querySelectorAll(".scale-box").forEach((box) => {
    const isActive = box.dataset.scale === scalingMode;
    box.classList.toggle("active", isActive);
  });
}

function createGapToggle() {
  let container = document.getElementById("gapToggle");

  if (!container) {
    container = document.createElement("div");
    container.id = "gapToggle";
    container.className = "gap-toggle";
    optionsContainer.appendChild(container);
  } else {
    container.innerHTML = "";
  }

  const options = [
    { label: "Overview", value: 0 },
    { label: "Details", value: 5 },
  ];

  options.forEach((opt) => {
    const button = document.createElement("div");
    button.textContent = opt.label;
    button.className = "gap-box";
    if (segmentGap === opt.value) button.classList.add("active");

    button.addEventListener("click", () => {
      segmentGap = opt.value;
      drawData();
      updateGapToggleHighlight();
    });

    container.appendChild(button);
  });
}

function updateGapToggleHighlight() {
  document.querySelectorAll("#gapToggle .gap-box").forEach((btn) => {
    const isActive =
      (btn.textContent === "Details" && segmentGap === 5) ||
      (btn.textContent === "Overview" && segmentGap === 0);
    btn.classList.toggle("active", isActive);
  });
}


function createDataFieldToggle() {
  let container = document.getElementById("dataFieldToggle");

  if (!container) {
    container = document.createElement("div");
    container.id = "dataFieldToggle";
    container.className = "datafield-selector";
    optionsContainer.appendChild(container);
  } else {
    container.innerHTML = "";
  }

  const options = [
    { label: "Asylum seekers", value: "Asylum-seekers" },
    { label: "Refugees admitted", value: "Refugees under UNHCR's mandate" },
  ];

  options.forEach((opt) => {
    const box = document.createElement("div");
    box.classList.add("datafield-box");
    box.dataset.field = opt.value;
    box.textContent = opt.label;
    if (opt.value === selectedDataField) box.classList.add("active");

    box.addEventListener("click", () => {
      selectedDataField = opt.value;
      prepareData();
      drawData();
      updateDataFieldHighlight();
    });

    container.appendChild(box);
  });
}

function updateDataFieldHighlight() {
  document.querySelectorAll(".datafield-box").forEach((box) => {
    const isActive = box.dataset.field === selectedDataField;
    box.classList.toggle("active", isActive);
  });
}

function adjustLightness(hex, factor = 1) {
  let r = parseInt(hex.substr(1, 2), 16);
  let g = parseInt(hex.substr(3, 2), 16);
  let b = parseInt(hex.substr(5, 2), 16);

  // Umrechnen in HSL
  r /= 255; g /= 255; b /= 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let l = (max + min) / 2;

  let h, s;
  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h /= 6;
  }

  // Neue Luminanz
  l = Math.min(1, Math.max(0, l * factor));

  // Rückkonvertierung HSL in RGB
  let hue2rgb = function (p, q, t) {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  let p = 2 * l - q;
  r = hue2rgb(p, q, h + 1 / 3);
  g = hue2rgb(p, q, h);
  b = hue2rgb(p, q, h - 1 / 3);

  r = Math.round(r * 255);
  g = Math.round(g * 255);
  b = Math.round(b * 255);

  return `rgb(${r}, ${g}, ${b})`;
}
