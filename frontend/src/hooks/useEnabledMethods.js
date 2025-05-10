// hooks/useEnabledMethods.js
import {useState, useEffect} from 'react';
import {getEnabledMethods} from '../services/configService';
import {logger} from '../utils/logger';

export const useEnabledMethods = () => {
    const [enabledMethods, setEnabledMethods] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchEnabledMethods = async () => {
            try {
                setLoading(true);
                const methods = await getEnabledMethods();
                setEnabledMethods(methods);
                setError(null);
            } catch (err) {
                setError('Failed to load enabled methods.');
                logger.error('Error fetching enabled methods:', err);
                setEnabledMethods([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEnabledMethods();
    }, []); // Chạy một lần khi component mount

    return {enabledMethods, error, loading};
};
