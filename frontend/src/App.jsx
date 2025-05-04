import React, {useState, useRef, useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route, useParams, useNavigate, Navigate} from 'react-router-dom';
import axios from './axiosInstance';
import {logger} from './utils/logger';
import {DictionaryProvider} from './context/DictionaryContext';

import {Box, Container} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';

import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Profile from './components/Profile';
import AdminPanel from './components/AdminPanel';

function ChatPage({userEmail, onLogout, onSendMessageRef}) {
    const {chatId} = useParams(); // Lấy chatId từ URL
    const navigate = useNavigate();
    const [selectedChatId, setSelectedChatId] = useState(chatId);
    const refreshChatsRef = useRef(null);
    const refreshVocabRef = useRef(null);
    const [suggestionData, setSuggestionData] = useState({
        latest_suggestion: '',
        translate_suggestion: '',
        suggestion_audio_url: '',
    }); // Dữ liệu suggestion từ backend

    useEffect(() => {
        if (chatId && chatId !== 'undefined' && chatId !== 'null') {
            setSelectedChatId(chatId);
        } else {
            setSelectedChatId(null); // Đặt null nếu chatId không hợp lệ
        }
    }, [chatId]);

    // Lấy suggestionData khi selectedChatId thay đổi
    useEffect(() => {
        const fetchSuggestion = async () => {
            if (!selectedChatId) {
                setSuggestionData({
                    latest_suggestion: '',
                    translate_suggestion: '',
                    suggestion_audio_url: '',
                });
                return;
            }
            try {
                const res = await axios.get(`/chats/${selectedChatId}`);
                const {latest_suggestion, translate_suggestion, suggestion_audio_url} = res.data;
                setSuggestionData({
                    latest_suggestion: latest_suggestion || '',
                    translate_suggestion: translate_suggestion || '',
                    suggestion_audio_url: suggestion_audio_url || '',
                });
            } catch (err) {
                console.error('Error fetching suggestion:', err);
                setSuggestionData({
                    latest_suggestion: '',
                    translate_suggestion: '',
                    suggestion_audio_url: '',
                });
            }
        };
        fetchSuggestion();
    }, [selectedChatId]);

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

    // Callback để cập nhật suggestionData
    const updateSuggestionData = (newData) => {
        setSuggestionData((prevData) => ({
            ...prevData,
            ...newData,
        }));
    };

    return (
        <DictionaryProvider>
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
                        userEmail={userEmail}
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
                    onSendMessage={onSendMessageRef}
                    refreshChats={refreshChatsRef.current} // Truyền refreshChats vào InputArea
                    suggestionData={suggestionData}
                    updateSuggestionData={updateSuggestionData} // Truyền callback
                    onVocabAdded={refreshVocabRef} // Truyền ref để cập nhật vocab
                />
            </Box>

            {/* RightSidebar */}
            <RightSidebar
                onLogout={handleLogout}
                userEmail={userEmail}
                chatId={selectedChatId}
                onVocabAdded={refreshVocabRef}
            />
        </DictionaryProvider>
    );
}

function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [userEmail, setUserEmail] = useState(''); // Lưu email để hiển thị user đăng nhập
    const [isAdmin, setIsAdmin] = useState(false); // Trạng thái admin
    const [isLoading, setIdLoading] = useState(true); // Trạng thái kiểm tra token
    const onSendMessageRef = useRef(null);

    // Lấy email và isAdmin từ backend khi có token
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
                setIsAdmin(res.data.isAdmin || false); // Lưu trạng thái admin từ backend, mặc định là false
                // logger.info('isAdmin from backend:', res.data.isAdmin);
            } catch (err) {
                logger.error('Error fetching user email:', err.response?.data || err.message);
                localStorage.removeItem('token'); // Xóa token nếu không hợp lệ
                setToken(null);
            } finally {
                // logger.info('isAdmin:', isAdmin);
                setIdLoading(false);
            }
        };
        verifyToken();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUserEmail(''); // Xóa email khi logout
        setIsAdmin(false); // Đặt lại trạng thái admin
    };

    if (isLoading) {
        return <CircularProgress />;
    }

    return (
        <Router>
            <Routes>
                {/* Các route không yêu cầu đăng nhập */}
                <Route
                    path="/"
                    element={
                        token ? (
                            <Navigate to="/chat" replace />
                        ) : (
                            <Login setToken={setToken} setUserEmail={setUserEmail} />
                        )
                    }
                />
                <Route path="/register" element={token ? <Navigate to="/chat" replace /> : <Register />} />
                <Route path="/forgot-password" element={token ? <Navigate to="/chat" replace /> : <ForgotPassword />} />

                {/* Luôn cho phép truy cập /reset-password, bất kể đã đăng nhập hay chưa */}
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Các route yêu cầu đăng nhập */}
                <Route
                    path="/profile"
                    element={token ? <Profile onLogout={handleLogout} /> : <Navigate to="/" replace />}
                />
                <Route
                    path="/admin"
                    element={
                        token ? (
                            isAdmin ? (
                                <AdminPanel />
                            ) : (
                                <>
                                    <Navigate to="/chat" replace />
                                </>
                            )
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />

                <Route
                    path="/chat/:chatId"
                    element={
                        token ? (
                            <ChatPage
                                token={token}
                                userEmail={userEmail}
                                onLogout={handleLogout}
                                onSendMessageRef={onSendMessageRef}
                            />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />
                <Route
                    path="/chat"
                    element={
                        token ? (
                            <ChatPage
                                token={token}
                                userEmail={userEmail}
                                onLogout={handleLogout}
                                onSendMessageRef={onSendMessageRef}
                            />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />

                {/* Catch-all route */}
                <Route path="*" element={<Navigate to={token ? '/chat' : '/'} replace />} />
            </Routes>
        </Router>
    );
}

export default App;
