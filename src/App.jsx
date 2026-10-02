import { useState, useEffect } from 'react'
import { getEnergyData } from './services/api'
import { Sun, Zap, TrendingDown, Leaf, Droplet, Thermometer, Activity, Settings2 } from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts'

function App() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getEnergyData().then((res) => {
      setData(res)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-xl font-semibold text-slate-600 animate-pulse">Loading Dashboard Data...</p>
      </div>
    )
  }

  // Calculate Aggregates
  const totalSolar = data.reduce((acc, curr) => acc + curr.solarProduced, 0)
  const totalConsumed = data.reduce((acc, curr) => acc + curr.electricityConsumed, 0)
  const totalPurchased = data.reduce((acc, curr) => acc + curr.electricityPurchased, 0)
  
  // Production Today vs Best
  const bestDay = [...data].sort((a, b) => b.solarProduced - a.solarProduced)[0];
  const lastDay = data[data.length - 1];
  
  // Cost assumptions
  const ELECTRICITY_RATE = 0.15; // €/kWh
  const savings = totalSolar * ELECTRICITY_RATE;
  const totalCO2Saved = data.reduce((acc, curr) => acc + curr.co2SavedKg, 0)
  
  // Aggregate data by month for cleaner charts
  const monthlyData = data.reduce((acc, curr) => {
    const month = curr.date.substring(0, 7) // "YYYY-MM"
    if (!acc[month]) {
      acc[month] = { 
        name: month, 
        solarProduced: 0, 
        electricityConsumed: 0, 
        heating: 0, 
        cooling: 0, 
        water: 0 
      }
    }
    acc[month].solarProduced += curr.solarProduced
    acc[month].electricityConsumed += curr.electricityConsumed
    acc[month].heating += curr.heating
    acc[month].cooling += curr.cooling
    acc[month].water += curr.water
    return acc
  }, {})

  const chartData = Object.values(monthlyData).map(d => ({
    ...d,
    solarProduced: Math.round(d.solarProduced),
    electricityConsumed: Math.round(d.electricityConsumed),
    heating: Math.round(d.heating),
    cooling: Math.round(d.cooling),
    water: Math.round(d.water),
  }))

  // Per Panel data aggregation (average over the year)
  const panelAggregates = lastDay.panels.map((p, idx) => {
    const totalPanelEnergy = data.reduce((acc, curr) => acc + curr.panels[idx].energy, 0);
    return {
      name: p.id,
      energy: Math.round(totalPanelEnergy)
    }
  });

  return (
    <div className="min-h-screen bg-slate-100 p-6 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">VAMK Energy Dashboard</h1>
            <p className="text-slate-500 mt-1">Main Building Energy Analytics & Sustainability</p>
          </div>
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-100">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-green-700">System Online (Mock API)</span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard 
            title="Solar Produced" 
            value={`${(totalSolar / 1000).toFixed(1)} MWh`}
            icon={<Sun className="text-amber-500" size={24} />}
            trend={`Best day: ${Math.round(bestDay.solarProduced)} kWh`}
          />
          <KpiCard 
            title="Electricity Consumed" 
            value={`${(totalConsumed / 1000).toFixed(1)} MWh`}
            icon={<Zap className="text-blue-500" size={24} />}
            trend="-5% vs last year"
          />
          <KpiCard 
            title="Estimated Savings" 
            value={`€${savings.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}`}
            icon={<TrendingDown className="text-emerald-500" size={24} />}
            subtitle="Based on €0.15/kWh"
          />
          <KpiCard 
            title="CO₂ Emissions Saved" 
            value={`${(totalCO2Saved / 1000).toFixed(1)} Tons`}
            icon={<Leaf className="text-green-500" size={24} />}
            subtitle="Based on Fingrid Grid Intensity"
          />
        </div>

        {/* Inverter Diagnostics */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="text-slate-600" size={20} />
            <h2 className="text-lg font-bold text-slate-800">Inverter Diagnostics (Latest)</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500 font-medium">Inverter Temperature</p>
              <p className="text-xl font-semibold mt-1">{lastDay.inverterTemperature}°C</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500 font-medium">Ground Fault Resistance</p>
              <p className="text-xl font-semibold mt-1">{lastDay.groundFaultResistance} kΩ</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500 font-medium">AC Voltage</p>
              <p className="text-xl font-semibold mt-1">{lastDay.acVoltage} V</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500 font-medium">AC Frequency</p>
              <p className="text-xl font-semibold mt-1">{lastDay.acFrequency} Hz</p>
            </div>
          </div>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-6">
              <Sun className="text-amber-500" size={20} />
              <h2 className="text-xl font-bold">Electricity Balance (Monthly)</h2>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="electricityConsumed" name="Consumed (kWh)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="solarProduced" name="Solar (kWh)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="text-purple-500" size={20} />
              <h2 className="text-xl font-bold">Per Panel Total Energy</h2>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={panelAggregates} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={70} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                  <Bar dataKey="energy" name="Total Energy (kWh)" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={15} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-6">
              <Thermometer className="text-rose-500" size={20} />
              <h2 className="text-xl font-bold">Heating & Cooling Demand (Monthly)</h2>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHeating" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCooling" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Area type="monotone" dataKey="heating" name="Heating (kWh)" stroke="#ef4444" fillOpacity={1} fill="url(#colorHeating)" />
                  <Area type="monotone" dataKey="cooling" name="Cooling (kWh)" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorCooling)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-6">
              <Droplet className="text-cyan-500" size={20} />
              <h2 className="text-xl font-bold">Water Usage Trend (Monthly)</h2>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="water" name="Water Usage (m³)" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function KpiCard({ title, value, icon, trend, subtitle }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-slate-500 font-medium">{title}</h3>
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        {trend && <p className="text-sm text-emerald-600 font-medium mt-1">{trend}</p>}
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}

export default App
