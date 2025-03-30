import {useState, useEffect} from 'react';
import axios from '../axiosInstance';

// Fetch thông tin user từ API /auth/me
export default function useUserInfo(userEmail) {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');

                if (!token) {
                    setUserInfo(null);
                    return;
                }

                const res = await axios.get('/auth/me');
                setUserInfo(res.data);
            } catch (err) {
                console.error('Error fetching user info:', err.response?.data || err.message);
                setUserInfo(null);
            } finally {
                setLoading(false);
            }
        };

        if (userEmail) {
            fetchUserInfo();
        } else {
            setLoading(false);
        }
    }, [userEmail]);

    return {userInfo, loading, error};
}
