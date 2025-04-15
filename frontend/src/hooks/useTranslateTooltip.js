// hooks/useTranslateTooltip.js
// Quản lý tooltip dịch câu chat

import {useState, useRef} from 'react';
import axios from '../axiosInstance';
import {logger} from '../utils/logger';

export const useTranslateTooltip = ({chatId}) => {
    const [translateTooltip, setTranslateTooltip] = useState(null);
    const translateTooltipRef = useRef(null);

    // Dịch tin nhắn AI
    const handleTranslate = async (text, index, event) => {
        if (!chatId) {
            setTranslateTooltip({text: 'Chat ID is missing', x: event.pageX, y: event.pageY});
            return;
        }

        try {
            const res = await axios.post(
                `/chats/${chatId}/translate-ai`,
                {text: text, target_lang: 'vi', chat_id: chatId, index: index},
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            setTranslateTooltip({text: res.data.translatedTextAi, x: event.pageX, y: event.pageY});
        } catch (err) {
            logger.error('Error translating:', err);
            setTranslateTooltip({text: 'Failed to translate', x: event.pageX, y: event.pageY});
        }
    };

    return {
        translateTooltip,
        setTranslateTooltip,
        translateTooltipRef,
        handleTranslate,
    };
};
