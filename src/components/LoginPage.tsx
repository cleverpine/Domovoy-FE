import { useMsal } from '@azure/msal-react';
import { faSignInAlt, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from "react";

import { loginRequest } from "../config/authConfig";
import { DEFAULT_SELECTED_ROOM, SELECTED_ROOM } from "../constants/login";
import { RoomOption } from "../models/roomOption";

export const LoginPage = () => {
  const { instance, inProgress } = useMsal();
  const [selectedOption, setSelectedOption] = useState('');

  const roomOptions: RoomOption[] = [
    { value: 'room401@cleverpine.com', label: 'Room 401' },
    { value: 'room402@cleverpine.com', label: 'Room 402' },
    { value: 'room403@cleverpine.com', label: 'Room 403' },
    { value: 'room405@cleverpine.com', label: 'Room 405' },
    { value: 'room406@cleverpine.com', label: 'Room 406' },
    { value: 'room407@cleverpine.com', label: 'Room 407' },
    { value: 'room408@cleverpine.com', label: 'Room 408' },
  ];

  useEffect(() => {
    if (localStorage.getItem(SELECTED_ROOM) === null) {
      localStorage.setItem(SELECTED_ROOM, DEFAULT_SELECTED_ROOM);
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
    localStorage.removeItem(SELECTED_ROOM);
    instance.logoutRedirect().catch(e => {
      console.error(e);
    });
  };

  const handleChange = (event: any) => {
    setSelectedOption(event.target.value);
    localStorage.setItem(SELECTED_ROOM, event.target.value);
  };

  return (
    <div className="login-container">
      <h1>AzureAD OAuth</h1>
      <button className="button" onClick={handleLogin}>
        <FontAwesomeIcon icon={faSignInAlt} /> Login
      </button>
      <button className="button" onClick={handleLogout}>
        <FontAwesomeIcon icon={faSignOutAlt} /> Logout
      </button>
      <div className="select-input-wrapper">
        <select className="select-room-input" id="options" value={selectedOption} onChange={handleChange}>
          {roomOptions.map((room: RoomOption) => (
            <option key={room.value} value={room.value}>
              {room.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
