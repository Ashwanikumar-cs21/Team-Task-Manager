import axios from "axios";

// Base Axios instance pointing at the backend API
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

// Attach the JWT token to every outgoing request if one is stored
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default API;
