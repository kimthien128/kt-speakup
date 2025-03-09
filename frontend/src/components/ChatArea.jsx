import React, {useState} from 'react';
import './ChatArea.css';

function ChatArea({chatHistory, onWordClick}) {
    const [tooltip, setTooltip] = useState(null);

    const handleWordClick = async (word, event) => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/word-info`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({word}),
            credentials: 'include',
        });
        const data = await res.json();
        setTooltip({...data, x: event.pageX, y: event.pageY}); //tooltip hiển thị ngay tại vị trí con trỏ chuột
        onWordClick(word, event); // Callback để InputArea xử lý thêm nếu cần
    };

    const playAudio = (audioPath) => {
        fetch(`${import.meta.env.VITE_API_URL}/audio/${audioPath}`, {credentials: 'include'})
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`Audio not found: ${res.status}`);
                }
                return res.blob();
            })
            .then((blob) => {
                const audioUrl = URL.createObjectURL(blob);
                new Audio(audioUrl).play();
            })
            .catch((err) => console.log('Error playing audio:', err));
    };

    const playWord = async (word) => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/tts?method=gtts`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({text: word}),
            credentials: 'include',
        });
        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        new Audio(audioUrl).play();
    };

    const addToVocab = async () => {
        await fetch(`${import.meta.env.VITE_API_URL}/add-vocab`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({...tooltip, topic: 'Daily Life'}), // Topic mặc định, sau này làm động
            credentials: 'include',
        });
        setTooltip(null);
    };

    return (
        <main className="chat-area">
            {chatHistory?.map((msg, index) => (
                <div key={index} className="message-group">
                    <div className="message user">
                        {msg.user.split(' ').map((word, i) => (
                            <span key={i} onDoubleClick={(e) => handleWordClick(word, e)}>
                                {word}&nbsp;
                            </span>
                        ))}
                    </div>
                    <div className="message system">
                        {msg.ai.split(' ').map((word, i) => (
                            <span key={i} onDoubleClick={(e) => handleWordClick(word, e)}>
                                {word}&nbsp;
                            </span>
                        ))}
                        {msg.audioPath && <button onClick={() => playAudio(msg.audioPath)}>Play</button>}
                    </div>
                </div>
            ))}
            {tooltip && (
                <div className="tooltip" style={{top: tooltip.y, left: tooltip.x}}>
                    <p>{tooltip.word}</p>
                    <p>{tooltip.meaning}</p>
                    <p>{tooltip.phonetic}</p>
                    <button onClick={() => playWord(tooltip.word)}>Play</button>
                    <button onClick={addToVocab}>Add to vocab</button>
                    <button onClick={() => setTooltip(null)}>Close</button>
                </div>
            )}
        </main>
    );
}

export default ChatArea;
