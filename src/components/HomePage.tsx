import { useMsal } from '@azure/msal-react';
import { addMinutes, format, isWithinInterval } from "date-fns";
import { useEffect, useState } from 'react';

import { Box, Button, List, ListItem, ListItemButton, Modal, Typography } from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { faCalendarPlus, faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { graphConfig, loginRequest } from "../config/authConfig";
import { AVAILABILITY_VIEW_INTERVAL, AVAILABLE_ROOMS_INTERVAL, AVAILABLE_ROOMS_STYLES, DATE_PATTERN, FETCH_CALENDAR_INTERVAL, OVERLAY_STYLES, ROOM_STATUSES, TIMEZONE, TIME_UPDATE_INTERVAL, TIME_UPDATE_REFRESH_TOKEN_VALIDITY_TIME } from "../constants/home";
import { SELECTED_ROOM } from "../constants/login";
import { fetchWithHeaders } from "../helpers/fetchHelper";
import { roomEmailToNumberMap } from "../mappers/roomMapper";


const HomePage = () => {
  const { instance, accounts, inProgress } = useMsal();

  const [token, setToken] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());
  // all meetings for today
  const [todaysMeetings, setTodaysMeetings] = useState<any>([]);
  // meeting that is currently happening
  const [currentMeeting, setCurrentMeeting] = useState<any>(null);
  const [roomStatus, setRoomStatus] = useState<any>(null);
  // holds color for current room status overlay
  const [overlayStyles, setOverlayStyles] = useState<any>(null);
  const [availableRoomsStyles, setAvailableRoomsStyles] = useState<any>(null);
  // meetings left until a 'starting soon' status meeting starts
  const [startingSoonMeetingMinutes, setStartingSoonMeetingMinutes] = useState<number>(0);
  // next meetings when the room is in status 'busy'
  const [busyRoomMeetings, setBusyRoomMeetings] = useState<any>([]);
  // all room schedules
  const [schedules, setSchedules] = useState<any>(null);
  // available rooms for booking
  const [availableRooms, setAvailableRooms] = useState<string[] | null>(null);
  // selected room for booking
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  // room interval for booking
  const [availableRoomInterval, setAvailableRoomInterval] = useState<any>(null);

  // Hide available rooms in 5 minutes
  useEffect(() => {
    if (availableRooms) {
      const timer = setTimeout(() => {
        setAvailableRooms(null);
        setSelectedOption('');
        setIsModalOpen(false);
      }, AVAILABLE_ROOMS_INTERVAL);

      return () => clearTimeout(timer);
    }
  }, [availableRooms]);

  const acquireToken = () => {
    if (inProgress === "none" && accounts.length > 0) {
      instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
        forceRefresh: true,
        refreshTokenExpirationOffsetSeconds: TIME_UPDATE_REFRESH_TOKEN_VALIDITY_TIME
      }).then((response: any) => {
        setToken(response.accessToken);
        fetchCalendar(response.accessToken);
      }).catch((error: any) => {
        console.log('Acquire token silent failed', error);
      });
    }
  };

  // Fetch token & calendar every 30 minutes
  useEffect(() => {
    acquireToken();

    const tokenTimer = setInterval(acquireToken, FETCH_CALENDAR_INTERVAL);

    return () => clearInterval(tokenTimer);
  }, [accounts, instance, loginRequest]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
    }, TIME_UPDATE_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  // Check meeting status every second
  useEffect(() => {
    const timer = setInterval(() => {
      if (todaysMeetings) {
        checkMeetingStatus(todaysMeetings);
      }
    }, TIME_UPDATE_INTERVAL);

    return () => clearInterval(timer);
  }, [todaysMeetings]);

  const fetchCalendarRequest = async (token: string) => {
    const now = new Date();
    const daysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const formattedDateNow = format(now, DATE_PATTERN);
    const formattedDaysFromNow = format(daysFromNow, DATE_PATTERN);

    const body = {
      schedules: Object.keys(roomEmailToNumberMap),
      startTime: { dateTime: formattedDateNow, TIMEZONE },
      endTime: { dateTime: formattedDaysFromNow, TIMEZONE },
      AVAILABILITY_VIEW_INTERVAL,
    };

    const response = await fetchWithHeaders(graphConfig.graphCalendarEndpoint, token, body);

    return response.json();
  }

  const fetchCalendar = async (token: string) => {
    const data = await fetchCalendarRequest(token);
    setSchedules(data.value);
    const selectedRoomEmail = sessionStorage.getItem(SELECTED_ROOM);
    const selectedRoomNumber = roomEmailToNumberMap[selectedRoomEmail!];

    getCurrentRoomSchedule(data, selectedRoomNumber);
  }

  const getCurrentRoomSchedule = (data: any, selectedRoomNumber: string) => {
    if (data && data.value) {
      const roomSchedule = data.value.find((element: any) => element.scheduleId.includes(selectedRoomNumber));

      if (roomSchedule) {
        filterTodaysMeetings(roomSchedule.scheduleItems);
      }
    }
  }

  const filterTodaysMeetings = (currentRoomSchedules: any) => {
    const todayMeetings = currentRoomSchedules.filter((meeting: any) => {
      const meetingStart = new Date(meeting.start.dateTime);
      return isSameDate(meetingStart);
    });

    setTodaysMeetings(todayMeetings.slice(0, 4));
  };

  const calculateDifferenceInMinutes = (timestamp: string) => {
    const now = new Date();
    const givenDate = new Date(timestamp);
    const differenceInMillis = givenDate.getTime() - now.getTime();
    const differenceInMinutes = Math.floor(differenceInMillis / (1000 * 60));
    return differenceInMinutes + 1;
  };

  const checkMeetingStatus = (roomSchedules: any) => {
    const now = new Date();
    let status = ROOM_STATUSES.AVAILABLE;
    let ongoingMeeting = null;

    for (const meeting of roomSchedules) {
      const meetingStart = new Date(meeting.start.dateTime);
      const meetingEnd = new Date(meeting.end.dateTime);
      const adjustedMeetingEnd = addMinutes(meetingEnd, 1);

      if (isWithinInterval(now, { start: meetingStart, end: adjustedMeetingEnd })) {
        status = ROOM_STATUSES.BUSY;
        ongoingMeeting = meeting;
        break;
      }
    }

    if (status === ROOM_STATUSES.AVAILABLE && roomSchedules.length) {
      const minutesUntilStart = calculateDifferenceInMinutes(roomSchedules[0].start.dateTime);
      setStartingSoonMeetingMinutes(minutesUntilStart);

      if (minutesUntilStart > 0 && minutesUntilStart <= 15) {
        status = ROOM_STATUSES.STARTING_SOON;
      }
    }

    updateRoomStatus(status);

    setCurrentMeeting(ongoingMeeting);
  }

  const updateRoomStatus = (status: string) => {
    switch (status) {
      case ROOM_STATUSES.BUSY:
        setOverlayStyles(OVERLAY_STYLES.BUSY);
        setRoomStatus(ROOM_STATUSES.BUSY);
        setAvailableRoomsStyles(AVAILABLE_ROOMS_STYLES.BUSY);
        const updatedMeetings = todaysMeetings.slice(1);
        setBusyRoomMeetings(updatedMeetings.slice(0, 4));
        break;
      case ROOM_STATUSES.STARTING_SOON:
        setOverlayStyles(OVERLAY_STYLES.STARTING_SOON);
        setRoomStatus(ROOM_STATUSES.STARTING_SOON);
        setAvailableRoomsStyles(AVAILABLE_ROOMS_STYLES.STARTING_SOON);
        setBusyRoomMeetings([]);
        break;
      case ROOM_STATUSES.AVAILABLE:
      default:
        setOverlayStyles(OVERLAY_STYLES.AVAILABLE);
        setRoomStatus(ROOM_STATUSES.AVAILABLE);
        setAvailableRoomsStyles(AVAILABLE_ROOMS_STYLES.AVAILABLE);
        setBusyRoomMeetings([]);
        break;
    }
  }

  const isSameDate = (date: Date) => {
    const now = new Date();
    const givenDate = new Date(date);

    return (
      now.getFullYear() === givenDate.getFullYear() &&
      now.getMonth() === givenDate.getMonth() &&
      now.getDate() === givenDate.getDate()
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMeetingsTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getAvailableRooms = (scheduleResponse: any, currentRoom: string, excludedRoom: string) => {
    const currentRoomNumber = +currentRoom
    const excludedRoomNumber = +excludedRoom;

    const availableRooms = filterAvailableRooms(scheduleResponse, excludedRoomNumber);

    return sortRoomsBasedOnDistance(availableRooms, currentRoomNumber);
  };

  const filterAvailableRooms = (scheduleResponse: any, excludedRoomNumber: number) => {
    return scheduleResponse && scheduleResponse
      .filter((room: any) => {
        const roomNumber = +roomEmailToNumberMap[room.scheduleId];
        // return roomNumber !== excludedRoomNumber;
        // TODO change to return roomNumber when 404 room does not exist anymore
        return roomNumber;
      })
      .filter((room: any) => checkRoomAvailability(room.scheduleItems));
  }

  const sortRoomsBasedOnDistance = (availableRooms: any, currentRoomNumber: number) => {
    return availableRooms && availableRooms.sort((a: any, b: any) => {
      const roomNumberA = +roomEmailToNumberMap[a.scheduleId];
      const roomNumberB = +roomEmailToNumberMap[b.scheduleId];
      const distanceA = Math.abs(roomNumberA - currentRoomNumber);
      const distanceB = Math.abs(roomNumberB - currentRoomNumber);
      return distanceA - distanceB;
    });
  }

  const checkRoomAvailability = (scheduleItems: any) => {
    const now = format(currentTime, DATE_PATTERN);
    const endTime = getEndTime(now);

    return scheduleItems.every((item: any) => {
      const start = new Date(item.start.dateTime);
      const end = new Date(item.end.dateTime);

      return !(start < endTime && end > currentTime);
    });
  };

  const seeAvailableRooms = async () => {
    const data = await fetchCalendarRequest(token);

    setSchedules(data.value);

    const currentRoom = roomEmailToNumberMap[sessionStorage.getItem(SELECTED_ROOM)!]
    // TODO excluded room will be deleted later
    const availableRooms = getAvailableRooms(data.value, currentRoom, "404");
    const roomsWithEmpty = availableRooms && availableRooms.map((room: any) => room.scheduleId);

    if (roomsWithEmpty && roomsWithEmpty.length === 0) {
      toast.error(`No available rooms for the next 10 minutes!`);
      setAvailableRooms(null);
      setSelectedOption('');
      return;
    }

    setAvailableRooms(roomsWithEmpty);
    setSelectedOption(roomsWithEmpty && roomsWithEmpty[0]);
    setIsModalOpen(true);
  }

  const handleRoomSelect = (room: string) => {
    scheduleMeeting(room);
  };

  const scheduleMeeting = async (selectedRoom: string): Promise<any> => {
    const now = format(currentTime, DATE_PATTERN);

    const data = await fetchCalendarRequest(token);
    setSchedules(data.value);

    const chosenRoomSchedule = data.value.find((room: any) => room.scheduleId === selectedRoom);
    if (!checkRoomAvailability(chosenRoomSchedule.scheduleItems)) {
      toast.error(`Room ${roomEmailToNumberMap[selectedRoom]} is not available anymore! Please choose another room.`);
      setAvailableRooms(null);
      setSelectedOption('');
      return;
    }

    const formattedEndTime = getEndTime(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      const body = {
        subject: 'System Rooms',
        start: {
          dateTime: now,
          timeZone: TIMEZONE
        },
        end: {
          dateTime: formattedEndTime,
          timeZone: TIMEZONE
        },
        attendees: [
          {
            emailAddress: {
              address: selectedOption,
              name: roomEmailToNumberMap[selectedOption],
            },
            type: 'resource',
          }
        ],
      };

      const response = await fetchWithHeaders(graphConfig.graphScheduleMeetingEndpoint, token, body);

      const data = await response.json();

      if (!response.ok) {
        toast.error(`Failed to schedule meeting: ${response.status} - ${response.statusText}`);
        throw new Error(data.error.message);
      }

      toast.success(`Meeting successfully scheduled in Room ${roomEmailToNumberMap[selectedOption]}!`);

      setAvailableRooms(null);
      setSelectedOption('');
      setIsModalOpen(false);
      return data;
    } catch (error: any) {
      toast.error(`Failed to schedule meeting: ${error.message}`);
      throw error;
    }
  }

  const getNearestTenMinuteMark = (currentMinutes: number) => {
    let nearestTenMinuteMark = Math.ceil(currentMinutes / 10) * 10;

    if (nearestTenMinuteMark - currentMinutes <= 6) {
      nearestTenMinuteMark += 10;
    }

    return nearestTenMinuteMark;
  };

  const adjustEndTime = (date: Date, nearestTenMinuteMark: number) => {
    let endTime = new Date(date);

    if (nearestTenMinuteMark === 60) {
      endTime.setHours(endTime.getHours() + 1);
      endTime.setMinutes(0);
    } else {
      endTime.setMinutes(nearestTenMinuteMark);
    }

    if (endTime <= date) {
      endTime.setMinutes(endTime.getMinutes() + 10);
    }
    return endTime;
  };

  const formatMinutes = (minutes: number) => {
    return minutes.toString().padStart(2, '0');
  };

  const getEndTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const currentMinutes = date.getMinutes();

    const nearestTenMinuteMark = getNearestTenMinuteMark(currentMinutes);
    const endTime = adjustEndTime(date, nearestTenMinuteMark);

    const startTimeMins = formatMinutes(date.getMinutes());
    const endTimeMins = formatMinutes(endTime.getMinutes());

    setAvailableRoomInterval(`${date.getHours()}:${startTimeMins} - ${endTime.getHours()}:${endTimeMins}`);

    return endTime;
  };

  const handleLogout = () => {
    instance.logoutRedirect().catch(e => {
      console.error(e);
    });
  };

  if (!sessionStorage.getItem(SELECTED_ROOM)) {
    handleLogout();
    return <></>;
  }

  return (
    <div>
      <div className="container">
        <div className="time-container">
          <Typography className="typography time">{formatTime(currentTime)}</Typography>
          {(() => {
            switch (roomStatus) {
              case ROOM_STATUSES.BUSY:
                return (
                  <Box className="current-meeting-information">
                    <Box className="current-meeting-duration">
                      <Typography variant="h4" className="typography current-meeting-duration-info">{formatMeetingsTime(currentMeeting.start.dateTime)}</Typography>
                      <Typography variant="h4" className="typography current-meeting-duration-info">-</Typography>
                      <Typography variant="h4" className="typography current-meeting-duration-info">{formatMeetingsTime(currentMeeting.end.dateTime)}</Typography>
                    </Box>
                    <Typography variant="h4" className="typography current-meeting-owner">{currentMeeting.subject.trim()}'s meeting</Typography>
                  </Box>
                );
              case ROOM_STATUSES.STARTING_SOON:
                return (
                  <Box className="current-meeting-information">
                    <Typography className="typography starting-soon-meeting-info">Starts in {startingSoonMeetingMinutes} {startingSoonMeetingMinutes === 1 ? 'minute' : 'minutes'}</Typography>
                    <Typography className="typography starting-soon-meeting-name">{todaysMeetings[0].subject.trim()}'s meeting</Typography>
                  </Box>
                );
              case ROOM_STATUSES.AVAILABLE:
                return <Typography className="typography available-room">Available</Typography>;
              default:
                return null;
            }
          })()}
          <Box className={`select-input-wrapper-home ${availableRoomsStyles}`}>
            {schedules && <Button variant="outlined" className="available-rooms-btn"><FontAwesomeIcon icon={faCalendarPlus} onClick={seeAvailableRooms} /></Button>}
          </Box>
        </div>
        <div className="top-container">
          <Box className={`overlay ${overlayStyles}`}></Box>
        </div>
        <div className="content-container">
          <Box className="left-side">
            {sessionStorage.getItem(SELECTED_ROOM) ?
              roomEmailToNumberMap[sessionStorage.getItem(SELECTED_ROOM)!].split('').map((number, index) => (
                <p key={index} className="number">{number}</p>
              )) : ''
            }
          </Box>
          <Box className="right-side">
            <Box className="box">
              <Typography variant="h6" className="typography next-meetings">Next meetings</Typography>
              {roomStatus === ROOM_STATUSES.BUSY && busyRoomMeetings.length > 0 ? (
                busyRoomMeetings.map((element: any, index: any) => (
                  <Box className="meeting-information" key={index}>
                    <Box className="meeting-duration">
                      <Typography className="typography meeting-duration-info">{formatMeetingsTime(element.start.dateTime)}</Typography>
                      <Typography className="typography meeting-duration-info">-</Typography>
                      <Typography className="typography meeting-duration-info">{formatMeetingsTime(element.end.dateTime)}</Typography>
                    </Box>
                    <Typography variant="body2" className="typography meeting-owner">{element.subject ? `${element.subject.trim()}'s meeting` : 'Error: Name is missing'}</Typography>
                  </Box>
                ))
              ) : (roomStatus && roomStatus !== ROOM_STATUSES.BUSY) && todaysMeetings.length > 0 ? (
                todaysMeetings.map((element: any, index: any) => (
                  <Box className="meeting-information" key={index}>
                    <Box className="meeting-duration">
                      <Typography className="typography meeting-duration-info">{formatMeetingsTime(element.start.dateTime)}</Typography>
                      <Typography className="typography meeting-duration-info">-</Typography>
                      <Typography className="typography meeting-duration-info">{formatMeetingsTime(element.end.dateTime)}</Typography>
                    </Box>
                    <Typography className="typography meeting-owner">{element.subject ? `${element.subject.trim()}'s meeting` : 'Error: Name is missing'}</Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body1" className="typography no-meetings-message">No meetings for the rest of the day</Typography>
              )}
            </Box>
          </Box>
        </div>
      </div>
      <ToastContainer />
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box className="modal">
          <Box className="modal-title">
            <div className="modal-title-container">
              <Typography variant="h5">Book room between</Typography>
              <Typography variant="h5" className="availability-interval">{availableRoomInterval}</Typography>
            </div>
            <FontAwesomeIcon className="close-modal-icon" icon={faX} onClick={() => setIsModalOpen(false)} />
          </Box>
          <List className="list-wrapper">
            {availableRooms && availableRooms?.map((room, index) => (
              <ListItem key={index} disablePadding>
                <ListItemButton onClick={() => handleRoomSelect(room)} className="list-item-btn">
                  Room {roomEmailToNumberMap[room]}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Modal>
    </div>
  );

}

export default HomePage;
