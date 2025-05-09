// src/services/vocabService.js
//service để xử lý các API liên quan đến từ vựng (fetchVocab, deleteVocab)

import axios from '../axiosInstance';
import {logger} from '../utils/logger';

export const vocabService = {
    // Lấy danh sách từ vựng của một chat
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

    // Xóa một từ vựng
    async deleteVocab(chatId, vocabId) {
        try {
            await axios.delete(`/vocab/${chatId}/${vocabId}`);
        } catch (error) {
            logger.error(`Error deleting vocab ${vocabId} in chat ${chatId}: ${error.message}`);
            throw error;
        }
    },
};
