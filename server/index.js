const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { nanoid } = require('nanoid');
const path = require('path');
const process = require('process'); // Import process for error handling
const fs = require('fs'); // Import fs module

const app = express();
const server = http.createServer(app);

// --- Load Quran Data ---
// Store the parsed objects directly
let quranArabicArray = []; // Changed name and type
let quranTransliterationObj = {};
let quranTranslationObj = {};
let quranMetadata = []; // This will still be an array for easy listing

try {
  // --- Updated Data Path ---
  // Load data from a 'data' subdirectory within the server directory
  const dataPath = path.join(__dirname, 'data'); 
  console.log(`Attempting to load Quran data from: ${dataPath}`);

  // --- MODIFICATION START: Read quran.json instead of arabic.json ---
  console.log('Reading quran.json...');
  const arabicRaw = fs.readFileSync(path.join(dataPath, 'quran.json'), 'utf8');
  console.log('Parsing quran.json...');
  // --- MODIFICATION END ---
  quranArabicArray = JSON.parse(arabicRaw);
  console.log(`Parsed quran.json. Root Type: ${Array.isArray(quranArabicArray) ? 'array' : typeof quranArabicArray}, Length: ${quranArabicArray.length}`);

  console.log('Reading transliteration.json...');
  const transliterationRaw = fs.readFileSync(path.join(dataPath, 'transliteration.json'), 'utf8');
  console.log('Parsing transliteration.json...');
  quranTransliterationObj = JSON.parse(transliterationRaw);
  console.log(`Parsed transliteration.json. Root Type: ${typeof quranTransliterationObj}`);

  console.log('Reading aliquliqarai.json...');
  const translationRaw = fs.readFileSync(path.join(dataPath, 'aliquliqarai.json'), 'utf8');
  console.log('Parsing aliquliqarai.json...');
  quranTranslationObj = JSON.parse(translationRaw);
  console.log(`Parsed aliquliqarai.json. Root Type: ${typeof quranTranslationObj}`);

  console.log('Successfully read and parsed all Quran data files.');

  // --- Pre-process Metadata ---
  console.log('Processing metadata from quranArabicArray...');
  if (quranArabicArray && Array.isArray(quranArabicArray) && quranArabicArray.length > 0) {
    try {
        // Iterate over the array of Surah objects
        quranMetadata = quranArabicArray.map(surah => {
            // Validate the structure of the surah object from the array
            if (!surah || typeof surah !== 'object' || !surah.verses || !Array.isArray(surah.verses)) {
                console.warn(`Skipping invalid surah data for ID ${surah.id}: Missing or invalid structure (verses array).`);
                return null;
            }
            // Calculate total ayahs from the length of the verses array
            const totalAyahs = surah.verses.length;

            return {
                // Use the id from the surah object (convert to string for consistency with old code)
                id: String(surah.id),
                // Extract names (use optional chaining for safety)
                title: surah.transliteration || `Surah ${surah.id}`,
                arabic: surah.name || '',
                totalAyahs: totalAyahs,
            };
        }).filter(meta => meta !== null); // Filter out any null entries

        // Sort metadata by Surah number (as numbers)
        quranMetadata.sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));

        console.log(`Successfully processed Quran metadata for ${quranMetadata.length} surahs.`);

        // Optional: Add length validation against other objects if needed
        const translitKeys = Object.keys(quranTransliterationObj || {}).length;
        const translationKeys = Object.keys(quranTranslationObj || {}).length;
        if (quranMetadata.length !== translitKeys || quranMetadata.length !== translationKeys) {
             console.warn(`Warning: Surah count mismatch between metadata (${quranMetadata.length}) and transliteration/translation objects (${translitKeys}/${translationKeys}).`);
        }

    } catch (mapError) {
        console.error('Error processing Quran metadata:', mapError);
        quranMetadata = []; // Ensure empty on error
    }
  } else {
     console.error('Failed to process Quran metadata: quranArabicArray data is missing, not an array, or empty.');
     quranMetadata = []; // Ensure it's empty on failure
  }

} catch (error) {
  console.error('!!! Error during Quran data loading/parsing:', error);
  // Ensure metadata is empty if loading fails
  quranMetadata = [];
}
// --- End Load Quran Data ---


// Development CORS configuration
if (process.env.NODE_ENV !== 'production') {
  app.use(cors());
} else {
  // --- Production Static File Serving ---
  // Serve static files from the React app's build directory
  const clientBuildPath = path.resolve(__dirname, '../client/build');
  app.use(express.static(clientBuildPath));

  // The "catchall" handler: for any request that doesn't
  // match one above, send back React's index.html file.
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(clientBuildPath, 'index.html'));
  });
  // --- End Production Static File Serving ---
}

// Socket.io setup with appropriate CORS settings
const io = new Server(server, {
  cors: {
    // In production, only allow connections from your domain
    origin: process.env.NODE_ENV === 'production'
      ? process.env.CLIENT_URL || true  // true = same origin
      : '*',  // In development, allow all origins
    methods: ['GET', 'POST']
  },
  // Increase ping settings for potentially slow/throttled clients
  pingInterval: 30000, // Send pings every 30 seconds (default: 25000)
  pingTimeout: 20000   // Wait 20 seconds for pong response (default: 5000)
});

// --- Basic Error Handling ---
// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('!!! Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
  // Consider exiting the process cleanly in production after logging
  // process.exit(1); // Uncomment if you want the server to restart on unhandled rejections
});

// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('!!! Uncaught Exception:', error);
  // Application specific logging
  // Consider exiting the process cleanly in production after logging
  // process.exit(1); // Uncomment if you want the server to restart on uncaught exceptions
});
// --- End Basic Error Handling ---

// Store active sessions
const sessions = new Map();

// --- Helper Function to Get Merged Quran Data ---
// Finds surah based on ID (Surah number as string key)
function getMergedSurahData(surahId) { // surahId is expected to be a string like "1", "2"
  const meta = quranMetadata.find(s => s.id === surahId);
  if (!meta) {
    console.error(`Surah metadata not found for ID: ${surahId}`);
    return null;
  }

  // Access the corresponding surah objects using the string key
  const arabicSurah = quranArabicArray.find(surah => String(surah.id) === surahId);
  const translitSurah = quranTransliterationObj[surahId];
  const translationSurah = quranTranslationObj[surahId];

  // Validate that we found the surah objects and they have the Ayahs object
  if (!arabicSurah?.verses || !translitSurah?.Ayahs || !translationSurah?.Ayahs) {
     console.error(`Missing verses array (arabic) or Ayahs object (translit/translation) for Surah ID: ${surahId}.`);
     return null;
  }

  const arabicVersesArray = arabicSurah.verses;
  const translitAyahsObj = translitSurah.Ayahs;
  const translationAyahsObj = translationSurah.Ayahs;

  // Get the number of ayahs from metadata (already calculated)
  const totalAyahs = meta.totalAyahs;

  // Optional: Check if the number of keys in Ayahs objects matches totalAyahs from metadata
  if (arabicVersesArray.length !== totalAyahs ||
      Object.keys(translitAyahsObj).length !== totalAyahs ||
      Object.keys(translationAyahsObj).length !== totalAyahs) {
    console.warn(`Ayah count mismatch for Surah ID: ${surahId}. Metadata: ${totalAyahs}, Arabic: ${arabicVersesArray.length}, Translit: ${Object.keys(translitAyahsObj).length}, Translation: ${Object.keys(translationAyahsObj).length}. Merging based on metadata count.`);
    // We'll proceed based on meta.totalAyahs, but this indicates potential data inconsistency.
  }

  // Merge verse data by iterating from 1 to totalAyahs
  const mergedVerses = [];
  for (let i = 1; i <= totalAyahs; i++) {
      const ayahKey = String(i); // Keys in Ayahs object are strings "1", "2", ...

      // Extract text, handling potential missing ayahs in one of the files
      const arabicVerse = arabicVersesArray.find(verse => verse.id === i);
      const arabicText = arabicVerse?.text ?? '';
      const translitText = translitAyahsObj[ayahKey]?.Transliteration ?? '';
      // *** Use the correct key "Ali Quli Qara'i" for translation ***
      const translationAyahObj = translationAyahsObj[ayahKey];
      const translationText = translationAyahObj?.["Ali Quli Qara'i"] ?? ''; // Use correct key

      mergedVerses.push({
          ayah: i, // Ayah number
          arabic: arabicText, // Return full arabic text including symbol
          transliteration: translitText,
          translation: translationText,
      });
  }

  return {
    id: meta.id,
    title: meta.title,
    arabicTitle: arabicSurah.name || meta.arabic, // Prefer name from the new structure
    totalAyahs: totalAyahs,
    verses: mergedVerses,
  };
}
// --- End Helper Function ---


io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // --- Add New Socket Event Handlers for Quran ---

  // Client requests list of Surahs (metadata)
  socket.on('get_quran_metadata', (callback) => {
    console.log(`User ${socket.id} requested Quran metadata`);
    if (typeof callback === 'function') {
      if (quranMetadata.length > 0) {
        // Send only the metadata needed for the selection list
        const selectionMetadata = quranMetadata.map(s => ({
            id: s.id,
            title: s.title,
            arabic: s.arabic,
            totalAyahs: s.totalAyahs,
            // Add any other fields needed for display/filtering in DuaSelectionPage
            // e.g., lengthCategory: calculateLengthCategory(s.totalAyahs)
        }));
        callback({ data: selectionMetadata });
      } else {
        callback({ error: 'Quran metadata not available on server.' });
      }
    }
  });

  // Client requests full content for a specific Surah
  socket.on('get_quran_content', ({ surahId }, callback) => {
    console.log(`User ${socket.id} requested content for Surah ID: ${surahId}`);
    if (typeof callback !== 'function') return; // Need callback to send response

    const mergedData = getMergedSurahData(surahId);

    if (mergedData) {
      callback({ data: mergedData });
    } else {
      callback({ error: `Could not retrieve content for Surah ID: ${surahId}` });
    }
  });

  // --- End New Socket Event Handlers ---


  // Create a new session
  socket.on('create-session', ({ username, userId }) => { // Added userId
    if (!userId) {
      console.error('Create session attempt failed: userId not provided by client.', { username, socketId: socket.id });
      socket.emit('error', { message: 'User ID is required to create a session.' });
      return;
    }
    const sessionId = nanoid(6);

    sessions.set(sessionId, {
      id: sessionId,
      hostSocketId: socket.id, // Store the current socket.id
      hostUserId: userId,     // Store the persistent userId of the host
      participants: [{
        socketId: socket.id,    // Current socket.id
        userId: userId,         // Persistent clientGeneratedId
        name: username,
        isHost: true,
        status: 'connected'
      }],
      selectedContent: null,
      currentIndex: 0,
    });

    socket.join(sessionId);

    // Send back both socket.id (as current ephemeral id) and the persistent userId
    socket.emit('session-created', {
      sessionId,
      username: username,
      isHost: true,
      socketId: socket.id, // Ephemeral socket ID
      userId: userId       // Persistent client-generated ID
    });

    io.to(sessionId).emit('update_participants', {
      participants: sessions.get(sessionId).participants.map(p => ({ name: p.name, isHost: p.isHost, status: p.status, userId: p.userId }))
    });

    console.log(`Session created: ${sessionId} by ${username} (UserId: ${userId}, SocketId: ${socket.id})`);
  });

  // Join an existing session - THIS HANDLER WILL BE REPLACED/SIMPLIFIED by 'attempt-rejoin' for refresh scenarios.
  // For now, let's ensure it correctly handles NEW joins with userId.
  // The complex rejoin logic here will be mostly superseded.
  socket.on('join-session', ({ sessionId, username, userId, isHostAttemptingRejoin = false }) => { // Added userId
    if (!userId) {
      console.error('Join session attempt failed: userId not provided by client.', { sessionId, username, socketId: socket.id });
      socket.emit('error', { message: 'User ID is required to join a session.' });
      return;
    }

    let session = sessions.get(sessionId);

    // --- Handle Session Not Found ---
    if (!session) {
      if (isHostAttemptingRejoin) { // This specific flag is from client's old joinSession, might be less relevant with attempt-rejoin
        console.log(`Session ${sessionId} not found, but host ${username} (UserId: ${userId}, SocketId: ${socket.id}) is attempting to recreate via 'join-session'.`);
        session = {
          id: sessionId,
          hostSocketId: socket.id,
          hostUserId: userId,
          participants: [{ socketId: socket.id, userId, name: username, isHost: true, status: 'connected' }],
          selectedContent: null,
          currentIndex: 0,
        };
        sessions.set(sessionId, session);
        socket.join(sessionId);
        socket.emit('session-created', { sessionId, username, isHost: true, socketId: socket.id, userId });
        // No participants update needed yet
        console.log(`Session ${sessionId} recreated by host ${username} via 'join-session'.`);
        return;
      } else {
        socket.emit('session-not-found', { sessionId });
        console.log(`Join attempt failed for ${username} (UserId: ${userId}): Session ${sessionId} not found.`);
        return;
      }
    }

    // --- Check for Existing Participant by userId (more reliable than username) ---
    const existingParticipantByUserId = session.participants.find(p => p.userId === userId);

    if (existingParticipantByUserId) {
      // This user (by persistent ID) is already in the session. This is a REJOIN scenario.
      // This should ideally be handled by 'attempt-rejoin'. If it reaches here, it's a bit unusual.
      // For robustness, let's update their socketId and status.
      console.warn(`User with UserId ${userId} (${username}) already in session ${sessionId}. Updating socketId from ${existingParticipantByUserId.socketId} to ${socket.id}. This should ideally be an 'attempt-rejoin' flow.`);
      existingParticipantByUserId.socketId = socket.id;
      existingParticipantByUserId.status = 'connected';
      existingParticipantByUserId.name = username; // Update username in case it changed client-side (though less likely for rejoin)
      
      // If this user was the host, ensure hostSocketId is updated
      if (existingParticipantByUserId.isHost && session.hostUserId === userId) {
        session.hostSocketId = socket.id;
      }

      // Clear disconnect timer if any (logic for this needs to be more robust, linking timer to userId)
      // For now, this is a simplified placeholder:
      if (disconnectTimers.has(existingParticipantByUserId.socketId_before_disconnect)) { // Assuming we stored old socketId
         clearTimeout(disconnectTimers.get(existingParticipantByUserId.socketId_before_disconnect));
         disconnectTimers.delete(existingParticipantByUserId.socketId_before_disconnect);
         console.log(`Cleared potential disconnect timer for rejoining user ${userId} (old socketId: ${existingParticipantByUserId.socketId_before_disconnect})`);
      }


      socket.join(sessionId);
      socket.emit('session-joined', {
        sessionId,
        username: existingParticipantByUserId.name,
        isHost: existingParticipantByUserId.isHost,
        hostSelectedContent: session.selectedContent,
        socketId: socket.id,
        userId: existingParticipantByUserId.userId,
        currentIndex: session.currentIndex,
        contentSelected: !!session.selectedContent,
        participants: session.participants.map(p => ({ name: p.name, isHost: p.isHost, status: p.status, userId: p.userId }))
      });
      io.to(sessionId).emit('update_participants', {
        participants: session.participants.map(p => ({ name: p.name, isHost: p.isHost, status: p.status, userId: p.userId }))
      });
      console.log(`User ${username} (UserId: ${userId}) re-joined session ${sessionId} via 'join-session' (socket updated).`);
      return;
    }

    // --- Handle New Participant ---
    // Check for username conflict only if userId is different (new user)
    const existingParticipantByUsername = session.participants.find(p => p.name === username && p.status === 'connected');
    if (existingParticipantByUsername) {
      socket.emit('username-taken', { username });
      console.log(`Join attempt failed for ${username} (UserId: ${userId}): Username already taken in session ${sessionId}.`);
      return;
    }

    console.log(`Adding new participant ${username} (UserId: ${userId}, SocketId: ${socket.id}) to session ${sessionId}.`);
    const newParticipant = {
      socketId: socket.id,
      userId: userId,
      name: username,
      isHost: false,
      status: 'connected'
    };
    session.participants.push(newParticipant);

    socket.join(sessionId);
    socket.emit('session-joined', {
      sessionId,
      username: newParticipant.name,
      isHost: newParticipant.isHost,
      hostSelectedContent: session.selectedContent,
      socketId: socket.id,
      userId: newParticipant.userId,
      currentIndex: session.currentIndex,
      contentSelected: !!session.selectedContent,
      participants: session.participants.map(p => ({ name: p.name, isHost: p.isHost, status: p.status, userId: p.userId }))
    });
    io.to(sessionId).emit('update_participants', {
      participants: session.participants.map(p => ({ name: p.name, isHost: p.isHost, status: p.status, userId: p.userId }))
    });
    console.log(`User ${username} (UserId: ${userId}) joined session ${sessionId} as a new participant.`);
  });


  // Host selects Dua/Quran Content
  socket.on('select_content', ({ sessionId, contentInfo }) => {
    const session = sessions.get(sessionId);
    if (!session || socket.id !== session.hostSocketId) { // Check against hostSocketId
      console.warn(`Unauthorized content selection attempt in session ${sessionId} by ${socket.id} (expected host ${session?.hostSocketId})`);
       return;
    }

    // Handle host deselecting content (contentInfo is null)
    if (contentInfo === null) {
        console.log(`Host (${socket.id}) deselected content in session ${sessionId}`);
        session.selectedContent = null;
        session.currentIndex = 0;
    }
    // Handle host selecting content (validate contentInfo)
    else if (contentInfo && contentInfo.type && contentInfo.id && contentInfo.title) {
        console.log(`Host (${socket.id}) selected ${contentInfo.type} in session ${sessionId}: ID ${contentInfo.id}`);

        // Reset index when new content is selected
        session.currentIndex = 0;

        // Find totalAyahs if it's Quran content
        let totalAyahs = undefined;
        if (contentInfo.type === 'quran') {
            const meta = quranMetadata.find(s => s.id === contentInfo.id);
            totalAyahs = meta ? meta.totalAyahs : 0;
        }

        session.selectedContent = { // Store essential info + totalAyahs for Quran
            type: contentInfo.type,
            id: contentInfo.id,
            title: contentInfo.title,
            totalAyahs: totalAyahs // Store this for potential validation/UI
        };
    }
    // Handle invalid contentInfo object
    else {
        console.warn(`Invalid contentInfo received in session ${sessionId}:`, contentInfo);
        socket.emit('error', { message: 'Invalid content selection data.' });
        return; // Don't proceed if data is invalid
    }

    // Broadcast the *info* about the selected content and reset index
    // Clients will fetch full content if needed (especially for Quran)
    io.to(sessionId).emit('host_content_updated', {
        selectedContent: session.selectedContent,
        currentIndex: session.currentIndex // Send reset index
    });
  });

  // Host changes index (Navigation)
  socket.on('host_update_index', ({ sessionId, newIndex }) => {
    const session = sessions.get(sessionId);
    if (!session || socket.id !== session.hostSocketId) return; // Check against hostSocketId
    if (typeof newIndex !== 'number') return;

    // --- Revised Validation: Look up contentLength directly ---
    let contentLength = undefined;
    if (session.selectedContent?.type === 'quran' && session.selectedContent?.id) {
        const meta = quranMetadata.find(s => s.id === session.selectedContent.id);
        contentLength = meta ? meta.totalAyahs : undefined;
        if (contentLength === undefined) {
             console.error(`Could not find metadata for selected Quran content ID: ${session.selectedContent.id} in host_update_index`);
        }
    }
    // TODO: Add similar lookup for Dua length if needed

    // Improved Validation & Clamping using looked-up length
    if (newIndex < 0) {
        console.warn(`Received negative index ${newIndex}. Clamping to 0.`);
        newIndex = 0;
    } else if (contentLength !== undefined) { // Only validate if length is known
        if (contentLength === 0 && newIndex > 0) {
            console.warn(`Received index ${newIndex} but content length is 0. Clamping to 0.`);
            newIndex = 0;
        } else if (contentLength > 0 && newIndex >= contentLength) { // Correct boundary check
            console.warn(`Invalid index ${newIndex} for content length ${contentLength}. Clamping to ${contentLength - 1}.`);
            newIndex = contentLength - 1;
        }
    }
    // If contentLength is undefined (e.g., error finding metadata), we don't clamp the upper bound.

    session.currentIndex = newIndex; // Update session with potentially clamped index
    console.log(`Host (${socket.id}) navigated to index ${newIndex} in session ${sessionId} (Content Length: ${contentLength})`);

    // Emit only the index change to all clients in the session (including host)
    // Clients are responsible for displaying the correct content segment based on this index
    io.to(sessionId).emit('host_index_updated', { currentIndex: newIndex });
  });

  // Host changes settings (Keep as is for now, assuming settings are client-side preferences)
  socket.on('update_settings', ({ sessionId, settings }) => {
    const session = sessions.get(sessionId);
    if (!session || socket.id !== session.hostId) return;
    // If settings are purely client-side, this event might not be needed.
    // If host controls global settings (like forced translation display), update session state here.
    // Object.assign(session, settings); // Example if storing settings on server
    console.log(`Host (${socket.id}) sent settings update for session ${sessionId}:`, settings);
    // Broadcast to participants if settings affect them
    socket.to(sessionId).emit('settings_updated', settings);
  });

  // Transfer host
  socket.on('transfer_host', ({ sessionId, newHostId: newHostPersistentId }) => { // Expecting persistent userId of new host
    const session = sessions.get(sessionId);
    // Validate session and current host (by socketId, as this is an active action)
    if (!session || socket.id !== session.hostSocketId) {
      console.warn(`Unauthorized host transfer attempt in session ${sessionId} by ${socket.id}`);
      return;
    }

    const newHostParticipant = session.participants.find(p => p.userId === newHostPersistentId);
    if (!newHostParticipant) {
        console.warn(`Attempted to transfer host to non-existent participant (UserId: ${newHostPersistentId}) in session ${sessionId}`);
        socket.emit('error', { message: 'Selected user to transfer host to is not in the session.' });
        return;
    }

    session.hostUserId = newHostParticipant.userId;
    session.hostSocketId = newHostParticipant.socketId; // Update to the new host's current socketId

    session.participants = session.participants.map(p => ({
      ...p,
      isHost: p.userId === newHostParticipant.userId
    }));

    io.to(sessionId).emit('host_transferred', {
      newHostId: newHostParticipant.userId, // Send persistent userId
      participants: session.participants.map(p => ({ name: p.name, isHost: p.isHost, status: p.status, userId: p.userId }))
    });
    console.log(`Host transferred to ${newHostParticipant.name} (UserId: ${newHostParticipant.userId}) in session ${sessionId}`);
  });

  // Store cleanup timers, keyed by the socket.id that disconnected.
  // We'll need to find a way to clear this if the user rejoins with a new socket.id but same userId.
  const disconnectTimers = new Map(); // Map<socketId, NodeJS.Timeout>

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const gracePeriodMs = 30000; // 30 seconds

    let sessionFound = null;
    let participantFound = null;
    let participantIndexFound = -1;
    let disconnectedParticipantUserId = null; // To store the persistent userId

    for (const [sessionId, session] of sessions.entries()) {
      const index = session.participants.findIndex(p => p.socketId === socket.id);
      if (index !== -1) {
        sessionFound = session;
        participantFound = session.participants[index];
        participantIndexFound = index;
        disconnectedParticipantUserId = participantFound.userId; // Capture userId
        break;
      }
    }

    if (participantFound && sessionFound) {
      const sessionId = sessionFound.id;
      participantFound.status = 'disconnected';
      participantFound.disconnectedAt = Date.now();
      // participantFound.socketId = null; // Clear ephemeral socketId, keep userId

      if (disconnectTimers.has(socket.id)) { // Should be rare, but good practice
        clearTimeout(disconnectTimers.get(socket.id));
      }
      console.log(`User ${participantFound.name} (UserId: ${disconnectedParticipantUserId}, SocketId: ${socket.id}) marked as disconnected in session ${sessionId}. Starting cleanup timer.`);

      const timerId = setTimeout(() => {
        const currentSession = sessions.get(sessionId);
        if (!currentSession) {
          console.log(`Cleanup timer: Session ${sessionId} no longer exists.`);
          disconnectTimers.delete(socket.id); // Use the original socket.id for timer map
          return;
        }

        // Find participant by userId to ensure we're acting on the correct persistent user
        const currentParticipantIndex = currentSession.participants.findIndex(p => p.userId === disconnectedParticipantUserId);
        const currentParticipant = currentParticipantIndex !== -1 ? currentSession.participants[currentParticipantIndex] : null;

        if (currentParticipant && currentParticipant.status === 'disconnected') {
          console.log(`Cleanup timer: Removing disconnected user ${currentParticipant.name} (UserId: ${disconnectedParticipantUserId}) from session ${sessionId}.`);
          const wasHost = currentSession.hostUserId === disconnectedParticipantUserId;
          currentSession.participants.splice(currentParticipantIndex, 1);

          if (wasHost && currentSession.participants.length > 0) {
            const newHost = currentSession.participants[0]; // Simplistic: first remaining is new host
            currentSession.hostUserId = newHost.userId;
            currentSession.hostSocketId = newHost.socketId;
            newHost.isHost = true;
            io.to(sessionId).emit('host_transferred', {
              newHostId: newHost.userId,
              participants: currentSession.participants.map(p => ({ name: p.name, isHost: p.isHost, status: p.status, userId: p.userId }))
            });
            console.log(`Cleanup timer: Host disconnected, new host ${newHost.name} (UserId: ${newHost.userId}) assigned in session ${sessionId}`);
          }

          io.to(sessionId).emit('update_participants', {
            participants: currentSession.participants.map(p => ({ name: p.name, isHost: p.isHost, status: p.status, userId: p.userId }))
          });

          if (currentSession.participants.length === 0) {
            sessions.delete(sessionId);
            console.log(`Cleanup timer: Session ${sessionId} removed - no participants remaining`);
          }
        } else {
           console.log(`Cleanup timer: User (UserId: ${disconnectedParticipantUserId}) already reconnected or removed from session ${sessionId}.`);
        }
        disconnectTimers.delete(socket.id); // Use the original socket.id for timer map
      }, gracePeriodMs);

      disconnectTimers.set(socket.id, timerId); // Key timer by the socket.id that disconnected

      io.to(sessionId).emit('update_participants', {
        participants: sessionFound.participants.map(p => ({ name: p.name, isHost: p.isHost, status: p.status, userId: p.userId }))
      });
    } else {
      console.log(`Disconnected user ${socket.id} not found in any active session (already cleaned up or never joined).`);
    }
  });

  // New handler for explicit rejoin attempts
  socket.on('attempt-rejoin', ({ sessionId, userId, username, isHost: clientClaimsHostRole }) => {
    if (!sessionId || !userId || !username) {
      socket.emit('rejoin-failed', { sessionId, reason: 'Missing session details for rejoin.' });
      console.warn(`Attempt-rejoin failed: Missing details. SessionId: ${sessionId}, UserId: ${userId}, Username: ${username}`);
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      socket.emit('rejoin-failed', { sessionId, reason: 'Session not found.' });
      console.log(`Attempt-rejoin: Session ${sessionId} not found for UserId ${userId}.`);
      return;
    }

    const participantIndex = session.participants.findIndex(p => p.userId === userId);
    if (participantIndex === -1) {
      socket.emit('rejoin-failed', { sessionId, reason: 'User not found in session.' });
      console.log(`Attempt-rejoin: UserId ${userId} not found in session ${sessionId}.`);
      return;
    }

    const participant = session.participants[participantIndex];

    // Verify host role consistency
    if (clientClaimsHostRole !== participant.isHost || (participant.isHost && session.hostUserId !== userId)) {
       // If client claims host but server says they are not (based on persistent userId)
       // OR if participant is marked as host in participant list, but session.hostUserId doesn't match.
      socket.emit('rejoin-failed', { sessionId, reason: 'Host status mismatch. Cannot rejoin.' });
      console.warn(`Attempt-rejoin: Host status mismatch for UserId ${userId} in session ${sessionId}. Client claims host: ${clientClaimsHostRole}, Server participant.isHost: ${participant.isHost}, Session hostUserId: ${session.hostUserId}`);
      return;
    }

    // Successful rejoin: Update participant's socketId and status
    const oldSocketId = participant.socketId; // This might be null if they were already marked disconnected
    participant.socketId = socket.id;
    participant.status = 'connected';
    participant.name = username; // Update username in case it changed (though less likely for rejoin)
    participant.disconnectedAt = null;

    // If this participant is the host, update the session's hostSocketId
    if (participant.isHost) {
      session.hostSocketId = socket.id;
    }

    // Clear any pending disconnect timer for this user.
    // This is tricky if the timer was keyed by the *old* socket.id.
    // We need to iterate timers or have a map from userId to oldSocketId if a timer was set.
    // For now, let's assume if a timer existed for an oldSocketId that maps to this userId, we'd want to clear it.
    // This part needs refinement for robust timer clearing.
    // A simple approach: iterate disconnectTimers and check if any stored data matches userId.
    // However, disconnectTimers currently only stores socket.id -> timer.
    // Let's log if we would have cleared a timer for the oldSocketId if it was known.
    // A more robust way: when a user disconnects, store their userId with the timer.
    // For now, we'll rely on the fact that if they reconnect, their status changes, and the timer's cleanup logic will see they are 'connected'.
    console.log(`User ${participant.name} (UserId: ${userId}) reconnected to session ${sessionId} with new socket ${socket.id}. Old socket was ${oldSocketId}.`);
    // Example of how one might try to clear a timer if oldSocketId was reliably available and used as key:
    if (oldSocketId && disconnectTimers.has(oldSocketId)) {
        clearTimeout(disconnectTimers.get(oldSocketId));
        disconnectTimers.delete(oldSocketId);
        console.log(`Cleared disconnect timer for rejoining user ${userId} associated with old socket ${oldSocketId}.`);
    }


    socket.join(sessionId);
    socket.emit('session-rejoined', {
      sessionId,
      username: participant.name,
      isHost: participant.isHost,
      userId: participant.userId, // Confirm persistent userId
      socketId: participant.socketId, // Current socketId
      hostSelectedContent: session.selectedContent,
      currentIndex: session.currentIndex,
      contentSelected: !!session.selectedContent,
      participants: session.participants.map(p => ({ name: p.name, isHost: p.isHost, status: p.status, userId: p.userId })),
      message: `Successfully rejoined session ${sessionId}.`
    });

    io.to(sessionId).emit('update_participants', {
      participants: session.participants.map(p => ({ name: p.name, isHost: p.isHost, status: p.status, userId: p.userId }))
    });
    console.log(`User ${participant.name} (UserId: ${userId}) successfully rejoined session ${sessionId}.`);
  });

});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Optional: Add a basic Express error handler middleware (must be last middleware)
app.use((err, req, res, next) => {
  console.error('!!! Express Error Handler:', err.stack);
  // Avoid sending stack trace in production
  res.status(500).send(process.env.NODE_ENV === 'production' ? 'Something broke!' : err.stack);
});
