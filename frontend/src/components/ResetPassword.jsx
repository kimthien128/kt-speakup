//component/ResetPassword.jsx
import React, {useState, useEffect} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import useSiteConfig from '../hooks/useSiteConfig';
import {resetPassword} from '../services/authService';
import {Grid, Box, TextField, Button, Typography, Link as MuiLink, Alert} from '@mui/material';

function ResetPassword() {
    const {config, loading: configLoading, error: configError} = useSiteConfig();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Lấy email và token từ query params
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

    // Kiểm tra email và token có tồn tại không
    useEffect(() => {
        if (!email || !token) {
            setError('Invalid reset password link. Please request a new one.');
        }
    }, [email, token]);

    // Validate mật khẩu phía frontend
    const validatePassword = (password) => {
        if (!passwordPattern.test(password)) {
            setError(
                'Password must be at least 8 characters long and contain at least one number, one lowercase letter, and one uppercase letter.'
            );
            return false;
        }
        setError('');
        return true;
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Kiểm tra mật khẩu nhập lại
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        // Validate mật khẩu trước khi gửi
        if (!validatePassword(newPassword)) {
            return;
        }

        try {
            const response = await resetPassword(email, token, newPassword);
            setMessage(response.data.message || 'Password reset successfully! Redirecting to login...');

            // Đăng xuất người dùng (xóa token) nếu họ đã đăng nhập
            localStorage.removeItem('token');

            setTimeout(() => {
                navigate('/');
            }, 3000); // Chuyển hướng sau 3 giây
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to reset password. Please try again.');
            console.error('Reset password error:', err.response?.data || err.message);
        }
    };

    return (
        <Grid container>
            {/* Bên trái: Hình ảnh minh họa */}
            <Grid item xs={12} md={6}>
                <Box
                    sx={{
                        height: '100%',
                        backgroundImage: config?.heroImage
                            ? `url(${config.heroImage})`
                            : 'linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%)',
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
                        Reset Password
                    </Typography>
                    <Typography variant="body1" align="center" gutterBottom>
                        Enter your new password below.
                    </Typography>

                    <form onSubmit={handleResetPassword} style={{width: '100%'}}>
                        <TextField
                            label="New Password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                            }}
                            fullWidth
                            margin="normal"
                            variant="outlined"
                            required
                            inputProps={{
                                pattern: '(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}',
                                title: 'Password must be at least 8 characters long and contain at least one number, one lowercase letter, and one uppercase letter',
                            }}
                        />
                        <TextField
                            label="Confirm Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                            disabled={!email || !token}
                        >
                            Reset Password
                        </Button>
                    </form>

                    <Box sx={{textAlign: 'center', mt: 2}}>
                        <MuiLink component={Link} to="/login">
                            Back to Login
                        </MuiLink>
                    </Box>
                </Box>
            </Grid>
        </Grid>
    );
}
export default ResetPassword;
