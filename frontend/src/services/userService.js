//services/userService.js

import axios from '../axiosInstance';
import {logger} from '../utils/logger';

// Lấy danh sách người dùng
export const getUsers = async () => {
    try {
        const response = await axios.get('/users');
        return response.data; // Trả về mảng danh sách người dùng
    } catch (err) {
        logger.error('Error fetching users:', err.response?.data || err.message);
        throw err;
    }
};

/**
 * Lấy thông tin của một người dùng cụ thể
 * @param {string} userId - ID của người dùng
 * @returns {Promise<Object>} Thông tin chi tiết của người dùng
 */
export const getUserById = async (userId) => {
    try {
        const response = await axios.get(`/users/${userId}`);
        return response.data;
    } catch (err) {
        logger.error(`Error fetching user ${userId}:`, err.response?.data || err.message);
        throw err;
    }
};

// Tạo người dùng mới
export const createUser = async (userData) => {
    try {
        const response = await axios.post('/users', userData);
        return response.data; // Trả về thông tin người dùng mới tạo
    } catch (err) {
        logger.error('Error creating user:', err.response?.data || err.message);
        throw err;
    }
};

// Cập nhật thông tin người dùng
export const updateUser = async (userId, userData) => {
    try {
        const response = await axios.patch(`/users/${userId}`, userData);
        return response.data; // Trả về thông tin người dùng đã cập nhật
    } catch (err) {
        logger.error(`Error updating user ${userId}:`, err.response?.data || err.message);
        throw err;
    }
};

// Xóa người dùng
export const deleteUser = async (userId) => {
    try {
        await axios.delete(`/users/${userId}`);
    } catch (err) {
        logger.error(`Error deleting user ${userId}:`, err.response?.data || err.message);
        throw err;
    }
};
