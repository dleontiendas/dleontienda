// src/api/axiosClient.js

import axios from "axios";

const axiosClient = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    "http://localhost:3001",

  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "API Error:",
      error?.response?.data ||
      error.message
    );

    return Promise.reject(error);
  }
);

export default axiosClient;