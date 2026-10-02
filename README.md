# VAMK Energy Dashboard ⚡🌱

A state-of-the-art energy monitoring dashboard for Vaasa University of Applied Sciences (VAMK) main building. Built with React, Vite, and Tailwind CSS — featuring real-time solar production monitoring, consumption analytics, CO₂ savings calculations powered by **Fingrid Open Data**, and per-panel diagnostics inspired by [SolarEdge Monitoring](https://github.com/badkapitan/solaredge-monitoring).

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-2-FF6384)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

### Dashboard
- **KPI Summary Cards** — Solar produced, electricity consumed, estimated savings (€), CO₂ emissions saved
- **Electricity Balance Chart** — Monthly side-by-side comparison of consumption vs. solar production
- **Heating & Cooling Demand** — Seasonal area chart visualizing HVAC energy usage
- **Water Usage Trend** — Monthly line chart tracking water consumption (m³)
- **Per Panel Energy Breakdown** — Horizontal bar chart showing individual panel output (inspired by [badkapitan/solaredge-monitoring](https://github.com/badkapitan/solaredge-monitoring))
- **Inverter Diagnostics** — Real-time display of inverter temperature, ground fault resistance, AC voltage & frequency
- **Production Today vs Best** — KPI card highlighting the best production day of the year

### Mock Data Generator
- Generates a full **365-day dataset** with hourly-resolution logic aggregated to daily metrics
- **Seasonal variations** — Solar peaks in summer, heating in winter, cooling in summer
- **Weekday/Weekend patterns** — University building consumption drops on weekends
- **Fingrid CO₂ integration** — Uses real Finnish grid emission factors (Dataset 265) when API key is provided, or realistic simulated seasonal values
- **Per-panel simulation** — 10 individual panels with randomized performance multipliers
- **Inverter diagnostics** — Temperature, ground fault resistance, AC voltage & frequency
- Outputs both **JSON** and **CSV** formats

### API-Ready Architecture
The data service layer (`src/services/api.js`) is modular and designed to be swapped with real API calls:
- **SolarEdge Monitoring API** — `/site/{siteId}/energy`, `/site/{siteId}/powerDetails`
- **Fingrid Open Data API** — Dataset 265 (CO₂ emission factor for consumed electricity)
- **Wapice IoT-Ticket** — For on-premise sensor data

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.10+)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/vamk-energy-dashboard.git
cd vamk-energy-dashboard

# Install frontend dependencies
npm install

# (Optional) Install Python dependencies for the mock data generator
pip install -r scripts/requirements.txt
```

### Generate Mock Data

```bash
# Without Fingrid API key (uses realistic simulated CO2 values)
python scripts/mock_data_generator.py

# With Fingrid API key (fetches real historical CO2 data)
# Get your free API key at https://data.fingrid.fi
export FINGRID_API_KEY="your-api-key"   # Linux/Mac
$env:FINGRID_API_KEY="your-api-key"     # PowerShell
python scripts/mock_data_generator.py
```

This generates:
- `src/data/mock_data.json` — Used by the dashboard
- `src/data/mock_data.csv` — For external analysis (Excel, Pandas, etc.)

### Run the Dashboard

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🏗️ Project Structure

```
vamk-energy-dashboard/
├── scripts/
│   ├── mock_data_generator.py   # Python data generator (Fingrid + SolarEdge simulation)
│   └── requirements.txt         # Python dependencies
├── src/
│   ├── data/
│   │   ├── mock_data.json       # Generated mock dataset (JSON)
│   │   └── mock_data.csv        # Generated mock dataset (CSV)
│   ├── services/
│   │   └── api.js               # Modular data service layer (swap for real APIs)
│   ├── App.jsx                  # Main dashboard component
│   ├── main.jsx                 # React entry point
│   └── index.css                # Tailwind CSS entry
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## 🔌 Plugging In Real Data

The architecture is designed for easy migration from mock to live data. Edit `src/services/api.js`:

```javascript
// Current: Mock data
import mockData from '../data/mock_data.json';
export const getEnergyData = async () => mockData.yearlyData;

// Future: Real SolarEdge API
export const getEnergyData = async () => {
  const res = await fetch(
    `https://monitoringapi.solaredge.com/site/${SITE_ID}/energy?api_key=${API_KEY}&startDate=...&endDate=...`
  );
  return transformSolarEdgeResponse(await res.json());
};
```

---

## 📊 Data Sources

| Source | Purpose | Status |
|--------|---------|--------|
| [SolarEdge Monitoring API](https://monitoring.solaredge.com) | Solar production, inverter data, per-panel metrics | Mock (ready to integrate) |
| [Fingrid Open Data](https://data.fingrid.fi) | CO₂ emission factors for Finnish grid (Dataset 265) | ✅ Integrated |
| [Wapice IoT-Ticket](https://www.wapice.com/iot-ticket) | On-premise sensor data (heating, water, etc.) | Mock (ready to integrate) |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| [React 19](https://react.dev) | UI framework |
| [Vite 8](https://vite.dev) | Build tool & dev server |
| [Tailwind CSS 4](https://tailwindcss.com) | Utility-first styling |
| [Recharts](https://recharts.org) | Interactive data visualization |
| [Lucide React](https://lucide.dev) | Icon library |
| [Python](https://python.org) | Mock data generation |

---

## 🤝 Acknowledgments

- [badkapitan/solaredge-monitoring](https://github.com/badkapitan/solaredge-monitoring) — Inspiration for per-panel monitoring and inverter diagnostics features
- [Fingrid](https://data.fingrid.fi) — Open CO₂ emission data for Finnish electricity grid
- [SolarEdge](https://www.solaredge.com) — Monitoring API documentation

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
