import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Get published workshops (public catalog)
export const getPublishedWorkshops = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.instructorId) params.append('instructorId', filters.instructorId);
  if (filters.upcoming !== undefined) params.append('upcoming', filters.upcoming);
  
  const queryString = params.toString();
  const url = `${API_BASE_URL}/workshops/published${queryString ? `?${queryString}` : ''}`;
  
  const response = await axios.get(url);
  return response.data;
};

// Get workshop by ID
export const getWorkshopById = async (workshopId) => {
  const response = await axios.get(`${API_BASE_URL}/workshops/${workshopId}`);
  return response.data;
};

// Search workshops
export const searchWorkshops = async (searchQuery, filters = {}) => {
  const params = new URLSearchParams();
  
  if (searchQuery) params.append('q', searchQuery);
  if (filters.status) params.append('status', filters.status);
  if (filters.instructorId) params.append('instructorId', filters.instructorId);
  if (filters.upcoming !== undefined) params.append('upcoming', filters.upcoming);
  
  const queryString = params.toString();
  const url = `${API_BASE_URL}/workshops/search${queryString ? `?${queryString}` : ''}`;
  
  const response = await axios.get(url);
  return response.data;
};

// Get upcoming workshops
export const getUpcomingWorkshops = async () => {
  return getPublishedWorkshops({ upcoming: true });
};

// Get workshops by status
export const getWorkshopsByStatus = async (status) => {
  return getPublishedWorkshops({ status });
};

// Get workshops by instructor
export const getWorkshopsByInstructor = async (instructorId) => {
  return getPublishedWorkshops({ instructorId });
};