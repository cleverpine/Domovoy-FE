export const DATE_PATTERN = "yyyy-MM-dd'T'HH:mm:ss";
export const TIMEZONE = 'E. Europe Standard Time';
export const AVAILABILITY_VIEW_INTERVAL = 30;
export const FETCH_CALENDAR_INTERVAL = 30000;
export const TIME_UPDATE_INTERVAL = 1000;
// 3 minutes buffer to book a room
export const AVAILABLE_ROOMS_INTERVAL = 120000;
// in seconds
export const TIME_UPDATE_REFRESH_TOKEN_VALIDITY_TIME = 3600;

export const ROOM_STATUSES = {
  BUSY: 'busy',
  STARTING_SOON: 'startingSoon',
  AVAILABLE: 'available',
};

export const OVERLAY_STYLES = {
  BUSY: 'busy-overlay',
  STARTING_SOON: 'starting-soon-overlay',
  AVAILABLE: 'available-overlay',
};

export const AVAILABLE_ROOMS_STYLES = {
  BUSY: 'busy-room-wrapper',
  STARTING_SOON: 'starting-soon-room-wrapper',
  AVAILABLE: 'available-room-wrapper',
};
