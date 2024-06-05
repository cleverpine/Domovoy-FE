import { useMsal } from '@azure/msal-react';
import { addMinutes, format, isWithinInterval } from "date-fns";
import { useEffect, useState } from 'react';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

  // Hide available rooms in 5 minutes
  useEffect(() => {
    if (availableRooms) {
      const timer = setTimeout(() => {
        setAvailableRooms(null);
        setSelectedOption('');
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
        console.log('here');

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

  const getAvailableRooms = (scheduleResponse: any, nextTenMinutes: Date, currentRoom: string, excludedRoom: string) => {
    const currentRoomNumber = +currentRoom
    const excludedRoomNumber = +excludedRoom;

    const availableRooms = filterAvailableRooms(scheduleResponse, nextTenMinutes, excludedRoomNumber);

    return sortRoomsBasedOnDistance(availableRooms, currentRoomNumber);
  };

  const filterAvailableRooms = (scheduleResponse: any, nextTenMinutes: Date, excludedRoomNumber: number) => {
    return scheduleResponse
      .filter((room: any) => {
        const roomNumber = +roomEmailToNumberMap[room.scheduleId];
        return roomNumber !== excludedRoomNumber;
        // TODO change to return roomNumber when 404 room does not exist anymore
        // return roomNumber;
      })
      .filter((room: any) => checkRoomAvailability(room.scheduleItems, nextTenMinutes));
  }

  const sortRoomsBasedOnDistance = (availableRooms: any, currentRoomNumber: number) => {
    return availableRooms.sort((a: any, b: any) => {
      const roomNumberA = +roomEmailToNumberMap[a.scheduleId];
      const roomNumberB = +roomEmailToNumberMap[b.scheduleId];
      const distanceA = Math.abs(roomNumberA - currentRoomNumber);
      const distanceB = Math.abs(roomNumberB - currentRoomNumber);
      return distanceA - distanceB;
    });
  }

  const checkRoomAvailability = (scheduleItems: any, nextTenMinutes: Date) => {
    return scheduleItems.every((item: any) => {
      const start = new Date(item.start.dateTime);
      const end = new Date(item.end.dateTime);
      return !(start < nextTenMinutes && end > currentTime);
    });
  };

  const seeAvailableRooms = async () => {
    const data = await fetchCalendarRequest(token);
    setSchedules(data.value);

    // check for 10 mins in order to include the time while considering booking the room
    const nextTenMinutes = new Date(currentTime.getTime() + 10 * 60000);
    const currentRoom = roomEmailToNumberMap[sessionStorage.getItem(SELECTED_ROOM)!]
    // TODO excluded room will be deleted later
    const availableRooms = getAvailableRooms(data.value, nextTenMinutes, currentRoom, "404");
    const roomsWithEmpty = availableRooms.map((room: any) => room.scheduleId);

    if (roomsWithEmpty.length === 0) {
      toast.error(`No available rooms for the next 10 minutes!`);
      setAvailableRooms(null);
      setSelectedOption('');
      return;
    }

    setAvailableRooms(roomsWithEmpty);
    setSelectedOption(roomsWithEmpty[0]);
  }

  const scheduleMeeting = async (): Promise<any> => {
    const nextTenMinutes = new Date(currentTime.getTime() + 10 * 60000);
    const now = format(currentTime, DATE_PATTERN);
    const tenMinutesLater = format(nextTenMinutes, DATE_PATTERN);

    const data = await fetchCalendarRequest(token);
    setSchedules(data.value);

    const chosenRoomSchedule = data.value.find((room: any) => room.scheduleId === selectedOption);
    if (!checkRoomAvailability(chosenRoomSchedule.scheduleItems, nextTenMinutes)) {
      toast.error(`Room ${roomEmailToNumberMap[selectedOption]} is not available anymore! Please choose another room.`);
      setAvailableRooms(null);
      setSelectedOption('');
      return;
    }

    try {
      const body = {
        subject: 'System Rooms',
        start: {
          dateTime: now,
          timeZone: TIMEZONE
        },
        end: {
          dateTime: tenMinutesLater,
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

      toast.success(`Meeting for 10 minutes scheduled in Room ${roomEmailToNumberMap[selectedOption]}!`);

      setAvailableRooms(null);
      setSelectedOption('');
      return data;
    } catch (error: any) {
      toast.error(`Failed to schedule meeting: ${error.message}`);
      throw error;
    }
  }

  const onSelectRoomChange = (event: any) => {
    setSelectedOption(event.target.value);
  }

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
          <p className="time">{formatTime(currentTime)}</p>
          {(() => {
            switch (roomStatus) {
              case ROOM_STATUSES.BUSY:
                return (
                  <div className="current-meeting-information">
                    <div className="current-meeting-duration">
                      <p className="current-meeting-duration-info">{formatMeetingsTime(currentMeeting.start.dateTime)}</p>
                      <p className="current-meeting-duration-info">-</p>
                      <p className="current-meeting-duration-info">{formatMeetingsTime(currentMeeting.end.dateTime)}</p>
                    </div>
                    <p className="current-meeting-owner">{currentMeeting.subject.trim()}'s meeting</p>
                  </div>
                );
              case ROOM_STATUSES.STARTING_SOON:
                return (
                  <div className="current-meeting-information">
                    <p className="starting-soon-meeting-info">Starts in {startingSoonMeetingMinutes} {startingSoonMeetingMinutes === 1 ? 'minute' : 'minutes'}</p>
                    <p className="starting-soon-meeting-name">{todaysMeetings[0].subject.trim()}'s meeting</p>
                  </div>
                );
              case ROOM_STATUSES.AVAILABLE:
                return <p className="available-room">Available</p>;
              default:
                return;
            }
          })()}
          <div className={`select-input-wrapper-home ${availableRoomsStyles}`}>
            <button onClick={seeAvailableRooms} className="available-rooms-btn" disabled={!schedules}>See available rooms</button>
            {availableRooms && <div className="book-room-wrapper">
              <select value={selectedOption} id="roomSelect" className="available-rooms-select-input" onChange={onSelectRoomChange}>
                {availableRooms.map((room: string, index: number) => (
                  <option key={index} value={room}>
                    {room}
                  </option>
                ))}
              </select>
              <button onClick={scheduleMeeting} className="available-rooms-btn">Book room for 10 minutes</button>
            </div>
            }
          </div>
        </div>
        <div className="top-container">
          <div className={`overlay ${overlayStyles}`}></div>
        </div>
        <div className="content-container">
          <div className="left-side">
            {
              sessionStorage.getItem(SELECTED_ROOM) ?
                roomEmailToNumberMap[sessionStorage.getItem(SELECTED_ROOM)!].split('').map((number: string, index: number) => (
                  <div key={index} className="number">{number}</div>
                )) : ''
            }
          </div>
          <div className="right-side">
            <div className="box">
              <p className="next-meetings">Next meetings</p>
              {roomStatus === ROOM_STATUSES.BUSY && busyRoomMeetings.length > 0 ? (
                busyRoomMeetings.map((element: any, index: number) => (
                  <div className="meeting-information" key={index}>
                    <div className="meeting-duration">
                      <p className="meeting-duration-info">{formatMeetingsTime(element.start.dateTime)}</p>
                      <p className="meeting-duration-info">-</p>
                      <p className="meeting-duration-info">{formatMeetingsTime(element.end.dateTime)}</p>
                    </div>
                    <p className="meeting-owner">{element.subject ? `${element.subject.trim()}'s meeting` : 'Error: Name is missing'}</p>
                  </div>
                ))
              ) : (roomStatus && roomStatus !== ROOM_STATUSES.BUSY) && todaysMeetings.length > 0 ? (
                todaysMeetings.map((element: any, index: number) => (
                  <div className="meeting-information" key={index}>
                    <div className="meeting-duration">
                      <p className="meeting-duration-info">{formatMeetingsTime(element.start.dateTime)}</p>
                      <p className="meeting-duration-info">-</p>
                      <p className="meeting-duration-info">{formatMeetingsTime(element.end.dateTime)}</p>
                    </div>
                    <p className="meeting-owner">{element.subject ? `${element.subject.trim()}'s meeting` : 'Error: Name is missing'}</p>
                  </div>
                ))
              ) : (
                <p className="no-meetings-message">No meetings for the rest of the day</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default HomePage;
