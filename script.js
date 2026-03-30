const modeToggle = document.getElementById("modeToggle");
const rotatingLine = document.getElementById("rotatingLine");
const revealItems = document.querySelectorAll(".reveal");
const navLinks = document.querySelectorAll('.menu a[href^="#"]');
const tabs = document.querySelectorAll(".tab");
const cards = document.querySelectorAll(".card");
const metricValues = document.querySelectorAll(".metrics h2");
const messageForm = document.getElementById("messageForm");
const messageStatus = document.getElementById("messageStatus");
const leetcodeStatsNode = document.getElementById("leetcodeStats");
const codechefStatsNode = document.getElementById("codechefStats");
const problemsSolvedCountNode = document.getElementById("problemsSolvedCount");

let solvedFromLeetCode = null;
let solvedFromCodeChef = null;

const rotatingMessages = [
  "Now building: Kiosk software startup concept",
  "Now learning: Full-stack architecture patterns",
  "Open to: Collaborations in retail and food-tech"
];

function initializeTheme() {
  const saved = localStorage.getItem("site-mode");
  if (saved !== "light") {
    document.body.classList.add("dark");
  }
}

function toggleThemeMode() {
  document.body.classList.toggle("dark");
  const active = document.body.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem("site-mode", active);
}

function startLineRotation() {
  let index = 0;

  if (!rotatingLine) {
    return;
  }

  rotatingLine.textContent = rotatingMessages[0];

  setInterval(() => {
    index = (index + 1) % rotatingMessages.length;
    rotatingLine.textContent = rotatingMessages[index];
  }, 2300);
}

function setupRevealAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach((item, index) => {
    const stagger = Math.min(index * 70, 420);
    item.style.setProperty("--reveal-delay", `${stagger}ms`);
    observer.observe(item);
  });
}

function setupWorkTabs() {
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const selected = tab.dataset.tab;

      tabs.forEach((btn) => btn.classList.remove("active"));
      tab.classList.add("active");

      cards.forEach((card) => {
        const type = card.dataset.type;
        const visible = selected === "all" || selected === type;
        card.style.display = visible ? "block" : "none";

        if (visible) {
          card.classList.remove("card-pop");
          requestAnimationFrame(() => card.classList.add("card-pop"));
        }
      });
    });
  });
}

function setupScrollSpy() {
  const sectionElements = Array.from(navLinks)
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (!sectionElements.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const id = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
          const isActive = link.getAttribute("href") === `#${id}`;
          link.classList.toggle("active", isActive);
        });
      });
    },
    {
      threshold: 0.45,
      rootMargin: "-20% 0px -45% 0px"
    }
  );

  sectionElements.forEach((section) => observer.observe(section));
}

function animateMetrics() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const target = Number(entry.target.dataset.target);
        if (!Number.isFinite(target) || target <= 0) {
          observer.unobserve(entry.target);
          return;
        }
        const suffix = Object.prototype.hasOwnProperty.call(entry.target.dataset, "suffix")
          ? entry.target.dataset.suffix
          : (target === 100 ? "%" : "+");
        let current = 0;
        const step = Math.max(1, Math.ceil(target / 40));

        const tick = setInterval(() => {
          current += step;
          if (current >= target) {
            entry.target.textContent = `${target}${suffix}`;
            clearInterval(tick);
            return;
          }
          entry.target.textContent = current.toString();
        }, 28);

        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.35 }
  );

  metricValues.forEach((node) => observer.observe(node));
}

function refreshSolvedProblemsTotal() {
  if (!problemsSolvedCountNode) {
    return;
  }

  const total = (Number.isFinite(solvedFromLeetCode) ? solvedFromLeetCode : 0)
    + (Number.isFinite(solvedFromCodeChef) ? solvedFromCodeChef : 0);

  if (total > 0) {
    problemsSolvedCountNode.textContent = `${total}+`;
    problemsSolvedCountNode.dataset.target = String(total);
  }
}

function setupFormValidation() {
  if (!messageForm || !messageStatus) {
    return;
  }

  messageForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(messageForm);
    const fullName = data.get("fullName")?.toString().trim();
    const emailAddress = data.get("emailAddress")?.toString().trim();
    const projectType = data.get("projectType")?.toString().trim();
    const details = data.get("details")?.toString().trim();

    if (!fullName || !emailAddress || !projectType || !details) {
      messageStatus.textContent = "Please complete all fields before submitting.";
      return;
    }

    messageStatus.textContent = "Message received. I will respond soon.";
    messageForm.reset();
  });
}

async function fetchJsonWithFallback(urlList) {
  for (const url of urlList) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        continue;
      }
      return await response.json();
    } catch (_error) {
      // Continue to next endpoint.
    }
  }
  return null;
}

async function loadLeetCodeStats() {
  if (!leetcodeStatsNode) {
    return;
  }

  const endpoints = [
    "https://alfa-leetcode-api.onrender.com/Smazh",
    "https://api.allorigins.win/raw?url=https%3A%2F%2Falfa-leetcode-api.onrender.com%2FSmazh",
    "https://leetcode-stats-api.herokuapp.com/Smazh"
  ];

  const data = await fetchJsonWithFallback(endpoints);
  if (!data) {
    leetcodeStatsNode.textContent = "Stats currently unavailable. Visit profile for latest numbers.";
    return;
  }

  const totalSolved = data.totalSolved ?? data.total_solved ?? data.solvedProblem ?? data.solved_problem;
  const easySolved = data.easySolved ?? data.easy_solved;
  const mediumSolved = data.mediumSolved ?? data.medium_solved;
  const hardSolved = data.hardSolved ?? data.hard_solved;

  if (typeof totalSolved === "number") {
    solvedFromLeetCode = totalSolved;
    refreshSolvedProblemsTotal();
    leetcodeStatsNode.textContent = `Solved ${totalSolved} problems (${easySolved ?? "-"}E / ${mediumSolved ?? "-"}M / ${hardSolved ?? "-"}H)`;
  } else {
    leetcodeStatsNode.textContent = "Profile connected. Open LeetCode link for latest detailed stats.";
  }
}

async function loadCodeChefStats() {
  if (!codechefStatsNode) {
    return;
  }

  const endpoints = [
    "https://codechef-api.vercel.app/handle/smazh",
    "https://api.allorigins.win/raw?url=https%3A%2F%2Fcodechef-api.vercel.app%2Fhandle%2Fsmazh"
  ];

  const data = await fetchJsonWithFallback(endpoints);
  if (!data) {
    codechefStatsNode.textContent = "Stats currently unavailable. Visit profile for latest numbers.";
    return;
  }

  const currentRating = data.currentRating ?? data.current_rating;
  const highestRating = data.highestRating ?? data.highest_rating;
  const stars = data.stars ?? data.ratingNumber ?? data.rating_number;
  const codeChefSolved =
    data.problemsSolved
    ?? data.problems_solved
    ?? data.fullySolved
    ?? data.fully_solved
    ?? data.totalProblemsSolved
    ?? data.total_problems_solved;

  if (typeof codeChefSolved === "number") {
    solvedFromCodeChef = codeChefSolved;
    refreshSolvedProblemsTotal();
  }

  if (currentRating || highestRating || stars) {
    const solvedText = typeof codeChefSolved === "number" ? ` | Solved ${codeChefSolved}` : "";
    codechefStatsNode.textContent = `Rating ${currentRating ?? "-"} | Highest ${highestRating ?? "-"} | Stars ${stars ?? "-"}${solvedText}`;
  } else {
    codechefStatsNode.textContent = "Profile connected. Open CodeChef link for latest detailed stats.";
  }
}

initializeTheme();
setupRevealAnimations();
setupWorkTabs();
animateMetrics();
setupFormValidation();
startLineRotation();
setupScrollSpy();
loadLeetCodeStats();
loadCodeChefStats();

if (modeToggle) {
  modeToggle.addEventListener("click", toggleThemeMode);
}
