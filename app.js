// City Configuration
const cityConfig = {
    delhi: {
        name: "Delhi",
        actualPetrol: 97.85,
        actualDiesel: 84.18,
        baselinePetrolMarkup: 44.77,
        baselineDieselMarkup: 37.38
    },
    mumbai: {
        name: "Mumbai",
        actualPetrol: 104.21,
        actualDiesel: 92.15,
        baselinePetrolMarkup: 56.40,
        baselineDieselMarkup: 45.20
    },
    kolkata: {
        name: "Kolkata",
        actualPetrol: 103.94,
        actualDiesel: 90.76,
        baselinePetrolMarkup: 52.40,
        baselineDieselMarkup: 43.90
    },
    chennai: {
        name: "Chennai",
        actualPetrol: 100.75,
        actualDiesel: 92.34,
        baselinePetrolMarkup: 50.20,
        baselineDieselMarkup: 44.40
    },
    bangalore: {
        name: "Bangalore",
        actualPetrol: 101.94,
        actualDiesel: 87.89,
        baselinePetrolMarkup: 51.10,
        baselineDieselMarkup: 42.20
    },
    hyderabad: {
        name: "Hyderabad",
        actualPetrol: 107.41,
        actualDiesel: 95.65,
        baselinePetrolMarkup: 57.80,
        baselineDieselMarkup: 47.60
    }
};

// State Variables
let currentProduct = "petrol"; // petrol or diesel
let currentCityKey = "delhi";
let crudeUsd = 72.00;
let usdInr = 85.00;
let customActualPrice = null;
let currentMonthlyUsage = 30; // litres/month (default two-wheeler)

let historyChart = null;

// Initialize Dashboard
document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
    populateCityDropdown();
    updateCalculator();
    renderHistoryChart();
    setTimeout(() => {
        updateTimelineSimulator(0);
    }, 500);
});

// Setup Event Listeners
function setupEventListeners() {
    // Product Tabs (Petrol/Diesel)
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            currentProduct = e.target.dataset.product;
            
            // Reset custom override on product switch
            customActualPrice = null;
            const city = cityConfig[currentCityKey];
            document.getElementById("actual-price-input").value = currentProduct === "petrol" ? city.actualPetrol : city.actualDiesel;
            
            updateCalculator();
            updateChartData();
            
            const tSlider = document.getElementById("timeline-slider");
            if (tSlider) {
                updateTimelineSimulator(parseInt(tSlider.value));
            }
        });
    });

    // City selector
    document.getElementById("city-select").addEventListener("change", (e) => {
        currentCityKey = e.target.value;
        customActualPrice = null;
        
        const city = cityConfig[currentCityKey];
        document.getElementById("actual-price-input").value = currentProduct === "petrol" ? city.actualPetrol : city.actualDiesel;
        
        updateCalculator();
    });

    // Actual pump price input (manual override)
    document.getElementById("actual-price-input").addEventListener("input", (e) => {
        customActualPrice = parseFloat(e.target.value) || 0;
        updateCalculator();
    });

    // Crude Oil Slider
    const crudeSlider = document.getElementById("crude-slider");
    crudeSlider.addEventListener("input", (e) => {
        crudeUsd = parseFloat(e.target.value);
        document.getElementById("crude-val").innerText = crudeUsd.toFixed(1);
        updateCalculator();
    });

    // Exchange Rate Slider
    const exSlider = document.getElementById("ex-slider");
    exSlider.addEventListener("input", (e) => {
        usdInr = parseFloat(e.target.value);
        document.getElementById("ex-val").innerText = usdInr.toFixed(2);
        updateCalculator();
    });

    // Commuter vehicle selections
    document.querySelectorAll(".commuter-option").forEach(option => {
        option.addEventListener("click", (e) => {
            document.querySelectorAll(".commuter-option").forEach(opt => opt.classList.remove("active"));
            const target = e.currentTarget;
            target.classList.add("active");
            
            const litres = parseInt(target.dataset.litres);
            if (litres === 0) {
                // Custom input
                document.getElementById("custom-usage-group").style.display = "block";
                currentMonthlyUsage = parseInt(document.getElementById("custom-usage-input").value) || 0;
            } else {
                document.getElementById("custom-usage-group").style.display = "none";
                currentMonthlyUsage = litres;
            }
            updateImpactCalculations();
        });
    });

    // Custom usage input
    document.getElementById("custom-usage-input").addEventListener("input", (e) => {
        currentMonthlyUsage = parseInt(e.target.value) || 0;
        updateImpactCalculations();
    });

    // Chart toggle buttons
    document.querySelectorAll(".chart-tab-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".chart-tab-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            const product = e.target.dataset.product;
            
            // Sync with main calculator tab
            currentProduct = product;
            document.querySelectorAll(".tab-btn").forEach(b => {
                if (b.dataset.product === product) b.classList.add("active");
                else b.classList.remove("active");
            });

            customActualPrice = null;
            const city = cityConfig[currentCityKey];
            document.getElementById("actual-price-input").value = currentProduct === "petrol" ? city.actualPetrol : city.actualDiesel;

            updateCalculator();
            updateChartData();
            
            const tSlider = document.getElementById("timeline-slider");
            if (tSlider) {
                updateTimelineSimulator(parseInt(tSlider.value));
            }
        });
    });

    // Timeline slider event
    const timelineSlider = document.getElementById("timeline-slider");
    if (timelineSlider) {
        timelineSlider.addEventListener("input", (e) => {
            const index = parseInt(e.target.value);
            updateTimelineSimulator(index);
        });
    }
}

// Populate City Dropdown
function populateCityDropdown() {
    const select = document.getElementById("city-select");
    select.innerHTML = "";
    Object.keys(cityConfig).forEach(key => {
        const option = document.createElement("option");
        option.value = key;
        option.text = `${cityConfig[key].name} (VAT baseline)`;
        if (key === currentCityKey) option.selected = true;
        select.add(option);
    });

    // Set initial actual input value
    const city = cityConfig[currentCityKey];
    document.getElementById("actual-price-input").value = city.actualPetrol;
}

// Main Calculator Updates
let globalOverpaymentPerLitre = 0;

function updateCalculator() {
    const city = cityConfig[currentCityKey];
    const rawCrudeLitre = (crudeUsd * usdInr) / 159;
    
    // Set actual price from input field or config
    const actualPrice = customActualPrice !== null ? customActualPrice : (currentProduct === "petrol" ? city.actualPetrol : city.actualDiesel);
    
    // Calculate fair price: crude cost + city baseline markup
    const markup = currentProduct === "petrol" ? city.baselinePetrolMarkup : city.baselineDieselMarkup;
    const fairPrice = rawCrudeLitre + markup;
    
    // Calculations
    const diff = actualPrice - fairPrice;
    globalOverpaymentPerLitre = diff;
    
    // Update labels in UI
    document.getElementById("crude-cost-lbl").innerText = `₹${rawCrudeLitre.toFixed(2)}`;
    document.getElementById("actual-price-val").innerText = `₹${actualPrice.toFixed(2)}`;
    document.getElementById("fair-price-val").innerText = `₹${fairPrice.toFixed(2)}`;
    
    const verdictBox = document.getElementById("verdict-box");
    const verdictTitle = document.getElementById("verdict-title");
    const verdictSub = document.getElementById("verdict-sub");
    
    if (diff > 0.05) {
        verdictBox.className = "alert-verdict";
        verdictTitle.innerText = `YOU ARE OVERPAYING BY`;
        verdictSub.innerHTML = `₹${diff.toFixed(2)} <span style="font-size:1.1rem; font-weight:600;">per litre</span>`;
        verdictSub.style.color = "var(--danger)";
    } else if (diff < -0.05) {
        verdictBox.className = "alert-verdict success";
        verdictTitle.innerText = `YOU ARE SAVING (OMC SUBSIDIZED)`;
        verdictSub.innerHTML = `₹${Math.abs(diff).toFixed(2)} <span style="font-size:1.1rem; font-weight:600;">per litre</span>`;
        verdictSub.style.color = "var(--success)";
    } else {
        verdictBox.className = "alert-verdict success";
        verdictTitle.innerText = `FAIR MARKET PRICING`;
        verdictSub.innerHTML = `₹0.00 <span style="font-size:1.1rem; font-weight:600;">difference</span>`;
        verdictSub.style.color = "var(--success)";
    }
    
    updateImpactCalculations();
}

// Update Commuter Impact Section
function updateImpactCalculations() {
    const overpayment = Math.max(0, globalOverpaymentPerLitre);
    const monthlyExcess = overpayment * currentMonthlyUsage;
    const annualExcess = monthlyExcess * 12;
    
    document.getElementById("monthly-excess").innerText = `₹${monthlyExcess.toFixed(0)}`;
    document.getElementById("annual-excess").innerText = `₹${annualExcess.toFixed(0)}`;
    
    // Equivalencies
    const attaKg = Math.floor(monthlyExcess / 40); // ₹40 per kg
    const recharges = Math.floor(monthlyExcess / 250); // ₹250 per pack
    const groceriesDays = Math.floor(monthlyExcess / 300); // ₹300 per day
    const schoolMonths = (monthlyExcess / 500).toFixed(1); // ₹500/month
    
    document.getElementById("atta-eq").innerText = `${attaKg} kg`;
    document.getElementById("recharge-eq").innerText = `${recharges} Pack${recharges !== 1 ? 's' : ''}`;
    document.getElementById("grocery-eq").innerText = `${groceriesDays} Day${groceriesDays !== 1 ? 's' : ''}`;
    document.getElementById("school-eq").innerText = `${schoolMonths} Month${schoolMonths !== "1.0" ? 's' : ''}`;
    
    // Dynamically update share text
    updateShareButtons(monthlyExcess, annualExcess);
}

// Update Share Text
function updateShareButtons(monthly, annual) {
    const text = `I'm overpaying ₹${globalOverpaymentPerLitre.toFixed(2)} per litre on fuel, totaling ₹${monthly.toFixed(0)}/month extra directly pocketed by OMCs and the treasury! Calculate your fair fuel price using the Fair Fuel Meter:`;
    const url = window.location.href;
    
    document.getElementById("btn-twitter").href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    document.getElementById("btn-whatsapp").href = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`;
}

// Render Interactive History Chart using Chart.js
function renderHistoryChart() {
    const ctx = document.getElementById("analyticsChart").getContext("2d");
    
    const labels = fuelData.map(d => d.date);
    const actualData = fuelData.map(d => d[currentProduct]);
    const fairData = fuelData.map(d => d[`fair_${currentProduct}`]);
    const crudeData = fuelData.map(d => d.crude_inr_litre);
    
    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: `Actual Retail Price (${currentProduct.toUpperCase()})`,
                    data: actualData,
                    borderColor: '#ff7b72',
                    backgroundColor: 'rgba(255, 123, 114, 0.05)',
                    borderWidth: 2.5,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    fill: false,
                    tension: 0.1
                },
                {
                    label: `Fair Cost-Plus Price (${currentProduct.toUpperCase()})`,
                    data: fairData,
                    borderColor: '#3fb950',
                    backgroundColor: 'rgba(63, 185, 80, 0.05)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    fill: false,
                    tension: 0.1
                },
                {
                    label: 'Raw Crude Oil Cost per Litre (INR)',
                    data: crudeData,
                    borderColor: '#58a6ff',
                    backgroundColor: 'rgba(88, 166, 255, 0.08)',
                    borderWidth: 1.5,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: true,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#f0f6fc',
                        font: {
                            family: 'Inter',
                            size: 11
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: '#161b22',
                    titleColor: '#f0f6fc',
                    bodyColor: '#8b949e',
                    borderColor: '#30363d',
                    borderWidth: 1,
                    titleFont: {
                        family: 'Outfit',
                        weight: 'bold'
                    },
                    bodyFont: {
                        family: 'Inter'
                    },
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += '₹' + context.parsed.y.toFixed(2);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(48, 54, 61, 0.3)'
                    },
                    ticks: {
                        color: '#8b949e',
                        maxTicksLimit: 12,
                        font: {
                            family: 'Inter',
                            size: 10
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(48, 54, 61, 0.3)'
                    },
                    ticks: {
                        color: '#8b949e',
                        font: {
                            family: 'Inter',
                            size: 10
                        }
                    }
                }
            }
        }
    });
}

// Update History Chart datasets
function updateChartData() {
    if (!historyChart) return;
    
    const actualData = fuelData.map(d => d[currentProduct]);
    const fairData = fuelData.map(d => d[`fair_${currentProduct}`]);
    
    historyChart.data.datasets[0].label = `Actual Retail Price (${currentProduct.toUpperCase()})`;
    historyChart.data.datasets[0].data = actualData;
    
    historyChart.data.datasets[1].label = `Fair Cost-Plus Price (${currentProduct.toUpperCase()})`;
    historyChart.data.datasets[1].data = fairData;
    
    // Re-render chart
    historyChart.update();
}

// Highlight Chart Index
function highlightChartIndex(index) {
    if (!historyChart) return;
    
    const activeElements = [];
    for (let i = 0; i < historyChart.data.datasets.length; i++) {
        activeElements.push({
            datasetIndex: i,
            index: index
        });
    }
    
    historyChart.setActiveElements(activeElements);
    
    const meta = historyChart.getDatasetMeta(0);
    if (meta && meta.data && meta.data[index]) {
        const model = meta.data[index];
        historyChart.tooltip.setActiveElements(activeElements, { x: model.x, y: model.y });
    }
    historyChart.update();
}

// Update Timeline Simulator Display
function updateTimelineSimulator(index) {
    const record = fuelData[index];
    if (!record) return;
    
    const dateStr = record.date;
    const crudeInr = record.crude_inr_litre;
    const actualPrice = record[currentProduct];
    const fairPrice = record[`fair_${currentProduct}`];
    const diff = record[`${currentProduct}_overpayment`];
    
    const bulletin = getTimelineBulletin(index, dateStr);
    
    document.getElementById("sim-date").innerText = dateStr;
    document.getElementById("sim-icon").innerText = bulletin.icon;
    document.getElementById("sim-status-text").innerText = bulletin.status;
    
    document.getElementById("sim-crude-inr").innerText = `₹${crudeInr.toFixed(2)}`;
    document.getElementById("sim-actual-price").innerText = `₹${actualPrice.toFixed(2)}`;
    document.getElementById("sim-fair-price").innerText = `₹${fairPrice.toFixed(2)}`;
    
    const diffEl = document.getElementById("sim-diff-price");
    if (diff > 0.05) {
        diffEl.innerText = `+₹${diff.toFixed(2)}`;
        diffEl.style.color = "var(--danger)";
    } else if (diff < -0.05) {
        diffEl.innerText = `-₹${Math.abs(diff).toFixed(2)}`;
        diffEl.style.color = "var(--success)";
    } else {
        diffEl.innerText = `₹0.00`;
        diffEl.style.color = "var(--text-primary-dark)";
    }
    
    const flashBox = document.getElementById("headline-flash-box");
    flashBox.className = `sim-panel headline-flash ${bulletin.class}`;
    document.getElementById("sim-headline").innerText = bulletin.headline;
    
    highlightChartIndex(index);
}

// Bulletin Data Mapping based on month timeline indices (2019-2026)
function getTimelineBulletin(index, dateStr) {
    if (index >= 0 && index <= 11) {
        return {
            icon: "⚖️",
            status: "Stable Baseline",
            class: "balance",
            headline: "Pre-COVID baseline pricing in Delhi. Retail fuel pricing follows international crude fluctuations smoothly with a reasonable corporate margin."
        };
    } else if (index >= 12 && index <= 13) {
        return {
            icon: "⚖️",
            status: "Standard Pricing",
            class: "balance",
            headline: "Global oil prices soften to $50-60/bbl due to early signs of pandemic demand drop. Retail prices dip slightly."
        };
    } else if (index >= 14 && index <= 16) {
        return {
            icon: "🛑",
            status: "COVID Tax Grab",
            class: "feather",
            headline: "COVID Crash: Crude crashes to $20.35/bbl (₹9.52/L). Instead of giving relief, Central Govt hikes excise duty by ₹13-16/L to swallow 100% of the crash, denying consumer relief."
        };
    } else if (index >= 17 && index <= 27) {
        return {
            icon: "🪶",
            status: "High Excise Phase",
            class: "feather",
            headline: "Excise Windfall: Retail prices kept frozen at near-record levels despite cheap global crude, allowing the state treasury to capture record fuel excise revenues to fund pandemic recovery."
        };
    } else if (index >= 28 && index <= 34) {
        return {
            icon: "🚀",
            status: "Rocket Escalation",
            class: "rocket",
            headline: "Post-COVID Hikes: Global crude recovers to $80. Retail prices are raised rapidly like rockets, crossing the psychological ₹100/L mark across major cities."
        };
    } else if (index >= 35 && index <= 37) {
        return {
            icon: "⚖️",
            status: "Pre-Election Freeze",
            class: "balance",
            headline: "Temporary Excise Cut: Ahead of key assembly elections, the Central Government cuts excise duty by ₹5/L (petrol) and ₹10/L (diesel) to cool public anger."
        };
    } else if (index >= 38 && index <= 40) {
        return {
            icon: "🔵",
            status: "OMC Under-Recovery",
            class: "balance",
            headline: "Ukraine War Peak: Crude oil spikes to $132.38/bbl. To control inflation, the government freezes retail prices. OMCs run heavy losses of up to ₹16/L."
        };
    } else if (index >= 41 && index <= 46) {
        return {
            icon: "🪶",
            status: "Loss Recapture",
            class: "feather",
            headline: "Recapture Era: Crude falls back to $90, but retail prices remain frozen at peak levels to allow OMCs to recoup their Ukraine War under-recoveries."
        };
    } else if (index >= 47 && index <= 53) {
        return {
            icon: "🪶",
            status: "OMC Profit Surge",
            class: "feather",
            headline: "Windfall Turn: Crude drops to $75-$80. Retail prices remain frozen at war peaks. OMCs swing to massive profits, reporting record marketing margins."
        };
    } else if (index >= 54 && index <= 62) {
        return {
            icon: "💰",
            status: "FY24 Record Profits",
            class: "feather",
            headline: "Profit Supernova: OMCs report ₹80,987 Crore combined standalone net profits in FY24, fueled by cheap crude and frozen retail prices."
        };
    } else if (index >= 63 && index <= 64) {
        return {
            icon: "⚖️",
            status: "Token Price Cuts",
            class: "balance",
            headline: "Pre-Election Cut: Ahead of 2024 Lok Sabha Elections, OMCs announce a token price cut of ₹2/L after keeping prices frozen for nearly two years."
        };
    } else if (index >= 65 && index <= 83) {
        return {
            icon: "🪶",
            status: "Reserves Accumulation",
            class: "feather",
            headline: "Profit Stashing: Retail prices remain frozen near ₹97+ while crude is stable at $75. Combined OMC cash reserves climb toward a massive ₹3 Lakh Crore."
        };
    } else {
        return {
            icon: "🪶",
            status: "Superprofit Recapture",
            class: "feather",
            headline: "June 2026: Crude drops to $72.00/bbl (2019 levels), yet consumers pay ₹97.85/L. OMCs extract a record ₹14.50/L surplus overpayment."
        };
    }
}
