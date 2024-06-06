import { useMsal } from '@azure/msal-react';
import { faSignInAlt, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from "react";

import { Box, Button, Typography } from '@mui/material';


import { loginRequest } from "../config/authConfig";
import { DEFAULT_SELECTED_ROOM, SELECTED_ROOM } from "../constants/login";
import { roomEmailToNumberMap } from "../mappers/roomMapper";

export const LoginPage = () => {
  const { instance, inProgress } = useMsal();
  const [selectedOption, setSelectedOption] = useState('');

  useEffect(() => {
    if (sessionStorage.getItem(SELECTED_ROOM) === null) {
      sessionStorage.setItem(SELECTED_ROOM, DEFAULT_SELECTED_ROOM);
    }
  }, []);

  const handleLogin = () => {
    if (inProgress === "none") {
      instance.loginRedirect(loginRequest).catch(e => {
        console.error(e);
      });
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SELECTED_ROOM);
    instance.logoutRedirect().catch(e => {
      console.error(e);
    });
  };

  const handleChange = (event: any) => {
    setSelectedOption(event.target.value);
    sessionStorage.setItem(SELECTED_ROOM, event.target.value);
  };

  return (
    <Box className="login-container">
      <Typography variant="h4">AzureAD OAuth</Typography>
      <Button variant="contained" className="button" onClick={handleLogin}>
        <FontAwesomeIcon icon={faSignInAlt} /> Login
      </Button>
      <Button variant="contained" className="button" onClick={handleLogout}>
        <FontAwesomeIcon icon={faSignOutAlt} /> Logout
      </Button>
      <Box className="select-input-wrapper">
        <select className="select-room-input" id="options" value={selectedOption} onChange={handleChange}>
          {Object.entries(roomEmailToNumberMap).map(([email, number]) => (
            <option key={email} value={email}>
              Room {number}
            </option>
          ))}
        </select>
      </Box>
    </Box>
  );
};
