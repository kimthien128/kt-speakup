import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            // console.log('Sending token:', token);
        } else {
            console.log('No token found in localStorage');
        }
        // console.log('Request URL:', config.url); // Debug URL
        // console.log('Full URL:', config.baseURL + config.url); // Debug full URL
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => {
        if (response.headers['x-new-token']) {
            localStorage.setItem('token', response.headers['x-new-token']);
        }
        return response;
    },
    (error) => {
        if (error.response?.status == 401) {
            localStorage.removeItem('token');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
