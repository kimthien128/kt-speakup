import React, {useState, useEffect, use} from 'react';
import {Link as RouterLink} from 'react-router-dom';

import {Box, Typography, Button, Avatar, Chip, Divider, TextField, Menu, MenuItem, IconButton} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SearchIcon from '@mui/icons-material/Search';

import axios from '../axiosInstance';
import {getAvatarInitial} from '../utils/avatarUtils';

function RightSidebar({userEmail, onLogout, chatId, onVocabAdded}) {
    const [vocabList, setVocabList] = useState([]); //state cho danh sách từ vựng
    const [searchTerm, setSearchTerm] = useState(''); //state cho từ khóa tìm kiếm vocab
    const [userInfo, setUserInfo] = useState(null); //state cho thông tin user
    const [anchorEl, setAnchorEl] = useState(null); //state cho menu user

    // Hàm mở và đóng Menu
    const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const handleLogoutClick = () => {
        if (window.confirm('Are you sure want to logout')) {
            onLogout();
        }
    };

    // Fetch thông tin user từ API /auth/me
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    return;
                }

                const res = await axios.get('/auth/me');
                setUserInfo(res.data);
            } catch (err) {
                console.error('Error fetching user info:', err.response?.data || err.message);
                setUserInfo(null);
            }
        };
        if (userEmail) {
            fetchUserInfo();
        }
    }, [userEmail]);

    // Hàm fetch từ vựng
    const fetchVocab = async () => {
        // Bỏ qua nếu chatId không hợp lệ
        if (!chatId || chatId === 'null' || chatId === 'undefined') {
            setVocabList([]);
            return;
        }

        try {
            const res = await axios.get(`/vocab/${chatId}`);
            setVocabList(res.data.vocab || []);
        } catch (err) {
            console.error('Error fetching vocab list:', err.response?.data || err.message);
            setVocabList([]); // Đặt rỗng nếu lỗi
        }
    };

    // Fetch từ vựng khi chatId thay đổi
    useEffect(() => {
        fetchVocab();
    }, [chatId]);

    // Hàm để parent gọi khi cần refresh
    useEffect(() => {
        if (onVocabAdded) {
            onVocabAdded.current = fetchVocab; // Truyền hàm refresh ra ngoài
        }
    }, [onVocabAdded, chatId]); // Chạy lại khi chatId thay đổi

    // Hàm lọc từ vựng dựa trên từ khóa tìm kiếm
    const filteredVocab = vocabList.filter((vocab) => vocab.word.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <Box
            sx={{
                width: 300,
                height: '100%',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
            }}
        >
            {/* Phần 1: Thông tin user + Account Menu */}
            {userEmail && userInfo && (
                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-around', mb: 2}}>
                    {/* Link: Admin thì hiện link quản lý, user thì hiện Welcome + displayName */}
                    {userInfo.isAdmin ? (
                        <Button
                            component={RouterLink}
                            to="/admin"
                            startIcon={<AdminPanelSettingsIcon />}
                            color="primary"
                            sx={{
                                textTransform: 'none',
                                fontSize: '1rem',
                            }}
                        >
                            Admin Panel
                        </Button>
                    ) : (
                        <Typography
                            variant="body1"
                            sx={{
                                overflow: 'hidden', //Giới hạn title
                                textOverflow: 'ellipsis', //Thêm dấu ...
                                whiteSpace: 'nowrap', //Không ngắt dòng
                            }}
                        >
                            Welcome {userInfo.displayName || userEmail}
                        </Typography>
                    )}

                    {/* Account Menu */}
                    <IconButton onClick={handleMenuOpen}>
                        <Avatar src={userInfo.avatarPath} sx={{bgcolor: 'primary.main'}}>
                            {/* Hiển thị chữ cái đầu nếu không có avatarPath */}
                            {!userInfo.avatarPath && getAvatarInitial(userInfo)}
                        </Avatar>
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                        transformOrigin={{vertical: 'top', horizontal: 'right'}}
                        PaperProps={{
                            sx: {
                                mt: 1,
                                borderRadius: 4,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                minWidth: 180,
                                bgcolor: 'background.paper',
                            },
                        }}
                    >
                        <MenuItem
                            component={RouterLink}
                            to="/profile"
                            onClick={handleMenuClose}
                            sx={{
                                py: 1,
                                px: 2,
                                fontSize: '1rem',
                                color: 'grey.800',
                                '&:hover': {
                                    bgcolor: 'primary.light', // Hiệu ứng hover
                                    color: 'primary.contrastText', // Màu chữ khi hover
                                },
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <AccountCircleIcon />
                            Profile
                        </MenuItem>
                        <Divider sx={{my: 0.5}} />
                        <MenuItem
                            onClick={handleLogoutClick}
                            sx={{
                                py: 1,
                                px: 2,
                                fontSize: '1rem',
                                color: 'grey.800',
                                '&:hover': {
                                    bgcolor: 'primary.light',
                                    color: 'primary.contrastText',
                                },
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <LogoutIcon />
                            Logout
                        </MenuItem>
                    </Menu>
                </Box>
            )}

            <Divider sx={{my: 2, width: '100%'}} />

            {/* Phần 2: Danh sách từ vựng (Chip) */}
            <Box
                sx={{
                    maxHeight: '50%',
                    overflowY: 'auto',
                    mb: 2,
                }}
            >
                {vocabList.length > 0 && (
                    <TextField
                        label="Search vocabulary"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        error={searchTerm && filteredVocab.length === 0}
                        helperText={searchTerm && filteredVocab.length === 0 ? 'No matches found' : ''}
                        sx={{my: 1}}
                    />
                )}
                {filteredVocab.length > 0 ? (
                    <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1}}>
                        {filteredVocab.map((vocab) => (
                            <Chip
                                key={vocab._id}
                                label={vocab.word}
                                sx={{bgcolor: 'primary.light', color: 'white', '&:hover': {bgcolor: 'primary.main'}}}
                            />
                        ))}
                    </Box>
                ) : (
                    <Typography variant="h6">{vocabList.length === 0 ? 'Save your first word !!' : ''}</Typography>
                )}
            </Box>
            <Divider sx={{my: 1, width: '100%'}} />

            {/* Phần 3: Chi tiết từ vựng */}
            <Box sx={{flexGrow: 1}}>
                <Typography variant="h6" sx={{mb: 1}}>
                    Details Vocab
                </Typography>
            </Box>
        </Box>
    );
}

export default RightSidebar;
