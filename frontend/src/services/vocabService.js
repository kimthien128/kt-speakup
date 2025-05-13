// src/services/vocabService.js
//service để xử lý các API liên quan đến từ vựng

import axios from '../axiosInstance';
import {logger} from '../utils/logger';

// Lấy danh sách từ vựng của một chat
export const fetchVocab = async (chatId) => {
    if (!chatId || chatId === 'null' || chatId === 'undefined') {
        return [];
    }

    try {
        const response = await axios.get(`/vocabs/${chatId}`);
        return response.data.vocab || [];
    } catch (error) {
        logger.error(`Error fetching vocab list for chat ${chatId}: ${error.message}`);
        throw error;
    }
};

// Thêm từ vựng mới
export const addVocab = async (word, definition, phonetic, audio, chatId) => {
    try {
        await axios.post(
            `/vocabs`,
            {word, definition, phonetic, audio, chat_id: chatId},
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    } catch (err) {
        logger.error(`Error adding vocab ${word} to chat ${chatId}: ${err.message}`);
        throw err;
    }
};

// Xóa một từ vựng
export const deleteVocab = async (chatId, vocabId) => {
    try {
        await axios.delete(`/vocabs/${chatId}/${vocabId}`);
    } catch (error) {
        logger.error(`Error deleting vocab ${vocabId} in chat ${chatId}: ${error.message}`);
        throw error;
    }
};
