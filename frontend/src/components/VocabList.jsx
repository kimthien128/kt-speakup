//components/SiteConfig.jsx
import React, {useState} from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';

function VocabList({
    vocabList,
    selectedWord,
    onWordSelect,
    onDeleteVocab,
    config,
    chatId,
    isDeleteMode,
    setIsDeleteMode,
}) {
    const [searchTerm, setSearchTerm] = useState('');

    // Lọc từ vựng dựa trên searchTerm
    const filteredVocab = vocabList.filter((vocab) => vocab.word.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <Box
            sx={{
                maxHeight: selectedWord ? '37%' : '100%',
                overflowY: 'auto',
                textAlign: 'center',
                flexShrink: 0,
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.1)', // Màu thứ 2 là màu khi hover
            }}
        >
            {vocabList.length > 0 && (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                    }}
                >
                    <Tooltip title="Search Vocabulary" placement="bottom">
                        <FormControl sx={{flexGrow: 1, mr: 1}} variant="outlined">
                            <OutlinedInput
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search vocabulary"
                                size="small"
                                startAdornment={
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                }
                            />
                        </FormControl>
                    </Tooltip>
                    <Tooltip title={isDeleteMode ? 'Exit delete mode' : 'Delete vocabulary'}>
                        <IconButton onClick={() => setIsDeleteMode(!isDeleteMode)} sx={{ml: 1}}>
                            {isDeleteMode ? <CancelIcon color="error" /> : <DeleteIcon />}
                        </IconButton>
                    </Tooltip>
                </Box>
            )}
            {filteredVocab.length > 0 ? (
                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1}}>
                    {filteredVocab.map((vocab) => (
                        <Chip
                            key={vocab._id}
                            label={vocab.word}
                            onClick={() => onWordSelect(vocab.word)}
                            onDelete={isDeleteMode ? () => onDeleteVocab(vocab._id, vocab.word) : undefined}
                            sx={{
                                bgcolor: selectedWord === vocab.word ? 'primary.dark' : 'primary.light',
                                color: 'white',
                                '&:hover': {bgcolor: 'primary.main'},
                            }}
                        />
                    ))}
                </Box>
            ) : chatId && chatId !== 'null' && chatId !== 'undefined' ? (
                vocabList.length === 0 && (
                    <>
                        <img
                            src={config?.saveWordImage || '/images/default-save-word.png'}
                            alt="KT SpeakUp Logo"
                            style={{width: '70px', objectFit: 'cover', objectPosition: 'center'}}
                        />
                        <Typography variant="body1">Save your first word !!</Typography>
                    </>
                )
            ) : (
                <></>
            )}
        </Box>
    );
}
export default VocabList;
