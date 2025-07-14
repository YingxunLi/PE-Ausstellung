import { data } from "./data.js";

const renderer = document.querySelector("#renderer");
const inflationCategoryLabels = document.querySelectorAll(
  ".h2-container .inflation-radio"
);

let stageWidth = window.innerWidth;
let stageHeight = window.innerHeight;

const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
let viewMode = "heatmap";
let activeInflationType = "Head Inflation";
let activeContinent = "Europe";

const baseRadiusStart = Math.min(stageWidth, stageHeight) * 0.25;
const baseRadiusStep = Math.min(stageWidth, stageHeight) * 0.019;
const dotSizeContinent = Math.min(stageWidth, stageHeight) * 0.016;

const activeColorFilters = new Set();

const RADIAL_VERTICAL_OFFSET = -39;
function updateDimensions() {
  stageWidth = window.innerWidth;
  stageHeight = window.innerHeight;
  renderer.style.width = `${stageWidth}px`;
  renderer.style.height = `${stageHeight - 200}px`;
}
updateDimensions();

const continentMap = {
  Europe: [
    "Albania",
    "Andorra",
    "Armenia",
    "Austria",
    "Azerbaijan",
    "Belarus",
    "Belgium",
    "Bosnia and Herzegovina",
    "Bulgaria",
    "Croatia",
    "Cyprus",
    "Czech Republic",
    "Denmark",
    "Estonia",
    "Finland",
    "France",
    "Georgia",
    "Germany",
    "Greece",
    "Hungary",
    "Iceland",
    "Ireland",
    "Italy",
    "Kazakhstan",
    "Kosovo",
    "Latvia",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Malta",
    "Moldova",
    "Monaco",
    "Montenegro",
    "Netherlands",
    "North Macedonia",
    "Norway",
    "Poland",
    "Portugal",
    "Romania",
    "Russia",
    "San Marino",
    "Serbia",
    "Slovakia",
    "Slovenia",
    "Spain",
    "Sweden",
    "Switzerland",
    "Turkey",
    "Ukraine",
    "United Kingdom",
    "Vatican City",
  ],
  Asia: [
    "Afghanistan",
    "Armenia",
    "Azerbaijan",
    "Bahrain",
    "Bangladesh",
    "Bhutan",
    "Brunei Darussalam",
    "Cambodia",
    "China",
    "Georgia",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Israel",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kuwait",
    "Kyrgyzstan",
    "Laos",
    "Lebanon",
    "Malaysia",
    "Maldives",
    "Mongolia",
    "Myanmar",
    "Nepal",
    "North Korea",
    "Oman",
    "Pakistan",
    "Palestinian Territories",
    "Philippines",
    "Qatar",
    "Saudi Arabia",
    "Singapore",
    "South Korea",
    "Sri Lanka",
    "Syria",
    "Taiwan",
    "Tajikistan",
    "Thailand",
    "Timor-Leste",
    "Turkmenistan",
    "United Arab Emirates",
    "Uzbekistan",
    "Vietnam",
    "Yemen",
  ],
  Africa: [
    "Algeria",
    "Angola",
    "Benin",
    "Botswana",
    "Burkina Faso",
    "Burundi",
    "Cameroon",
    "Cape Verde",
    "Central African Republic",
    "Chad",
    "Comoros",
    "Congo (Brazzaville)",
    "Congo (Kinshasa)",
    "Djibouti",
    "Egypt",
    "Equatorial Guinea",
    "Eritrea",
    "Eswatini",
    "Ethiopia",
    "Gabon",
    "Gambia",
    "Ghana",
    "Guinea",
    "Guinea-Bissau",
    "Ivory Coast",
    "Kenya",
    "Lesotho",
    "Liberia",
    "Libya",
    "Madagascar",
    "Malawi",
    "Mali",
    "Mauritania",
    "Mauritius",
    "Morocco",
    "Mozambique",
    "Namibia",
    "Niger",
    "Nigeria",
    "Rwanda",
    "São Tomé and Príncipe",
    "Senegal",
    "Seychelles",
    "Sierra Leone",
    "Somalia",
    "South Africa",
    "South Sudan",
    "Sudan",
    "Tanzania",
    "Togo",
    "Tunisia",
    "Uganda",
    "Zambia",
    "Zimbabwe",
  ],
  America: [
    "Antigua and Barbuda",
    "Bahamas",
    "Barbados",
    "Belize",
    "Canada",
    "Costa Rica",
    "Cuba",
    "Dominica",
    "Dominican Republic",
    "El Salvador",
    "Grenada",
    "Guatemala",
    "Haiti",
    "Honduras",
    "Jamaica",
    "Mexico",
    "Nicaragua",
    "Panama",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "Trinidad and Tobago",
    "United States",
    "Argentina",
    "Bolivia",
    "Brazil",
    "Chile",
    "Colombia",
    "Ecuador",
    "Guyana",
    "Paraguay",
    "Peru",
    "Suriname",
    "Uruguay",
    "Venezuela",
  ],
};

function getColorByInflation(value) {
  const scale = [
    "#05E0E9",
    "#22CDE3",
    "#40BADD",
    "#5EA7D7",
    "#7C94D1",
    "#9A81CB",
    "#B86EC5",
    "#FF2768",
  ];
  5;
  if (value <= 1) return scale[0];
  if (value <= 2) return scale[1];
  if (value <= 3) return scale[2];
  if (value <= 4) return scale[3];
  if (value <= 5) return scale[4];
  if (value <= 6.5) return scale[5];
  if (value <= 8) return scale[6];
  return scale[7];
}

function getOpacityByHappiness(h) {
  if (h >= 7.5) return 1;
  if (h >= 6.5) return 0.8;
  if (h >= 5.5) return 0.6;
  if (h >= 4.5) return 0.4;
  if (h >= 3.5) return 0.2;
  return 0.08;
}

function getStrokeWidthByHappiness(h) {
  if (h >= 7.5) return 6;
  if (h >= 6.5) return 5;
  if (h >= 5.5) return 4;
  if (h >= 4.5) return 3;
  if (h >= 3.5) return 2;
  return 1;
}

const tooltip = document.createElement("div");
tooltip.className = "tooltip";
tooltip.style.position = "fixed";
tooltip.style.pointerEvents = "none";
tooltip.style.zIndex = "1003";
tooltip.style.display = "none";
tooltip.style.background = "#fff";
tooltip.style.color = "#000";
tooltip.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
tooltip.style.borderRadius = "7px";
tooltip.style.padding = "10px 15px";
tooltip.style.fontSize = "14px";
document.body.appendChild(tooltip);

const dotsMap = new Map();

function createDot(country, year, size) {
  const dot = document.createElement("div");
  dot.className = "dot";
  dot.style.position = "absolute";
  dot.style.width = `${size}px`;
  dot.style.height = `${size}px`;
  dot.style.borderRadius = "50%";
  dot.style.transition = "transform 0.1s ease, opacity 0.15s ease";
  dot.style.transformOrigin = "center center";
  dot.dataset.country = country;
  dot.dataset.year = year;
  renderer.appendChild(dot);

  dot.addEventListener("mouseenter", (e) => {
    dot.style.transition = "transform 0.15s ease-out";
    dot.style.transform = "scale(1.2)";
    tooltip.innerHTML = `
      <div class="tooltip-title">${country}</div>
      <div class="tooltip-row">
        <span class="tooltip-label">Year:</span>
        <span class="tooltip-value">${year}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">${activeInflationType}:</span>
        <span class="tooltip-value">${dot.dataset.inflation || "N/A"}%</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Happiness:</span>
        <span class="tooltip-value">${dot.dataset.happiness || "N/A"}</span>
      </div>
    `;
    tooltip.style.display = "block";
    tooltip.style.left = `${e.clientX + 15}px`;
    tooltip.style.top = `${e.clientY + 15}px`;
  });

  dot.addEventListener("mousemove", (e) => {
    const tooltipRect = tooltip.getBoundingClientRect();
    const offset = 15;

    let left = e.clientX + offset;
    let top = e.clientY + offset;

    if (left + tooltipRect.width > window.innerWidth) {
      left = e.clientX - tooltipRect.width - offset;
    }
    if (top + tooltipRect.height > window.innerHeight) {
      top = e.clientY - tooltipRect.height - offset;
    }
    if (left < 0) left = offset;
    if (top < 0) top = offset;

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  });

  dot.addEventListener("mouseleave", () => {
    dot.style.transition = "transform 0.15s ease-in";
    dot.style.transform = "scale(1)";
    tooltip.style.display = "none";
  });

  dot.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  return dot;
}

function animateDotsOut(callback) {
  const dots = Array.from(dotsMap.values());
  dots.forEach((dot, i) => {
    setTimeout(() => {
      dot.style.transition = "all 0.15s ease-in";
      dot.style.transform = "scale(0)";
      dot.style.opacity = "0";
    }, i * 0.5);
  });
  setTimeout(() => {
    dots.forEach((dot) => dot.remove());
    dotsMap.clear();
    callback();
  }, dots.length * 0.5 + 200);
}

function updateDots(type, continent) {
  if (viewMode !== "radial") return;
  clearRenderer();

  let radialContainer = document.createElement("div");
  radialContainer.id = "radial-container";

  radialContainer.style.position = "absolute";
  radialContainer.style.left = "0";
  radialContainer.style.top = "0";
  radialContainer.style.width = "100%";
  radialContainer.style.height = "100%";
  radialContainer.style.transition =
    "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
  radialContainer.style.transform = "translateX(100vw)";
  renderer.appendChild(radialContainer);

  let rotationContainer = document.createElement("div");
  rotationContainer.classList.add("rotation-container");

  radialContainer.appendChild(rotationContainer);

  const dotSize = dotSizeContinent;
  const countries = continentMap[continent] || [];

  const baseRadiusStart = Math.min(stageWidth, stageHeight) * 0.18;
  const baseRadiusStep = Math.min(stageWidth, stageHeight) * 0.023;

  const relevant = countries
    .map((c) => {
      const vals = years
        .map((y) => {
          const d = data.find(
            (d) => d.Countries === c && parseInt(d.Years) === y
          );
          return d ? parseFloat(d[type]) : null;
        })
        .filter((v) => !isNaN(v));
      const avg = vals.length
        ? vals.reduce((a, b) => a + b) / vals.length
        : null;
      return avg !== null ? { country: c, avg } : null;
    })
    .filter(Boolean);

  const sorted = relevant.sort((a, b) => a.avg - b.avg).map((d) => d.country);
  // const total = sorted.length;

  let total = 0;
  sorted.forEach((country) => {
    let hasEntry = false;
    years.forEach((year, ringIdx) => {
      const entry = data.find(
        (d) => d.Countries === country && parseInt(d.Years) === year
      );
      if (!entry) return;
      hasEntry = true;
    });
    if (hasEntry) total++;
  });

  total--;

  let circleIdx = 0;

  sorted.forEach((country) => {
    let hasEntry = false;
    years.forEach((year, ringIdx) => {
      const entry = data.find(
        (d) => d.Countries === country && parseInt(d.Years) === year
      );
      if (!entry) return;
      hasEntry = true;
      const inflation = parseFloat(entry[type]);
      const happiness = parseFloat(entry["Happiness Score Index"]);
      if (isNaN(inflation) || isNaN(happiness)) return;
      const color = getColorByInflation(inflation).toLowerCase();
      if (activeColorFilters.size > 0 && !activeColorFilters.has(color)) return;
      const angleStep = total > 1 ? (1.5 * Math.PI) / total : 0;
      const angle = circleIdx * angleStep - Math.PI / 2;
      const r = baseRadiusStart + baseRadiusStep * (ringIdx + 0.5);
      const rendererRect = renderer.getBoundingClientRect();
      const x = Math.cos(angle) * r + rendererRect.width / 2;
      const y = Math.sin(angle) * r + rendererRect.height / 2;
      const dot = createDot(country, year, dotSize);
      dotsMap.set(`${country}-${year}`, dot);
      dot.dataset.inflation = inflation.toFixed(2);
      dot.dataset.happiness = happiness.toFixed(2);
      dot.style.left = `${x - dotSize / 2}px`;
      dot.style.top = `${y - dotSize / 2}px`;
      if (happiness >= 7.5) {
        dot.style.backgroundColor = "#05E0E9";
        dot.style.border = "none";
      } else {
        dot.style.backgroundColor = "transparent";
        dot.style.border = `${getStrokeWidthByHappiness(
          happiness
        )}px solid ${color}`;
      }
      rotationContainer.appendChild(dot);
    });
    if (hasEntry) circleIdx++;
  });

  setTimeout(() => {
    radialContainer.style.transform = "translateX(0)";
  }, 10);
}

function renderHeatmap() {
  clearRenderer();

  document.querySelector(".h2-container").style.display = "flex";

  const continents = Object.keys(continentMap);
  const padding = 20;
  const cellHeight = 13;

  const availableWidth = window.innerWidth - 60;
  const maxCountries = Math.max(
    ...Object.values(continentMap).map((countries) => countries.length)
  );
  const gap = 7;
  const cellWidth = Math.max(
    cellHeight * 2,
    (availableWidth - (maxCountries - 1) * gap - 2 * padding) /
    (maxCountries * 0.755)
  );

  const heatmapContainer = document.createElement("div");
  heatmapContainer.id = "heatmap";

  heatmapContainer.style.display = "grid";
  heatmapContainer.style.gridAutoColumns = `${cellWidth}px`;
  heatmapContainer.style.gridAutoRows = `${cellHeight}px`;
  heatmapContainer.style.gap = "7px";
  heatmapContainer.style.padding = `${padding}px`;
  heatmapContainer.style.marginLeft = "30px";
  heatmapContainer.style.transition =
    "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
  heatmapContainer.style.transform = "translateX(-100vw)";

  renderer.appendChild(heatmapContainer);

  setTimeout(() => {
    heatmapContainer.style.transform = "translateX(0)";
  }, 10);

  continents.forEach((continent, continentIndex) => {
    const countries = continentMap[continent];

    const sortedCountries = countries
      .map((country) => {
        const inflations = years
          .map((year) => {
            const entry = data.find(
              (d) => d.Countries === country && parseInt(d.Years) === year
            );
            return entry ? parseFloat(entry[activeInflationType]) : null;
          })
          .filter((value) => !isNaN(value));

        const avgInflation =
          inflations.length > 0
            ? inflations.reduce((a, b) => a + b, 0) / inflations.length
            : null;
        return { country, avgInflation };
      })
      .filter((entry) => entry.avgInflation !== null)
      .sort((a, b) => a.avgInflation - b.avgInflation)
      .map((entry) => entry.country);
    let countryIndex = 0;
    sortedCountries.forEach((country, index) => {
      let checkEntry = false;
      years.forEach((year, yearIndex) => {
        const entry = data.find(
          (d) => d.Countries === country && parseInt(d.Years) === year
        );

        if (entry) {
          checkEntry = true;
          const cell = document.createElement("div");
          cell.style.width = `${cellWidth}px`;
          cell.style.height = `${cellHeight}px`;
          cell.style.borderRadius = "2px";
          cell.style.cursor = "pointer";
          cell.style.transition = "transform 0.15s ease-out";
          cell.style.boxSizing = "border-box";
          const inflation = parseFloat(entry[activeInflationType]);
          const happiness = parseFloat(entry["Happiness Score Index"]);

          if (!isNaN(inflation) && !isNaN(happiness)) {
            const color = getColorByInflation(inflation).toLowerCase();

            if (activeColorFilters.size > 0 && !activeColorFilters.has(color)) {
              cell.style.display = "none";
              return;
            }

            cell.dataset.country = country;
            cell.dataset.border = happiness;
            cell.style.color = inflation;

            if (happiness >= 7.5) {
              cell.style.backgroundColor = "#05E0E9";
              cell.style.border = "none";
            } else {
              cell.style.backgroundColor = "transparent";
              cell.style.border = `${getStrokeWidthByHappiness(
                happiness
              )}px solid ${color}`;
            }
            cell.dataset.country = country;
            cell.dataset.year = year;
            cell.dataset.inflation = inflation.toFixed(2);
            cell.dataset.happiness = happiness.toFixed(2);

            // Tooltip und Hover-Effekt
            cell.addEventListener("mouseenter", (e) => {
              cell.style.transform = "scale(1.1)";
              tooltip.innerHTML = `
                <div class="tooltip-title">${country}</div>
                <div class="tooltip-row">
                  <span class="tooltip-label">Year:</span>
                  <span class="tooltip-value">${year}</span>
                </div>
                <div class="tooltip-row">
                  <span class="tooltip-label">${activeInflationType}:</span>
                  <span class="tooltip-value">${inflation.toFixed(2)}%</span>
                </div>
                <div class="tooltip-row">
                  <span class="tooltip-label">Happiness:</span>
                  <span class="tooltip-value">${happiness.toFixed(2)}</span>
                </div>
              `;
              tooltip.style.display = "block";
              tooltip.style.left = `${e.clientX + 15}px`;
              tooltip.style.top = `${e.clientY + 15}px`;
            });

            cell.addEventListener("mousemove", (e) => {
              const tooltipRect = tooltip.getBoundingClientRect();
              const offsetX = 15;
              const offsetY = 15;
              let left = e.clientX + offsetX;
              let top = e.clientY + offsetY;

              if (left + tooltipRect.width > window.innerWidth) {
                left = e.clientX - tooltipRect.width - offsetX;
              }
              if (top + tooltipRect.height > window.innerHeight) {
                top = e.clientY - tooltipRect.height - offsetY;
              }

              tooltip.style.left = `${left}px`;
              tooltip.style.top = `${top}px`;
            });

            cell.addEventListener("mouseleave", () => {
              cell.style.transform = "scale(1)";
              tooltip.style.display = "none";
            });
          } else {
            cell.style.backgroundColor = "transparent";
            cell.style.opacity = "0.1";
          }

          const row = continentIndex * (years.length + 1) + yearIndex + 1;
          const col = countryIndex + 1;
          cell.style.gridRowStart = row;
          cell.style.gridColumnStart = col;

          heatmapContainer.appendChild(cell);
        }
      });
      if (checkEntry == true) countryIndex++;
    });
  });
}

window.addEventListener("resize", () => {
  updateDimensions();
  if (viewMode === "radial") {
    updateDotColors(activeInflationType, activeContinent);
  } else {
    renderHeatmap();
  }
});

function clearRenderer() {
  while (renderer.firstChild) renderer.removeChild(renderer.firstChild);
}

const continentToggleWrapper = document.getElementById(
  "continent-toggle-wrapper"
);

// Toggle Button
const toggleSwitch = document.querySelector("#toggle");

toggleSwitch.addEventListener("change", () => {
  const newMode = viewMode === "radial" ? "heatmap" : "radial";

  if (newMode === "heatmap") {
    viewMode = "heatmap";

    const heatmapContainer = document.getElementById("heatmap");
    if (heatmapContainer) {
      heatmapContainer.style.transition =
        "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      heatmapContainer.style.transform = "translateX(0)";
    }

    const radialContainer = document.getElementById("radial-container");
    if (radialContainer) {
      radialContainer.style.transition =
        "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      radialContainer.style.transform = "translateX(100vw)";
    }

    setTimeout(() => {
      clearRenderer();
      renderHeatmap();
    }, 350);

    document.querySelector(".h2-container").style.display = "flex";

    const continentToggleWrapper = document.getElementById(
      "continent-toggle-wrapper"
    );
    continentToggleWrapper.classList.remove("visible");
    setTimeout(() => {
      continentToggleWrapper.style.display = "none";
    }, 400);
  } else {
    viewMode = "radial";

    const heatmapContainer = document.getElementById("heatmap");
    if (heatmapContainer) {
      heatmapContainer.style.transition =
        "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      heatmapContainer.style.transform = "translateX(-100vw)";
    }

    setTimeout(() => {
      clearRenderer();
      updateDots(activeInflationType, activeContinent);
    }, 350);

    document.querySelector(".h2-container").style.display = "flex";

    const continentToggleWrapper = document.getElementById(
      "continent-toggle-wrapper"
    );
    continentToggleWrapper.style.display = "flex";
    setTimeout(() => {
      continentToggleWrapper.classList.add("visible");
    }, 350);
  }
});

continentToggleWrapper.style.display = "none";
document.querySelector(".h2-container").style.display = "none";

inflationCategoryLabels.forEach((label) => {
  label.addEventListener("click", () => {
    inflationCategoryLabels.forEach((el) => {
      el.classList.remove("active");
      el.querySelector("input[type='radio']").checked = false;
    });
    label.classList.add("active");
    label.querySelector("input[type='radio']").checked = true;

    const textNodes = Array.from(label.childNodes).filter(
      (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0
    );
    activeInflationType =
      textNodes.length > 0
        ? textNodes[0].textContent.trim()
        : label.textContent.trim();

    if (viewMode === "heatmap") {
      updateHeatmapColors(activeInflationType);
    } else {
      updateDotColors(activeInflationType, activeContinent);
    }
  });
});

inflationCategoryLabels.forEach((label) => {
  const input = label.querySelector("input[type='radio']");
  if (input && input.checked) {
    label.classList.add("active");
  } else {
    label.classList.remove("active");
  }
});

function updateDotVisibility() {
  const dots = renderer.querySelectorAll(".dot");
  dots.forEach((dot) => {
    const dotColor = rgbToHex(dot.style.backgroundColor);
    const match =
      !activeColorFilter || dotColor === activeColorFilter.toLowerCase();
    dot.style.display = match ? "block" : "none";
  });
}

function rgbToHex(rgb) {
  const result = rgb.match(/\d+/g);
  if (!result || result.length < 3) return "";
  return (
    "#" +
    result
      .slice(0, 3)
      .map((n) => (+n).toString(16).padStart(2, "0"))
      .join("")
  );
}

renderHeatmap();

const continentToggle = document.getElementById("continent-toggle");
const continentSegments =
  continentToggle.querySelectorAll(".continent-segment");

continentSegments.forEach((seg, idx) => {
  if (seg.dataset.continent === "Europe") {
    seg.classList.add("active");
    continentToggle.setAttribute("data-active", idx);
  } else {
    seg.classList.remove("active");
  }
});

continentSegments.forEach((seg) => {
  seg.addEventListener("click", () => {
    setActiveContinent(seg.dataset.continent);
  });
});

function setActiveContinent(continent) {
  let activeIdx = 0;
  continentSegments.forEach((seg, idx) => {
    if (seg.dataset.continent === continent) {
      seg.classList.add("active");
      activeIdx = idx;
    } else {
      seg.classList.remove("active");
    }
  });
  continentToggle.setAttribute("data-active", activeIdx);

  if (continent !== activeContinent) {
    const oldContinent = activeContinent;
    activeContinent = continent;

    animateContinentTransition(oldContinent, continent);
  }
}

function animateContinentTransition(oldContinent, newContinent) {
  if (viewMode !== "radial") return;

  function animateDotsOut(callback) {
    const dots = Array.from(dotsMap.values());
    dots.forEach((dot, i) => {
      setTimeout(() => {
        dot.style.transition = "all 0.15s ease-in";
        dot.style.transform = "scale(0)";
        dot.style.opacity = "0";
      }, i * 0.5);
    });
    setTimeout(() => {
      dots.forEach((dot) => dot.remove());
      dotsMap.clear();
      callback();
    }, dots.length * 0.5 + 200);
  }

  function updateDotsWithAnimation(type, continent) {
    if (viewMode !== "radial") return;
    clearRenderer();
    let radialContainer = document.createElement("div");
    radialContainer.id = "radial-container";
    radialContainer.style.position = "absolute";
    radialContainer.style.left = "0";
    radialContainer.style.top = "0";
    radialContainer.style.width = "100%";
    radialContainer.style.height = "100%";
    radialContainer.style.transition =
      "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    radialContainer.style.transform = "translateX(0)";
    renderer.appendChild(radialContainer);

    let rotationContainer = document.createElement("div");
    rotationContainer.classList.add("rotation-container");
    radialContainer.appendChild(rotationContainer);

    const dotSize = dotSizeContinent;
    const countries = continentMap[continent] || [];

    const baseRadiusStart = Math.min(stageWidth, stageHeight) * 0.18;
    const baseRadiusStep = Math.min(stageWidth, stageHeight) * 0.023;

    const relevant = countries
      .map((c) => {
        const vals = years
          .map((y) => {
            const d = data.find(
              (d) => d.Countries === c && parseInt(d.Years) === y
            );
            return d ? parseFloat(d[type]) : null;
          })
          .filter((v) => !isNaN(v));
        const avg = vals.length
          ? vals.reduce((a, b) => a + b) / vals.length
          : null;
        return avg !== null ? { country: c, avg } : null;
      })
      .filter(Boolean);

    const sorted = relevant.sort((a, b) => a.avg - b.avg).map((d) => d.country);

    const allDots = [];
    let circleIdx = 0;

    let total = 0;
    sorted.forEach((country) => {
      let hasEntry = false;
      years.forEach((year, ringIdx) => {
        const entry = data.find(
          (d) => d.Countries === country && parseInt(d.Years) === year
        );
        if (!entry) return;
        hasEntry = true;
      });
      if (hasEntry) total++;
    });

    total--;

    sorted.forEach((country) => {
      let hasEntry = false;
      years.forEach((year, ringIdx) => {
        const entry = data.find(
          (d) => d.Countries === country && parseInt(d.Years) === year
        );
        if (!entry) return;

        hasEntry = true;
        const inflation = parseFloat(entry[type]);
        const happiness = parseFloat(entry["Happiness Score Index"]);
        if (isNaN(inflation) || isNaN(happiness)) return;

        const color = getColorByInflation(inflation).toLowerCase();
        if (activeColorFilters.size > 0 && !activeColorFilters.has(color))
          return;

        const angleStep = total > 1 ? (1.5 * Math.PI) / total : 0;
        const angle = circleIdx * angleStep - Math.PI / 2;
        const r = baseRadiusStart + baseRadiusStep * (ringIdx + 0.5);
        const rendererRect = renderer.getBoundingClientRect();
        const x = Math.cos(angle) * r + rendererRect.width / 2;
        const y = Math.sin(angle) * r + rendererRect.height / 2;

        const dot = createDot(country, year, dotSize);
        dotsMap.set(`${country}-${year}`, dot);
        dot.dataset.inflation = inflation.toFixed(2);
        dot.dataset.happiness = happiness.toFixed(2);
        dot.style.left = `${x - dotSize / 2}px`;
        dot.style.top = `${y - dotSize / 2}px`;
        dot.style.transform = "scale(0)";

        if (happiness >= 7.5) {
          dot.style.backgroundColor = "#05E0E9";
          dot.style.border = "none";
        } else {
          dot.style.backgroundColor = "transparent";
          dot.style.border = `${getStrokeWidthByHappiness(
            happiness
          )}px solid ${color}`;
        }

        if (!allDots[circleIdx]) allDots[circleIdx] = [];
        allDots[circleIdx].push(dot);
        rotationContainer.appendChild(dot);
      });
      if (hasEntry) circleIdx++;
    });

    const allDotsFlat = allDots.flat();
    allDotsFlat.forEach((dot, i) => {
      setTimeout(() => {
        dot.style.transition = "all 0.15s ease-out";
        dot.style.opacity = "1";
        dot.style.transform = "scale(1)";
      }, i * 0.5);
    });
  }

  animateDotsOut(() => {
    updateDotsWithAnimation(activeInflationType, newContinent);
  });
}

const track = document.getElementById("color-slider-track");
const handleMin = document.getElementById("range-handle-min");
const handleMax = document.getElementById("range-handle-max");
const leftOverlay = document.getElementById("left-overlay");
const rightOverlay = document.getElementById("right-overlay");

const inflationColors = [
  "#05E0E9",
  "#22CDE3",
  "#40BADD",
  "#5EA7D7",
  "#7C94D1",
  "#9A81CB",
  "#B86EC5",
  "#FF2768",
];

let markerPositions = [];
let dragging = null;
const minGap = 40;

function setHandlePosition(handle, x) {
  const maxX = track.offsetWidth - handle.offsetWidth;
  const newX = Math.min(Math.max(0, x), maxX);
  handle.style.left = `${newX}px`;
}

function getHandlePosition(handle) {
  return parseFloat(handle.style.left) || 0;
}

function addScaleMarkers() {
  const trackWidth = track.offsetWidth;
  const step = trackWidth / inflationColors.length;
  markerPositions = [];
  for (let i = 0; i <= inflationColors.length; i++) {
    const pos = i * step;
    markerPositions.push(pos);
  }
}

function snapToClosestMarker(handle) {
  const handleWidth = handleMin.offsetWidth;
  const pos = getHandlePosition(handle);
  let closest = markerPositions.reduce((closest, mark) =>
    Math.abs(mark - pos) < Math.abs(closest - pos) ? mark : closest
  );
  if (handle === handleMax) {
    if (closest >= track.offsetWidth - handleWidth) {
      closest = track.offsetWidth - handleWidth;
    } else {
      closest = Math.min(closest, track.offsetWidth - handleWidth);
    }
    const minX = getHandlePosition(handleMin) + 24;
    closest = Math.max(closest, minX);
  }
  if (handle === handleMin) {
    closest = Math.max(closest, 0);
    const maxX = getHandlePosition(handleMax) - 24;
    closest = Math.min(closest, maxX);
  }
  handle.style.left = `${closest}px`;
}

function updateOverlays() {
  const minX = getHandlePosition(handleMin);
  const maxX = getHandlePosition(handleMax);
  const min = Math.min(minX, maxX);
  const max = Math.max(minX, maxX);
  leftOverlay.style.width = `${min}px`;
  rightOverlay.style.width = `${track.offsetWidth - max - handleMax.offsetWidth
    }px`;
}

function getSelectedColorRange() {
  const trackWidth = track.offsetWidth;
  const minX = getHandlePosition(handleMin);
  const maxX = getHandlePosition(handleMax) + handleMax.offsetWidth;
  const step = trackWidth / inflationColors.length;
  let minIndex = Math.round(minX / step);
  let maxIndex = Math.round(maxX / step);
  minIndex = Math.max(0, Math.min(minIndex, inflationColors.length - 1));
  maxIndex = Math.max(0, Math.min(maxIndex, inflationColors.length));
  return new Set(inflationColors.slice(minIndex, maxIndex));
}

function updateColorFilterFromSlider() {
  activeColorFilters.clear();
  const selectedColors = getSelectedColorRange();
  selectedColors.forEach((color) =>
    activeColorFilters.add(color.toLowerCase())
  );
  if (viewMode === "heatmap") {
    updateHeatmapColors(activeInflationType);
  } else {
    updateDotColors(activeInflationType, activeContinent);
  }
}

function onMouseMove(e) {
  if (!dragging) return;
  const trackRect = track.getBoundingClientRect();
  const mouseX = e.clientX - trackRect.left;
  if (dragging === handleMin) {
    const maxX = getHandlePosition(handleMax) - 24;
    setHandlePosition(handleMin, Math.min(mouseX, maxX));
  } else {
    const minX = getHandlePosition(handleMin) + 24;
    setHandlePosition(handleMax, Math.max(mouseX, minX));
  }
  updateOverlays();
}

handleMin.addEventListener("mousedown", () => (dragging = handleMin));
handleMax.addEventListener("mousedown", () => (dragging = handleMax));
window.addEventListener("mousemove", onMouseMove);
window.addEventListener("mouseup", () => {
  if (dragging === handleMin) snapToClosestMarker(handleMin);
  if (dragging === handleMax) snapToClosestMarker(handleMax);
  updateOverlays();
  updateColorFilterFromSlider();
  dragging = null;
});

window.addEventListener("load", () => {
  addScaleMarkers();
  handleMin.style.left = "0px";
  handleMax.style.left = `${track.offsetWidth - handleMax.offsetWidth}px`;
  updateOverlays();
  updateColorFilterFromSlider();
});

window.addEventListener("resize", () => {
  addScaleMarkers();
  updateOverlays();
  updateColorFilterFromSlider();
});

function updateDotColors(type, continent) {
  if (viewMode !== "radial") return;

  const countries = continentMap[continent] || [];

  dotsMap.forEach((dot, key) => {
    const [country, year] = key.split("-");

    if (!countries.includes(country)) return;

    const entry = data.find(
      (d) => d.Countries === country && parseInt(d.Years) === parseInt(year)
    );

    if (!entry) return;

    const inflation = parseFloat(entry[type]);
    const happiness = parseFloat(entry["Happiness Score Index"]);

    if (isNaN(inflation) || isNaN(happiness)) return;

    const color = getColorByInflation(inflation).toLowerCase();

    if (activeColorFilters.size > 0) {
      const normalizedColor = color.toLowerCase();
      const isColorSelected = Array.from(activeColorFilters).some(
        (selectedColor) => selectedColor.toLowerCase() === normalizedColor
      );

      if (!isColorSelected) {
        dot.style.transition = "opacity 0.6s ease, transform 0.6s ease";
        dot.style.opacity = "0";
        dot.style.transform = "scale(0.8)";
        return;
      }
    }

    dot.style.transition =
      "opacity 0.6s ease, transform 0.6s ease, background-color 0.6s ease, border-color 0.6s ease";
    dot.style.opacity = "1";
    dot.style.transform = "scale(1)";

    dot.style.transition =
      "background-color 0.6s ease, border-color 0.6s ease, opacity 0.6s ease, transform 0.6s ease";

    dot.dataset.inflation = inflation.toFixed(2);

    if (happiness >= 7.5) {
      dot.style.backgroundColor = "#05E0E9";
      dot.style.border = "none";
    } else {
      dot.style.backgroundColor = "transparent";
      dot.style.border = `${getStrokeWidthByHappiness(
        happiness
      )}px solid ${color}`;
    }
  });
}

function updateHeatmapColors(type) {
  if (viewMode !== "heatmap") return;

  const heatmapContainer = document.getElementById("heatmap");
  if (!heatmapContainer) return;

  const cells = heatmapContainer.querySelectorAll("div[data-country]");

  cells.forEach((cell) => {
    const country = cell.dataset.country;
    const year = parseInt(cell.dataset.year);

    const entry = data.find(
      (d) => d.Countries === country && parseInt(d.Years) === year
    );

    if (!entry) return;

    const inflation = parseFloat(entry[type]);
    const happiness = parseFloat(entry["Happiness Score Index"]);

    if (isNaN(inflation) || isNaN(happiness)) return;

    const color = getColorByInflation(inflation).toLowerCase();

    if (activeColorFilters.size > 0) {
      const normalizedColor = color.toLowerCase();
      const isColorSelected = Array.from(activeColorFilters).some(
        (selectedColor) => selectedColor.toLowerCase() === normalizedColor
      );

      if (!isColorSelected) {
        cell.style.transition = "opacity 0.6s ease, transform 0.6s ease";
        cell.style.opacity = "0";
        cell.style.transform = "scale(0.8)";
        return;
      }
    }

    cell.style.transition =
      "opacity 0.6s ease, transform 0.6s ease, background-color 0.6s ease, border-color 0.6s ease";
    cell.style.opacity = "1";
    cell.style.transform = "scale(1)";

    cell.dataset.inflation = inflation.toFixed(2);

    if (happiness >= 7.5) {
      cell.style.backgroundColor = "#05E0E9";
      cell.style.border = "none";
    } else {
      cell.style.backgroundColor = "transparent";
      cell.style.border = `${getStrokeWidthByHappiness(
        happiness
      )}px solid ${color}`;
    }
  });
}
