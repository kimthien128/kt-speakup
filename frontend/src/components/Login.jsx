import React from 'react';
import useSiteConfig from '../hooks/useSiteConfig';
import useLogin from '../hooks/useLogin';
import LoginForm from './LoginForm';
import {useImageLoadStatus} from '../utils/imageLoader';

import {Box, Grid, Typography} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

function Login({setToken, setUserEmail}) {
    const {config, loading: configLoading, error: configError} = useSiteConfig();
    const {
        email,
        setEmail,
        password,
        setPassword,
        rememberMe,
        setRememberMe,
        error: loginError,
        handleLogin,
    } = useLogin({setToken, setUserEmail});

    // Cấu hình các hình ảnh cần kiểm tra
    const imageConfigs = [{key: 'heroImage', url: config?.heroImage}];
    // Sử dụng hook để kiểm tra trạng thái tải hình ảnh
    const imageLoadStatus = useImageLoadStatus(imageConfigs, 2000);

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
                            : `url(/images/default-hero.jpg)`,
                        // : 'linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        borderTopLeftRadius: {md: 0, lg: 40},
                        borderBottomLeftRadius: {md: 0, lg: 40},
                        display: 'flex',
                        // alignItems: 'end',
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
                        <Typography variant="h4" align="center" gutterBottom>
                            Welcome back
                        </Typography>
                        <Typography variant="body1">Enter your email and password to sign in</Typography>
                    </Box>
                </Box>
            </Grid>

            {/* Bên phải: Form login */}
            <Grid item xs={12} md={6}>
                <LoginForm
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    handleLogin={handleLogin}
                    error={loginError}
                    rememberMe={rememberMe}
                    setRememberMe={setRememberMe}
                />
            </Grid>
        </Grid>
    );
}

export default Login;
