/**
 * script.js - Danky Donuts Dynamic Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  initHeroD3Animation();
  initCarousel();
  initVotingSystem();
  initSmoothScrolling();
});

// Mock Donut Database
const BLANK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23d4d4d4'/%3E%3C/svg%3E";

const DONUTS = [
  { id: 'd1', name: 'Classic Glazed', img: BLANK_IMG },
  { id: 'd2', name: 'Strawberry Sprinkle', img: BLANK_IMG },
  { id: 'd3', name: 'Chocolate Frost', img: BLANK_IMG },
  { id: 'd4', name: 'Matcha Magic', img: BLANK_IMG },
  { id: 'd5', name: 'Coconut Dream', img: BLANK_IMG },
  { id: 'd6', name: 'Maple Bacon', img: BLANK_IMG },
  { id: 'd7', name: 'Old Fashioned', img: BLANK_IMG },
  { id: 'd8', name: 'Blueberry Cakie', img: BLANK_IMG },
  { id: 'd9', name: 'Vanilla Bean', img: BLANK_IMG }
];

/* 1. D3.js Drop Down Animation */
function initHeroD3Animation() {
  const container = d3.select("#hero-svg-layer");
  const width = container.node().getBoundingClientRect().width;
  const height = container.node().getBoundingClientRect().height;

  // The 3 shape placeholders from the wireframe
  const shapesData = [
    { x: width * 0.2, y: height * 0.3, rx: -15, scale: 0.8, color: '#333' },
    { x: width * 0.5, y: height * 0.5, rx: 20, scale: 1.1, color: '#222' },
    { x: width * 0.8, y: height * 0.2, rx: -5, scale: 0.9, color: '#111' },
  ];

  const svg = container.append("svg")
    .attr("width", "100%")
    .attr("height", "100%");

  // Add filters for drop shadow
  const defs = svg.append("defs");
  const filter = defs.append("filter").attr("id", "drop-shadow");
  filter.append("feDropShadow").attr("dx", 0).attr("dy", 10).attr("stdDeviation", 15).attr("flood-opacity", 0.3);

  // Bind data and animate
  const rects = svg.selectAll("rect.floating-shape")
    .data(shapesData)
    .enter()
    .append("rect")
    .attr("class", "floating-shape")
    .attr("width", 200)
    .attr("height", 250)
    .attr("rx", 20)
    .attr("fill", d => d.color)
    .attr("x", d => d.x - 100)
    // Start above viewport for drop effect
    .attr("y", -300)
    .attr("transform", d => `rotate(0, ${d.x}, 0)`)
    .style("filter", "url(#drop-shadow)");

  // Transition: drop down, scale and rotate into final position
  rects.transition()
    .duration(1500)
    .ease(d3.easeBounceOut)
    .delay((d, i) => i * 300)
    .attr("y", d => d.y - 125)
    .attr("transform", d => `rotate(${d.rx}, ${d.x}, ${d.y})`)
    // Float pulsing animation loop
    .on("end", function (d) {
      d3.select(this)
        .transition()
        .duration(3000)
        .ease(d3.easeSinInOut)
        .attr("y", d.y - 125 - 15)
        .yoyo(true)
        .repeat(Infinity);
    });

  // Simple recurring transition implementation for d3 v7
  function floatLoop(selection, finalY) {
    selection.transition()
      .duration(2000)
      .ease(d3.easeSinInOut)
      .attr("y", finalY - 20)
      .transition()
      .duration(2000)
      .ease(d3.easeSinInOut)
      .attr("y", finalY)
      .on("end", function () { floatLoop(d3.select(this), finalY); });
  }

  // start floating
  setTimeout(() => {
    rects.each(function (d) {
      floatLoop(d3.select(this), d.y - 125);
    });
  }, 2000);
}

/* 2. Menu Carousel */
function initCarousel() {
  const track = document.getElementById("carousel-track");
  // Render first 3 donuts
  const carouselItems = DONUTS.slice(0, 3);

  carouselItems.forEach((d, index) => {
    const li = document.createElement("li");
    li.classList.add("carousel-item");
    if (index === 1) li.classList.add("active"); // Middle item starts active
    li.innerHTML = `
      <img src="${d.img}" alt="${d.name}" />
      <h4>${d.name}</h4>
    `;
    track.appendChild(li);
  });

  const items = document.querySelectorAll(".carousel-item");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  let activeIdx = 1;

  function updateCarousel() {
    items.forEach((item, idx) => {
      item.classList.remove("active");
      if (idx === activeIdx) {
        item.classList.add("active");
      }
    });
  }

  prevBtn.addEventListener("click", () => {
    activeIdx = activeIdx > 0 ? activeIdx - 1 : 0;
    updateCarousel();
  });

  nextBtn.addEventListener("click", () => {
    activeIdx = activeIdx < items.length - 1 ? activeIdx + 1 : items.length - 1;
    updateCarousel();
  });

  items.forEach((item, idx) => {
    item.addEventListener("click", () => {
      activeIdx = idx;
      updateCarousel();
    })
  });
}

/* 3. Upvote/Downvote System with LocalStorage */
function initVotingSystem() {
  const grid = document.getElementById("favorites-grid");

  // Read votes from localStorage or initialize empty object
  let votes = JSON.parse(localStorage.getItem('dankyDonutVotes')) || {};

  DONUTS.forEach(d => {
    // initialize score to 0 if not present
    if (typeof votes[d.id] === 'undefined') {
      votes[d.id] = { score: 0, userVote: null }; // userVote can be 'up', 'down', or null
    }

    const card = document.createElement("div");
    card.classList.add("donut-card");
    card.innerHTML = `
      <div class="donut-img-container">
        <img src="${d.img}" alt="${d.name}" />
        <button class="vote-btn up ${votes[d.id].userVote === 'up' ? 'active' : ''}">★</button>
      </div>
      <h4>${d.name}</h4>
      <div id="score-${d.id}" class="score-display">${votes[d.id].score} favorited</div>
    `;
    grid.appendChild(card);

    // Event Listeners for the buttons
    const upBtn = card.querySelector(".up");

    upBtn.addEventListener("click", () => handleVote(d.id, upBtn));
  });

  function handleVote(id, upBtn) {
    let currentVote = votes[id].userVote;
    let score = votes[id].score;

    if (currentVote === 'up') {
      // undo vote
      score -= 1;
      votes[id].userVote = null;
      upBtn.classList.remove("active");
    } else {
      // Change to up
      score += (currentVote === 'down' ? 2 : 1); // fallback if they had 'down' stored previously
      votes[id].userVote = 'up';
      upBtn.classList.add("active");
    }

    votes[id].score = score;
    document.getElementById(`score-${id}`).innerText = `${score} favorited`;

    // Persist data
    localStorage.setItem('dankyDonutVotes', JSON.stringify(votes));
  }
}

/* 4. Smooth Scrolling & "Read our story" navigation */
function initSmoothScrolling() {
  const readStoryBtn = document.getElementById("read-story-btn");
  if (readStoryBtn) {
    readStoryBtn.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelector("#about").scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Smooth scroll for all navbar links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    if (anchor.id === "read-story-btn") return;
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}
