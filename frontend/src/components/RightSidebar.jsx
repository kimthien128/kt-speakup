import React, {useState, useEffect, use} from 'react';
import {Box, Typography, Button, Avatar, Chip, Divider, TextField, InputAdornment} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import axios from '../axiosInstance';

function RightSidebar({userEmail, onLogout, chatId, onVocabAdded}) {
    const [vocabList, setVocabList] = useState([]); //state cho danh sách từ vựng
    const [searchTerm, setSearchTerm] = useState(''); //state cho từ khóa tìm kiếm vocab

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
            {/* Phần 1: Thông tin user + Logout */}
            {userEmail && (
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <Avatar sx={{bgcolor: 'primary.main', mb: 1, mx: 'auto'}}>{userEmail[0].toUpperCase()}</Avatar>
                    <Typography variant="body1">Welcome {userEmail}</Typography>
                    <Button variant="text" startIcon={<LogoutIcon />} onClick={handleLogoutClick} sx={{mt: 2}}>
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
