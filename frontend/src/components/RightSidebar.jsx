import React, {useState, useEffect} from 'react';
import {Link as RouterLink} from 'react-router-dom';

import {
    Box,
    Typography,
    Button,
    Avatar,
    Chip,
    Divider,
    TextField,
    Menu,
    MenuItem,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemText,
    Tooltip,
} from '@mui/material';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SearchIcon from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';

import useSiteConfig from '../hooks/useSiteConfig';
import ConfirmDialog from './ConfirmDialog';
import useConfirmDialog from '../hooks/useConfirmDialog';
import useUserInfo from '../hooks/useUserInfo';
import {getAvatarInitial} from '../utils/avatarUtils';
import {fetchWordInfo} from '../services/dictionaryService';
import axios from '../axiosInstance';

function RightSidebar({userEmail, onLogout, chatId, onVocabAdded}) {
    const [vocabList, setVocabList] = useState([]); //state cho danh sách từ vựng
    const [searchTerm, setSearchTerm] = useState(''); //state cho từ khóa tìm kiếm vocab
    const [anchorEl, setAnchorEl] = useState(null); //state cho menu user
    const {userInfo, loading: userLoading, error: userError} = useUserInfo(userEmail); // Hook lấy thông tin user
    const {dialog, showDialog, hideDialog} = useConfirmDialog(); // Hook sử dụng ConfirmDialog
    const {config, loading: configLoading, error: configError} = useSiteConfig();

    // state xử lý từ vựng
    const [selectedWord, setSelectedWord] = useState(null);
    const [wordDetails, setWordDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [isDeleteMode, setIsDeleteMode] = useState(false); // state cho chế độ xóa từ vựng

    // Hàm mở và đóng Menu
    const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const handleLogoutClick = () => {
        showDialog({
            title: 'Confirm Logout',
            content: 'Are you sure want to logout?',
            onConfirm: () => {
                onLogout();
                hideDialog();
            },
            confirmText: 'Logout',
            confirmColor: 'primary',
        });
    };

    // Hàm fetch từ vựng
    const fetchVocab = async () => {
        // Bỏ qua nếu chatId không hợp lệ
        if (!chatId || chatId === 'null' || chatId === 'undefined') {
            setVocabList([]);
            return;
        }

        try {
            const res = await axios.get(`/vocab/${chatId}`);
            setVocabList(res.data.vocab || []);
        } catch (err) {
            console.error('Error fetching vocab list:', err.response?.data || err.message);
            setVocabList([]); // Đặt rỗng nếu lỗi
        }
    };

    // Hàm toggle chế độ xóa
    const toggleDeleteMode = () => {
        setIsDeleteMode((prev) => !prev);
    };

    // Fetch từ vựng khi chatId thay đổi
    useEffect(() => {
        fetchVocab();
    }, [chatId]);

    // Hàm để parent gọi khi cần refresh
    useEffect(() => {
        if (onVocabAdded) {
            onVocabAdded.current = fetchVocab; // Truyền hàm refresh ra ngoài
        }
    }, [onVocabAdded, chatId]); // Chạy lại khi chatId thay đổi

    // Hàm gọi API Wordnik khi click vào chip
    const handleChipClick = async (word) => {
        setSelectedWord(word);
        setLoadingDetails(true);
        setWordDetails(null); // Reset wordDetails trước khi gọi API
        try {
            const data = await fetchWordInfo(word, 'wordnik', 2); // Gọi API Wordnik
            setWordDetails(data);
        } catch (err) {
            console.error('Error fetching word details from Wordnik:', err);
            setWordDetails({
                definition: 'Error fetching data',
                phonetic: 'N/A',
                audio: '',
                etymologies: [],
                examples: [],
                frequency: 0,
                hyphenation: [],
                phrases: [],
                pronunciations: [],
                relatedWords: [],
                scrabbleScore: 0,
                topExample: '',
            });
        } finally {
            setLoadingDetails(false);
        }
    };

    // Hàm lọc từ vựng dựa trên từ khóa tìm kiếm
    const filteredVocab = vocabList.filter((vocab) => vocab.word.toLowerCase().includes(searchTerm.toLowerCase()));

    // Xóa từ vựng
    const handleDeleteVocab = (vocabId, word) => {
        showDialog({
            title: 'Delete Vocabulary',
            content: `Are you sure to delete "${word}"?`,
            onConfirm: () => {
                deleteVocab();
                hideDialog();
            },
            confirmText: 'Delete',
            confirmColor: 'error',
        });

        const deleteVocab = async () => {
            try {
                // Gọi API xóa
                await axios.delete(`/vocab/${chatId}/${vocabId}`);
                // Cập nhật danh sách từ vựng sau khi xóa
                await fetchVocab();
                // Nếu từ đang được chọn bị xóa, reset chi tiết từ vựng
                if (selectedWord === word) {
                    setSelectedWord(null);
                    setWordDetails(null);
                }
            } catch (err) {
                console.error('Error deleting vocab:', err.response?.data || err.message);
                hideDialog();
            }
        };
    };

    // Xử lý config, đặt trước return
    if (configLoading) {
        return <CircularProgress />;
    }
    if (configError) {
        return <Alert severity="error">{configError}</Alert>;
    }

    // Xử lý userInfo
    if (userLoading) return <CircularProgress />;
    if (userError) return <Alert severity="error">{userError}</Alert>;

    return (
        <Box
            sx={{
                width: 300,
                height: '100%',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                borderLeft: '1px solid',
                borderColor: 'divider',
            }}
        >
            {/* Phần 1: Thông tin user + Account Menu */}
            {userEmail && userInfo && (
                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-around', mb: 2}}>
                    {/* Link: Admin thì hiện link quản lý, user thì hiện Welcome + displayName */}
                    {userInfo.isAdmin ? (
                        <Button
                            component={RouterLink}
                            to="/admin"
                            startIcon={<AdminPanelSettingsIcon />}
                            color="primary"
                            sx={{
                                textTransform: 'none',
                                fontSize: '1rem',
                            }}
                        >
                            Admin Panel
                        </Button>
                    ) : (
                        <Typography
                            variant="body1"
                            sx={{
                                overflow: 'hidden', //Giới hạn title
                                textOverflow: 'ellipsis', //Thêm dấu ...
                                whiteSpace: 'nowrap', //Không ngắt dòng
                                '& > span': {
                                    fontWeight: 'bold',
                                    color: 'primary.main',
                                },
                            }}
                        >
                            Welcome <span>{userInfo.displayName || userEmail}</span>
                        </Typography>
                    )}

                    {/* Account Menu */}
                    <IconButton onClick={handleMenuOpen}>
                        <Avatar src={userInfo.avatarPath} sx={{bgcolor: 'primary.main'}}>
                            {/* Hiển thị chữ cái đầu nếu không có avatarPath */}
                            {!userInfo.avatarPath && getAvatarInitial(userInfo)}
                        </Avatar>
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                        transformOrigin={{vertical: 'top', horizontal: 'right'}}
                        PaperProps={{
                            sx: {
                                mt: 1,
                                borderRadius: 4,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                minWidth: 180,
                                bgcolor: 'background.paper',
                            },
                        }}
                    >
                        <MenuItem
                            component={RouterLink}
                            to="/profile"
                            onClick={handleMenuClose}
                            sx={{
                                py: 1,
                                px: 2,
                                fontSize: '1rem',
                                color: 'grey.800',
                                '&:hover': {
                                    bgcolor: 'primary.light', // Hiệu ứng hover
                                    color: 'primary.contrastText', // Màu chữ khi hover
                                },
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <AccountCircleIcon />
                            Profile
                        </MenuItem>
                        <Divider sx={{my: 0.5}} />
                        <MenuItem
                            onClick={handleLogoutClick}
                            sx={{
                                py: 1,
                                px: 2,
                                fontSize: '1rem',
                                color: 'grey.800',
                                '&:hover': {
                                    bgcolor: 'primary.light',
                                    color: 'primary.contrastText',
                                },
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <LogoutIcon />
                            Logout
                        </MenuItem>
                    </Menu>
                </Box>
            )}

            {/* Phần 2: Danh sách từ vựng (Chip) */}

            <Box
                sx={{
                    maxHeight: '50%',
                    minHeight: 100,
                    overflowY: 'auto',
                    mb: 2,
                    textAlign: 'center',
                    flexShrink: 0,
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
                        <TextField
                            label="Search vocabulary"
                            variant="outlined"
                            size="small"
                            fullWidth
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            error={searchTerm && filteredVocab.length === 0}
                            helperText={searchTerm && filteredVocab.length === 0 ? 'No matches found' : ''}
                            sx={{my: 1}}
                        />
                        <Tooltip title={isDeleteMode ? 'Exit delete mode' : 'Delete vocabulary'}>
                            <IconButton onClick={toggleDeleteMode} sx={{ml: 1}}>
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
                                onClick={() => handleChipClick(vocab.word)}
                                onDelete={isDeleteMode ? () => handleDeleteVocab(vocab._id, vocab.word) : undefined}
                                sx={{
                                    bgcolor: selectedWord === vocab.word ? 'primary.light' : 'primary.light',
                                    color: 'white',
                                    '&:hover': {bgcolor: 'primary.main'},
                                }}
                            />
                        ))}
                    </Box>
                ) : chatId && chatId !== 'null' && chatId !== 'undefined' ? (
                    <>
                        <img
                            src={config?.saveWordImage || null}
                            alt="KT SpeakUp Logo"
                            style={{width: '120px', objectFit: 'cover', objectPosition: 'center'}}
                        />
                        <Typography variant="body1">
                            {vocabList.length === 0 ? 'Save your first word !!' : ''}
                        </Typography>
                    </>
                ) : (
                    <></>
                )}
            </Box>

            {/* Phần 3: Chi tiết từ vựng */}
            {vocabList.length > 0 && (
                <>
                    <Box sx={{flexGrow: 1, overflow: 'hidden', borderRadius: 1}}>
                        <Box sx={{overflowY: 'auto', height: '100%'}}>
                            {loadingDetails ? (
                                <CircularProgress />
                            ) : (
                                wordDetails && (
                                    <>
                                        <Accordion>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                <Typography>Definition</Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Typography>{wordDetails.definition || 'Not available'}</Typography>
                                            </AccordionDetails>
                                        </Accordion>

                                        <Accordion>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                <Typography>Phonetic</Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Typography>{wordDetails.phonetic || 'Not available'}</Typography>
                                            </AccordionDetails>
                                        </Accordion>

                                        {wordDetails.audio && wordDetails.audio.length > 0 && (
                                            <Accordion>
                                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                    <Typography>Audio</Typography>
                                                </AccordionSummary>
                                                <AccordionDetails>
                                                    {wordDetails.audio.map((audioUrl, index) => (
                                                        <Box key={index}>
                                                            <audio controls>
                                                                <source src={audioUrl} type="audio/mpeg" />
                                                                Your browser does not support the audio element.
                                                            </audio>
                                                        </Box>
                                                    ))}
                                                </AccordionDetails>
                                            </Accordion>
                                        )}

                                        {wordDetails.examples && wordDetails.examples.length > 0 && (
                                            <Accordion>
                                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                    <Typography>Examples</Typography>
                                                </AccordionSummary>
                                                <AccordionDetails>
                                                    <List>
                                                        {wordDetails.examples.map((example, index) => (
                                                            <ListItem key={index}>
                                                                <ListItemText primary={example} />
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                </AccordionDetails>
                                            </Accordion>
                                        )}

                                        {wordDetails.hyphenation && wordDetails.hyphenation.length > 0 && (
                                            <Accordion>
                                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                    <Typography>Hyphenation</Typography>
                                                </AccordionSummary>
                                                <AccordionDetails>
                                                    <List>
                                                        {wordDetails.hyphenation.map((part, index) => (
                                                            <ListItem key={index}>
                                                                <ListItemText primary={part} />
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                </AccordionDetails>
                                            </Accordion>
                                        )}

                                        {wordDetails.phrases && wordDetails.phrases.length > 0 && (
                                            <Accordion>
                                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                    <Typography>Phrases</Typography>
                                                </AccordionSummary>
                                                <AccordionDetails>
                                                    <List>
                                                        {wordDetails.phrases.map((phrase, index) => (
                                                            <ListItem key={index}>
                                                                <ListItemText primary={phrase} />
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                </AccordionDetails>
                                            </Accordion>
                                        )}

                                        {wordDetails.pronunciations && wordDetails.pronunciations.length > 0 && (
                                            <Accordion>
                                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                    <Typography>Pronunciations</Typography>
                                                </AccordionSummary>
                                                <AccordionDetails>
                                                    <List>
                                                        {wordDetails.pronunciations.map((pron, index) => (
                                                            <ListItem key={index}>
                                                                <ListItemText primary={pron} />
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                </AccordionDetails>
                                            </Accordion>
                                        )}

                                        {wordDetails.relatedWords && wordDetails.relatedWords.length > 0 && (
                                            <Accordion>
                                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                    <Typography>Related Words</Typography>
                                                </AccordionSummary>
                                                <AccordionDetails>
                                                    <List>
                                                        {wordDetails.relatedWords.map((group, groupIndex) => (
                                                            <Box key={groupIndex} sx={{mb: 2}}>
                                                                <Typography
                                                                    variant="subtitle1"
                                                                    sx={{
                                                                        fontWeight: 'bold',
                                                                        textTransform: 'capitalize',
                                                                    }}
                                                                >
                                                                    {group.relationshipType}
                                                                </Typography>
                                                                {group.words.map((word, wordIndex) => (
                                                                    <ListItem key={`${groupIndex}-${wordIndex}`}>
                                                                        <ListItemText primary={word} />
                                                                    </ListItem>
                                                                ))}
                                                            </Box>
                                                        ))}
                                                    </List>
                                                </AccordionDetails>
                                            </Accordion>
                                        )}

                                        {wordDetails.topExample && (
                                            <Accordion>
                                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                    <Typography>Top Example</Typography>
                                                </AccordionSummary>
                                                <AccordionDetails>
                                                    <Typography>{wordDetails.topExample}</Typography>
                                                </AccordionDetails>
                                            </Accordion>
                                        )}
                                    </>
                                )
                            )}
                        </Box>
                    </Box>
                </>
            )}

            {/* Hiển thị ConfirmDialog */}
            <ConfirmDialog
                open={dialog.open}
                title={dialog.title}
                content={dialog.content}
                onConfirm={dialog.onConfirm}
                onCancel={hideDialog}
                confirmText={dialog.confirmText}
                confirmColor={dialog.confirmColor}
            />
        </Box>
    );
}

export default RightSidebar;
