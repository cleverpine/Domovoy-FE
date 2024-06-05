import { TIMEZONE } from "../constants/home";

export const fetchWithHeaders = async (url: string, token: string, body: object) => {
  const preferredTimeZone = `outlook.timezone="${TIMEZONE}"`;

  return await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Prefer': preferredTimeZone,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}