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
        });
    });
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
