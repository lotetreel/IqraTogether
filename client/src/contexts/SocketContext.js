import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
// Import duaCollection temporarily to fetch Dua content locally
// TODO: Consider moving Dua data loading to server as well for consistency
import { duaCollection, contentMap as localContentMap } from '../data/duaCollection'; 

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [username, setUsername] = useState(null);
  const [isHost, setIsHost] = useState(false);
  // Store INFO about selected content (type, id, title, totalAyahs?), not full content
  const [hostSelectedContentInfo, setHostSelectedContentInfo] = useState(null); 
  const [currentContentInfo, setCurrentContentInfo] = useState(null); // Info for locally viewed content
  const [currentFullContent, setCurrentFullContent] = useState(null); // Holds the *full* fetched data (verses, etc.)
  const [currentIndex, setCurrentIndex] = useState(0); // Separate state for the current index/ayah number
  const [isSyncedToHost, setIsSyncedToHost] = useState(true); // Initially synced
  const [participants, setParticipants] = useState([]); 
  const [quranSurahList, setQuranSurahList] = useState([]); // Holds metadata for Quran selection
  const [isLoadingContent, setIsLoadingContent] = useState(false); // Loading indicator
  const [error, setError] = useState(null); // Error state

  // Ref to track if initial content load is needed after joining
  const initialLoadNeeded = useRef(false);

  useEffect(() => {
    // Determine if this is running on the development machine or a remote device
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // Build the socket URL based on environment
    let socketUrl;

    if (process.env.NODE_ENV === 'production') {
      // In production, use the environment variable or default to same origin (less common for separate deployments)
      socketUrl = process.env.REACT_APP_SOCKET_URL || window.location.origin; 
      console.log(`Production mode: Connecting to socket server at: ${socketUrl}`);
    } else {
      // In development
      if (isLocalhost) {
        // On the development machine, connect to localhost:5000
        socketUrl = 'http://localhost:5000';
      } else {
        // On a remote device (like a mobile phone) during development, use the computer's hostname
        socketUrl = `http://${window.location.hostname}:5000`;
      }
      console.log(`Development mode: Connecting to socket server at: ${socketUrl}`);
    }

    const socketConnection = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    socketConnection.on('connect', () => {
      console.log('Connected to socket server');
      setConnected(true);
    });

    socketConnection.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setConnected(false);
      // Reset state on disconnect
      setSessionId(null);
      setUsername(null);
      setIsHost(false);
      setParticipants([]);
      setHostSelectedContentInfo(null);
      setCurrentContentInfo(null);
      setCurrentFullContent(null);
      setCurrentIndex(0);
      setIsSyncedToHost(true);
      setError(null);
      setQuranSurahList([]); // Clear Quran list on disconnect
    });

    socketConnection.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    setSocket(socketConnection);

    // Clean up the socket connection when the component unmounts
    return () => {
      if (socketConnection) {
        socketConnection.disconnect();
      }
    };
  }, []);

  // Socket Event Listeners
  useEffect(() => {
    if (!socket) return;

    // Session Management
    socket.on('session-created', ({ sessionId: newSessionId, username: hostUsername }) => {
      console.log(`Session created: ${newSessionId} by ${hostUsername}`);
      setSessionId(newSessionId);
      setUsername(hostUsername);
      setIsHost(true);
      setIsSyncedToHost(true); // Host is always "synced"
      setHostSelectedContentInfo(null); 
      setCurrentContentInfo(null); 
      setCurrentFullContent(null);
      setCurrentIndex(0);
      setParticipants([]); 
      setError(null);
    });

    // Updated handler for session join
    socket.on('session-joined', ({ sessionId: joinedSessionId, username: joinedUsername, hostSelectedContent: currentHostContentInfo, currentIndex: hostCurrentIndex, isHost: userIsHost, contentSelected }) => {
      console.log(`${joinedUsername} joined session ${joinedSessionId}. Host Content: ${currentHostContentInfo?.id}, Index: ${hostCurrentIndex}, Is Host: ${userIsHost}`);
      setSessionId(joinedSessionId);
      setUsername(joinedUsername);
      setIsHost(userIsHost);
      setHostSelectedContentInfo(currentHostContentInfo);
      setIsSyncedToHost(true); // Sync initially on join
      setCurrentContentInfo(currentHostContentInfo); // Show host's content info initially
      setCurrentIndex(hostCurrentIndex ?? 0); // Set index from host
      setError(null);
      // Participant list will be updated via 'update_participants'
      
      // If host has content selected, mark that we need to load it
      if (contentSelected && currentHostContentInfo) {
        initialLoadNeeded.current = true; 
      } else {
        setCurrentFullContent(null); // Ensure no stale content is shown
      }
    });

    socket.on('session-not-found', ({ sessionId: triedSessionId }) => {
      console.error(`Session ${triedSessionId} not found.`);
      setError(`Session "${triedSessionId}" not found.`);
      // Reset state
      setSessionId(null);
      setUsername(null);
      setIsHost(false);
      setParticipants([]);
      setHostSelectedContentInfo(null);
      setCurrentContentInfo(null);
      setCurrentFullContent(null);
      setCurrentIndex(0);
    });

    socket.on('username-taken', ({ username: triedUsername }) => {
      console.error(`Username ${triedUsername} is already taken in this session.`);
      setError(`Username "${triedUsername}" is already taken. Please choose another.`);
      // Keep session ID if joining, but clear username to prompt again
      setUsername(null); 
    });

    // --- Content Synchronization ---
    // Host selected new content (Dua or Quran)
    socket.on('host_content_updated', ({ selectedContent: newHostContentInfo, currentIndex: newHostIndex }) => {
      console.log('Host content updated:', newHostContentInfo);
      setHostSelectedContentInfo(newHostContentInfo);
      setCurrentIndex(newHostIndex ?? 0); // Update index as well
      setError(null); // Clear previous errors

      if (isSyncedToHost) {
        setCurrentContentInfo(newHostContentInfo);
        // Trigger fetching full content if needed (Quran or potentially Duas if moved to server)
        if (newHostContentInfo) {
          fetchFullContent(newHostContentInfo.type, newHostContentInfo.id);
        } else {
          setCurrentFullContent(null); // Clear content if host selected nothing
        }
      }
    });

    // Host navigated (changed index)
    socket.on('host_index_updated', ({ currentIndex: newHostIndex }) => {
      console.log('Host index updated:', newHostIndex);
      // Update host's known index (might not be strictly needed if not displayed)
      // setHostSelectedContentInfo(prev => prev ? {...prev, currentIndex: newHostIndex} : null); 
      
      if (isSyncedToHost) {
        setCurrentIndex(newHostIndex); // Update local index if synced
      }
    });
    // --- End Content Synchronization ---

    // Listen for participant list updates
    socket.on('update_participants', ({ participants: updatedParticipants }) => {
      console.log('Participants updated:', updatedParticipants);
      setParticipants(updatedParticipants || []); 
    });

    // Listen for host transfer updates
    socket.on('host_transferred', ({ newHostId, participants: updatedParticipants }) => {
      console.log(`Host transferred to ${newHostId}. Participants:`, updatedParticipants);
      setParticipants(updatedParticipants || []);
      
      const amINewHost = socket.id === newHostId;
      console.log(`This client ${amINewHost ? 'IS' : 'IS NOT'} the new host.`);
      setIsHost(amINewHost);
      
      // If I become host, ensure my view reflects the current state
      if (amINewHost) {
        setIsSyncedToHost(true); // Host is always synced to self
        // Ensure currentContentInfo matches hostSelectedContentInfo
        // This should already be the case if host_content_updated was received, but double-check
        if (currentContentInfo?.id !== hostSelectedContentInfo?.id || currentContentInfo?.type !== hostSelectedContentInfo?.type) {
           setCurrentContentInfo(hostSelectedContentInfo);
           // Fetch content if needed
           if (hostSelectedContentInfo) {
             fetchFullContent(hostSelectedContentInfo.type, hostSelectedContentInfo.id);
           } else {
             setCurrentFullContent(null);
           }
        }
      }
    });

    // Generic error handler from server
    socket.on('error', ({ message }) => {
      console.error('Server error:', message);
      setError(message);
    });


    // Cleanup listeners on socket change or unmount
    return () => {
      socket.off('session-created');
      socket.off('session-joined');
      socket.off('session-not-found');
      socket.off('username-taken');
      // socket.off('host-dua-updated'); // Replaced
      socket.off('host_content_updated'); // New
      socket.off('host_index_updated'); // New
      socket.off('update_participants');
      socket.off('host_transferred'); 
      socket.off('error'); // Cleanup generic error handler
    };
    // Adding isSyncedToHost back based on ESLint warning, although listener callbacks should have access via closure.
    // Removed fetchFullContent from dependencies as it's defined inside useCallback now
  }, [socket, isSyncedToHost]); 

  // Effect to handle initial content load after joining a session
  useEffect(() => {
    if (initialLoadNeeded.current && currentContentInfo) {
      console.log("Initial load needed, fetching content:", currentContentInfo);
      fetchFullContent(currentContentInfo.type, currentContentInfo.id);
      initialLoadNeeded.current = false; // Mark as loaded
    }
  }, [currentContentInfo]); // Run when currentContentInfo is set after join

  // --- Helper Function to Fetch Full Content ---
  const fetchFullContent = useCallback(async (type, id) => {
    if (!type || !id) {
      setCurrentFullContent(null);
      return;
    }

    console.log(`Fetching full content for type: ${type}, id: ${id}`);
    setIsLoadingContent(true);
    setError(null); // Clear previous errors

    try {
      if (type === 'dua') {
        // Fetch Dua content locally for now
        const duaData = localContentMap[id]; // Use imported map
        if (duaData) {
          // Simulate async fetch slightly
          await new Promise(resolve => setTimeout(resolve, 50)); 
          setCurrentFullContent({
            ...duaData, // Spread basic info
            // Ensure verses are in a consistent format if needed, e.g., { arabic: [], transliteration: [], translation: [] }
            // Assuming duaData structure matches required format for DuaSyncApp
            verses: { // Example structure if needed
              arabic: duaData.arabic || [],
              transliteration: duaData.transliteration || [],
              translation: duaData.translation || [],
            },
            totalAyahs: duaData.arabic?.length || 0 // Use verses length for Duas
          });
        } else {
          throw new Error(`Dua with ID ${id} not found locally.`);
        }
      } else if (type === 'quran') {
        // Fetch Quran content from server via socket
        if (socket) {
          socket.emit('get_quran_content', { surahId: id }, (response) => {
            if (response.error) {
              console.error('Error fetching Quran content:', response.error);
              setError(`Error fetching Surah ${id}: ${response.error}`);
              setCurrentFullContent(null);
            } else if (response.data) {
              console.log(`Received Quran content for Surah ${id}`);
              // Adapt server response structure if needed
              setCurrentFullContent({
                id: response.data.id,
                title: response.data.title,
                arabicTitle: response.data.arabicTitle,
                totalAyahs: response.data.totalAyahs,
                // Assuming response.data.verses is the array [{ayah, arabic, transliteration, translation}, ...]
                verses: response.data.verses 
              });
            }
             setIsLoadingContent(false);
          });
          // Note: setIsLoadingContent(false) is called inside the callback
          return; // Exit early as fetch is async via socket callback
        } else {
           throw new Error("Socket not connected for Quran fetch.");
        }
      } else {
        throw new Error(`Unknown content type: ${type}`);
      }
    } catch (err) {
      console.error('Error fetching full content:', err);
      setError(`Failed to load content: ${err.message}`);
      setCurrentFullContent(null);
    } finally {
      // Ensure loading is set to false if not handled by socket callback
      if (type !== 'quran') { 
         setIsLoadingContent(false);
      }
    }
  }, [socket]); // REMOVED fetchFullContent from its own dependency array

  // --- Context Actions ---
  const createSession = useCallback((user) => {
    if (socket && user) {
      console.log(`Attempting to create session as ${user}`);
      setError(null); // Clear errors on new action
      socket.emit('create-session', { username: user });
    }
  }, [socket]);

  const joinSession = useCallback((id, user) => {
    if (socket && id && user) {
      console.log(`Attempting to join session ${id} as ${user}`);
      setError(null); // Clear errors on new action
      socket.emit('join-session', { sessionId: id, username: user });
    }
  }, [socket]);

  // Renamed: Selects Dua or Quran as Host
  const selectContentAsHost = useCallback((contentInfo) => { // Expects { type, id, title }
    if (socket && isHost && sessionId && contentInfo) {
      console.log(`Host selecting ${contentInfo.type}: ${contentInfo.title} (ID: ${contentInfo.id})`);
      setError(null);
      socket.emit('select_content', { sessionId, contentInfo });
      // Host's view updates via 'host_content_updated' event listener, which also triggers fetchFullContent
    } else if (socket && isHost && sessionId && !contentInfo) {
      // Handle host deselecting content
      console.log(`Host deselecting content.`);
      setError(null);
      socket.emit('select_content', { sessionId, contentInfo: null });
    }
  }, [socket, isHost, sessionId]);

  // Renamed: Selects Dua or Quran Locally (Participant)
  const selectContentLocally = useCallback((contentInfo) => { // Expects { type, id, title }
    if (!isHost && contentInfo) {
      console.log(`Locally selecting ${contentInfo.type}: ${contentInfo.title} (ID: ${contentInfo.id}). Unsyncing from host.`);
      setError(null);
      setCurrentContentInfo(contentInfo);
      setIsSyncedToHost(false);
      // Fetch the full content for local view
      fetchFullContent(contentInfo.type, contentInfo.id);
    }
  }, [isHost, fetchFullContent]);

  // Sync back to Host's state
  const syncToHost = useCallback(() => {
    if (!isHost) {
      console.log('Syncing to host content.');
      setError(null);
      setIsSyncedToHost(true);
      setCurrentContentInfo(hostSelectedContentInfo); // Update local info
      // Use the index from the host's info if available, otherwise default to 0
      const hostIndex = hostSelectedContentInfo?.currentIndex ?? 0; 
      setCurrentIndex(hostIndex); // Sync index too
      // Fetch content if needed
      if (hostSelectedContentInfo) {
        fetchFullContent(hostSelectedContentInfo.type, hostSelectedContentInfo.id);
      } else {
        setCurrentFullContent(null); // Clear content if host has nothing selected
      }
    }
  }, [isHost, hostSelectedContentInfo, fetchFullContent]);


  // Action for Host to update the index
  const updateHostIndex = useCallback((newIndex) => {
    if (socket && isHost && sessionId && typeof newIndex === 'number') {
      // Optimistically update local state for responsiveness? Or wait for echo?
      // Let's wait for echo via 'host_index_updated' listener for consistency.
      // setCurrentIndex(newIndex); // Optional optimistic update
      console.log(`Host emitting index update: ${newIndex}`);
      socket.emit('host_update_index', { sessionId, newIndex });
    }
  }, [socket, isHost, sessionId]);

  // Action for Participant to update their local index (and unsync)
  const updateLocalIndex = useCallback((newIndex) => {
    // Allow local navigation even if synced, but unsync them upon navigation
    if (!isHost && typeof newIndex === 'number') { 
       // Validate against currentFullContent length?
       const maxIndex = currentFullContent?.totalAyahs ? currentFullContent.totalAyahs - 1 : (currentFullContent?.verses?.arabic?.length ? currentFullContent.verses.arabic.length - 1 : 0);
       if (newIndex >= 0 && newIndex <= maxIndex) {
           console.log(`Participant updating local index: ${newIndex}. Unsyncing.`);
           setCurrentIndex(newIndex);
           setIsSyncedToHost(false); // <-- Add this line to unsync
       }
    }
  }, [isHost, isSyncedToHost, currentFullContent]);

  // Action to get Quran metadata list
  const getQuranMetadata = useCallback(() => {
    if (socket && quranSurahList.length === 0) { // Fetch only if not already loaded
      console.log('Requesting Quran metadata from server...');
      setError(null);
      socket.emit('get_quran_metadata', (response) => {
        if (response.error) {
          console.error('Error fetching Quran metadata:', response.error);
          setError(`Failed to load Quran list: ${response.error}`);
          setQuranSurahList([]);
        } else if (response.data) {
          console.log('Received Quran metadata.');
          setQuranSurahList(response.data);
        }
      });
    }
  }, [socket, quranSurahList]);


  const contextValue = {
    socket,
    connected,
    sessionId,
    username,
    isHost, 
    hostSelectedContentInfo, // Info about host's selection
    currentContentInfo,      // Info about locally viewed content
    currentFullContent,      // Full data for local view
    currentIndex,            // Current index/ayah number
    isSyncedToHost,
    participants, 
    quranSurahList,          // List of Surah metadata
    isLoadingContent,        // Loading state
    error,                   // Error state
    // Actions
    createSession,
    joinSession,
    selectContentAsHost,     // Renamed
    selectContentLocally,    // Renamed
    syncToHost,
    updateHostIndex,         // New action for host navigation
    updateLocalIndex,        // New action for participant navigation
    getQuranMetadata,        // New action
    // fetchFullContent is used internally, maybe not expose directly?
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
