import {useState, useEffect} from 'react';
import {getCurrentUser} from '../services/authService';
import {logger} from '../utils/logger';

// Fetch thông tin user từ API /auth/me
export default function useUserInfo(userEmail) {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                setLoading(true);
                setError(null);

                const token = localStorage.getItem('token');

                if (!token) {
                    setUserInfo(null);
                    return;
                }

                const userData = await getCurrentUser();
                setUserInfo(userData);
            } catch (err) {
                logger.error('Error fetching user info:', err.response?.data || err.message);
                setError(err.response?.data?.detail || err.message || 'Failed to load user information');
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
