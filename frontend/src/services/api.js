import axios from "axios";

// ✅ FIX: base URL + /api add kiya
const BASE_URL =
  (import.meta.env.VITE_API_URL ||
    "https://team-task-manager-production-ef9c.up.railway.app") + "/api";

// Create Axios instance
const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Attach token to every request
API.interceptors.request.use(
  (req) => {
    const token = localStorage.getItem("token");

    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }

    return req;
  },
  (error) => Promise.reject(error)
);

// Debugging interceptor 🔥
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("API ERROR:", error.response || error.message);
    return Promise.reject(error);
  }
);

export default API;