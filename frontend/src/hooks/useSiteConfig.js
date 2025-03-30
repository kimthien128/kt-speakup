import {useState, useEffect} from 'react';
import axios from '../axiosInstance';

export default function useSiteConfig() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Lấy config từ backend
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await axios.get('/config');
                setConfig(res.data);
            } catch (err) {
                setError(err.response?.data || err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    return {config, loading, error};
}
