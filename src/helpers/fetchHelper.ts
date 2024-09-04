import { PREFERRED_TIMEZONE } from "../constants/home";

export const fetchWithHeaders = async (url: string, token: string, body: object) => {
  return await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Prefer': PREFERRED_TIMEZONE,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}