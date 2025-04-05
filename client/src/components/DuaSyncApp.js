import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Users, Settings, X, Share2, RefreshCw, Crown, UserPlus, Loader, LogIn, PlusCircle } from 'lucide-react'; // Added Loader, LogIn, PlusCircle
import { useSocket } from '../contexts/SocketContext';
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
  // const [contentType, setContentType] = useState('dua'); // Determined by currentContentInfo.type now
  // const [content, setContent] = useState(null); // Replaced by currentFullContent
  // const [currentIndex, setCurrentIndex] = useState(0); // Now comes from context
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showParticipantsDialog, setShowParticipantsDialog] = useState(false);
  const [showNameInputDialog, setShowNameInputDialog] = useState(false);
  const [showJoinInputInHeader, setShowJoinInputInHeader] = useState(false); // New state for header join input
  const [sessionUrl, setSessionUrl] = useState('');
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [autoAdvanceInterval, setAutoAdvanceInterval] = useState(10);
  const [localError, setLocalError] = useState(null); // Local error state for UI actions
  const [joinSessionId, setJoinSessionId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'create' or 'join' - action to take after connection
  // const [pendingRejoinDetails, setPendingRejoinDetails] = useState(null); // Removed - rejoin now automatic in context
  const [showRejoinDialog, setShowRejoinDialog] = useState(false); // State for the rejoin dialog
  // const [contentSelected, setContentSelected] = useState(false); // Determined by !!currentContentInfo
  const [isBrowsingLocally, setIsBrowsingLocally] = useState(false); // Keep for participant browsing UI flow

  // Combine context error and local error for display
  const displayError = contextError || localError;

  // Font Size State - Initialize safely from localStorage or defaults (Keep as is)
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

  // Save font sizes to localStorage whenever they change (ensure saving valid numbers)
  useEffect(() => { if (!isNaN(arabicFontSize)) localStorage.setItem('arabicFontSize', arabicFontSize); }, [arabicFontSize]);
  useEffect(() => { if (!isNaN(transliterationFontSize)) localStorage.setItem('transliterationFontSize', transliterationFontSize); }, [transliterationFontSize]);
  useEffect(() => { if (!isNaN(translationFontSize)) localStorage.setItem('translationFontSize', translationFontSize); }, [translationFontSize]);

  // --- Removed Effects ---
  // Removed effect for handling contentType change (now derived from currentContentInfo)
  // Removed effect for updating local content based on currentDua (now handled by currentFullContent from context fetch)

  // Update session URL when sessionId changes (Keep as is)
  useEffect(() => {
      if (sessionId) {
          // Ensure URL uses http for local testing if needed, adjust as necessary
          const protocol = window.location.protocol;
          const hostname = window.location.hostname;
          const port = window.location.port ? `:${window.location.port}` : '';
          const url = `${protocol}//${hostname}${port}?session=${sessionId}`;
          setSessionUrl(url);
      } else {
          setSessionUrl('');
      }
  }, [sessionId]);

  // Check URL for session ID on component mount - Updated to trigger connection flow
  useEffect(() => {
    // Don't run this if already connected or connecting or in a session
    if (connectionStatus === 'connected' || connectionStatus === 'connecting' || sessionId) return;

    const params = new URLSearchParams(window.location.search);
    const sessionIdFromUrl = params.get('session');

    if (sessionIdFromUrl) {
      console.log("Session ID found in URL, attempting to join:", sessionIdFromUrl);
      setJoinSessionId(sessionIdFromUrl);
      setIsJoining(true); // Mark as joining
      setPendingAction('join'); // Set pending action
      // Trigger connection if disconnected (removed the delay)
      if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
        connectToServer();
      }
      // The useEffect below will handle showing the NameInputDialog once connected
    }
  }, [connectionStatus, connectToServer, sessionId]); // Add dependencies

  // Effect to handle showing NameInputDialog after successful connection
  useEffect(() => {
    if (connectionStatus === 'connected' && pendingAction) {
      console.log(`Connection established, proceeding with pending action: ${pendingAction}`);
      setShowNameInputDialog(true);
      // Reset pending action after triggering dialog
      setPendingAction(null);
    }
  }, [connectionStatus, pendingAction]);

  // Removed useEffect for pendingRejoinDetails

  // Auto-advance effect (for host only) - Updated
  useEffect(() => {
    let interval;
    // Use currentFullContent to check length
    const totalPhrases = currentFullContent?.totalAyahs ?? (currentFullContent?.verses?.arabic?.length ?? 0);

    if (autoAdvance && isHost && sessionId && currentFullContent && totalPhrases > 0) {
      interval = setInterval(() => {
        if (currentIndex < totalPhrases - 1) {
          const newIndex = currentIndex + 1;
          // Use context action to update host index and notify others
          updateHostIndex(newIndex);
        } else {
          // Stop auto-advance at the end
          setAutoAdvance(false);
        }
      }, autoAdvanceInterval * 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoAdvance, autoAdvanceInterval, currentFullContent, currentIndex, isHost, sessionId, updateHostIndex]);

  // --- Navigation Actions ---
  const navigate = (direction) => {
    const totalPhrases = currentFullContent?.totalAyahs ?? (currentFullContent?.verses?.arabic?.length ?? 0);
    if (!currentFullContent || totalPhrases === 0) return;

    const newIndex = currentIndex + direction;

    if (newIndex >= 0 && newIndex < totalPhrases) {
      if (isHost) {
        updateHostIndex(newIndex); // Host updates globally
      } else {
        updateLocalIndex(newIndex); // Participant updates locally (if unsynced)
      }
    }
  };

  const nextPhrase = () => navigate(1);
  const prevPhrase = () => navigate(-1);
  // --- End Navigation Actions ---

  // Start hosting a session - Updated for on-demand connection
  const startHosting = () => {
    setLocalError(null); // Clear local error
    if (connectionStatus === 'connected') {
      // Already connected, show name input directly
      setShowNameInputDialog(true);
    } else if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
      // Not connected, initiate connection and set pending action
      setPendingAction('create');
      connectToServer();
    }
    // If 'connecting', do nothing (button should be disabled)
  };

  // Join as participant - Updated for on-demand connection
  const joinAsParticipant = () => {
    if (!joinSessionId) {
      setLocalError("Please enter a Session ID to join.");
      return;
    }
    setLocalError(null); // Clear local error
    setIsJoining(true); // Keep this flag

    if (connectionStatus === 'connected') {
      // Already connected, show name input directly
      setShowNameInputDialog(true);
    } else if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
      // Not connected, initiate connection and set pending action
      setPendingAction('join');
      connectToServer();
    }
    // If 'connecting', do nothing (button should be disabled)
  };

  // Handle name submission for initial join/create
  const handleNameSubmit = (name) => {
    setShowNameInputDialog(false);
    setLocalError(null); // Clear local error

    // Determine if the original intent was joining or creating
    // Note: isJoining flag might be slightly less reliable now,
    // relying on joinSessionId being present is better for join action.
    if (joinSessionId) {
      joinSession(joinSessionId, name); // Context action handles connection check
    } else {
      createSession(name); // Context action handles connection check
    }

    // Reset join state variables after submission attempt
    setIsJoining(false);
    setJoinSessionId('');
    // pendingAction should have been cleared by the useEffect hook already
  };

  // Transfer host to another participant - Updated
  const transferHost = (newHostId) => {
    if (!isHost || !socket || !sessionId || connectionStatus !== 'connected') return; // Check connection
    setLocalError(null);
    socket.emit('transfer_host', { sessionId, newHostId });
    setShowParticipantsDialog(false);
  };

  // Update settings - Keep as is (assuming client-side preferences for now)
  const saveSettings = () => {
    // If settings need to be synced via host, emit an event here
    // Example: socket.emit('update_session_settings', { sessionId, settings: { showTranslation, showTransliteration } });
    setShowSettings(false);
  };

  // Handle session ID input for joining (Keep as is)
  const handleJoinSessionIdChange = (e) => {
    setJoinSessionId(e.target.value);
  };

  // Handle Dua/Quran selection - Updated to use selectContentAsHost/Locally
  const handleContentSelection = (contentInfo) => { // Expects { type, id, title }
    if (!contentInfo) return;
    setLocalError(null);

    // NEW: Handle selection when not in a session (default view)
    if (!sessionId) {
      selectContentLocally(contentInfo); // Just load the content locally
      // No need to change isBrowsingLocally or show share dialog
    }
    // Existing logic for when in a session
    else if (isHost && connectionStatus === 'connected') { // Ensure host is connected
      selectContentAsHost(contentInfo); // Host selects for everyone
      setShowShareDialog(true); // Show share dialog for host
    } else if (isBrowsingLocally) {
      selectContentLocally(contentInfo); // Participant selects only for themselves
      setIsBrowsingLocally(false); // Exit browsing mode
    } else if (!isHost && !isBrowsingLocally && connectionStatus === 'connected') { // Participant is synced
      // If participant clicks content while synced, treat as starting local browsing
      selectContentLocally(contentInfo);
      setIsBrowsingLocally(true); // Start browsing locally
    } else if (!isHost && connectionStatus !== 'connected') {
       // If participant clicks content while disconnected in a session, load locally
       selectContentLocally(contentInfo);
       // Keep isBrowsingLocally as it might have been true before disconnect
    }
    // The UI will transition based on context updates (currentContentInfo/currentFullContent)
  };

  // --- Back Button Logic ---
  const handleBack = () => {
    setLocalError(null);

    // Scenario 0: Not in session, viewing content -> Go back to selection
    if (!sessionId && currentContentInfo) {
        selectContentLocally(null); // Clear local selection
        // This will set currentContentInfo to null, and _performFetch won't run or will clear currentFullContent
        return; // Handled
    }

    // Scenario 1: In session, viewing content -> Go back to selection/options
    if (sessionId && currentContentInfo) {
      if (isHost && connectionStatus === 'connected') { // Check connection
        // Host goes back from content view -> Show selection page again
        selectContentAsHost(null); // Deselect content
      } else if (isBrowsingLocally) {
         // Participant was browsing locally and viewing content -> Stop browsing
         setIsBrowsingLocally(false);
         if (connectionStatus === 'connected') { // Only sync if connected
           syncToHost(); // Re-sync to host when stopping browsing
         } else {
           // If disconnected, just clear local content when stopping browsing
           selectContentLocally(null);
         }
      } else if (!isHost && connectionStatus === 'connected') { // Participant was synced
        // Participant was synced and viewing content -> Start Browsing
        setIsBrowsingLocally(true);
        // Keep viewing current content until they select something else or sync
      } else if (!isHost && connectionStatus !== 'connected') {
        // Participant was viewing content while disconnected -> Go back to selection page locally
        selectContentLocally(null);
      }
      return; // Handled
    }
    // Scenario 2: In session, Host is on selection page -> Leave session
    else if (sessionId && isHost && !currentContentInfo && connectionStatus === 'connected') { // Check connection
       if (socket) {
         socket.emit('leave_session', { sessionId });
         // Reset local state after leaving? Might be better handled by context/server event
       }
       return; // Handled
    }
    // Scenario 3: In session, Participant is browsing (on selection page) -> Stop browsing
    else if (sessionId && !isHost && isBrowsingLocally) {
       setIsBrowsingLocally(false);
       if (connectionStatus === 'connected') { // Only sync if connected
         syncToHost(); // Re-sync
       }
       return; // Handled
    }
    // Scenario 4: Not in session (on initial selection screen) -> No action needed
    // else { }
  };
  // --- End Back Button Logic ---

  // --- Memoized values for rendering ---
  const contentTitle = currentContentInfo?.title || '';
  const contentSource = currentFullContent?.source || (currentContentInfo?.type === 'quran' ? 'Quran' : ''); // Add source if available
  const totalPhrases = currentFullContent?.totalAyahs ?? 0;

  // Determine current phrase data based on content type
  const currentPhraseData = useMemo(() => {
    if (!currentFullContent || totalPhrases === 0 || currentIndex >= totalPhrases) {
      return { arabic: '', transliteration: '', translation: '' };
    }

    if (currentContentInfo?.type === 'quran') {
      // Quran structure: currentFullContent.verses is array [{ayah, arabic, transliteration, translation}, ...]
      // Reverted: Server now sends full arabic text including symbol
      const verse = currentFullContent.verses[currentIndex];
      return {
        arabic: verse?.arabic || '',
        // arabicAyahEnd: verse?.arabicAyahEnd || '', // Removed
        transliteration: verse?.transliteration || '',
        translation: verse?.translation || '',
      };
    } else if (currentContentInfo?.type === 'dua') {
      // Dua structure: currentFullContent.verses is { arabic: [], transliteration: [], translation: [] }
      return {
        arabic: currentFullContent.verses?.arabic?.[currentIndex] || '',
        transliteration: currentFullContent.verses?.transliteration?.[currentIndex] || '',
        translation: currentFullContent.verses?.translation?.[currentIndex] || '',
      };
    }

    return { arabic: '', transliteration: '', translation: '' };
  }, [currentFullContent, currentIndex, totalPhrases, currentContentInfo?.type]);
  // --- End Memoized values ---

  // Debug log before render
  console.log('Rendering DuaSyncApp:', {
    sessionId: !!sessionId,
    currentContentInfo: !!currentContentInfo,
    currentFullContent: !!currentFullContent,
    isLoadingContent,
    isBrowsingLocally,
    isHost,
     connectionStatus
   });

  // Add more detailed log for the specific condition check
  if (!sessionId && !currentContentInfo) {
    console.log("Render Check: Condition met for initial DuaSelectionPage (!sessionId && !currentContentInfo).");
  } else {
    console.log("Render Check: Condition NOT met for initial DuaSelectionPage.", { sessionId: !!sessionId, currentContentInfo: !!currentContentInfo });
  }

   return (
     <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-bg-primary dark:to-dark-bg-secondary dark:text-dark-text-primary transition-colors duration-300">
      {/* Header */}
      {/* Header */}
      <header className="page-header relative z-10">
        <div className="container-narrow flex items-center justify-between flex-wrap gap-y-2"> {/* Added gap-y */}
          <h1 className="text-xl md:text-2xl font-bold flex items-center text-gray-800 dark:text-dark-text-primary"> {/* Adjusted text color */}
            <span className="bg-primary-100 dark:bg-dark-primary p-2 rounded-lg mr-2 text-primary-600 dark:text-white"> {/* Adjusted colors */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> {/* Added strokeWidth */}
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </span>
            IqraTogether
          </h1>
          <div className="flex items-center space-x-1 md:space-x-2"> {/* Reduced spacing slightly */}
            {/* Session controls - Show EITHER session buttons OR create/join buttons */}
            {!sessionId ? (
              // --- Not in Session: Show Create/Join ---
              <div className="flex items-center space-x-2">
                {showJoinInputInHeader ? (
                  // Show Join Input Field
                  <div className="flex items-center space-x-1 bg-white dark:bg-dark-bg-tertiary p-1 rounded-lg shadow-sm">
                    <input
                      type="text"
                      value={joinSessionId}
                      onChange={handleJoinSessionIdChange}
                      className="input-sm border-none focus:ring-0 dark:bg-dark-bg-tertiary"
                      placeholder="Session ID"
                      disabled={connectionStatus === 'connecting'}
                    />
                    <button
                      onClick={joinAsParticipant}
                      className={`btn-xs btn-accent flex items-center ${connectionStatus === 'connecting' ? 'btn-disabled' : ''}`}
                      disabled={connectionStatus === 'connecting' || !joinSessionId}
                      aria-label="Join Session"
                    >
                      {connectionStatus === 'connecting' && pendingAction === 'join' ? <Loader size={14} className="animate-spin" /> : <UserPlus size={14} />}
                    </button>
                    <button
                      onClick={() => { setShowJoinInputInHeader(false); setJoinSessionId(''); }}
                      className="btn-xs btn-icon text-gray-500 hover:bg-gray-200 dark:hover:bg-dark-bg-secondary"
                      aria-label="Cancel Join"
                      disabled={connectionStatus === 'connecting'}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  // Show Create/Join Buttons
                  <>
                    <button
                      onClick={startHosting}
                      className={`btn-sm btn-primary flex items-center ${connectionStatus === 'connecting' ? 'btn-disabled' : ''}`}
                      disabled={connectionStatus === 'connecting'}
                    >
                      {connectionStatus === 'connecting' && pendingAction === 'create' ? (
                        <Loader size={16} className="animate-spin mr-1" />
                      ) : (
                        <PlusCircle size={16} className="mr-1" />
                      )}
                      Create
                    </button>
                    <button
                      onClick={() => setShowJoinInputInHeader(true)}
                      className={`btn-sm btn-accent flex items-center ${connectionStatus === 'connecting' ? 'btn-disabled' : ''}`}
                      disabled={connectionStatus === 'connecting'}
                    >
                      <UserPlus size={16} className="mr-1" /> Join
                    </button>
                  </>
                )}
              </div>
            ) : (
              // --- In Session: Show Regular Controls (if connected) ---
              connectionStatus === 'connected' && (
                <>
                  <button onClick={() => setShowParticipantsDialog(true)} className="btn-icon tooltip-wrapper group" aria-label="Participants">
                    <Users size={20} />
                    <span className="tooltip">Participants ({participants.length})</span> {/* Show count */}
                  </button>
                  {/* Only show Share button to Host */}
                  {isHost && (
                    <button onClick={() => setShowShareDialog(true)} className="btn-icon tooltip-wrapper group" aria-label="Share">
                      <Share2 size={20} />
                      <span className="tooltip">Share Session</span>
                    </button>
                  )}
                </>
              )
            )}
            {/* Settings and Theme Toggle (Always visible) */}
            <button
              onClick={() => setShowSettings(!showSettings)} className="btn-icon tooltip-wrapper group ml-2" aria-label="Settings"> {/* Added ml-2 for spacing */}
              <Settings size={20} />
              <span className="tooltip">Settings</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Connection status indicator */}
      {connectionStatus === 'connecting' && (
        <div className="bg-blue-100 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 px-4 py-2 text-center text-sm font-medium">
          <div className="container-narrow flex items-center justify-center">
            <Loader size={16} className="animate-spin mr-2" />
            Connecting...
          </div>
        </div>
      )}
      {/* Show disconnected only if an attempt was made */}
      {connectionStatus === 'disconnected' && hasAttemptedConnection && (
        <div className="bg-red-100 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-2 text-center text-sm font-medium">
          <div className="container-narrow flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
            Disconnected
          </div>
        </div>
      )}
      {/* Keep existing error message display */}
      {/* Error message */}
      {displayError && (
        <div className="bg-red-100 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-2 text-center">
          <div className="container-narrow flex justify-between items-center">
            <span>{displayError}</span>
            <button onClick={() => { setLocalError(null); /* Also clear context error? Maybe not */ }} className="btn-icon text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Host status badge - Show only if connected */}
      {connectionStatus === 'connected' && !!sessionId && (
        <div className="bg-primary-50 dark:bg-dark-bg-secondary border-b border-primary-100 dark:border-dark-bg-tertiary">
          <div className="container-narrow py-2 flex flex-wrap justify-between items-center gap-x-4 gap-y-1"> {/* Added flex-wrap and gap */}
            <div className="flex items-center">
              <span className="text-sm text-gray-600 dark:text-dark-text-secondary">
                User: <span className="font-medium">{username || '...'}</span>
              </span>
              {isHost && (
                <span className="ml-2 badge-primary inline-flex items-center"> {/* Added inline-flex */}
                  <Crown size={12} className="mr-1" /> Host
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-dark-text-muted">
              <span>Session: <span className="font-medium">{sessionId}</span> | {participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
              {/* Add persistent Rejoin button here */}
              <button
                onClick={() => setShowRejoinDialog(true)}
                className="btn-icon-sm tooltip-wrapper group"
                aria-label="Rejoin Session"
                disabled={connectionStatus === 'connecting'} // Disable if connecting
              >
                <LogIn size={16} />
                 <span className="tooltip">Rejoin Session</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {/* Show only if in session and content is selected */}
      {connectionStatus === 'connected' && !!sessionId && currentContentInfo && totalPhrases > 0 && (
        <div className="container-narrow pt-4">
          <ProgressIndicator
            currentIndex={currentIndex} // Use index from context
            // Pass host index if participant is unsynced
            hostIndex={!isHost && !isSyncedToHost ? hostSelectedContentInfo?.currentIndex ?? 0 : currentIndex}
            totalPhrases={totalPhrases}
            isSynced={isSyncedToHost || isHost} // Use context sync state
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container-narrow py-6">
          {/* --- Original Render Logic --- */}
          {
            // 1. Show Content Viewer if content is selected AND loaded
            currentContentInfo && currentFullContent ? (
              <div className="space-y-6 animate-fade-in">
                {/* Back button and Content navigation status */}
                <div className="flex items-center justify-between">
                 {/* Back button logic might need adjustment based on session state */}
                 <BackButton onClick={handleBack} />
                 <div className="text-sm text-gray-500 dark:text-dark-text-muted">
                   {currentIndex + 1} of {totalPhrases}
                 </div>
               </div>

              {/* Content title */}
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-dark-text-primary">{contentTitle}</h2>
                {contentSource && <p className="text-gray-600 dark:text-dark-text-secondary mt-1">{contentSource}</p>}
              </div>

              {/* Main content display */}
              <div className="card p-6 md:p-8 min-h-[200px]"> {/* Added min-height */}
                {/* Arabic text */}
                <div key={`arabic-${currentIndex}`} className="text-right mb-6 animate-fade-in">
                  {/* Apply font and add letter-spacing */}
                  <p
                    className="leading-loose font-uthmani"
                    dir="rtl"
                    style={{ fontSize: `${arabicFontSize}rem` }} // Removed letter-spacing
                  >
                    {currentPhraseData.arabic || <span className="italic text-gray-400 dark:text-gray-600">...</span>}
                  </p>
                </div>

                {/* Transliteration - Use dangerouslySetInnerHTML */}
                {showTransliteration && currentPhraseData.transliteration && (
                  <div key={`transliteration-${currentIndex}`} className="mb-4 border-t pt-4 border-gray-200 dark:border-gray-700 animate-slide-in">
                    <p
                      className="text-gray-700 dark:text-dark-text-secondary italic"
                      style={{ fontSize: `${transliterationFontSize}rem` }}
                      dangerouslySetInnerHTML={{ __html: currentPhraseData.transliteration }}
                    />
                  </div>
                )}

                {/* Translation - Use dangerouslySetInnerHTML */}
                {showTranslation && currentPhraseData.translation && (
                  <div key={`translation-${currentIndex}`} className="border-t pt-4 border-gray-200 dark:border-gray-700 animate-slide-up">
                    <p
                      className="text-gray-800 dark:text-dark-text-primary"
                      style={{ fontSize: `${translationFontSize}rem` }}
                      dangerouslySetInnerHTML={{ __html: currentPhraseData.translation }}
                    />
                  </div>
                )}
              </div>

              {/* Navigation controls */}
              <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-8">
                {/* Previous/Next Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={prevPhrase}
                    disabled={currentIndex === 0}
                    className={`btn flex items-center ${currentIndex === 0 ? 'btn-disabled' : 'btn-primary'}`}
                  >
                    <ChevronLeft size={20} className="mr-1" /> Previous
                  </button>
                  <button
                    onClick={nextPhrase}
                    disabled={currentIndex >= totalPhrases - 1}
                    className={`btn flex items-center ${currentIndex >= totalPhrases - 1 ? 'btn-disabled' : 'btn-primary'}`}
                  >
                    Next <ChevronRight size={20} className="ml-1" />
                  </button>
                </div>

                {/* Action Buttons - Conditionally show based on session state */}
                {!!sessionId && ( // Only show session-related buttons if in a session
                  <div className="flex space-x-4 mt-4 md:mt-0">
                    {isHost ? (
                      // Host: Auto-advance button
                      <button
                        onClick={() => setAutoAdvance(!autoAdvance)}
                        className={`btn-secondary flex items-center ${autoAdvance ? 'ring-2 ring-primary-300 dark:ring-dark-accent' : ''}`}
                      >
                        {autoAdvance ? (
                          <span className="flex items-center">
                            Auto <span className="ml-2 w-2 h-2 rounded-full bg-primary-500 dark:bg-dark-accent animate-pulse"></span>
                          </span>
                        ) : 'Auto'}
                      </button>
                    ) : (
                      // Participant: Sync/Browse buttons (Reconnect button moved to header)
                      <>
                        {/* Only show Sync/Browse if connected */}
                        {connectionStatus === 'connected' && (
                          <>
                            {!isSyncedToHost && (
                              <button onClick={syncToHost} className="btn-accent flex items-center">
                                <RefreshCw size={18} className="mr-2 animate-spin-slow" /> Sync
                              </button>
                            )}
                            {/* Show Browse button only if synced? Or always when viewing content? Let's show if synced. */}
                            {isSyncedToHost && (
                              <button onClick={() => setIsBrowsingLocally(true)} className="btn-secondary flex items-center">
                                Browse
                              </button>
                            )}
                          </>
                        )}
                        {/* No button needed here when disconnected, Rejoin is in header */}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Combined Status Indicators - Conditionally show based on session state */}
              {!!sessionId && ( // Only show session-related status if in a session
                <div className="text-center mt-6">
                  {/* Show sync status only if connected AND unsynced */}
                  {connectionStatus === 'connected' && !isHost && !isSyncedToHost && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 text-sm">
                      <RefreshCw size={16} className="mr-1.5" />
                      Viewing independently. Click Sync to follow host.
                    </div>
                  )}

                  {/* Show disconnected message if applicable (and in a session) - Updated text */}
                  {connectionStatus !== 'connected' && ( // Simplified check
                     <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 text-sm">
                       <div className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></div>
                       Connection lost. Use the Rejoin button <LogIn size={14} className="inline mx-1"/> in the header if needed.
                     </div>
                  )}
                </div>
              )}

              {/* Footer message - Adjusted for connection status and session state */}
              <div className="text-center text-gray-500 dark:text-dark-text-muted text-sm mt-8">
                {!!sessionId
                  ? (isHost
                      ? (connectionStatus === 'connected' ? "Your navigation controls the session." : "You are the host (offline). Navigation is local.")
                      : (connectionStatus === 'connected' ? (isSyncedToHost ? "Following host." : "Viewing independently.") : "Connection lost. Navigate locally or use Rejoin in header.")
                    )
                  : "Viewing content locally." // Message when not in a session
                }
              </div>
            </div>
          ) : // 2. Show Loading Indicator if content is selected but not yet loaded
          isLoadingContent ? (
            <div className="flex flex-col items-center justify-center h-full py-20">
              <Loader size={48} className="animate-spin text-primary-500 dark:text-primary-400 mb-6" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-3">Loading Content...</h2>
              <p className="text-gray-600 dark:text-dark-text-secondary">Please wait while we fetch the {currentContentInfo?.type || 'content'}.</p>
            </div>
          // 3. Show Waiting Screen (Participant, in session, host hasn't selected, not browsing)
          ) : !!sessionId && !isHost && !currentContentInfo && !isBrowsingLocally ? (
            <div className="flex flex-col items-center justify-center h-full py-20">
               <div className="text-center max-w-md">
                {/* Waiting Spinner */}
                <div className="relative mx-auto w-20 h-20 mb-6">
                   <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-dark-bg-tertiary opacity-25"></div>
                   <div className="absolute inset-0 w-full h-full rounded-full border-4 border-t-primary-500 dark:border-t-dark-accent animate-spin"></div>
                 </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-dark-text-primary mb-3">Waiting for Host</h2>
                <p className="text-gray-600 dark:text-dark-text-secondary">The host hasn't selected any content yet.</p>
                 {/* Browse Button */}
                 <button onClick={() => setIsBrowsingLocally(true)} className="btn-secondary flex items-center mt-6 mx-auto">
                    Browse Independently
                  </button>
               </div>
            </div>
          // 4. Show Selection Page (Default: Covers initial load, local browsing, host selection, participant browsing)
          ) : (
            <DuaSelectionPage
              onSelectDua={handleContentSelection}
              onSelectQuran={handleContentSelection}
              onBack={handleBack}
            />
          )}
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="card w-full max-w-md animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold dark:text-dark-text-primary">Settings</h3>
              <button onClick={() => setShowSettings(false)} className="btn-icon"> <X size={24} /> </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Removed Content Type selection - now driven by host */}
              {/* <div> ... </div> */}

              {/* Display Options */}
              <div>
                <label className="block text-gray-700 dark:text-dark-text-secondary mb-3 font-medium">Display Options</label>
                <div className="space-y-3">
                  {/* Show Translation Checkbox */}
                  <div className="flex items-center bg-gray-50 dark:bg-dark-bg-secondary p-3 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary">
                    <input type="checkbox" id="showTranslation" checked={showTranslation} onChange={() => setShowTranslation(!showTranslation)} className="toggle-checkbox" />
                    <label htmlFor="showTranslation" className="flex-1 cursor-pointer dark:text-dark-text-secondary ml-3">Show Translation</label>
                  </div>
                  {/* Show Transliteration Checkbox */}
                  <div className="flex items-center bg-gray-50 dark:bg-dark-bg-secondary p-3 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary">
                    <input type="checkbox" id="showTransliteration" checked={showTransliteration} onChange={() => setShowTransliteration(!showTransliteration)} className="toggle-checkbox" />
                    <label htmlFor="showTransliteration" className="flex-1 cursor-pointer dark:text-dark-text-secondary ml-3">Show Transliteration</label>
                  </div>
                </div>
              </div>

              {/* Font Size Controls (Keep as is) */}
              <div>
                <label className="block text-gray-700 dark:text-dark-text-secondary mb-3 font-medium">Font Sizes</label>
                <div className="space-y-3">
                  {/* Arabic */}
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-dark-bg-secondary p-3 rounded-lg">
                    <span className="dark:text-dark-text-secondary">Arabic</span>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => setArabicFontSize(prev => { const current = parseFloat(prev); return Math.max(0.5, (isNaN(current) ? defaultArabicSize : current) - 0.1); })} className="btn-icon-sm btn-secondary">-</button>
                      <span className="text-sm w-8 text-center dark:text-dark-text-muted">{(Math.round((parseFloat(arabicFontSize) || defaultArabicSize) * 10) / 10).toFixed(1)}</span>
                      <button onClick={() => setArabicFontSize(prev => { const current = parseFloat(prev); return (isNaN(current) ? defaultArabicSize : current) + 0.1; })} className="btn-icon-sm btn-secondary">+</button>
                    </div>
                  </div>
                  {/* Transliteration */}
                   <div className="flex items-center justify-between bg-gray-50 dark:bg-dark-bg-secondary p-3 rounded-lg">
                     <span className="dark:text-dark-text-secondary">Transliteration</span>
                     <div className="flex items-center space-x-2">
                       <button onClick={() => setTransliterationFontSize(prev => { const current = parseFloat(prev); return Math.max(0.5, (isNaN(current) ? defaultOtherSize : current) - 0.1); })} className="btn-icon-sm btn-secondary">-</button>
                       <span className="text-sm w-8 text-center dark:text-dark-text-muted">{(Math.round((parseFloat(transliterationFontSize) || defaultOtherSize) * 10) / 10).toFixed(1)}</span>
                       <button onClick={() => setTransliterationFontSize(prev => { const current = parseFloat(prev); return (isNaN(current) ? defaultOtherSize : current) + 0.1; })} className="btn-icon-sm btn-secondary">+</button>
                     </div>
                   </div>
                  {/* Translation */}
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

              {/* Auto-Advance Settings (Host only) */}
              {isHost && connectionStatus === 'connected' && ( // Show only if host and connected
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

      {/* Other Modals (Keep as is) */}
      {showShareDialog && <ShareDialog sessionId={sessionId} sessionUrl={sessionUrl} onClose={() => setShowShareDialog(false)} />}
      {showParticipantsDialog && <ParticipantsDialog participants={participants} isHost={isHost} onTransferHost={transferHost} onClose={() => setShowParticipantsDialog(false)} />}
      {showNameInputDialog && <NameInputDialog onSubmit={handleNameSubmit} onClose={() => { setShowNameInputDialog(false); setIsJoining(false); setJoinSessionId(''); setPendingAction(null); }} />}
      {/* Render the Rejoin Dialog */}
      <RejoinDialog
        isOpen={showRejoinDialog}
        onClose={() => setShowRejoinDialog(false)}
        onSubmit={({ sessionId: rejoinSessionId, username: rejoinUsername }) => {
          setShowRejoinDialog(false);
          setLocalError(null); // Clear previous errors
          console.log(`Attempting explicit rejoin for session ${rejoinSessionId} as ${rejoinUsername}`);
          // Explicit rejoin always tries to connect if needed, then joins.
          // The automatic rejoin logic is now in SocketContext's 'connect' handler.
          if (connectionStatus !== 'connected') {
             console.log("Not connected, attempting connection first...");
             connectToServer(); // Initiate connection if needed
             // We rely on the automatic rejoin in SocketContext now,
             // but calling joinSession here acts as a manual trigger if already connected.
          }
           // Call joinSession directly. It checks internally if connected.
           // It also now gets the isHost flag correctly.
          joinSession(rejoinSessionId, rejoinUsername, isHost);
        }}
        initialSessionId={sessionId} // Pre-fill with current session ID
        initialUsername={username} // Pre-fill with current username
      />
    </div>
  );
};

export default DuaSyncApp;
