import { PREFERRED_TIMEZONE } from "../constants/home";

export const fetchHelper = async (url: string, token: string, body?: object) => {
  const options: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Prefer': PREFERRED_TIMEZONE,
      Authorization: `Bearer ${token}`,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return await fetch(url, options);
};
