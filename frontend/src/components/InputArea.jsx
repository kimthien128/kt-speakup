import React, {useState, useRef} from 'react';
import axios from '../axiosInstance';
import useAudioPlayer from '../hooks/useAudioPlayer';
// import './InputArea.css';

function InputArea({chatId, setChatId, onSendMessage, refreshChats}) {
    const [transcript, setTranscript] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [sttMethod, setSttMethod] = useState('vosk');
    const [ttsMethod, setTtsMethod] = useState('gtts');
    const [generateMethod, setGenerateMethod] = useState('mistral');
    const mediaRecorderRef = useRef(null);
    const {playSound, audioRef} = useAudioPlayer();

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.start();
            setIsRecording(true);

            mediaRecorderRef.current.ondataavailable = async (e) => {
                const audioBlob = e.data; // Lấy trực tiếp từ event
                // Gửi audioBlob tới /stt
                try {
                    const sttResponse = await axios.post(`/stt?method=${sttMethod}`, audioBlob, {
                        headers: {
                            'Content-Type': 'audio/webm',
                        },
                    });
                    setTranscript(sttResponse.data.transcript || '');
                } catch (err) {
                    console.log('Fetch error:', err.response?.data || err.message);
                    setTranscript('Failed to process audio');
                }
            };

            mediaRecorderRef.current.onstop = () => {
                stream.getTracks().forEach((track) => track.stop());
                setIsRecording(false);
            };
        } catch (err) {
            console.log('Error:', err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    const fetchSuggestions = async (baseText, currentChatId) => {
        const suggestionPrompts = [`Short follow-up to: "${baseText}"`, `Short next question after: "${baseText}"`];
        const newSuggestions = [];
        for (const prompt of suggestionPrompts) {
            try {
                const res = await axios.post(
                    `/generate?method=${generateMethod}`,
                    {transcript: prompt, chat_id: currentChatId},
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );
                if (!res.data.error) newSuggestions.push(res.data.response);
            } catch (err) {
                console.error('Suggestion error:', err);
            }
        }
        setSuggestions(newSuggestions.slice(0, 2)); // Lấy 2 gợi ý
    };

    const handleSend = async () => {
        if (!transcript.trim()) return; // Ngăn gửi nếu transcript rỗng
        console.log('Sending transcript:', transcript);

        let currentChatId = chatId;
        // Nếu chatId không hợp lệ, tạo chat mới trước
        if (
            !currentChatId ||
            currentChatId === 'null' ||
            currentChatId === 'undefined' ||
            typeof currentChatId !== 'string'
        ) {
            try {
                const res = await axios.post(`/chats`);
                currentChatId = res.data.chat_id;
                setChatId(currentChatId); // Cập nhật chatId và URL
                if (refreshChats) await refreshChats(); // Cập nhật danh sách sau khi tạo chat
            } catch (err) {
                console.error('Error creating chat:', err.response?.data || err.message);
                setTranscript('Error creating chat');
                return;
            }
        }

        // Hiển thị tin nhắn người dùng ngay lập tức
        const userMessage = {user: transcript, ai: '...'};
        if (onSendMessage) {
            onSendMessage(userMessage); // Gửi tin nhắn tạm ngay lập tức
        }
        const userInput = transcript;
        setTranscript(''); // Xóa textarea

        try {
            // Gửi transcript đến /generate để lấy phản hồi từ AI
            const generateResponse = await axios.post(
                `/generate?method=${generateMethod}`,
                {transcript: userInput, chat_id: currentChatId},
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            if (generateResponse.data.error) throw new Error(generateResponse.data.error);
            const aiResponse = generateResponse.data.response;

            // Lấy audioUrl từ /tts và truyền vào playSound
            const ttsResponse = await axios.post(
                `/tts?method=${ttsMethod}`,
                {text: aiResponse},
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            const audioUrl = ttsResponse.headers['x-audio-url'];
            await playSound({audioUrl}); // Phát âm thanh với audioUrl

            // Lưu vào backend /chats/{chat_id}/history
            await axios.post(
                `/chats/${currentChatId}/history`,
                {user: userInput, ai: aiResponse, audioUrl: audioUrl},
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            // Cập nhật ChatArea với phản hồi AI
            const updatedMessage = {user: userInput, ai: aiResponse};
            if (onSendMessage) onSendMessage(updatedMessage);

            // Cập nhật danh sách sau khi gửi tin nhắn
            if (refreshChats) await refreshChats();

            // Lấy gợi ý dựa trên response
            await fetchSuggestions(aiResponse, currentChatId);
        } catch (err) {
            console.log('Error in handleSend:', err.response?.data || err.message);
            const errorMessage = {user: userInput, ai: 'Error processing response'};
            if (onSendMessage) {
                onSendMessage(errorMessage);
            }
        }
    };

    const handleWordClick = (word, event) => {
        console.log(`Clicked word: ${word}`); // Xử lý thêm nếu cần
    };

    return (
        <footer className="input-area">
            {/* Select cho STT */}
            <select value={sttMethod} onChange={(e) => setSttMethod(e.target.value)}>
                <option value="assemblyai">AssemblyAI (API)</option>
                <option value="vosk">Vosk (Local)</option>
            </select>

            {/* Select cho generate models */}
            <select value={generateMethod} onChange={(e) => setGenerateMethod(e.target.value)}>
                <option value="mistral">Mistral</option>
                <option value="gemini">Gemini</option>
            </select>

            {/* Select cho TTS */}
            <select value={ttsMethod} onChange={(e) => setTtsMethod(e.target.value)}>
                <option value="gtts">gTTS (Google)</option>
                <option value="piper">Piper (Local)</option>
            </select>

            <div className="suggestions">
                <h4>Suggestions:</h4>
                {suggestions.map((suggestion, index) => (
                    <p key={index}>
                        {suggestion && typeof suggestion === 'string' ? (
                            suggestion.split(' ').map((word, i) => (
                                <span key={i} onDoubleClick={(e) => handleWordClick(word, e)}>
                                    {word}&nbsp;
                                </span>
                            ))
                        ) : (
                            <span>No suggestion available</span>
                        )}
                    </p>
                ))}
            </div>

            <button className="record-btn" onClick={isRecording ? stopRecording : startRecording}>
                <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
            </button>

            <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Your speech here..."
                required
            />

            <button className="send-btn" onClick={handleSend}>
                Send
            </button>
        </footer>
    );
}

export default InputArea;
