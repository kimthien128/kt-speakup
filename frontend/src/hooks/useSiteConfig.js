import {useState, useEffect} from 'react';
import {getConfig} from '../services/configService';
import {logger} from '../utils/logger';

export default function useSiteConfig() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Lấy config từ backend
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await getConfig();
                setConfig(data);
                setError(null);
            } catch (err) {
                setError(err.response?.data?.detail || err.message || 'Failed to load configuration');
                logger.error('Error in useSiteConfig:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    return {config, loading, error};
}

/*
Usage:

import useSiteConfig from '../hooks/useSiteConfig';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
-----------------------------------------
const {config, loading: configLoading, error: configError} = useSiteConfig();
-----------------------------------------
// Xử lý config, đặt trước return
if (configLoading) {
    return <CircularProgress />;
}
if (configError) {
    return <Alert severity="error">{configError}</Alert>;
}
-----------------------------------------
// Sử dụng config, VD:
src={config?.logoImage || null}
background: config?.backgroundImage
            ? `url("${config.backgroundImage}")`
            : 'linear-gradient(135deg, #ef88bb 0%, #291850 100%)',

//hoặc
<img
    src={config?.logoImage || null}
    alt="KT SpeakUp Logo"
    style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center'}}
/>
*/
