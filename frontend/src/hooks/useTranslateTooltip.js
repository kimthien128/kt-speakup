// hooks/useTranslateTooltip.js
// Quản lý tooltip dịch câu chat

import {useState, useRef} from 'react';
import {translateAIMessage} from '../services/chatsService';
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
            const result = await translateAIMessage(chatId, text, index);
            setTranslateTooltip({text: result.translatedTextAi, x: event.pageX, y: event.pageY});
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
