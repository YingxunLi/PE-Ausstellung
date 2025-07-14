
let tooltipDiv = null;
function showCustomTooltip(target, text) {
  if (!tooltipDiv) {
    tooltipDiv = document.createElement('div');
    tooltipDiv.className = 'custom-tooltip';
    document.body.appendChild(tooltipDiv);
  }
  tooltipDiv.textContent = text;
  tooltipDiv.classList.add('visible');
  
  const rect = target.getBoundingClientRect();
  const scrollY = window.scrollY || window.pageYOffset;
  const scrollX = window.scrollX || window.pageXOffset;
  tooltipDiv.style.left = (rect.left + rect.width / 2 + scrollX - tooltipDiv.offsetWidth / 2) + 'px';
  tooltipDiv.style.top = (rect.top + scrollY - tooltipDiv.offsetHeight - 10) + 'px';
}

function hideCustomTooltip() {
  if (tooltipDiv) tooltipDiv.classList.remove('visible');
}


let currentTooltipWhite = {};
let currentTooltipBlack = {};
let currentTooltipCaptures = {};
let currentTooltipFigure = {};
let currentTooltipMate = {};

function enableCustomTooltips() {
  document.querySelectorAll('#board > .square').forEach(square => {
    square.addEventListener('mouseenter', function(e) {
      let tooltip = '';
      const squareId = square.dataset.square;
      if (mode === 'openings') {
        
        const countWhite = currentTooltipWhite[squareId] || 0;
        const countBlack = currentTooltipBlack[squareId] || 0;
        tooltip = `${squareId} ⬜ ${countWhite} | ⬛ ${countBlack}`;
      } else if (mode === 'captures') {
        const count = currentTooltipCaptures[squareId] || 0;
        tooltip = `${squareId} – Schläge: ${count}`;
      } else if (mode === 'figure' && selectedFigure) {
        const data = currentTooltipFigure || {};
        const count = data[squareId] || 0;
        tooltip = `${squareId} – Schläge: ${count}`;
      } else if (mode === 'mate') {
        const data = currentTooltipMate || {};
        const count = data[squareId] || 0;
        tooltip = `${squareId} – Matt: ${count}`;
      }
      showCustomTooltip(square, tooltip);
    });
    square.addEventListener('mouseleave', hideCustomTooltip);
    square.addEventListener('mousemove', function(e) {
      if (!tooltipDiv) return;
      const rect = square.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollX = window.scrollX || window.pageXOffset;
      tooltipDiv.style.left = (rect.left + rect.width / 2 + scrollX - tooltipDiv.offsetWidth / 2) + 'px';
      tooltipDiv.style.top = (rect.top + scrollY - tooltipDiv.offsetHeight - 10) + 'px';
    });
  });
}


const origDrawBoard = drawBoard;
drawBoard = function(...args) {
  origDrawBoard.apply(this, args);
  enableCustomTooltips();
};
const board = document.getElementById("board");
const modeButton = document.getElementById("toggle-mode");
const figureButtons = document.querySelectorAll(".figure-button");
const resetButton = document.getElementById("reset-button");
const backButton = document.getElementById("back-button");
const fileLabels = "abcdefgh".split("");
const rankLabels = [8, 7, 6, 5, 4, 3, 2, 1];

let games = [];
let allGames = [];
let mode = "openings";
let selectedFigure = null;
const captureStatsByFigure = { P: {}, N: {}, B: {}, R: {}, Q: {} };
const mateStats = { K: {} };

let filteredMoves;
let nextMoveCounter = 0;

let countsWhite = {};
let countsBlack = {};

let moveHistory = [];




const figureColors = {
  P: "rgba(120, 210, 140, ALPHA)",    
  N: "rgba(120, 180, 255, ALPHA)",   
  B: "rgba(100, 220, 220, ALPHA)",   
  R: "rgba(255, 170, 120, ALPHA)",   
  Q: "rgba(170, 140, 220, ALPHA)",   
};

function clearAllHighlights() {
  document.querySelectorAll(".dataDiv").forEach(el => {
    el.style.backgroundColor = "";
    el.style.width = "";
    el.style.height = "";
  });
}

function enableBoardClicks(enable) {
  document.querySelectorAll("#board > div").forEach(squareDiv => {
    if (enable) {
      squareDiv.style.cursor = "pointer";
      squareDiv.onclick = () => showNextMove(squareDiv.dataset.square, parseInt(squareDiv.dataset.rank));
    } else {
      squareDiv.style.cursor = "default";
      squareDiv.onclick = null;
    }
  });
}

const figureToolbar = document.getElementById("figure-toolbar");

figureToolbar.style.display = "none";

figureButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedFigure = button.dataset.figure;
    mode = "figure";
    modeButton.textContent = "Eröffnungen anzeigen";
    document.getElementById("result-panel").style.display = "none";
    figureToolbar.style.display = "flex";

    clearAllHighlights();
    figureButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    if (selectedFigure === "K") {
      renderKingMateHeatmap(mateStats.K);
    } else {
      renderFigureCaptureHeatmap(captureStatsByFigure[selectedFigure], selectedFigure);
    }
    enableBoardClicks(false); 
  });
});

fetch("games.csv")
  .then((res) => res.text())
  .then((text) => {
    const lines = text.split("\n").slice(1);
    countsWhite = {};
    countsBlack = {};
    const captureCounts = {};
    lines.forEach((line) => {
      const cols = line.split(",");
      const longMoves = cols[16];
      const winner = cols[6];
      const victoryStatus = cols[5];
      if (!longMoves || !winner) return;
      games.push(cols[12].split(" "));

      const moves = longMoves.trim().split(" ");
      const firstMoves = moves.slice(0, 2);

      firstMoves.forEach((move, index) => {
        const match = move.match(/[a-h][1-8]$/);
        if (!match) return;
        const square = match[0];
        if (index === 0) {
          countsWhite[square] = (countsWhite[square] || 0) + 1;
        } else if (index === 1) {
          countsBlack[square] = (countsBlack[square] || 0) + 1;
        }
      });

      moves.forEach((move) => {
        if (move.includes("x")) {
          const figureMatch = move.match(/x[w|b]([PNBRQK])([a-h][1-8])/);
          if (figureMatch) {
            const captured = figureMatch[1];
            const square = figureMatch[2];

            captureCounts[square] = (captureCounts[square] || 0) + 1;
            if (captured !== "K") {
              if (!captureStatsByFigure[captured][square]) {
                captureStatsByFigure[captured][square] = 0;
              }
              captureStatsByFigure[captured][square]++;
            }
          }
        }
      });

      
      if (victoryStatus === "mate") {
        const loser = winner === "white" ? "black" : "white";
        let kingMoves = [];
        if (loser === "white") {
          for (let i = 0; i < moves.length; i += 2) {
            if (moves[i] && moves[i].startsWith("K")) kingMoves.push(moves[i]);
          }
        } else {
          for (let i = 1; i < moves.length; i += 2) {
            if (moves[i] && moves[i].startsWith("K")) kingMoves.push(moves[i]);
          }
        }
        let square = null;
        const lastKingMove = kingMoves.length > 0 ? kingMoves[kingMoves.length - 1] : null;
        if (lastKingMove) {
          const match = lastKingMove.match(/([a-h][1-8])$/);
          if (match) {
            square = match[1];
          }
        }
        
        if (!square) {
          const mateMove = moves.findLast(m => m.includes("#"));
          if (mateMove) {
            const match = mateMove.match(/([a-h][1-8])#?$/);
            if (match) {
              square = match[1];
            }
          }
        }
        if (square) {
          mateStats.K[square] = (mateStats.K[square] || 0) + 1;
        }
      }

      allGames.push({ moves: longMoves, winner });
    });
    resetButton.addEventListener("click", () => {
      
      mode = "openings";
      selectedFigure = null;
      nextMoveCounter = 0;
      filteredMoves = null;

      
      modeButton.textContent = "Schlagzüge anzeigen";
      document.getElementById("result-panel").style.display = "flex";
      figureButtons.forEach((btn) => btn.classList.remove("active"));
      figureToolbar.style.display = "none";

      
      renderHeatmapDual(countsWhite, countsBlack);
      enableBoardClicks(true);
      updateToolbarButtons();
    });
backButton.addEventListener("click", () => {
  if (moveHistory.length === 0) return;

  const lastState = moveHistory.pop();
  filteredMoves = lastState.filteredMoves;
  nextMoveCounter = lastState.nextMoveCounter;

  let countsWhite = {};
  let countsBlack = {};

  if (nextMoveCounter === 0) {
    
    filteredMoves.forEach((game) => {
      const move1 = game[0];
      const move2 = game[1];
      if (move1) {
        const match1 = move1.match(/[a-h][1-8]$/);
        if (match1) {
          const square1 = match1[0];
          countsWhite[square1] = (countsWhite[square1] || 0) + 1;
        }
      }
      if (move2) {
        const match2 = move2.match(/[a-h][1-8]$/);
        if (match2) {
          const square2 = match2[0];
          countsBlack[square2] = (countsBlack[square2] || 0) + 1;
        }
      }
    });
  } else {
    
    filteredMoves.forEach((game) => {
      const nextMove = game[nextMoveCounter];
      if (!nextMove) return;

      const match = nextMove.match(/[a-h][1-8]$/);
      if (!match) return;
      const square = match[0];

      if (nextMoveCounter % 2 === 0) {
        countsWhite[square] = (countsWhite[square] || 0) + 1;
      } else {
        countsBlack[square] = (countsBlack[square] || 0) + 1;
      }
    });
  }

  clearAllHighlights();
  renderHeatmapDual(countsWhite, countsBlack);
});



    drawBoard(countsWhite, countsBlack);

    renderHeatmapDual(countsWhite, countsBlack);

    enableBoardClicks(true); 

    modeButton.addEventListener("click", () => {
      clearAllHighlights();
      if (mode === "openings") {
        renderCaptureHeatmap(captureCounts);
        mode = "captures";
        modeButton.textContent = "Eröffnungen anzeigen";
        document.getElementById("result-panel").style.display = "none";
        enableBoardClicks(false); 
        figureButtons.forEach(btn => btn.classList.remove("active"));
        figureToolbar.style.display = "flex";
        
        moveHistory = [];
        window.clickedSquares = [];
        updateMoveSequenceHeadline();
      } else {
        
        mode = "openings";
        selectedFigure = null;
        nextMoveCounter = 0;
        filteredMoves = null;
        moveHistory = [];
        window.clickedSquares = [];
        modeButton.textContent = "Schlagzüge anzeigen";
        document.getElementById("result-panel").style.display = "flex";
        figureButtons.forEach(btn => btn.classList.remove("active"));
        figureToolbar.style.display = "none";
        renderHeatmapDual(countsWhite, countsBlack);
        enableBoardClicks(true); 
        updateMoveSequenceHeadline();
      }
      updateToolbarButtons();
    });
  });


function drawBoard(whiteData, blackData) {
  board.innerHTML = "";
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const square = fileLabels[f] + rankLabels[r];
      const countWhite = whiteData[square] || 0;
      const countBlack = blackData[square] || 0;

      const div = document.createElement("div");
      const isDark = (f + r) % 2 === 1;
      div.className = "square" + (isDark ? " dark" : "");
      
      div.removeAttribute('title');
      div.dataset.square = square;
      div.dataset.rank = rankLabels[r]; 

      
      const innerDiv = document.createElement("div");
      innerDiv.className = "dataDiv";
      div.appendChild(innerDiv);
      
      innerDiv.removeAttribute('title');
      
      board.appendChild(div);
    }
  }
}

function showNextMove(move, rank) {
  if (mode !== "openings") return; 

moveHistory.push({
  filteredMoves: [...(filteredMoves || games)],
  nextMoveCounter: nextMoveCounter,
});

  if (nextMoveCounter === 0) {
    filteredMoves = games;
    if (rank <= 4) {
      nextMoveCounter = 0; 
    } else {
      nextMoveCounter = 1; 
    }
  }

  filteredMoves = filteredMoves.filter((game) => {
    if (game[nextMoveCounter] === undefined) return false;
    return game[nextMoveCounter].slice(-2) === move;
  });

  let countsWhite = {};
  let countsBlack = {};

  filteredMoves.forEach((game) => {
    const nextMove = game[nextMoveCounter + 2];
    if (nextMove) {
      const match = nextMove.match(/[a-h][1-8]$/);
      if (!match) return;
      const square = match[0];
      if (nextMoveCounter % 2 === 0) {
        countsWhite[square] = (countsWhite[square] || 0) + 1;
      } else {
        countsBlack[square] = (countsBlack[square] || 0) + 1;
      }
    }
  });

  nextMoveCounter += 2;

  clearAllHighlights();
  renderHeatmapDual(countsWhite, countsBlack);
}

function renderHeatmapDual(whiteData, blackData) {
  
  currentTooltipWhite = { ...whiteData };
  currentTooltipBlack = { ...blackData };

  const maxWhite = Math.max(...Object.values(whiteData), 1);
  const maxBlack = Math.max(...Object.values(blackData), 1);

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const square = fileLabels[f] + rankLabels[r];
      const countWhite = whiteData[square] || 0;
      const countBlack = blackData[square] || 0;

      const dataDiv = document.querySelector(`div[data-square="${square}"] > .dataDiv`);
      if (!dataDiv) continue;
      
      dataDiv.parentElement.removeAttribute('title');
      dataDiv.removeAttribute('title');
      
      if (tooltipDiv && tooltipDiv.classList.contains('visible')) {
        const hovered = document.querySelector('#board > .square:hover');
        if (hovered && hovered === dataDiv.parentElement) {
          showCustomTooltip(hovered, `${square} ⬜ ${countWhite} | ⬛ ${countBlack}`);
        }
      }

      
      if (countWhite > 0 && countBlack > 0) {
        const scaledWhite = Math.sqrt(countWhite) / Math.sqrt(maxWhite);
        const scaledBlack = Math.sqrt(countBlack) / Math.sqrt(maxBlack);
        const size = 5 + Math.max(scaledWhite, scaledBlack) * 95;
        const intensity = 0.18 + 0.32 * Math.max(scaledWhite, scaledBlack);
        dataDiv.style.backgroundColor = `rgba(180,180,180,${intensity.toFixed(2)})`;
        dataDiv.style.width = `${size}%`;
        dataDiv.style.height = `${size}%`;
      } else if (countWhite > 0) {
        const scaled = Math.sqrt(countWhite) / Math.sqrt(maxWhite);
        const size = 5 + scaled * 95;
        const alpha = 0.18 + 0.82 * scaled;
        dataDiv.style.backgroundColor = `rgba(120,180,255,${alpha.toFixed(2)})`;
        dataDiv.style.width = `${size}%`;
        dataDiv.style.height = `${size}%`;
      } else if (countBlack > 0) {
        const scaled = Math.sqrt(countBlack) / Math.sqrt(maxBlack);
        const size = 5 + scaled * 95;
        const alpha = 0.18 + 0.82 * scaled;
        dataDiv.style.backgroundColor = `rgba(255,180,90,${alpha.toFixed(2)})`;
        dataDiv.style.width = `${size}%`;
        dataDiv.style.height = `${size}%`;
      } else {
        dataDiv.style.backgroundColor = "";
        dataDiv.style.width = "";
        dataDiv.style.height = "";
      }
    }
  }
}

function renderCaptureHeatmap(captureData) {
  
  currentTooltipCaptures = { ...captureData };

  const max = Math.max(...Object.values(captureData), 1);

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const square = fileLabels[f] + rankLabels[r];
      const count = captureData[square] || 0;
      const dataDiv = document.querySelector(`div[data-square="${square}"] > .dataDiv`);
      if (!dataDiv) continue;

      
      dataDiv.parentElement.removeAttribute('title');
      dataDiv.removeAttribute('title');
      if (tooltipDiv && tooltipDiv.classList.contains('visible')) {
        const hovered = document.querySelector('#board > .square:hover');
        if (hovered && hovered === dataDiv.parentElement) {
          showCustomTooltip(hovered, `${square} – Schläge: ${count}`);
        }
      }

      
      if (count > 0) {
        const scaled = Math.sqrt(count) / Math.sqrt(max);
        const size = 5 + scaled * 95;
        const alpha = 0.3 + 0.7 * scaled;
        dataDiv.style.backgroundColor = `rgba(220, 60, 60, ${alpha.toFixed(2)})`;
        dataDiv.style.width = `${size}%`;
        dataDiv.style.height = `${size}%`;
      } else {
        dataDiv.style.backgroundColor = "";
        dataDiv.style.width = "";
        dataDiv.style.height = "";
      }
    }
  }
}

function renderFigureCaptureHeatmap(data, figure) {
  
  currentTooltipFigure = { ...data };

  const max = Math.max(...Object.values(data), 1);

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const square = fileLabels[f] + rankLabels[r];
      const count = data[square] || 0;
      const dataDiv = document.querySelector(`div[data-square="${square}"] > .dataDiv`);
      if (!dataDiv) continue;

      const scaled = Math.sqrt(count) / Math.sqrt(max);
      const size = scaled * 95;
      const alpha = 0.3 + 0.7 * scaled;

      if (count > 0) {
        let customColor = "rgba(200,200,200,0.5)";
        if (figure === "Q") customColor = `rgba(170, 140, 220, ${alpha.toFixed(2)})`;
        else if (figure === "P") customColor = `rgba(120, 210, 140, ${alpha.toFixed(2)})`;
        else if (figure === "N") customColor = `rgba(120, 180, 255, ${alpha.toFixed(2)})`;
        else if (figure === "B") customColor = `rgba(100, 220, 220, ${alpha.toFixed(2)})`;
        else if (figure === "R") customColor = `rgba(255, 170, 120, ${alpha.toFixed(2)})`;
        dataDiv.style.backgroundColor = customColor;
        dataDiv.style.width = `${size}%`;
        dataDiv.style.height = `${size}%`;
      } else {
        dataDiv.style.backgroundColor = "";
        dataDiv.style.width = "";
        dataDiv.style.height = "";
      }
      
      dataDiv.parentElement.removeAttribute('title');
      dataDiv.removeAttribute('title');
      if (tooltipDiv && tooltipDiv.classList.contains('visible')) {
        const hovered = document.querySelector('#board > .square:hover');
        if (hovered && hovered === dataDiv.parentElement) {
          showCustomTooltip(hovered, `${square} – Schläge: ${count}`);
        }
      }
    }
  }
}


function renderKingMateHeatmap(data) {
  
  currentTooltipMate = { ...data };
  const max = Math.max(...Object.values(data), 1);
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const square = fileLabels[f] + rankLabels[r];
      const count = data[square] || 0;
      const dataDiv = document.querySelector(`div[data-square="${square}"] > .dataDiv`);
      if (!dataDiv) continue;
      const scaled = Math.sqrt(count) / Math.sqrt(max);
      const size = scaled * 95;
      const alpha = 0.35 + 0.65 * scaled;
      if (count > 0) {
        dataDiv.style.backgroundColor = `rgba(255, 222, 89, ${alpha.toFixed(2)})`;
        dataDiv.style.width = `${size}%`;
        dataDiv.style.height = `${size}%`;
      } else {
        dataDiv.style.backgroundColor = "";
        dataDiv.style.width = "";
        dataDiv.style.height = "";
      }
      
      dataDiv.parentElement.removeAttribute('title');
      dataDiv.removeAttribute('title');
      if (tooltipDiv && tooltipDiv.classList.contains('visible')) {
        const hovered = document.querySelector('#board > .square:hover');
        if (hovered && hovered === dataDiv.parentElement) {
          showCustomTooltip(hovered, `${square} – Matt: ${count}`);
        }
      }
    }
  }
}

function updateToolbarButtons() {
  if (mode === "openings") {
    resetButton.style.display = "inline-block";
    backButton.style.display = "inline-block";
  } else {
    resetButton.style.display = "none";
    backButton.style.display = "none";
  }
}


updateToolbarButtons();


function updateMoveSequenceHeadline() {
  const headlineDiv = document.getElementById('move-sequence-headline');
  if (!headlineDiv) return;
  
  if (moveHistory.length === 0) {
    headlineDiv.textContent = '';
    return;
  }
  
  
  
  if (!window.clickedSquares) window.clickedSquares = [];
 
  if (window.clickedSquares.length < moveHistory.length) {
    
    const lastState = moveHistory[moveHistory.length - 1];
    if (lastState && lastState.clickedSquare) {
      window.clickedSquares.push(lastState.clickedSquare);
    }
  } else if (window.clickedSquares.length > moveHistory.length) {
    
    window.clickedSquares = window.clickedSquares.slice(0, moveHistory.length);
  }
  if (window.clickedSquares.length === 0) {
    headlineDiv.textContent = '';
    return;
  }
  headlineDiv.textContent = window.clickedSquares.join(' \u2192 ');
}


const origShowNextMove = showNextMove;
showNextMove = function(move, rank) {
  
  if (!window.clickedSquares) window.clickedSquares = [];
  window.clickedSquares.push(move);
  origShowNextMove.call(this, move, rank);
  updateMoveSequenceHeadline();
};

const origReset = resetButton.onclick;
resetButton.onclick = function() {
  if (origReset) origReset();
  moveHistory = [];
  window.clickedSquares = [];
  updateMoveSequenceHeadline();
};

const origBack = backButton.onclick;
backButton.onclick = function() {
  if (origBack) origBack();
  if (window.clickedSquares && window.clickedSquares.length > 0) {
    window.clickedSquares.pop();
  }
  updateMoveSequenceHeadline();
};


window.clickedSquares = [];
updateMoveSequenceHeadline();