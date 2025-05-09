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
        logger.info('Audio URL updated successfully');
    } catch (err) {
        logger.error(`Failed to update audioUrl: ${err.message}`);
        throw err;
    }
};
