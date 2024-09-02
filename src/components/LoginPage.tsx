import React, { useState, FormEvent } from 'react';
import { Box, Button, Typography, TextField, useTheme, createTheme, ThemeProvider, CssBaseline, Select, MenuItem, CircularProgress, SelectChangeEvent } from '@mui/material';
import { faSignInAlt, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';
import { SELECTED_ROOM } from '../constants/login';
import { roomEmailToNumberMap } from '../mappers/roomMapper';
import pineImg from './pineImg.png'; 

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

const fadeInUp = {
    animation: 'fadeInUp 1s ease-out',
    '@keyframes fadeInUp': {
        from: {
            opacity: 0,
            transform: 'translateY(20px)',
        },
        to: {
            opacity: 1,
            transform: 'translateY(0)',
        },
    },
};

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
                console.log(localStorage);
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

    const handleLogout = () => {
        sessionStorage.removeItem(SELECTED_ROOM);
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('password');
        sessionStorage.removeItem('token');
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
            <Box className="login-container" sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography 
                    variant="h4" 
                    gutterBottom 
                    sx={fadeInUp}>
                    <span style={{ color: 'green', fontWeight: 'bold' }}>Clever</span>
                    <span style={{ fontWeight: 'bold' }}>Pine Room Reservations</span>
                    <img src={pineImg} alt="Pine" style={{ marginLeft: '10px', height: '45px', animation: 'fadeIn 2s', marginTop: '0px' }} />
                    </Typography>
                <Button
                    variant="outlined"
                    onClick={toggleDarkMode}
                    sx={{ mb: 2, transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' } }}
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
                        sx={{ animation: 'slideIn 1s' }}
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
                            sx={{ animation: 'slideIn 1s' }}
                        />
                        <Button
                            sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' } }}
                            onClick={togglePasswordVisibility}
                        >
                            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                        </Button>
                    </Box>
                    <Button
                        type="submit"
                        variant="contained"
                        className="button"
                        disabled={loading || !selectedOption}
                        sx={{ mt: 2, animation: 'slideIn 1s' }}
                    >
                        {loading ? <CircularProgress size={24} /> : <FontAwesomeIcon icon={faSignInAlt} />}
                        Login
                    </Button>
                </form>

                {error && (
                    <Typography color="error" sx={{ mt: 2, animation: 'fadeIn 1s' }}>
                        {error}
                    </Typography>
                )}

                <Box className="select-input-wrapper" sx={{ mt: 2, width: '100%', animation: 'fadeInUp 1s' }}>
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
