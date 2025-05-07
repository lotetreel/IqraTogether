import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
// Import offline storage utils (still needed for potential future use or other features)
import * as offlineStorage from '../utils/offlineStorage';
// Import duaCollection temporarily to fetch Dua content locally
import { duaCollection, contentMap as localContentMap } from '../data/duaCollection';
// REMOVED old Quran JSON imports
// Import the Surah list metadata
import quranSurahListLocal from '../data/quranSurahList.json';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

// --- Helper Function to Parse Text Data ---
// Parses a text file content (like quran-uthmani.txt) into an object keyed by surah, then ayah
const parseQuranTextFile = (textContent) => {
  if (!textContent) return {};
  const lines = textContent.trim().split('\n');
  const data = {};
  lines.forEach(line => {
    const parts = line.split('|');
    if (parts.length === 3) {
      const [surah, ayah, text] = parts;
      if (!data[surah]) {
        data[surah] = {};
      }
      data[surah][ayah] = text.trim();
    }
  });
  return data;
};


// --- Helper Function to Merge Local Quran Data ---
// (Removes Bismillah prefix from Arabic verse 1 and adds a flag)
const getMergedSurahDataLocally = (surahId, parsedUthmaniData, parsedQaraiData, parsedTranslitData) => {
  const meta = quranSurahListLocal.find(s => s.id === surahId);
  if (!meta) {
    console.error(`Local Surah metadata not found for ID: ${surahId}`);
    return null;
  }

  const arabicAyahs = parsedUthmaniData[surahId] || {};
  const translitAyahs = parsedTranslitData[surahId] || {};
  const translationAyahs = parsedQaraiData[surahId] || {};

  const totalAyahs = meta.totalAyahs;
  let displayBismillahFlag = false;
  const bismillahArabicPrefix = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ "; // Note the space

  // Optional: Add a check for ayah count consistency if needed, though relying on metadata is safer
  if (Object.keys(arabicAyahs).length !== totalAyahs ||
      Object.keys(translitAyahs).length !== totalAyahs ||
      Object.keys(translationAyahs).length !== totalAyahs) {
    console.warn(`Ayah count mismatch for Surah ID: ${surahId}. Metadata: ${totalAyahs}, Arabic: ${Object.keys(arabicAyahs).length}, Translit: ${Object.keys(translitAyahs).length}, Translation: ${Object.keys(translationAyahs).length}. Merging based on metadata count.`);
  }

  // Merge verse data by iterating from 1 to totalAyahs
  const mergedVerses = [];
  for (let i = 1; i <= totalAyahs; i++) { // Loop through original number of ayahs
      const ayahKey = String(i);
      let currentArabicText = arabicAyahs[ayahKey] ?? '';

      // Check and remove Bismillah prefix for verse 1 (except Surah 1 & 9)
      if (i === 1 && surahId !== '1' && surahId !== '9') {
          if (currentArabicText.startsWith(bismillahArabicPrefix)) {
              currentArabicText = currentArabicText.substring(bismillahArabicPrefix.length).trim();
              displayBismillahFlag = true; // Set flag to show Bismillah separately
              console.log(`Removed Bismillah prefix for Surah ${surahId} verse 1`);
          }
      }

      const translitText = translitAyahs[ayahKey] ?? '';
      const translationText = translationAyahs[ayahKey] ?? '';

      mergedVerses.push({
          ayah: i, // Keep original ayah number
          arabic: currentArabicText, // Use potentially modified Arabic text
          transliteration: translitText,
          translation: translationText,
      });
  }

  return {
    id: meta.id,
    title: meta.title,
    arabicTitle: meta.arabic,
    totalAyahs: totalAyahs, // Use original total count
    verses: mergedVerses,
    displayBismillah: displayBismillahFlag // Add the flag to the returned object
  };
};
// --- End Helper Function ---


// --- External Helper Function for Fetching (Simplified) ---
// Now accepts preloaded text data for Quran
const _performFetch = async (type, id, setIsLoadingContent, setCurrentFullContent, setError, quranUthmaniData, enQaraiData, enTransliterationData) => {
  if (!type || !id) {
    setCurrentFullContent(null); setIsLoadingContent(false); return;
  }

  console.log(`Loading content locally for type: ${type}, id: ${id}`);
  setIsLoadingContent(true); setError(null);

  try {
    if (type === 'dua') {
      // Load Dua directly from imported data
      console.log(`Attempting to load Dua ${id} from local map.`);
      const duaData = localContentMap[id];
      if (duaData) {
        // Simulate async loading slightly if needed for UI consistency
        await new Promise(resolve => setTimeout(resolve, 10));
        setCurrentFullContent({ ...duaData, verses: { arabic: duaData.arabic || [], transliteration: duaData.transliteration || [], translation: duaData.translation || [] }, totalAyahs: duaData.arabic?.length || 0 });
        console.log(`Dua ${id} loaded from local map.`);
      } else {
        throw new Error(`Dua with ID ${id} not found locally.`);
      }
    } else if (type === 'quran') {
      // Load Quran data using the preloaded text data
      console.log(`Attempting to load Quran ${id} from preloaded text data.`);
      // Check if preloaded data is available
      if (!quranUthmaniData || !enQaraiData || !enTransliterationData) {
         throw new Error(`Quran text data not preloaded yet.`);
      }
      const mergedData = getMergedSurahDataLocally(id, quranUthmaniData, enQaraiData, enTransliterationData);
      if (mergedData) {
        // Simulate async loading slightly
        await new Promise(resolve => setTimeout(resolve, 10));
        setCurrentFullContent(mergedData);
        console.log(`Quran ${id} loaded successfully from preloaded text.`);
      } else {
        throw new Error(`Quran Surah with ID ${id} not found or failed to merge from preloaded text.`);
      }
    } else {
      throw new Error(`Unknown content type: ${type}`);
    }
  } catch (err) {
    console.error('Error loading local content:', err);
    setError(`Failed to load content: ${err.message}`);
    setCurrentFullContent(null);
  } finally {
    // Always set loading to false after attempting to load
    setIsLoadingContent(false);
  }
};
// --- End External Helper Function ---


// --- Helper Function to Generate UUID ---
const generateUUID = () => {
  // Basic UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected', 'error'
  const [hasAttemptedConnection, setHasAttemptedConnection] = useState(false); // NEW: Track if connection was tried
  const [sessionId, setSessionId] = useState(null);
  const [clientGeneratedId, setClientGeneratedId] = useState(null); // For persistent client identity
  const [username, setUsername] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [hasAttemptedRejoin, setHasAttemptedRejoin] = useState(false); // Track if a rejoin was tried for the current connection
  const [isAttemptingRejoin, setIsAttemptingRejoin] = useState(false); // True if actively trying to rejoin from localStorage
  const [hostSelectedContentInfo, setHostSelectedContentInfo] = useState(null);
  const [currentContentInfo, setCurrentContentInfo] = useState(null); // Info for locally viewed content
  const [currentFullContent, setCurrentFullContent] = useState(null); // Holds the *full* fetched data (verses, etc.)
  const [currentIndex, setCurrentIndex] = useState(0); // User's current index (local or synced)
  const [latestHostIndex, setLatestHostIndex] = useState(0); // Store the most recent index received from host
  const [isSyncedToHost, setIsSyncedToHost] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [quranSurahList, setQuranSurahList] = useState(quranSurahListLocal);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [error, setError] = useState(null);

  // NEW: State for preloaded text file content
  const [quranUthmaniText, setQuranUthmaniText] = useState(null);
  const [enQaraiText, setEnQaraiText] = useState(null);
  const [enTransliterationText, setEnTransliterationText] = useState(null);
  const [isTextDataLoading, setIsTextDataLoading] = useState(true); // Loading state for text files

  // NEW: Parsed data state
  const [quranUthmaniData, setQuranUthmaniData] = useState({});
  const [enQaraiData, setEnQaraiData] = useState({});
  const [enTransliterationData, setEnTransliterationData] = useState({});


  // NEW: State to trigger fetching content
  const [fetchTrigger, setFetchTrigger] = useState(null); // { type, id } | null

  // Effect to manage clientGeneratedId
  useEffect(() => {
    let storedClientId = localStorage.getItem('iqraTogether_clientGeneratedId');
    if (!storedClientId) {
      storedClientId = generateUUID();
      localStorage.setItem('iqraTogether_clientGeneratedId', storedClientId);
    }
    setClientGeneratedId(storedClientId);
    console.log('Client Generated ID initialized:', storedClientId);
  }, []);

  // Effect to preload text files on mount
  useEffect(() => {
    const loadTextFiles = async () => {
      setIsTextDataLoading(true);
      setError(null); // Clear previous errors
      try {
        console.log("Fetching Quran text files...");
        const [uthmaniRes, qaraiRes, translitRes] = await Promise.all([
          fetch('/data/quran-uthmani.txt'),
          fetch('/data/en.qarai.txt'),
          fetch('/data/en.transliteration.txt')
        ]);

        if (!uthmaniRes.ok || !qaraiRes.ok || !translitRes.ok) {
          throw new Error(`Failed to fetch one or more text files: Uthmani (${uthmaniRes.status}), Qarai (${qaraiRes.status}), Translit (${translitRes.status})`);
        }

        const uthmani = await uthmaniRes.text();
        const qarai = await qaraiRes.text();
        const translit = await translitRes.text();

        console.log("Parsing Quran text files...");
        setQuranUthmaniData(parseQuranTextFile(uthmani));
        setEnQaraiData(parseQuranTextFile(qarai));
        setEnTransliterationData(parseQuranTextFile(translit));

        // Keep raw text if needed later, though parsed data is primary now
        setQuranUthmaniText(uthmani);
        setEnQaraiText(qarai);
        setEnTransliterationText(translit);

        console.log("Quran text files loaded and parsed successfully.");
      } catch (err) {
        console.error("Error loading or parsing Quran text files:", err);
        setError(`Failed to load essential Quran data: ${err.message}`);
        // Set parsed data to empty objects on error
        setQuranUthmaniData({});
        setEnQaraiData({});
        setEnTransliterationData({});
      } finally {
        setIsTextDataLoading(false);
      }
    };
    loadTextFiles();
  }, []); // Empty dependency array ensures this runs only once on mount

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
        console.log('Socket connected successfully. Socket ID:', newSocket.id);
        // Rejoin attempt will be handled by another useEffect that depends on connectionStatus, clientGeneratedId, and socket
      });
      newSocket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${reason}`);
        setConnectionStatus('disconnected');
        setHasAttemptedRejoin(false); // Allow rejoin attempt on next successful connection
        // Reset only state that is invalid without connection
        setParticipants([]);
        // Keep session state (sessionId, username, isHost, content info, index)
        // Set error to inform user
        if (reason !== 'io client disconnect' && reason !== 'io server disconnect') { // Don't show error if user intentionally disconnected or server initiated it (e.g. for rejoin)
             setError("Connection lost. Attempting to reconnect...");
        }
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

  // Effect to attempt rejoin when socket connects and we have a clientGeneratedId
  useEffect(() => {
    if (socket && connectionStatus === 'connected' && clientGeneratedId && !hasAttemptedRejoin) {
      setHasAttemptedRejoin(true); // Mark that we will attempt/evaluate rejoin for this connection cycle
      const storedSessionId = localStorage.getItem('iqraTogether_sessionId');
      const storedUserId = localStorage.getItem('iqraTogether_userId');
      const storedUsername = localStorage.getItem('iqraTogether_username');
      const storedIsHost = localStorage.getItem('iqraTogether_isHost');

      if (storedSessionId && storedUserId && storedUsername && storedIsHost && storedUserId === clientGeneratedId) {
        console.log(`Attempting to rejoin session ${storedSessionId} as user ${storedUsername} (User ID: ${clientGeneratedId})`);
        setIsAttemptingRejoin(true); // Set flag before emitting
        socket.emit('attempt-rejoin', {
          sessionId: storedSessionId,
          userId: clientGeneratedId,
          username: storedUsername,
          isHost: JSON.parse(storedIsHost)
        });
      } else {
        console.log('No valid session details in localStorage to attempt rejoin, or clientGeneratedId mismatch.');
        setIsAttemptingRejoin(false); // No attempt will be made
        // Clear potentially inconsistent localStorage only if there's a mismatch with clientGeneratedId but other data exists
        if (storedUserId && storedUserId !== clientGeneratedId) {
            localStorage.removeItem('iqraTogether_sessionId');
            localStorage.removeItem('iqraTogether_userId');
            localStorage.removeItem('iqraTogether_username');
            localStorage.removeItem('iqraTogether_isHost');
        }
      }
    }
  }, [socket, connectionStatus, clientGeneratedId, hasAttemptedRejoin]);


  // Effect to set up application-specific event listeners *after* connection
  useEffect(() => {
    if (!socket || connectionStatus !== 'connected') return;
    console.log("Setting up application-specific socket listeners...");

    const handleSessionCreated = ({ sessionId: newSessionId, username: hostUsername, userId: confirmedUserId }) => {
      console.log(`Session created: ${newSessionId} by ${hostUsername} (User ID: ${confirmedUserId})`);
      setSessionId(newSessionId); setUsername(hostUsername); setIsHost(true); setIsSyncedToHost(true);
      setHostSelectedContentInfo(null); setCurrentContentInfo(null); setCurrentFullContent(null);
      setCurrentIndex(0); setParticipants([]); setError(null); setFetchTrigger(null);
      if (clientGeneratedId) {
        localStorage.setItem('iqraTogether_sessionId', newSessionId);
        localStorage.setItem('iqraTogether_userId', clientGeneratedId); // Use our stable clientGeneratedId
        localStorage.setItem('iqraTogether_username', hostUsername);
        localStorage.setItem('iqraTogether_isHost', JSON.stringify(true));
        console.log('Session details stored in localStorage after creation.');
      } else {
        console.warn('clientGeneratedId not available when storing session details post-creation.');
      }
    };

    const handleSessionJoined = ({ sessionId: joinedSessionId, username: joinedUsername, userId: confirmedUserId, hostSelectedContent: currentHostContentInfo, currentIndex: hostCurrentIndex, isHost: userIsHost, contentSelected, participants: initialParticipants }) => {
      console.log(`${joinedUsername} (User ID: ${confirmedUserId}) joined session ${joinedSessionId}. Host Content: ${currentHostContentInfo?.id}, Index: ${hostCurrentIndex}, Is Host: ${userIsHost}`);
      setSessionId(joinedSessionId); setUsername(joinedUsername); setIsHost(userIsHost);
      setHostSelectedContentInfo(currentHostContentInfo);
      setLatestHostIndex(hostCurrentIndex ?? 0);
      setIsSyncedToHost(true);
      setCurrentContentInfo(currentHostContentInfo);
      setCurrentIndex(hostCurrentIndex ?? 0);
      setError(null);
      setParticipants(initialParticipants || []);
      if (clientGeneratedId) {
        localStorage.setItem('iqraTogether_sessionId', joinedSessionId);
        localStorage.setItem('iqraTogether_userId', clientGeneratedId); 
        localStorage.setItem('iqraTogether_username', joinedUsername);
        localStorage.setItem('iqraTogether_isHost', JSON.stringify(userIsHost));
        console.log('Session details stored in localStorage after joining.');
      } else {
        console.warn('clientGeneratedId not available when storing session details post-join.');
      }

      if (contentSelected && currentHostContentInfo) {
        if (currentHostContentInfo.type === 'alkafi_chapter' && currentHostContentInfo.fullContentForAlKafi) {
          console.log('Setting AlKafi chapter content directly on session join (fullContentForAlKafi provided).');
          setCurrentFullContent(currentHostContentInfo.fullContentForAlKafi);
          setIsLoadingContent(false);
          setFetchTrigger(null); // No separate fetch needed
        } else if (currentHostContentInfo.type === 'alkafi_chapter' && !currentHostContentInfo.fullContentForAlKafi) {
          console.warn('AlKafi chapter active on session join, but fullContentForAlKafi missing. Client cannot load.');
          setError('Failed to load AlKafi chapter from session: Data missing.');
          setCurrentFullContent(null);
          setFetchTrigger(null);
        } else {
          setFetchTrigger({ type: currentHostContentInfo.type, id: currentHostContentInfo.id });
        }
      } else {
        setCurrentFullContent(null); setFetchTrigger(null);
      }
    };

    const handleSessionRejoined = ({ sessionId: rejoinedSessionId, username: rejoinedUsername, userId: confirmedUserId, hostSelectedContent: currentHostContentInfo, currentIndex: hostCurrentIndex, isHost: userIsHost, contentSelected, participants: initialParticipants, message }) => {
      console.log(message || `${rejoinedUsername} (User ID: ${confirmedUserId}) REJOINED session ${rejoinedSessionId}. Host Content: ${currentHostContentInfo?.id}, Index: ${hostCurrentIndex}, Is Host: ${userIsHost}`);
      setSessionId(rejoinedSessionId); setUsername(rejoinedUsername); setIsHost(userIsHost);
      setHostSelectedContentInfo(currentHostContentInfo);
      setLatestHostIndex(hostCurrentIndex ?? 0);
      setIsSyncedToHost(true);
      setCurrentContentInfo(currentHostContentInfo);
      setCurrentIndex(hostCurrentIndex ?? 0);
      setError(null);
      setParticipants(initialParticipants || []);
      // setHasAttemptedRejoin(true); // Already set when attempt was initiated
      setIsAttemptingRejoin(false); // Rejoin attempt finished (successfully)

      if (clientGeneratedId) { // Ensure clientGeneratedId is available
        localStorage.setItem('iqraTogether_sessionId', rejoinedSessionId);
        localStorage.setItem('iqraTogether_userId', clientGeneratedId);
        localStorage.setItem('iqraTogether_username', rejoinedUsername);
        localStorage.setItem('iqraTogether_isHost', JSON.stringify(userIsHost));
        console.log('Session details confirmed/updated in localStorage after rejoining.');
      }

      if (contentSelected && currentHostContentInfo) {
        setFetchTrigger({ type: currentHostContentInfo.type, id: currentHostContentInfo.id });
      } else {
        setCurrentFullContent(null); setFetchTrigger(null);
      }
    };

    const handleRejoinFailed = ({ sessionId: triedSessionId, reason }) => {
      console.error(`Failed to rejoin session ${triedSessionId}: ${reason}`);
      setError(`Failed to rejoin: ${reason}. Try joining manually or start a new session.`);
      localStorage.removeItem('iqraTogether_sessionId');
      localStorage.removeItem('iqraTogether_userId');
      localStorage.removeItem('iqraTogether_username');
      localStorage.removeItem('iqraTogether_isHost');
      console.log('Cleared stored session details from localStorage due to rejoin failure.');
      setSessionId(null);
      // setUsername(null); // Keep username for manual re-entry if desired
      setIsHost(false);
      setHostSelectedContentInfo(null); setCurrentContentInfo(null); setCurrentFullContent(null);
      setCurrentIndex(0); setParticipants([]);
      // setHasAttemptedRejoin(true); // Already set when attempt was initiated
      setIsAttemptingRejoin(false); // Rejoin attempt finished (failed)
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
      setLatestHostIndex(newHostIndex ?? 0); 
      setError(null);
      if (isSyncedToHost) {
        setCurrentContentInfo(newHostContentInfo);
        setCurrentIndex(newHostIndex ?? 0); 
        if (newHostContentInfo) {
          // If it's an AlKafi chapter AND the full content is provided by the server
          if (newHostContentInfo.type === 'alkafi_chapter' && newHostContentInfo.fullContentForAlKafi) {
            console.log('Setting AlKafi chapter content directly from host update (fullContentForAlKafi provided).');
            setCurrentFullContent(newHostContentInfo.fullContentForAlKafi);
            setIsLoadingContent(false); 
            setFetchTrigger(null); // No separate fetch needed
          } else if (newHostContentInfo.type === 'alkafi_chapter' && !newHostContentInfo.fullContentForAlKafi) {
            console.warn('AlKafi chapter selected by host, but fullContentForAlKafi missing. Client cannot load this content type via _performFetch.');
            setError('Failed to load AlKafi chapter: Data missing from host update.');
            setCurrentFullContent(null);
            setFetchTrigger(null);
          } else {
            // For other types like 'quran' or 'dua'
            setFetchTrigger({ type: newHostContentInfo.type, id: newHostContentInfo.id });
          }
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
    socket.on('session-rejoined', handleSessionRejoined); // NEW
    socket.on('rejoin-failed', handleRejoinFailed);     // NEW

    // Define handleSessionNotFound INSIDE useEffect to access isHost state
    const handleSessionNotFoundListener = ({ sessionId: triedSessionId }) => {
       console.error(`Server reported session ${triedSessionId} not found (manual join/other).`);
       if (isHost) {
         setError(`Session "${triedSessionId}" not found on server. Please try Rejoin Session again or start a new session.`);
       } else {
         setError(`Session "${triedSessionId}" not found. Please wait for the host to start/rejoin the session, then try rejoining again using the button in the header.`);
       }
       setParticipants([]);
       // Clear local storage if a manual join fails with session-not-found
       localStorage.removeItem('iqraTogether_sessionId');
       localStorage.removeItem('iqraTogether_userId');
       localStorage.removeItem('iqraTogether_username');
       localStorage.removeItem('iqraTogether_isHost');
       setSessionId(null); setIsHost(false); // Reset local state too
     };

    socket.on('session-not-found', handleSessionNotFoundListener);
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
      socket.off('session-rejoined', handleSessionRejoined); // NEW
      socket.off('rejoin-failed', handleRejoinFailed);     // NEW
      socket.off('session-not-found', handleSessionNotFoundListener);
      socket.off('username-taken', handleUsernameTaken);
      socket.off('host_content_updated', handleHostContentUpdated);
      socket.off('host_index_updated', handleHostIndexUpdated);
      socket.off('update_participants', handleUpdateParticipants);
      socket.off('host_transferred', handleHostTransferred);
      socket.off('error', handleServerError);
    };
  }, [socket, connectionStatus, isSyncedToHost, isHost]); // Added isHost

  // Effect: Trigger fetch when fetchTrigger state changes
  useEffect(() => {
    if (fetchTrigger?.type && fetchTrigger?.id) {
      console.log("Fetch trigger activated:", fetchTrigger);
      _performFetch(
        fetchTrigger.type,
        fetchTrigger.id,
        setIsLoadingContent,
        setCurrentFullContent,
        setError,
        quranUthmaniData,
        enQaraiData,
        enTransliterationData
      );
    }
  }, [fetchTrigger, quranUthmaniData, enQaraiData, enTransliterationData]);

  // --- Context Actions ---
  const createSession = useCallback((user) => {
    if (socket && connectionStatus === 'connected' && user && clientGeneratedId) {
      console.log(`Attempting to create session as ${user} (User ID: ${clientGeneratedId})`); setError(null);
      socket.emit('create-session', { username: user, userId: clientGeneratedId });
    } else { console.warn('Cannot create session: Socket not connected, user, or clientGeneratedId missing.'); }
  }, [socket, connectionStatus, clientGeneratedId]);

  const joinSession = useCallback((id, user, isJoiningAsHost = false) => {
    if (socket && connectionStatus === 'connected' && id && user && clientGeneratedId) {
      console.log(`Attempting to join session ${id} as ${user} (User ID: ${clientGeneratedId}). Is Host Rejoin: ${isJoiningAsHost}`); setError(null);
      socket.emit('join-session', { sessionId: id, username: user, userId: clientGeneratedId, isHostAttemptingRejoin: isJoiningAsHost });
    } else { console.warn('Cannot join session: Socket not connected, details, or clientGeneratedId missing.'); }
  }, [socket, connectionStatus, clientGeneratedId]);

  const selectContentAsHost = useCallback((contentInfo, fullDataOverride = null) => {
    if (socket && connectionStatus === 'connected' && isHost && sessionId) {
      if (contentInfo) {
        console.log(`Host selecting ${contentInfo.type}: ${contentInfo.title} (ID: ${contentInfo.id})`);
        setError(null);
        const newIndex = contentInfo.currentIndex !== undefined ? contentInfo.currentIndex : 0;
        // For alkafi_chapter, currentIndex is not applicable in the same way for individual phrase navigation
        if (contentInfo.type !== 'alkafi_chapter') {
          setCurrentIndex(newIndex);
          setLatestHostIndex(newIndex);
        } else {
          setCurrentIndex(0); // Default for chapter view
          setLatestHostIndex(0);
        }
        
        if ((contentInfo.type === 'alkafi_chapter' || contentInfo.type === 'alkafi') && fullDataOverride) {
          console.log(`Host setting ${contentInfo.type} content directly with fullDataOverride.`);
          setCurrentFullContent(fullDataOverride);
          setIsLoadingContent(false); 
          socket.emit('select_content', { sessionId, contentInfo, fullContentForAlKafi: fullDataOverride });
        } else {
          socket.emit('select_content', { sessionId, contentInfo });
        }
      } else {
        console.log(`Host deselecting content.`); setError(null);
        setCurrentIndex(0);
        setLatestHostIndex(0);
        socket.emit('select_content', { sessionId, contentInfo: null });
        setCurrentContentInfo(null); setCurrentFullContent(null); setFetchTrigger(null);
      }
    } else { console.warn('Cannot select content as host: Socket not connected or not host.'); }
  }, [socket, connectionStatus, isHost, sessionId]);

  const selectContentLocally = useCallback((contentInfo, fullDataOverride = null) => {
    if (contentInfo) {
      console.log(`Locally selecting ${contentInfo.type}: ${contentInfo.title} (ID: ${contentInfo.id}).`);
      setError(null);
      setCurrentContentInfo(contentInfo);
      // Use currentIndex from contentInfo if available (for AlKafi), otherwise default to 0
      setCurrentIndex(contentInfo.currentIndex !== undefined ? contentInfo.currentIndex : 0);

      if (sessionId && connectionStatus === 'connected' && !isHost) {
        console.log("Unsyncing from host due to local selection.");
        setIsSyncedToHost(false);
      }

      if (fullDataOverride && (contentInfo.type === 'alkafi_chapter' || contentInfo.type === 'alkafi')) { 
        console.log(`Setting ${contentInfo.type} content directly with fullDataOverride for local view.`);
        setCurrentFullContent(fullDataOverride);
        setIsLoadingContent(false); 
        setFetchTrigger(null); 
      } else {
        const correctedType = contentInfo.type === 'surah' ? 'quran' : contentInfo.type;
        if ((correctedType === 'alkafi_chapter' || correctedType === 'alkafi') && !fullDataOverride) {
            console.warn(`${correctedType} selected without fullDataOverride. This might lead to issues.`);
            setCurrentFullContent(null); 
            setIsLoadingContent(false);
            setFetchTrigger(null);
        } else {
            setFetchTrigger({ type: correctedType, id: contentInfo.id });
        }
      }
    } else {
      console.log("Locally deselecting content.");
      setCurrentContentInfo(null);
      setCurrentFullContent(null); 
      setFetchTrigger(null); 
      setCurrentIndex(0);
    }
  }, [connectionStatus, isHost, sessionId]);
  
  const syncToHost = useCallback(() => {
    if (!isHost && hostSelectedContentInfo) {
      console.log('Syncing to host content. Host index:', latestHostIndex);
      setError(null);
      setIsSyncedToHost(true);
      setCurrentContentInfo(hostSelectedContentInfo);
      setCurrentIndex(latestHostIndex); 
      
      if ((hostSelectedContentInfo.type === 'alkafi_chapter' || hostSelectedContentInfo.type === 'alkafi') && hostSelectedContentInfo.fullContentForAlKafi) {
        console.log(`Syncing to ${hostSelectedContentInfo.type} content, using fullContentForAlKafi from host.`);
        setCurrentFullContent(hostSelectedContentInfo.fullContentForAlKafi);
        setIsLoadingContent(false);
        setFetchTrigger(null);
      } else if (hostSelectedContentInfo) {
        setFetchTrigger({ type: hostSelectedContentInfo.type, id: hostSelectedContentInfo.id });
      } else {
         setCurrentFullContent(null); 
         setFetchTrigger(null);
      }
    } else if (!isHost && !hostSelectedContentInfo) {
      console.log('Syncing to host (no content selected).');
      setError(null);
      setIsSyncedToHost(true);
      setCurrentContentInfo(null);
      setCurrentFullContent(null);
      setFetchTrigger(null);
    } else {
      console.warn("Cannot sync to host: Conditions not met.");
    }
  }, [isHost, hostSelectedContentInfo, latestHostIndex]);

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

  // Simplified getQuranMetadata - only fetches if explicitly needed and connected,
  // but primarily relies on the local list.
  const getQuranMetadata = useCallback(() => {
    // Check if we already have the list locally
    if (quranSurahList && quranSurahList.length > 0) {
      console.log("Quran metadata already loaded locally.");
      return; // Already have it
    }

    // If not loaded locally (shouldn't happen with current setup, but for safety)
    // and connected, try fetching from server as a fallback.
    if (socket && connectionStatus === 'connected') {
      console.log('Local Quran metadata missing, requesting from server as fallback...');
      setError(null);
      socket.emit('get_quran_metadata', (response) => {
        if (response.error) {
          console.error('Error fetching Quran metadata fallback:', response.error);
          setError(`Failed to load Quran list fallback: ${response.error}`);
          setQuranSurahList([]); // Ensure it's empty on error
        } else if (response.data) {
          console.log('Received Quran metadata fallback.');
          setQuranSurahList(response.data); // Use server data if local was missing
        }
       });
     } else {
       // Log if socket isn't connected when attempting fallback fetch
       console.warn(`Cannot get Quran metadata fallback: Socket status is ${connectionStatus}.`);
       // Ensure list is empty if it wasn't loaded initially and can't fetch
       if (!quranSurahList || quranSurahList.length === 0) {
         setQuranSurahList([]);
       }
     }
   }, [socket, connectionStatus, quranSurahList]); // Added quranSurahList dependency back

  const contextValue = {
    socket, connectionStatus, connected: connectionStatus === 'connected',
    hasAttemptedConnection, // Expose the flag
    sessionId, username, isHost, hostSelectedContentInfo, currentContentInfo,
    currentFullContent, currentIndex, latestHostIndex, // Expose latestHostIndex if needed by UI, maybe not
    isSyncedToHost, participants, quranSurahList,
    isLoadingContent: isLoadingContent || isTextDataLoading, // Combine loading states
    error,
    isAttemptingRejoin, // Expose new state
    // Actions
    connectToServer, createSession, joinSession, selectContentAsHost,
    selectContentLocally, syncToHost, updateHostIndex, updateLocalIndex,
    getQuranMetadata,
    disconnectSession: useCallback(() => {
      if (socket && sessionId) {
        console.log(`Manually disconnecting from session ${sessionId}`);
        socket.emit('leave-session', { sessionId });
        // Clear local session state immediately
        setSessionId(null);
        setUsername(null);
        setIsHost(false);
        setParticipants([]);
        setHostSelectedContentInfo(null);
        setCurrentContentInfo(null);
        setCurrentFullContent(null);
        setCurrentIndex(0);
        setLatestHostIndex(0);
        setIsSyncedToHost(true); // Reset to default
        setError(null); // Clear any session-related errors
        setFetchTrigger(null);

        // Clear localStorage
        localStorage.removeItem('iqraTogether_sessionId');
        localStorage.removeItem('iqraTogether_userId'); // Keep clientGeneratedId
        localStorage.removeItem('iqraTogether_username');
        localStorage.removeItem('iqraTogether_isHost');
        
        // Optionally, fully disconnect the socket if no immediate reconnect is desired
        // socket.disconnect();
        // setSocket(null); // Or let the disconnect event handler manage this
        // setConnectionStatus('disconnected');
        // setHasAttemptedRejoin(false); // Allow rejoin attempts if user connects again later
        console.log('Session state and localStorage cleared for manual disconnect.');
      }
    }, [socket, sessionId]),
    // fetchTrigger and _performFetch are internal
  };

  // Display loading indicator or error if essential text data failed to load
  if (isTextDataLoading) {
     return <div className="flex items-center justify-center h-screen text-lg font-semibold">Loading Quran Data...</div>;
  }
  // Check error state AFTER loading attempt is finished
  if (!isTextDataLoading && error && error.startsWith("Failed to load essential Quran data")) {
     return <div className="flex items-center justify-center h-screen text-red-600 p-4 text-center">{error}</div>;
  }


  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
