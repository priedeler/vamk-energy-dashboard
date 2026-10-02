import json
import random
import os
import requests
from datetime import datetime, timedelta

import csv

def fetch_fingrid_co2_factor(date, api_key):
    """
    Fetches the CO2 emission factor for electricity consumed in Finland (Dataset 265).
    Since we are generating future/mock data (2025), we query the same day from 2024.
    """
    past_date = date.replace(year=2024)
    start_time = past_date.strftime("%Y-%m-%dT00:00:00Z")
    end_time = (past_date + timedelta(days=1)).strftime("%Y-%m-%dT00:00:00Z")
    
    url = f"https://data.fingrid.fi/api/datasets/265/data?startTime={start_time}&endTime={end_time}&format=json"
    headers = {
        "x-api-key": api_key
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json().get('data', [])
            if data:
                # Average CO2 value for the day in gCO2/kWh
                avg_co2 = sum(item['value'] for item in data) / len(data)
                return avg_co2
    except Exception as e:
        print(f"Failed to fetch Fingrid data for {start_time}: {e}")
        
    return None

def get_simulated_co2_factor(date):
    """
    Provides a realistic Finnish grid CO2 emission factor (gCO2/kWh) if API key is not present.
    """
    month = date.month
    if month in [11, 12, 1, 2]: # Winter
        return random.uniform(80, 150)
    elif month in [3, 4, 9, 10]: # Spring/Autumn
        return random.uniform(50, 90)
    else: # Summer
        return random.uniform(20, 60)

def generate_yearly_data(api_key=None):
    start_date = datetime(2025, 1, 1)
    end_date = datetime(2025, 12, 31)
    
    data = []
    
    current_date = start_date
    while current_date <= end_date:
        is_weekend = current_date.weekday() >= 5
        month = current_date.month
        
        # Base daily consumption
        base_electricity = random.uniform(300, 500) if not is_weekend else random.uniform(100, 200)
        
        # Solar production (higher in summer)
        solar_factor = 1.5 if 4 <= month <= 9 else 0.5
        solar_production = random.uniform(150, 400) * solar_factor
        
        # Heating and cooling
        heating = 0
        cooling = 0
        if month in [11, 12, 1, 2, 3, 4]:
            heating = random.uniform(500, 1000) if not is_weekend else random.uniform(200, 400)
        elif month in [6, 7, 8]:
            cooling = random.uniform(200, 500) if not is_weekend else random.uniform(100, 200)
            
        # Water usage
        water = random.uniform(5, 15) if not is_weekend else random.uniform(1, 3)
        
        # Calculations
        electricity_purchased = max(0, base_electricity - solar_production)
        electricity_exported = max(0, solar_production - base_electricity)
        
        # CO2 saved calculation based on Fingrid
        co2_factor_g_per_kwh = None
        if api_key:
            co2_factor_g_per_kwh = fetch_fingrid_co2_factor(current_date, api_key)
            
        if co2_factor_g_per_kwh is None:
            co2_factor_g_per_kwh = get_simulated_co2_factor(current_date)
            
        # Convert g to kg
        co2_factor_kg_per_kwh = co2_factor_g_per_kwh / 1000.0
        co2_emissions_saved_kg = solar_production * co2_factor_kg_per_kwh
        
        # New features from badkapitan/solaredge-monitoring
        inverter_temperature = random.uniform(30, 60)
        ground_fault_resistance = random.uniform(3000, 4000)
        ac_voltage = random.uniform(220, 240)
        ac_frequency = random.uniform(49.8, 50.2)
        
        # Per panel data (let's assume 10 panels)
        panels = []
        for i in range(10):
            # Give panels slightly different performance multipliers (e.g. some shade)
            multiplier = random.uniform(0.8, 1.2)
            panel_energy = (solar_production / 10) * multiplier
            panels.append({
                "id": f"Panel-{i+1}",
                "energy": round(panel_energy, 2)
            })

        data.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "electricityConsumed": round(base_electricity, 2),
            "solarProduced": round(solar_production, 2),
            "electricityPurchased": round(electricity_purchased, 2),
            "electricityExported": round(electricity_exported, 2),
            "heating": round(heating, 2),
            "cooling": round(cooling, 2),
            "water": round(water, 2),
            "co2IntensityGPerKwh": round(co2_factor_g_per_kwh, 2),
            "co2SavedKg": round(co2_emissions_saved_kg, 2),
            "inverterTemperature": round(inverter_temperature, 2),
            "groundFaultResistance": round(ground_fault_resistance, 2),
            "acVoltage": round(ac_voltage, 2),
            "acFrequency": round(ac_frequency, 2),
            "panels": panels
        })
        
        current_date += timedelta(days=1)
        
    return data

def export_to_csv(data, out_path):
    if not data:
        return
    
    # Flatten the panels list for CSV
    headers = list(data[0].keys())
    headers.remove("panels")
    # Add panel headers dynamically
    num_panels = len(data[0]["panels"])
    for i in range(num_panels):
        headers.append(f"panel_{i+1}_energy")
        
    with open(out_path, mode='w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=headers)
        writer.writeheader()
        
        for row in data:
            row_dict = {k: v for k, v in row.items() if k != "panels"}
            for i, panel in enumerate(row["panels"]):
                row_dict[f"panel_{i+1}_energy"] = panel["energy"]
            writer.writerow(row_dict)

if __name__ == "__main__":
    api_key = os.environ.get("FINGRID_API_KEY")
    if not api_key:
        print("Note: FINGRID_API_KEY environment variable not set. Using simulated realistic Fingrid CO2 values.")
    else:
        print("Fingrid API Key detected. Fetching historical CO2 data from data.fingrid.fi...")
        
    os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'src', 'data'), exist_ok=True)
    json_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'mock_data.json')
    csv_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'mock_data.csv')
    
    mock_data = generate_yearly_data(api_key)
    
    # JSON Export
    with open(json_path, 'w') as f:
        json.dump({"yearlyData": mock_data}, f, indent=4)
    print(f"Mock JSON successfully written to {json_path}")
    
    # CSV Export
    export_to_csv(mock_data, csv_path)
    print(f"Mock CSV successfully written to {csv_path}")
