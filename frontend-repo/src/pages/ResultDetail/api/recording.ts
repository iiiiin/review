import axios from 'axios';
const BASE = "https://i13e206.p.ssafy.io/api/recordings";

// export const startRecording = (sessionId: string) => axios.post(`${BASE}/start`, { sessionId });
// export const stopRecording = (recordingId: string) => axios.post(`${BASE}/stop`, { recordingId });

export const startRecording = async (sessionId: string) => {
  try {
    return await axios.post(`${BASE}/start`, { sessionId });
  } catch (error) {
    console.error('Recording start API 요청 실패:', error);
    throw error;
  }
};

export const stopRecording = async (recordingId: string) => {
  try {
    return await axios.post(`${BASE}/stop`, { recordingId });
  } catch (error) {
    console.error('Recording stop API 요청 실패:', error);
    throw error;
  }
};
