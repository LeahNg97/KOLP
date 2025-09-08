import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Get all workshops (admin view)
export const getAllWorkshops = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/workshops`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Get workshop by ID
export const getWorkshopById = async (workshopId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/workshops/${workshopId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Update workshop (admin can update any workshop)
export const updateWorkshop = async (workshopId, workshopData) => {
  const token = localStorage.getItem('token');
  
  const transformedData = {
    title: workshopData.title,
    description: workshopData.description,
    startAt: workshopData.startAt,
    endAt: workshopData.endAt,
    timeZone: workshopData.timeZone,
    meetingUrl: workshopData.meetingUrl,
    meetingProvider: workshopData.meetingProvider,
    maxParticipants: workshopData.maxParticipants,
    registrationRequired: workshopData.registrationRequired,
    registrationDeadline: workshopData.registrationDeadline,
    price: workshopData.price,
    currency: workshopData.currency,
    requirements: workshopData.requirements,
    materials: workshopData.materials,
    isPublished: workshopData.isPublished
  };

  const response = await axios.put(`${API_BASE_URL}/workshops/${workshopId}`, transformedData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

// Update workshop status
export const updateWorkshopStatus = async (workshopId, status) => {
  const token = localStorage.getItem('token');
  const response = await axios.patch(`${API_BASE_URL}/workshops/${workshopId}/status`, 
    { status }, 
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

// Delete workshop
export const deleteWorkshop = async (workshopId) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`${API_BASE_URL}/workshops/${workshopId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Get workshops by instructor ID
export const getWorkshopsByInstructor = async (instructorId, filters = {}) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.published !== undefined) params.append('published', filters.published);
  
  const queryString = params.toString();
  const url = `${API_BASE_URL}/workshops/instructor/${instructorId}${queryString ? `?${queryString}` : ''}`;
  
  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Get workshop statistics
export const getWorkshopStats = async () => {
  const token = localStorage.getItem('token');
  const workshops = await getAllWorkshops();
  
  const stats = {
    total: workshops.length,
    published: workshops.filter(w => w.isPublished).length,
    scheduled: workshops.filter(w => w.status === 'scheduled').length,
    live: workshops.filter(w => w.status === 'live').length,
    completed: workshops.filter(w => w.status === 'completed').length,
    canceled: workshops.filter(w => w.status === 'canceled').length,
    upcoming: workshops.filter(w => w.startAt > new Date()).length,
    totalParticipants: workshops.reduce((sum, w) => sum + (w.stats?.totalRegistrations || 0), 0),
    totalAttendees: workshops.reduce((sum, w) => sum + (w.stats?.totalAttendees || 0), 0)
  };
  
  return stats;
};