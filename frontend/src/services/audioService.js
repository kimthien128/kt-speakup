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
