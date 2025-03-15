import React, {useState, useRef} from 'react';
import Navbar from './components/Navbar';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import HistorySidebar from './components/HistorySidebar';
import VocabSidebar from './components/VocabSidebar';
import './App.css';

function App() {
    const [selectedChatId, setSelectedChatId] = useState(null);
    const onSendMessageRef = useRef(null);

    const handleSelectChat = (chatId) => {
        setSelectedChatId(chatId); // Lưu chat_id được chọn
        console.log('Selected chat:', chatId);
    };

    const handleWordClick = (word, event) => {
        console.log('Clicked word:', word, 'at', event.pageX, event.pageY);
    };

    return (
        <div className="App">
            <Navbar />
            <div className="main-container">
                <HistorySidebar onSelectChat={handleSelectChat} />
                <div className="content">
                    <ChatArea chatId={selectedChatId} onWordClick={handleWordClick} onSendMessage={onSendMessageRef} />{' '}
                    {/* Truyền sang ChatArea */}
                    <InputArea chatId={selectedChatId} onSendMessage={onSendMessageRef.current} />
                </div>
                <VocabSidebar />
            </div>
        </div>
    );
}

export default App;
