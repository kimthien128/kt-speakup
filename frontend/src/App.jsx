import React, {useState, useRef, useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route, useParams, useNavigate} from 'react-router-dom';
import axios from './axiosInstance';
import {Box, Container} from '@mui/material';

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
        <Box
            sx={{
                display: 'flex',
                p: 4,
                height: '100vh',
                background: 'linear-gradient(135deg, #ef88bb 0%, #291850 100%)',
                backgroundImage: 'url("https://marketplace.canva.com/EAGD_ug6bbY/1/0/1600w/canva-PXPfiI0IpT4.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                boxSizing: 'border-box',
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {/* Lớp phủ làm tối nền */}
            {/* <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                }}
            ></Box> */}

            {/* Box bao bọc có radius */}
            <Box
                sx={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    borderRadius: 10,
                    border: '1px solid',
                    borderColor: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 0 25px rgba(0, 0, 0, 0.15)',
                    boxSizing: 'border-box',
                    backdropFilter: 'blur(20px)',
                    bgcolor: 'rgba(255, 255, 255, 0.5)',
                }}
            >
                {/* LeftSidebar */}
                <LeftSidebar
                    onSelectChat={handleSelectChat}
                    refreshChatsCallback={(fn) => (refreshChatsRef.current = fn)}
                    selectedChatId={selectedChatId}
                />

                {/* Main Content (ChatArea + InputArea) */}
                <Box
                    sx={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        borderLeft: '1px solid',
                        borderRight: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Box
                        sx={{
                            flexGrow: 1,
                            pt: 2,
                            overflow: 'hidden',
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

                {/* RightSidebar */}
                <RightSidebar
                    onLogout={handleLogout}
                    userEmail={userEmail}
                    chatId={selectedChatId}
                    onVocabAdded={refreshVocabRef}
                />
            </Box>
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
