// src/services/vocabService.js
//service để xử lý các API liên quan đến từ vựng

import axios from '../axiosInstance';
import {logger} from '../utils/logger';

// Định nghĩa cấu trúc phản hồi mặc định
const DEFAULT_RESPONSE = {
    definition: 'No definition found',
    phonetic: 'N/A',
    audio: [],
    examples: [],
};

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

// Lấy thông tin từ vựng từ API
export const fetchWordInfo = async (word, source = 'dictionaryapi', limit = 2) => {
    if (!word || typeof word !== 'string') {
        throw new Error('Word must be a non-empty string');
    }

    logger.info(`Fetching word info for word: ${word}, source: ${source}`);

    try {
        const response = await axios.post(
            `/vocabs/word-info`,
            {word, source, limit}, // Truyền source vào body để backend biết gọi API nào
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        logger.info('Response from API:', response.data);
        if (!response.data || typeof response.data !== 'object') {
            logger.error('Invalid response format from API');
            throw new Error('Invalid response format');
        }

        return {
            definition: response.data.definition || DEFAULT_RESPONSE.definition,
            phonetic: response.data.phonetic || DEFAULT_RESPONSE.phonetic,
            audio: Array.isArray(response.data.audio) ? response.data.audio : DEFAULT_RESPONSE.audio,
            examples: Array.isArray(response.data.examples) ? response.data.examples : DEFAULT_RESPONSE.examples,
        };
    } catch (error) {
        logger.error(`Error fetching word info for ${word}: ${error.message}`);
        throw error;
    }
};
