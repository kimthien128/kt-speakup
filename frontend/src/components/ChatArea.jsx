import React, {useState, useRef, useEffect} from 'react';
import './ChatArea.css';

function ChatArea({chatId, onWordClick, onSendMessage}) {
    const [tooltip, setTooltip] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const audioRef = useRef(null); // Ref để quản lý audio element
    const tooltipRef = useRef(null); // Ref để tham chiếu vùng tooltip

    // Lấy lịch sử chat từ backend khi chatId thay đổi
    useEffect(() => {
        if (chatId) {
            fetch(`${import.meta.env.VITE_API_URL}/chats/${chatId}/history`, {credentials: 'include'})
                .then((res) => res.json())
                .then((data) => setChatHistory(data.history || []))
                .catch((err) => console.error('Error fetching history:', err));
        } else {
            setChatHistory([]); // Xóa lịch sử khi không có chatId
        }
    }, [chatId]);

    // Gán onSendMessage để cập nhật chatHistory ngay lập tức
    useEffect(() => {
        if (onSendMessage) {
            onSendMessage.current = (message) => {
                setChatHistory((prev) => {
                    const index = prev.findIndex((msg) => msg.user === message.user && msg.ai === '...');
                    if (index !== -1) {
                        // Nếu tìm thấy tin nhắn tạm (ai: '...'), thay thế nó
                        const updatedHistory = [...prev];
                        updatedHistory[index] = message;
                        return updatedHistory;
                    }
                    // Nếu không, thêm mới (trường hợp tin nhắn đầu tiên)
                    return [...prev, message];
                });
            };
        }
    }, [onSendMessage]);

    // Loại bỏ dấu câu ở đầu và cuối từ
    const cleanWord = (word) => {
        return word.replace(/^[^a-zA-Z']+|[^a-zA-Z']+$/g, '');
    };

    // Xử lý double-click từ
    const handleWordClick = (word, event) => {
        const cleanedWord = cleanWord(word);
        if (!cleanedWord) return;

        // Hiển thị tooltip ngay lập tức với trạng thái "Loading"
        setTooltip({
            word: cleanedWord,
            definition: 'Loading...',
            phonetic: 'Loading...',
            audio: 'Loading...',
            x: event.pageX,
            y: event.pageY,
        });

        // Fetch dữ liệu bất đồng bộ và cập nhật tooltip sau
        fetch(`${import.meta.env.VITE_API_URL}/word-info`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({word: cleanedWord}),
            credentials: 'include',
        })
            .then((res) => {
                if (!res.ok) throw new Error(`Word info failed: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                setTooltip({
                    word: cleanedWord,
                    definition: data.definition || 'No definition found',
                    phonetic: data.phonetic || 'N/A',
                    audio: data.audio || '',
                    x: event.pageX,
                    y: event.pageY,
                }); //tooltip hiển thị ngay tại vị trí con trỏ chuột
                onWordClick(cleanedWord, event); // Callback để InputArea xử lý thêm nếu cần
            })
            .catch((err) => {
                console.error('Error fetching word info:', err);
                setTooltip({
                    word: cleanedWord,
                    definition: 'Failed to fetch info',
                    phonetic: 'N/A',
                    audio: '',
                    x: event.pageX,
                    y: event.pageY,
                });
            });
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

    // Dùng trực tiếp phát âm từ api
    const playWord = (audioUrl) => {
        // console.log(tooltip);
        if (audioUrl && typeof audioUrl === 'string') {
            console.log('Playing audio from URL:', audioUrl);
            if (audioRef.current) {
                audioRef.current.src = audioUrl;
                audioRef.current.play().catch((err) => {
                    console.error('Error playing audio:', err);
                });
            }
        } else {
            console.log('No valid audio URL available for this word:', audioUrl);
        }
    };
    // Hoặc dùng lại TTS
    // const playWord = async (word) => {
    //     try {
    //         const res = await fetch(`${import.meta.env.VITE_API_URL}/tts?method=gtts`, {
    //             method: 'POST',
    //             headers: {'Content-Type': 'application/json'},
    //             body: JSON.stringify({text: word}),
    //             credentials: 'include',
    //         });
    //         if (!res.ok) throw new Error('TTS failed');
    //         const audioBlob = await res.blob();
    //         const audioUrl = URL.createObjectURL(audioBlob);
    //         new Audio(audioUrl).play();
    //     } catch (err) {
    //         console.error('Error playing word:', err);
    //     }
    // };

    const addToVocab = async () => {
        if (!tooltip || !chatId) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/add-vocab`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({...tooltip, chat_id: chatId}), // Backend tự lấy topic
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to add vocab');
            console.log(`Added ${tooltip.word} to vocab`);
            // setTooltip(null); // Tắt tooltip
        } catch (err) {
            console.error('Error adding to vocab:', err);
        }
    };

    // Đóng tooltip khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
                setTooltip(null);
            }
        };

        if (tooltip) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Cleanup sự kiện khi tooltip bị tắt hoặc component unmount
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [tooltip]); // Chạy lại khi tooltip thay đổi

    return (
        <main className="chat-area">
            {chatHistory.length > 0 ? (
                chatHistory.map((msg, index) => (
                    <div key={index} className="message-group">
                        <div className="message user">
                            {(msg.user || '').split(' ').map((word, i) => (
                                <span key={i} onDoubleClick={(e) => handleWordClick(word, e)}>
                                    {word}&nbsp;
                                </span>
                            ))}
                        </div>
                        <div className="message system">
                            {(msg.ai || '').split(' ').map((word, i) => (
                                <span key={i} onDoubleClick={(e) => handleWordClick(word, e)}>
                                    {word}&nbsp;
                                </span>
                            ))}
                            {msg.audioPath && <button onClick={() => playAudio(msg.audioPath)}>Play</button>}
                        </div>
                    </div>
                ))
            ) : (
                <p>No chat history available</p>
            )}
            {tooltip && (
                <div
                    ref={tooltipRef} // Gán ref cho vùng tooltip
                    className="tooltip"
                    style={{top: tooltip.y + 30, left: tooltip.x, position: 'absolute'}}
                >
                    <p>
                        <strong>{tooltip.word}</strong>
                    </p>
                    <p>{tooltip.definition}</p>
                    <p>{tooltip.phonetic}</p>
                    <button onClick={() => playWord(tooltip.audio)} disabled={!tooltip.audio}>
                        Play
                    </button>
                    <button onClick={addToVocab} disabled={tooltip.phonetic == 'N/A'}>
                        Add to vocab
                    </button>
                    <button onClick={() => setTooltip(null)}>Close</button>
                </div>
            )}
            <audio ref={audioRef} style={{display: 'none'}}></audio>
        </main>
    );
}

export default ChatArea;
