// API Configuration
// This uses environment variables from .env file
// For Vite, environment variables must be prefixed with VITE_

const API_URL = import.meta.env.VITE_API_URL || 'http://10.138.121.99:4000';

export const API_ENDPOINTS = {
    LOGIN: `${API_URL}/api/login`,
    FEEDBACK: `${API_URL}/api/feedback`,
};

export default API_URL;
