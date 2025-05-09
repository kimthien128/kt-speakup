//service/configService.js

import axios from '../axiosInstance';
import {logger} from '../utils/logger';

// Lấy cấu hình hệ thống
export const getConfig = async () => {
    try {
        const response = await axios.get('/config');
        return response.data;
    } catch (err) {
        logger.error('Error fetching config:', err.response?.data || err.message);
        throw err;
    }
};

// Cập nhật cấu hình hệ thống
export const updateConfig = async (formData) => {
    try {
        const response = await axios.patch('/config', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (err) {
        logger.error('Error updating config:', err.response?.data || err.message);
        throw err;
    }
};
