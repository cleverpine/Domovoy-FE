export const msalConfig = {
  auth: {
    clientId: 'bbaf726d-af5d-4d0c-b539-908dbe6125f1',
    authority: 'https://login.microsoftonline.com/2c4c412c-1cb6-4770-9bb4-87b4bfe440c1/oauth2/v2.0/authorize',
    redirectUri: 'http://localhost:3000',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ['user.read', 'calendars.read'],
};

export const graphConfig = {
  graphCalendarEndpoint: 'https://graph.microsoft.com/v1.0/me/calendar/getSchedule',
  graphScheduleMeetingEndpoint: 'https://graph.microsoft.com/v1.0/me/events'
};
