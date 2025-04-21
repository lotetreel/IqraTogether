import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Removed Smile icon import, added custom icon import below
// Added Maximize and Minimize icons
import { ChevronLeft, ChevronRight, Users, Settings, X, Share2, RefreshCw, Crown, UserPlus, Loader, LogIn, PlusCircle, DownloadCloud, Trash2, CheckCircle, Maximize, Minimize } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
// Import offline storage utils (adjust path if needed)
import * as offlineStorage from '../utils/offlineStorage';
// Import Capacitor Filesystem and core utilities
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
// Remove sample content and local data imports if fully relying on context/server
// import { SAMPLE_DUA, SAMPLE_QURAN } from '../data/sampleContent';
// import { duaCollection, quranCollection, contentMap } from '../data/duaCollection';
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

// For development debugging
const isDev = process.env.NODE_ENV === 'development';

const DuaSyncApp = () => {
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
  } = useSocket();

  // Local UI state
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(true);
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

  // Update session URL
  useEffect(() => {
      if (sessionId) {
          const protocol = window.location.protocol;
          const hostname = window.location.hostname;
          const port = window.location.port ? `:${window.location.port}` : '';
          const url = `${protocol}//${hostname}${port}?session=${sessionId}`;
          setSessionUrl(url);
      } else {
          setSessionUrl('');
      }
  }, [sessionId]);

  // Check URL for session ID
  useEffect(() => {
    if (connectionStatus === 'connected' || connectionStatus === 'connecting' || sessionId) return;
    const params = new URLSearchParams(window.location.search);
    const sessionIdFromUrl = params.get('session');
    if (sessionIdFromUrl) {
      console.log("Session ID found in URL, attempting to join:", sessionIdFromUrl);
      setJoinSessionId(sessionIdFromUrl);
      setIsJoining(true);
      setPendingAction('join');
      if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
        connectToServer();
      }
    }
  }, [connectionStatus, connectToServer, sessionId]);

  // Show NameInputDialog after connection if there was a pending action (e.g., joining via URL)
  useEffect(() => {
    if (connectionStatus === 'connected' && pendingAction) {
      console.log(`Connection established, proceeding with pending action: ${pendingAction}`);
      setShowNameInputDialog(true);
      setPendingAction(null); // Clear the pending action once the dialog is shown
    }
  }, [connectionStatus, pendingAction]);

  // Moved totalPhrases definition earlier
  const totalPhrases = currentFullContent?.totalAyahs ?? (currentFullContent?.verses?.arabic?.length ?? 0); // Adjusted for dua

  // Auto-advance effect
  useEffect(() => {
    let interval;
    // Use totalPhrases defined above
    if (autoAdvance && isHost && sessionId && currentFullContent && totalPhrases > 0) {
      interval = setInterval(() => {
        if (currentIndex < totalPhrases - 1) {
          updateHostIndex(currentIndex + 1);
        } else {
          setAutoAdvance(false);
        }
      }, autoAdvanceInterval * 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [autoAdvance, autoAdvanceInterval, currentFullContent, currentIndex, isHost, sessionId, updateHostIndex, totalPhrases]); // Added totalPhrases dependency

  // --- Navigation Actions ---
  const navigate = useCallback((direction) => {
    // Use totalPhrases defined above
    if (!currentFullContent || totalPhrases === 0) return;
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < totalPhrases) {
      if (isHost) {
        updateHostIndex(newIndex);
      } else {
        updateLocalIndex(newIndex);
      }
    }
  }, [currentFullContent, currentIndex, isHost, totalPhrases, updateHostIndex, updateLocalIndex]); // Added dependencies

  const nextPhrase = useCallback(() => navigate(1), [navigate]);
  const prevPhrase = useCallback(() => navigate(-1), [navigate]);
  // --- End Navigation Actions ---

  // REMOVED Swipe Handlers

  // Start hosting
  const startHosting = () => {
    setLocalError(null);
    // Check connection status BEFORE showing the dialog
    if (connectionStatus !== 'connected') {
      alert('Please wait for the connection to complete before creating a session.');
      // Optionally try to connect if disconnected
      if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
        connectToServer();
      }
      return; 
    }
    // If connected, show the dialog directly
    setShowNameInputDialog(true);
    setJoinSessionId(''); // Ensure joinSessionId is cleared if creating
  };

  // Join participant
  const joinAsParticipant = () => {
    if (!joinSessionId) {
      setLocalError("Please enter a Session ID to join.");
      return;
    }
    setLocalError(null);
    setIsJoining(true); // Keep this for potential UI feedback if needed

    // Check connection status BEFORE showing the dialog
    if (connectionStatus !== 'connected') {
      alert('Please wait for the connection to complete before joining a session.');
      // Optionally try to connect if disconnected
      if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
        connectToServer();
      }
      setIsJoining(false); // Reset joining state if connection failed
      return;
    }
    // If connected, show the dialog directly
    setShowNameInputDialog(true);
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
 
   // Handle content selection
   const handleContentSelection = (contentInfo) => {
     if (!contentInfo) return;
     setLocalError(null);
     setIsKidsMode(contentInfo.startInKidsMode || false);
     if (!sessionId) {
       selectContentLocally(contentInfo);
     } else if (isHost && connectionStatus === 'connected') {
       selectContentAsHost(contentInfo);
       setShowShareDialog(true);
     } else if (isBrowsingLocally) {
       selectContentLocally(contentInfo);
       setIsBrowsingLocally(false);
     } else if (!isHost && !isBrowsingLocally && connectionStatus === 'connected') {
       selectContentLocally(contentInfo);
       setIsBrowsingLocally(true);
     } else if (!isHost && connectionStatus !== 'connected') {
       selectContentLocally(contentInfo);
     }
   };

  // Back button logic
  const handleBack = () => {
    setLocalError(null);
    if (!sessionId && currentContentInfo) {
        selectContentLocally(null);
        return;
    }
    if (sessionId && currentContentInfo) {
      if (isHost && connectionStatus === 'connected') {
        selectContentAsHost(null);
      } else if (isBrowsingLocally) {
         setIsBrowsingLocally(false);
         if (connectionStatus === 'connected') {
           syncToHost();
         } else {
           selectContentLocally(null);
         }
      } else if (!isHost && connectionStatus === 'connected') {
        setIsBrowsingLocally(true);
      } else if (!isHost && connectionStatus !== 'connected') {
        selectContentLocally(null);
      }
      return;
    }
    else if (sessionId && isHost && !currentContentInfo && connectionStatus === 'connected') {
       if (socket) {
         socket.emit('leave_session', { sessionId });
       }
       return;
    }
    else if (sessionId && !isHost && isBrowsingLocally) {
       setIsBrowsingLocally(false);
       if (connectionStatus === 'connected') {
         syncToHost();
       }
       return;
    }
  };

  // Memoized values
  const contentTitle = currentContentInfo?.title || '';
  const contentSource = currentFullContent?.source || (currentContentInfo?.type === 'quran' ? 'Quran' : '');
  // totalPhrases is defined earlier now

  const currentPhraseData = useMemo(() => {
    // Use totalPhrases defined above
    if (!currentFullContent || totalPhrases === 0 || currentIndex >= totalPhrases) {
      return { arabic: '', transliteration: '', translation: '' };
    }
    if (currentContentInfo?.type === 'quran') {
      const verse = currentFullContent.verses[currentIndex];
      return {
        arabic: verse?.arabic || '',
        transliteration: verse?.transliteration || '',
        translation: verse?.translation || '',
      };
    } else if (currentContentInfo?.type === 'dua') {
      return {
        arabic: currentFullContent.verses?.arabic?.[currentIndex] || '',
        transliteration: currentFullContent.verses?.transliteration?.[currentIndex] || '',
        translation: currentFullContent.verses?.translation?.[currentIndex] || '',
      };
    }
    return { arabic: '', transliteration: '', translation: '' };
  }, [currentFullContent, currentIndex, totalPhrases, currentContentInfo?.type]); // Added totalPhrases dependency

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
    if (isKidsMode && currentContentInfo?.type === 'quran' && currentContentInfo?.id === '55') {
      const checkLocalImage = async () => {
        try {
          const filename = `Verse${currentIndex + 1}.png`;
          const relativePath = offlineStorage.getFilePath('images', 'AlRahman', filename);
          const fileExists = await offlineStorage.checkFileExists(relativePath);
          if (fileExists) {
            const fileUriResult = await Filesystem.getUri({ directory: Directory.Documents, path: relativePath });
            const webPath = Capacitor.convertFileSrc(fileUriResult.uri);
            setLocalKidsImagePath(webPath);
            console.log(`Local image found and URI set: ${webPath}`);
          } else {
            setLocalKidsImagePath(null);
            console.log(`Local image not found: ${relativePath}`);
          }
        } catch (error) {
          console.error('Error checking/getting local image URI:', error);
          setLocalKidsImagePath(null);
        }
      };
      checkLocalImage();
    } else {
      setLocalKidsImagePath(null);
    }
  }, [isKidsMode, currentContentInfo, currentIndex]);

  // Toggle Kids Mode Handler
  // Simplified Toggle Kids Mode Handler (no activeTab logic needed here)
  const toggleKidsMode = () => {
    setIsKidsMode(!isKidsMode);
  };

  // Toggle Fullscreen Handler
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Debug logs
  if (isDev) {
    console.log('Rendering DuaSyncApp:', { sessionId: !!sessionId, currentContentInfo: !!currentContentInfo, currentFullContent: !!currentFullContent, isLoadingContent, isBrowsingLocally, isHost, connectionStatus });
    if (!sessionId && !currentContentInfo) {
      console.log("Render Check: Condition met for initial DuaSelectionPage (!sessionId && !currentContentInfo).");
    } else {
      console.log("Render Check: Condition NOT met for initial DuaSelectionPage.", { sessionId: !!sessionId, currentContentInfo: !!currentContentInfo });
    }
  }

   return (
     // Apply overflow-hidden when in fullscreen to prevent scrolling of the underlying body
     <div className={`flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-bg-primary dark:to-dark-bg-secondary dark:text-dark-text-primary transition-colors duration-300 ${isFullScreen ? 'overflow-hidden' : ''}`}>
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
      <div className={`flex-1 ${isFullScreen ? '' : 'overflow-y-auto'}`}>
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
            { isLoadingContent ? (
                <div className="flex flex-col items-center justify-center h-full py-20">
                  <Loader size={48} className="animate-spin text-primary-500 dark:text-primary-400 mb-6" />
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-3">Loading Content...</h2>
                  <p className="text-gray-600 dark:text-dark-text-secondary">Please wait while we fetch the {currentContentInfo?.type || 'content'}.</p>
                </div>
              ) : currentContentInfo && currentFullContent && (isHost || !isBrowsingLocally) ? (
                <div className="space-y-6 animate-fade-in">
                  {/* Top Bar: Back Button, Page Number, Fullscreen Button */}
                  <div className="flex items-center justify-between">
                    {(!sessionId || isHost || isBrowsingLocally) && ( <BackButton onClick={handleBack} /> )}
                    <div className="flex items-center space-x-4">
                    <div className={`text-sm text-gray-500 dark:text-dark-text-muted ${(!sessionId || isHost || isBrowsingLocally) ? '' : 'ml-auto'}`}>
                        {currentIndex + 1} of {totalPhrases}
                      </div>
                      <button onClick={toggleFullScreen} className="btn-icon tooltip-wrapper group" aria-label="Enter Fullscreen">
                        <Maximize size={20} />
                        <span className="tooltip">Fullscreen</span>
                      </button>
                    </div>
                  </div>
                  {/* Content title */}
                  <div className="text-center mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-dark-text-primary">{contentTitle}</h2>
                  </div>
                  {/* Kids Mode Toggle (Only if Al-Rahman) - Condition modified to allow participants */}
                  {currentContentInfo?.type === 'quran' && currentContentInfo?.id === '55' && (
                    <div className="flex items-center justify-center mb-6">
                       <button onClick={toggleKidsMode} className={`btn btn-icon p-1 ${isKidsMode ? 'btn-accent ring-2 ring-offset-1 ring-accent-focus dark:ring-offset-dark-bg-primary' : 'btn-ghost'}`} aria-label={isKidsMode ? "Kids Mode Active - Click to Deactivate" : "Kids Mode Inactive - Click to Activate"}>
                         <img src={KidsModeIcon} alt="Kids Mode Toggle" className="w-16 h-16" /> {/* Smaller icon */}
                       </button>
                    </div>
                  )}

                  {/* Main content display (Normal View) */}
                  {isKidsMode && currentContentInfo?.type === 'quran' && currentContentInfo?.id === '55' ? (
                    // --- Kids Mode Layout (Normal View) ---
                    <div key={`kids-mode-view-${currentIndex}`} className="animate-fade-in w-full flex flex-col items-center">
                      <div className="relative w-full flex items-center justify-center mb-4" style={{ minHeight: '300px' }}> {/* Added min-height */}
                        <button onClick={prevPhrase} disabled={currentIndex === 0} className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-primary shadow-lg ${currentIndex === 0 ? 'btn-disabled opacity-30 cursor-not-allowed' : 'opacity-70 hover:opacity-100'}`} aria-label="Previous Verse"> <ChevronLeft size={32} /> </button>
                        <img src={localKidsImagePath ? localKidsImagePath : `/SurahImages/AlRahman/Verse${currentIndex + 1}.png`} alt={`Verse ${currentIndex + 1} - Kids Illustration`} className="max-w-full max-h-[40vh] object-contain rounded-lg" onError={(e) => { e.target.onerror = null; e.target.src = '/SurahImages/image_not_found.png'; e.target.alt = `Image not found for Verse ${currentIndex + 1}`; }} />
                        <button onClick={nextPhrase} disabled={currentIndex >= totalPhrases - 1} className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-primary shadow-lg ${currentIndex >= totalPhrases - 1 ? 'btn-disabled opacity-30 cursor-not-allowed' : 'opacity-70 hover:opacity-100'}`} aria-label="Next Verse"> <ChevronRight size={32} /> </button>
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
                  ) : (
                    // --- Normal Mode Layout (Inside Card - Normal View) ---
                    <div className="card p-6 md:p-8 min-h-[200px] flex flex-col justify-center items-center">
                      {/* Conditionally display standalone Bismillah only on the first verse */}
                      {currentFullContent?.displayBismillah && currentIndex === 0 && (
                        <div className="w-full mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 text-center">
                          <p className="leading-loose font-uthmani" dir="rtl" style={{ fontSize: `${arabicFontSize * 0.9}rem` }}>
                            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                          </p>
                        </div>
                      )}
                      {/* Text Content Block */}
                      <div className="w-full">
                        {/* Arabic text */}
                          <div key={`arabic-${currentIndex}`} className="text-center mb-6 animate-fade-in">
                            <p className="leading-loose font-uthmani" dir="rtl" style={{ fontSize: `${arabicFontSize}rem` }}>
                              {currentPhraseData.arabic || <span className="italic text-gray-400 dark:text-gray-600">...</span>}
                            </p>
                          </div>
                          {/* Transliteration */}
                          {showTransliteration && currentPhraseData.transliteration && (
                            <div key={`transliteration-${currentIndex}`} className="mb-4 border-t pt-4 border-gray-200 dark:border-gray-700 animate-slide-in">
                              <p className="text-gray-700 dark:text-dark-text-secondary italic" style={{ fontSize: `${transliterationFontSize}rem` }} dangerouslySetInnerHTML={{ __html: currentPhraseData.transliteration }} />
                            </div>
                          )}
                          {/* Translation */}
                          {showTranslation && currentPhraseData.translation && (
                            <div key={`translation-${currentIndex}`} className="border-t pt-4 border-gray-200 dark:border-gray-700 animate-slide-up">
                              <p className="text-gray-800 dark:text-dark-text-primary" style={{ fontSize: `${translationFontSize}rem` }} dangerouslySetInnerHTML={{ __html: currentPhraseData.translation }} />
                            </div>
                          )}
                      </div>
                      {/* Navigation Buttons */}
                      <div className="w-full flex justify-center gap-4 mt-6">
                         <button onClick={prevPhrase} disabled={currentIndex === 0} className={`btn btn-icon btn-primary ${currentIndex === 0 ? 'btn-disabled opacity-50 cursor-not-allowed' : ''}`} aria-label="Previous Verse"> <ChevronLeft size={24} /> </button>
                         <button onClick={nextPhrase} disabled={currentIndex >= totalPhrases - 1} className={`btn btn-icon btn-primary ${currentIndex >= totalPhrases - 1 ? 'btn-disabled opacity-50 cursor-not-allowed' : ''}`} aria-label="Next Verse"> <ChevronRight size={24} /> </button>
                       </div>
                    </div>
                  )}

                  {/* Action Buttons (Sync/Browse/Auto) */}
                  <div className="flex flex-wrap justify-center items-center gap-4 mt-8">
                      {!!sessionId && (
                        <div className="flex space-x-4">
                          {isHost ? (
                            <button onClick={() => setAutoAdvance(!autoAdvance)} className={`btn-secondary flex items-center ${autoAdvance ? 'ring-2 ring-primary-300 dark:ring-dark-accent' : ''}`}>
                              {autoAdvance ? ( <span className="flex items-center"> Auto <span className="ml-2 w-2 h-2 rounded-full bg-primary-500 dark:bg-dark-accent animate-pulse"></span> </span> ) : 'Auto'}
                            </button>
                          ) : (
                            <>
                              {connectionStatus === 'connected' && (
                                <>
                                  {!isSyncedToHost && ( <button onClick={syncToHost} className="btn-accent flex items-center"> <RefreshCw size={18} className="mr-2 animate-spin-slow" /> Sync </button> )}
                                  {isSyncedToHost && ( <button onClick={() => setIsBrowsingLocally(true)} className="btn-secondary flex items-center"> Browse </button> )}
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                  {/* Status Indicators */}
                  {!!sessionId && (
                    <div className="text-center mt-6">
                      {connectionStatus === 'connected' && !isHost && !isSyncedToHost && (
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 text-sm"> <RefreshCw size={16} className="mr-1.5" /> Viewing independently. Click Sync to follow host. </div>
                      )}
                      {connectionStatus !== 'connected' && (
                         <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 text-sm"> <div className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></div> Connection lost. Use the Rejoin button <LogIn size={14} className="inline mx-1"/> in the header if needed. </div>
                      )}
                    </div>
                  )}

                  {/* Footer message */}
                  <div className="text-center text-gray-500 dark:text-dark-text-muted text-sm mt-8">
                    {!!sessionId ? (isHost ? (connectionStatus === 'connected' ? "Your navigation controls the session." : "You are the host (offline). Navigation is local.") : (connectionStatus === 'connected' ? (isSyncedToHost ? "Following host." : "Viewing independently.") : "Connection lost. Navigate locally or use Rejoin in header.")) : null }
                  </div>
                </div>
              ) : !!sessionId && !isHost && !currentContentInfo && !isBrowsingLocally ? (
                <div className="flex flex-col items-center justify-center h-full py-20">
                  <div className="text-center max-w-md">
                    <div className="relative mx-auto w-20 h-20 mb-6">
                       <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-dark-bg-tertiary opacity-25"></div>
                       <div className="absolute inset-0 w-full h-full rounded-full border-4 border-t-primary-500 dark:border-t-dark-accent animate-spin"></div>
                     </div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-3">Waiting for Host</h2>
                    <p className="text-gray-600 dark:text-dark-text-secondary">The host hasn't selected any content yet.</p>
                     <button onClick={() => setIsBrowsingLocally(true)} className="btn-secondary flex items-center mt-6 mx-auto"> Browse Independently </button>
                   </div>
                </div>
              ) : ( // Render DuaSelectionPage normally
                <DuaSelectionPage
                  onSelectDua={handleContentSelection}
                  onSelectQuran={handleContentSelection}
                  onBack={handleBack}
                  isKidsMode={isKidsMode}
                />
              )}
          </div>
        )}

        {/* Fullscreen View Container */}
        {isFullScreen && currentContentInfo && currentFullContent && (
          <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-bg-primary dark:to-dark-bg-secondary dark:text-dark-text-primary overflow-y-auto flex flex-col p-4 md:p-8 animate-fade-in">
            {/* Fullscreen Header: Title and Exit Button */}
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-dark-text-primary">{contentTitle}</h2>
              <button onClick={toggleFullScreen} className="btn-icon tooltip-wrapper group" aria-label="Exit Fullscreen">
                <Minimize size={24} />
                <span className="tooltip">Exit Fullscreen</span>
              </button>
            </div>

            {/* Fullscreen Content Area (Scrollable) - Removed flex-1, kept overflow-y-auto, added padding-top */}
            <div className="flex-1 min-h-0"> {/* Let outer container handle scrolling and flex */}
              {/* Kids Mode Fullscreen - Simplified structure */}
              {isKidsMode && currentContentInfo?.type === 'quran' && currentContentInfo?.id === '55' ? (
                <> {/* Use Fragment to avoid extra div */}
                  {/* Image container - Added max-width, mx-auto and padding */}
                  <div className="relative w-full max-w-4xl mx-auto flex items-center justify-center mb-4 px-4">
                    <button onClick={prevPhrase} disabled={currentIndex === 0} className={`absolute left-2 md:left-0 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-lg btn-primary shadow-lg ${currentIndex === 0 ? 'btn-disabled opacity-30 cursor-not-allowed' : 'opacity-70 hover:opacity-100'}`} aria-label="Previous Verse"> <ChevronLeft size={40} /> </button>
                    {/* Re-added max-h constraint */}
                    <img src={localKidsImagePath ? localKidsImagePath : `/SurahImages/AlRahman/Verse${currentIndex + 1}.png`} alt={`Verse ${currentIndex + 1} - Kids Illustration`} className="max-w-full h-auto max-h-[75vh] object-contain rounded-lg" onError={(e) => { e.target.onerror = null; e.target.src = '/SurahImages/image_not_found.png'; e.target.alt = `Image not found for Verse ${currentIndex + 1}`; }} />
                    <button onClick={nextPhrase} disabled={currentIndex >= totalPhrases - 1} className={`absolute right-2 md:right-0 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-lg btn-primary shadow-lg ${currentIndex >= totalPhrases - 1 ? 'btn-disabled opacity-30 cursor-not-allowed' : 'opacity-70 hover:opacity-100'}`} aria-label="Next Verse"> <ChevronRight size={40} /> </button>
                  </div>
                  {/* Text container - Added max-width, mx-auto and padding */}
                  <div className="w-full max-w-4xl mx-auto px-4 flex-shrink-0">
                     <p className="text-center mb-2 text-base text-gray-500 dark:text-dark-text-muted">Verse {currentIndex + 1} of {totalPhrases}</p>
                     <div key={`arabic-kids-fs-${currentIndex}`} className="text-center mb-4">
                       <p className="leading-loose font-uthmani" dir="rtl" style={{ fontSize: `${arabicFontSize * 1.2}rem` }}> {currentPhraseData.arabic || <span className="italic text-gray-400 dark:text-gray-600">...</span>} </p> {/* Slightly larger font */}
                     </div>
                     {showTranslation && currentPhraseData.translation && (
                       <div key={`translation-kids-fs-${currentIndex}`} className="text-center border-t pt-3 border-gray-200 dark:border-gray-700">
                         <p className="text-gray-800 dark:text-dark-text-primary" style={{ fontSize: `${translationFontSize * 1.1}rem` }} dangerouslySetInnerHTML={{ __html: currentPhraseData.translation }} /> {/* Slightly larger font */}
                       </div>
                     )}
                  </div>
                </> // Close the fragment started for Kids Mode Fullscreen
              ) : (
                // --- Normal Mode Fullscreen ---
                // Removed inner flex container properties (flex-grow, justify-center)
                // Added mx-auto for horizontal centering and py-4 for vertical padding
                <div className="w-full max-w-5xl mx-auto py-4">
                  {/* Conditionally display standalone Bismillah only on the first verse */}
                  {currentFullContent?.displayBismillah && currentIndex === 0 && (
                    <div className="w-full mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 text-center">
                      <p className="leading-loose font-uthmani" dir="rtl" style={{ fontSize: `${arabicFontSize * 1.1}rem` }}> {/* Slightly larger for fullscreen */}
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                      </p>
                    </div>
                  )}
                  {/* Text Content Block */}
                  <div className="w-full mb-6">
                    {/* Arabic text */}
                    <div key={`arabic-fs-${currentIndex}`} className="text-center mb-8">
                      <p className="leading-loose font-uthmani" dir="rtl" style={{ fontSize: `${arabicFontSize * 1.3}rem` }}> {/* Larger font */}
                        {currentPhraseData.arabic || <span className="italic text-gray-400 dark:text-gray-600">...</span>}
                      </p>
                    </div>
                    {/* Transliteration */}
                    {showTransliteration && currentPhraseData.transliteration && (
                      <div key={`transliteration-fs-${currentIndex}`} className="mb-6 border-t pt-6 border-gray-200 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-dark-text-secondary italic text-center" style={{ fontSize: `${transliterationFontSize * 1.1}rem` }} dangerouslySetInnerHTML={{ __html: currentPhraseData.transliteration }} /> {/* Larger font */}
                      </div>
                    )}
                    {/* Translation */}
                    {showTranslation && currentPhraseData.translation && (
                      <div key={`translation-fs-${currentIndex}`} className="border-t pt-6 border-gray-200 dark:border-gray-700">
                        <p className="text-gray-800 dark:text-dark-text-primary text-center" style={{ fontSize: `${translationFontSize * 1.1}rem` }} dangerouslySetInnerHTML={{ __html: currentPhraseData.translation }} /> {/* Larger font */}
                      </div>
                    )}
                  </div>
                  {/* Navigation Buttons - Removed mt-auto, added explicit margin */}
                  <div className="w-full flex justify-center gap-6 mt-8 flex-shrink-0">
                     <button onClick={prevPhrase} disabled={currentIndex === 0} className={`btn btn-lg btn-circle btn-primary ${currentIndex === 0 ? 'btn-disabled opacity-50 cursor-not-allowed' : ''}`} aria-label="Previous Verse"> <ChevronLeft size={32} /> </button>
                     <button onClick={nextPhrase} disabled={currentIndex >= totalPhrases - 1} className={`btn btn-lg btn-circle btn-primary ${currentIndex >= totalPhrases - 1 ? 'btn-disabled opacity-50 cursor-not-allowed' : ''}`} aria-label="Next Verse"> <ChevronRight size={32} /> </button>
                   </div>
                </div>
              )}
            </div>
             {/* Page number at the bottom */}
             <div className="text-center text-sm text-gray-500 dark:text-dark-text-muted mt-4 flex-shrink-0">
               {currentIndex + 1} of {totalPhrases}
             </div>
          </div>
        )}
      </div>

      {/* Settings modal - Conditionally render based on fullscreen state */}
      {!isFullScreen && showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="card w-full max-w-md animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold dark:text-dark-text-primary">Settings</h3>
              <button onClick={() => setShowSettings(false)} className="btn-icon"> <X size={24} /> </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
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
              {/* Download Content Section */}
              <div>
                <label className="block text-gray-700 dark:text-dark-text-secondary mb-3 font-medium">Download Content</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-dark-bg-secondary p-3 rounded-lg">
                    <span className="dark:text-dark-text-secondary">Kids Mode Images (Al-Rahman)</span>
                    <div className="flex items-center space-x-2">
                      {downloadStatus.alRahmanImages === 'checking' && <Loader size={18} className="animate-spin text-gray-500" />}
                      {downloadStatus.alRahmanImages === 'downloading' && <Loader size={18} className="animate-spin text-blue-500" />}
                      {downloadStatus.alRahmanImages === 'downloaded' && <CheckCircle size={18} className="text-green-500" />}
                      {downloadStatus.alRahmanImages === 'error' && <X size={18} className="text-red-500" />}
                      {downloadStatus.alRahmanImages !== 'downloaded' && (
                        <button onClick={() => handleDownload('alRahmanImages', 'images', 'AlRahman')} className="btn-icon-sm btn-primary" disabled={downloadStatus.alRahmanImages === 'checking' || downloadStatus.alRahmanImages === 'downloading'} aria-label="Download Al-Rahman Images"> <DownloadCloud size={16} /> </button>
                      )}
                      {downloadStatus.alRahmanImages === 'downloaded' && (
                        <button onClick={() => handleDelete('alRahmanImages', 'images', 'AlRahman')} className="btn-icon-sm btn-danger" disabled={downloadStatus.alRahmanImages === 'checking' || downloadStatus.alRahmanImages === 'downloading'} aria-label="Delete Al-Rahman Images"> <Trash2 size={16} /> </button>
                      )}
                    </div>
                  </div>
                </div>
                {downloadError && <p className="text-red-500 text-sm mt-2">{downloadError}</p>}
              </div>
              {/* Auto-Advance Settings */}
              {isHost && connectionStatus === 'connected' && (
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
      {!isFullScreen && showNameInputDialog && <NameInputDialog onSubmit={handleNameSubmit} onClose={() => { setShowNameInputDialog(false); setIsJoining(false); }} />}
      {!isFullScreen && <RejoinDialog isOpen={showRejoinDialog} onClose={() => setShowRejoinDialog(false)} onSubmit={({ sessionId: rejoinSessionId, username: rejoinUsername }) => { setShowRejoinDialog(false); setLocalError(null); console.log(`Attempting explicit rejoin for session ${rejoinSessionId} as ${rejoinUsername}`); if (connectionStatus !== 'connected') { console.log("Not connected, attempting connection first..."); connectToServer(); } joinSession(rejoinSessionId, rejoinUsername, isHost); }} initialSessionId={sessionId} initialUsername={username} />}
    </div>
  );
};

export default DuaSyncApp;
