import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import ConfirmDialog from './ConfirmDialog';
import {getAvatarInitial} from '../utils/avatarUtils';
import useSiteConfig from '../hooks/useSiteConfig';

import {Box, Typography, Avatar, TextField, Button, Chip, IconButton, Grid, MenuItem, Tabs, Tab} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import LockIcon from '@mui/icons-material/Lock';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import axios from '../axiosInstance';

// Component TabPanel để hiển thị nội dung của tab
function TabPanel(props) {
    const {children, value, index, ...other} = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{p: 3}}>{children}</Box>}
        </div>
    );
}

function Profile({onLogout}) {
    const {config, loading: configLoading, error: configError} = useSiteConfig();
    const [userInfo, setUserInfo] = useState(null); // Thông tin user từ API
    const [displayName, setDisplayName] = useState(''); // Tên hiển thị
    const [phoneNumber, setPhoneNumber] = useState(''); // Số điện thoại
    const [gender, setGender] = useState(''); // Giới tính
    const [location, setLocation] = useState(''); // Địa chỉ
    const [avatarFile, setAvatarFile] = useState(null); // File ảnh đại diện
    const [avatarPreview, setAvatarPreview] = useState(''); // Ảnh đại diện xem trước
    const [error, setError] = useState(''); // Lỗi
    const [success, setSuccess] = useState(''); // Thành công
    const [loading, setLoading] = useState(false); // Đang tải
    const [tabValue, setTabValue] = useState(0); // Giá trị của tab hiện tại
    const [oldPassword, setOldPassword] = useState(''); // Mật khẩu cũ
    const [newPassword, setNewPassword] = useState(''); // Mật khẩu mới
    const [confirmPassword, setConfirmPassword] = useState(''); // Xác nhận mật khẩu mới
    const [passwordError, setPasswordError] = useState(''); // Lỗi mật khẩu
    const [passwordSuccess, setPasswordSuccess] = useState(''); // Thành công mật khẩu
    const [passwordLoading, setPasswordLoading] = useState(false); // Đang tải mật khẩu
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        content: '',
        onConfirm: () => {},
    }); // Hiển thị dialog xác nhận
    const navigate = useNavigate();

    // Fetch thông tin user khi component mount
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/');
                    return;
                }

                const res = await axios.get('/auth/me');
                setUserInfo(res.data);
                setDisplayName(res.data.displayName || '');
                setPhoneNumber(res.data.phoneNumber || '');
                setGender(res.data.gender || '');
                setLocation(res.data.location || '');
                setAvatarPreview(res.data.avatarPath || '');
            } catch (err) {
                setError('Failed to load user info');
                console.error('Error fetching user info:', err.response?.data || err.message);
            }
        };

        fetchUserInfo();
    }, [navigate]);

    // Xử lý upload avatar
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            setError('Invalid file type. Only PNG, JPG and GIF accepted');
            return;
        }

        // Validate file size (2MB)
        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('File size should be less than 2MB');
            return;
        }

        // Nếu file hợp lệ, xóa lỗi và cập nhật state
        setError('');
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file)); // Hiển thị preview
    };

    // Xử lý lưu thay đổi
    const handleSaveChanges = async () => {
        if (!displayName) {
            setError('Display Name is required');
            return;
        }

        setConfirmDialog({
            open: true,
            title: 'Confirm Save Changes',
            content: 'Are you sure you want to save changes?',
            onConfirm: async () => {
                setLoading(true);
                setError('');
                setSuccess('');

                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        setError('Please login to update profile');
                        navigate('/');
                        return;
                    }

                    const formData = new FormData();
                    formData.append('displayName', displayName);
                    formData.append('phoneNumber', phoneNumber);
                    formData.append('gender', gender);
                    formData.append('location', location);
                    if (avatarFile) {
                        formData.append('avatar', avatarFile);
                    }

                    const res = await axios.patch('/auth/update', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });

                    // Cập nhật userInfo và avatarPreview
                    setUserInfo({
                        ...userInfo,
                        displayName: res.data.displayName,
                        phoneNumber: res.data.phoneNumber,
                        gender: res.data.gender,
                        location: res.data.location,
                        avatarPath: res.data.avatarPath,
                    });
                    setAvatarPreview(res.data.avatarPath || '');
                    setAvatarFile(null); // Reset file sau khi upload
                    setSuccess('Profile updated successfully');
                } catch (err) {
                    setError(err.response?.data?.detail || 'Failed to update profile');
                    console.error('Error updating profile:', err.response?.data || err.message);
                } finally {
                    setLoading(false);
                    setConfirmDialog((prev) => ({...prev, open: false}));
                }
            },
        });
    };

    // Xử lý đổi mật khẩu (Change Password)
    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            setPasswordError('All fields are required');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('New password and confirm password do not match');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('Password should be at least 6 characters');
            return;
        }

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
                    setPasswordSuccess('Password changed successfully');
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
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

    // Xử lý chuyển tab
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleLogoutClick = () => {
        setConfirmDialog({
            open: true,
            title: 'Confirm Logout',
            content: 'Are you sure you want to logout?',
            onConfirm: () => {
                onLogout();
                navigate('/');
                setConfirmDialog((prev) => ({...prev, open: false}));
            },
        });
    };

    // Xử lý config
    if (loading) {
        return <CircularProgress />;
    }
    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <>
            {userInfo && (
                <Box
                    sx={{
                        p: {xs: 2, md: 4},
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        width: '100%',
                        gap: 2,
                    }}
                >
                    {/* Phần 1: Logo & Avatar */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                        }}
                    >
                        {/* Logo & Back */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 2,
                            }}
                        >
                            {/* Logo */}
                            <Box>
                                <img
                                    src={config?.logoImage || null}
                                    alt="KT SpeakUp Logo"
                                    style={{maxWidth: '100px', height: 'auto'}}
                                />
                            </Box>

                            {/* Back Button */}
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => navigate('/')}
                                startIcon={<ArrowBackIcon />}
                                sx={{
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    borderRadius: 1,
                                }}
                            >
                                Back to Chat
                            </Button>
                        </Box>

                        {/* Typo & chip */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Typography
                                variant="h5"
                                sx={{
                                    mt: 1,
                                    fontWeight: 'bold',
                                    color: 'text.primary',
                                }}
                            >
                                {userInfo.displayName || 'Please create a display name !'}
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: 'text.secondary',
                                }}
                            >
                                {userInfo.email}
                            </Typography>
                            <Chip
                                label={userInfo.isAdmin ? 'Admin' : 'User'}
                                size="small"
                                sx={{
                                    mt: 1,
                                    bgcolor: userInfo.isAdmin ? 'green' : 'primary.light',
                                    color: 'white',
                                }}
                            />
                        </Box>

                        {/* Avatar & Logout */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 2,
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'relative',
                                    display: 'inline-block',
                                }}
                            >
                                <Avatar
                                    src={avatarPreview}
                                    sx={{
                                        width: {xs: 80, md: 100},
                                        height: {xs: 80, md: 100},
                                        border: '2px solid white',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        bgcolor: 'primary.main',
                                        fontSize: {xs: '2rem', md: '2.5rem'},
                                    }}
                                >
                                    {!avatarPreview && getAvatarInitial(userInfo)}
                                </Avatar>
                                <IconButton
                                    component="label"
                                    sx={{
                                        position: 'absolute',
                                        right: 0,
                                        bottom: 0,
                                        bgcolor: 'primary.light',
                                        color: 'white',
                                        '&:hover': {
                                            bgcolor: 'primary.dark',
                                        },
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                    }}
                                >
                                    <CameraAltIcon fontSize="small" />
                                    <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
                                </IconButton>
                            </Box>

                            {/* Logout Button */}
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={handleLogoutClick}
                                startIcon={<LogoutIcon />}
                                sx={{
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    borderRadius: 1,
                                }}
                            >
                                Logout
                            </Button>
                        </Box>
                    </Box>

                    {/* Phần 2: Tabs */}

                    <Box
                        sx={{
                            p: {xs: 2, md: 4},
                            borderRadius: 5,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            bgcolor: 'rgba(255,255,255,0.9)',
                            display: 'flex',
                            flexGrow: 1,
                        }}
                    >
                        {/* Cấu hình Tabs */}
                        <Tabs
                            orientation="vertical"
                            value={tabValue}
                            onChange={handleTabChange}
                            sx={{
                                borderRight: 1,
                                borderColor: 'divider',
                                minWidth: 200,
                            }}
                        >
                            <Tab
                                label="Account Settings"
                                icon={<SettingsIcon />}
                                iconPosition="start"
                                sx={{
                                    justifyContent: 'flex-start',
                                }}
                            />
                            <Tab
                                label="Change Password"
                                icon={<LockIcon />}
                                iconPosition="start"
                                sx={{
                                    justifyContent: 'flex-start',
                                }}
                            />
                        </Tabs>

                        <Box
                            sx={{
                                flexGrow: 1,
                            }}
                        >
                            {/* Tab 1: Account Settings */}
                            <TabPanel value={tabValue} index={0}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        mb: 3,
                                        textAlign: 'center',
                                    }}
                                >
                                    Account Settings
                                </Typography>
                                <Grid container spacing={2}>
                                    {/* Cột 1 */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Display Name"
                                            variant="outlined"
                                            fullWidth
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            margin="normal"
                                            required
                                        />
                                        <TextField
                                            label="Phone Number"
                                            variant="outlined"
                                            fullWidth
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            margin="normal"
                                        />
                                    </Grid>

                                    {/* Cột 2 */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            select
                                            label="Gender"
                                            variant="outlined"
                                            fullWidth
                                            value={gender}
                                            onChange={(e) => setGender(e.target.value)}
                                            margin="normal"
                                        >
                                            <MenuItem value="">Select Gender</MenuItem>
                                            <MenuItem value="Male">Male</MenuItem>
                                            <MenuItem value="Female">Female</MenuItem>
                                            <MenuItem value="Other">Other</MenuItem>
                                        </TextField>
                                        <TextField
                                            label="Location"
                                            variant="outlined"
                                            fullWidth
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            margin="normal"
                                        />
                                    </Grid>
                                </Grid>
                                {error && (
                                    <Alert severity="error" sx={{mt: 2}}>
                                        {error}
                                    </Alert>
                                )}
                                {success && (
                                    <Alert severity="success" sx={{mt: 2}}>
                                        {success}
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
                                        variant="contained"
                                        color="primary"
                                        onClick={handleSaveChanges}
                                        disabled={loading}
                                        fullWidth
                                        sx={{
                                            py: 1,
                                            px: 3,
                                            textTransform: 'none',
                                            fontSize: '1rem',
                                            borderRadius: 1,
                                        }}
                                    >
                                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                                    </Button>
                                </Box>
                            </TabPanel>

                            {/* Tab 2: Change Password */}
                            <TabPanel value={tabValue} index={1}>
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
                                />
                                <TextField
                                    label="New Password"
                                    type="password"
                                    variant="outlined"
                                    fullWidth
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    margin="normal"
                                />
                                <TextField
                                    label="Confirm Password"
                                    type="password"
                                    variant="outlined"
                                    fullWidth
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    margin="normal"
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
                                        {passwordLoading ? (
                                            <CircularProgress size={24} color="inherit" />
                                        ) : (
                                            'Change Password'
                                        )}
                                    </Button>
                                </Box>
                            </TabPanel>
                        </Box>
                    </Box>
                </Box>
            )}

            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                content={confirmDialog.content}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog((prev) => ({...prev, open: false}))}
                confirmText="Confirm"
                cancelText="Cancel"
            />
        </>
    );
}

export default Profile;
