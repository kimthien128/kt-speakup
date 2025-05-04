import React from 'react';
import {useNavigate} from 'react-router-dom';
import RegisterForm from './RegisterForm';
import useSiteConfig from '../hooks/useSiteConfig';
import {useImageLoadStatus} from '../utils/imageLoader';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

function Register() {
    const {config, loading: configLoading, error: configError} = useSiteConfig();
    const navigate = useNavigate();

    // Cấu hình các hình ảnh cần kiểm tra
    const imageConfigs = [{key: 'heroImage', url: config?.heroImage}];
    // Sử dụng hook để kiểm tra trạng thái tải hình ảnh
    const imageLoadStatus = useImageLoadStatus(imageConfigs, 2000);

    const handleSuccess = async () => {
        setTimeout(() => navigate('/'), 5000);
        return true; // Trả về true nếu gửi email thành công
    };

    // Xử lý config
    if (configLoading) {
        return <CircularProgress />;
    }
    if (configError) {
        return <Alert severity="error">{configError}</Alert>;
    }

    return (
        <Grid container>
            {/* Bên trái: Hình ảnh minh họa */}
            <Grid item xs={12} md={6}>
                <Box
                    sx={{
                        height: '100%',
                        backgroundImage: imageLoadStatus.heroImage
                            ? `url(${config.heroImage})`
                            : 'url(/images/default-hero.jpg)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        borderTopLeftRadius: {md: 0, lg: 40},
                        borderBottomLeftRadius: {md: 0, lg: 40},
                        display: 'flex',
                        // alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        p: 4,
                    }}
                >
                    <Box
                        sx={{
                            zIndex: 2,
                            position: 'relative',
                        }}
                    >
                        <Typography variant="h4" gutterBottom>
                            Welcome to Chat App
                        </Typography>
                        <Typography variant="body1">Learn and chat with AI in a fun and interactive way!</Typography>
                    </Box>
                </Box>
            </Grid>

            {/* Bên phải: Form register */}
            <Grid item xs={12} md={6}>
                <Box
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        p: 4,
                    }}
                >
                    <RegisterForm onSuccess={handleSuccess} />
                </Box>
            </Grid>
        </Grid>
    );
}

export default Register;
