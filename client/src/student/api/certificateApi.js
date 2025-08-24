import axios from 'axios';

export const getMyCertificates = async () => {
  const token = localStorage.getItem('token');
  const res = await axios.get('http://localhost:8080/api/certificates', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}; 

export const getCertificateById = async (token,certificateId) => {
  const res = await axios.get(`http://localhost:8080/api/certificates/${certificateId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};


