// ════════════════════════════════════════════════════════════════════
//  India Fair Fuel Meter — app.js
//  Features:
//    1. LIVE crude + exchange rate from free public APIs
//    2. Fully working Rockets & Feathers Timeline Simulator
//    3. Animated stacked rupee-split bar
//    4. IOC-themed Chart.js history chart
// ════════════════════════════════════════════════════════════════════

// ── City config: actual pump price (May 2026) + 2019 baseline markup ──
const cityConfig = {
    delhi:     { name: "Delhi",     petrol: 97.85,  diesel: 84.18, pMarkup: 44.77, dMarkup: 37.38 },
    mumbai:    { name: "Mumbai",    petrol: 104.21, diesel: 92.15, pMarkup: 56.40, dMarkup: 45.20 },
    kolkata:   { name: "Kolkata",   petrol: 103.94, diesel: 90.76, pMarkup: 52.40, dMarkup: 43.90 },
    chennai:   { name: "Chennai",   petrol: 100.75, diesel: 92.34, pMarkup: 50.20, dMarkup: 44.40 },
    bangalore: { name: "Bangalore", petrol: 101.94, diesel: 87.89, pMarkup: 51.10, dMarkup: 42.20 },
    hyderabad: { name: "Hyderabad", petrol: 107.41, diesel: 95.65, pMarkup: 57.80, dMarkup: 47.60 },
    pune:      { name: "Pune",      petrol: 104.95, diesel: 91.30, pMarkup: 55.00, dMarkup: 44.70 },
    ahmedabad: { name: "Ahmedabad", petrol: 96.63,  diesel: 82.99, pMarkup: 43.60, dMarkup: 36.41 },
};

// ── State ──
let currentProduct   = "petrol";
let currentCityKey   = "delhi";
let crudeUsd         = 72.0;
let usdInr           = 85.0;
let customActualPrice = null;
let currentMonthlyUsage = 30;
let historyChart     = null;
let liveDataLoaded   = false;

// Fixed cost components (INR/L) — used in stacked bar
const REFINING_COMMISSION = 8.0;  // refining cost + dealer commission (constant)

// ── Bulletin Data: 13 phases covering all 90 months ──
const PHASES = [
    {
        from: 0, to: 11,
        icon: "⚖️", status: "2019 Stable Baseline", cls: "balance",
        headline: "Stable pre-COVID era (Jan–Dec 2019). Crude hovered $60–66/bbl. Retail prices tracked global costs with a moderate but consistent markup. Indian consumers were paying near-fair prices.",
        taxEstimate: 35.0  // avg taxes/L in this phase
    },
    {
        from: 12, to: 13,
        icon: "🌡️", status: "Early COVID Softening", cls: "balance",
        headline: "Jan–Feb 2020: Demand destruction fears push crude to $42/bbl. Retail prices dip slightly. But no big consumer relief — the margin buffer is quietly building in the system.",
        taxEstimate: 35.0
    },
    {
        from: 14, to: 16,
        icon: "🛑", status: "COVID Tax Grab!", cls: "covid",
        headline: "Mar–May 2020: Crude collapses to $20/bbl — the cheapest in 20 years. Instead of relief, the Central Govt HIKES excise duty by ₹13–16/L. The full crude crash is swallowed by the treasury. Consumers get zero benefit.",
        taxEstimate: 53.0
    },
    {
        from: 17, to: 27,
        icon: "🪶", status: "High Excise Windfall Era", cls: "feather",
        headline: "Jun 2020 – Dec 2021: Crude stuck at $40–70 but retail prices frozen high due to record excise duty (₹32.9/L petrol). Excise tax revenue doubles to ₹4.1 Lakh Crore annually. Every common man pays. Every month. Silently.",
        taxEstimate: 52.0
    },
    {
        from: 28, to: 34,
        icon: "🚀", status: "ROCKET HIKE — ₹100 Crossed!", cls: "rocket",
        headline: "Jan–Jul 2022: Crude recovers to $80+. Retail prices shoot up instantly like rockets, crossing ₹100/L in every major city. The 'pass-through' only works upward — never downward.",
        taxEstimate: 50.0
    },
    {
        from: 35, to: 37,
        icon: "🗳️", status: "Election Excise Cut", cls: "balance",
        headline: "Aug–Oct 2022 (UP + 5-state elections): Token excise cut of ₹5/L (petrol) and ₹10/L (diesel) announced. Crude at $100+. OMCs absorb losses. Price cut was political, not economic.",
        taxEstimate: 44.0
    },
    {
        from: 38, to: 40,
        icon: "🔵", status: "Ukraine War Shock — OMC Losses", cls: "rocket",
        headline: "Nov 2022 – Jan 2023: Crude peaks at $132/bbl after Russia invades Ukraine. Govt freezes retail prices. OMCs run real under-recoveries of ₹12–16/L. A genuine crisis — the one honest phase.",
        taxEstimate: 44.0
    },
    {
        from: 41, to: 46,
        icon: "🔄", status: "Loss Recapture Mode", cls: "feather",
        headline: "Feb–Jul 2023: Crude crashes from $132 to $85. Govt keeps retail prices frozen at war-peak levels. OMCs silently recover all Ukraine losses in 6 months. Consumer gets zero benefit of the $47/bbl crash.",
        taxEstimate: 45.0
    },
    {
        from: 47, to: 53,
        icon: "💹", status: "OMC Profit Surge Begins", cls: "feather",
        headline: "Aug 2023 – Feb 2024: Crude at $75–80. Retail prices stay at ₹97+. OMC marketing margins swell to ₹8–12/L — far above the normal ₹2–3/L. Combined quarterly profits hit ₹20,000+ Crore.",
        taxEstimate: 44.0
    },
    {
        from: 54, to: 62,
        icon: "💰", status: "FY24 — RECORD PROFIT SUPERNOVA", cls: "profit",
        headline: "Mar 2024 – Nov 2024: IOC + HPCL + BPCL post ₹80,987 Crore combined net profit in FY24 — the highest ever. Crude at $80. Retail at ₹97.85. Every single litre you buy earns the OMC ~₹10 pure profit.",
        taxEstimate: 43.0
    },
    {
        from: 63, to: 64,
        icon: "🗳️", status: "₹2 Pre-Election Token Cut", cls: "balance",
        headline: "Dec 2024 – Jan 2025: Just before 2024 Lok Sabha election, OMCs announce a ₹2/L price cut. After ₹80,987 Crore in profits. ₹2. That's the share the common man got from record OMC windfalls.",
        taxEstimate: 41.0
    },
    {
        from: 65, to: 83,
        icon: "🪶", status: "Superprofit Accumulation", cls: "feather",
        headline: "Feb 2025 – Jun 2026: Crude steady at $70–78. Retail frozen at ₹95.72 (Delhi). OMC cash reserves growing toward ₹3 Lakh Crore. No price cut passed. No windfall tax. No consumer dividend.",
        taxEstimate: 40.0
    },
    {
        from: 84, to: 89,
        icon: "🪶", status: "TODAY — You Are Here", cls: "feather",
        headline: "Current: Crude at ~$72/bbl — same as 2019 levels. Yet you pay ₹95.72/L vs ₹72.60 in 2019. The extra ₹14+ per litre = OMC profits + uncut government excise. The rockets went up. The feathers never fell.",
        taxEstimate: 40.0
    },
];

// ── Helper: get bulletin phase for a given month index ──
function getBulletin(index) {
    for (const p of PHASES) {
        if (index >= p.from && index <= p.to) return p;
    }
    return PHASES[PHASES.length - 1];
}

// ════════════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
    populateCityDropdown();
    setupEventListeners();
    updateCalculator();
    renderHistoryChart();

    // Attempt to fetch live data
    fetchLiveData();

    // Init simulator at index 0
    setTimeout(() => updateSimulator(0), 600);
});

// ════════════════════════════════════════════════════════════════════
//  LIVE DATA FETCH
//  Uses free public APIs — no API key needed:
//    - exchangerate.host (USD/INR)
//    - commodities-api / Open Markets API (Brent crude)
//  Falls back gracefully to slider defaults if unavailable.
// ════════════════════════════════════════════════════════════════════
async function fetchLiveData() {
    updateLiveStatus("fetching", "⏳ Fetching Live Data…");

    try {
        // Fetch USD/INR exchange rate
        const fxResp = await fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(6000) });
        if (!fxResp.ok) throw new Error("FX fetch failed");
        const fxData = await fxResp.json();
        const fetchedInr = fxData.rates?.INR;

        // Fetch Brent crude price via commodity proxy
        // Using free stooq API (CSV format) — no key needed
        const crudeResp = await fetch("https://stooq.com/q/l/?s=lcox.f&f=sd2t2ohlcv&h&e=csv", { signal: AbortSignal.timeout(6000) });
        let fetchedCrude = null;

        if (crudeResp.ok) {
            const text = await crudeResp.text();
            const lines = text.trim().split('\n');
            if (lines.length >= 2) {
                const cols = lines[1].split(',');
                fetchedCrude = parseFloat(cols[6]); // Close price
                if (isNaN(fetchedCrude)) fetchedCrude = null;
            }
        }

        // Apply live data if valid
        if (fetchedInr && !isNaN(fetchedInr) && fetchedInr > 75) {
            usdInr = parseFloat(fetchedInr.toFixed(2));
            const exSlider = document.getElementById("ex-slider");
            const exVal    = document.getElementById("ex-val");
            if (exSlider) exSlider.value = usdInr;
            if (exVal)    exVal.innerText = usdInr.toFixed(2);
        }

        if (fetchedCrude && fetchedCrude > 20 && fetchedCrude < 200) {
            crudeUsd = parseFloat(fetchedCrude.toFixed(2));
            const crudeSlider = document.getElementById("crude-slider");
            const crudeVal    = document.getElementById("crude-val");
            if (crudeSlider) { crudeSlider.value = crudeUsd; }
            if (crudeVal)    { crudeVal.innerText = crudeUsd.toFixed(1); }
        }

        updateLiveStatus("live", "✅ Live Data Loaded");
        liveDataLoaded = true;

    } catch (err) {
        console.warn("Live data fetch failed, using defaults:", err.message);
        updateLiveStatus("fallback", "📊 Using Cached Data");
    } finally {
        // Update ticker always
        updateTicker();
        updateCalculator();
    }
}

function updateLiveStatus(cls, text) {
    const badge = document.getElementById("live-status-badge");
    const dot   = document.getElementById("live-dot");
    if (badge) {
        badge.className = `live-status ${cls}`;
        badge.textContent = text;
    }
    if (dot) {
        dot.style.background = cls === "live" ? "var(--success)" : cls === "fetching" ? "var(--warning)" : "var(--accent)";
    }
}

function updateTicker() {
    const costPerLitre = (crudeUsd * usdInr) / 159;
    const tickerCrude  = document.getElementById("ticker-crude");
    const tickerEx     = document.getElementById("ticker-ex");
    const tickerCost   = document.getElementById("ticker-cost");
    if (tickerCrude) tickerCrude.innerText = `$${crudeUsd.toFixed(2)}`;
    if (tickerEx)    tickerEx.innerText    = `₹${usdInr.toFixed(2)}`;
    if (tickerCost)  tickerCost.innerText  = `₹${costPerLitre.toFixed(2)}`;
}

// ════════════════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ════════════════════════════════════════════════════════════════════
function setupEventListeners() {
    // Product tabs
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", e => {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            currentProduct = e.target.dataset.product;
            customActualPrice = null;
            const city = cityConfig[currentCityKey];
            document.getElementById("actual-price-input").value =
                currentProduct === "petrol" ? city.petrol : city.diesel;
            updateCalculator();
            updateChartData();
        });
    });

    // City selector
    document.getElementById("city-select").addEventListener("change", e => {
        currentCityKey = e.target.value;
        customActualPrice = null;
        const city = cityConfig[currentCityKey];
        document.getElementById("actual-price-input").value =
            currentProduct === "petrol" ? city.petrol : city.diesel;
        updateCalculator();
    });

    // Actual price manual override
    document.getElementById("actual-price-input").addEventListener("input", e => {
        customActualPrice = parseFloat(e.target.value) || 0;
        updateCalculator();
    });

    // Crude slider
    document.getElementById("crude-slider").addEventListener("input", e => {
        crudeUsd = parseFloat(e.target.value);
        document.getElementById("crude-val").innerText = crudeUsd.toFixed(1);
        updateTicker();
        updateCalculator();
    });

    // FX slider
    document.getElementById("ex-slider").addEventListener("input", e => {
        usdInr = parseFloat(e.target.value);
        document.getElementById("ex-val").innerText = usdInr.toFixed(2);
        updateTicker();
        updateCalculator();
    });

    // Commuter options
    document.querySelectorAll(".commuter-option").forEach(opt => {
        opt.addEventListener("click", e => {
            document.querySelectorAll(".commuter-option").forEach(o => o.classList.remove("active"));
            const target = e.currentTarget;
            target.classList.add("active");
            const litres = parseInt(target.dataset.litres);
            if (litres === 0) {
                document.getElementById("custom-usage-group").style.display = "block";
                currentMonthlyUsage = parseInt(document.getElementById("custom-usage-input").value) || 0;
            } else {
                document.getElementById("custom-usage-group").style.display = "none";
                currentMonthlyUsage = litres;
            }
            updateImpact();
        });
    });

    document.getElementById("custom-usage-input").addEventListener("input", e => {
        currentMonthlyUsage = parseInt(e.target.value) || 0;
        updateImpact();
    });

    // Chart tabs
    document.querySelectorAll(".chart-tab-btn").forEach(btn => {
        btn.addEventListener("click", e => {
            document.querySelectorAll(".chart-tab-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            currentProduct = e.target.dataset.product;
            document.querySelectorAll(".tab-btn").forEach(b => {
                b.classList.toggle("active", b.dataset.product === currentProduct);
            });
            customActualPrice = null;
            const city = cityConfig[currentCityKey];
            document.getElementById("actual-price-input").value =
                currentProduct === "petrol" ? city.petrol : city.diesel;
            updateCalculator();
            updateChartData();
        });
    });

    // Timeline slider
    const tSlider = document.getElementById("timeline-slider");
    if (tSlider) {
        tSlider.addEventListener("input", e => {
            const idx = parseInt(e.target.value);
            updateSimulator(idx);
            highlightChartIndex(idx);
        });
    }

    // Year tick clicks
    document.querySelectorAll(".tick-link").forEach(tick => {
        tick.addEventListener("click", e => {
            const idx = parseInt(e.target.dataset.index);
            const tSlider = document.getElementById("timeline-slider");
            if (tSlider) tSlider.value = idx;
            updateSimulator(idx);
            highlightChartIndex(idx);
        });
    });
}

// ════════════════════════════════════════════════════════════════════
//  CITY DROPDOWN
// ════════════════════════════════════════════════════════════════════
function populateCityDropdown() {
    const select = document.getElementById("city-select");
    select.innerHTML = "";
    Object.keys(cityConfig).forEach(key => {
        const opt = document.createElement("option");
        opt.value = key;
        opt.text  = cityConfig[key].name;
        if (key === currentCityKey) opt.selected = true;
        select.add(opt);
    });
    const city = cityConfig[currentCityKey];
    document.getElementById("actual-price-input").value = city.petrol;
}

// ════════════════════════════════════════════════════════════════════
//  CALCULATOR
// ════════════════════════════════════════════════════════════════════
let globalOverpayment = 0;

function updateCalculator() {
    const city        = cityConfig[currentCityKey];
    const crudeLitre  = (crudeUsd * usdInr) / 159;
    const markup      = currentProduct === "petrol" ? city.pMarkup : city.dMarkup;
    const fairPrice   = crudeLitre + markup;
    const actualPrice = customActualPrice !== null
        ? customActualPrice
        : (currentProduct === "petrol" ? city.petrol : city.diesel);

    const diff = actualPrice - fairPrice;
    globalOverpayment = diff;

    // Update UI labels
    document.getElementById("crude-cost-lbl").innerText   = `₹${crudeLitre.toFixed(2)}`;
    document.getElementById("actual-price-val").innerText  = `₹${actualPrice.toFixed(2)}`;
    document.getElementById("fair-price-val").innerText    = `₹${fairPrice.toFixed(2)}`;

    const verdictBox   = document.getElementById("verdict-box");
    const verdictTitle = document.getElementById("verdict-title");
    const verdictSub   = document.getElementById("verdict-sub");

    if (diff > 0.05) {
        verdictBox.className = "alert-verdict";
        verdictTitle.innerText = "YOU ARE OVERPAYING BY";
        verdictSub.innerHTML   = `₹${diff.toFixed(2)} <span style="font-size:1.1rem;font-weight:600">per litre</span>`;
        verdictSub.style.color = "var(--accent)";
    } else if (diff < -0.05) {
        verdictBox.className = "alert-verdict success";
        verdictTitle.innerText = "PRICE IS BELOW FAIR COST — SUBSIDISED";
        verdictSub.innerHTML   = `₹${Math.abs(diff).toFixed(2)} <span style="font-size:1.1rem;font-weight:600">below fair price</span>`;
        verdictSub.style.color = "var(--success)";
    } else {
        verdictBox.className = "alert-verdict success";
        verdictTitle.innerText = "FAIR MARKET PRICING";
        verdictSub.innerHTML   = `₹0.00 <span style="font-size:1.1rem;font-weight:600">difference</span>`;
        verdictSub.style.color = "var(--success)";
    }

    updateImpact();
}

// ════════════════════════════════════════════════════════════════════
//  COMMUTER IMPACT
// ════════════════════════════════════════════════════════════════════
function updateImpact() {
    const overpay  = Math.max(0, globalOverpayment);
    const monthly  = overpay * currentMonthlyUsage;
    const annual   = monthly * 12;

    document.getElementById("monthly-excess").innerText = `₹${Math.round(monthly).toLocaleString('en-IN')}`;
    document.getElementById("annual-excess").innerText  = `₹${Math.round(annual).toLocaleString('en-IN')}`;

    // Equivalencies
    document.getElementById("atta-eq").innerText    = `${Math.floor(monthly / 40)} kg`;
    document.getElementById("recharge-eq").innerText= `${Math.floor(monthly / 250)} Pack${Math.floor(monthly/250)!==1?'s':''}`;
    document.getElementById("grocery-eq").innerText = `${Math.floor(monthly / 300)} Day${Math.floor(monthly/300)!==1?'s':''}`;
    document.getElementById("school-eq").innerText  = `${(monthly / 500).toFixed(1)} Mo`;

    updateShareButtons(monthly, annual);
}

function updateShareButtons(monthly, annual) {
    const text = `I'm overpaying ₹${globalOverpayment.toFixed(2)}/litre on fuel = ₹${Math.round(monthly).toLocaleString('en-IN')} extra every month! This is the Rockets & Feathers effect — crude falls, prices don't. Check the India Fair Fuel Meter:`;
    const url  = "https://trambak001.github.io/ALLOIL/";
    const enc  = encodeURIComponent;
    document.getElementById("btn-twitter").href   = `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`;
    document.getElementById("btn-whatsapp").href  = `https://api.whatsapp.com/send?text=${enc(text + " " + url)}`;
}

// ════════════════════════════════════════════════════════════════════
//  CHART.JS HISTORY CHART
// ════════════════════════════════════════════════════════════════════
function renderHistoryChart() {
    const ctx = document.getElementById("analyticsChart").getContext("2d");
    const labels     = fuelData.map(d => d.date);
    const actualData = fuelData.map(d => d[currentProduct]);
    const fairData   = fuelData.map(d => d[`fair_${currentProduct}`]);
    const crudeData  = fuelData.map(d => d.crude_inr_litre);

    historyChart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Actual Retail Price (₹/L)",
                    data: actualData,
                    borderColor: "#F37021",
                    backgroundColor: "rgba(243,112,33,0.06)",
                    borderWidth: 2.5,
                    pointRadius: 0,
                    pointHoverRadius: 7,
                    fill: false,
                    tension: 0.15,
                },
                {
                    label: "Fair Cost-Plus Price (₹/L)",
                    data: fairData,
                    borderColor: "#22c55e",
                    backgroundColor: "rgba(34,197,94,0.05)",
                    borderWidth: 2,
                    borderDash: [6, 4],
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    fill: false,
                    tension: 0.15,
                },
                {
                    label: "Raw Crude Cost (₹/L)",
                    data: crudeData,
                    borderColor: "#38bdf8",
                    backgroundColor: "rgba(56,189,248,0.08)",
                    borderWidth: 1.5,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: true,
                    tension: 0.15,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: {
                    position: "top",
                    labels: {
                        color: "#eef2f9",
                        font: { family: "Inter", size: 12 },
                        boxWidth: 20,
                        padding: 18,
                    },
                },
                tooltip: {
                    backgroundColor: "#0b1629",
                    titleColor: "#eef2f9",
                    bodyColor: "#7e9bbf",
                    borderColor: "#162040",
                    borderWidth: 1,
                    padding: 12,
                    titleFont: { family: "Outfit", weight: "bold" },
                    bodyFont: { family: "Inter" },
                    callbacks: {
                        label: ctx2 => {
                            const label = ctx2.dataset.label || "";
                            return ` ${label}: ₹${ctx2.parsed.y.toFixed(2)}`;
                        },
                    },
                },
                // Vertical line annotation at slider position
                annotation: undefined,
            },
            scales: {
                x: {
                    grid: { color: "rgba(22,32,64,0.6)" },
                    ticks: {
                        color: "#7e9bbf",
                        maxTicksLimit: 12,
                        font: { family: "Inter", size: 10 },
                    },
                },
                y: {
                    grid: { color: "rgba(22,32,64,0.6)" },
                    ticks: {
                        color: "#7e9bbf",
                        font: { family: "Inter", size: 10 },
                        callback: v => `₹${v}`,
                    },
                },
            },
        },
    });
}

function updateChartData() {
    if (!historyChart) return;
    const actualData = fuelData.map(d => d[currentProduct]);
    const fairData   = fuelData.map(d => d[`fair_${currentProduct}`]);
    historyChart.data.datasets[0].data = actualData;
    historyChart.data.datasets[1].data = fairData;
    historyChart.data.datasets[0].label = `Actual Retail Price (₹/L)`;
    historyChart.data.datasets[1].label = `Fair Cost-Plus Price (₹/L)`;
    historyChart.update();
}

// ── Highlight a chart point at given month index ──
let activeChartIndex = 0;
function highlightChartIndex(index) {
    if (!historyChart) return;
    activeChartIndex = index;

    const activeElements = historyChart.data.datasets.map((_, i) => ({
        datasetIndex: i,
        index: index,
    }));

    historyChart.setActiveElements(activeElements);
    const meta = historyChart.getDatasetMeta(0);
    if (meta?.data?.[index]) {
        const pt = meta.data[index];
        historyChart.tooltip.setActiveElements(activeElements, { x: pt.x, y: pt.y });
    }
    historyChart.update("none"); // 'none' = no animation, just redraw
}

// ════════════════════════════════════════════════════════════════════
//  ROCKETS & FEATHERS SIMULATOR
// ════════════════════════════════════════════════════════════════════
function updateSimulator(index) {
    const record = fuelData[index];
    if (!record) return;

    const phase       = getBulletin(index);
    const crudeInr    = record.crude_inr_litre;
    const actual      = record[currentProduct];
    const fair        = record[`fair_${currentProduct}`];
    const diff        = record[`${currentProduct}_overpayment`];

    // ── Date & phase ──
    document.getElementById("sim-date").innerText        = formatDate(record.date);
    document.getElementById("sim-icon").innerText        = phase.icon;
    document.getElementById("sim-status-text").innerText = phase.status;

    // ── Price numbers ──
    document.getElementById("sim-crude-inr").innerText   = `₹${crudeInr.toFixed(2)}`;
    document.getElementById("sim-crude-usd").innerText   = `$${record.crude_usd.toFixed(2)}`;
    document.getElementById("sim-actual-price").innerText= `₹${actual.toFixed(2)}`;
    document.getElementById("sim-fair-price").innerText  = `₹${fair.toFixed(2)}`;

    // ── Overpayment label ──
    const diffEl = document.getElementById("sim-diff-price");
    if (diff > 0.05) {
        diffEl.innerText   = `+₹${diff.toFixed(2)} OVERPAID`;
        diffEl.style.color = "var(--accent)";
    } else if (diff < -0.05) {
        diffEl.innerText   = `-₹${Math.abs(diff).toFixed(2)} SUBSIDISED`;
        diffEl.style.color = "var(--success)";
    } else {
        diffEl.innerText   = `₹0.00 FAIR`;
        diffEl.style.color = "var(--text-secondary-dark)";
    }

    // ── Headline ──
    const flashBox = document.getElementById("headline-flash-box");
    flashBox.className = `sim-panel headline-flash ${phase.cls}`;
    document.getElementById("sim-headline").innerText = phase.headline;

    // ── Active year tick ──
    document.querySelectorAll(".tick-link").forEach(t => {
        const tickIdx = parseInt(t.dataset.index);
        t.classList.toggle("active-year", index >= tickIdx && index < tickIdx + 12);
    });

    // ── Animated stacked bar ──
    updateStackedBar(crudeInr, actual, phase.taxEstimate, diff);
}

// ── Stacked bar: animate widths by changing flex values ──
function updateStackedBar(crudeInr, actual, taxEst, diff) {
    const refining   = REFINING_COMMISSION;
    const taxes      = Math.max(0, taxEst);
    const profitBar  = Math.max(0, diff);
    const total      = crudeInr + refining + taxes + profitBar;

    // Safety: no divide-by-zero
    if (total <= 0) return;

    const barCrude   = document.getElementById("bar-crude");
    const barRefine  = document.getElementById("bar-refining");
    const barTaxes   = document.getElementById("bar-taxes");
    const barProfit  = document.getElementById("bar-profit");

    // Use flex values proportional to ₹/L
    if (barCrude)  barCrude.style.flex  = crudeInr;
    if (barRefine) barRefine.style.flex = refining;
    if (barTaxes)  barTaxes.style.flex  = taxes;
    if (barProfit) barProfit.style.flex = profitBar;

    // Show labels only if segment is wide enough
    if (barCrude)  barCrude.textContent  = crudeInr > 5 ? `₹${crudeInr.toFixed(0)}` : "";
    if (barRefine) barRefine.textContent = refining > 5 ? `₹${refining.toFixed(0)}` : "";
    if (barTaxes)  barTaxes.textContent  = taxes > 5 ? `₹${taxes.toFixed(0)}` : "";
    if (barProfit) barProfit.textContent = profitBar > 3 ? `₹${profitBar.toFixed(0)}` : "";

    // Legend labels
    const lblCrude  = document.getElementById("lbl-bar-crude");
    const lblRef    = document.getElementById("lbl-bar-ref");
    const lblTaxes  = document.getElementById("lbl-bar-taxes");
    const lblProfit = document.getElementById("lbl-bar-profit");

    if (lblCrude)  lblCrude.innerText  = `₹${crudeInr.toFixed(2)}`;
    if (lblRef)    lblRef.innerText    = `₹${refining.toFixed(2)}`;
    if (lblTaxes)  lblTaxes.innerText  = `₹${taxes.toFixed(2)}`;
    if (lblProfit) lblProfit.innerText = `₹${profitBar.toFixed(2)}`;
}

// ── Format date like "01-04-22" → "April 2022" ──
function formatDate(raw) {
    if (!raw) return "";
    const parts = raw.split("-"); // [DD, MM, YY]
    if (parts.length < 3) return raw;
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const month  = months[parseInt(parts[1]) - 1] || parts[1];
    const year   = parseInt(parts[2]) >= 50 ? `19${parts[2]}` : `20${parts[2]}`;
    return `${month} ${year}`;
}
