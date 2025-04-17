// hooks/useMessageHandler.js
// Quản lý gửi tin nhắn và phản hồi AI

import axios from '../axiosInstance';
import {logger} from '../utils/logger';

export const useMessageHandler = (
    chatId,
    setChatId,
    onSendMessage,
    refreshChats,
    generateMethod,
    ttsMethod,
    playSound
) => {
    // Gửi tin nhắn và xử lý phản hồi
    const handleSend = async (transcript) => {
        if (!transcript.trim()) return; // Ngăn gửi nếu transcript rỗng

        let currentChatId = chatId;
        // Nếu chatId không hợp lệ, tạo chat mới trước
        if (
            !currentChatId ||
            currentChatId === 'null' ||
            currentChatId === 'undefined' ||
            typeof currentChatId !== 'string'
        ) {
            try {
                const res = await axios.post(`/chats`);
                currentChatId = res.data.chat_id;
                setChatId(currentChatId); // Cập nhật chatId và URL
                if (refreshChats) await refreshChats(); // Cập nhật danh sách sau khi tạo chat
            } catch (err) {
                logger.error('Error creating chat:', err.response?.data || err.message);
                return {error: 'Error creating chat'};
            }
        }

        // Hiển thị tin nhắn người dùng ngay lập tức
        const userMessage = {user: transcript, ai: '...'};
        if (onSendMessage) {
            logger.info('Send message:', userMessage);
            onSendMessage(userMessage); // Gửi tin nhắn tạm ngay lập tức
        }
        // const temp = transcript;
        // setTranscript(''); // Xóa textarea

        try {
            // Xử lý viết hoa chữ cái đầu
            const userInput = transcript.charAt(0).toUpperCase() + transcript.slice(1);

            // Gửi transcript đến /generate để lấy phản hồi từ AI
            const generateResponse = await axios.post(
                `/generate?method=${generateMethod}`,
                {transcript: userInput, chat_id: currentChatId},
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            if (generateResponse.data.error) throw new Error(generateResponse.data.error);
            const aiResponse = generateResponse.data.response;

            // Lấy audioUrl từ /tts và truyền vào playSound
            const ttsResponse = await axios.post(
                `/tts?method=${ttsMethod}`,
                {text: aiResponse},
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            const audioUrl = ttsResponse.headers['x-audio-url'];
            await playSound({audioUrl}); // Phát âm thanh với audioUrl

            // Lưu vào backend /chats/{chat_id}/history
            await axios.post(
                `/chats/${currentChatId}/history`,
                {user: userInput, ai: aiResponse, audioUrl: audioUrl},
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            // Cập nhật ChatArea với phản hồi AI
            const updatedMessage = {user: userInput, ai: aiResponse};
            if (onSendMessage) {
                onSendMessage(updatedMessage);
            }

            // Cập nhật danh sách sau khi gửi tin nhắn
            if (refreshChats) await refreshChats();
            return {aiResponse, currentChatId};
            // Lấy gợi ý dựa trên response
            // try {
            //     await fetchSuggestions(aiResponse, currentChatId);
            // } catch (err) {
            //     console.error('Error fetching suggestions:', err);
            // }
        } catch (err) {
            logger.error('Error in handleSend:', err);
            const errorMessage = {user: userInput, ai: 'Error processing response'};
            if (onSendMessage) {
                onSendMessage(errorMessage);
            }
            return {error: err.message};
        }
    };
    return {handleSend};
};
