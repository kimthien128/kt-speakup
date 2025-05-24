import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import UserManagement from './UserManagement';
import SiteConfig from './SiteConfig';
import {getConfig} from '../services/configService';

import {Box, Typography, Button, Tabs, Tab, useMediaQuery} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';

// Component TabPanel để hiển thị nội dung của tab
function TabPanel(props) {
    const {children, value, index, ...other} = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{p: 3}}>{children}</Box>}
        </div>
    );
}

function AdminPanel() {
    const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));
    const [config, setConfig] = useState(null);
    const [tabValue, setTabValue] = useState(0); // Giá trị của tab hiện tại
    const navigate = useNavigate();

    // Fetch config khi component mount
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const configData = await getConfig();
                setConfig(configData);
            } catch (err) {
                if (err.response?.status === 403) {
                    navigate('/profile');
                }
            }
        };
        fetchConfig();
    }, [navigate]);

    // Xử lý chuyển tab
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <Box
            sx={{
                p: {xs: 0, md: 4},
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: {xs: 'column', md: 'column'},
                    width: '100%',
                }}
            >
                {/* Nút back và tiêu đề Admin Panel */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        textAlign: 'center',
                        my: {xs: 2, md: 4},
                        px: {xs: 4, md: 0},
                        position: 'relative',
                        flexShrink: 0, // Đảm bảo phần này không bị co lại
                    }}
                >
                    {/* Back Button */}
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => navigate('/')}
                        startIcon={<ArrowBackIcon />}
                        sx={{
                            textTransform: 'none',
                            fontSize: {xs: '0.875rem', md: '1rem'},
                            borderRadius: 1,
                            position: 'absolute',
                        }}
                    >
                        {isMobile ? 'Back' : 'Back to Chat'}
                    </Button>

                    <Typography
                        variant="h4"
                        sx={{
                            flexGrow: 1,
                            fontSize: {xs: '1.8rem', md: '2.125rem'},
                            textAlign: {xs: 'right', md: 'center'},
                        }}
                    >
                        Admin Panel
                    </Typography>
                </Box>

                <Box
                    sx={{
                        pr: 0,
                        borderRadius: {xs: 0, md: 5},
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        bgcolor: 'rgba(255,255,255,0.9)',
                        display: 'flex',
                        flexGrow: 1,
                        overflow: 'hidden',
                        flexDirection: {xs: 'column', md: 'row'},
                    }}
                >
                    {/* Cấu hình Tabs */}

                    {/* Tabs cho desktop (md trở lên) */}
                    <Box
                        sx={{
                            display: {xs: 'none', md: 'block'},
                            borderRight: 1,
                            borderColor: 'divider',
                            minWidth: 180,
                            pt: 2,
                        }}
                    >
                        <Tabs orientation="vertical" value={tabValue} onChange={handleTabChange}>
                            <Tab
                                label="Site Config"
                                icon={<SettingsIcon />}
                                iconPosition="top"
                                sx={{
                                    justifyContent: 'flex-start',
                                }}
                            />
                            <Tab
                                label="User Management"
                                icon={<ManageAccountsIcon />}
                                iconPosition="top"
                                sx={{
                                    justifyContent: 'flex-start',
                                }}
                            />
                        </Tabs>
                    </Box>

                    {/* Tabs cho mobile (xs) */}
                    <Box
                        sx={{
                            display: {xs: 'block', md: 'none'},
                            minWidth: 180,
                            pt: 2,
                        }}
                    >
                        <Tabs
                            orientation="horizontal"
                            variant="scrollable"
                            scrollButtons="auto"
                            allowScrollButtonsMobile
                            value={tabValue}
                            onChange={handleTabChange}
                            sx={{
                                borderBottom: 1,
                                borderColor: 'divider',
                                '& .MuiTabs-flexContainer': {
                                    justifyContent: 'space-around', // Căn giữa các tab
                                },
                                '& .MuiTab-root': {
                                    minWidth: 'unset',
                                    width: 'auto',
                                    textAlign: 'center',
                                },
                            }}
                        >
                            <Tab
                                label="Site Config"
                                icon={<SettingsIcon />}
                                iconPosition="top"
                                sx={{
                                    justifyContent: 'flex-start',
                                }}
                            />
                            <Tab
                                label="User Management"
                                icon={<ManageAccountsIcon />}
                                iconPosition="top"
                                sx={{
                                    justifyContent: 'flex-start',
                                }}
                            />
                        </Tabs>
                    </Box>

                    <Box
                        sx={{
                            flexGrow: 1,
                            overflowY: 'auto',
                        }}
                    >
                        {/* Tab 1: Site config */}
                        <TabPanel value={tabValue} index={0}>
                            <SiteConfig config={config} setConfig={setConfig} />
                        </TabPanel>

                        {/* Tab 2: User Management */}
                        <TabPanel value={tabValue} index={1}>
                            <UserManagement />
                        </TabPanel>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

export default AdminPanel;
