import { useState, useRef, useEffect, useCallback } from 'react';
import { OpenVidu, Session, Publisher, Subscriber } from 'openvidu-browser';
import { createSession, createToken } from '@/features/interview/api/interview';

export function useOpenVidu(mySessionId: string, myUserName: string) {
  void mySessionId;
  // sessionId에서 ~숫자 부분 제거 (uuid~숫자 형태일 경우 uuid만 사용)
  const ovRef = useRef<OpenVidu | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const publisherRef = useRef<Publisher | null>(null);
  const joiningRef = useRef<boolean>(false);

  const [session, setSession] = useState<Session | null>(null);
  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isSessionReady, setIsSessionReady] = useState(false);

  const leaveSession = useCallback(() => {
    // 🔹 카메라·마이크 트랙 해제 로직 추가
    
    const mediaStream = publisherRef.current?.stream?.getMediaStream();

    if (mediaStream) {
      mediaStream.getTracks().forEach(track => {
        track.stop()
      });
    }

    // 🔹 OpenVidu 세션 종료 로직
    if (sessionRef.current) {
      sessionRef.current.disconnect();
    }
    
    ovRef.current = null;
    sessionRef.current = null;
    publisherRef.current = null;
    setSession(null);
    setPublisher(null);
    setSubscribers([]);
    setIsSessionReady(false);
  }, []);

  const getToken = useCallback(async (sessionId: string) => {
    // sessionId에서 ~숫자 부분 제거
    const cleanId = sessionId.includes('~') ? sessionId.split('~')[0] : sessionId;
    const createdSessionId = await createSession(cleanId);
    return await createToken(createdSessionId);
  }, []);

  const joinSession = useCallback(async (sessionId: string) => {
    if (joiningRef.current) return;
    joiningRef.current = true;
    setIsSessionReady(false);

    try {
      if (sessionRef.current) {
        leaveSession();
      }

      const ov = new OpenVidu();
      ovRef.current = ov;
      const newSession = ov.initSession();
      sessionRef.current = newSession;

      newSession.on('streamCreated', (e) => {
        const newSubscriber = newSession.subscribe(e.stream, undefined);
        setSubscribers(prev => [...prev, newSubscriber]);
      });

      newSession.on('streamDestroyed', (e) => {
        setSubscribers(prev => prev.filter(sub => sub.stream.streamId !== e.stream.streamId));
      });

      newSession.on('exception', (exception) => {
        console.warn('OpenVidu exception:', exception);
      });

      // sessionId에서 ~숫자 부분 제거
      const cleanId = sessionId.includes('~') ? sessionId.split('~')[0] : sessionId;
      const token = await getToken(cleanId);
      await newSession.connect(token, { clientData: myUserName });

      const newPublisher = await ov.initPublisherAsync(undefined, {
        audioSource: undefined,
        videoSource: undefined,
        publishAudio: true,
        publishVideo: true,
        resolution: '640x480',
        frameRate: 30,
        insertMode: 'APPEND',
        mirror: false,
      });

      await newSession.publish(newPublisher);
      
      publisherRef.current = newPublisher;
      setSession(newSession);
      setPublisher(newPublisher);
      setIsSessionReady(true);

    } catch (error) {
      console.error('There was an error connecting to the session:', error);
      setIsSessionReady(false);
    } finally {
      joiningRef.current = false;
    }
  }, [myUserName, getToken, leaveSession]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      leaveSession();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      leaveSession();
    };
  }, [leaveSession]);

  const joinSessionWithQuestion = useCallback(async (questionUuid: string) => {
    return joinSession(questionUuid);
  }, [joinSession]);

  return { session, publisher, subscribers, joinSession, joinSessionWithQuestion, leaveSession, isSessionReady };
}
