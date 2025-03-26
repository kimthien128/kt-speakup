import React, {useState, useRef, useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route, useParams, useNavigate} from 'react-router-dom';
import axios from './axiosInstance';
import {Box, Drawer} from '@mui/material';

import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import Login from './components/Login';
import Register from './components/Register';

const drawerWidth = 300;
const rightDrawerWidth = 300;

function ChatPage({token, userEmail, onLogout, onSendMessageRef}) {
    const {chatId} = useParams(); // Lấy chatId từ URL
    const navigate = useNavigate();
    const [selectedChatId, setSelectedChatId] = useState(chatId);
    const refreshChatsRef = useRef(null);
    const refreshVocabRef = useRef(null);

    useEffect(() => {
        if (chatId && chatId !== 'undefined' && chatId !== 'null') {
            setSelectedChatId(chatId);
        } else {
            setSelectedChatId(null); // Đặt null nếu chatId không hợp lệ
        }
    }, [chatId]);

    const handleSelectChat = (newChatId) => {
        setSelectedChatId(newChatId);
        navigate(`/chat/${newChatId}`); // Cập nhật URL
    };

    const handleLogout = () => {
        onLogout();
        navigate('/');
    };

    const handleWordClick = (word, event) => {
        console.log('Clicked word:', word, 'at:', event.pageX, event.pageY);
    };

    return (
        <Box sx={{display: 'flex', height: '100vh', bgcolor: 'background.default'}}>
            {/* LeftSidebar (Drawer cố định) */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        bgcolor: 'background.paper',
                        borderRight: '1px solid',
                        borderColor: 'divider',
                    },
                }}
            >
                <LeftSidebar
                    onSelectChat={handleSelectChat}
                    refreshChatsCallback={(fn) => (refreshChatsRef.current = fn)}
                    selectedChatId={selectedChatId}
                />
            </Drawer>

            {/* Main Content (ChatArea + InputArea) */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100vh',
                    p: 2,
                    // overflow: 'hidden', // Không cuộn toàn bộ
                }}
            >
                <Box
                    sx={{
                        flexGrow: 1,
                        display: 'flex',
                        margin: '0 auto',
                        maxWidth: '900px',
                        overflowY: 'auto', // Cuộn nội dung bên trong ChatArea
                        bgcolor: 'background.paper',
                        p: 2,
                    }}
                >
                    <ChatArea
                        chatId={selectedChatId}
                        onWordClick={handleWordClick}
                        onSendMessage={onSendMessageRef}
                        onVocabAdded={refreshVocabRef}
                    />
                </Box>

                {/* InputArea */}
                <Box
                    sx={{
                        mt: 2,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        p: 1,
                    }}
                >
                    <InputArea
                        chatId={selectedChatId}
                        setChatId={(newChatId) => {
                            setSelectedChatId(newChatId);
                            navigate(`/chat/${newChatId}`);
                        }}
                        onSendMessage={onSendMessageRef.current}
                        refreshChats={refreshChatsRef.current} // Truyền refreshChats vào InputArea
                    />
                </Box>
            </Box>

            {/* RightSidebar (Drawer cố định) */}
            <Drawer
                variant="permanent"
                anchor="right"
                sx={{
                    width: rightDrawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: rightDrawerWidth,
                        boxSizing: 'border-box',
                        bgcolor: 'background.paper',
                        borderLeft: '1px solid',
                        borderColor: 'divider',
                    },
                }}
            >
                <RightSidebar
                    onLogout={handleLogout}
                    userEmail={userEmail}
                    chatId={selectedChatId}
                    onVocabAdded={refreshVocabRef}
                />
            </Drawer>
        </Box>
    );
}

function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [userEmail, setUserEmail] = useState(''); // Lưu email để hiển thị user đăng nhập
    const [isLoading, setIdLoading] = useState(true); // Trạng thái kiểm tra token
    const onSendMessageRef = useRef(null);

    // Lấy email từ backend khi có token
    useEffect(() => {
        const verifyToken = async () => {
            const storedToken = localStorage.getItem('token');
            if (!storedToken) {
                setIdLoading(false);
                return; // Không có token, chuyển thẳng đến login
            }
            try {
                // Gọi API để kiểm tra token hợp lệ
                const res = await axios.get('/auth/me');
                setUserEmail(res.data.email);
            } catch (err) {
                console.error('Error fetching user email:', err.response?.data || err.message);
            } finally {
                setIdLoading(false);
            }
        };
        verifyToken();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUserEmail(''); // Xóa email khi logout
    };

    // Nếu không có token, hiển thị Router với Login/Register
    if (!token) {
        return (
            <Router>
                <Routes>
                    <Route path="/" element={<Login setToken={setToken} setUserEmail={setUserEmail} />} />
                    <Route path="/register" element={<Register />} />
                </Routes>
            </Router>
        );
    }

    // Nếu có token, hiển thị giao diện chính
    return (
        <Router>
            <Routes>
                <Route
                    path="/chat/:chatId"
                    element={
                        <ChatPage
                            token={token}
                            userEmail={userEmail}
                            onLogout={handleLogout}
                            onSendMessageRef={onSendMessageRef}
                        />
                    }
                />
                <Route
                    path="*"
                    element={
                        <ChatPage
                            token={token}
                            userEmail={userEmail}
                            onLogout={handleLogout}
                            onSendMessageRef={onSendMessageRef}
                        />
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
