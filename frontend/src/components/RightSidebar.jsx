import React, {useState, useEffect, use} from 'react';
import {Box, Typography, Button, Avatar, Chip, Divider} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import axios from '../axiosInstance';

function RightSidebar({userEmail, onLogout, chatId, onVocabAdded}) {
    const [vocabList, setVocabList] = useState([]);

    const handleLogoutClick = () => {
        if (window.confirm('Are you sure want to logout')) {
            onLogout();
        }
    };

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

    return (
        <Box
            sx={{
                height: '100%',
                bgcolor: 'background.paper',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            {/* Phần 1: Thông tin user + Logout */}
            {userEmail && (
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <Avatar sx={{bgcolor: 'primary.main', mb: 1, mx: 'auto'}}>{userEmail[0].toUpperCase()}</Avatar>
                    <Typography variant="body1">Welcome {userEmail}</Typography>
                    <Button variant="outlined" startIcon={<LogoutIcon />} onClick={handleLogoutClick} sx={{mt: 2}}>
                        Logout
                    </Button>
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
                <Typography variant="subtitle1" sx={{mb: 1}}>
                    Saved Vocabulary
                </Typography>
                {vocabList.length > 0 ? (
                    <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1}}>
                        {vocabList.map((vocab) => (
                            <Chip
                                key={vocab._id}
                                label={vocab.word}
                                sx={{bgcolor: 'primary.light', color: 'white', '&:hover': {bgcolor: 'primary.main'}}}
                            />
                        ))}
                    </Box>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        No vocabulary saved yet.
                    </Typography>
                )}
            </Box>
            <Divider sx={{my: 2, width: '100%'}} />

            {/* Phần 3: Chi tiết từ vựng */}
            <Box sx={{flexGrow: 1}}>Details Vocab</Box>
        </Box>
    );
}

export default RightSidebar;
