//services/translateService.js

import axios from '../axiosInstance';
import {logger} from '../utils/logger';

// Dịch một văn bản sang ngôn ngữ đích (hiện tại endpoint đang dùng google translate)
export const translateText = async (text, targetLang = 'vi') => {
    // Kiểm tra nếu text là undefined, null, hoặc chuỗi rỗng
    if (typeof text !== 'string' || !text || text.trim() === '') {
        logger.warn('Translate text called with empty or invalid text');
        return '';
    }

    try {
        // logger.info(`Translating text: "${text}" to targetLang: ${targetLang}`);
        const response = await axios.post(
            '/translate',
            {text, target_lang: targetLang},
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        // logger.info('Translation response:', response.data);
        return response.data.translatedText || 'Translation not available'; // Trả về văn bản đã dịch
    } catch (err) {
        logger.error(`Error translating text: ${err.response?.data || err.message}`);
        throw err;
    }
};

// Dịch nhiều văn bản cùng lúc
// tham số texts là Mảng các văn bản cần dịch
export const translateMultipleTexts = async (texts, targetLang = 'vi') => {
    if (!texts || texts.length === 0) {
        logger.warn('Translate multiple texts called with empty array');
        return [];
    }

    try {
        // logger.info(`Translating ${texts.length} texts to ${targetLang}`);
        const translationPromises = texts.map((text) => translateText(text, targetLang));
        return await Promise.all(translationPromises); // Chờ tất cả các lời hứa dịch hoàn thành
    } catch (err) {
        logger.error(`Error translating multiple texts: ${err.message}`);
        throw err;
    }
};
