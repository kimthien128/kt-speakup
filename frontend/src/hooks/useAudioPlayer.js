import {useRef} from 'react';
import axios from '../axiosInstance';

const useAudioPlayer = () => {
    const audioRef = useRef(null);

    // Nếu có audioUrl (từ API): Phát trực tiếp.
    // Nếu có audioPath (từ backend): Gọi /audio/{audioPath}.
    // Nếu không có cả hai, kiểm tra và tạo TTS với word.
    const playSound = async ({audioUrl = '', audioPath = '', word = '', ttsMethod = 'gtts'} = {}) => {
        const playAudioBlob = async (blob, source) => {
            if (!blob || blob.size === 0) {
                throw new Error('Empty or invalid audio blob'); // Ném lỗi nếu blob rỗng
            }
            const url = URL.createObjectURL(blob);
            console.log(`Playing audio from ${source}:`, url);
            const audio = new Audio(url);
            await audio.play();
        };

        const generateTts = async (text) => {
            try {
                console.log(`Generating new TTS audio for: "${text}" with method: ${ttsMethod}`);
                const ttsResponse = await axios.post(
                    `/tts?method=${ttsMethod}`,
                    {text},
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        responseType: 'blob',
                    }
                );
                await playAudioBlob(ttsResponse.data, `TTS (${ttsMethod})`);
                // Nếu là từ đơn (không có khoảng trắng), dùng text.mp3, nếu không thì lấy từ header
                return ttsResponse.headers['x-audio-filename'];
            } catch (err) {
                console.error('Error generating TTS:', err);
                return null;
            }
        };

        if (audioUrl && typeof audioUrl === 'string') {
            console.log('Playing audio from API URL:', audioUrl);
            if (audioRef.current) {
                audioRef.current.src = audioUrl;
                try {
                    await audioRef.current.play();
                } catch (err) {
                    console.error('Error playing API audio:', err);
                    if (word) return playSound({word, ttsMethod});
                }
            }
            return null;
        }

        if (audioPath) {
            // Phát từ backend qua /audio/{audioPath}
            try {
                const audioResponse = await axios.get(`/audio/${audioPath}`, {
                    responseType: 'blob',
                });
                await playAudioBlob(audioResponse.data, 'backend audio');
                return audioPath;
            } catch (err) {
                console.error('Error fetching audio from backend:', err);
                return null;
            }
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
                        return await generateTts(word);
                    }

                    await playAudioBlob(checkResponse.data, 'cached TTS');
                    return filename;
                } catch (err) {
                    if (err.response && (err.response.status === 400 || err.response.status === 404)) {
                        console.log(`Audio file ${filename} not found, generating TTS`);
                        return await generateTts(word); // Tạo mới nếu không có
                    } else {
                        console.error('Error fetching cached TTS:', err);
                        return null;
                    }
                }
            } else {
                return await generateTts(word); // Đoạn chat dùng timestamp
            }
        }

        console.log('No audio source provided (audioUrl, audioPath, or word)');
        return null;
    };
    return {playSound, audioRef};
};
export default useAudioPlayer;
