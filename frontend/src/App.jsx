import React, {useState, useRef, useEffect, use} from 'react';
import {BrowserRouter as Router, Routes, Route, useParams, useNavigate, Navigate} from 'react-router-dom';
import axios from './axiosInstance';
import {Box, Container} from '@mui/material';

import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import Login from './components/Login';
import Register from './components/Register';
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
        <>
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
                        onSendMessage={onSendMessageRef.current}
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
        </>
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

                    {/* Catch-all route - điều hướng mọi đường dẫn không khớp về "/" */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        );
    }

    // Nếu có token, hiển thị giao diện chính
    return (
        <Router>
            <Routes>
                <Route path="/profile" element={<Profile onLogout={handleLogout} />} />
                <Route path="/admin" element={<AdminPanel />} />
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
