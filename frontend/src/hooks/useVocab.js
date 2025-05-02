// src/hooks/useVocab.js

import {useState, useEffect, useCallback} from 'react';
import {vocabService} from '../services/vocabService';

export const useVocab = (chatId, onVocabAdded) => {
    const [vocabList, setVocabList] = useState([]);
    const [selectedWord, setSelectedWord] = useState(null);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [error, setError] = useState(null);

    // Hàm fetch danh sách từ vựng
    const fetchVocab = useCallback(async () => {
        try {
            const vocab = await vocabService.fetchVocab(chatId);
            setVocabList(vocab);
            setError(null);
        } catch (err) {
            setVocabList([]);
            setError('Failed to load vocabulary list');
        }
    }, [chatId]);

    // Fetch từ vựng khi chatId thay đổi
    useEffect(() => {
        fetchVocab();
        setSelectedWord(null);
    }, [chatId, fetchVocab]);

    // Truyền hàm fetchVocab ra ngoài qua onVocabAdded
    useEffect(() => {
        if (onVocabAdded) {
            onVocabAdded.current = fetchVocab;
        }
    }, [fetchVocab, onVocabAdded]);

    // Hàm xóa từ vựng
    const deleteVocab = async (vocabId, word) => {
        try {
            await vocabService.deleteVocab(chatId, vocabId);
            await fetchVocab();
            if (selectedWord === word) {
                setSelectedWord(null);
                setWordDetails(null);
            }
            setError(null);
        } catch (err) {
            setError('Failed to delete vocabulary');
        }
    };

    return {
        vocabList,
        selectedWord,
        setSelectedWord,
        isDeleteMode,
        setIsDeleteMode,
        error,
        fetchVocab,
        deleteVocab,
    };
};
