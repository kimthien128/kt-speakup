//components/SiteConfig.jsx
import React, {useState, useEffect} from 'react';
import {fetchWordInfo} from '../services/dictionaryService';
import {useDictionary} from '../context/DictionaryContext';
import {translateText, translateMultipleTexts} from '../services/translateService';
import useTranslate from '../hooks/useTranslate';
import {logger} from '../utils/logger';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import CircularProgress from '@mui/material/CircularProgress';
import CircleIcon from '@mui/icons-material/Circle';

function VocabDetails({word}) {
    const {
        translatedText,
        loading: translateLoading,
        error: translateError,
        translateText: hookTranslateText,
    } = useTranslate();
    const {dictionarySource} = useDictionary();

    const [wordDetails, setWordDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [errorDetails, setErrorDetails] = useState(null);

    const [translations, setTranslations] = useState({
        definition: '',
        examples: [],
    });
    const [loadingTranslations, setLoadingTranslations] = useState({
        definition: false,
        examples: false,
    });
    const [errorTranslations, setErrorTranslations] = useState({
        definition: null,
        examples: null,
    });

    // Hàm lấy chi tiết từ vựng
    const fetchWordDetails = async (wordToFetch) => {
        setLoadingDetails(true);
        setWordDetails(null);
        setErrorDetails(null);

        try {
            const data = await fetchWordInfo(wordToFetch, dictionarySource, 2);
            setWordDetails(data);
            setErrorDetails(null);
        } catch (err) {
            logger.error(`Error fetching word details for ${wordToFetch}: ${err.message}`);
            setWordDetails({
                definition: 'Error fetching data',
                phonetic: 'N/A',
                audio: [],
                examples: [],
                pronunciations: [],
            });
            setErrorDetails('Failed to load word details');
        } finally {
            setLoadingDetails(false);
        }
    };

    // Hàm dịch toàn bộ nội dung
    const translateContent = async (type, content) => {
        if (!content || (Array.isArray(content) && content.length === 0)) {
            setTranslations((prev) => ({...prev, [type]: ''}));
            setErrorTranslations((prev) => ({...prev, [type]: null}));
            return;
        }

        setLoadingTranslations((prev) => ({...prev, [type]: true}));
        setErrorTranslations((prev) => ({...prev, [type]: null}));

        try {
            let translatedContent;

            if (type === 'examples') {
                translatedContent = await translateMultipleTexts(content);
            } else if (type === 'definition' && content === 'No definition found') {
                translatedContent = ''; // Không dịch nếu là "No definition found"
            } else {
                translatedContent = await hookTranslateText(content);
            }

            setTranslations((prev) => ({
                ...prev,
                [type]: translatedContent,
            }));
        } catch (err) {
            setErrorTranslations((prev) => ({
                ...prev,
                [type]: 'Failed to translate: ' + (err.response?.data?.detail || err.message),
            }));
            setTranslations((prev) => ({...prev, [type]: ''}));
        } finally {
            setLoadingTranslations((prev) => ({...prev, [type]: false}));
        }
    };

    // Lấy chi tiết từ vựng và dịch khi word thay đổi
    useEffect(() => {
        if (word) {
            fetchWordDetails(word);
        } else {
            setWordDetails(null);
            setTranslations({definition: '', examples: []});
            setErrorTranslations({definition: null, examples: null});
        }
    }, [word]);

    // Dịch nội dung khi wordDetails thay đổi
    useEffect(() => {
        if (wordDetails) {
            if (wordDetails.definition && wordDetails.definition !== 'No definition found') {
                translateContent('definition', wordDetails.definition);
            } else {
                setTranslations((prev) => ({...prev, definition: ''}));
                setErrorTranslations((prev) => ({...prev, definition: null}));
            }

            if (wordDetails.examples && wordDetails.examples.length > 0) {
                translateContent('examples', wordDetails.examples);
            } else {
                setTranslations((prev) => ({...prev, examples: []}));
                setErrorTranslations((prev) => ({...prev, examples: null}));
            }
        }
    }, [wordDetails]);

    if (loadingDetails) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                <CircularProgress />
            </Box>
        );
    }

    if (!wordDetails) return null;

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
            }}
        >
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                {/* Definition */}
                <Box>
                    <Typography variant="h6" sx={{fontWeight: 'medium', mb: 1}}>
                        Definition
                    </Typography>
                    <Typography variant="body2" sx={{ml: 2}}>
                        {wordDetails.definition || 'Not available'}
                    </Typography>

                    {/* Hiển thị phần dịch nghĩa nếu có */}
                    {loadingTranslations.definition ? (
                        <Typography variant="body2" sx={{ml: 2, fontSize: '.85rem', color: 'text.secondary'}}>
                            Translating...
                        </Typography>
                    ) : errorTranslations.definition ? (
                        <Typography variant="body2" sx={{ml: 2, fontSize: '.85rem', color: 'error.main'}}>
                            {errorTranslations.definition}
                        </Typography>
                    ) : (
                        translations.definition && (
                            <Typography variant="body2" sx={{ml: 2, fontSize: '.85rem', color: 'text.secondary'}}>
                                {translations.definition}
                            </Typography>
                        )
                    )}
                </Box>
                <Divider sx={{my: 1}} />

                {/* Phonetic */}
                <Box>
                    <Typography variant="h6" sx={{fontWeight: 'medium', mb: 1}}>
                        Phonetic
                    </Typography>
                    <Typography variant="body2" sx={{ml: 2}}>
                        {wordDetails.phonetic || 'Not available'}
                    </Typography>
                </Box>
                <Divider sx={{my: 1}} />

                {/* Audio */}
                {wordDetails.audio && wordDetails.audio.length > 0 && (
                    <>
                        <Box>
                            <Typography variant="h6" sx={{fontWeight: 'medium', mb: 1}}>
                                Audio
                            </Typography>
                            <Box
                                sx={{
                                    ml: 2,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1,
                                }}
                            >
                                {wordDetails.audio.map((audioUrl, index) => (
                                    <Box key={index} sx={{width: '100%', maxWidth: 300}}>
                                        <audio
                                            controls
                                            style={{
                                                width: '100%',
                                                height: '40px',
                                            }}
                                        >
                                            <source src={audioUrl} type="audio/mpeg" />
                                            Your browser does not support the audio element.
                                        </audio>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                        <Divider sx={{my: 1}} />
                    </>
                )}

                {/* Examples */}
                {wordDetails.examples && wordDetails.examples.length > 0 && (
                    <>
                        <Box>
                            <Typography variant="h6" sx={{fontWeight: 'medium', mb: 1}}>
                                Examples
                            </Typography>
                            <List dense sx={{ml: 2, py: 0}}>
                                {wordDetails.examples.map((example, index) => (
                                    <ListItem
                                        key={index}
                                        sx={{
                                            alignItems: 'flex-start',
                                            '&:not(:first-of-type)': {
                                                pt: '8px !important',
                                            },
                                        }}
                                    >
                                        <ListItemIcon sx={{minWidth: 24, pt: 0.5}}>
                                            <CircleIcon sx={{fontSize: 8}} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <>
                                                    <Typography component="span" variant="body2">
                                                        {example}
                                                    </Typography>
                                                    {loadingTranslations.examples ? (
                                                        <Typography
                                                            component="span"
                                                            variant="body2"
                                                            sx={{
                                                                fontSize: '.85rem',
                                                                color: 'text.secondary',
                                                            }}
                                                        >
                                                            Translating...
                                                        </Typography>
                                                    ) : errorTranslations.examples ? (
                                                        <Typography
                                                            component="span"
                                                            variant="body2"
                                                            sx={{
                                                                fontSize: '.85rem',
                                                                color: 'error.main',
                                                            }}
                                                        >
                                                            {errorTranslations.examples}
                                                        </Typography>
                                                    ) : (
                                                        translations.examples[index] && (
                                                            <Typography
                                                                component="span"
                                                                variant="body2"
                                                                sx={{
                                                                    fontSize: '.85rem',
                                                                    color: 'text.secondary',
                                                                }}
                                                            >
                                                                {translations.examples[index]}
                                                            </Typography>
                                                        )
                                                    )}
                                                </>
                                            }
                                            primaryTypographyProps={{variant: 'body2'}}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                        <Divider sx={{my: 1}} />
                    </>
                )}

                {/* Pronunciations */}
                {wordDetails.pronunciations && wordDetails.pronunciations.length > 0 && (
                    <>
                        <Box>
                            <Typography variant="h6" sx={{fontWeight: 'medium', mb: 1}}>
                                Pronunciations
                            </Typography>
                            <List dense sx={{ml: 2, py: 0}}>
                                {wordDetails.pronunciations.map((pron, index) => (
                                    <ListItem key={index} sx={{py: 0.5}}>
                                        <ListItemIcon sx={{minWidth: 24}}>
                                            <CircleIcon sx={{fontSize: 8}} />
                                        </ListItemIcon>
                                        <ListItemText primary={pron} primaryTypographyProps={{variant: 'body2'}} />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
}
export default VocabDetails;
