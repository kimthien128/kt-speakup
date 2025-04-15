// src/services/chatService.js
//xử lý các API liên quan đến chat (fetchHistory)

import axios from '../axiosInstance';
import {logger} from '../utils/logger';

export const chatService = {
    /**
     * Lấy lịch sử chat từ backend
     * @param {string} chatId - ID của chat
     * @returns {Promise<Array>} - Lịch sử chat
     * @throws {Error} - Nếu có lỗi xảy ra
     */
    async fetchHistory(chatId) {
        if (!chatId) {
            return [];
        }

        try {
            const response = await axios.get(`/chats/${chatId}/history`);
            return response.data.history || [];
        } catch (error) {
            logger.error(`Error fetching chat history for chat ${chatId}: ${error.message}`);
            throw error;
        }
    },
};
