import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
// Import duaCollection temporarily to fetch Dua content locally
// TODO: Consider moving Dua data loading to server as well for consistency
import { duaCollection, contentMap as localContentMap } from '../data/duaCollection';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

// --- External Helper Function for Fetching ---
const _performFetch = async (type, id, socket, connectionStatus, setIsLoadingContent, setCurrentFullContent, setError) => {
  if (!type || !id) {
    setCurrentFullContent(null); setIsLoadingContent(false); return;
  }

  console.log(`Fetching full content via helper for type: ${type}, id: ${id}`);
  setIsLoadingContent(true); setError(null);

  try {
    if (type === 'dua') {
      // Dua content is loaded locally, no changes needed here
      const duaData = localContentMap[id];
      if (duaData) {
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async
        setCurrentFullContent({ ...duaData, verses: { arabic: duaData.arabic || [], transliteration: duaData.transliteration || [], translation: duaData.translation || [] }, totalAyahs: duaData.arabic?.length || 0 });
      } else { throw new Error(`Dua with ID ${id} not found locally.`); }
      setIsLoadingContent(false); // Set loading false for Dua
    } else if (type === 'quran') {
      const cacheKey = `quran_surah_${id}`;

      // 1. Check connection status
      if (connectionStatus !== 'connected') {
        console.log(`Offline: Attempting to load Surah ${id} from cache.`);
        try {
          const cachedData = localStorage.getItem(cacheKey);
          if (cachedData) {
            console.log(`Surah ${id} found in cache.`);
            setCurrentFullContent(JSON.parse(cachedData));
            setIsLoadingContent(false);
            return; // Loaded from cache, exit
          } else {
            console.log(`Surah ${id} not found in cache.`);
            setError("Offline: This Surah hasn't been viewed online yet.");
            setCurrentFullContent(null);
            setIsLoadingContent(false);
            return; // Not in cache and offline, exit
          }
        } catch (cacheError) {
          console.error("Error reading from localStorage:", cacheError);
          setError("Error accessing cached data.");
          setCurrentFullContent(null);
          setIsLoadingContent(false);
          return; // Error accessing cache, exit
        }
      }

      // 2. If connected, fetch from server and cache
      if (socket) {
        console.log(`Online: Fetching Surah ${id} from server.`);
        socket.emit('get_quran_content', { surahId: id }, (response) => {
          if (response.error) {
            console.error('Error fetching Quran content:', response.error);
            setError(`Error fetching Surah ${id}: ${response.error}`);
            setCurrentFullContent(null);
          } else if (response.data) {
            console.log(`Received Quran content for Surah ${id}. Caching...`);
            try {
              // Cache the received data
              localStorage.setItem(cacheKey, JSON.stringify(response.data));
              console.log(`Surah ${id} cached successfully.`);
            } catch (cacheError) {
              console.error("Error writing to localStorage:", cacheError);
              // Non-critical error, proceed with setting content
              setError("Could not cache Surah data (storage might be full).");
            }
            // Set the content regardless of caching success/failure
            setCurrentFullContent({ id: response.data.id, title: response.data.title, arabicTitle: response.data.arabicTitle, totalAyahs: response.data.totalAyahs, verses: response.data.verses });
          }
          setIsLoadingContent(false); // Set loading false inside callback
        });
        // Note: setIsLoadingContent(false) is handled inside the async callback for socket fetch
      } else {
        // Should not happen if connectionStatus === 'connected', but as a fallback
        console.error("Cannot fetch Quran content: Socket is null despite being 'connected'.");
        setError("Internal error: Connection issue.");
        setCurrentFullContent(null);
        setIsLoadingContent(false);
      }
    } else {
      throw new Error(`Unknown content type: ${type}`);
    }
  } catch (err) {
    console.error('Error fetching full content:', err);
    setError(`Failed to load content: ${err.message}`);
    setCurrentFullContent(null);
    // Ensure loading is set to false in case of general errors (except for async quran fetch)
    if (type !== 'quran' || connectionStatus !== 'connected') {
      setIsLoadingContent(false);
    }
  }
  // Removed the finally block as loading state is handled within each branch now
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
  const [currentIndex, setCurrentIndex] = useState(0); // User's current index (local or synced)
  const [latestHostIndex, setLatestHostIndex] = useState(0); // Store the most recent index received from host
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
      console.log(`Attempting connection to ${socketUrl} using WebSocket ONLY.`);
      const newSocket = io(socketUrl, {
        transports: ['websocket'], // Force only WebSocket transport
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
        // --- REMOVE AUTOMATIC REJOIN ATTEMPT AGAIN ---
        // Rely solely on manual rejoin via button after connection.
        console.log('Socket connected. User must explicitly rejoin if needed via button.');
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
  }, [socket, connectionStatus]); // Dependencies for the function itself

  // Effect to automatically connect or reconnect
  useEffect(() => {
    // Attempt connection if disconnected or in error state, and not already connecting
    // Also check that socket instance doesn't exist yet to avoid race conditions on quick disconnect/reconnect
    if (!socket && (connectionStatus === 'disconnected' || connectionStatus === 'error') && connectionStatus !== 'connecting') {
      console.log(`Connection status is ${connectionStatus}, attempting to connect/reconnect.`);
      // Re-enable automatic reconnect
      connectToServer();
    }
    // This effect depends on the connection status to trigger retries.
    // It also depends on connectToServer in case its definition changes (though unlikely here).
    // It depends on socket to ensure we don't try connecting if a socket instance already exists but status is lagging.
  }, [connectionStatus, connectToServer, socket]);

  // Effect to clean up socket connection ONLY when the component unmounts
  useEffect(() => {
    // Store the socket instance in a ref to access it in the cleanup function
    // without needing it in the dependency array.
    // Use a simple object ref as useState/useRef might cause issues here.
    const socketRef = { current: socket };
    return () => {
      // Access the socket instance via the ref
      if (socketRef.current) {
        console.log('Disconnecting socket on component unmount.');
        socketRef.current.disconnect();
        // Do NOT setSocket(null) or setConnectionStatus here in the unmount cleanup.
        // Let the 'disconnect' event handler manage the status update,
        // which will then trigger the reconnection logic if needed.
        // Setting state in unmount cleanup is generally discouraged.
      }
    };
  }, []); // Empty dependency array: runs cleanup only on unmount

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
       setHostSelectedContentInfo(currentHostContentInfo);
       setLatestHostIndex(hostCurrentIndex ?? 0); // Initialize latestHostIndex on join
       setIsSyncedToHost(true);
       setCurrentContentInfo(currentHostContentInfo);
       setCurrentIndex(hostCurrentIndex ?? 0); // Set current index as well
       setError(null);
       setParticipants(initialParticipants || []); // Set initial participants list
       if (contentSelected && currentHostContentInfo) {
         setFetchTrigger({ type: currentHostContentInfo.type, id: currentHostContentInfo.id });
      } else {
        setCurrentFullContent(null); setFetchTrigger(null);
      }
     };
     const handleSessionNotFound = ({ sessionId: triedSessionId }) => {
       // Don't clear the client's sessionId/username here.
       // The user might still be trying to rejoin this specific session.
       console.error(`Server reported session ${triedSessionId} not found.`);
       // If this client IS the host, maybe their automatic rejoin/recreate is still processing
       // or failed silently. Don't show error immediately, maybe just log.
       // The manual rejoin button is still available.
       if (isHost) {
         console.warn(`Received session-not-found as host for ${triedSessionId}. Automatic recreate might have failed or is pending. Manual rejoin might be needed.`);
         // Optionally set a less alarming error? Or none for now? Let's clear any previous error.
         setError(null);
       } else {
         // If this client is NOT the host, show the informative error.
         setError(`Session "${triedSessionId}" not found. If the session just started or the host disconnected, please wait for the host to rejoin/recreate the session, then try rejoining again using the button in the header.`);
       }
       // Clear only state that definitely becomes invalid if session isn't found/joined
       setParticipants([]); // Clear participant list as it's definitely wrong now
       // Keep hostSelectedContentInfo, currentContentInfo, currentIndex etc. as they represent the last known state the user was viewing
       // setFetchTrigger(null); // Don't trigger fetches if session not found
     };
     // Define other handlers...
     const handleUsernameTaken = ({ username: triedUsername }) => {
       console.error(`Username ${triedUsername} is already taken.`); setError(`Username "${triedUsername}" is already taken. Please choose another.`);
       setUsername(null); // Clear username to re-prompt
     };
    const handleHostContentUpdated = ({ selectedContent: newHostContentInfo, currentIndex: newHostIndex }) => {
      console.log('Host content updated:', newHostContentInfo, 'Index:', newHostIndex);
      setHostSelectedContentInfo(newHostContentInfo);
      setLatestHostIndex(newHostIndex ?? 0); // Update latest host index on content change too
      setError(null);
      if (isSyncedToHost) {
        setCurrentContentInfo(newHostContentInfo);
        setCurrentIndex(newHostIndex ?? 0); // Update local index if synced
        if (newHostContentInfo) {
          setFetchTrigger({ type: newHostContentInfo.type, id: newHostContentInfo.id });
        } else {
          setCurrentFullContent(null); setFetchTrigger(null);
        }
      }
    };
    const handleHostIndexUpdated = ({ currentIndex: newHostIndex }) => {
      console.log('Host index updated:', newHostIndex);
      setLatestHostIndex(newHostIndex); // Always update the latest known host index
      if (isSyncedToHost) {
        setCurrentIndex(newHostIndex); // Also update local index if currently synced
      }
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
    // Define handleSessionNotFound INSIDE useEffect to access isHost state
    const handleSessionNotFoundListener = ({ sessionId: triedSessionId }) => {
       console.error(`Server reported session ${triedSessionId} not found.`);
       if (isHost) {
         // Host tried to rejoin manually and failed - server state is lost.
         console.warn(`Received session-not-found as host for ${triedSessionId}. Server state likely lost. Recreating session.`);
         // Maybe automatically trigger createSession again? Or just show error?
         // For now, show error indicating manual recreation needed via "Start New Session" or rejoin button again.
         setError(`Session "${triedSessionId}" not found on server. Please try Rejoin Session again or start a new session.`);
       } else {
         // Joiner tried to rejoin manually and failed.
         setError(`Session "${triedSessionId}" not found. Please wait for the host to start/rejoin the session, then try rejoining again using the button in the header.`);
       }
       setParticipants([]);
     };

    socket.on('session-not-found', handleSessionNotFoundListener); // Use the listener defined inside
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
      socket.off('session-not-found', handleSessionNotFoundListener); // Use the listener defined inside
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

  // Update joinSession to accept and pass the isHost flag
  const joinSession = useCallback((id, user, isJoiningAsHost = false) => { // Add isJoiningAsHost parameter
    if (socket && connectionStatus === 'connected' && id && user) {
      console.log(`Attempting to join session ${id} as ${user}. Is Host: ${isJoiningAsHost}`); setError(null);
      // Pass the flag to the server
      socket.emit('join-session', { sessionId: id, username: user, isHostAttemptingRejoin: isJoiningAsHost });
    } else { console.warn('Cannot join session: Socket not connected or details missing.'); }
  }, [socket, connectionStatus]); // Dependencies remain the same

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
      // Only unsync if actually in a session
      if (sessionId && connectionStatus === 'connected' && !isHost) {
        console.log("Unsyncing from host due to local selection.");
        setIsSyncedToHost(false);
      }
      setFetchTrigger({ type: contentInfo.type, id: contentInfo.id }); // Set trigger
    } else {
      // Handle deselecting content locally (e.g., via back button when not in session)
      console.log("Locally deselecting content.");
      setCurrentContentInfo(null);
      setFetchTrigger(null); // Clear fetch trigger
      // _performFetch will clear currentFullContent automatically if called with null type/id,
      // but explicitly setting it might be safer depending on timing. Let's rely on _performFetch for now.
      // setCurrentFullContent(null); // Optional: Explicitly clear full content
    }
  }, [connectionStatus, isHost, sessionId]); // Removed selectContentLocally from dependencies

  const syncToHost = useCallback(() => {
    // Syncing should be possible even if temporarily disconnected, as long as we know the host's state
    if (!isHost && hostSelectedContentInfo) { // Check if host has selected content
      console.log('Syncing to host content. Host index:', latestHostIndex);
      setError(null);
      setIsSyncedToHost(true);
      setCurrentContentInfo(hostSelectedContentInfo); // Set content info
      setCurrentIndex(latestHostIndex); // Use the LATEST known host index
      // Trigger fetch only if content info actually exists
      setFetchTrigger({ type: hostSelectedContentInfo.type, id: hostSelectedContentInfo.id });
    } else if (!isHost && !hostSelectedContentInfo) {
      // Host hasn't selected anything, sync means going to waiting screen
      console.log('Syncing to host (no content selected).');
      setError(null);
      setIsSyncedToHost(true);
      setCurrentContentInfo(null);
      setCurrentFullContent(null);
      setFetchTrigger(null);
    } else {
      console.warn("Cannot sync to host: Conditions not met (is host or host info missing).");
    }
  }, [isHost, hostSelectedContentInfo, latestHostIndex]); // Depend on latestHostIndex now

  const updateHostIndex = useCallback((newIndex) => {
    // Always update local state if the index is valid
    if (isHost && typeof newIndex === 'number') {
       const maxIndex = currentFullContent?.totalAyahs ? currentFullContent.totalAyahs - 1 : (currentFullContent?.verses?.arabic?.length ? currentFullContent.verses.arabic.length - 1 : 0);
       if (newIndex >= 0 && newIndex <= maxIndex) {
         console.log(`Host updating local index to: ${newIndex}.`);
         setCurrentIndex(newIndex); // Update local state immediately

         // Only emit if connected
         if (socket && connectionStatus === 'connected' && sessionId) {
           console.log(`Host emitting index update: ${newIndex}`);
           socket.emit('host_update_index', { sessionId, newIndex });
         } else {
           console.log("Host is offline, only updated local index.");
         }
       }
    } else { console.warn("Cannot update host index: Conditions not met (not host or invalid index)."); }
  }, [socket, connectionStatus, isHost, sessionId, currentFullContent]); // Added currentFullContent dependency

  const updateLocalIndex = useCallback((newIndex) => {
    // Participant updates their local index
    if (!isHost && typeof newIndex === 'number') {
      const maxIndex = currentFullContent?.totalAyahs ? currentFullContent.totalAyahs - 1 : (currentFullContent?.verses?.arabic?.length ? currentFullContent.verses.arabic.length - 1 : 0);
      if (newIndex >= 0 && newIndex <= maxIndex) {
        console.log(`Participant updating local index: ${newIndex}.`);
        setCurrentIndex(newIndex); // Update local state
        // Unsync only if actually in a session
        if (sessionId) {
          console.log("Unsyncing from host due to local navigation.");
          setIsSyncedToHost(false);
        }
      }
    } else { console.warn("Cannot update local index: Conditions not met (is host or invalid index)."); }
  }, [isHost, currentFullContent, sessionId]); // Added sessionId dependency

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
    currentFullContent, currentIndex, latestHostIndex, // Expose latestHostIndex if needed by UI, maybe not
    isSyncedToHost, participants, quranSurahList,
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
