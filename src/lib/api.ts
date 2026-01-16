import axios from "axios";

// 1. Create the Axios instance with your Backend URL
const api = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. The Interceptor: Before every request, check for the Token
api.interceptors.request.use(
  (config) => {
    // We stored the token in localStorage during Login
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;