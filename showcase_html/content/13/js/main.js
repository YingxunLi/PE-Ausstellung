let data = DATA;

// Global variables to track current sort state
let currentGlobalSort = "default";
let currentGlobalSortType = null; // "le", "alcohol", "income", or null

// Track if this is the initial page load
let isInitialLoad = true;

const map = document.getElementById("map");
const slider = document.getElementById("yearSlider");
const yearLabel = document.getElementById("yearLabel");
const tooltip = document.getElementById("tooltip");

let currentView = "bubble"; // bubble or grid
let gridMode = null; // 'top' or 'bottom' or null

let colorScale = chroma.scale(['white','#FFEF74','#FFD829','#FFA100', '#FF5900']).domain([35, 95]);


function renderGrid() {
  yearLabel.textContent = "2000–2015";
  map.innerHTML = "";
  // No gridMode filtering, render all countries
  const years = Object.keys(data);
  const countrySet = new Set();
  for (const year of years) {
    for (const country in data[year]) {
      countrySet.add(country);
    }
  }
  const countries = Array.from(countrySet);
  for (const country of countries) {
    const col = document.createElement("div");
    col.className = "country-column";

    const line = document.createElement("div");
    line.className = "vertical-line";

    for (let i = 0; i < years.length; i++) {
      const year = years[i];
      const entry = data[year][country];
      if (!entry) continue;

      const size = g.map(entry.lifeExpectancy, 10, 90, 2, 20);
      const circle = document.createElement("div");
      circle.className = "circle";
      circle.style.width = circle.style.height = size + "px";
      circle.style.bottom = (i * 200) + "px";
      circle.style.left = "-20px";

      circle.addEventListener("mouseenter", () => {
        tooltip.classList.remove("hidden");
        tooltip.innerHTML = `
          <strong>${country}</strong><br/>
          Year: ${year}<br/>
          Life Expectancy: ${entry.lifeExpectancy}<br/>
          Income: ${entry.income}<br/>
          Alcohol: ${entry.alcohol}<br/>
          Healthcare: ${entry.healthcare}<br/>
          Schooling: ${entry.schooling}
        `;
      });
      circle.addEventListener("mousemove", (e) => {
        tooltip.style.left = (e.pageX + 10) + "px";
        tooltip.style.top = (e.pageY + 10) + "px";
      });
      circle.addEventListener("mouseleave", () => {
        tooltip.classList.add("hidden");
      });

      line.appendChild(circle);
    }

    const label = document.createElement("div");
    label.className = "country-label";
    label.textContent = country.slice(0, 2).toUpperCase();

    col.appendChild(line);
    col.appendChild(label);
    map.appendChild(col);
  }
}

slider.addEventListener("input", () => {
  if (!gridMode) {
    yearLabel.textContent = slider.value;
    renderYear(slider.value);
  }
});

function getPosition(country) {
  let result = gmynd.findFirstByValue(countryLonLat, "Country", country);
  if (!result) {
    console.warn(`No position found for country: ${country}`);
    return [0, 0]; // Default position if not found
  }
  if (result.Longitude < -150) {
    result.Longitude += 360; // Adjust for longitude wrap-around
  }
  let x = gmynd.map(result.Longitude, -180, 180, 50, window.innerWidth-200);
  let y = gmynd.map(result.Latitude, 90, -90, 50, window.innerHeight-50);
  return [x, y];
}

function renderYear(year) {
  const yearData = data[year];
  const existingCircles = map.querySelectorAll('.circle');
  const isInitialRender = existingCircles.length === 0;
  
  if (isInitialRender) {
    // Create new circles for initial render
    for (const country in yearData) {
      const entry = yearData[country];
      const [x, y] = getPosition(country);
      
      const size = g.map(entry.lifeExpectancy, 40, 90, 5, 50);

      const circle = document.createElement("div");
      circle.dataset.exp = entry.lifeExpectancy;
      circle.dataset.country = country;
      circle.className = "circle";
      
      if (isInitialLoad) {
        // Only animate on initial page load
        const initialSize = 5; // Small initial size
        
        // Start with small white circles
        circle.style.backgroundColor = "white";
        circle.style.width = circle.style.height = initialSize + "px";
        circle.style.left = (x - initialSize / 2) + "px";
        circle.style.top = (y - initialSize / 2) + "px";
        // Set a longer transition for initial animation
        circle.style.transition = "width 3s cubic-bezier(0.4, 0, 0.2, 1), height 3s cubic-bezier(0.4, 0, 0.2, 1), left 3s cubic-bezier(0.4, 0, 0.2, 1), top 3s cubic-bezier(0.4, 0, 0.2, 1), background-color 3s cubic-bezier(0.4, 0, 0.2, 1)";

        // Animate to final state after a delay
        setTimeout(() => {
          circle.style.backgroundColor = colorScale(entry.lifeExpectancy).hex();
          circle.style.width = circle.style.height = size + "px";
          circle.style.left = (x - size / 2) + "px";
          circle.style.top = (y - size / 2) + "px";
          // After animation, revert to normal transition for year changes
          setTimeout(() => {
            circle.style.transition = "width 0.8s cubic-bezier(0.4, 0, 0.2, 1), height 0.8s cubic-bezier(0.4, 0, 0.2, 1), left 0.8s cubic-bezier(0.4, 0, 0.2, 1), top 0.8s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
          }, 5000);
        }, 2000);
      } else {
        // Direct rendering for subsequent years/views
        circle.style.backgroundColor = colorScale(entry.lifeExpectancy).hex();
        circle.style.width = circle.style.height = size + "px";
        circle.style.left = (x - size / 2) + "px";
        circle.style.top = (y - size / 2) + "px";
      }

      circle.addEventListener("mouseenter", () => {
        tooltip.classList.remove("hidden");
        tooltip.innerHTML = `
          <strong>${country}</strong><br/>
          Life Expectancy: ${entry.lifeExpectancy}<br/>
          Income: ${entry.income}<br/>
          Alcohol: ${entry.alcohol}<br/>
          Healthcare: ${entry.healthcare}<br/>
          Schooling: ${entry.schooling}
        `;
      });

      circle.addEventListener("mousemove", (e) => {
        tooltip.style.left = (e.pageX + 10) + "px";
        tooltip.style.top = (e.pageY + 10) + "px";
      });

      circle.addEventListener("mouseleave", () => {
        tooltip.classList.add("hidden");
      });

      map.appendChild(circle);
    }
  } else {
    // Update existing circles with new data
    for (const country in yearData) {
      const entry = yearData[country];
      const [x, y] = getPosition(country);
      
      const size = g.map(entry.lifeExpectancy, 40, 90, 5, 50);
      
      const existingCircle = map.querySelector(`[data-country="${country}"]`);
      if (existingCircle) {
        // Update the circle's data and animate to new size
        existingCircle.dataset.exp = entry.lifeExpectancy;
        
        // Update color and animate to new size immediately
        existingCircle.style.backgroundColor = colorScale(entry.lifeExpectancy).hex();
        existingCircle.style.width = existingCircle.style.height = size + "px";
        existingCircle.style.left = (x - size / 2) + "px";
        existingCircle.style.top = (y - size / 2) + "px";
        
        // Update tooltip data
        existingCircle.onmouseenter = () => {
          tooltip.classList.remove("hidden");
          tooltip.innerHTML = `
            <strong>${country}</strong><br/>
            Life Expectancy: ${entry.lifeExpectancy}<br/>
            Income: ${entry.income}<br/>
            Alcohol: ${entry.alcohol}<br/>
            Healthcare: ${entry.healthcare}<br/>
            Schooling: ${entry.schooling}
          `;
        };
      }
    }
  }
  
  // Mark that initial load is complete
  if (isInitialLoad) {
    isInitialLoad = false;
  }
}

// Remove dynamic creation of playPauseBtn and controls
const playPauseBtn = document.getElementById("playPauseBtn");
playPauseBtn.textContent = '▶';

let isPlaying = false;
let playInterval = null;

playPauseBtn.addEventListener("click", () => {
  if (isPlaying) {
    clearInterval(playInterval);
    playPauseBtn.textContent = '▶';
    isPlaying = false;
  } else {
    playPauseBtn.textContent = '❚❚';
    isPlaying = true;
    playInterval = setInterval(() => {
      let nextYear = Number(slider.value) + 1;
      if (nextYear > Number(slider.max)) {
        nextYear = Number(slider.min);
      }
      slider.value = nextYear;
      yearLabel.textContent = slider.value;
      // Update the appropriate visualization based on what's currently displayed
      if (!dualBarChart.classList.contains("hidden")) {
        // Dual bar chart is visible, update it based on type
        if (dualBarChart.dataset.type === "income") {
          renderDualBarChartIncome();
        } else {
          renderDualBarChart();
        }
      } else {
        // Map is visible, update it
        renderYear(slider.value);
      }
    }, 1000); // Adjust speed as needed
  }
});

renderYear(slider.value);

// Function to count countries per year
function countCountriesPerYear() {
    const years = Object.keys(data);
    console.log("Number of countries per year:");
    years.forEach(year => {
        const countryCount = Object.keys(data[year]).length;
        console.log(`${year}: ${countryCount} countries`);
    });
}

// Call the function to see the distribution
countCountriesPerYear();

const leAlcoholButton = document.getElementById("leAlcoholButton");
const leIncomeButton = document.getElementById("leIncomeButton");
const dualBarChart = document.getElementById("dualBarChart");
const leMapButton = document.getElementById("leMapButton");

// Utility to set active class for main view buttons
function setActiveMainButton(activeId) {
    ["leAlcoholButton", "leIncomeButton", "leMapButton"].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.toggle("active", id === activeId);
    });
}

leAlcoholButton.addEventListener("click", () => {
  setActiveMainButton("leAlcoholButton");
  console.log("Switching to dual bar chart view (alcohol)");
    map.style.display = "none";
    dualBarChart.classList.remove("hidden");
    renderDualBarChart();
});

leIncomeButton.addEventListener("click", () => {
  setActiveMainButton("leIncomeButton");
  console.log("Switching to dual bar chart view (income)");
    map.style.display = "none";
    dualBarChart.classList.remove("hidden");
    renderDualBarChartIncome();
});

leMapButton.addEventListener("click", () => {
  setActiveMainButton("leMapButton");
  dualBarChart.classList.add("hidden");
  dualBarChart.innerHTML = "";
  map.style.display = "block";
  renderYear(slider.value);
});

slider.addEventListener("input", () => {
    yearLabel.textContent = slider.value;
    if (!dualBarChart.classList.contains("hidden")) {
        // Determine which chart to render based on last button pressed
        if (dualBarChart.dataset.type === "income") {
            renderDualBarChartIncome();
        } else {
            renderDualBarChart();
        }
    }
});

function renderDualBarChart() {
    // Only clear if switching from a different chart type
    if (dualBarChart.dataset.type !== "alcohol") {
        dualBarChart.innerHTML = "";
    }
    dualBarChart.dataset.type = "alcohol";
    const year = slider.value;
    const countries = Object.keys(data[year]);

    // Determine max for scaling
    let maxLE = 0;
    let maxAlcohol = 0;
    countries.forEach(country => {
        const entry = data[year][country];
        if (entry) {
            if (entry.lifeExpectancy > maxLE) maxLE = entry.lifeExpectancy;
            if (entry.alcohol > maxAlcohol) maxAlcohol = entry.alcohol;
        }
    });

    // Create sort buttons only if they don't exist
    let sortButtonsContainer = dualBarChart.querySelector('.sort-buttons-container');
    if (!sortButtonsContainer) {
        sortButtonsContainer = document.createElement("div");
        sortButtonsContainer.className = "sort-buttons-container";
        sortButtonsContainer.style.position = "fixed";
        sortButtonsContainer.style.bottom = "30px";
        sortButtonsContainer.style.right = "20px";
        sortButtonsContainer.style.display = "flex";
        sortButtonsContainer.style.gap = "8px";
        sortButtonsContainer.style.zIndex = "2001";
        dualBarChart.appendChild(sortButtonsContainer);
    }

    // Clear existing buttons and recreate them
    sortButtonsContainer.innerHTML = "";

    const leSortBtn = document.createElement("button");
    leSortBtn.textContent = "LE";
    leSortBtn.classList.add("sort-le");
    leSortBtn.style.padding = "8px 12px";
    leSortBtn.style.fontSize = "0.9em";
    leSortBtn.style.borderRadius = "4px";
    leSortBtn.style.border = "1px solid white";
    leSortBtn.style.background = "none";
    leSortBtn.style.color = "white";
    leSortBtn.style.cursor = "pointer";

    const alcoholSortBtn = document.createElement("button");
    alcoholSortBtn.textContent = "A";
    alcoholSortBtn.classList.add("sort-a");
    alcoholSortBtn.style.padding = "8px 12px";
    alcoholSortBtn.style.fontSize = "0.9em";
    alcoholSortBtn.style.borderRadius = "4px";
    alcoholSortBtn.style.border = "1px solid white";
    alcoholSortBtn.style.background = "none";
    alcoholSortBtn.style.color = "white";
    alcoholSortBtn.style.cursor = "pointer";

    const abcSortBtn = document.createElement("button");
    abcSortBtn.textContent = "ABC";
    abcSortBtn.classList.add("sort-abc");
    abcSortBtn.style.padding = "8px 12px";
    abcSortBtn.style.fontSize = "0.9em";
    abcSortBtn.style.borderRadius = "4px";
    abcSortBtn.style.border = "1px solid white";
    abcSortBtn.style.background = "none";
    abcSortBtn.style.color = "white";
    abcSortBtn.style.cursor = "pointer";

    sortButtonsContainer.appendChild(leSortBtn);
    sortButtonsContainer.appendChild(alcoholSortBtn);
    sortButtonsContainer.appendChild(abcSortBtn);

    let currentSort = currentGlobalSort;
    let sortedCountries = [...countries];

    function renderSortedCountries() {
        // Check if we need to create new rows or update existing ones
        const existingRows = dualBarChart.querySelectorAll('.country-row');
        const isInitialRender = existingRows.length === 0;

        if (isInitialRender) {
            // Create new rows for initial render
            sortedCountries.forEach(country => {
                const entry = data[year][country];
                if (!entry) return;

                const row = document.createElement("div");
                row.className = "country-row";
                row.dataset.country = country;

                const countryLabel = document.createElement("div");
                countryLabel.className = "country-label";
                countryLabel.textContent = country.slice(0, 2).toUpperCase();
                countryLabel.style.marginRight = "8px";
                countryLabel.style.fontSize = "0.7em";
                countryLabel.style.minWidth = "20px";

                const leBar = document.createElement("div");
                leBar.className = "le-bar";
                leBar.style.width = "0px";
                leBar.style.backgroundColor = colorScale(entry.lifeExpectancy).hex();

                const alcoholBar = document.createElement("div");
                alcoholBar.className = "alcohol-bar";
                alcoholBar.style.width = "0px";

                const barLeft = document.createElement("div");
                barLeft.className = "bar-left";
                barLeft.appendChild(leBar);

                const barRight = document.createElement("div");
                barRight.className = "bar-right";
                barRight.appendChild(alcoholBar);

                row.appendChild(barLeft);
                row.appendChild(countryLabel);
                row.appendChild(barRight);

                // Animate bars to their final widths
                setTimeout(() => {
                    const availableWidth = (185 - 20 - 60 - 0) * 0.9;
                    const leWidth = g.map(entry.lifeExpectancy, 0, maxLE, 0, availableWidth);
                    const alcoholWidth = g.map(entry.alcohol, 0, maxAlcohol, 0, 60 * 0.9);
                    leBar.style.width = leWidth + "px";
                    alcoholBar.style.width = alcoholWidth + "px";
                }, 50);

                row.addEventListener("mouseenter", () => {
                    tooltip.classList.remove("hidden");
                    tooltip.innerHTML = `
                        <strong>${country}</strong><br/>
                        Year: ${year}<br/>
                        Life Expectancy: ${entry.lifeExpectancy}<br/>
                        Alcohol Consumption: ${entry.alcohol}
                    `;
                });

                row.addEventListener("mousemove", (e) => {
                    tooltip.style.left = (e.pageX + 10) + "px";
                    tooltip.style.top = (e.pageY + 10) + "px";
                });

                row.addEventListener("mouseleave", () => {
                    tooltip.classList.add("hidden");
                });

                dualBarChart.appendChild(row);
            });
        } else {
            // Reorder existing rows based on new sort order
            const existingRows = dualBarChart.querySelectorAll('.country-row');
            const sortButtonsContainer = dualBarChart.querySelector('.sort-buttons-container');
            
            // Store rows in a map for easy access
            const rowMap = new Map();
            existingRows.forEach(row => {
                const country = row.dataset.country;
                rowMap.set(country, row);
                row.remove();
            });
            
            // Re-add rows in the new order
            sortedCountries.forEach(country => {
                const entry = data[year][country];
                if (!entry) return;

                const existingRow = rowMap.get(country);
                if (existingRow) {
                    // Re-append the row to maintain the new order
                    dualBarChart.appendChild(existingRow);
                    
                    // Update the data if needed
                    const leBar = existingRow.querySelector('.le-bar');
                    const alcoholBar = existingRow.querySelector('.alcohol-bar');
                    
                    if (leBar && alcoholBar) {
                        const availableWidth = (185 - 20 - 60 - 0) * 0.9;
                        const leWidth = g.map(entry.lifeExpectancy, 0, maxLE, 0, availableWidth);
                        const alcoholWidth = g.map(entry.alcohol, 0, maxAlcohol, 0, 60 * 0.9);
                        
                        // Update colors and animate to new widths
                        leBar.style.backgroundColor = colorScale(entry.lifeExpectancy).hex();
                        
                        // Animate to new widths with a small delay to ensure smooth transition
                        setTimeout(() => {
                            leBar.style.width = leWidth + "px";
                            alcoholBar.style.width = alcoholWidth + "px";
                        }, 10);
                        
                        // Update tooltip data
                        existingRow.onmouseenter = () => {
                            tooltip.classList.remove("hidden");
                            tooltip.innerHTML = `
                                <strong>${country}</strong><br/>
                                Year: ${year}<br/>
                                Life Expectancy: ${entry.lifeExpectancy}<br/>
                                Alcohol Consumption: ${entry.alcohol}
                            `;
                        };
                    }
                }
            });
            
            // Re-add the sort buttons container at the end
            if (sortButtonsContainer) {
                dualBarChart.appendChild(sortButtonsContainer);
            }
        }
    }

    let sortBtns = [leSortBtn, alcoholSortBtn, abcSortBtn];

    leSortBtn.addEventListener("click", () => {
        setActiveSortButton(leSortBtn, sortBtns);
        if (currentSort === "le") {
            // Toggle to reverse order
            sortedCountries.reverse();
        } else {
            // Sort by Life Expectancy (highest to lowest)
            sortedCountries = countries.sort((a, b) => data[year][b].lifeExpectancy - data[year][a].lifeExpectancy);
            currentSort = "le";
            currentGlobalSort = "le";
            currentGlobalSortType = "le";
        }
        renderSortedCountries();
    });

    alcoholSortBtn.addEventListener("click", () => {
        setActiveSortButton(alcoholSortBtn, sortBtns);
        if (currentSort === "alcohol") {
            // Toggle to reverse order
            sortedCountries.reverse();
        } else {
            // Sort by Alcohol Consumption (highest to lowest)
            sortedCountries = countries.sort((a, b) => data[year][b].alcohol - data[year][a].alcohol);
            currentSort = "alcohol";
            currentGlobalSort = "alcohol";
            currentGlobalSortType = "alcohol";
        }
        renderSortedCountries();
    });

    abcSortBtn.addEventListener("click", () => {
        setActiveSortButton(abcSortBtn, sortBtns);
        if (currentSort === "abc") {
            // Toggle to reverse order
            sortedCountries.reverse();
        } else {
            // Sort alphabetically by country name
            sortedCountries = countries.sort((a, b) => a.localeCompare(b));
            currentSort = "abc";
            currentGlobalSort = "abc";
            currentGlobalSortType = "abc";
        }
        renderSortedCountries();
    });

    // Apply current global sort if it exists
    if (currentGlobalSortType === "le") {
        sortedCountries = countries.sort((a, b) => data[year][b].lifeExpectancy - data[year][a].lifeExpectancy);
        currentSort = "le";
    } else if (currentGlobalSortType === "alcohol") {
        sortedCountries = countries.sort((a, b) => data[year][b].alcohol - data[year][a].alcohol);
        currentSort = "alcohol";
    } else if (currentGlobalSortType === "abc") {
        sortedCountries = countries.sort((a, b) => a.localeCompare(b));
        currentSort = "abc";
    } else {
        // Initial render - maintain original order
        // Use 2015 as reference year to establish consistent order across all years
        const referenceYear = "2015";
        const referenceCountries = data[referenceYear] ? Object.keys(data[referenceYear]) : [];
        
        // Create consistent order: first use reference year order, then add any new countries
        const consistentOrder = [];
        referenceCountries.forEach(country => {
            if (countries.includes(country)) {
                consistentOrder.push(country);
            }
        });
        
        // Add any countries that exist in current year but not in reference year
        countries.forEach(country => {
            if (!consistentOrder.includes(country)) {
                consistentOrder.push(country);
            }
        });
        
        sortedCountries = consistentOrder;
    }
    
    renderSortedCountries();
}

function renderDualBarChartIncome() {
    // Only clear if switching from a different chart type
    if (dualBarChart.dataset.type !== "income") {
        dualBarChart.innerHTML = "";
    }
    dualBarChart.dataset.type = "income";
    const year = slider.value;
    const countries = Object.keys(data[year]);

    // Determine max for scaling
    let maxLE = 0;
    let maxIncome = 0;
    countries.forEach(country => {
        const entry = data[year][country];
        if (entry) {
            if (entry.lifeExpectancy > maxLE) maxLE = entry.lifeExpectancy;
            if (entry.income > maxIncome) maxIncome = entry.income;
        }
    });

    // Create sort buttons only if they don't exist
    let sortButtonsContainer = dualBarChart.querySelector('.sort-buttons-container');
    if (!sortButtonsContainer) {
        sortButtonsContainer = document.createElement("div");
        sortButtonsContainer.className = "sort-buttons-container";
        sortButtonsContainer.style.position = "fixed";
        sortButtonsContainer.style.bottom = "30px";
        sortButtonsContainer.style.right = "20px";
        sortButtonsContainer.style.display = "flex";
        sortButtonsContainer.style.gap = "8px";
        sortButtonsContainer.style.zIndex = "2001";
        dualBarChart.appendChild(sortButtonsContainer);
    }

    // Clear existing buttons and recreate them
    sortButtonsContainer.innerHTML = "";

    const leSortBtn = document.createElement("button");
    leSortBtn.textContent = "LE";
    leSortBtn.classList.add("sort-le");
    leSortBtn.style.padding = "8px 12px";
    leSortBtn.style.fontSize = "0.9em";
    leSortBtn.style.borderRadius = "4px";
    leSortBtn.style.border = "1px solid white";
    leSortBtn.style.background = "none";
    leSortBtn.style.color = "white";
    leSortBtn.style.cursor = "pointer";

    const incomeSortBtn = document.createElement("button");
    incomeSortBtn.textContent = "I";
    incomeSortBtn.classList.add("sort-i");
    incomeSortBtn.style.padding = "8px 12px";
    incomeSortBtn.style.fontSize = "0.9em";
    incomeSortBtn.style.borderRadius = "4px";
    incomeSortBtn.style.border = "1px solid white";
    incomeSortBtn.style.background = "none";
    incomeSortBtn.style.color = "white";
    incomeSortBtn.style.cursor = "pointer";

    const abcSortBtn = document.createElement("button");
    abcSortBtn.textContent = "ABC";
    abcSortBtn.classList.add("sort-abc");
    abcSortBtn.style.padding = "8px 12px";
    abcSortBtn.style.fontSize = "0.9em";
    abcSortBtn.style.borderRadius = "4px";
    abcSortBtn.style.border = "1px solid white";
    abcSortBtn.style.background = "none";
    abcSortBtn.style.color = "white";
    abcSortBtn.style.cursor = "pointer";

    sortButtonsContainer.appendChild(leSortBtn);
    sortButtonsContainer.appendChild(incomeSortBtn);
    sortButtonsContainer.appendChild(abcSortBtn);

    let currentSort = currentGlobalSort;
    let sortedCountries = [...countries];

    function renderSortedCountries() {
        // Check if we need to create new rows or update existing ones
        const existingRows = dualBarChart.querySelectorAll('.country-row');
        const isInitialRender = existingRows.length === 0;

        if (isInitialRender) {
            // Create new rows for initial render
            sortedCountries.forEach(country => {
                const entry = data[year][country];
                if (!entry) return;

                const row = document.createElement("div");
                row.className = "country-row";
                row.dataset.country = country;

                const countryLabel = document.createElement("div");
                countryLabel.className = "country-label";
                countryLabel.textContent = country.slice(0, 2).toUpperCase();
                countryLabel.style.marginRight = "8px";
                countryLabel.style.fontSize = "0.7em";
                countryLabel.style.minWidth = "20px";

                const leBar = document.createElement("div");
                leBar.className = "le-bar";
                leBar.style.width = "0px";
                leBar.style.backgroundColor = colorScale(entry.lifeExpectancy).hex();

                const incomeBar = document.createElement("div");
                incomeBar.className = "income-bar";
                incomeBar.style.width = "0px";
                incomeBar.style.backgroundColor = "#4CAF50";

                const barLeft = document.createElement("div");
                barLeft.className = "bar-left";
                barLeft.appendChild(leBar);

                const barRight = document.createElement("div");
                barRight.className = "bar-right";
                barRight.appendChild(incomeBar);

                row.appendChild(barLeft);
                row.appendChild(countryLabel);
                row.appendChild(barRight);

                // Animate bars to their final widths
                setTimeout(() => {
                    const availableWidth = (170 - 20 - 60 - 2) * 0.9;
                    const leWidth = g.map(entry.lifeExpectancy, 0, maxLE, 0, availableWidth);
                    const incomeWidth = g.map(entry.income, 0, maxIncome, 0, 60 * 0.9);
                    leBar.style.width = leWidth + "px";
                    incomeBar.style.width = incomeWidth + "px";
                }, 50);

                row.addEventListener("mouseenter", () => {
                    tooltip.classList.remove("hidden");
                    tooltip.innerHTML = `
                        <strong>${country}</strong><br/>
                        Year: ${year}<br/>
                        Life Expectancy: ${entry.lifeExpectancy}<br/>
                        Income: ${entry.income}
                    `;
                });

                row.addEventListener("mousemove", (e) => {
                    tooltip.style.left = (e.pageX + 10) + "px";
                    tooltip.style.top = (e.pageY + 10) + "px";
                });

                row.addEventListener("mouseleave", () => {
                    tooltip.classList.add("hidden");
                });

                dualBarChart.appendChild(row);
            });
        } else {
            // Reorder existing rows based on new sort order
            const existingRows = dualBarChart.querySelectorAll('.country-row');
            const sortButtonsContainer = dualBarChart.querySelector('.sort-buttons-container');
            
            // Store rows in a map for easy access
            const rowMap = new Map();
            existingRows.forEach(row => {
                const country = row.dataset.country;
                rowMap.set(country, row);
                row.remove();
            });
            
            // Re-add rows in the new order
            sortedCountries.forEach(country => {
                const entry = data[year][country];
                if (!entry) return;

                const existingRow = rowMap.get(country);
                if (existingRow) {
                    // Re-append the row to maintain the new order
                    dualBarChart.appendChild(existingRow);
                    
                    // Update the data if needed
                    const leBar = existingRow.querySelector('.le-bar');
                    const incomeBar = existingRow.querySelector('.income-bar');
                    
                    if (leBar && incomeBar) {
                        const availableWidth = (170 - 20 - 60 - 2) * 0.9;
                        const leWidth = g.map(entry.lifeExpectancy, 0, maxLE, 0, availableWidth);
                        const incomeWidth = g.map(entry.income, 0, maxIncome, 0, 60 * 0.9);
                        
                        // Update colors and animate to new widths
                        leBar.style.backgroundColor = colorScale(entry.lifeExpectancy).hex();
                        
                        // Animate to new widths with a small delay to ensure smooth transition
                        setTimeout(() => {
                            leBar.style.width = leWidth + "px";
                            incomeBar.style.width = incomeWidth + "px";
                        }, 10);
                        
                        // Update tooltip data
                        existingRow.onmouseenter = () => {
                            tooltip.classList.remove("hidden");
                            tooltip.innerHTML = `
                                <strong>${country}</strong><br/>
                                Year: ${year}<br/>
                                Life Expectancy: ${entry.lifeExpectancy}<br/>
                                Income: ${entry.income}
                            `;
                        };
                    }
                }
            });
            
            // Re-add the sort buttons container at the end
            if (sortButtonsContainer) {
                dualBarChart.appendChild(sortButtonsContainer);
            }
        }
    }

    let sortBtnsIncome = [leSortBtn, incomeSortBtn, abcSortBtn];

    leSortBtn.addEventListener("click", () => {
        setActiveSortButton(leSortBtn, sortBtnsIncome);
        if (currentSort === "le") {
            // Toggle to reverse order
            sortedCountries.reverse();
        } else {
            // Sort by Life Expectancy (highest to lowest)
            sortedCountries = countries.sort((a, b) => data[year][b].lifeExpectancy - data[year][a].lifeExpectancy);
            currentSort = "le";
            currentGlobalSort = "le";
            currentGlobalSortType = "le";
        }
        renderSortedCountries();
    });

    incomeSortBtn.addEventListener("click", () => {
        setActiveSortButton(incomeSortBtn, sortBtnsIncome);
        if (currentSort === "income") {
            // Toggle to reverse order
            sortedCountries.reverse();
        } else {
            // Sort by Income (highest to lowest)
            sortedCountries = countries.sort((a, b) => data[year][b].income - data[year][a].income);
            currentSort = "income";
            currentGlobalSort = "income";
            currentGlobalSortType = "income";
        }
        renderSortedCountries();
    });

    abcSortBtn.addEventListener("click", () => {
        setActiveSortButton(abcSortBtn, sortBtnsIncome);
        if (currentSort === "abc") {
            // Toggle to reverse order
            sortedCountries.reverse();
        } else {
            // Sort alphabetically by country name
            sortedCountries = countries.sort((a, b) => a.localeCompare(b));
            currentSort = "abc";
            currentGlobalSort = "abc";
            currentGlobalSortType = "abc";
        }
        renderSortedCountries();
    });

    // Apply current global sort if it exists
    if (currentGlobalSortType === "le") {
        sortedCountries = countries.sort((a, b) => data[year][b].lifeExpectancy - data[year][a].lifeExpectancy);
        currentSort = "le";
    } else if (currentGlobalSortType === "income") {
        sortedCountries = countries.sort((a, b) => data[year][b].income - data[year][a].income);
        currentSort = "income";
    } else if (currentGlobalSortType === "abc") {
        sortedCountries = countries.sort((a, b) => a.localeCompare(b));
        currentSort = "abc";
    } else {
        // Initial render - maintain original order
        // Use 2015 as reference year to establish consistent order across all years
        const referenceYear = "2015";
        const referenceCountries = data[referenceYear] ? Object.keys(data[referenceYear]) : [];
        
        // Create consistent order: first use reference year order, then add any new countries
        const consistentOrder = [];
        referenceCountries.forEach(country => {
            if (countries.includes(country)) {
                consistentOrder.push(country);
            }
        });
        
        // Add any countries that exist in current year but not in reference year
        countries.forEach(country => {
            if (!consistentOrder.includes(country)) {
                consistentOrder.push(country);
            }
        });
        
        sortedCountries = consistentOrder;
    }
    
    renderSortedCountries();
}

function setActiveSortButton(activeBtn, allBtns) {
    allBtns.forEach(btn => btn.classList.remove("active"));
    activeBtn.classList.add("active");
}

// Legend interactivity for bubble map
const legendBlocks = document.querySelectorAll('#leLegend .legend-block');
let legendActiveIndex = null;

const legendRanges = [
  {min: 83, max: 95},    // #FF5900
  {min: 71, max: 83},   // #FFA100
  {min: 59, max: 71},   // #FFD829
  {min: 47, max: 59},   // #FFEF74
  {min: 35, max: 47}    // white
];

legendBlocks.forEach((block, i) => {
  block.style.cursor = 'pointer';
  block.addEventListener('click', () => {
    if (legendActiveIndex === i) {
      legendActiveIndex = null;
      legendBlocks.forEach(b => b.classList.remove('active'));
      renderYear(slider.value);
    } else {
      legendActiveIndex = i;
      legendBlocks.forEach((b, j) => b.classList.toggle('active', j === i));
      renderYearFiltered(slider.value, i);
    }
  });
});

function renderYearFiltered(year, legendIndex) {
  map.innerHTML = "";
  const yearData = data[year];
  const range = legendRanges[legendIndex];
  for (const country in yearData) {
    const entry = yearData[country];
    const [x, y] = getPosition(country);
    const size = g.map(entry.lifeExpectancy, 40, 90, 5, 50);
    const color = colorScale(entry.lifeExpectancy).hex();
    if (entry.lifeExpectancy >= range.min && entry.lifeExpectancy < range.max) {
      const circle = document.createElement("div");
      circle.dataset.exp = entry.lifeExpectancy;
      circle.className = "circle";
      circle.style.backgroundColor = color;
      circle.style.width = circle.style.height = size + "px";
      circle.style.left = (x - size / 2) + "px";
      circle.style.top = (y - size / 2) + "px";
      circle.addEventListener("mouseenter", () => {
        tooltip.classList.remove("hidden");
        tooltip.innerHTML = `
          <strong>${country}</strong><br/>
          Life Expectancy: ${entry.lifeExpectancy}<br/>
          Income: ${entry.income}<br/>
          Alcohol: ${entry.alcohol}<br/>
          Healthcare: ${entry.healthcare}<br/>
          Schooling: ${entry.schooling}
        `;
      });
      circle.addEventListener("mousemove", (e) => {
        tooltip.style.left = (e.pageX + 10) + "px";
        tooltip.style.top = (e.pageY + 10) + "px";
      });
      circle.addEventListener("mouseleave", () => {
        tooltip.classList.add("hidden");
      });
      map.appendChild(circle);
    }
  }
}
