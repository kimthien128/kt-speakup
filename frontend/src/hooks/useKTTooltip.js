//hooks/useKTTooltip.js
import {useState, useEffect, useRef} from 'react';
import {fetchWordInfo} from '../services/dictionaryService';
import {cleanWord, addToVocab} from '../utils/vocabUtils';
import {toast} from 'react-toastify';
import axios from '../axiosInstance';

import useAudioPlayer from './useAudioPlayer';

const useKTTooltip = ({chatId, onVocabAdded, dictionarySource = 'dictionaryapi'}) => {
    const [wordTooltip, setWordTooltip] = useState(null);
    const [translateTooltip, setTranslateTooltip] = useState(null);
    const wordTooltipRef = useRef(null); // Ref để tham chiếu vùng word tooltip
    const translateTooltipRef = useRef(null); // Ref để tham chiếu vùng translate tooltip
    const {playSound, audioRef} = useAudioPlayer(); // Ref để quản lý audio element

    // Xử lý double-click từ
    const handleWordClick = async (word, event) => {
        const cleanedWord = cleanWord(word);
        if (!cleanedWord) return;

        console.log(`Handling word click: ${cleanedWord}, source: ${dictionarySource}`);

        // Hiển thị word tooltip ngay lập tức với trạng thái "Loading"
        setWordTooltip({
            word: cleanedWord,
            definition: 'Loading...',
            phonetic: 'Loading...',
            audio: 'Loading...',
            x: event.pageX,
            y: event.pageY,
        });
        try {
            const res = await fetchWordInfo(cleanedWord, dictionarySource);
            // Kiểm tra res có hợp lệ không
            if (!res || typeof res !== 'object' || !res.definition) {
                console.error('Invalid word info response:', res);
                throw new Error('Invalid word info response');
            }

            // Lấy âm thanh đầu tiên từ danh sách res.audio (nếu có)
            const audioUrl = Array.isArray(res.audio) && res.audio.length > 0 ? res.audio[0] : '';

            setWordTooltip({
                word: cleanedWord,
                definition: res.definition || 'No definition found',
                phonetic: res.phonetic || 'N/A',
                audio: audioUrl,
                x: event.pageX,
                y: event.pageY,
            });
        } catch (err) {
            console.error('Error fetching word info:', err.message);
            setWordTooltip({
                word: cleanedWord,
                definition: 'Failed to fetch info',
                phonetic: 'N/A',
                audio: '',
                x: event.pageX,
                y: event.pageY,
            });
            toast.error(err.message || 'Failed to fetch word info');
        }
    };

    // Phát âm thanh
    const handlePlay = async (audioUrl, word) => {
        try {
            await playSound({audioUrl, word, ttsMethod: 'gtts'});
        } catch (error) {
            console.error('Error playing sound:', error);
            toast.error('Failed to play audio');
        }
    };

    // Thêm từ vào vocab
    const handleAddToVocab = async () => {
        if (!wordTooltip || !chatId) {
            console.error('Cannot add to vocab: Missing word or chat ID', {wordTooltip, chatId});
            toast.error('Cannot add to vocab: Missing word or chat ID');
            return;
        }

        try {
            await addToVocab({...wordTooltip, chatId, onVocabAdded});
        } catch (err) {
            console.error('Error adding to vocab:', err.message);
            toast.error(err.message || 'Failed to add to vocab');
        }
    };

    // Dịch tin nhắn AI
    const handleTranslate = async (text, index, event) => {
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
            console.log('Translate response:', res.data);
            setTranslateTooltip({text: res.data.translatedTextAi, x: event.pageX, y: event.pageY});
        } catch (err) {
            console.error('Error translating:', err);
            setTranslateTooltip({text: 'Failed to translate', x: event.pageX, y: event.pageY});
        }
    };

    // Đóng mọi tooltip khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            const isOutsideWordTooltip = wordTooltipRef.current && !wordTooltipRef.current.contains(event.target);
            const isOutsideTranslateTooltip =
                translateTooltipRef.current && !translateTooltipRef.current.contains(event.target);
            const isOutsideMuiTooltip = !event.target.closest('.MuiTooltip-popper');
            if (isOutsideWordTooltip && isOutsideMuiTooltip) {
                setWordTooltip(null);
            }
            if (isOutsideTranslateTooltip && isOutsideMuiTooltip) {
                setTranslateTooltip(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        // Cleanup sự kiện khi tooltip bị tắt hoặc component unmount
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return {
        wordTooltip,
        setWordTooltip,
        wordTooltipRef,
        translateTooltip,
        setTranslateTooltip,
        translateTooltipRef,
        handleWordClick,
        handlePlay,
        handleAddToVocab,
        handleTranslate,
    };
};
export default useKTTooltip;
