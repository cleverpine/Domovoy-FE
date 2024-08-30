import React, { useState, FormEvent } from 'react';
import { Box, Button, Typography, TextField, useTheme, createTheme, ThemeProvider, CssBaseline, Select, MenuItem, CircularProgress, SelectChangeEvent } from '@mui/material';
import { faSignInAlt, faSignOutAlt, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';
import { SELECTED_ROOM } from '../constants/login';
import { roomEmailToNumberMap } from '../mappers/roomMapper';

// Fetch token function
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
    const [isDarkMode, setIsDarkMode] = useState(false);

    const navigate = useNavigate();
    const theme = useTheme();

    const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            sessionStorage.setItem('username', username);
            sessionStorage.setItem('password', password);

            const token = await fetchTokenFromBE(username, password);

            if (token) {
                sessionStorage.setItem('token', token);
                navigate('/home'); // Redirect to home page upon successful login
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
        sessionStorage.setItem(SELECTED_ROOM, event.target.value);
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
                <Typography variant="h4" gutterBottom>Login</Typography>

                <Button
                    variant="outlined"
                    onClick={toggleDarkMode}
                    sx={{ mb: 2 }}
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
                        />
                        <Button
                            sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}
                            onClick={togglePasswordVisibility}
                        >
                            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                        </Button>
                    </Box>
                    <Button
                        type="submit"
                        variant="contained"
                        className="button"
                        disabled={loading}
                        sx={{ mt: 2 }}
                    >
                        {loading ? <CircularProgress size={24} /> : <FontAwesomeIcon icon={faSignInAlt} />}
                        Login
                    </Button>
                </form>

                {error && (
                    <Typography color="error" sx={{ mt: 2 }}>
                        {error}
                    </Typography>
                )}

                <Button
                    variant="contained"
                    className="button"
                    onClick={handleLogout}
                    sx={{ mt: 2 }}
                >
                    <FontAwesomeIcon icon={faSignOutAlt} /> Logout
                </Button>

                <Box className="select-input-wrapper" sx={{ mt: 2, width: '100%' }}>
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
                                color: theme => theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.text.secondary, // Text color adjusted based on the theme
                                bgcolor: theme => theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.background.default, // Background color
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme => theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.text.secondary, // Border color
                            },
                            '& .MuiMenuItem-root': {
                                color: theme => theme.palette.text.primary, // Menu item text color adjusted
                            },
                            '& .MuiSelect-icon': {
                                color: theme => theme.palette.text.primary, // Dropdown icon color
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
