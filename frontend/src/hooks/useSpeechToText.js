// hooks/useSpeechToText.js
// Quản lý ghi âm và speech-to-text

import { useState, useRef, useEffect } from "react";
import { getSTT } from "../services/sttService";
import { logger } from "../utils/logger";

export const useSpeechToText = (sttMethod) => {
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Thêm state để theo dõi quá trình xử lý ở backend
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null); // ref cho Web Speech API

  // Khởi tạo Web Speech API khi sttMethod là web-speech
  useEffect(() => {
    if (sttMethod === "web-speech") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError("Web Speech API is not supported in this browser.");
        return;
      }
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Tiếp tục ghi nhận khi có âm thanh
      recognitionRef.current.interimResults = true; // Hiển thị kết quả tạm thời
      recognitionRef.current.lang = "en-US"; // Thiết lập ngôn ngữ

      // Tích lũy tất cả các đoạn text mà người dùng nói
      recognitionRef.current.onresult = (event) => {
        let accumulatedTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          accumulatedTranscript += result[0].transcript; // Nối các đoạn text
        }
        setTranscript(accumulatedTranscript.trim()); // Cập nhật transcript với đoạn text đã nối
      };

      recognitionRef.current.onerror = (event) => {
        logger.error("Web Speech API error:", event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        if (isRecording) {
          // Tự động khởi động lại nếu vẫn đang ghi âm
          recognitionRef.current.start();
        }
      };

      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };
    }
  }, [sttMethod]);

  // Ghi âm bằng MediaRecorder cho các method dựa trên server
  const startRecording = async () => {
    if (sttMethod === "web-speech") {
      if (recognitionRef.current && !isRecording) {
        setIsRecording(true);
        recognitionRef.current.start();
      }
      return;
    }

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.start();
      setIsRecording(true);

      mediaRecorderRef.current.ondataavailable = async (e) => {
        const audioBlob = e.data; // Lấy trực tiếp từ event
        // Gửi audioBlob tới service
        try {
          setIsProcessing(true);
          const result = await getSTT(audioBlob, sttMethod);

          if (result.success) {
            setTranscript(result.transcript);
          } else {
            setError(result.error);
            setTranscript("Failed to process audio");
          }
        } catch (err) {
          logger.error("Speech to text error:", err);
          setError("Failed to process audio");
          setTranscript("");
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      };
    } catch (err) {
      logger.error("Recording error:", err);
      setError(`Could not access microphone: ${err.message}`);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (sttMethod === "web-speech") {
      if (recognitionRef.current && isRecording) {
        recognitionRef.current.stop();
        // Thay đổi nhỏ để kích hoạt useEffect trong InputArea
        setTranscript((prev) => prev + " "); // Thêm dấu chấm để kích hoạt việc cập nhật transcript
        setIsRecording(false);
        setIsProcessing(false);
      }
      return;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  return {
    transcript,
    setTranscript,
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording,
  };
};
