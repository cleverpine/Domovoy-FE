import React, { useState, FormEvent, useEffect } from 'react';
import { Box, Button, Typography, TextField, useTheme, createTheme, ThemeProvider, CssBaseline, Select, MenuItem, CircularProgress, SelectChangeEvent } from '@mui/material';
import { faSignInAlt, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';
import { SELECTED_ROOM } from '../constants/login';
import { roomEmailToNumberMap } from '../mappers/roomMapper';
import pineImg from './pineImg.png';
import './LoginPage.css';

const fetchTokenFromBE = async (username2: string, password2: string) => {
    try {
        const response = await fetch('http://127.0.0.1:4000/fetch-token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: username2, password: password2 })
        });

        const responseBody = await response.json();
        if (responseBody.message === "supperman") {
            return null;
        }
    
        return responseBody.token;
    } catch (e) {
        console.error("Error fetching token:", e);
        throw e;
    }
};

// Theme configuration
const lightTheme = createTheme({
    palette: {
        mode: 'light',
    },
});

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

export const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [selectedOption, setSelectedOption] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);

    const navigate = useNavigate();
    const theme = useTheme();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        if (!selectedOption) {
            setError('Please select a room.');
            setLoading(false);
            return;
        }

        try {
            sessionStorage.setItem('username', username);
            sessionStorage.setItem('password', password);
            sessionStorage.setItem(SELECTED_ROOM, selectedOption);

            const token = await fetchTokenFromBE(username, password);

            if (token) {
                localStorage.setItem('token', token);
                navigate('/home');
            } else {
                setError('Invalid credentials');
            }

            setUsername('');
            setPassword('');
        } catch (e) {
            console.error(e);
            setError("Failed to log in");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (event: SelectChangeEvent<string>) => {
        setSelectedOption(event.target.value);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
    };

    return (
        <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
            <CssBaseline />
            <Box className="login-container fadeInUp" sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography 
                    variant="h4" 
                    gutterBottom 
                    className="slideIn"
                >
                    <span style={{ color: 'green', fontWeight: 'bold' }}>Clever</span>
                    <span style={{ fontWeight: 'bold' }}>Pine Room Reservations</span>
                    <img src={pineImg} alt="Pine" className="rotateZoomFade" style={{ marginLeft: '10px', height: '45px', marginTop: '0px' }} />
                </Typography>
                <Button
                    variant="outlined"
                    onClick={toggleDarkMode}
                    sx={{ mb: 2, transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.1)' } }}
                    className="pulseGlow"
                >
                    {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                </Button>

                <form onSubmit={handleLogin} style={{ width: '100%' }}>
                    <TextField
                        label="Username"
                        variant="outlined"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        margin="normal"
                        fullWidth
                        className="typingInput slideIn"
                    />
                    <Box sx={{ position: 'relative' }}>
                        <TextField
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            variant="outlined"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            fullWidth
                            className="typingInput slideIn"
                        />
                        <Button
                            sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.1)' } }}
                            onClick={togglePasswordVisibility}
                        >
                            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                        </Button>
                    </Box>
                    <Button
                        type="submit"
                        variant="contained"
                        className="button slideIn"
                        disabled={loading || !selectedOption}
                    >
                        {loading ? <CircularProgress size={24} /> : <FontAwesomeIcon icon={faSignInAlt} />}
                        Login
                    </Button>
                </form>

                {error && (
                    <Typography color="error" className="fadeInUp">
                        {error}
                    </Typography>
                )}

                <Box className="select-input-wrapper fadeInUp" sx={{ mt: 2, width: '100%' }}>
                    <Select
                        value={selectedOption}
                        onChange={handleChange}
                        fullWidth
                        displayEmpty
                        renderValue={(selected) => selected ? `Room ${roomEmailToNumberMap[selected as string]}` : 'Select Room'}
                        sx={{
                            transition: 'all 0.3s ease-in-out',
                            '& .MuiSelect-select': {
                                display: 'flex',
                                alignItems: 'center',
                                color: theme => theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.text.secondary,
                                bgcolor: theme => theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.background.default,
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme => theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.text.secondary,
                            },
                            '& .MuiMenuItem-root': {
                                color: theme => theme.palette.text.primary,
                            },
                            '& .MuiSelect-icon': {
                                color: theme => theme.palette.text.primary,
                            }
                        }}
                    >
                        <MenuItem value="" disabled>Select Room</MenuItem>
                        {Object.entries(roomEmailToNumberMap).map(([email, number]) => (
                            <MenuItem key={email} value={email}>
                                Room {number}
                            </MenuItem>
                        ))}
                    </Select>
                </Box>
            </Box>
        </ThemeProvider>
    );
};
