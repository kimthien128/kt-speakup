//services/chatsService.js
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

// Lấy thông tin chat bao gồm gợi ý mới nhất
export const getChatInfo = async (chatId) => {
    try {
        const response = await axios.get(`/chats/${chatId}`, {
            headers: {'Content-Type': 'application/json'},
        });
        return response.data;
    } catch (err) {
        logger.error(`Error fetching chat info for ${chatId}:`, err.response?.data || err.message);
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

// Hàm cập nhật URL audio cho mỗi tin nhắn từ AI
export const updateAudioUrl = async (chatId, index, audioUrl) => {
    try {
        await axios.patch(
            `/chats/${chatId}/audioUrl`,
            {index, audioUrl},
            {headers: {'Content-Type': 'application/json'}}
        );
        logger.info(`Updated audioUrl for chatId: ${chatId}, index: ${index}`);
    } catch (err) {
        logger.error(`Failed to update audioUrl: ${err.message}`);
        throw err;
    }
};

// Dịch tin nhắn AI trong một cuộc trò chuyện
export const translateAIMessage = async (chatId, text, index, targetLang = 'vi') => {
    try {
        const response = await axios.post(
            `/chats/${chatId}/translate-ai`,
            {
                text,
                target_lang: targetLang,
                chat_id: chatId,
                index,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (err) {
        logger.error('Error translating AI message:', err.response?.data || err.message);
        throw new Error('Failed to translate message');
    }
};

// Cập nhật gợi ý mới nhất cho cuộc trò chuyện (suggestionData là một object:
// latest_suggestion, translate_suggestion, suggestion_audio_url
export const updateSuggestion = async (chatId, suggestionData) => {
    try {
        const response = await axios.put(`/chats/${chatId}/suggestion`, suggestionData, {
            headers: {'Content-Type': 'application/json'},
        });
        // logger.info(`Updated suggestion for chatId ${chatId}`);
        return response.data; // Trả về dữ liệu đã cập nhật
    } catch (err) {
        logger.error(`Error updating suggestion for ${chatId}:`, err.response?.data || err.message);
        throw err;
    }
};
