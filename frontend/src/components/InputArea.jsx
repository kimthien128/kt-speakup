import React, {useState, useRef} from 'react';
import './InputArea.css';

function InputArea() {
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [sttMethod, setSttMethod] = useState('vosk');
    const [ttsMethod, setTtsMethod] = useState('gtts');
    const [generateMethod, setGenerateMethod] = useState('blenderbot');
    const [chatHistory, setChatHistory] = useState([]);
    const mediaRecorderRef = useRef(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.start();
            setIsRecording(true);

            mediaRecorderRef.current.ondataavailable = async (e) => {
                const audioBlob = new Blob([e.data], {type: 'audio/webm'});
                try {
                    // Gửi đến /stt (kèm method) để lấy transcript
                    const sttResponse = await fetch(`${import.meta.env.VITE_API_URL}/stt?method=${sttMethod}`, {
                        method: 'POST',
                        headers: {'Content-Type': 'audio/webm'},
                        body: audioBlob,
                    });
                    const sttData = await sttResponse.json();
                    if (sttData.error) {
                        setTranscript(`Error: ${sttData.error}`);
                        setResponse('');
                        return;
                    }
                    setTranscript(sttData.transcript);

                    // Gửi transcript đến /generate để lấy phản hồi từ BlenderBot
                    const generateResponse = await fetch(
                        `${import.meta.env.VITE_API_URL}/generate?method=${generateMethod}`,
                        {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({transcript: sttData.transcript}),
                        }
                    );
                    const generateData = await generateResponse.json();
                    if (generateData.error) {
                        setResponse(`Error: ${generateData.error}`);
                        setChatHistory([...chatHistory, {text: `Error: ${generateData.error}`, audioPath: null}]);
                    } else {
                        setResponse(generateData.response);
                        // Gửi đến /tts để phát âm thanh
                        const ttsResponse = await fetch(`${import.meta.env.VITE_API_URL}/tts?method=${ttsMethod}`, {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({text: generateData.response}),
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
                        setChatHistory([...chatHistory, {text: generateData.response, audioPath: filename}]);
                    }
                } catch (err) {
                    console.log('Fetch error:', err);
                    setTranscript('Failed to process audio');
                    setResponse('');
                    setChatHistory([...chatHistory, {text: 'Failed to process audio', audioPath: null}]);
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

    const playAudio = (audioPath) => {
        fetch(`${import.meta.env.VITE_API_URL}/audio/${audioPath}`)
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

    return (
        <footer className="input-area">
            {/* Select cho STT */}
            <select value={sttMethod} onChange={(e) => setSttMethod(e.target.value)}>
                <option value="vosk">Vosk (Local)</option>
                <option value="assemblyai">AssemblyAI (API)</option>
            </select>

            {/* Select cho generate models */}
            <select value={generateMethod} onChange={(e) => setGenerateMethod(e.target.value)}>
                <option value="blenderbot">BlenderBot</option>
                <option value="zephyr">Zephyr</option>
                <option value="distilgpt2">DistilGPT2</option>
            </select>

            {/* Select cho TTS */}
            <select value={ttsMethod} onChange={(e) => setTtsMethod(e.target.value)}>
                <option value="gtts">gTTS (Google)</option>
                <option value="piper">Piper (Local)</option>
            </select>

            <button className="record-btn" onClick={isRecording ? stopRecording : startRecording}>
                <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
            </button>

            <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Your speech here..."
            />

            <div className="latest-response">{response ? `AI: ${response}` : ''}</div>

            <div className="chat-history">
                {chatHistory.map((msg, index) => (
                    <div key={index} className="chat-bubble">
                        AI: {msg.text}
                        {msg.audioPath && (
                            <button onClick={() => playAudio(msg.audioPath)}>Play {msg.audioPath}</button>
                        )}
                    </div>
                ))}
            </div>

            <button className="send-btn">Send</button>
        </footer>
    );
}

export default InputArea;
