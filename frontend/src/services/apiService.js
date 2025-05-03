//services/apiService.js
import axios from '../axiosInstance';
import {logger} from '../utils/logger';

// Hàm tạo chat mới
export const createChat = async () => {
    try {
        const response = await axios.post('/chats');
        return response.data.chat_id; // Trả về chat ID mới tạo
    } catch (err) {
        logger.error('Error creating chat:', err.response?.data || err.message);
        throw new Error('Failed to create chat');
    }
};

// Hàm gọi API để lấy phản hồi từ AI
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

// Hàm lấy lịch sử chat
export const getChatHistory = async (chatId) => {
    try {
        const response = await axios.get(`/chats/${chatId}/history`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data.history; // Trả về lịch sử chat
    } catch (err) {
        logger.error('Error getting chat history:', err.response?.data || err.message);
        throw new Error('Failed to get chat history');
    }
};

// Hàm lấy audio từ TTS
export const getTTS = async ({method, text}) => {
    try {
        const response = await axios.post(
            `/tts?method=${method}`,
            {text},
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.headers['x-audio-url']; // Trả về URL audio
    } catch (err) {
        logger.error('Error getting TTS:', err.response?.data || err.message);
        throw new Error('Failed to get audio');
    }
};

// Hàm lưu lịch sử chat
export const saveChatHistory = async (chatId, messageData) => {
    try {
        const response = await axios.post(`/chats/${chatId}/history`, messageData, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data; // Trả về kết quả lưu
    } catch (err) {
        logger.error('Error saving chat history:', err.response?.data || err.message);
        throw new Error('Failed to save chat history');
    }
};

// Hàm lấy danh sách chat
export const fetchChatList = async () => {
    try {
        const response = await axios('/chats');
        return response.data.chats || response.data; // Trả về mảng chat hoặc dữ liệu trực tiếp
    } catch (err) {
        logger.error('Error fetching chats:', err.response?.data || err.message);
        throw new Error('Failed to fetch chats');
    }
};

// Hàm xóa chat
export const deleteChat = async (chatId) => {
    try {
        await axios.delete(`/chats/${chatId}`);
    } catch (err) {
        logger.error('Error deleting chat:', err.response?.data || err.message);
        throw new Error('Failed to delete chat');
    }
};

// Hàm cập nhật tiêu đề chat
export const saveChatTitle = async (chatId, title) => {
    try {
        await axios.put(`/chats/${chatId}`, {title}, {headers: {'Content-Type': 'application/json'}});
    } catch (err) {
        logger.error('Error updating title:', err.response?.data || err.message);
        throw new Error('Failed to update title');
    }
};

// Hàm cập nhật URL audio
export const updateAudioUrl = async (chatId, index, audioUrl) => {
    try {
        await axios.patch(
            `/chats/${chatId}/audioUrl`,
            {index, audioUrl},
            {headers: {'Content-Type': 'application/json'}}
        );
        logger.info('Audio URL updated successfully');
    } catch (err) {
        logger.error(`Failed to update audioUrl: ${err.message}`);
        throw err;
    }
};
