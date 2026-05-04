import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://team-task-manager-production-ef9c.up.railway.app/api"; // ✅ FIX

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

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

API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("API ERROR:", error.response || error.message);
    return Promise.reject(error);
  }
);

export default API;