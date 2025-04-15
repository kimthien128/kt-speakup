// src/services/vocabService.js
//service để xử lý các API liên quan đến từ vựng (fetchVocab, deleteVocab)

import axios from '../axiosInstance';
import {logger} from '../utils/logger';

export const vocabService = {
    /**
     * Lấy danh sách từ vựng của một chat
     * @param {string} chatId - ID của chat
     * @returns {Promise<Array>} - Danh sách từ vựng
     * @throws {Error} - Nếu có lỗi xảy ra
     */
    async fetchVocab(chatId) {
        if (!chatId || chatId === 'null' || chatId === 'undefined') {
            return [];
        }

        try {
            const response = await axios.get(`/vocab/${chatId}`);
            return response.data.vocab || [];
        } catch (error) {
            logger.error(`Error fetching vocab list for chat ${chatId}: ${error.message}`);
            throw error;
        }
    },

    /**
     * Xóa một từ vựng
     * @param {string} chatId - ID của chat
     * @param {string} vocabId - ID của từ vựng
     * @returns {Promise<void>}
     * @throws {Error} - Nếu có lỗi xảy ra
     */

    async deleteVocab(chatId, vocabId) {
        try {
            await axios.delete(`/vocab/${chatId}/${vocabId}`);
        } catch (error) {
            logger.error(`Error deleting vocab ${vocabId} in chat ${chatId}: ${error.message}`);
            throw error;
        }
    },
};
