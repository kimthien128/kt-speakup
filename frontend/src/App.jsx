import React, {useState, useRef, useEffect} from 'react';
import {ThemeProvider} from '@mui/material/styles';
import {Box, Drawer, CssBaseline} from '@mui/material';
import theme from './theme';
import {BrowserRouter as Router, Routes, Route, useParams, useNavigate} from 'react-router-dom';
import axios from './axiosInstance';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';

const drawerWidth = 300;
const rightDrawerWidth = 300;

function ChatPage({token, userEmail, onLogout, onSendMessageRef}) {
    const {chatId} = useParams(); // Lấy chatId từ URL
    const navigate = useNavigate();
    const [selectedChatId, setSelectedChatId] = useState(chatId);
    const refreshChatsRef = useRef(null);

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
                    [`& .MuiDrawer-paper`]: {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        bgcolor: 'background.paper',
                        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
                    },
                }}
            >
                <LeftSidebar
                    onSelectChat={handleSelectChat}
                    refreshChatsCallback={(fn) => (refreshChatsRef.current = fn)}
                />
            </Drawer>

            {/* Main Content (ChatArea + InputArea) */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden', // Không cuộn toàn bộ
                }}
            >
                <Box
                    sx={{
                        flexGrow: 1,
                        overflowY: 'auto', // Cuộn nội dung bên trong ChatArea
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                        p: 2,
                    }}
                >
                    <ChatArea chatId={selectedChatId} onWordClick={handleWordClick} onSendMessage={onSendMessageRef} />
                </Box>
                <Box sx={{mt: 2}}>
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
                    [`& .MuiDrawer-paper`]: {
                        width: rightDrawerWidth,
                        boxSizing: 'border-box',
                        bgcolor: 'background.paper',
                        boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
                    },
                }}
            >
                <RightSidebar onLogout={handleLogout} userEmail={userEmail} />
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
        <ThemeProvider theme={theme}>
            <CssBaseline />
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
        </ThemeProvider>
    );
}

export default App;
