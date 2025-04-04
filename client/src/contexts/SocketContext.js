import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
// Import local data collections
import { duaCollection, contentMap as duaContentMap } from '../data/duaCollection';
import { quranMetadata, quranContentMap } from '../data/quranCollection'; // Import Quran data

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

// --- External Helper Function for Fetching ---
// Updated to fetch Quran data locally
const _performFetch = async (type, id, setIsLoadingContent, setCurrentFullContent, setError) => {
  // No longer needs socket or connectionStatus for fetching

  if (!type || !id) {
    setCurrentFullContent(null); setIsLoadingContent(false); return;
  }
  console.log(`Fetching local content via helper for type: ${type}, id: ${id}`);
  setIsLoadingContent(true); setError(null);
  try {
    let contentData = null;
    if (type === 'dua') {
      contentData = duaContentMap[id]; // Assumes dua IDs are strings like 'dua-kumayl'
      if (!contentData) throw new Error(`Dua with ID ${id} not found locally.`);
      // Simulate async fetch slightly for consistency
      await new Promise(resolve => setTimeout(resolve, 50));
      // Ensure Dua data has the expected structure (adjust if needed)
       setCurrentFullContent({
         id: contentData.id || id, // Use ID from map or passed ID
         title: contentData.title || 'Dua',
         arabicTitle: contentData.arabicTitle || '', // Use arabicTitle if present
         totalAyahs: contentData.verses?.arabic?.length || 0, // Calculate length from verses array
         verses: { // Ensure consistent verses structure
           arabic: contentData.verses?.arabic || [],
           transliteration: contentData.verses?.transliteration || [],
           translation: contentData.verses?.translation || [],
         },
         type: 'dua'
       });

    } else if (type === 'quran') {
      contentData = quranContentMap[id]; // Assumes Quran IDs are numbers (1, 2, ...)
      if (!contentData) throw new Error(`Surah with ID ${id} not found locally.`);
       // Simulate async fetch slightly for consistency
       await new Promise(resolve => setTimeout(resolve, 50));
       // quranContentMap already has the desired structure
       setCurrentFullContent(contentData);
    } else {
      throw new Error(`Unknown content type: ${type}`);
    }

  } catch (err) {
    console.error('Error fetching local content:', err);
    setError(`Failed to load content: ${err.message}`); setCurrentFullContent(null);
  } finally {
    setIsLoadingContent(false);
  }
};
// --- End External Helper Function ---


export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected', 'error'
  const [hasAttemptedConnection, setHasAttemptedConnection] = useState(false); // Track if connection was tried
  const [sessionId, setSessionId] = useState(null);
  const [username, setUsername] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [hostSelectedContentInfo, setHostSelectedContentInfo] = useState(null);
  const [currentContentInfo, setCurrentContentInfo] = useState(null); // Info for locally viewed content
  const [currentFullContent, setCurrentFullContent] = useState(null); // Holds the *full* fetched data (verses, etc.)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSyncedToHost, setIsSyncedToHost] = useState(true);
  const [participants, setParticipants] = useState([]);
  // const [quranSurahList, setQuranSurahList] = useState([]); // REMOVED - Metadata now imported directly
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [error, setError] = useState(null);

  // State to trigger fetching content
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
          newSocket.emit('join-session', { sessionId, username }, (response) => {
            if (response?.error) {
              console.error("Failed to rejoin session after reconnect:", response.error);
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
        setConnectionStatus('disconnected');
        setParticipants([]); // Reset only participants
        if (reason !== 'io client disconnect') {
             setError("Connection lost. Attempting to reconnect...");
        }
      });
      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setConnectionStatus('error');
        setError(`Failed to connect: ${err.message}. Retrying...`);
      });
    } catch (err) {
      console.error("Error initializing socket connection:", err);
      setConnectionStatus('error'); setError(`Error setting up connection: ${err.message}`);
    }
  }, [socket, connectionStatus, sessionId, username]);

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
      setParticipants(initialParticipants || []);
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
       setUsername(null);
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
  }, [socket, connectionStatus, isSyncedToHost]);

  // Effect: Trigger fetch when fetchTrigger state changes
  useEffect(() => {
    // Check if trigger has valid data and call the external helper function
    if (fetchTrigger?.type && fetchTrigger?.id) {
      console.log("Fetch trigger activated:", fetchTrigger);
      // Call the external helper, passing state and setters
      _performFetch(
        fetchTrigger.type,
        fetchTrigger.id,
        // socket, // No longer needed by helper
        // connectionStatus, // No longer needed by helper
        setIsLoadingContent,
        setCurrentFullContent,
        setError
      );
    }
  // Dependencies: The effect runs when the trigger changes.
  }, [fetchTrigger]); // Removed socket and connectionStatus

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
        // Include totalAyahs when selecting Quran content
        const contentToSend = { ...contentInfo };
        if (contentInfo.type === 'quran') {
            const meta = quranMetadata.find(s => s.id === contentInfo.id);
            contentToSend.totalAyahs = meta ? meta.totalAyahs : 0;
        }
        socket.emit('select_content', { sessionId, contentInfo: contentToSend });
        // Listener 'host_content_updated' will set fetchTrigger
      } else {
        console.log(`Host deselecting content.`); setError(null);
        socket.emit('select_content', { sessionId, contentInfo: null });
        setCurrentContentInfo(null); setCurrentFullContent(null); setFetchTrigger(null);
      }
    } else { console.warn('Cannot select content as host: Socket not connected or not host.'); }
  }, [socket, connectionStatus, isHost, sessionId]); // quranMetadata is stable, no need to add

  const selectContentLocally = useCallback((contentInfo) => {
    if (contentInfo) {
      console.log(`Locally selecting ${contentInfo.type}: ${contentInfo.title} (ID: ${contentInfo.id}).`); setError(null);
      // Include totalAyahs when setting local Quran content info
      const infoToSet = { ...contentInfo };
       if (contentInfo.type === 'quran') {
           const meta = quranMetadata.find(s => s.id === contentInfo.id);
           infoToSet.totalAyahs = meta ? meta.totalAyahs : 0;
       }
      setCurrentContentInfo(infoToSet);
      if (connectionStatus === 'connected' && !isHost) {
        console.log("Unsyncing from host due to local selection."); setIsSyncedToHost(false);
      }
      setFetchTrigger({ type: contentInfo.type, id: contentInfo.id }); // Set trigger
    }
  }, [connectionStatus, isHost]); // quranMetadata is stable

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
      // Use totalAyahs from currentContentInfo for bounds check if available
      const knownTotal = currentContentInfo?.totalAyahs ?? currentFullContent?.totalAyahs ?? 0;
      if (newIndex >= 0 && newIndex < knownTotal) {
        console.log(`Updating local index: ${newIndex}.`); setCurrentIndex(newIndex);
        if (connectionStatus === 'connected' && !isHost) {
          console.log("Unsyncing from host due to local navigation."); setIsSyncedToHost(false);
        }
      }
    }
  }, [connectionStatus, isHost, currentFullContent, currentContentInfo]); // Added currentContentInfo

  // REMOVED getQuranMetadata function

  const contextValue = {
    socket, connectionStatus, connected: connectionStatus === 'connected',
    hasAttemptedConnection, // Expose the flag
    sessionId, username, isHost, hostSelectedContentInfo, currentContentInfo,
    currentFullContent, currentIndex, isSyncedToHost, participants,
    // quranSurahList, // REMOVED
    isLoadingContent, error,
    // Actions
    connectToServer, createSession, joinSession, selectContentAsHost,
    selectContentLocally, syncToHost, updateHostIndex, updateLocalIndex,
    // getQuranMetadata, // REMOVED
    // fetchTrigger and _performFetch are internal
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
