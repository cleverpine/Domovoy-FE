import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Box, Button, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField, Typography } from '@mui/material';

import { toast, ToastContainer } from 'react-toastify';

import pineImg from '../assets/images/logo-green.png';
import { SELECTED_ROOM } from '../constants/login';
import { roomEmailToNumberMap } from '../mappers/roomMapper';

export const LoginPage = () => {
    const [selectedOption, setSelectedOption] = useState('');

    const navigate = useNavigate();

    const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedOption) {
            return;
        }

        sessionStorage.setItem(SELECTED_ROOM, selectedOption);

        const formData = new FormData(event.currentTarget);
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;

        const token = await fetchTokenFromBE(username, password);

        if (token) {
            sessionStorage.setItem('token', token);
            navigate('/home');
        }
    };

    const fetchTokenFromBE = async (username: string, password: string) => {
        try {
            const response = await fetch('http://127.0.0.1:4000/fetch-token', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            if (response.status === 401) {
                toast.error('Failed to login. Please try again!');
                return;
            }

            const responseBody = await response.json();
            return responseBody.token;
        } catch (e) {
            toast.error('Something went wrong');
        }
    };

    const handleSelectRoomChange = (event: SelectChangeEvent<string>) => {
        setSelectedOption(event.target.value);
    };

    return (
        <div>
            <Box className="login-container">
                <img src={pineImg} alt="Pine" width="100px" />
                <Typography
                    variant="h4"
                    gutterBottom
                    className="title"
                >
                    CleverPine Rooms
                </Typography>

                <form onSubmit={handleLogin} className="login-form">
                    <TextField
                        label="Email"
                        variant="outlined"
                        name="username"
                        margin="normal"
                        fullWidth
                        className="typingInput"
                        sx={{ m: 0 }}
                        autoComplete="off"
                        required
                    />
                    <TextField
                        label="Password"
                        type='password'
                        variant="outlined"
                        name="password"
                        margin="normal"
                        fullWidth
                        className="typingInput"
                        sx={{ m: 0 }}
                        autoComplete="off"
                        required
                    />

                    <FormControl required fullWidth variant="outlined" sx={{ m: 0 }}>
                        <InputLabel>Select Room</InputLabel>
                        <Select
                            value={selectedOption}
                            label="Select Room"
                            onChange={handleSelectRoomChange}
                        >
                            {Object.entries(roomEmailToNumberMap).map(([email, number]) => (
                                <MenuItem key={email} value={email}>
                                    Room {number}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        type="submit"
                        variant="contained"
                        className={selectedOption ? "enabled-save login-button" : "login-button"}
                        disabled={!selectedOption}
                    >
                        Login
                    </Button>
                </form>
            </Box>
            <ToastContainer />
        </div >
    );
};
