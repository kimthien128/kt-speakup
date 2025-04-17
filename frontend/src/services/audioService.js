import axios from '../axiosInstance';

// Chỉ lấy url audio từ bucket, không lấy blob, điều kiện là phải biết tên file (áp dụng cho từ vựng vì đã biết tên file)
export const fetchAudioUrl = async (filename) => {
    try {
        const res = await axios.get(`/audio/${filename}`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return res.data.audio_url;
    } catch (error) {
        throw error;
    }
};

// Tự generate audio từ text, trả về url đã upload lên bucket
export const generateUrlByTts = async (text, ttsMethod = 'gtts') => {
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

        return {
            audioUrl,
            filename: res.headers['x-audio-filename'],
        };
    } catch (err) {
        throw new Error(err.response?.data?.detail || 'Failed to generate TTS');
    }
};
