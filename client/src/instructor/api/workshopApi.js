import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Get instructor's workshops
export const getMyWorkshops = async () => {
  const token = localStorage.getItem('token');
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = userData._id || userData.id;
  
  if (!userId) {
    throw new Error('User ID not found');
  }
  
  const response = await axios.get(`${API_BASE_URL}/workshops/instructor/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Get all workshops (admin/instructor view)
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

// Create a new workshop
export const createWorkshop = async (workshopData) => {
  const token = localStorage.getItem('token');
  
  console.log('Creating workshop with token:', token ? 'exists' : 'missing');
  console.log('Workshop data:', workshopData);
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const transformedData = {
    title: workshopData.title,
    description: workshopData.description,
    startAt: workshopData.startAt,
    endAt: workshopData.endAt,
    timeZone: workshopData.timeZone || 'Asia/Bangkok',
    meetingUrl: workshopData.meetingUrl,
    meetingProvider: workshopData.meetingProvider || 'google_meet',
    maxParticipants: workshopData.maxParticipants || 50,
    registrationRequired: true, // Luôn yêu cầu đăng ký
    registrationDeadline: workshopData.registrationDeadline,
    price: workshopData.price || 0,
    currency: workshopData.currency || 'AUD',
    requirements: workshopData.requirements,
    materials: workshopData.materials || [],
    isPublished: true // Tự động xuất bản
  };

  const response = await axios.post(`${API_BASE_URL}/workshops`, transformedData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

// Update workshop
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
    registrationRequired: true, // Luôn yêu cầu đăng ký
    registrationDeadline: workshopData.registrationDeadline,
    price: workshopData.price,
    currency: workshopData.currency,
    requirements: workshopData.requirements,
    materials: workshopData.materials,
    isPublished: true // Luôn xuất bản
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