import { toast } from 'react-toastify';

const fetchToken = async () => {
  return await fetch('http://127.0.0.1:4000/token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });
}

export const getToken = async () => {
  try {
    const response = await fetchToken();

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