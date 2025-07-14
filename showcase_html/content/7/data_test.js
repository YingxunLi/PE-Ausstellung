const canvas = document.getElementById("volcanoCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const toggleBtn = document.getElementById("toggleBtn");
const detailView = document.getElementById("detailView");

let view = 1;
let volcanoes = []; // Daten kommen hier rein

// Beispiel-Daten (Dummy – echte später reinladen)
volcanoes = [
  { name: "Etna", lat: 37.75, lon: 14.99, eruptions: [2001, 2005, 2020] },
  { name: "Merapi", lat: -7.54, lon: 110.44, eruptions: [2010, 2021] },
  { name: "Katla", lat: 63.63, lon: -19.05, eruptions: [1918, 2011] }
];

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  volcanoes.forEach((v, i) => {
    const count = v.eruptions.length;
    const size = 10 + count * 5;
    let x, y;

    if (view === 1) {
      x = Math.random() * (canvas.width - size);
      y = Math.random() * (canvas.height - size);
    } else if (view === 2) {
      x = 50 + i * 100;
      y = canvas.height - 100;
    } else if (view === 3) {
      x = ((v.lon + 180) / 360) * canvas.width;
      y = ((90 - v.lat) / 180) * canvas.height;
    }

    ctx.fillStyle = `hsl(${count * 60}, 80%, 60%)`;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();

    v.x = x;
    v.y = y;
    v.size = size;
  });
}

canvas.addEventListener("click", (e) => {
  const x = e.clientX;
  const y = e.clientY;

  volcanoes.forEach(v => {
    const dx = x - v.x;
    const dy = y - v.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < v.size / 2) {
      openDetail(v);
    }
  });
});

function openDetail(v) {
  detailView.style.display = "block";
  detailView.innerHTML = `<h2>${v.name}</h2><p>${v.eruptions.length} Ausbrüche</p>`;
}

toggleBtn.addEventListener("click", () => {
  view = (view % 3) + 1;
  draw();
});

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
});

draw();
