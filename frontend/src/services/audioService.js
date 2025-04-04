import axios from '../axiosInstance';

export const fetchAudio = async (filename) => {
    try {
        const res = await axios.get(`/audio/${filename}`, {
            responseType: 'blob',
        });
        return res.data;
    } catch (error) {
        throw error;
    }
};

export const generateTts = async (text, ttsMethod = 'gtts') => {
    try {
        const res = await axios.post(
            `/tts?method=${ttsMethod}`,
            {text},
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        const audioUrl = res.headers['x-audio-url'];
        if (!audioUrl) {
            throw new Error('No audio URL returned from TTS');
        }
        const audioRespone = await fetch(audioUrl);
        const audioBlob = await audioRespone.blob();
        return {
            audioUrl,
            audioBlob,
            filename: res.headers['x-audio-filename'],
        };
    } catch (error) {
        throw new Error(err.response?.data?.detail || 'Failed to generate TTS');
    }
};
