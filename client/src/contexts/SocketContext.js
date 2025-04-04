import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
// Import duaCollection temporarily to fetch Dua content locally
// TODO: Consider moving Dua data loading to server as well for consistency
import { duaCollection, contentMap as localContentMap } from '../data/duaCollection';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

// --- External Helper Function for Fetching ---
const _performFetch = async (type, id, socket, connectionStatus, setIsLoadingContent, setCurrentFullContent, setError) => {
  if (type === 'quran' && (!socket || connectionStatus !== 'connected')) {
    console.error("Cannot fetch Quran content: Socket not connected.");
    setError("Not connected to server to fetch Quran content.");
    setIsLoadingContent(false); setCurrentFullContent(null); return;
  }
  if (!type || !id) {
    setCurrentFullContent(null); setIsLoadingContent(false); return;
  }
  console.log(`Fetching full content via helper for type: ${type}, id: ${id}`);
  setIsLoadingContent(true); setError(null);
  try {
    if (type === 'dua') {
      const duaData = localContentMap[id];
      if (duaData) {
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async
        setCurrentFullContent({ ...duaData, verses: { arabic: duaData.arabic || [], transliteration: duaData.transliteration || [], translation: duaData.translation || [] }, totalAyahs: duaData.arabic?.length || 0 });
      } else { throw new Error(`Dua with ID ${id} not found locally.`); }
    } else if (type === 'quran') {
      socket.emit('get_quran_content', { surahId: id }, (response) => {
        if (response.error) {
          console.error('Error fetching Quran content:', response.error);
          setError(`Error fetching Surah ${id}: ${response.error}`); setCurrentFullContent(null);
        } else if (response.data) {
          console.log(`Received Quran content for Surah ${id}`);
          setCurrentFullContent({ id: response.data.id, title: response.data.title, arabicTitle: response.data.arabicTitle, totalAyahs: response.data.totalAyahs, verses: response.data.verses });
        }
        setIsLoadingContent(false); // Set loading false inside callback
      });
      return; // Exit early as fetch is async via socket callback
    } else { throw new Error(`Unknown content type: ${type}`); }
  } catch (err) {
    console.error('Error fetching full content:', err);
    setError(`Failed to load content: ${err.message}`); setCurrentFullContent(null);
  } finally {
    if (type !== 'quran') { setIsLoadingContent(false); }
  }
};
// --- End External Helper Function ---


export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected', 'error'
  const [hasAttemptedConnection, setHasAttemptedConnection] = useState(false); // NEW: Track if connection was tried
  const [sessionId, setSessionId] = useState(null);
  const [username, setUsername] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [hostSelectedContentInfo, setHostSelectedContentInfo] = useState(null);
  const [currentContentInfo, setCurrentContentInfo] = useState(null); // Info for locally viewed content
  const [currentFullContent, setCurrentFullContent] = useState(null); // Holds the *full* fetched data (verses, etc.)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSyncedToHost, setIsSyncedToHost] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [quranSurahList, setQuranSurahList] = useState([]);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [error, setError] = useState(null);

  // NEW: State to trigger fetching content
  const [fetchTrigger, setFetchTrigger] = useState(null); // { type, id } | null

  // Function to initiate connection
  const connectToServer = useCallback(() => {
    if (socket || connectionStatus === 'connecting' || connectionStatus === 'connected') {
      console.log('Connection attempt ignored: Already connected or connecting.');
      return;
    }
    console.log('Attempting to connect to socket server...');
    setHasAttemptedConnection(true); // Mark that an attempt has been made
    setConnectionStatus('connecting');
    setError(null);
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    let socketUrl;
    if (process.env.NODE_ENV === 'production') {
      socketUrl = process.env.REACT_APP_SOCKET_URL || window.location.origin;
      console.log(`Production mode: Determined socket URL: ${socketUrl}`);
    } else {
      socketUrl = isLocalhost ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
      console.log(`Development mode: Determined socket URL: ${socketUrl}`);
    }
    try {
      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true, // Ensure reconnection is enabled
        reconnectionAttempts: Infinity, // Keep trying
        reconnectionDelay: 1000, // Initial delay
        reconnectionDelayMax: 5000, // Max delay
      });
      newSocket.on('connect', () => {
        console.log('Socket connected successfully');
        setSocket(newSocket);
        setConnectionStatus('connected');
        setError(null); // Clear connection errors on successful connect
        // If we were in a session before disconnecting, try to rejoin/resync
        if (sessionId && username) {
          console.log('Reconnected, attempting to rejoin session:', sessionId);
          // Use a specific rejoin event or the standard join event
          // This depends on server implementation. Assuming 'join-session' works for rejoin.
          newSocket.emit('join-session', { sessionId, username }, (response) => {
            if (response?.error) {
              console.error("Failed to rejoin session after reconnect:", response.error);
              // Handle failed rejoin (e.g., session expired, clear session state)
              setError(`Failed to rejoin session: ${response.error}. Please start a new session.`);
              setSessionId(null); setUsername(null); setIsHost(false);
              setHostSelectedContentInfo(null); setCurrentContentInfo(null); setCurrentFullContent(null);
              setCurrentIndex(0); setIsSyncedToHost(true); setFetchTrigger(null);
            } else {
              console.log("Successfully rejoined session.");
              // Server should send updated state via 'session-joined' or similar event
            }
          });
        }
      });
      newSocket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${reason}`);
        // Don't clear the socket instance immediately, allow reconnection attempts
        setConnectionStatus('disconnected');
        // *** MODIFICATION START ***
        // Reset only state that is invalid without connection
        setParticipants([]);
        // Keep session state (sessionId, username, isHost, content info, index)
        // Set error to inform user
        if (reason !== 'io client disconnect') { // Don't show error if user intentionally disconnected (e.g., closing tab)
             setError("Connection lost. Attempting to reconnect...");
        }
        // *** MODIFICATION END ***
      });
      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        // Don't clear socket instance here either, let disconnect handle it if needed
        setConnectionStatus('error'); // Or keep 'disconnected' and rely on error state? Let's use 'error' state.
        setError(`Failed to connect: ${err.message}. Retrying...`);
      });
    } catch (err) {
      console.error("Error initializing socket connection:", err);
      setConnectionStatus('error'); setError(`Error setting up connection: ${err.message}`);
    }
  }, [socket, connectionStatus, sessionId, username]); // Added sessionId and username dependencies for rejoin logic

  // Effect to clean up socket connection when the component unmounts
  useEffect(() => {
    return () => {
      if (socket) {
        console.log('Disconnecting socket on component unmount.');
        socket.disconnect(); setSocket(null); setConnectionStatus('disconnected');
      }
    };
  }, [socket]);

  // Effect to set up application-specific event listeners *after* connection
  useEffect(() => {
    if (!socket || connectionStatus !== 'connected') return;
    console.log("Setting up application-specific socket listeners...");

    // Define handlers that now set the fetchTrigger state
    const handleSessionCreated = ({ sessionId: newSessionId, username: hostUsername }) => {
      console.log(`Session created: ${newSessionId} by ${hostUsername}`);
      setSessionId(newSessionId); setUsername(hostUsername); setIsHost(true); setIsSyncedToHost(true);
      setHostSelectedContentInfo(null); setCurrentContentInfo(null); setCurrentFullContent(null);
      setCurrentIndex(0); setParticipants([]); setError(null); setFetchTrigger(null);
    };
    const handleSessionJoined = ({ sessionId: joinedSessionId, username: joinedUsername, hostSelectedContent: currentHostContentInfo, currentIndex: hostCurrentIndex, isHost: userIsHost, contentSelected, participants: initialParticipants }) => {
      console.log(`${joinedUsername} joined session ${joinedSessionId}. Host Content: ${currentHostContentInfo?.id}, Index: ${hostCurrentIndex}, Is Host: ${userIsHost}`);
      setSessionId(joinedSessionId); setUsername(joinedUsername); setIsHost(userIsHost);
      setHostSelectedContentInfo(currentHostContentInfo); setIsSyncedToHost(true);
      setCurrentContentInfo(currentHostContentInfo); setCurrentIndex(hostCurrentIndex ?? 0); setError(null);
      setParticipants(initialParticipants || []); // Set initial participants list
      if (contentSelected && currentHostContentInfo) {
        setFetchTrigger({ type: currentHostContentInfo.type, id: currentHostContentInfo.id });
      } else {
        setCurrentFullContent(null); setFetchTrigger(null);
      }
    };
     const handleSessionNotFound = ({ sessionId: triedSessionId }) => {
       console.error(`Session ${triedSessionId} not found.`); setError(`Session "${triedSessionId}" not found.`);
       setSessionId(null); setUsername(null); setIsHost(false); setParticipants([]);
       setHostSelectedContentInfo(null); setCurrentContentInfo(null); setCurrentFullContent(null); setCurrentIndex(0);
       setFetchTrigger(null);
     };
     const handleUsernameTaken = ({ username: triedUsername }) => {
       console.error(`Username ${triedUsername} is already taken.`); setError(`Username "${triedUsername}" is already taken. Please choose another.`);
       setUsername(null); // Clear username to re-prompt
     };
    const handleHostContentUpdated = ({ selectedContent: newHostContentInfo, currentIndex: newHostIndex }) => {
      console.log('Host content updated:', newHostContentInfo);
      setHostSelectedContentInfo(newHostContentInfo); setCurrentIndex(newHostIndex ?? 0); setError(null);
      if (isSyncedToHost) {
        setCurrentContentInfo(newHostContentInfo);
        if (newHostContentInfo) {
          setFetchTrigger({ type: newHostContentInfo.type, id: newHostContentInfo.id });
        } else {
          setCurrentFullContent(null); setFetchTrigger(null);
        }
      }
    };
    const handleHostIndexUpdated = ({ currentIndex: newHostIndex }) => {
      console.log('Host index updated:', newHostIndex);
      if (isSyncedToHost) { setCurrentIndex(newHostIndex); }
    };
    const handleUpdateParticipants = ({ participants: updatedParticipants }) => {
      console.log('Participants updated:', updatedParticipants); setParticipants(updatedParticipants || []);
    };
    const handleHostTransferred = ({ newHostId, participants: updatedParticipants }) => {
      console.log(`Host transferred to ${newHostId}. Participants:`, updatedParticipants);
      setParticipants(updatedParticipants || []);
      const amINewHost = socket.id === newHostId;
      console.log(`This client ${amINewHost ? 'IS' : 'IS NOT'} the new host.`); setIsHost(amINewHost);
      if (amINewHost) {
        setIsSyncedToHost(true);
        if (currentContentInfo?.id !== hostSelectedContentInfo?.id || currentContentInfo?.type !== hostSelectedContentInfo?.type) {
           setCurrentContentInfo(hostSelectedContentInfo);
           if (hostSelectedContentInfo) {
             setFetchTrigger({ type: hostSelectedContentInfo.type, id: hostSelectedContentInfo.id });
           } else {
             setCurrentFullContent(null); setFetchTrigger(null);
           }
        }
      }
    };
    const handleServerError = ({ message }) => { console.error('Server error:', message); setError(message); };

    // Attach listeners
    socket.on('session-created', handleSessionCreated);
    socket.on('session-joined', handleSessionJoined);
    socket.on('session-not-found', handleSessionNotFound);
    socket.on('username-taken', handleUsernameTaken);
    socket.on('host_content_updated', handleHostContentUpdated);
    socket.on('host_index_updated', handleHostIndexUpdated);
    socket.on('update_participants', handleUpdateParticipants);
    socket.on('host_transferred', handleHostTransferred);
    socket.on('error', handleServerError);

    // Cleanup listeners
    return () => {
      console.log("Cleaning up application-specific socket listeners...");
      socket.off('session-created', handleSessionCreated);
      socket.off('session-joined', handleSessionJoined);
      socket.off('session-not-found', handleSessionNotFound);
      socket.off('username-taken', handleUsernameTaken);
      socket.off('host_content_updated', handleHostContentUpdated);
      socket.off('host_index_updated', handleHostIndexUpdated);
      socket.off('update_participants', handleUpdateParticipants);
      socket.off('host_transferred', handleHostTransferred);
      socket.off('error', handleServerError);
    };
  }, [socket, connectionStatus, isSyncedToHost]); // Dependencies are correct

  // Effect: Trigger fetch when fetchTrigger state changes
  useEffect(() => {
    // Check if trigger has valid data and call the external helper function
    if (fetchTrigger?.type && fetchTrigger?.id) {
      console.log("Fetch trigger activated:", fetchTrigger);
      // Call the external helper, passing state and setters
      _performFetch(
        fetchTrigger.type,
        fetchTrigger.id,
        socket,
        connectionStatus,
        setIsLoadingContent,
        setCurrentFullContent,
        setError
      );
    }
  // Dependencies: The effect runs when the trigger changes.
  // It also needs access to socket and connectionStatus to pass to the helper.
  }, [fetchTrigger, socket, connectionStatus]);

  // --- Context Actions ---
  const createSession = useCallback((user) => {
    if (socket && connectionStatus === 'connected' && user) {
      console.log(`Attempting to create session as ${user}`); setError(null);
      socket.emit('create-session', { username: user });
    } else { console.warn('Cannot create session: Socket not connected or user missing.'); }
  }, [socket, connectionStatus]);

  const joinSession = useCallback((id, user) => {
    if (socket && connectionStatus === 'connected' && id && user) {
      console.log(`Attempting to join session ${id} as ${user}`); setError(null);
      socket.emit('join-session', { sessionId: id, username: user });
    } else { console.warn('Cannot join session: Socket not connected or details missing.'); }
  }, [socket, connectionStatus]);

  const selectContentAsHost = useCallback((contentInfo) => {
    if (socket && connectionStatus === 'connected' && isHost && sessionId) {
      if (contentInfo) {
        console.log(`Host selecting ${contentInfo.type}: ${contentInfo.title} (ID: ${contentInfo.id})`); setError(null);
        socket.emit('select_content', { sessionId, contentInfo });
        // Listener 'host_content_updated' will set fetchTrigger
      } else {
        console.log(`Host deselecting content.`); setError(null);
        socket.emit('select_content', { sessionId, contentInfo: null });
        setCurrentContentInfo(null); setCurrentFullContent(null); setFetchTrigger(null);
      }
    } else { console.warn('Cannot select content as host: Socket not connected or not host.'); }
  }, [socket, connectionStatus, isHost, sessionId]);

  const selectContentLocally = useCallback((contentInfo) => {
    if (contentInfo) {
      console.log(`Locally selecting ${contentInfo.type}: ${contentInfo.title} (ID: ${contentInfo.id}).`); setError(null);
      setCurrentContentInfo(contentInfo);
      if (connectionStatus === 'connected' && !isHost) {
        console.log("Unsyncing from host due to local selection."); setIsSyncedToHost(false);
      }
      setFetchTrigger({ type: contentInfo.type, id: contentInfo.id }); // Set trigger
    }
  }, [connectionStatus, isHost]);

  const syncToHost = useCallback(() => {
    if (connectionStatus === 'connected' && !isHost) {
      console.log('Syncing to host content.'); setError(null); setIsSyncedToHost(true);
      setCurrentContentInfo(hostSelectedContentInfo);
      const hostIndex = hostSelectedContentInfo?.currentIndex ?? 0;
      setCurrentIndex(hostIndex);
      if (hostSelectedContentInfo) {
        setFetchTrigger({ type: hostSelectedContentInfo.type, id: hostSelectedContentInfo.id }); // Set trigger
      } else {
        setCurrentFullContent(null); setFetchTrigger(null);
      }
    } else { console.warn("Cannot sync to host: Not connected or already host."); }
  }, [connectionStatus, isHost, hostSelectedContentInfo]);

  const updateHostIndex = useCallback((newIndex) => {
    if (socket && connectionStatus === 'connected' && isHost && sessionId && typeof newIndex === 'number') {
      console.log(`Host emitting index update: ${newIndex}`);
      socket.emit('host_update_index', { sessionId, newIndex });
    } else { console.warn("Cannot update host index: Not connected or not host."); }
  }, [socket, connectionStatus, isHost, sessionId]);

  const updateLocalIndex = useCallback((newIndex) => {
    if (typeof newIndex === 'number') {
      const maxIndex = currentFullContent?.totalAyahs ? currentFullContent.totalAyahs - 1 : (currentFullContent?.verses?.arabic?.length ? currentFullContent.verses.arabic.length - 1 : 0);
      if (newIndex >= 0 && newIndex <= maxIndex) {
        console.log(`Updating local index: ${newIndex}.`); setCurrentIndex(newIndex);
        if (connectionStatus === 'connected' && !isHost) {
          console.log("Unsyncing from host due to local navigation."); setIsSyncedToHost(false);
        }
      }
    }
  }, [connectionStatus, isHost, currentFullContent]);

  const getQuranMetadata = useCallback(() => {
    if (socket && connectionStatus === 'connected' && quranSurahList.length === 0) {
      console.log('Requesting Quran metadata from server...'); setError(null);
      socket.emit('get_quran_metadata', (response) => {
        if (response.error) {
          console.error('Error fetching Quran metadata:', response.error);
          setError(`Failed to load Quran list: ${response.error}`); setQuranSurahList([]);
        } else if (response.data) {
          console.log('Received Quran metadata.'); setQuranSurahList(response.data);
        }
      });
    } else if (quranSurahList.length === 0) { console.warn("Cannot get Quran metadata: Socket not connected."); }
  }, [socket, connectionStatus, quranSurahList]);

  const contextValue = {
    socket, connectionStatus, connected: connectionStatus === 'connected',
    hasAttemptedConnection, // Expose the flag
    sessionId, username, isHost, hostSelectedContentInfo, currentContentInfo,
    currentFullContent, currentIndex, isSyncedToHost, participants, quranSurahList,
    isLoadingContent, error,
    // Actions
    connectToServer, createSession, joinSession, selectContentAsHost,
    selectContentLocally, syncToHost, updateHostIndex, updateLocalIndex,
    getQuranMetadata,
    // fetchTrigger and _performFetch are internal
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
