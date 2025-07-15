import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
// Removed Smile icon import, added custom icon import below
// Added Maximize, Minimize, Locate, BookOpen, FileText icons
import { ChevronLeft, ChevronRight, Users, Settings, X, Share2, RefreshCw, Crown, UserPlus, Loader, LogIn, PlusCircle, DownloadCloud, Trash2, CheckCircle, Maximize, Minimize, Locate, BookOpen, FileText } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
// Import offline storage utils (adjust path if needed)
import * as offlineStorage from '../utils/offlineStorage';
// Import Capacitor Filesystem and core utilities
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
// Remove sample content and local data imports if fully relying on context/server
// import { SAMPLE_DUA, SAMPLE_QURAN } from '../data/sampleContent';
import { duaCollection, contentMap } from '../data/duaCollection'; // Import dua data
import ShareDialog from './ShareDialog';
import NameInputDialog from './NameInputDialog';
import ParticipantsDialog from './ParticipantsDialog';
import RejoinDialog from './RejoinDialog'; // Import the new dialog
import ProgressIndicator from './ProgressIndicator';
import DuaSelectionPage from './DuaSelectionPage';
import BackButton from './ui/BackButton';
import ThemeToggle from './ui/ThemeToggle';
import NetworkInfo from './NetworkInfo';
import KidsModeIcon from '../assets/images/KidsModeIcon.png'; // Import the custom icon
import TileMatchingGame from './TileMatchingGame'; // Import the game component
import AlKafiChapterView from './AlKafiChapterView'; // Import AlKafiChapterView
import HadithChapterView from './HadithChapterView'; // Import HadithChapterView
import RefreshBanner from './RefreshBanner';

// For development debugging
const isDev = process.env.NODE_ENV === 'development';

const DuaSyncApp = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Use state and actions from SocketContext
  const {
    socket,
    // connected, // Replaced by connectionStatus check
    sessionId,
    username,
    isHost,
    // Renamed state from context
    hostSelectedContentInfo, // Was hostDua
    currentContentInfo,      // Was currentDua (partially)
    currentFullContent,      // New state holding full data { verses, etc. }
    currentIndex,            // New state for index
    isSyncedToHost,
    participants,
    quranSurahList,          // For potential use, though selection page handles it
    isLoadingContent,        // New loading state
    error: contextError,     // Renamed from error to avoid conflict
    // Renamed actions from context
    createSession,
    joinSession,
    selectContentAsHost,     // Was selectDuaAsHost
    selectContentLocally,    // Was selectDuaLocally
    syncToHost,              // Was contextSyncToHost
    updateHostIndex,         // New action
    updateLocalIndex,        // New action
    getQuranMetadata,        // New action
    connectToServer,         // New action for connecting
    connectionStatus,        // New state for connection status ('disconnected', 'connecting', 'connected', 'error')
    hasAttemptedConnection,  // New flag from context
    isAttemptingRejoin,      // New state: true if actively trying to rejoin from localStorage
    disconnectSession,       // New action to disconnect from session
  } = useSocket();

  // Local UI state
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(false);
  const [recitationMode, setRecitationMode] = useState('scroll'); // 'phrase-by-phrase' or 'scroll'
  const [showSettings, setShowSettings] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showParticipantsDialog, setShowParticipantsDialog] = useState(false);
  const [showNameInputDialog, setShowNameInputDialog] = useState(false);
  const [showJoinInputInHeader, setShowJoinInputInHeader] = useState(false);
  const [sessionUrl, setSessionUrl] = useState('');
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [autoAdvanceInterval, setAutoAdvanceInterval] = useState(10);
  const [localError, setLocalError] = useState(null);
  const [joinSessionId, setJoinSessionId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [showRejoinDialog, setShowRejoinDialog] = useState(false);
  const [isBrowsingLocally, setIsBrowsingLocally] = useState(false);
  const [isKidsMode, setIsKidsMode] = useState(false); // Controls visibility of game tab & potentially other kid features
  // Removed activeTab state
  const [downloadStatus, setDownloadStatus] = useState({
    alRahmanImages: 'idle',
  });
  const [downloadError, setDownloadError] = useState(null);
  const [localKidsImagePath, setLocalKidsImagePath] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false); // State for fullscreen mode
  const [pendingGoToIndex, setPendingGoToIndex] = useState(null); // State to manage index after content load
  const urlCheckPerformed = useRef(false); // Ref to track if URL check has run
  const [localFullContent, setLocalFullContent] = useState(null); // Local state for full content
  const [isImageLoading, setIsImageLoading] = useState(false); // State for kids mode image loading
  const scrollRefs = useRef([]); // Refs for scrolling to specific verses/phrases

  // Go To Modal State
  const [showGoToModal, setShowGoToModal] = useState(false);
  const [goToStep, setGoToStep] = useState(1); // 1: Type, 2: Item, 3: Verse/Segment
  const [goToType, setGoToType] = useState(null); // 'surah' or 'dua'
  const [goToItemId, setGoToItemId] = useState(null);
  const [goToItemData, setGoToItemData] = useState(null); // Store selected surah/dua data
  const [goToVerseOrSegment, setGoToVerseOrSegment] = useState('');
  const [goToMaxVerseOrSegment, setGoToMaxVerseOrSegment] = useState(0);
  const [goToSearchTerm, setGoToSearchTerm] = useState(''); // For filtering Surahs/Duas
  const [activeHadithVolumeIdOnBack, setActiveHadithVolumeIdOnBack] = useState(null); // For Hadith back navigation

  // REMOVED Swipe detection state

  // Combine context error and local error for display
  const displayError = contextError || localError || downloadError;

  // Font Size State
  const defaultArabicSize = 1.5;
  const defaultOtherSize = 1.125;

  const safeParseLocalStorage = (key, defaultValue) => {
    const storedValue = localStorage.getItem(key);
    const parsedValue = parseFloat(storedValue);
    return !isNaN(parsedValue) && parsedValue > 0 ? parsedValue : defaultValue;
  };

  const [arabicFontSize, setArabicFontSize] = useState(() => safeParseLocalStorage('arabicFontSize', defaultArabicSize));
  const [transliterationFontSize, setTransliterationFontSize] = useState(() => safeParseLocalStorage('transliterationFontSize', defaultOtherSize));
  const [translationFontSize, setTranslationFontSize] = useState(() => safeParseLocalStorage('translationFontSize', defaultOtherSize));

  // Save font sizes to localStorage
  useEffect(() => { if (!isNaN(arabicFontSize)) localStorage.setItem('arabicFontSize', arabicFontSize); }, [arabicFontSize]);
  useEffect(() => { if (!isNaN(transliterationFontSize)) localStorage.setItem('transliterationFontSize', transliterationFontSize); }, [transliterationFontSize]);
  useEffect(() => { if (!isNaN(translationFontSize)) localStorage.setItem('translationFontSize', translationFontSize); }, [translationFontSize]);

  // Update URL with current state
  useEffect(() => {
    if (sessionId) {
      const url = `${window.location.origin}?session=${sessionId}`;
      setSessionUrl(url);
    }
  }, [sessionId]);

  useEffect(() => {
    const params = {};
    if (sessionId) {
      params.session = sessionId;
    }
    if (currentContentInfo) {
      params.type = currentContentInfo.type;
      params.id = currentContentInfo.id;
      if (currentIndex > 0) {
        params.index = currentIndex;
      }
    }
    setSearchParams(params, { replace: true });
  }, [sessionId, currentContentInfo, currentIndex, setSearchParams]);

  // Restore state from URL on initial load
  useEffect(() => {
    if (urlCheckPerformed.current) return;
    urlCheckPerformed.current = true;

    const sessionIdFromUrl = searchParams.get('session');
    const typeFromUrl = searchParams.get('type');
    const idFromUrl = searchParams.get('id');

    if (typeFromUrl && idFromUrl) {
      const contentInfo = {
        type: typeFromUrl,
        id: idFromUrl,
      };
      selectContentLocally(contentInfo);
    }

    if (sessionIdFromUrl && !sessionId) {
      setJoinSessionId(sessionIdFromUrl);
      setIsJoining(true);
      setPendingAction('join');
      if (connectionStatus !== 'connected' && connectionStatus !== 'connecting') {
        connectToServer();
      }
    }
  }, [searchParams, selectContentLocally, connectToServer, sessionId, connectionStatus]);

  // Effect to set index from URL after content has loaded
  useEffect(() => {
    const indexFromUrl = searchParams.get('index');
    if (indexFromUrl && currentFullContent) {
      const index = parseInt(indexFromUrl, 10);
      if (!isNaN(index)) {
        updateLocalIndex(index);
      }
    }
  }, [currentFullContent, searchParams, updateLocalIndex]);

  // Show NameInputDialog after connection if there was a pending action (e.g., joining via URL)
  // AND we are not currently in the middle of an automatic rejoin attempt.
  useEffect(() => {
    if (connectionStatus === 'connected' && pendingAction && !isAttemptingRejoin) {
      console.log(`Connection established, proceeding with pending action: ${pendingAction}`);
      // Ensure we don't show name input if a session/username already got populated by a successful auto-rejoin
      if (!sessionId && !username) {
        setShowNameInputDialog(true);
      } else {
        console.log("Pending action for URL join, but session/username already exists (likely from auto-rejoin). Skipping NameInputDialog.");
      }
      setPendingAction(null); // Clear the pending action
    }
  }, [connectionStatus, pendingAction, isAttemptingRejoin, sessionId, username]);

  useEffect(() => {
    if (currentContentInfo && currentContentInfo.id) {
      if (currentContentInfo.type === 'dua') {
        const dataFromMap = contentMap[currentContentInfo.id];
        if (dataFromMap) {
          setLocalFullContent(dataFromMap);
        } else {
          console.warn("DuaSyncApp: DUA ID from context not found in local contentMap:", currentContentInfo.id);
          setLocalFullContent(null); // Or fallback to currentFullContent from context if preferred
        }
      } else {
        // For 'quran', 'alkafi_chapter', 'hadith_chapter', rely on context's currentFullContent
        setLocalFullContent(currentFullContent);
      }
    } else {
      setLocalFullContent(null); // No content selected
    }
  }, [currentContentInfo, currentFullContent]); // currentFullContent dependency is for non-dua types

  const totalPhrases = useMemo(() => {
    if (currentContentInfo?.type === 'alkafi_chapter') {
      return localFullContent?.hadithsInChapter?.length ?? 0;
    }
    if (currentContentInfo?.type === 'quran') {
      return localFullContent?.totalAyahs ?? (localFullContent?.verses?.arabic?.length ?? 0);
    }
    if (currentContentInfo?.type === 'dua') {
      if (localFullContent?.phrases && Array.isArray(localFullContent.phrases)) {
        return localFullContent.phrases.length; // For Sahifa duas
      } else if (localFullContent?.verses?.arabic) {
        return localFullContent.verses.arabic.length; // For other duas
      }
      return 0;
    }
    return 0; // Default
  }, [currentContentInfo, localFullContent]);

  // Auto-advance effect
  useEffect(() => {
    let interval;
    if (autoAdvance && isHost && sessionId && localFullContent && totalPhrases > 0) {
      interval = setInterval(() => {
        if (currentIndex < totalPhrases - 1) {
          updateHostIndex(currentIndex + 1);
        } else {
          setAutoAdvance(false); // Stop at the end
        }
      }, autoAdvanceInterval * 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [autoAdvance, autoAdvanceInterval, localFullContent, currentIndex, isHost, sessionId, updateHostIndex, totalPhrases]);

  // --- Navigation Actions ---
  const performNavigation = useCallback((direction) => {
    if (!localFullContent || totalPhrases === 0) return;
    
    const newIndex = currentIndex + direction;

    if (newIndex >= 0 && newIndex < totalPhrases) {
      if (isHost) {
        updateHostIndex(newIndex);
      } else {
        updateLocalIndex(newIndex); // This will also set isBrowsingLocally if participant navigates
      }
    }
  }, [localFullContent, totalPhrases, currentIndex, isHost, updateHostIndex, updateLocalIndex]);

  const nextPhrase = useCallback(() => performNavigation(1), [performNavigation]);
  const prevPhrase = useCallback(() => performNavigation(-1), [performNavigation]);
  // --- End Navigation Actions ---

  // REMOVED Swipe Handlers

  // Start hosting
  const startHosting = () => {
    setLocalError(null);
    if (isAttemptingRejoin) {
      alert("Please wait, attempting to rejoin previous session...");
      return;
    }
    if (connectionStatus !== 'connected') {
      setPendingAction('create'); // Set pending action
      alert('Connecting to server... Please try again shortly.');
      if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
        connectToServer();
      }
      return;
    }
    if (!username && !sessionId) { // Only show if not already in a session
      setShowNameInputDialog(true);
    }
    setJoinSessionId('');
  };

  // Join participant
  const joinAsParticipant = () => {
    if (!joinSessionId) {
      setLocalError("Please enter a Session ID to join.");
      return;
    }
    setLocalError(null);
    if (isAttemptingRejoin) {
      alert("Please wait, attempting to rejoin previous session...");
      return;
    }
    setIsJoining(true); 

    if (connectionStatus !== 'connected') {
      setPendingAction('join'); // Set pending action
      alert('Connecting to server... Please try again shortly.');
      if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
        connectToServer();
      }
      // setIsJoining(false); // Keep isJoining true as action is pending
      return;
    }
    if (!username && !sessionId) { // Only show if not already in a session
      setShowNameInputDialog(true);
    } else {
      // If already in a session (e.g. auto-rejoined), but user clicked join again.
      // We could either ignore, or show RejoinDialog to confirm if they want to switch.
      // For now, let's assume if they have a session, they don't need the name input.
      console.log("Join clicked, but already in a session. User might need to leave current session first or use Rejoin Dialog.");
      setIsJoining(false);
    }
  };

  // Handle name submission
  const handleNameSubmit = (name) => {
    setShowNameInputDialog(false);
    setLocalError(null);
    if (joinSessionId) {
      joinSession(joinSessionId, name);
    } else {
      createSession(name);
    }
    setIsJoining(false);
    setJoinSessionId('');
  };

  // Transfer host
  const transferHost = (newHostId) => {
    if (!isHost || !socket || !sessionId || connectionStatus !== 'connected') return;
    setLocalError(null);
    socket.emit('transfer_host', { sessionId, newHostId });
    setShowParticipantsDialog(false);
  };

  // Save settings
  const saveSettings = () => {
    setShowSettings(false);
  };

  // Handle join session ID change
  const handleJoinSessionIdChange = (e) => {
    setJoinSessionId(e.target.value);
  };
 
   // Handle content selection (Quran, Dua)
   const handleContentSelection = (contentInfo, fullData = null) => {
     if (!contentInfo) return;
     setLocalError(null);
     
     const newIsKidsMode = contentInfo.startInKidsMode || false;
     setIsKidsMode(newIsKidsMode); // Set the app's kids mode state

     // Automatically go fullscreen if Kids Mode is active for a Quran Surah with images
     const isQuranWithImagesForFullscreen = contentInfo.type === 'quran' && ['55', '113', '114'].includes(contentInfo.id);
     if (newIsKidsMode && isQuranWithImagesForFullscreen) {
       setIsFullScreen(true);
     }

     const dataToPass = fullData ? [contentInfo, fullData] : [contentInfo];

     if (!sessionId) { // Case 1: No session (offline user)
       selectContentLocally(...dataToPass);
       setIsBrowsingLocally(true); // User is browsing locally
     } else if (isHost && connectionStatus === 'connected') { // Case 2: Host in a session
       selectContentAsHost(...dataToPass);
       if (contentInfo.type !== 'alkafi') setShowShareDialog(true);
       // Host is always "browsing locally" in terms of control, but isSyncedToHost handles participant view
     } else if (!isHost && connectionStatus === 'connected') { // Case 3: Participant in a session, connected
       // If a participant (connected, not host) selects any content, they are now browsing locally.
       selectContentLocally(...dataToPass);
       setIsBrowsingLocally(true); // Set to true, regardless of previous isBrowsingLocally state
     } else if (!isHost && connectionStatus !== 'connected') { // Case 4: Participant, but disconnected (effectively offline)
       selectContentLocally(...dataToPass);
       setIsBrowsingLocally(true); // User is browsing locally
     }
   };
  
  // Specific handler for Al Kafi chapter selection from AlKafiSelectionPage
  const handleAlKafiChapterSelection = (chapterSelectionInfo) => {
    if (!chapterSelectionInfo || !chapterSelectionInfo.hadiths) return;
    setLocalError(null);
    setIsKidsMode(chapterSelectionInfo.startInKidsMode || false);

    // contentInfo now represents the chapter
    const contentInfo = {
        type: 'alkafi_chapter', // Updated type
        id: chapterSelectionInfo.chapterId, // Use chapterId as the primary ID for currentContentInfo
        title: chapterSelectionInfo.title, // e.g., "Book Name - Chapter Name"
        volumeId: chapterSelectionInfo.volumeId,
        volumeName: chapterSelectionInfo.volumeName,
        bookId: chapterSelectionInfo.bookId,
        bookName: chapterSelectionInfo.bookName,
        chapterName: chapterSelectionInfo.chapterName,
        startInKidsMode: chapterSelectionInfo.startInKidsMode,
    };
    
    // currentFullContent for AlKafi chapter view will store the list of hadiths and other relevant info
    const fullContent = {
        hadithsInChapter: chapterSelectionInfo.hadiths,
        bookName: chapterSelectionInfo.bookName,
        chapterName: chapterSelectionInfo.chapterName,
        volumeName: chapterSelectionInfo.volumeName,
        totalHadiths: chapterSelectionInfo.hadiths.length, // Ensure totalHadiths is set
        // No individual hadith data here, AlKafiChapterView will iterate through hadithsInChapter
    };

    // Use the generic handleContentSelection, passing the chapter info and its full content (the hadiths list)
    // The second argument `fullContent` will be used by selectContentLocally/AsHost in SocketContext
    handleContentSelection(contentInfo, fullContent);
  };


  // Back button logic
  const handleBack = () => {
    setLocalError(null);

    if (currentContentInfo?.type === 'hadith_chapter') {
      // Store the volume ID of the current hadith chapter
      // This assumes currentContentInfo for hadith_chapter has a volumeId property
      if (currentContentInfo.volumeId) {
        setActiveHadithVolumeIdOnBack(currentContentInfo.volumeId);
        console.log(`Hadith back: Storing volumeId ${currentContentInfo.volumeId} for return.`);
      } else {
        console.warn("HadithChapterView: currentContentInfo.volumeId is missing. Cannot set active volume for back navigation.");
        setActiveHadithVolumeIdOnBack(null);
      }
      // Then proceed to clear the content, which will show DuaSelectionPage
      // The logic for clearing content depends on session status, host status, etc.
      // This part mimics the original logic for clearing content when currentContentInfo is present.
      if (!sessionId) { // Offline
          selectContentLocally(null);
      } else if (isHost && connectionStatus === 'connected') { // Host online
          selectContentAsHost(null);
      } else if (isBrowsingLocally) { // Participant browsing locally (online or offline)
          setIsBrowsingLocally(false); // Stop local browsing
          if (connectionStatus === 'connected') {
            // If online, after clearing local, they might sync to host or see selection page
            // For now, let's clear local content. If host has content, syncToHost might be better.
            // However, the goal is to go to selection page with specific tab.
            selectContentLocally(null); // This will show selection page.
            // syncToHost(); // This would take them to host's content, not selection page.
          } else { // Participant browsing locally, offline
            selectContentLocally(null);
          }
      } else if (!isHost && connectionStatus === 'connected' && !isBrowsingLocally) { // Participant synced to host
        // When a synced participant hits back, they should go to selection page to browse locally.
        setIsBrowsingLocally(true);
        // Don't clear content immediately, let them see selection page with host content in background.
        // setActiveHadithVolumeIdOnBack is already set, DuaSelectionPage will handle it.
        // No need to call selectContentLocally(null) here as it would clear host's content from view.
      } else { // Participant offline, not browsing locally (shouldn't happen if content is viewed)
          selectContentLocally(null);
      }
      return;
    } else {
      // If backing out from something else (not a hadith chapter), clear any pending hadith volume.
      // This ensures that if user navigates elsewhere and then back to selection page,
      // it doesn't try to force a hadith volume tab.
      setActiveHadithVolumeIdOnBack(null);
    }

    // If viewing AlKafi chapter content, go back to DuaSelectionPage
    if (currentContentInfo?.type === 'alkafi_chapter') {
        selectContentLocally(null); 
        // TODO: Consider if AlKafi also needs tab persistence similar to Hadith.
        // If so, setActiveAlKafiBookIdOnBack(currentContentInfo.bookId) or similar.
        return;
    }

    // Original logic for other cases:
    if (!sessionId && currentContentInfo) { // Offline, viewing some content
        selectContentLocally(null);
        return;
    }
    // This block handles general back from content when in a session
    if (sessionId && currentContentInfo) {
      if (isHost && connectionStatus === 'connected') {
        selectContentAsHost(null);
      } else if (isBrowsingLocally) { // Participant browsing locally
         setIsBrowsingLocally(false);
         if (connectionStatus === 'connected') {
           syncToHost(); // Sync back to host if they were browsing locally
         } else {
           selectContentLocally(null); // Offline, clear local content
         }
      } else if (!isHost && connectionStatus === 'connected') { // Participant synced to host
        // Participant was following, now wants to browse locally from selection page
        setIsBrowsingLocally(true); 
        // Don't clear content, let them see selection page with host content still in background
      } else if (!isHost && connectionStatus !== 'connected') { // Offline participant
        selectContentLocally(null);
      }
      return;
    }
    // Back from selection page when host
    else if (sessionId && isHost && !currentContentInfo && connectionStatus === 'connected') {
       if (socket) {
         // Consider if host should leave session or just go to a "no content selected" state.
         // Original: socket.emit('leave_session', { sessionId });
         // For now, let's assume host stays in session but with no content.
         // If leaving session is desired, uncomment the emit.
       }
       return;
    }
    // Back from selection page when participant browsing locally
    else if (sessionId && !isHost && isBrowsingLocally && !currentContentInfo) {
       setIsBrowsingLocally(false);
       if (connectionStatus === 'connected') {
         syncToHost(); // Sync back to host
       }
       return;
    }
  };
  
  const handleGoToChapterListFromAlKafi = () => {
    // This function is called from AlKafiViewer to go back to the selection page,
    // effectively clearing the current hadith view.
    selectContentLocally(null); 
    // We want DuaSelectionPage to show the 'alkafi' tab.
    // Since DuaSelectionPage's activeTab is local state, we can't directly set it here.
    // A workaround: DuaSyncApp could pass a `defaultTab` prop to DuaSelectionPage.
    // For now, it will go to the default tab of DuaSelectionPage (Quran).
    // This needs refinement if specific tab persistence is required after backing out of AlKafiViewer.
  };

  // Memoized values
  const contentTitle = currentContentInfo?.title || '';
  // For AlKafi chapter, source might be derived from volume/book name
  const contentSource = currentContentInfo?.type === 'alkafi_chapter' 
    ? currentContentInfo?.volumeName 
    : (localFullContent?.source || (currentContentInfo?.type === 'quran' ? 'Quran' : ''));
  // totalPhrases is memoized earlier, not applicable to alkafi_chapter

  const currentPhraseData = useMemo(() => {
    // This function is for single phrase display, not applicable to alkafi_chapter view
    if (currentContentInfo?.type === 'alkafi_chapter' || !localFullContent || totalPhrases === 0 || currentIndex >= totalPhrases) {
      return { arabic: '', transliteration: '', translation: '', english: '' };
    }

    if (currentContentInfo?.type === 'quran') {
      const verse = localFullContent.verses[currentIndex];
      return {
        arabic: verse?.arabic || '',
        transliteration: verse?.transliteration || '',
        translation: verse?.translation || '',
      };
    } else if (currentContentInfo?.type === 'dua') {
      if (localFullContent.phrases && Array.isArray(localFullContent.phrases)) {
        // Sahifa Sajjadiya structure (and potentially other duas using 'phrases')
        const phrase = localFullContent.phrases[currentIndex];
        return {
          arabic: phrase?.arabic || '',
          // Assuming Sahifa JSONs might not have transliteration, default to empty
          transliteration: phrase?.transliteration || '', 
          translation: phrase?.english || phrase?.translation || '', // Use 'english' or 'translation'
        };
      } else if (localFullContent.verses) {
        // Existing structure for other duas (e.g., Kumayl, Simaat if they use 'verses')
        return {
          arabic: localFullContent.verses?.arabic?.[currentIndex] || '',
          transliteration: localFullContent.verses?.transliteration?.[currentIndex] || '',
          translation: localFullContent.verses?.translation?.[currentIndex] || '',
        };
      }
    }
    // 'alkafi' single hadith view logic removed as it's now chapter based
    return { arabic: '', transliteration: '', translation: '', english: '' };
  }, [localFullContent, currentIndex, totalPhrases, currentContentInfo?.type]);

  // Download Handlers
  const checkDownloadStatus = useCallback(async (key, type, id, filenameForCheck) => {
    setDownloadStatus(prev => ({ ...prev, [key]: 'checking' }));
    setDownloadError(null);
    try {
      let pathToCheck;
      if (type === 'images') {
        pathToCheck = offlineStorage.getFilePath(type, id, 'dummy').split('/').slice(0, -1).join('/');
      } else {
        pathToCheck = offlineStorage.getFilePath(type, id, filenameForCheck);
      }
      console.log(`Checking existence of: ${pathToCheck}`);
      const exists = await offlineStorage.checkFileExists(pathToCheck);
      setDownloadStatus(prev => ({ ...prev, [key]: exists ? 'downloaded' : 'idle' }));
    } catch (err) {
      console.error(`Error checking download status for ${key}:`, err);
      setDownloadStatus(prev => ({ ...prev, [key]: 'error' }));
      setDownloadError(`Failed to check status for ${key}.`);
    }
  }, []);

  const handleDownload = useCallback(async (key, type, id) => {
    setDownloadStatus(prev => ({ ...prev, [key]: 'downloading' }));
    setDownloadError(null);
    console.log(`Starting download for ${key} (${type}, ${id})`);
    try {
      if (key === 'alRahmanImages' && type === 'images' && id === 'AlRahman') {
        const totalVerses = 78;
        for (let i = 1; i <= totalVerses; i++) {
          const filename = `Verse${i}.png`;
          const path = offlineStorage.getFilePath('images', 'AlRahman', filename);
          const imageUrl = new URL(`/SurahImages/AlRahman/${filename}`, window.location.origin).href;
          console.log(`Downloading ${imageUrl} to ${path}`);
          await offlineStorage.downloadAndSaveFile(imageUrl, path);
        }
        console.log('Al-Rahman images download complete.');
      } else {
        console.warn(`Download logic not implemented for key: ${key}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        throw new Error(`Download not implemented for ${key}`);
      }
      setDownloadStatus(prev => ({ ...prev, [key]: 'downloaded' }));
    } catch (err) {
      console.error(`Error downloading ${key}:`, err);
      setDownloadStatus(prev => ({ ...prev, [key]: 'error' }));
      setDownloadError(`Download failed for ${key}: ${err.message}`);
    }
  }, []);

  const handleDelete = useCallback(async (key, type, id) => {
    setDownloadStatus(prev => ({ ...prev, [key]: 'checking' }));
    setDownloadError(null);
    console.log(`Starting deletion for ${key} (${type}, ${id})`);
    try {
      let pathToDelete;
      if (type === 'images') {
        pathToDelete = offlineStorage.getFilePath(type, id, 'dummy').split('/').slice(0, -1).join('/');
      } else {
        pathToDelete = offlineStorage.getFilePath(type, id);
      }
      console.log(`Deleting path: ${pathToDelete}`);
      await offlineStorage.deleteFileOrDirectory(pathToDelete);
      setDownloadStatus(prev => ({ ...prev, [key]: 'idle' }));
      console.log(`Deletion complete for ${key}`);
    } catch (err) {
      console.error(`Error deleting ${key}:`, err);
      setDownloadStatus(prev => ({ ...prev, [key]: 'error' }));
      setDownloadError(`Deletion failed for ${key}: ${err.message}`);
    }
  }, []);

  useEffect(() => {
    if (showSettings) {
      setDownloadError(null);
      checkDownloadStatus('alRahmanImages', 'images', 'AlRahman');
    }
  }, [showSettings, checkDownloadStatus]);

  // Load local Kids Mode image path
  useEffect(() => {
    const shouldLoadKidsImage = isKidsMode &&
                               currentContentInfo &&
                               currentContentInfo.type === 'quran' &&
                               ['55', '113', '114'].includes(currentContentInfo.id);

    if (!shouldLoadKidsImage) {
      setIsImageLoading(false);
      setLocalKidsImagePath(null);
      return;
    }

    setIsImageLoading(true); // Set loading true when relevant content/index changes

    let folderName = null;
    let filenamePrefix = '';

    if (currentContentInfo.id === '55') { folderName = 'AlRahman'; }
    else if (currentContentInfo.id === '113') { folderName = 'AlFalaq'; filenamePrefix = 'AlFalaq'; }
    else if (currentContentInfo.id === '114') { folderName = 'AlNas'; filenamePrefix = 'AlNas'; }

    if (folderName) {
      const checkLocalImage = async () => {
        try {
          const filename = `${filenamePrefix}Verse${currentIndex + 1}.png`;
          const relativePath = offlineStorage.getFilePath('images', folderName, filename);
          const fileExists = await offlineStorage.checkFileExists(relativePath);
          if (fileExists) {
            const fileUriResult = await Filesystem.getUri({ directory: Directory.Documents, path: relativePath });
            setLocalKidsImagePath(Capacitor.convertFileSrc(fileUriResult.uri));
          } else {
            setLocalKidsImagePath(null); // Fallback to public path
          }
        } catch (error) {
          console.error('Error checking/getting local image URI:', error);
          setLocalKidsImagePath(null); // Fallback
          setIsImageLoading(false); // Ensure loading stops on error
        }
        // setIsImageLoading(false) will be called by onLoad/onError of the img tag
      };
      checkLocalImage();
    } else {
      setLocalKidsImagePath(null);
      setIsImageLoading(false); // No valid folder, so not loading
    }
  }, [isKidsMode, currentContentInfo, currentIndex]);

  // Toggle Kids Mode Handler
  // Simplified Toggle Kids Mode Handler (no activeTab logic needed here)
  const toggleKidsMode = () => {
    const newKidsModeState = !isKidsMode;
    setIsKidsMode(newKidsModeState);

    if (newKidsModeState) {
      // If turning ON kids mode
      if (currentContentInfo?.type === 'quran' && ['55', '113', '114'].includes(currentContentInfo.id)) {
        setIsFullScreen(true);
      }
    } else {
      // If turning OFF kids mode, exit fullscreen if it was on.
      if (isFullScreen) {
        setIsFullScreen(false);
      }
    }
  };

  // Toggle Fullscreen Handler
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // --- Go To Modal Logic ---
  const openGoToModal = () => {
    setGoToStep(1);
    setGoToType(null);
    setGoToItemId(null);
    setGoToItemData(null);
    setGoToVerseOrSegment('');
    setGoToMaxVerseOrSegment(0);
    setGoToSearchTerm('');
      setShowGoToModal(true);
      setPendingGoToIndex(null); // Reset pending index when opening modal
  };

  const handleGoToTypeSelect = (type) => {
    // Use 'quran' internally when 'Surah' is selected in the UI
    setGoToType(type === 'surah' ? 'quran' : type);
    setGoToStep(2);
    setGoToSearchTerm(''); // Reset search on type change
  };

  const handleGoToItemSelect = (item) => {
    setGoToItemId(item.id);
    setGoToItemData(item); // Store the whole item for easy access to totalAyahs/content
    setGoToStep(3);
    // Use 'quran' for the internal type check
    if (goToType === 'quran') {
      setGoToMaxVerseOrSegment(item.totalAyahs || 0);
    } else if (goToType === 'dua') {
      // Need to fetch/access the specific dua content to get length
      const duaContent = contentMap[item.id];
      const segmentCount = duaContent?.arabic?.length || 0; // Assuming arabic array represents segments
      setGoToMaxVerseOrSegment(segmentCount);
    }
  };

  const handleGoToVerseSegmentChange = (e) => {
    const value = e.target.value;
    // Allow only numbers
    if (/^\d*$/.test(value)) {
      setGoToVerseOrSegment(value);
    }
  };

  const handleGoToSubmit = () => {
    const targetIndex = parseInt(goToVerseOrSegment, 10);
    if (!isNaN(targetIndex) && targetIndex >= 1 && targetIndex <= goToMaxVerseOrSegment) {
      const zeroBasedIndex = targetIndex - 1;
      // Ensure the selected content matches the target type/id before navigating
      if (currentContentInfo?.id !== goToItemId || currentContentInfo?.type !== goToType) {
        // If not the current content, select it first
        // Ensure the correct type ('quran' or 'dua') is passed
        const contentInfo = {
          id: goToItemId,
          type: goToType, // This should already be 'quran' or 'dua' from handleGoToTypeSelect
          title: goToItemData?.title, // Pass title for display
          // Add other necessary fields if needed by select functions
        };
        console.log("Go To Submit - Selecting new content:", contentInfo); // Debug log
        if (isHost) {
          selectContentAsHost(contentInfo);
        } else {
          selectContentLocally(contentInfo); // Passes correct type
          setIsBrowsingLocally(true); // Assume user wants to browse locally after jumping
          setPendingGoToIndex(zeroBasedIndex); // Set the target index to apply after load
        }
        // Removed setTimeout logic here
      } else {
        // If it's already the current content, just navigate
        if (recitationMode === 'scroll' && !sessionId) {
          scrollRefs.current[zeroBasedIndex]?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        } else {
          if (isHost) {
            updateHostIndex(zeroBasedIndex);
          } else {
            updateLocalIndex(zeroBasedIndex);
          }
        }
      }
      setShowGoToModal(false);
    } else {
      alert(`Please enter a valid number between 1 and ${goToMaxVerseOrSegment}.`);
    }
  };

  const filteredGoToItems = useMemo(() => {
    if (goToStep !== 2) return [];
    // Use 'quran' for the internal type check to select the correct list
    const list = goToType === 'quran' ? quranSurahList : duaCollection;
    if (!list) return [];
    return list.filter(item =>
      item.title.toLowerCase().includes(goToSearchTerm.toLowerCase()) ||
      (item.arabic && item.arabic.toLowerCase().includes(goToSearchTerm.toLowerCase())) ||
      item.id.toString().includes(goToSearchTerm)
    );
  }, [goToStep, goToType, quranSurahList, duaCollection, goToSearchTerm]);
  // --- End Go To Modal Logic ---

  // Effect to apply pending Go To index after content loads
  useEffect(() => {
    console.log(`Go To Effect Check: pending=${pendingGoToIndex}, currentId=${currentContentInfo?.id}, targetId=${goToItemId}, hasContent=${!!localFullContent}`); // More detailed log
    // Check if there's a pending index, content is loaded, and the loaded content matches the target ID
    if (pendingGoToIndex !== null && localFullContent && currentContentInfo?.id === goToItemId) {
      console.log(`Applying pending Go To index: ${pendingGoToIndex} for content ID: ${currentContentInfo.id}`); // Debug log
      if (isHost) {
        updateHostIndex(pendingGoToIndex);
      } else {
        updateLocalIndex(pendingGoToIndex);
      }
      setPendingGoToIndex(null); // Reset after applying
    }
  // Ensure dependencies cover the conditions checked inside
  }, [localFullContent, currentContentInfo, pendingGoToIndex, isHost, updateHostIndex, updateLocalIndex, goToItemId]);


  // Debug logs
  if (isDev) {
    console.log('Rendering DuaSyncApp:', { sessionId: !!sessionId, currentContentInfo: !!currentContentInfo, localFullContent: !!localFullContent, isLoadingContent, isBrowsingLocally, isHost, connectionStatus });
    if (!sessionId && !currentContentInfo) {
      console.log("Render Check: Condition met for initial DuaSelectionPage (!sessionId && !currentContentInfo).");
    } else {
      console.log("Render Check: Condition NOT met for initial DuaSelectionPage.", { sessionId: !!sessionId, currentContentInfo: !!currentContentInfo });
    }
  }

   return (
     // Apply overflow-hidden when in fullscreen to prevent scrolling of the underlying body
     <div className={`flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-bg-primary dark:to-dark-bg-secondary dark:text-dark-text-primary transition-colors duration-300 ${isFullScreen ? 'overflow-hidden' : ''}`}>
      {!isFullScreen && <RefreshBanner />}
      {/* Header - Conditionally render based on fullscreen state */}
      {!isFullScreen && (
        <header className="page-header relative z-10">
          <div className="container-narrow flex items-center justify-between flex-wrap gap-y-2">
            <h1 className="text-xl md:text-2xl font-bold flex items-center text-gray-800 dark:text-dark-text-primary">
              <span className="bg-primary-100 dark:bg-dark-primary p-2 rounded-lg mr-2 text-primary-600 dark:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </span>
              IqraTogether
            </h1>
            <div className="flex items-center space-x-1 md:space-x-2">
              {!sessionId ? (
                <div className="flex items-center space-x-2">
                  {showJoinInputInHeader ? (
                    <div className="flex items-center space-x-1 bg-white dark:bg-dark-bg-tertiary p-1 rounded-lg shadow-sm">
                      <input type="text" value={joinSessionId} onChange={handleJoinSessionIdChange} className="input-sm border-none focus:ring-0 dark:bg-dark-bg-tertiary" placeholder="Session ID" disabled={connectionStatus === 'connecting'} />
                      <button onClick={joinAsParticipant} className={`btn-xs btn-accent flex items-center ${connectionStatus === 'connecting' ? 'btn-disabled' : ''}`} disabled={connectionStatus === 'connecting' || !joinSessionId} aria-label="Join Session">
                        {connectionStatus === 'connecting' && pendingAction === 'join' ? <Loader size={14} className="animate-spin" /> : <UserPlus size={14} />}
                      </button>
                      <button onClick={() => { setShowJoinInputInHeader(false); setJoinSessionId(''); }} className="btn-xs btn-icon text-gray-500 hover:bg-gray-200 dark:hover:bg-dark-bg-secondary" aria-label="Cancel Join" disabled={connectionStatus === 'connecting'}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button onClick={startHosting} className={`btn-sm btn-primary flex items-center ${connectionStatus === 'connecting' ? 'btn-disabled' : ''}`} disabled={connectionStatus === 'connecting'}>
                        {connectionStatus === 'connecting' && pendingAction === 'create' ? <Loader size={16} className="animate-spin mr-1" /> : <PlusCircle size={16} className="mr-1" />} Create
                      </button>
                      <button onClick={() => setShowJoinInputInHeader(true)} className={`btn-sm btn-accent flex items-center ${connectionStatus === 'connecting' ? 'btn-disabled' : ''}`} disabled={connectionStatus === 'connecting'}>
                        <UserPlus size={16} className="mr-1" /> Join
                      </button>
                    </>
                  )}
                </div>
              ) : (
                connectionStatus === 'connected' && (
                  <>
                    <button onClick={() => setShowParticipantsDialog(true)} className="btn-icon tooltip-wrapper group" aria-label="Participants">
                      <Users size={20} />
                      <span className="tooltip">Participants ({participants.length})</span>
                    </button>
                    {isHost && (
                      <button onClick={() => setShowShareDialog(true)} className="btn-icon tooltip-wrapper group" aria-label="Share">
                        <Share2 size={20} />
                        <span className="tooltip">Share Session</span>
                      </button>
                    )}
                  </>
                )
              )}
              {/* Go To Button (Moved to Header) - Show if not in session or if host */}
              {(!sessionId || isHost) && (
                <button onClick={openGoToModal} className="btn-icon tooltip-wrapper group ml-2" aria-label="Go To Verse/Segment">
                  <Locate size={20} />
                  <span className="tooltip">Go To</span>
                </button>
              )}
              <button onClick={() => setShowSettings(!showSettings)} className="btn-icon tooltip-wrapper group ml-2" aria-label="Settings">
                <Settings size={20} />
                <span className="tooltip">Settings</span>
              </button>
              <ThemeToggle />
            </div>
          </div>
        </header>
      )}

      {/* Connection status indicator - Conditionally render based on fullscreen state */}
      {!isFullScreen && connectionStatus === 'connecting' && (
        <div className="bg-blue-100 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 px-4 py-2 text-center text-sm font-medium">
          <div className="container-narrow flex items-center justify-center"> <Loader size={16} className="animate-spin mr-2" /> Connecting... </div>
        </div>
      )}
      {!isFullScreen && connectionStatus === 'disconnected' && hasAttemptedConnection && (
        <div className="bg-red-100 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-2 text-center text-sm font-medium">
          <div className="container-narrow flex items-center justify-center"> <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div> Disconnected </div>
        </div>
      )}
      {!isFullScreen && displayError && (
        <div className="bg-red-100 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-2 text-center">
          <div className="container-narrow flex justify-between items-center">
            <span>{displayError}</span>
            <button onClick={() => { setLocalError(null); setDownloadError(null); }} className="btn-icon text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800"> <X size={18} /> </button>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className={`flex-1 ${isFullScreen ? '' : 'overflow-y-auto no-pull-refresh'}`}>
        {/* Normal View Container */}
        {!isFullScreen && (
          <div className="container-narrow py-6">
            {/* Kids Mode Toggle (Moved here - visible on selection page and content page if host/no session) */}
            {(!sessionId || isHost) && !currentContentInfo && ( // Only show on selection page
              <div className="flex items-center justify-center mb-6">
                 <button onClick={toggleKidsMode} className={`btn btn-icon p-1 ${isKidsMode ? 'btn-accent ring-2 ring-offset-1 ring-accent-focus dark:ring-offset-dark-bg-primary' : 'btn-ghost'}`} aria-label={isKidsMode ? "Kids Mode Active - Click to Deactivate" : "Kids Mode Inactive - Click to Activate"}>
                   <img src={KidsModeIcon} alt="Kids Mode Toggle" className="w-24 h-24" />
                 </button>
              </div>
            )}
            {/* Content Rendering Logic (Normal View) */}
            { isLoadingContent && !localFullContent ? ( // Show loading if context is loading AND localFullContent isn't set yet
                <div className="flex flex-col items-center justify-center h-full py-20">
                  <Loader size={48} className="animate-spin text-primary-500 dark:text-primary-400 mb-6" />
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-3">Loading Content...</h2>
                  <p className="text-gray-600 dark:text-dark-text-secondary">Please wait while we fetch the {currentContentInfo?.type || 'content'}.</p>
                </div>
              ) : currentContentInfo && localFullContent && (!sessionId || isHost || !isBrowsingLocally) ? (
                <div className="space-y-6 animate-fade-in">
                  {/* Top Bar: Back Button, Page Number, Fullscreen Button */}
                  <div className="flex items-center justify-between">
                    {/* Back Button: Show if no session, host, or viewing AlKafi */}
                    {(!sessionId || isHost || currentContentInfo?.type === 'alkafi') && ( <BackButton onClick={handleBack} /> )}
                    
                    <div className="flex items-center space-x-4">
                       {/* Page Number: Not applicable for alkafi_chapter view or scroll mode */}
                       {currentContentInfo?.type !== 'alkafi_chapter' && recitationMode === 'phrase-by-phrase' && (
                         <div className={`text-sm text-gray-500 dark:text-dark-text-muted ${(!sessionId || isHost) ? '' : 'ml-auto mr-2'}`}>
                           {`${currentIndex + 1} of ${totalPhrases}`}
                         </div>
                       )}
                      <button onClick={toggleFullScreen} className="btn-icon tooltip-wrapper group" aria-label="Enter Fullscreen">
                        <Maximize size={20} />
                        <span className="tooltip">Fullscreen</span>
                      </button>
                    </div>
                  </div>

                  {/* Content title - For alkafi_chapter, title is handled by AlKafiChapterView */}
                  {currentContentInfo?.type !== 'alkafi_chapter' && (
                    <div className="text-center mb-6">
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-dark-text-primary">{contentTitle}</h2>
                    </div>
                  )}

                  {/* Kids Mode Toggle (Only if current Surah supports Kids Mode images) - Not applicable to alkafi_chapter */}
                  {currentContentInfo?.type === 'quran' && (currentContentInfo?.id === '55' || currentContentInfo?.id === '113' || currentContentInfo?.id === '114') && (
                    <div className="flex items-center justify-center mb-6">
                       <button onClick={toggleKidsMode} className={`btn btn-icon p-1 ${isKidsMode ? 'btn-accent ring-2 ring-offset-1 ring-accent-focus dark:ring-offset-dark-bg-primary' : 'btn-ghost'}`} aria-label={isKidsMode ? "Kids Mode Active - Click to Deactivate" : "Kids Mode Inactive - Click to Activate"}>
                         <img src={KidsModeIcon} alt="Kids Mode Toggle" className="w-16 h-16" />
                       </button>
                    </div>
                  )}

                  {/* Main content display (Normal View) */}
                  {isKidsMode && currentContentInfo?.type === 'quran' && (currentContentInfo?.id === '55' || currentContentInfo?.id === '113' || currentContentInfo?.id === '114') ? (
                    // --- Kids Mode Layout (Normal View) ---
                     <div key={`kids-mode-view-${currentIndex}`} className="animate-fade-in w-full flex flex-col items-center">
                       <div className="relative w-full flex items-center justify-center mb-4" style={{ minHeight: '300px' }}>
                        {(!sessionId || isHost) && (
                          <>
                            <button onClick={prevPhrase} disabled={currentIndex === 0} className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-primary shadow-lg ${currentIndex === 0 ? 'btn-disabled opacity-30 cursor-not-allowed' : 'opacity-70 hover:opacity-100'}`} aria-label="Previous Verse"> <ChevronLeft size={32} /> </button>
                            <button onClick={nextPhrase} disabled={currentIndex >= totalPhrases - 1} className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-primary shadow-lg ${currentIndex >= totalPhrases - 1 ? 'btn-disabled opacity-30 cursor-not-allowed' : 'opacity-70 hover:opacity-100'}`} aria-label="Next Verse"> <ChevronRight size={32} /> </button>
                          </>
                        )}
                        <img
                          key={`kids-image-normal-${currentContentInfo?.id}-${currentIndex}-img`}
                          src={localKidsImagePath ? localKidsImagePath :
                                (currentContentInfo.id === '55' ? `/SurahImages/AlRahman/Verse${currentIndex + 1}.png` :
                                (currentContentInfo.id === '113' && localFullContent?.images && localFullContent.images[currentIndex] ? `/${localFullContent.images[currentIndex]}` :
                                (currentContentInfo.id === '114' && localFullContent?.images && localFullContent.images[currentIndex] ? `/${localFullContent.images[currentIndex]}` : '/SurahImages/image_not_found.png')))
                              }
                          alt={`Verse ${currentIndex + 1} - Kids Illustration`}
                          className={`max-w-full max-h-[40vh] object-contain rounded-lg transition-opacity duration-300 ${isImageLoading ? 'opacity-30' : 'opacity-100'}`}
                          onLoad={() => setIsImageLoading(false)}
                          onError={(e) => {
                            setIsImageLoading(false);
                            e.target.onerror = null; e.target.src = '/SurahImages/image_not_found.png'; e.target.alt = `Image not found for Verse ${currentIndex + 1}`;
                          }}
                        />
                        {isImageLoading && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-black/10 dark:bg-white/10 backdrop-blur-sm rounded-lg">
                            <Loader size={48} className="animate-spin text-pink-500 dark:text-pink-400 mb-4" />
                            <p className="text-lg font-medium text-gray-700 dark:text-dark-text-secondary">
                              Loading picture...
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="w-full max-w-3xl px-4 flex-shrink-0">
                         <p className="text-center mb-2 text-sm text-gray-500 dark:text-dark-text-muted">Verse {currentIndex + 1}</p>
                         <div key={`arabic-kids-${currentIndex}`} className="text-center mb-4 animate-fade-in">
                           <p className="leading-loose font-uthmani" dir="rtl" style={{ fontSize: `${arabicFontSize}rem` }}> {currentPhraseData.arabic || <span className="italic text-gray-400 dark:text-gray-600">...</span>} </p>
                         </div>
                         {showTranslation && currentPhraseData.translation && (
                           <div key={`translation-kids-${currentIndex}`} className="text-center border-t pt-3 border-gray-200 dark:border-gray-700 animate-slide-up">
                             <p className="text-gray-800 dark:text-dark-text-primary" style={{ fontSize: `${translationFontSize}rem` }} dangerouslySetInnerHTML={{ __html: currentPhraseData.translation }} />
                           </div>
                         )}
                      </div>
                    </div>
                  ) : currentContentInfo?.type === 'alkafi_chapter' ? (
                    // --- AlKafi Chapter View Rendering ---
                    <AlKafiChapterView
                      chapterFullContent={currentFullContent} 
                      currentHadithIndex={currentIndex}
                      totalHadiths={totalPhrases} // totalPhrases is correctly calculated for alkafi_chapter now
                      onNavigateHadith={performNavigation} // Use the generic navigate function
                      isHost={isHost}
                      isBrowsingLocally={isBrowsingLocally}
                      arabicFontSize={arabicFontSize}
                      translationFontSize={translationFontSize}
                      showTranslation={showTranslation}
                    />
                  ) : currentContentInfo?.type === 'hadith_chapter' ? (
                    // --- Hadith Chapter View Rendering ---
                    <HadithChapterView
                      chapterFullContent={currentFullContent}
                      arabicFontSize={arabicFontSize}
                      translationFontSize={translationFontSize}
                      showTranslation={showTranslation}
                      // Pass other necessary props like onBack if needed
                    />
                  ) : (
                    // --- Normal Mode Layout (Quran/Dua) ---
                    (recitationMode === 'phrase-by-phrase' || !!sessionId) ? (
                      <div className="card p-6 md:p-8 min-h-[200px] flex flex-col justify-center items-center overscroll-behavior-y-contain">
                        {currentFullContent?.displayBismillah && currentIndex === 0 && currentContentInfo?.type === 'quran' && (
                          <div className="w-full mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 text-center">
                            <p className="leading-loose font-uthmani" dir="rtl" style={{ fontSize: `${arabicFontSize * 0.9}rem` }}>
                              بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                            </p>
                          </div>
                        )}
                        <div className="w-full">
                          <div key={`arabic-${currentIndex}`} className="text-center mb-6 animate-fade-in">
                            <p className="leading-loose font-uthmani" dir="rtl" style={{ fontSize: `${arabicFontSize}rem` }}>
                              {currentPhraseData.arabic || <span className="italic text-gray-400 dark:text-gray-600">...</span>}
                            </p>
                          </div>
                          {showTransliteration && currentPhraseData.transliteration && (
                            <div key={`transliteration-${currentIndex}`} className="mb-4 border-t pt-4 border-gray-200 dark:border-gray-700 animate-slide-in">
                              <p className="text-gray-700 dark:text-dark-text-secondary italic" style={{ fontSize: `${transliterationFontSize}rem` }} dangerouslySetInnerHTML={{ __html: currentPhraseData.transliteration }} />
                            </div>
                          )}
                          {showTranslation && (currentPhraseData.translation || currentPhraseData.english) && (
                             <div key={`translation-${currentIndex}`} className="border-t pt-4 border-gray-200 dark:border-gray-700 animate-slide-up">
                               <p className="text-gray-800 dark:text-dark-text-primary" style={{ fontSize: `${translationFontSize}rem` }} dangerouslySetInnerHTML={{ __html: currentPhraseData.translation || currentPhraseData.english }} />
                             </div>
                           )}
                        </div>
                        {(!sessionId || isHost) && currentContentInfo?.type !== 'alkafi' && ( // Hide for AlKafi as viewer has its own
                          <div className="w-full flex justify-center gap-4 mt-6">
                             <button onClick={prevPhrase} disabled={currentIndex === 0} className={`btn btn-icon btn-primary ${currentIndex === 0 ? 'btn-disabled opacity-50 cursor-not-allowed' : ''}`} aria-label="Previous"> <ChevronLeft size={24} /> </button>
                             <button onClick={nextPhrase} disabled={currentIndex >= totalPhrases - 1} className={`btn btn-icon btn-primary ${currentIndex >= totalPhrases - 1 ? 'btn-disabled opacity-50 cursor-not-allowed' : ''}`} aria-label="Next"> <ChevronRight size={24} /> </button>
                           </div>
                        )}
                      </div>
                    ) : (
                      // --- Scroll Mode Layout (Quran/Dua) ---
                      <div className="card p-6 md:p-8">
                        {currentFullContent?.displayBismillah && currentContentInfo?.type === 'quran' && (
                          <div className="w-full mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 text-center">
                            <p className="leading-loose font-uthmani" dir="rtl" style={{ fontSize: `${arabicFontSize * 0.9}rem` }}>
                              بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                            </p>
                          </div>
                        )}
                        <div className="space-y-4">
                          {(localFullContent?.verses || localFullContent?.phrases)?.map((item, index) => {
                            const arabic = item.arabic;
                            const transliteration = item.transliteration;
                            const translation = item.translation || item.english;
                            const itemNumber = index + 1;

                            return (
                              <div key={index} ref={el => scrollRefs.current[index] = el} className="pt-4">
                                <div className="space-y-4">
                                  <p className="leading-loose font-uthmani text-center" dir="rtl" style={{ fontSize: `${arabicFontSize}rem` }}>
                                    {arabic}
                                    {currentContentInfo?.type === 'quran' && (
                                      <span className="verse-marker text-primary-600 dark:text-accent-400 mx-2">
                                        &#xFD3F;{itemNumber.toLocaleString('ar-EG')}&#xFD3E;
                                      </span>
                                    )}
                                  </p>
                                  {showTransliteration && transliteration && (
                                    <p className="text-gray-700 dark:text-dark-text-secondary italic" style={{ fontSize: `${transliterationFontSize}rem` }} dangerouslySetInnerHTML={{ __html: transliteration }} />
                                  )}
                                  {showTranslation && translation && (
                                    <p className="text-gray-800 dark:text-dark-text-primary" style={{ fontSize: `${translationFontSize}rem` }}>
                                      {translation}
                                      {currentContentInfo?.type === 'quran' && (
                                        <span className="font-bold text-primary-600 dark:text-accent-400 ml-2">
                                          ({itemNumber})
                                        </span>
                                      )}
                                    </p>
                                  )}
                                </div>
                                {index < (localFullContent?.verses || localFullContent?.phrases).length - 1 && (
                                  <hr className="verse-separator" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}

                  {/* Action Buttons (Auto for Host) */}
                  <div className="flex flex-wrap justify-center items-center gap-4 mt-8">
                      {!!sessionId && isHost && (
                        <div className="flex space-x-4">
                          <button onClick={() => setAutoAdvance(!autoAdvance)} className={`btn-secondary flex items-center ${autoAdvance ? 'ring-2 ring-primary-300 dark:ring-dark-accent' : ''}`}>
                            {autoAdvance ? ( <span className="flex items-center"> Auto <span className="ml-2 w-2 h-2 rounded-full bg-primary-500 dark:bg-dark-accent animate-pulse"></span> </span> ) : 'Auto'}
                          </button>
                        </div>
                      )}
                    </div>
                  {/* Status Indicators */}
                  {!!sessionId && (
                    <div className="text-center mt-6">
                      {connectionStatus !== 'connected' && (
                         <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 text-sm"> <div className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></div> Connection lost. Use the Rejoin button <LogIn size={14} className="inline mx-1"/> in the header if needed. </div>
                      )}
                    </div>
                  )}

                  {/* Footer message */}
                  <div className="text-center text-gray-500 dark:text-dark-text-muted text-sm mt-8">
                    {!!sessionId ? 
                      (isHost ? 
                        (connectionStatus === 'connected' ? "Your navigation controls the session." : "You are the host (offline). Navigation is local.") : 
                        (connectionStatus === 'connected' ? 
                          (isSyncedToHost ? "Following host." : (currentContentInfo?.type === 'alkafi_chapter' ? "Viewing Al-Kafi hadith locally." : "Viewing independently.")) : 
                          "Connection lost. Navigate locally or use Rejoin in header."
                        )
                      ) : 
                      (currentContentInfo?.type === 'alkafi_chapter' ? "Viewing Al-Kafi hadith." : 
                      (currentContentInfo?.type === 'hadith_chapter' ? "Viewing Mizan al-Hikmah chapter." : null))
                    }
                  </div>
                </div>
              ) : !!sessionId && !isHost && !currentContentInfo && !isBrowsingLocally && connectionStatus === 'connected' ? (
                 <div className="flex flex-col items-center justify-center h-full py-20">
                  <div className="text-center max-w-md">
                    <div className="relative mx-auto w-20 h-20 mb-6">
                       <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-dark-bg-tertiary opacity-25"></div>
                       <div className="absolute inset-0 w-full h-full rounded-full border-4 border-t-primary-500 dark:border-t-dark-accent animate-spin"></div>
                     </div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-3">Waiting for Host</h2>
                    <p className="text-gray-600 dark:text-dark-text-secondary">The host hasn't selected any content yet.</p>
                   </div>
                </div>
              ) : ( 
                <DuaSelectionPage
                  onSelectDua={handleContentSelection}
                  onSelectQuran={handleContentSelection}
                  onSelectAlKafi={handleAlKafiChapterSelection} // Updated prop name
                  onSelectHadithChapter={handleContentSelection} // Use generic handler for now
                  onBack={handleBack}
                  activeHadithVolumeIdOnBack={activeHadithVolumeIdOnBack}
                  onHadithVolumeTabFocused={() => {
                    console.log("DuaSelectionPage focused on Hadith volume tab, resetting activeHadithVolumeIdOnBack.");
                    setActiveHadithVolumeIdOnBack(null);
                  }}
                  isKidsMode={isKidsMode}
                  arabicFontSize={arabicFontSize}
                  translationFontSize={translationFontSize}
                  showTranslation={showTranslation}
                />
              )}
          </div>
        )}

        {/* Fullscreen View Container */}
        {isFullScreen && currentContentInfo && localFullContent && (
          <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-bg-primary dark:to-dark-bg-secondary dark:text-dark-text-primary overflow-y-auto no-pull-refresh flex flex-col p-4 md:p-8 animate-fade-in">
            <RefreshBanner />
            {/* Fullscreen Header: Title and Action Buttons */}
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              {/* Back Button for Fullscreen - only if not in session or is host */}
              {(!sessionId || isHost) && (
                <button 
                  onClick={() => {
                    handleBack(); // Existing back logic
                    if (isFullScreen) { // Ensure we exit fullscreen if back is pressed from here
                      setIsFullScreen(false);
                    }
                  }} 
                  className="btn-icon tooltip-wrapper group mr-2" // Added margin-right
                  aria-label="Back"
                >
                  <ChevronLeft size={24} />
                  <span className="tooltip">Back</span>
                </button>
              )}
              <h2 className={`text-xl md:text-2xl font-bold text-gray-800 dark:text-dark-text-primary ${(!sessionId || isHost) ? '' : 'flex-1 text-center'}`}> {/* Adjust title alignment */}
                {contentTitle}
              </h2>
              {/* Action Buttons Group */}
              <div className="flex items-center space-x-2">
                {/* Settings Button (Opens modal without exiting fullscreen) */}
                <button onClick={() => setShowSettings(true)} className="btn-icon tooltip-wrapper group" aria-label="Settings">
                  <Settings size={24} />
                  <span className="tooltip">Settings</span>
                </button>

                {/* Exit Fullscreen Button */}
                <button onClick={toggleFullScreen} className="btn-icon tooltip-wrapper group" aria-label="Exit Fullscreen">
                  <Minimize size={24} />
                  <span className="tooltip">Exit Fullscreen</span>
                </button>
              </div>
            </div>

            {/* Fullscreen Content Area (Scrollable) */}
            <div className="flex-1 min-h-0 overscroll-behavior-y-contain"> {/* Let outer container handle scrolling and flex */}
              {isKidsMode && currentContentInfo?.type === 'quran' && (currentContentInfo?.id === '55' || currentContentInfo?.id === '113' || currentContentInfo?.id === '114') ? (
                // Kids mode Quran fullscreen rendering
                 <>
                  <div className="relative w-full max-w-4xl mx-auto flex items-center justify-center mb-4 px-4">
                    {(!sessionId || isHost) && (
                      <>
                        <button onClick={prevPhrase} disabled={currentIndex === 0} className={`absolute left-2 md:left-0 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-lg btn-primary shadow-lg ${currentIndex === 0 ? 'btn-disabled opacity-30 cursor-not-allowed' : 'opacity-70 hover:opacity-100'}`} aria-label="Previous Verse"> <ChevronLeft size={40} /> </button>
                        <button onClick={nextPhrase} disabled={currentIndex >= totalPhrases - 1} className={`absolute right-2 md:right-0 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-lg btn-primary shadow-lg ${currentIndex >= totalPhrases - 1 ? 'btn-disabled opacity-30 cursor-not-allowed' : 'opacity-70 hover:opacity-100'}`} aria-label="Next Verse"> <ChevronRight size={40} /> </button>
                      </>
                    )}
                    <img 
                      key={`kids-image-fullscreen-${currentContentInfo?.id}-${currentIndex}-img`}
                      src={localKidsImagePath ? localKidsImagePath : 
                            (currentContentInfo.id === '55' ? `/SurahImages/AlRahman/Verse${currentIndex + 1}.png` : 
                            (currentContentInfo.id === '113' && localFullContent?.images && localFullContent.images[currentIndex] ? `/${localFullContent.images[currentIndex]}` :
                            (currentContentInfo.id === '114' && localFullContent?.images && localFullContent.images[currentIndex] ? `/${localFullContent.images[currentIndex]}` : '/SurahImages/image_not_found.png')))
                          }
                      alt={`Verse ${currentIndex + 1} - Kids Illustration`}
                      className={`max-w-full h-auto max-h-[75vh] object-contain rounded-lg transition-opacity duration-300 ${isImageLoading ? 'opacity-30' : 'opacity-100'}`}
                      onLoad={() => setIsImageLoading(false)}
                      onError={(e) => {
                        setIsImageLoading(false);
                        e.target.onerror = null; e.target.src = '/SurahImages/image_not_found.png'; e.target.alt = `Image not found for Verse ${currentIndex + 1}`;
                      }}
                    />
                    {isImageLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-black/10 dark:bg-white/10 backdrop-blur-sm rounded-lg">
                        <Loader size={64} className="animate-spin text-pink-500 dark:text-pink-400 mb-4" />
                        <p className="text-xl font-semibold text-gray-700 dark:text-dark-text-primary">
                          Loading a beautiful picture...
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="w-full max-w-4xl mx-auto px-4 flex-shrink-0">
                     <p className="text-center mb-2 text-base text-gray-500 dark:text-dark-text-muted">Verse {currentIndex + 1} of {totalPhrases}</p>
                     <div key={`arabic-kids-fs-${currentIndex}`} className="text-center mb-4">
                       <p className="leading-loose font-uthmani" dir="rtl" style={{ fontSize: `${arabicFontSize * 1.2}rem` }}> {currentPhraseData.arabic || <span className="italic text-gray-400 dark:text-gray-600">...</span>} </p>
                     </div>
                     {showTranslation && currentPhraseData.translation && (
                       <div key={`translation-kids-fs-${currentIndex}`} className="text-center border-t pt-3 border-gray-200 dark:border-gray-700">
                         <p className="text-gray-800 dark:text-dark-text-primary" style={{ fontSize: `${translationFontSize * 1.1}rem` }} dangerouslySetInnerHTML={{ __html: currentPhraseData.translation }} />
                       </div>
                     )}
                  </div>
                </>
              ) : currentContentInfo?.type === 'alkafi_chapter' ? (
                // --- AlKafi Chapter View Fullscreen ---
                // The AlKafiChapterView itself handles scrolling of its content.
                // We ensure it's placed within a container that allows it to expand.
                <div className="w-full h-full overflow-y-auto overscroll-behavior-y-contain custom-scrollbar">
                   <AlKafiChapterView
                      chapterFullContent={currentFullContent}
                      currentHadithIndex={currentIndex}
                      totalHadiths={totalPhrases}
                      onNavigateHadith={performNavigation}
                      isHost={isHost}
                      isBrowsingLocally={isBrowsingLocally}
                      arabicFontSize={arabicFontSize * 1.1} // Slightly increase font for fullscreen
                      translationFontSize={translationFontSize * 1.05} // Slightly increase font
                      showTranslation={showTranslation}
                      // onBack is not needed here as fullscreen exit handles going back
                    />
                 </div>
              ) : currentContentInfo?.type === 'hadith_chapter' ? (
                 // --- Hadith Chapter View Fullscreen ---
                 <div className="w-full h-full overflow-y-auto overscroll-behavior-y-contain custom-scrollbar">
                   <HadithChapterView
                      chapterFullContent={currentFullContent}
                      arabicFontSize={arabicFontSize * 1.1} // Slightly increase font for fullscreen
                      translationFontSize={translationFontSize * 1.05} // Slightly increase font
                      showTranslation={showTranslation}
                      // onBack is not needed here as fullscreen exit handles going back
                    />
                 </div>
              ) : (
                // --- Scroll Mode Fullscreen (Quran/Dua) ---
                <div className="w-full max-w-5xl mx-auto py-4 overscroll-behavior-y-contain">
                  {currentFullContent?.displayBismillah && currentContentInfo?.type === 'quran' && (
                    <div className="w-full mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 text-center">
                      <p className="leading-loose font-uthmani" dir="rtl" style={{ fontSize: `${arabicFontSize * 1.1}rem` }}>
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                      </p>
                    </div>
                  )}
                  <div className="space-y-4">
                    {(localFullContent?.verses || localFullContent?.phrases)?.map((item, index) => {
                      const arabic = item.arabic;
                      const transliteration = item.transliteration;
                      const translation = item.translation || item.english;
                      const itemNumber = index + 1;

                      return (
                        <div key={index} ref={el => scrollRefs.current[index] = el} className="pt-4">
                          <div className="space-y-4">
                            <p className="leading-loose font-uthmani text-center" dir="rtl" style={{ fontSize: `${arabicFontSize * 1.3}rem` }}>
                              {arabic}
                              {currentContentInfo?.type === 'quran' && (
                                <span className="verse-marker text-primary-600 dark:text-accent-400 mx-2">
                                  &#xFD3F;{itemNumber.toLocaleString('ar-EG')}&#xFD3E;
                                </span>
                              )}
                            </p>
                            {showTransliteration && transliteration && (
                              <p className="text-gray-700 dark:text-dark-text-secondary italic" style={{ fontSize: `${transliterationFontSize * 1.1}rem` }} dangerouslySetInnerHTML={{ __html: transliteration }} />
                            )}
                            {showTranslation && translation && (
                              <p className="text-gray-800 dark:text-dark-text-primary" style={{ fontSize: `${translationFontSize * 1.1}rem` }}>
                                {translation}
                                {currentContentInfo?.type === 'quran' && (
                                  <span className="font-bold text-primary-600 dark:text-accent-400 ml-2">
                                    ({itemNumber})
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                          {index < (localFullContent?.verses || localFullContent?.phrases).length - 1 && (
                            <hr className="verse-separator" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings modal - Now renders regardless of fullscreen state, controlled only by showSettings */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] animate-fade-in p-4"> {/* Increased z-index */}
          <div className="card w-full max-w-md animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold dark:text-dark-text-primary">Settings</h3>
              <button onClick={() => setShowSettings(false)} className="btn-icon"> <X size={24} /> </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto overscroll-behavior-y-contain">
              {/* Fullscreen Session Actions (Create/Join) */}
              {isFullScreen && !sessionId && (
                <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-3">Session Actions</h4>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => { setShowSettings(false); toggleFullScreen(); startHosting(); }}
                      className={`btn btn-primary flex-1 flex items-center justify-center ${connectionStatus === 'connecting' ? 'btn-disabled' : ''}`}
                      disabled={connectionStatus === 'connecting'}
                    >
                      <PlusCircle size={16} className="mr-1.5" /> Create
                    </button>
                    <button
                      onClick={() => { setShowSettings(false); toggleFullScreen(); setShowJoinInputInHeader(true); }}
                      className={`btn btn-accent flex-1 flex items-center justify-center ${connectionStatus === 'connecting' ? 'btn-disabled' : ''}`}
                      disabled={connectionStatus === 'connecting'}
                    >
                      <UserPlus size={16} className="mr-1.5" /> Join
                    </button>
                  </div>
                </div>
              )}

              {/* Session Info */}
              {connectionStatus === 'connected' && !!sessionId && (
                <div className="bg-primary-50 dark:bg-dark-bg-secondary p-4 rounded-lg border border-primary-100 dark:border-dark-bg-tertiary space-y-2">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-2">Session Info</h4>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-dark-text-secondary">User:</span>
                    <span className="font-medium">{username || '...'} {isHost && <span className="ml-1 badge-primary text-xs">Host</span>}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-dark-text-secondary">Session ID:</span>
                    <span className="font-mono text-xs bg-gray-100 dark:bg-dark-bg-tertiary px-1.5 py-0.5 rounded">{sessionId}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-dark-text-secondary">Participants:</span>
                    <span>{participants.length}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                     <button onClick={() => { setShowSettings(false); setShowRejoinDialog(true); }} className="btn btn-sm btn-secondary w-full flex items-center justify-center" disabled={connectionStatus === 'connecting'}>
                        <LogIn size={16} className="mr-1.5" /> Rejoin Session
                     </button>
                  </div>
                  <div className="pt-3">
                    <button 
                      onClick={() => {
                        if (window.confirm('Are you sure you want to disconnect from this session?')) {
                          disconnectSession();
                          setShowSettings(false); // Close settings modal after disconnecting
                        }
                      }} 
                      className="btn btn-sm btn-danger w-full flex items-center justify-center"
                    >
                      <X size={16} className="mr-1.5" /> Disconnect from Session
                    </button>
                  </div>
                </div>
              )}
              {/* Display Options */}
              <div>
                <label className="block text-gray-700 dark:text-dark-text-secondary mb-3 font-medium">Display Options</label>
                <div className="space-y-3">
                  <div className="flex items-center bg-gray-50 dark:bg-dark-bg-secondary p-3 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary">
                    <input type="checkbox" id="showTranslation" checked={showTranslation} onChange={() => setShowTranslation(!showTranslation)} className="toggle-checkbox" />
                    <label htmlFor="showTranslation" className="flex-1 cursor-pointer dark:text-dark-text-secondary ml-3">Show Translation</label>
                  </div>
                  <div className="flex items-center bg-gray-50 dark:bg-dark-bg-secondary p-3 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary">
                    <input type="checkbox" id="showTransliteration" checked={showTransliteration} onChange={() => setShowTransliteration(!showTransliteration)} className="toggle-checkbox" />
                    <label htmlFor="showTransliteration" className="flex-1 cursor-pointer dark:text-dark-text-secondary ml-3">Show Transliteration</label>
                  </div>
                </div>
              </div>
              {/* Recitation Mode */}
              <div>
                <label className="block text-gray-700 dark:text-dark-text-secondary mb-3 font-medium">Recitation Mode</label>
                <div className="flex items-center bg-gray-50 dark:bg-dark-bg-secondary p-3 rounded-lg">
                  <div className="flex w-full rounded-md shadow-sm">
                    <button
                      onClick={() => setRecitationMode('phrase-by-phrase')}
                      disabled={!!sessionId}
                      className={`flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-l-md focus:z-10 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${recitationMode === 'phrase-by-phrase' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-secondary'} ${!!sessionId ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      Phrase by Phrase
                    </button>
                    <button
                      onClick={() => setRecitationMode('scroll')}
                      disabled={!!sessionId}
                      className={`-ml-px flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-r-md focus:z-10 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${recitationMode === 'scroll' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-secondary'} ${!!sessionId ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      Scroll
                    </button>
                  </div>
                </div>
                {!!sessionId && <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-2">Recitation mode is locked to 'Phrase by Phrase' during a session.</p>}
              </div>
              {/* Font Size Controls */}
              <div>
                <label className="block text-gray-700 dark:text-dark-text-secondary mb-3 font-medium">Font Sizes</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-dark-bg-secondary p-3 rounded-lg">
                    <span className="dark:text-dark-text-secondary">Arabic</span>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => setArabicFontSize(prev => { const current = parseFloat(prev); return Math.max(0.5, (isNaN(current) ? defaultArabicSize : current) - 0.1); })} className="btn-icon-sm btn-secondary">-</button>
                      <span className="text-sm w-8 text-center dark:text-dark-text-muted">{(Math.round((parseFloat(arabicFontSize) || defaultArabicSize) * 10) / 10).toFixed(1)}</span>
                      <button onClick={() => setArabicFontSize(prev => { const current = parseFloat(prev); return (isNaN(current) ? defaultArabicSize : current) + 0.1; })} className="btn-icon-sm btn-secondary">+</button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-dark-bg-secondary p-3 rounded-lg">
                     <span className="dark:text-dark-text-secondary">Transliteration</span>
                     <div className="flex items-center space-x-2">
                       <button onClick={() => setTransliterationFontSize(prev => { const current = parseFloat(prev); return Math.max(0.5, (isNaN(current) ? defaultOtherSize : current) - 0.1); })} className="btn-icon-sm btn-secondary">-</button>
                       <span className="text-sm w-8 text-center dark:text-dark-text-muted">{(Math.round((parseFloat(transliterationFontSize) || defaultOtherSize) * 10) / 10).toFixed(1)}</span>
                       <button onClick={() => setTransliterationFontSize(prev => { const current = parseFloat(prev); return (isNaN(current) ? defaultOtherSize : current) + 0.1; })} className="btn-icon-sm btn-secondary">+</button>
                     </div>
                   </div>
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-dark-bg-secondary p-3 rounded-lg">
                     <span className="dark:text-dark-text-secondary">Translation</span>
                     <div className="flex items-center space-x-2">
                       <button onClick={() => setTranslationFontSize(prev => { const current = parseFloat(prev); return Math.max(0.5, (isNaN(current) ? defaultOtherSize : current) - 0.1); })} className="btn-icon-sm btn-secondary">-</button>
                       <span className="text-sm w-8 text-center dark:text-dark-text-muted">{(Math.round((parseFloat(translationFontSize) || defaultOtherSize) * 10) / 10).toFixed(1)}</span>
                       <button onClick={() => setTranslationFontSize(prev => { const current = parseFloat(prev); return (isNaN(current) ? defaultOtherSize : current) + 0.1; })} className="btn-icon-sm btn-secondary">+</button>
                     </div>
                   </div>
                 </div>
               </div>
               {/* Auto-Advance Settings - Don't show for alkafi_chapter */}
               {isHost && connectionStatus === 'connected' && currentContentInfo?.type !== 'alkafi_chapter' && (
                 <div>
                   <label className="block text-gray-700 dark:text-dark-text-secondary mb-3 font-medium">Auto-Advance Settings</label>
                  <div className="flex items-center bg-gray-50 dark:bg-dark-bg-secondary p-3 rounded-lg">
                    <span className="mr-3 dark:text-dark-text-secondary">Interval (seconds):</span>
                    <select value={autoAdvanceInterval} onChange={(e) => setAutoAdvanceInterval(Number(e.target.value))} className="input bg-white dark:bg-dark-bg-tertiary flex-1">
                      <option value="5">5</option> <option value="10">10</option> <option value="15">15</option> <option value="20">20</option> <option value="30">30</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 p-6">
              <button onClick={saveSettings} className="btn-primary w-full"> Save Settings </button>
            </div>
          </div>
        </div>
      )}

      {/* Other Modals - Conditionally render based on fullscreen state */}
      {!isFullScreen && showShareDialog && <ShareDialog sessionId={sessionId} sessionUrl={sessionUrl} onClose={() => setShowShareDialog(false)} />}
      {!isFullScreen && showParticipantsDialog && <ParticipantsDialog participants={participants} isHost={isHost} onTransferHost={transferHost} onClose={() => setShowParticipantsDialog(false)} />}
      {!isFullScreen && showNameInputDialog && !isAttemptingRejoin && (!username || !sessionId) && <NameInputDialog onSubmit={handleNameSubmit} onClose={() => { setShowNameInputDialog(false); setIsJoining(false); setPendingAction(null); }} />}
      {!isFullScreen && <RejoinDialog isOpen={showRejoinDialog} onClose={() => setShowRejoinDialog(false)} onSubmit={({ sessionId: rejoinSessionId, username: rejoinUsername }) => { setShowRejoinDialog(false); setLocalError(null); console.log(`Attempting explicit rejoin for session ${rejoinSessionId} as ${rejoinUsername}`); if (connectionStatus !== 'connected') { console.log("Not connected, attempting connection first..."); connectToServer(); } joinSession(rejoinSessionId, rejoinUsername, isHost); }} initialSessionId={sessionId} initialUsername={username} />}

      {/* Go To Modal */}
      {!isFullScreen && showGoToModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="card w-full max-w-lg animate-slide-up">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold dark:text-dark-text-primary">Go To...</h3>
              <button onClick={() => setShowGoToModal(false)} className="btn-icon"> <X size={24} /> </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto overscroll-behavior-y-contain">
              {/* Step 1: Type Selection */}
              {goToStep === 1 && (
                <div className="space-y-4"> {/* Increased spacing */}
                  <p className="text-gray-700 dark:text-dark-text-secondary mb-4">Select what you want to navigate to:</p>
                  <button
                    onClick={() => handleGoToTypeSelect('surah')} // Keep UI selection as 'surah'
                    className="btn btn-secondary w-full text-left p-4 h-auto transition-all duration-150 hover:bg-primary-50 dark:hover:bg-dark-bg-tertiary hover:shadow-md rounded-lg flex items-center space-x-3 border-2 border-transparent hover:border-primary-600 dark:hover:border-primary-300" // Adjusted hover border color for more prominence
                  >
                    <BookOpen size={24} className="text-primary-600 dark:text-primary-400 flex-shrink-0" /> {/* Icon */}
                    <div className="flex flex-col"> {/* Stack title and description */}
                      <span className="font-semibold text-base mb-1 text-primary-600 dark:text-primary-400">Surah</span> {/* Color */}
                      <span className="text-sm text-gray-500 dark:text-dark-text-muted">Select a Surah and Verse</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleGoToTypeSelect('dua')}
                    className="btn btn-secondary w-full text-left p-4 h-auto transition-all duration-150 hover:bg-primary-50 dark:hover:bg-dark-bg-tertiary hover:shadow-md rounded-lg flex items-center space-x-3 border-2 border-transparent hover:border-primary-600 dark:hover:border-primary-300" // Adjusted hover border color for more prominence
                  >
                     <FileText size={24} className="text-primary-600 dark:text-primary-400 flex-shrink-0" /> {/* Icon */}
                     <div className="flex flex-col"> {/* Stack title and description */}
                       <span className="font-semibold text-base mb-1 text-primary-600 dark:text-primary-400">Dua</span> {/* Color */}
                       <span className="text-sm text-gray-500 dark:text-dark-text-muted">Select a Dua and Segment</span>
                     </div>
                  </button>
                </div>
              )}

              {/* Step 2: Item Selection */}
              {goToStep === 2 && (
                <div>
                  <button onClick={() => setGoToStep(1)} className="btn btn-sm btn-ghost mb-4 flex items-center"> <ChevronLeft size={16} className="mr-1" /> Back </button>
                  {/* Use 'quran' for internal logic check, but display 'Surah' */}
                  <p className="text-gray-700 dark:text-dark-text-secondary mb-3">Select {goToType === 'quran' ? 'Surah' : 'Dua'}:</p>
                  <input
                    type="text"
                    placeholder={`Search ${goToType === 'quran' ? 'Surahs' : 'Duas'} by name, Arabic, or ID...`}
                    value={goToSearchTerm}
                    onChange={(e) => setGoToSearchTerm(e.target.value)}
                    className="input w-full mb-3"
                  />
                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2 bg-gray-50 dark:bg-dark-bg-secondary">
                    {filteredGoToItems.length > 0 ? filteredGoToItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleGoToItemSelect(item)}
                        className="block w-full text-left p-2 rounded hover:bg-primary-100 dark:hover:bg-dark-bg-tertiary transition-colors duration-150"
                      >
                        <span className="font-medium">{item.id}. {item.title}</span>
                        {item.arabic && <span className="text-sm text-gray-600 dark:text-dark-text-muted ml-2">({item.arabic})</span>}
                      </button>
                    )) : (
                      <p className="text-center text-gray-500 dark:text-dark-text-muted p-4">No results found.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Verse/Segment Selection */}
              {goToStep === 3 && goToItemData && (
                <div>
                  <button onClick={() => setGoToStep(2)} className="btn btn-sm btn-ghost mb-4 flex items-center"> <ChevronLeft size={16} className="mr-1" /> Back </button>
                  <p className="text-gray-700 dark:text-dark-text-secondary mb-3">
                    {/* Use 'quran' for internal logic check, but display 'Verse' */}
                    Enter {goToType === 'quran' ? 'Verse' : 'Segment'} number for <span className="font-semibold">{goToItemData.title}</span>:
                  </p>
                  <input
                    type="number" // Use number input for better mobile experience
                    inputMode="numeric" // Hint for numeric keyboard
                    pattern="[0-9]*" // Pattern for numeric input
                    placeholder={`Number (1 - ${goToMaxVerseOrSegment})`}
                    value={goToVerseOrSegment}
                    onChange={handleGoToVerseSegmentChange}
                    className="input w-full"
                    min="1"
                    max={goToMaxVerseOrSegment}
                  />
                  <button
                    onClick={handleGoToSubmit}
                    className="btn btn-primary w-full mt-4"
                    disabled={!goToVerseOrSegment || parseInt(goToVerseOrSegment, 10) < 1 || parseInt(goToVerseOrSegment, 10) > goToMaxVerseOrSegment}
                  >
                    Go
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DuaSyncApp;
