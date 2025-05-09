//services/generateService.js
import axios from '../axiosInstance';
import {logger} from '../utils/logger';

// Hàm gọi API để lấy phản hồi chat từ AI
export const generateResponse = async ({method, transcript, chatId}) => {
    try {
        const response = await axios.post(
            `/generate?method=${method}`,
            {
                transcript,
                chat_id: chatId,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        if (response.data.error) {
            throw new Error(response.data.error);
        }
        return response.data.response; // Trả về phản hồi từ AI
    } catch (err) {
        logger.error('Error in generateResponse:', err.response?.data || err.message);
        throw err; // Ném lỗi để xử lý ở cấp cao hơn
    }
};

// Hàm gọi API để dịch văn bản
export const translate = async ({method, text, sourceLang, targetLang}) => {
    try {
        const response = await axios.post(
            `/generate/translate?method=${method}`,
            {
                text,
                source_lang: sourceLang,
                target_lang: targetLang,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        if (response.data.error) {
            throw new Error(response.data.error);
        }
        return response.data.translated_text; // Trả về văn bản đã dịch
    } catch (err) {
        logger.error('Error in translate:', err.response?.data || err.message);
        throw err;
    }
};
