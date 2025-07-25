//services/authService.js

import axios from '../axiosInstance';
import {logger} from '../utils/logger';

// Đăng nhập người dùng
export const login = async (email, password) => {
    try {
        const formData = new URLSearchParams();
        formData.append('username', email); // Gửi email như username theo yêu cầu API
        formData.append('password', password);

        const response = await axios.post('/auth/login', formData, {
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        });
        return response.data;
    } catch (err) {
        logger.error('Login error:', err.response?.data || err.message);
        throw err;
    }
};

// Đăng ký người dùng mới
export const register = async (email, password) => {
    try {
        const response = await axios.post('/auth/register', {
            email,
            password,
        });
        return response.data;
    } catch (err) {
        logger.error('Registration error:', err.response?.data || err.message);
        throw err;
    }
};

// Lấy thông tin người dùng hiện tại
export const getCurrentUser = async () => {
    try {
        const response = await axios.get('/auth/me');
        return response.data;
    } catch (err) {
        logger.error('Get user info error:', err.response?.data || err.message);
        throw err;
    }
};

// Cập nhật thông tin người dùng
export const updateUserProfile = async (formData) => {
    try {
        const response = await axios.patch('/auth/update', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (err) {
        logger.error('Update profile error:', err.response?.data || err.message);
        throw err;
    }
};

// Đổi mật khẩu người dùng
export const changePassword = async (oldPassword, newPassword) => {
    try {
        const response = await axios.post('/auth/change-password', {
            oldPassword,
            newPassword,
        });
        return response.data;
    } catch (err) {
        logger.error('Change password error:', err.response?.data || err.message);
        throw err;
    }
};

// Yêu cầu reset mật khẩu (quên mật khẩu)
export const forgotPassword = async (email) => {
    try {
        const response = await axios.post('/auth/forgot-password', {email});
        return response.data;
    } catch (err) {
        logger.error('Forgot password error:', err.response?.data || err.message);
        throw err;
    }
};

// Reset mật khẩu với token
export const resetPassword = async (email, token, newPassword) => {
    try {
        const response = await axios.post('/auth/reset-password', {
            email,
            token,
            newPassword,
        });
        return response.data;
    } catch (err) {
        logger.error('Reset password error:', err.response?.data || err.message);
        throw err;
    }
};

// Cập nhật methods model AI
export const updateMethods = async (methods) => {
    try {
        const response = await axios.post('/auth/update-methods', methods);
        return response.data;
    } catch (err) {
        logger.error('Update methods error:', err.response?.data || err.message);
        throw err;
    }
};
