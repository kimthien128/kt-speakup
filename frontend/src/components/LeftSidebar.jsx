import React, {useState, useEffect, useRef} from 'react';
import axios from '../axiosInstance';
import {useNavigate} from 'react-router-dom';
import {Box, Typography, Button, List, ListItem, ListItemText, TextField, IconButton, Divider} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';

function LeftSidebar({onSelectChat, refreshChatsCallback, selectedChatId}) {
    const [chats, setChats] = useState([]);
    const [editingChatId, setEditingChatId] = useState(null); // Theo dõi chat đang sửa
    const [editTitle, setEditTitle] = useState(''); // Lưu title đang chỉnh sửa
    const navigate = useNavigate();
    const editRef = useRef(null); // Ref để kiểm tra click ngoài

    // Lấy danh sách chat từ backend
    const fetchChats = async () => {
        try {
            const res = await axios('/chats');
            setChats(res.data.chats || res.data); // Thêm fallback nếu backend trả trực tiếp mảng
        } catch (err) {
            console.error('Error fetching chats:', err.response?.data || err.message);
            setChats([]); // Đặt rỗng nếu lỗi
        }
    };

    // Hàm này được truyền ra ngoài để các component khác gọi
    const refreshChats = async () => {
        await fetchChats();
    };

    // Tạo chat mới
    const handleNewChat = async () => {
        try {
            const res = await axios.post('/chats');
            const newChatId = res.data.chat_id;
            await fetchChats(); // Cập nhật danh sách chat
            onSelectChat(newChatId); // Chọn chat mới ngay
            navigate(`/chat/${newChatId}`); // Chuyển URL
            if (refreshChatsCallback) refreshChatsCallback(); // Gọi callback nếu có
        } catch (err) {
            console.error('Error creating chat:', err.response?.data || err.message);
        }
    };

    // Xóa chat
    const handleDeleteChat = async (chatId) => {
        if (!confirm('Are you sure you want to delete chat?')) return;
        try {
            await axios.delete(`/chats/${chatId}`);
            // Cập nhật danh sách chat sau khi xóa
            setChats((prevChats) => prevChats.filter((chat) => chat._id !== chatId));
            if (chatId === editingChatId) setEditingChatId(null);
            // Nếu chat đang chọn bị xóa, reset onSelectChat
            onSelectChat(null);
            navigate('/chat'); // Quay về trang mặc định
            if (refreshChatsCallback) refreshChatsCallback();
        } catch (err) {
            console.error('Error deleting chat:', err.response?.data || err.message);
            alert('Failed to delete chat');
        }
    };

    // Bắt đầu chỉnh sửa title
    const handleEditChat = (chatId, currentTitle) => {
        setEditingChatId(chatId);
        setEditTitle(currentTitle);
    };

    // Lưu title mới
    const handleSaveTitle = async (chatId) => {
        if (!editTitle.trim()) {
            alert('Title cannot be empty');
            return;
        }

        try {
            await axios.put(`/chats/${chatId}`, {title: editTitle}, {headers: {'Content-Type': 'application/json'}});
            setChats((prevChats) =>
                prevChats.map((chat) => (chat._id === chatId ? {...chat, title: editTitle} : chat))
            );
            setEditingChatId(null); // Thoát chế độ sửa
            if (refreshChatsCallback) refreshChatsCallback();
        } catch (err) {
            console.error('Error updating title:', err.response?.data || err.message);
            alert('Failed to update title');
        }
    };

    // Hủy chỉnh sửa khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (editRef.current && !editRef.current.contains(e.target)) {
                setEditingChatId(null);
            }
        };
        if (editingChatId) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [editingChatId]);

    useEffect(() => {
        fetchChats();
    }, []);

    // Gọi refreshChatsCallback chỉ một lần khi mount
    useEffect(() => {
        if (refreshChatsCallback) {
            refreshChatsCallback(refreshChats);
        }
    }, [refreshChatsCallback]);

    return (
        <Box
            sx={{
                height: '100%',
                bgcolor: 'background.paper',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Logo */}
            <Box sx={{mb: 2, textAlign: 'center'}}>
                <img
                    src="https://marketplace.canva.com/EAGD_ug6bbY/1/0/1600w/canva-PXPfiI0IpT4.jpg"
                    alt="KT SpeakUp Logo"
                    style={{maxWidth: '150px', height: 'auto'}}
                />
            </Box>
            <Divider sx={{mb: 2}} />

            {/* Chat History */}
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNewChat}
                sx={{mb: 2, bgcolor: 'primary.main', '&:hover': {bgcolor: 'primary.dark'}}}
            >
                New Chat
            </Button>
            <Box sx={{flexGrow: 1, overflowY: 'auto'}}>
                <List>
                    {chats.map((chat) => (
                        <ListItem
                            key={chat._id}
                            onClick={() => onSelectChat(chat._id)}
                            sx={{
                                borderRadius: 1,
                                mb: 1,
                                '&:hover': {
                                    bgcolor: 'grey.100',
                                    transition: 'background-color 0.2s',
                                    color: 'inherit',
                                },
                                bgcolor: chat._id === selectedChatId ? 'secondary.main' : 'transparent',
                                color: chat._id === selectedChatId ? 'white' : 'inherit',
                            }}
                        >
                            {editingChatId === chat._id ? (
                                <Box
                                    ref={editRef}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: '100%',
                                    }}
                                >
                                    <TextField
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        size="small"
                                        sx={{flexGrow: 1, mr: 1}}
                                    />
                                    <IconButton
                                        edge="end"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Ngăn chọn chat
                                            handleSaveTitle(chat._id);
                                        }}
                                    >
                                        <SaveIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            ) : (
                                <>
                                    <ListItemText primary={chat.title || 'Untitled Chat'} />
                                    {/* Sửa: Chỉ hiển thị nút Edit/Delete khi hover */}
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            visibility: 'hidden',
                                            '&:hover': {
                                                visibility: 'visible',
                                            },
                                            '.MuiListItem-root:hover &': {visibility: 'visible'}, // Kích hoạt từ ListItem cha
                                        }}
                                    >
                                        <IconButton
                                            edge="end"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Ngăn chọn chat khi nhấn Edit
                                                handleEditChat(chat._id, chat.title);
                                            }}
                                            sx={{mr: 1}}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            edge="end"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Ngăn chọn chat khi nhấn X
                                                handleDeleteChat(chat._id);
                                            }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </>
                            )}
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Box>
    );
}

export default LeftSidebar;
