import React, {useState, useRef} from 'react';
import ChatArea from './ChatArea';
import './InputArea.css';

function InputArea() {
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [chatHistory, setChatHistory] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [sttMethod, setSttMethod] = useState('vosk');
    const [ttsMethod, setTtsMethod] = useState('gtts');
    const [generateMethod, setGenerateMethod] = useState('blenderbot');
    const mediaRecorderRef = useRef(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.start();
            setIsRecording(true);

            // Ghi âm theo từng đoạn 100ms để đảm bảo có dữ liệu
            mediaRecorderRef.current.ondataavailable = async (e) => {
                const audioBlob = e.data; // Lấy trực tiếp từ event
                // Gửi audioBlob tới /stt
                try {
                    const sttResponse = await fetch(`${import.meta.env.VITE_API_URL}/stt?method=${sttMethod}`, {
                        method: 'POST',
                        headers: {'Content-Type': 'audio/webm'},
                        body: audioBlob,
                        credentials: 'include',
                    });
                    if (!sttResponse.ok) {
                        throw new Error(`STT failed with status: ${sttResponse.status}`);
                    }
                    const sttData = await sttResponse.json();
                    setTranscript(sttData.transcript || '');
                } catch (err) {
                    console.log('Fetch error:', err);
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

    const fetchSuggestions = async (baseText) => {
        const suggestionPrompts = [`Short follow-up to: "${baseText}"`, `Short next question after: "${baseText}"`];
        const newSuggestions = [];
        for (const prompt of suggestionPrompts) {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/generate?method=${generateMethod}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({transcript: prompt}),
                credentials: 'include',
            });
            const data = await res.json();
            if (!data.error) newSuggestions.push(data.response);
        }
        setSuggestions(newSuggestions.slice(0, 2)); // Lấy 2 gợi ý
    };

    const handleSend = async () => {
        if (!transcript.trim()) return; // Ngăn gửi nếu transcript rỗng
        console.log('Sending transcript:', transcript);
        // Thêm transcript vào chatHistory ngay lập tức để hiển thị lên khung chat
        const newMessage = {user: transcript, ai: '...'};
        setChatHistory([...chatHistory, newMessage]);
        setTranscript(''); // Xóa textarea
        try {
            // Gửi transcript đến /generate để lấy phản hồi từ AI
            const generateResponse = await fetch(`${import.meta.env.VITE_API_URL}/generate?method=${generateMethod}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({transcript}),
                credentials: 'include',
            });
            if (!generateResponse.ok) throw new Error('Generate failed');
            const generateData = await generateResponse.json();
            if (generateData.error) throw new Error(generateData.error);

            // Gửi đến /tts để phát âm thanh
            const ttsResponse = await fetch(`${import.meta.env.VITE_API_URL}/tts?method=${ttsMethod}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text: generateData.response}),
                credentials: 'include',
            });
            if (!ttsResponse.ok) {
                throw new Error('TTS request failed');
            }
            const audioBlob = await ttsResponse.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();

            // Lưu lịch sử với tên file
            const filename = ttsResponse.headers.get('X-Audio-Filename');
            // Cập nhật phản hồi AI vào tin nhắn cuối
            setChatHistory((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    user: transcript,
                    ai: generateData.response || 'No response',
                    audioPath: filename || '',
                };
                return updated;
            });

            // Lấy gợi ý dựa trên response
            await fetchSuggestions(generateData.response);
        } catch (err) {
            console.log('Error:', err);
            setChatHistory((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {user: transcript, ai: `Error: ${err.message}`};
                return updated;
            });
        }
    };

    const handleWordClick = (word, event) => {
        console.log(`Clicked word: ${word}`); // Xử lý thêm nếu cần
    };

    return (
        <>
            <ChatArea chatHistory={chatHistory} onWordClick={handleWordClick} />
            <footer className="input-area">
                {/* Select cho STT */}
                <select value={sttMethod} onChange={(e) => setSttMethod(e.target.value)}>
                    <option value="assemblyai">AssemblyAI (API)</option>
                    <option value="vosk">Vosk (Local)</option>
                </select>

                {/* Select cho generate models */}
                <select value={generateMethod} onChange={(e) => setGenerateMethod(e.target.value)}>
                    <option value="blenderbot">BlenderBot (API)</option>
                    <option value="gemini">Gemini (Google)</option>
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
                            {suggestion.split(' ').map((word, i) => (
                                <span key={i} onDoubleClick={(e) => handleWordClick(word, e)}>
                                    {word}&nbsp;
                                </span>
                            ))}
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
                />

                <button className="send-btn" onClick={handleSend}>
                    Send
                </button>
            </footer>
        </>
    );
}

export default InputArea;
