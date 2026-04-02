import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const detail = error.response?.data?.detail || '';

        // Banned/inactive user — backend returns 401 with "User inactive or deleted."
        if (status === 401 && detail.toLowerCase().includes('inactive')) {
            // Keep token so Banned page can still fetch appeal data
            window.location.href = '/banned';
            return Promise.reject(error);
        }

        // Token expired or invalid — redirect to login
        if (status === 401 && !window.location.pathname.includes('/login')) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('role');
            localStorage.removeItem('name');
            window.location.href = '/login';
            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

export default api;
