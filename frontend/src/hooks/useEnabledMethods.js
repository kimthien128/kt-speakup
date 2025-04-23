// hooks/useEnabledMethods.js
import {useState, useEffect} from 'react';
import axios from '../axiosInstance';
import {logger} from '../utils/logger';

export const useEnabledMethods = () => {
    const [enabledMethods, setEnabledMethods] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEnabledMethods = async () => {
            try {
                const response = await axios.get('/config/models');
                setEnabledMethods(response.data);
            } catch (err) {
                setError('Failed to load enabled methods.');
                logger.error('Error fetching enabled methods:', err);
            }
        };

        fetchEnabledMethods();
    }, []); // Chạy một lần khi component mount

    return {enabledMethods, error};
};
