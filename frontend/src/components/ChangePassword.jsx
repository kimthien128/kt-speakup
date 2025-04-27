//components/ChangePassword.jsx
import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from '../axiosInstance';
import {Box, TextField, Button, Alert, CircularProgress, Typography} from '@mui/material';

function ChangePassword({setConfirmDialog}) {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const navigate = useNavigate();

    const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

    // Validate mật khẩu phía frontend
    const validatePassword = (password) => {
        if (!passwordPattern.test(password)) {
            setPasswordError(
                'Password must be at least 8 characters long and contain at least one number, one lowercase letter, and one uppercase letter.'
            );
            return false;
        }
        setPasswordError('');
        return true;
    };

    // Xử lý đổi mật khẩu (Change Password)
    const handleChangePassword = async () => {
        // Kiểm tra các trường bắt buộc
        if (!oldPassword || !newPassword || !confirmPassword) {
            setPasswordError('All fields are required');
            return;
        }

        // Kiểm tra mật khẩu nhập lại
        if (newPassword !== confirmPassword) {
            setPasswordError('New password and confirm password do not match');
            return;
        }

        // Validate mật khẩu mới
        if (!validatePassword(newPassword)) {
            return;
        }

        // Hiển thị dialog xác nhận
        setConfirmDialog({
            open: true,
            title: 'Confirm Change Password',
            content: 'Are you sure you want to change password?',
            onConfirm: async () => {
                setPasswordLoading(true);
                setPasswordError('');
                setPasswordSuccess('');

                try {
                    await axios.post('/auth/change-password', {
                        oldPassword,
                        newPassword,
                    });
                    setPasswordSuccess('Password changed successfully! You will be logged out.');
                    // Đăng xuất người dùng (xóa token) và điều hướng về trang đăng nhập
                    setTimeout(() => {
                        localStorage.removeItem('token');
                        navigate('/');
                    }, 3000);
                } catch (err) {
                    setPasswordError(err.response?.data?.detail || 'Failed to change password');
                    console.error('Error changing password:', err.response?.data || err.message);
                } finally {
                    setPasswordLoading(false);
                    setConfirmDialog((prev) => ({...prev, open: false}));
                }
            },
        });
    };

    return (
        <>
            <Typography
                variant="h6"
                sx={{
                    mb: 3,
                    textAlign: 'center',
                }}
            >
                Change Password
            </Typography>
            <TextField
                label="Old Password"
                type="password"
                variant="outlined"
                fullWidth
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                margin="normal"
                required
            />
            <TextField
                label="New Password"
                type="password"
                variant="outlined"
                fullWidth
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                margin="normal"
                required
            />
            <TextField
                label="Confirm Password"
                type="password"
                variant="outlined"
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                required
            />
            {passwordError && (
                <Alert severity="error" sx={{mt: 2}}>
                    {passwordError}
                </Alert>
            )}
            {passwordSuccess && (
                <Alert severity="success" sx={{mt: 2}}>
                    {passwordSuccess}
                </Alert>
            )}
            <Box
                sx={{
                    mt: 3,
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleChangePassword}
                    fullWidth
                    sx={{
                        py: 1,
                        px: 3,
                        textTransform: 'none',
                        fontSize: '1rem',
                        borderRadius: 1,
                        minWidth: 150,
                    }}
                >
                    {passwordLoading ? <CircularProgress size={24} color="inherit" /> : 'Change Password'}
                </Button>
            </Box>
        </>
    );
}

export default ChangePassword;
