// src/hooks/useVocab.js
// hook để quản lý danh sách từ vựng, tìm kiếm, và chi tiết từ vựng. Hook này sẽ gọi vocabService và fetchWordInfo

import {useState, useEffect, useCallback} from 'react';
import {fetchWordInfo} from '../services/dictionaryService';
import {vocabService} from '../services/vocabService';
import {logger} from '../utils/logger';

export const useVocab = (chatId, onVocabAdded) => {
    const [vocabList, setVocabList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedWord, setSelectedWord] = useState(null);
    const [wordDetails, setWordDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
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
        setWordDetails(null);
        setSelectedWord(null);
    }, [chatId, fetchVocab]);

    // Truyền hàm fetchVocab ra ngoài qua onVocabAdded
    useEffect(() => {
        if (onVocabAdded) {
            onVocabAdded.current = fetchVocab;
        }
    }, [fetchVocab, onVocabAdded]);

    // Hàm lấy chi tiết từ vựng
    const fetchWordDetails = async (word) => {
        setSelectedWord(word);
        setLoadingDetails(true);
        setWordDetails(null);

        try {
            const data = await fetchWordInfo(word, 'wordnik', 2);
            setWordDetails(data);
            setError(null);
        } catch (err) {
            logger.error(`Error fetching word details for ${word}: ${err.message}`);
            setWordDetails({
                definition: 'Error fetching data',
                phonetic: 'N/A',
                audio: [],
                examples: [],
                pronunciations: [],
                topExample: '',
            });
            setError('Failed to load word details');
        } finally {
            setLoadingDetails(false);
        }
    };

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

    // Lọc từ vựng dựa trên searchTerm
    const filteredVocab = vocabList.filter((vocab) => vocab.word.toLowerCase().includes(searchTerm.toLowerCase()));

    return {
        vocabList,
        searchTerm,
        setSearchTerm,
        selectedWord,
        wordDetails,
        loadingDetails,
        isDeleteMode,
        setIsDeleteMode,
        error,
        fetchVocab,
        fetchWordDetails,
        deleteVocab,
        filteredVocab,
    };
};
