// hooks/useWordTooltip.js
// Quản lý tooltip tra từ và phát âm thanh.

import {useState, useRef} from 'react';
import {fetchWordInfo} from '../services/dictionaryService';
import {cleanWord, addToVocab} from '../utils/vocabUtils';
import {toast} from 'react-toastify';
import useAudioPlayer from './useAudioPlayer';
import useTranslate from './useTranslate';
import {logger} from '../utils/logger';

export const useWordTooltip = ({chatId, onVocabAdded, dictionarySource = 'dictionaryapi'}) => {
    const [wordTooltip, setWordTooltip] = useState(null);
    const wordTooltipRef = useRef(null); // Ref để tham chiếu vùng word tooltip
    const {playSound, audioRef} = useAudioPlayer(); // Ref để quản lý audio element
    const [isPlaying, setIsPlaying] = useState(false); // Trạng thái loading cho phát âm thanh
    const {translateText} = useTranslate(); // lấy hàm dịch văn bản

    // Xử lý double-click từ
    const handleWordClick = async (word, event) => {
        const cleanedWord = cleanWord(word);
        if (!cleanedWord) return;

        logger.info(`Handling word click: ${cleanedWord}, source: ${dictionarySource}`);

        // Hiển thị word tooltip ngay lập tức với trạng thái "Loading"
        setWordTooltip({
            word: cleanedWord,
            definition: 'Loading...',
            phonetic: 'Loading...',
            audio: 'Loading...',
            translatedWord: 'Translating...',
            translatedDefinition: 'Translating...',
            x: event.pageX,
            y: event.pageY,
        });
        try {
            // Lấy thông tin từ từ điển
            const res = await fetchWordInfo(cleanedWord, dictionarySource);
            // Kiểm tra res có hợp lệ không
            if (!res || typeof res !== 'object' || !res.definition) {
                throw new Error('Invalid word info response');
            }

            // Lấy âm thanh đầu tiên từ danh sách res.audio (nếu có)
            const audioUrl = Array.isArray(res.audio) && res.audio.length > 0 ? res.audio[0] : '';
            const definition = typeof res.definition === 'string' ? res.definition : 'No definition found';

            // Dịch word và definition bằng hàm translateText
            const translatedWord = await translateText(cleanedWord);
            let translatedDefinition = 'Translation not available';
            if (definition !== 'No definition found') {
                translatedDefinition = await translateText(definition);
            }

            setWordTooltip({
                word: cleanedWord,
                definition: res.definition || 'No definition found',
                phonetic: res.phonetic || 'N/A',
                audio: audioUrl,
                translatedWord,
                translatedDefinition,
                x: event.pageX,
                y: event.pageY,
            });
        } catch (err) {
            logger.error('Error fetching word info:', err.message);
            setWordTooltip({
                word: cleanedWord,
                definition: 'Failed to fetch info',
                phonetic: 'N/A',
                audio: '',
                translatedWord: 'Translation not available',
                translatedDefinition: 'Translation not available',
                x: event.pageX,
                y: event.pageY,
            });
            toast.error(err.message || 'Failed to fetch word info');
        }
    };

    // Phát âm thanh
    const handlePlay = async (audioUrl, word) => {
        setIsPlaying(true);
        try {
            await playSound({audioUrl, text: word, ttsMethod: 'gtts'});
        } catch (error) {
            logger.error('Error playing sound:', error);
            toast.error('Failed to play audio');
        } finally {
            setIsPlaying(false);
        }
    };

    // Thêm từ vào vocab
    const handleAddToVocab = async () => {
        if (!wordTooltip || !chatId) {
            toast.error('Cannot add to vocab: Missing word or chat ID');
            return;
        }

        try {
            await addToVocab({...wordTooltip, chatId, onVocabAdded});
            // ko cần đóng tooltip sau khi thêm từ vào vocab
        } catch (err) {
            logger.error('Error adding to vocab:', err.message);
            toast.error(err.message || 'Failed to add to vocab');
        }
    };

    return {
        wordTooltip,
        setWordTooltip,
        wordTooltipRef,
        handleWordClick,
        handlePlay,
        handleAddToVocab,
        isPlaying,
    };
};
