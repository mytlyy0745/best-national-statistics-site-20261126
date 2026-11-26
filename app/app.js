// NationStat app — hash router and views. Plain script, no framework.
// Routes: #/ (rankings), #/country/XX, #/compare, #/about.

const app = document.getElementById("app");

// ---- formatting helpers ----

function commas(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function fmtMoneyShort(dollars) {
  if (dollars >= 1e12) return "$" + (dollars / 1e12).toFixed(2) + "tn";
  if (dollars >= 1e9) return "$" + (dollars / 1e9).toFixed(2) + "bn";
  return "$" + commas(dollars);
}

function fmtValue(ind, value) {
  if (ind.kind === "money") return "$" + commas(value);
  if (ind.kind === "count") return commas(value);
  if (ind.kind === "percent") return value.toFixed(ind.decimals) + "%";
  return value.toFixed(ind.decimals);
}

function fmtAxis(ind, value) {
  if (ind.kind === "money") return fmtMoneyShort(value);
  if (ind.kind === "count") return value >= 1e9 ? (value / 1e9).toFixed(1) + "bn" : commas(value);
  if (ind.kind === "percent") return value.toFixed(0) + "%";
  return String(Math.round(value));
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function countryByCode(code) {
  return COUNTRIES.find((c) => c.code === code) || null;
}

function setActiveNav(name) {
  document.querySelectorAll(".main-nav a").forEach((a) => {
    a.classList.toggle("active", a.dataset.nav === name);
  });
}

// ---- rankings state ----

let rankQuery = "";
let rankRegion = "All";
let rankSort = "population";
let rankDir = -1; // -1 = descending (biggest first)

const RANK_COLUMNS = [
  { id: "population", label: "Population" },
  { id: "gdp", label: "GDP" },
  { id: "gdpPerCapita", label: "GDP per capita" },
  { id: "lifeExpectancy", label: "Life expectancy" },
];

function leaderboard(indId, title, note) {
  const ind = INDICATORS.find((i) => i.id === indId);
  const top = COUNTRIES.slice().sort((a, b) => b.values[indId] - a.values[indId]).slice(0, 5);
  const rows = top.map((c) => {
    // Leaderboards are glanced at, not studied: shorten huge money values.
    const shown = ind.kind === "money" ? fmtMoneyShort(c.values[indId]) : fmtValue(ind, c.values[indId]);
    return "<li>" + c.flag + " <a href=\"#/country/" + c.code + "\">" + esc(c.name) + "</a> <b>" + shown + "</b></li>";
  }).join("");
  return "<div class=\"board\"><h3>" + esc(title) + "</h3><ol>" + rows + "</ol><p class=\"board-note\">" + esc(note) + "</p></div>";
}

function renderRankings() {
  setActiveNav("rankings");
  const chips = REGIONS.map((r) => {
    return "<button class=\"chip\" data-region=\"" + esc(r) + "\" aria-pressed=\"" + (r === rankRegion ? "true" : "false") + "\">" + esc(r) + "</button>";
  }).join("");

  let rows = COUNTRIES.filter((c) => {
    const q = rankQuery.trim().toLowerCase();
    const matchesQ = !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q;
    const matchesR = rankRegion === "All" || c.region === rankRegion;
    return matchesQ && matchesR;
  });
  rows = rows.slice().sort((a, b) => {
    const d = (a.values[rankSort] - b.values[rankSort]) * rankDir;
    return d !== 0 ? d : a.name.localeCompare(b.name);
  });

  const headCells = ["<th>#</th><th>Country</th><th class=\"hide-phone\">Region</th>"].concat(RANK_COLUMNS.map((col) => {
    const sorted = rankSort === col.id ? (rankDir === -1 ? " sorted-desc" : " sorted-asc") : "";
    return "<th class=\"num sortable" + sorted + "\" data-sort=\"" + col.id + "\">" + esc(col.label) + "</th>";
  })).join("");

  const bodyRows = rows.map((c, i) => {
    const cells = RANK_COLUMNS.map((col) => {
      const ind = INDICATORS.find((x) => x.id === col.id);
      return "<td class=\"num\">" + fmtValue(ind, c.values[col.id]) + "</td>";
    }).join("");
    return "<tr><td><span class=\"rank-badge\">" + (i + 1) + "</span></td>" +
      "<td><span class=\"flag\">" + c.flag + "</span><a href=\"#/country/" + c.code + "\">" + esc(c.name) + "</a></td>" +
      "<td class=\"hide-phone\">" + esc(c.region) + "</td>" + cells + "</tr>";
  }).join("");

  const empty = rows.length === 0
    ? "<p>No country matches that search. Try clearing the search box or picking another region.</p>"
    : "";

  app.innerHTML =
    "<h1>How do countries actually compare?</h1>" +
    "<p class=\"lede\">Fifteen countries, nine indicators, all from the World Bank for 2024. " +
    "Search, filter by region, or click a column to re-sort — then open any country for its full story.</p>" +
    "<section class=\"boards\" aria-label=\"Leaderboards\">" +
    leaderboard("population", "Biggest populations", "India passed China in 2023 and keeps pulling away.") +
    leaderboard("gdp", "Biggest economies", "GDP in current US dollars, 2024.") +
    leaderboard("lifeExpectancy", "Longest lives", "Life expectancy at birth, 2024.") +
    "</section>" +
    "<div class=\"toolbar\">" +
    "<input type=\"search\" id=\"rank-search\" placeholder=\"Search a country…\" value=\"" + esc(rankQuery) + "\" aria-label=\"Search countries\">" +
    "<div class=\"chips\" role=\"group\" aria-label=\"Filter by region\">" + chips + "</div>" +
    "</div>" +
    "<div class=\"table-wrap\"><table>" +
    "<thead><tr>" + headCells + "</tr></thead>" +
    "<tbody>" + bodyRows + "</tbody></table></div>" + empty +
    "<p class=\"small\">" + esc(SOURCE_NOTE) + " Click a column header to sort. " +
    "GDP is in current US dollars; GDP per capita divides it by population.</p>";

  document.getElementById("rank-search").addEventListener("input", (e) => {
    rankQuery = e.target.value;
    renderRankings();
    const box = document.getElementById("rank-search");
    box.focus();
    box.setSelectionRange(box.value.length, box.value.length);
  });
  app.querySelectorAll(".chip[data-region]").forEach((chip) => {
    chip.addEventListener("click", () => { rankRegion = chip.dataset.region; renderRankings(); });
  });
  app.querySelectorAll("th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      if (rankSort === th.dataset.sort) rankDir = -rankDir;
      else { rankSort = th.dataset.sort; rankDir = -1; }
      renderRankings();
    });
  });
}

// ---- country page ----

function renderCountry(code) {
  const c = countryByCode(code);
  if (!c) {
    setActiveNav("rankings");
    app.innerHTML = "<h1>Country not found</h1><p>We only track fifteen countries. " +
      "<a href=\"#/\">Back to the rankings</a> to pick one.</p>";
    return;
  }
  setActiveNav("rankings");

  const cards = INDICATORS.map((ind) => {
    return "<div class=\"stat-card\"><div class=\"stat-label\">" + esc(ind.label) + "</div>" +
      "<div class=\"stat-value\">" + fmtValue(ind, c.values[ind.id]) + "</div>" +
      "<div class=\"stat-unit\">" + esc(ind.unit) + " · 2024</div>" +
      "<div class=\"stat-code\">" + esc(ind.code) + "</div></div>";
  }).join("");

  const tableRows = INDICATORS.map((ind) => {
    return "<tr><td>" + esc(ind.label) + "</td><td class=\"num\">" + fmtValue(ind, c.values[ind.id]) + "</td>" +
      "<td class=\"hide-phone\">" + esc(ind.unit) + "</td><td class=\"mono\">" + esc(ind.code) + "</td>" +
      "<td class=\"num hide-phone\">2024</td></tr>";
  }).join("");

  const idx = COUNTRIES.indexOf(c);
  const prev = COUNTRIES[(idx - 1 + COUNTRIES.length) % COUNTRIES.length];
  const next = COUNTRIES[(idx + 1) % COUNTRIES.length];

  const caveatHtml = c.caveat
    ? "<div class=\"callout warn\"><strong>Read this before quoting " + esc(c.name) + "'s GDP.</strong> " + esc(c.caveat) + "</div>"
    : "";

  app.innerHTML =
    "<div class=\"country-head\"><span class=\"flag-big\" aria-hidden=\"true\">" + c.flag + "</span>" +
    "<h1>" + esc(c.name) + "</h1><span class=\"region-tag\">" + esc(c.region) + "</span></div>" +
    "<p class=\"lede\">Nine headline indicators for " + esc(c.name) + " in 2024, with a decade of " +
    "GDP and population behind them. Every figure comes from the World Bank's World Development Indicators.</p>" +
    caveatHtml +
    "<section class=\"stat-grid\" aria-label=\"Headline indicators\">" + cards + "</section>" +
    "<section class=\"chart-pair\">" +
    "<div class=\"chart-card\"><h3>GDP, 2015–2024</h3><p class=\"small\">Current US dollars, billions.</p><canvas id=\"chart-gdp\" height=\"260\" aria-label=\"Line chart of GDP 2015 to 2024\"></canvas></div>" +
    "<div class=\"chart-card\"><h3>Population, 2015–2024</h3><p class=\"small\">Millions of people.</p><canvas id=\"chart-pop\" height=\"260\" aria-label=\"Line chart of population 2015 to 2024\"></canvas></div>" +
    "</section>" +
    "<h2>Every indicator, with its source code</h2>" +
    "<div class=\"table-wrap\"><table><thead><tr><th>Indicator</th><th class=\"num\">Value</th>" +
    "<th class=\"hide-phone\">Unit</th><th>World Bank code</th><th class=\"num hide-phone\">Year</th></tr></thead>" +
    "<tbody>" + tableRows + "</tbody></table></div>" +
    "<p class=\"small\">" + esc(SOURCE_NOTE) + "</p>" +
    "<div class=\"pager\"><a href=\"#/country/" + prev.code + "\">← " + esc(prev.name) + "</a>" +
    "<a href=\"#/compare\">Compare " + esc(c.name) + " with others →</a>" +
    "<a href=\"#/country/" + next.code + "\">" + esc(next.name) + " →</a></div>";

  requestAnimationFrame(() => {
    const gdpCanvas = document.getElementById("chart-gdp");
    const popCanvas = document.getElementById("chart-pop");
    if (gdpCanvas) drawLineChart(gdpCanvas, YEARS.map(String), c.gdp, { formatValue: (v) => shortMoney(v), color: "#0f766e" });
    if (popCanvas) drawLineChart(popCanvas, YEARS.map(String), c.pop, { formatValue: (v) => shortPop(v), color: "#b45309" });
  });
}

// ---- compare page ----

let compareCodes = ["US", "CN", "IN"];
let compareMetric = "gdpPerCapita";

function renderCompare() {
  setActiveNav("compare");
  const metricTabs = INDICATORS.map((ind) => {
    return "<button class=\"chip\" data-metric=\"" + ind.id + "\" aria-pressed=\"" + (ind.id === compareMetric ? "true" : "false") + "\">" + esc(ind.label) + "</button>";
  }).join("");

  const picks = [0, 1, 2, 3].map((slot) => {
    const options = ["<option value=\"\">— none —</option>"].concat(COUNTRIES.map((c) => {
      const sel = compareCodes[slot] === c.code ? " selected" : "";
      return "<option value=\"" + c.code + "\"" + sel + ">" + esc(c.name) + "</option>";
    })).join("");
    return "<select data-slot=\"" + slot + "\" aria-label=\"Country " + (slot + 1) + "\">" + options + "</select>";
  }).join("");

  const picked = compareCodes.filter(Boolean).map(countryByCode).filter(Boolean);
  const ind = INDICATORS.find((i) => i.id === compareMetric);

  let chartHtml = "";
  let tableHtml = "";
  if (picked.length < 2) {
    chartHtml = "<p class=\"compare-note\">Pick at least two countries to compare them.</p>";
  } else {
    const items = picked.map((c, i) => ({ label: c.name, value: c.values[ind.id], color: CHART_COLORS[i % CHART_COLORS.length] }));
    chartHtml = "<div class=\"chart-card\"><h3>" + esc(ind.label) + " — 2024</h3>" +
      "<p class=\"small\">" + esc(ind.blurb) + "</p>" +
      "<canvas id=\"chart-compare\" aria-label=\"Bar chart comparing " + esc(ind.label) + "\"></canvas></div>";

    const rows = INDICATORS.map((rowInd) => {
      const vals = picked.map((c) => c.values[rowInd.id]);
      let bestIdx = -1;
      if (rowInd.higherIsBetter !== null) {
        bestIdx = vals.reduce((best, v, i) => {
          if (best === -1) return i;
          return rowInd.higherIsBetter ? (v > vals[best] ? i : best) : (v < vals[best] ? i : best);
        }, -1);
      }
      const cells = picked.map((c, i) => {
        const star = i === bestIdx ? " <span class=\"star\" title=\"Best of the picked countries\">★</span>" : "";
        return "<td class=\"num\">" + fmtValue(rowInd, c.values[rowInd.id]) + star + "</td>";
      }).join("");
      return "<tr><td>" + esc(rowInd.label) + "</td>" + cells + "</tr>";
    }).join("");

    const head = picked.map((c) => "<th class=\"num\">" + c.flag + " " + esc(c.name) + "</th>").join("");
    tableHtml = "<h2>All nine indicators, side by side</h2>" +
      "<p class=\"small\">★ marks the best value of the picked countries on that row — highest where higher is better, lowest where lower is better (inflation, unemployment). Population and urban share have no “best”.</p>" +
      "<div class=\"table-wrap\"><table><thead><tr><th>Indicator</th>" + head + "</tr></thead><tbody>" + rows + "</tbody></table></div>";
  }

  app.innerHTML =
    "<h1>Compare countries</h1>" +
    "<p class=\"lede\">Pick two to four countries and one metric. The chart shows the metric; " +
    "the table below lines up all nine indicators, with the best value on each row starred.</p>" +
    "<div class=\"pick-row\">" + picks + "</div>" +
    "<div class=\"metric-tabs\" role=\"group\" aria-label=\"Choose a metric\">" + metricTabs + "</div>" +
    chartHtml + tableHtml +
    "<p class=\"small\">" + esc(SOURCE_NOTE) + "</p>";

  app.querySelectorAll("select[data-slot]").forEach((sel) => {
    sel.addEventListener("change", () => {
      compareCodes[Number(sel.dataset.slot)] = sel.value || null;
      renderCompare();
    });
  });
  app.querySelectorAll(".chip[data-metric]").forEach((chip) => {
    chip.addEventListener("click", () => { compareMetric = chip.dataset.metric; renderCompare(); });
  });

  if (picked.length >= 2) {
    requestAnimationFrame(() => {
      const canvas = document.getElementById("chart-compare");
      if (canvas) {
        const items = picked.map((c, i) => ({ label: c.name, value: c.values[ind.id], color: CHART_COLORS[i % CHART_COLORS.length] }));
        drawBarChart(canvas, items, { formatValue: (v) => fmtValue(ind, v) });
      }
    });
  }
}

// ---- about page ----

function renderAbout() {
  setActiveNav("about");
  const defs = INDICATORS.map((ind) => {
    return "<dt>" + esc(ind.label) + " <span class=\"mono\">" + esc(ind.code) + "</span></dt><dd>" + esc(ind.blurb) + " Unit: " + esc(ind.unit) + ".</dd>";
  }).join("");

  app.innerHTML =
    "<h1>About the data</h1>" +
    "<p class=\"lede\">NationStat shows fifteen countries on nine indicators. Everything on this " +
    "site is a real published figure — nothing is estimated, modelled by us, or made up.</p>" +
    "<h2>Where the numbers come from</h2>" +
    "<p>Every figure comes from the World Bank's <strong>World Development Indicators</strong> (WDI), " +
    "fetched from the Bank's open API (api.worldbank.org) on 26 November 2026. All headline values are " +
    "for <strong>2024</strong>, the latest year the Bank publishes for every indicator and country here. " +
    "The GDP and population charts run from <strong>2015 to 2024</strong>. Values are rounded from the " +
    "Bank's published numbers: rates to one or two decimals, GDP per capita to whole dollars, population " +
    "to whole people. Browse the source yourself at " +
    "<a href=\"https://data.worldbank.org\">data.worldbank.org</a>.</p>" +
    "<h2>What each indicator means</h2>" +
    "<dl class=\"definition-list\">" + defs + "</dl>" +
    "<h2>Coverage notes — read before quoting</h2>" +
    "<div class=\"callout warn\"><strong>Nigeria's GDP needs care.</strong> In current US dollars, " +
    "Nigeria's GDP falls from $647bn in 2022 to $252bn in 2024, while its real (constant-price) growth " +
    "stayed positive. That is mostly the naira's sharp depreciation against the dollar, not a collapse " +
    "in output — and the Bank also revised Nigeria's GDP series in 2019, which is why the chart jumps " +
    "that year. Compare Nigeria in dollars with that in mind; its GDP growth rate is the safer guide " +
    "to how its economy actually performed.</div>" +
    "<div class=\"callout\"><strong>Why there is no CO₂ per capita.</strong> The Bank's CO₂ emissions " +
    "per capita indicator (EN.ATM.CO2E.PC) is archived and no longer published with current values, " +
    "so we left it out rather than show a stale number. The nine indicators here all have 2024 values.</div>" +
    "<p>Unemployment is the Bank's <strong>modelled ILO estimate</strong>, not a headcount from a survey — " +
    "it is the best cross-country comparison available, but national definitions still differ. " +
    "China's population peaked in 2021 and has edged down since; India's passed China's in 2023. " +
    "Japan's population has fallen every year of the decade shown.</p>" +
    "<h2>How this site works</h2>" +
    "<p>NationStat is a handful of static files — HTML, CSS and JavaScript, no framework, no build step, " +
    "no database. It makes no network requests at all: every number lives in its own files, so it works " +
    "offline in any modern browser, on a desktop or a phone. The only link that leaves the site is the " +
    "citation to the World Bank above.</p>" +
    "<p class=\"small\">" + esc(SOURCE_NOTE) + "</p>";
}

// ---- router ----

function route() {
  const hash = window.location.hash || "#/";
  const parts = hash.replace(/^#\/?/, "").split("/");
  if (parts[0] === "country" && parts[1]) renderCountry(parts[1].toUpperCase());
  else if (parts[0] === "compare") renderCompare();
  else if (parts[0] === "about") renderAbout();
  else renderRankings();
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", route);
route();
