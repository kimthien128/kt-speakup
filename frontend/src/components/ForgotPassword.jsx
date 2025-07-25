//componenets/ForgotPassword.jsx
import React, {useState} from 'react';
import useSiteConfig from '../hooks/useSiteConfig';
import {useImageLoadStatus} from '../utils/imageLoader';
import {Link} from 'react-router-dom';
import {forgotPassword} from '../services/authService';
import {Grid, Box, TextField, Button, Typography, Link as MuiLink, Alert} from '@mui/material';

function ForgotPassword() {
    const {config, loading: configLoading, error: configError} = useSiteConfig();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Cấu hình các hình ảnh cần kiểm tra
    const imageConfigs = [{key: 'heroImage', url: config?.heroImage}];
    // Sử dụng hook để kiểm tra trạng thái tải hình ảnh
    const imageLoadStatus = useImageLoadStatus(imageConfigs, 2000);

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        try {
            const res = await forgotPassword(email);
            const responseMessage = res.data?.message || res.message || 'A password reset link has been sent to your email.'
            setMessage(responseMessage);
            setError('');
            setEmail(''); // Reset email field after successful submission

            setTimeout(() => {
                navigate('/');
            }, 3000); // Chuyển hướng sau 3 giây
        } catch (err) {
            const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Failed to send reset link. Please try again.'
            setError(errorMessage);
            setMessage('');
            console.error('Forgot password error:', err.response?.data || err.message);
        }
    };

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
                ></Box>
            </Grid>

            {/* Bên phải: Form login */}
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
                    <Typography variant="h5" align="center" gutterBottom>
                        Forgot Password
                    </Typography>
                    <Typography variant="body1" align="center" gutterBottom>
                        Enter your email to receive a password reset link.
                    </Typography>

                    <form onSubmit={handleForgotPassword} style={{width: '100%'}}>
                        <TextField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            fullWidth
                            margin="normal"
                            variant="outlined"
                            required
                        />
                        {message && (
                            <Alert severity="success" sx={{mt: 2}}>
                                {message}
                            </Alert>
                        )}
                        {error && (
                            <Alert severity="error" sx={{mt: 2}}>
                                {error}
                            </Alert>
                        )}
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            sx={{
                                mt: 3,
                                py: 1.5,
                                fontSize: '1rem',
                            }}
                        >
                            Send Reset Link
                        </Button>
                    </form>

                    <Box sx={{textAlign: 'center', mt: 2}}>
                        <MuiLink component={Link} to="/">
                            Back to Login
                        </MuiLink>
                    </Box>
                </Box>
            </Grid>
        </Grid>
    );
}
export default ForgotPassword;
