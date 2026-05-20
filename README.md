# India Fair Fuel Meter 🇮🇳
### *Analyzing Fuel Price Asymmetry, OMC Windfalls, and the Cost to the Indian Commuter*

Live Interactive App: **[https://trambak001.github.io/ALLOIL/](https://trambak001.github.io/ALLOIL/)**

---

This repository contains an open-source data analysis project and interactive web application designed to track and expose the **"Rockets and Feathers"** pricing asymmetry of retail petrol and diesel in India from **2019 to 2026**.

## 📊 Key Findings & Reports

### 1. Special Diagnostic Report
Read the detailed, data-backed findings and moral-economic analysis in the markdown report:
👉 **[asymmetry_report.md](./asymmetry_report.md)**

### 2. The Pricing Gap
*   **The Baseline:** Establish a fair markup of **₹44.77/L (Petrol)** and **₹37.38/L (Diesel)** based on pre-COVID 2019 baseline levels (which accounts for logistics, refining costs, commissions, and typical taxes).
*   **COVID Crash (2020):** Crude fell to $20.35/barrel (raw cost of **₹9.52/L**). Rather than retail petrol falling to **₹54.29/L**, prices stayed at **₹70.00/L** because the government raised excise duties to swallow the windfall.
*   **Superprofit Era (2023–2026):** Crude stabilized around $72.00–$80.00/barrel, yet retail prices remained frozen at peak war levels. By June 2026, petrol retail is at **₹97.85/L** (instead of a fair cost-plus price of **₹83.35/L**), extracting **₹14.50/L in excess profits**.
*   **Corporate Windfalls:** In FY24 alone, the three state OMCs (IOCL, BPCL, HPCL) recorded **₹80,987 Crore in standalone net profits** and combined cash reserves of **₹2,93,466 Crore**.

---

## 💻 Web App Features

The interactive dashboard (hosted on GitHub Pages) includes:
1.  **"Fair Fuel Meter" Calculator:** Recalculates fair pricing in real-time based on your custom crude oil prices and exchange rates.
2.  **State-by-State Baselines:** Custom baselines for Delhi, Mumbai, Kolkata, Chennai, Bangalore, and Hyderabad to account for regional VAT variations.
3.  **Commuter Budget Impact:** Enter your vehicle or monthly consumption to see how many kilograms of Atta, days of groceries, or school supplies are lost to the pricing gap.
4.  **Interactive Line Chart:** High-fidelity Chart.js timeline mapping actual retail prices, crude oil costs, and fair prices since 2019.
5.  **Social Share Integration:** Easily share your calculated fuel overpayment on WhatsApp and X (Twitter).

---

## 📂 Repository Contents

*   [`index.html`](./index.html): Main layout and calculator structure.
*   [`style.css`](./style.css): Slate-dark glassmorphism styling and responsive grid rules.
*   [`app.js`](./app.js): Calculator logic and Chart.js integration.
*   [`data.js`](./data.js): Cleaned historical pricing records (2019-2026) for instant client-side rendering.
*   [`india_fuel_history_1947_2026.csv`](./india_fuel_history_1947_2026.csv): Complete raw source data.
*   [`fuel_price_asymmetry_chart.png`](./fuel_price_asymmetry_chart.png): Matplotlib visualization of pricing curves.
*   [`omc_reserves_and_stacked_breakdown.png`](./omc_reserves_and_stacked_breakdown.png): Stacked bar chart showing OMC reserves and petrol cost breakdown.

---

## 🚀 How to Host This Yourself

Since this app is built using pure **HTML, CSS, and Vanilla JavaScript**, it requires no build steps or backend servers. You can deploy it to your own hosting site in seconds:

1.  Clone the repository:
    ```bash
    git clone https://github.com/trambak001/ALLOIL.git
    ```
2.  Open `index.html` in any browser to run it locally.
3.  To host it on GitHub Pages, go to **Settings** -> **Pages** in your repository and set the source branch to **`main`**.

---

*Developed by pair-programming with Antigravity AI.*
