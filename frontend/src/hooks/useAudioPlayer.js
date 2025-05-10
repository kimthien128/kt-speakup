import {useRef} from 'react';
import {fetchAudioUrl} from '../services/audioService';
import {getTTS} from '../services/ttsServices';
import {sanitizeFilename} from '../utils/sanitizeFilename';
import {logger} from '../utils/logger';

const useAudioPlayer = () => {
    const audioRef = useRef(null);

    // Nếu có audioUrl (từ API): Phát trực tiếp.
    // Nếu không có cả hai, kiểm tra và tạo TTS với text.
    const playSound = async ({audioUrl = '', text = '', ttsMethod = 'gtts'} = {}) => {
        logger.info('playSound called with:', {audioUrl, text, ttsMethod});

        // Phát âm thanh từ blob, source là ghi chú để biết nguồn phát âm thanh
        const playAudioBlob = async (blob, source) => {
            if (!blob || blob.size === 0) {
                throw new Error('Empty or invalid audio blob'); // Ném lỗi nếu blob rỗng
            }
            const url = URL.createObjectURL(blob);
            // console.log(`Playing audio from ${source}:`, url);
            const audio = new Audio(url);
            await audio.play();
        };

        if (audioUrl && typeof audioUrl === 'string') {
            const audioResponse = await fetch(audioUrl);
            const audioBlob = await audioResponse.blob();
            await playAudioBlob(audioBlob, 'audioUrl');
            return audioUrl;
        }

        if (text) {
            // Kiểm tra và phát TTS từ backend
            const isSingleWord = !text.includes(' '); // Kiểm tra có khoảng trắng không
            if (isSingleWord) {
                const sanitizedWord = sanitizeFilename(text);
                const filename = `${sanitizedWord}.mp3`;
                // nếu fetch có filename
                try {
                    const urlFromFilename = await fetchAudioUrl(filename);
                    const audioResponse = await fetch(urlFromFilename);
                    const audioBlob = await audioResponse.blob();
                    if (!audioBlob || audioBlob.size === 0) {
                        console.log(`Audio file ${filename} returned empty, generating TTS`);
                        const urlGenerate = await getTTS(ttsMethod, sanitizedWord);
                        const newAudioResponse = await fetch(urlGenerate);
                        const newAudioBlob = await newAudioResponse.blob();
                        await playAudioBlob(newAudioBlob, `TTS (${ttsMethod})`);
                        return urlGenerate;
                    }

                    await playAudioBlob(audioBlob, 'Filename');
                    return urlFromFilename;
                } catch (err) {
                    // nếu không fetch được từ filename
                    if (err.response && (err.response.status === 400 || err.response.status === 404)) {
                        console.log(`Audio file ${filename} not found, generating TTS`);
                        const urlGenerate = await getTTS(ttsMethod, sanitizedWord);
                        const audioResponse = await fetch(urlGenerate);
                        const audioBlob = await audioResponse.blob();
                        await playAudioBlob(audioBlob, `TTS (${ttsMethod})`);
                        return urlGenerate;
                    } else {
                        console.error('Error fetching cached TTS:', err);
                        throw err;
                    }
                }
            } else {
                // logger.info('Text is long, generating TTS:', text);
                // nếu là đoạn text dài thì generate TTS luôn
                const urlGenerate = await getTTS(ttsMethod, text);
                const audioResponse = await fetch(urlGenerate);
                const audioBlob = await audioResponse.blob();
                await playAudioBlob(audioBlob, `TTS (${ttsMethod})`);
                return urlGenerate;
            }
        }

        console.log('No audio source provided (audioUrl or text)');
        return '';
    };
    return {playSound, audioRef};
};
export default useAudioPlayer;
