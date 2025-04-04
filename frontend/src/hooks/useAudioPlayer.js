import {useRef} from 'react';
import {fetchAudio, generateTts} from '../services/audioService';

const useAudioPlayer = () => {
    const audioRef = useRef(null);

    // Nếu có audioUrl (từ API): Phát trực tiếp.
    // Nếu không có cả hai, kiểm tra và tạo TTS với word.
    const playSound = async ({audioUrl = '', word = '', ttsMethod = 'gtts'} = {}) => {
        const playAudioBlob = async (blob, source) => {
            if (!blob || blob.size === 0) {
                throw new Error('Empty or invalid audio blob'); // Ném lỗi nếu blob rỗng
            }
            const url = URL.createObjectURL(blob);
            console.log(`Playing audio from ${source}:`, url);
            const audio = new Audio(url);
            await audio.play();
            return url;
        };

        if (audioUrl && typeof audioUrl === 'string') {
            console.log('Playing audio from API URL:', audioUrl);
            const audioResponse = await fetch(audioUrl);
            const audioBlob = await audioResponse.blob();
            await playAudioBlob(audioBlob, 'minio audio');
            return null;
        }

        if (word) {
            // Kiểm tra và phát TTS từ backend
            const isSingleWord = !word.includes(' '); // Kiểm tra có khoảng trắng không
            if (isSingleWord) {
                const filename = `${word}.mp3`;
                try {
                    const audioBlob = await fetchAudio(filename);
                    if (!audioBlob || audioBlob.size === 0) {
                        console.log(`Audio file ${filename} returned empty, generating TTS`);
                        const {audioBlob: newAudioBlob} = await generateTts(word, ttsMethod);
                        await playAudioBlob(newAudioBlob, `TTS (${ttsMethod})`);
                        return filename;
                    }

                    await playAudioBlob(audioBlob, 'cached TTS');
                    return filename;
                } catch (err) {
                    if (err.response && (err.response.status === 400 || err.response.status === 404)) {
                        console.log(`Audio file ${filename} not found, generating TTS`);
                        const {audioBlob} = await generateTts(word, ttsMethod);
                        await playAudioBlob(audioBlob, `TTS (${ttsMethod})`);
                        return filename;
                    } else {
                        console.error('Error fetching cached TTS:', err);
                        throw err;
                    }
                }
            } else {
                const {audioBlob} = await generateTts(word, ttsMethod);
                await playAudioBlob(audioBlob, `TTS (${ttsMethod})`);
                return null;
            }
        }

        console.log('No audio source provided (audioUrl or word)');
        return null;
    };
    return {playSound, audioRef};
};
export default useAudioPlayer;
