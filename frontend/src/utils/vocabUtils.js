import axios from '../axiosInstance';

// Loại bỏ dấu câu ở đầu và cuối từ
export const cleanWord = (word) => {
    return word.replace(/^[^a-zA-Z']+|[^a-zA-Z']+$/g, '');
};

// Thêm từ vựng vào vocab
export const addToVocab = async ({word, definition, phonetic, audio, chatId, onVocabAdded}) => {
    try {
        await axios.post(
            `/vocab`,
            {word, definition, phonetic, audio, chat_id: chatId},
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        if (onVocabAdded && onVocabAdded.current) {
            onVocabAdded.current(); // Gọi hàm refresh từ RightSidebar
        }
    } catch (err) {
        if (err.response && err.response.status === 400) {
            throw new Error(err.response.data.detail);
        } else {
            throw new Error('Failed to add to vocab');
        }
    }
};
