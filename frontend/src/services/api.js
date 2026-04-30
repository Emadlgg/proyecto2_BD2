const API_URL = 'http://localhost:3000/api';

export const getSuppliers = async () => {
  const res = await fetch(`${API_URL}/suppliers`);
  return res.json();
};

export const getTopSuppliers = async () => {
  const res = await fetch(`${API_URL}/analysis/top-suppliers`);
  return res.json();
};

export const getShortestPath = async (supplierId, retailerId) => {
  const res = await fetch(`${API_URL}/analysis/shortest-path/${supplierId}/${retailerId}`);
  if (!res.ok) throw new Error('Path not found');
  return res.json();
};

export const getStats = async () => {
  const res = await fetch(`${API_URL}/stats/counts`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
};
