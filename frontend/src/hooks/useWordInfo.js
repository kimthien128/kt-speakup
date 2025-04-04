import {useState, useEffect, useRef} from 'react';
import {fetchWordInfo} from '../services/dictionaryService';
import {cleanWord, addToVocab} from '../utils/vocabUtils';
import {toast} from 'react-toastify';

import useAudioPlayer from './useAudioPlayer';

const useWordInfo = ({chatId, onVocabAdded, dictionarySource = 'dictionaryapi'}) => {
    const [tooltip, setTooltip] = useState(null);
    const tooltipRef = useRef(null); // Ref để tham chiếu vùng tooltip
    const {playSound, audioRef} = useAudioPlayer(); // Ref để quản lý audio element

    // Xử lý double-click từ
    const handleWordClick = async (word, event) => {
        const cleanedWord = cleanWord(word);
        if (!cleanedWord) return;

        console.log(`Handling word click: ${cleanedWord}, source: ${dictionarySource}`);

        // Hiển thị tooltip ngay lập tức với trạng thái "Loading"
        setTooltip({
            word: cleanedWord,
            definition: 'Loading...',
            phonetic: 'Loading...',
            audio: 'Loading...',
            x: event.pageX,
            y: event.pageY,
        });
        try {
            const res = await fetchWordInfo(cleanedWord, dictionarySource);
            console.log('Word info response:', res);
            // Kiểm tra res có hợp lệ không
            if (!res || typeof res !== 'object' || !res.definition) {
                console.error('Invalid word info response:', res);
                throw new Error('Invalid word info response');
            }

            setTooltip({
                word: cleanedWord,
                definition: res.definition || 'No definition found',
                phonetic: res.phonetic || 'N/A',
                audio: res.audio || '',
                x: event.pageX,
                y: event.pageY,
            });
        } catch (err) {
            console.error('Error fetching word info:', err.message);
            setTooltip({
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
        if (!tooltip || !chatId) {
            console.error('Cannot add to vocab: Missing word or chat ID', {tooltip, chatId});
            toast.error('Cannot add to vocab: Missing word or chat ID');
            return;
        }

        try {
            await addToVocab({...tooltip, chatId, onVocabAdded});
            toast.success(`Added ${tooltip.word} to vocab`);
        } catch (err) {
            console.error('Error adding to vocab:', err.message);
            toast.error(err.message || 'Failed to add to vocab');
        }
    };

    // Đóng tooltip khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                tooltipRef.current &&
                !tooltipRef.current.contains(event.target) &&
                !event.target.closest('.MuiTooltip-popper') // kiểm tra phần tử tooltip của MUI
            ) {
                setTooltip(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        // Cleanup sự kiện khi tooltip bị tắt hoặc component unmount
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return {
        tooltip,
        setTooltip,
        tooltipRef,
        handleWordClick,
        handlePlay,
        handleAddToVocab,
    };
};
export default useWordInfo;
