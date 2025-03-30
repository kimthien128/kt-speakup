import {useRef} from 'react';
import axios from '../axiosInstance';

const useAudioPlayer = () => {
    const audioRef = useRef(null);

    // Nếu có audioUrl (từ API): Phát trực tiếp.
    // Nếu không có cả hai, kiểm tra và tạo TTS với word.
    const playSound = async ({audioUrl = '', word = '', ttsMethod = 'gtts', chatId = '', index = ''} = {}) => {
        const playAudioBlob = async (blob, source) => {
            if (!blob || blob.size === 0) {
                throw new Error('Empty or invalid audio blob'); // Ném lỗi nếu blob rỗng
            }
            const url = URL.createObjectURL(blob);
            console.log(`Playing audio from ${source}:`, url);
            const audio = new Audio(url);
            await audio.play();
        };

        const generateTts = async (text, chatId, index) => {
            try {
                console.log(`Generating new TTS audio for: "${text}" with method: ${ttsMethod}`);
                const ttsResponse = await axios.post(
                    `/tts?method=${ttsMethod}`,
                    {text},
                    {headers: {'Content-Type': 'application/json'}}
                );
                const audioUrl = ttsResponse.headers['x-audio-url'];
                console.log('Received audio URL:', audioUrl);
                if (!audioUrl) {
                    throw new Error('No audio URL returned from TTS');
                }
                // Lấy blob từ URL MinIO
                const audioResponse = await fetch(audioUrl);
                const audioBlob = await audioResponse.blob();
                await playAudioBlob(audioBlob, `TTS (${ttsMethod})`);

                // Dùng chatId và index từ tham số
                if (chatId && index !== '') {
                    await axios.patch(
                        `/chats/${chatId}/audioUrl`,
                        {index, audioUrl},
                        {headers: {'Content-Type': 'application/json'}}
                    );
                    console.log(`Updated audioUrl for chatId: ${chatId}, index: ${index}`);
                }

                return ttsResponse.headers['x-audio-filename'];
            } catch (err) {
                console.error('Error generating TTS:', err);
                return null;
            }
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
                    // Nếu tồn tại, lấy và phát
                    const checkResponse = await axios.get(`/audio/${filename}`, {
                        responseType: 'blob',
                    });

                    // Kiểm tra blob ngay sau khi get
                    if (!checkResponse.data || checkResponse.data.size === 0) {
                        console.log(`Audio file ${filename} returned empty, generating TTS`);
                        return await generateTts(word, chatId, index);
                    }

                    await playAudioBlob(checkResponse.data, 'cached TTS');
                    return filename;
                } catch (err) {
                    if (err.response && (err.response.status === 400 || err.response.status === 404)) {
                        console.log(`Audio file ${filename} not found, generating TTS`);
                        return await generateTts(word, chatId, index); // Tạo mới nếu không có
                    } else {
                        console.error('Error fetching cached TTS:', err);
                        return null;
                    }
                }
            } else {
                return await generateTts(word, chatId, index); // Đoạn chat dùng timestamp
            }
        }

        console.log('No audio source provided (audioUrl or word)');
        return null;
    };
    return {playSound, audioRef};
};
export default useAudioPlayer;
