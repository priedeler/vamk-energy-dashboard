import mockData from '../data/mock_data.json';

export const getEnergyData = async () => {
  // In the future: return fetch(`https://monitoringapi.solaredge.com/...`)
  // For now, return the mock data directly (simulating async network call)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockData.yearlyData);
    }, 500);
  });
};
