const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { nanoid } = require('nanoid');
const path = require('path');
const fs = require('fs'); // Import fs module

const app = express();
const server = http.createServer(app);

// --- Load Quran Data ---
// Store the parsed objects directly
let quranArabicObj = {};
let quranTransliterationObj = {};
let quranTranslationObj = {};
let quranMetadata = []; // This will still be an array for easy listing

try {
  // --- Updated Data Path ---
  // Load data from a 'data' subdirectory within the server directory
  const dataPath = path.join(__dirname, 'data'); 
  console.log(`Attempting to load Quran data from: ${dataPath}`);

  console.log('Reading arabic.json...');
  const arabicRaw = fs.readFileSync(path.join(dataPath, 'arabic.json'), 'utf8');
  console.log('Parsing arabic.json...');
  quranArabicObj = JSON.parse(arabicRaw);
  console.log(`Parsed arabic.json. Root Type: ${typeof quranArabicObj}`);

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
  console.log('Processing metadata from quranArabicObj...');
  if (quranArabicObj && typeof quranArabicObj === 'object' && Object.keys(quranArabicObj).length > 0) {
    try {
        // Iterate over the keys (Surah numbers) of the Arabic object
        quranMetadata = Object.keys(quranArabicObj).map(surahNumberKey => {
            const surah = quranArabicObj[surahNumberKey];
            if (!surah || typeof surah !== 'object' || !surah.Ayahs || typeof surah.Ayahs !== 'object') {
                console.warn(`Skipping invalid surah data for key ${surahNumberKey}: Missing or invalid structure.`);
                return null;
            }
            // Calculate total ayahs by counting keys in the Ayahs object
            const totalAyahs = Object.keys(surah.Ayahs).length;

            return {
                // Use the key (Surah number) as the ID (convert to number if needed, but string is fine)
                id: surahNumberKey,
                // Extract names (use optional chaining for safety)
                title: surah.SurahEnglishNames || surah.SurahTransliteratedName || `Surah ${surahNumberKey}`,
                arabic: surah.SurahArabicName || '',
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
     console.error('Failed to process Quran metadata: quranArabicObj data is missing, not an object, or empty.');
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
}

// Socket.io setup with appropriate CORS settings
const io = new Server(server, {
  cors: {
    // In production, only allow connections from your domain
    origin: process.env.NODE_ENV === 'production'
      ? process.env.CLIENT_URL || true  // true = same origin
      : '*',  // In development, allow all origins
    methods: ['GET', 'POST']
  }
});

// --- Removed Static File Serving Block ---
// Frontend will be served separately by Netlify/Vercel etc.

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
  const arabicSurah = quranArabicObj[surahId];
  const translitSurah = quranTransliterationObj[surahId];
  const translationSurah = quranTranslationObj[surahId];

  // Validate that we found the surah objects and they have the Ayahs object
  if (!arabicSurah?.Ayahs || !translitSurah?.Ayahs || !translationSurah?.Ayahs) {
     console.error(`Missing Ayahs object for Surah ID: ${surahId} in one or more files.`);
     return null;
  }

  const arabicAyahsObj = arabicSurah.Ayahs;
  const translitAyahsObj = translitSurah.Ayahs;
  const translationAyahsObj = translationSurah.Ayahs;

  // Get the number of ayahs from metadata (already calculated)
  const totalAyahs = meta.totalAyahs;

  // Optional: Check if the number of keys in Ayahs objects matches totalAyahs from metadata
  if (Object.keys(arabicAyahsObj).length !== totalAyahs ||
      Object.keys(translitAyahsObj).length !== totalAyahs ||
      Object.keys(translationAyahsObj).length !== totalAyahs) {
    console.warn(`Ayah count mismatch for Surah ID: ${surahId}. Metadata: ${totalAyahs}, Arabic: ${Object.keys(arabicAyahsObj).length}, etc. Merging based on metadata count.`);
    // We'll proceed based on meta.totalAyahs, but this indicates potential data inconsistency.
  }

  // Merge verse data by iterating from 1 to totalAyahs
  const mergedVerses = [];
  for (let i = 1; i <= totalAyahs; i++) {
      const ayahKey = String(i); // Keys in Ayahs object are strings "1", "2", ...

      // Extract text, handling potential missing ayahs in one of the files
      const arabicText = arabicAyahsObj[ayahKey]?.Arabic ?? '';
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
    arabicTitle: meta.arabic,
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
  socket.on('create-session', ({ username }) => {
    const sessionId = nanoid(6);

    sessions.set(sessionId, {
      id: sessionId,
      hostId: socket.id,
      participants: [{
        id: socket.id,
        name: username,
        isHost: true
      }],
      // Store the *selected* content info, not the full content
      selectedContent: null, // e.g., { type: 'dua'/'quran', id: 'kumayl'/1, title: 'Dua Kumayl'/'Al-Fatiha' }
      currentIndex: 0,
    });

    socket.join(sessionId);

    socket.emit('session-created', {
      sessionId,
      username: username,
      isHost: true,
      userId: socket.id
    });

    io.to(sessionId).emit('update_participants', {
      participants: sessions.get(sessionId).participants
    });

    console.log(`Session created: ${sessionId} by ${username}`);
  });

  // Join an existing session
  socket.on('join-session', ({ sessionId, username }) => {
    const session = sessions.get(sessionId);

    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    session.participants.push({
      id: socket.id,
      name: username,
      isHost: false
    });

    socket.join(sessionId);

    // Send session info, including currently selected content by host
    socket.emit('session-joined', {
      sessionId,
      username: username,
      isHost: false,
      hostSelectedContent: session.selectedContent, // Send the *info* about selected content
      userId: socket.id,
      currentIndex: session.currentIndex, // Send current index
      contentSelected: !!session.selectedContent // Indicate if content is selected
    });

    io.to(sessionId).emit('update_participants', {
      participants: session.participants
    });

    console.log(`User ${username} joined session ${sessionId}`);
  });

  // Host selects Dua/Quran Content
  // Renamed 'select-dua' to 'select_content' for clarity
  socket.on('select_content', ({ sessionId, contentInfo }) => { // Expect { type: 'dua'/'quran', id: '...', title: '...' }
    const session = sessions.get(sessionId);
    // Basic validation: Check if session exists and requester is the host
    if (!session || socket.id !== session.hostId) {
      console.warn(`Unauthorized content selection attempt in session ${sessionId} by ${socket.id}`);
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
  // Renamed 'host_navigate' to 'host_update_index'
  socket.on('host_update_index', ({ sessionId, newIndex }) => {
    const session = sessions.get(sessionId);

    // Basic validation
    if (!session || socket.id !== session.hostId) return;
    if (typeof newIndex !== 'number' || newIndex < 0) return; // Basic index validation

    // Validate newIndex against the length of the selected content if it's known
    const contentLength = session.selectedContent?.totalAyahs; // Use stored totalAyahs for Quran
    if (session.selectedContent?.type === 'quran' && contentLength !== undefined && newIndex >= contentLength) {
       console.warn(`Invalid index ${newIndex} for content length ${contentLength} in session ${sessionId}`);
       // Optionally clamp the index or ignore the update
       newIndex = contentLength - 1; // Clamp to last valid index
       // return; // Or ignore
    }
    // Add similar validation for Duas if their length is known on the server

    session.currentIndex = newIndex;
    console.log(`Host (${socket.id}) navigated to index ${newIndex} in session ${sessionId}`);

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

  // Transfer host (Keep as is)
  socket.on('transfer_host', ({ sessionId, newHostId }) => {
    const session = sessions.get(sessionId);
    if (!session || socket.id !== session.hostId) return;

    const newHostExists = session.participants.some(p => p.id === newHostId);
    if (!newHostExists) {
        console.warn(`Attempted to transfer host to non-existent participant ${newHostId} in session ${sessionId}`);
        return;
    }

    session.hostId = newHostId;
    session.participants = session.participants.map(p => ({
      ...p,
      isHost: p.id === newHostId
    }));

    io.to(sessionId).emit('host_transferred', {
      newHostId,
      participants: session.participants
    });
    console.log(`Host transferred to ${newHostId} in session ${sessionId}`);
  });

  // Store cleanup timers
  const disconnectTimers = new Map(); // Map<socket.id, NodeJS.Timeout>

  // Handle disconnection with grace period
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const gracePeriodMs = 30000; // 30 seconds

    let sessionFound = null;
    let participantFound = null;
    let participantIndexFound = -1;

    // Find the session and participant
    for (const [sessionId, session] of sessions.entries()) {
      const index = session.participants.findIndex(p => p.id === socket.id);
      if (index !== -1) {
        sessionFound = session;
        participantFound = session.participants[index];
        participantIndexFound = index;
        break;
      }
    }

    if (participantFound && sessionFound) {
      const sessionId = sessionFound.id;
      // Mark participant as disconnected and record time
      participantFound.disconnectedAt = Date.now();
      participantFound.status = 'disconnected'; // Add a status flag

      // Clear any existing timer for this user (shouldn't happen often, but safety)
      if (disconnectTimers.has(socket.id)) {
        clearTimeout(disconnectTimers.get(socket.id));
      }

      console.log(`User ${participantFound.name} (${socket.id}) marked as disconnected in session ${sessionId}. Starting cleanup timer.`);

      // Set a timer to perform actual cleanup
      const timerId = setTimeout(() => {
        // --- Cleanup Logic ---
        // Double-check if the session and participant still exist and are still disconnected
        const currentSession = sessions.get(sessionId);
        if (!currentSession) {
          console.log(`Cleanup timer: Session ${sessionId} no longer exists.`);
          disconnectTimers.delete(socket.id);
          return;
        }

        const currentParticipantIndex = currentSession.participants.findIndex(p => p.id === socket.id);
        const currentParticipant = currentParticipantIndex !== -1 ? currentSession.participants[currentParticipantIndex] : null;

        // Only proceed if the participant is still in the list and marked as disconnected
        if (currentParticipant && currentParticipant.status === 'disconnected') {
          console.log(`Cleanup timer: Removing disconnected user ${currentParticipant.name} (${socket.id}) from session ${sessionId}.`);

          const wasHost = socket.id === currentSession.hostId;
          // Actually remove the participant
          currentSession.participants.splice(currentParticipantIndex, 1);

          // Handle host transfer if the disconnected user was the host
          if (wasHost && currentSession.participants.length > 0) {
            const newHost = currentSession.participants[0];
            currentSession.hostId = newHost.id;
            newHost.isHost = true;
            io.to(sessionId).emit('host_transferred', {
              newHostId: newHost.id,
              participants: currentSession.participants.map(p => ({ ...p, status: p.status || 'connected' })) // Ensure status is sent
            });
            console.log(`Cleanup timer: Host disconnected, new host ${newHost.id} assigned in session ${sessionId}`);
          }

          // Notify remaining participants
          io.to(sessionId).emit('update_participants', {
            participants: currentSession.participants.map(p => ({ ...p, status: p.status || 'connected' })) // Ensure status is sent
          });

          // Delete session if empty
          if (currentSession.participants.length === 0) {
            sessions.delete(sessionId);
            console.log(`Cleanup timer: Session ${sessionId} removed - no participants remaining`);
          }
        } else {
           console.log(`Cleanup timer: User ${socket.id} already reconnected or removed from session ${sessionId}.`);
        }
        // --- End Cleanup Logic ---
        disconnectTimers.delete(socket.id); // Remove timer reference
      }, gracePeriodMs);

      // Store the timer ID
      disconnectTimers.set(socket.id, timerId);

      // Notify clients immediately that the user is disconnected (optional, good UX)
      io.to(sessionId).emit('update_participants', {
        participants: sessionFound.participants.map(p => ({ ...p, status: p.status || 'connected' })) // Send updated status
      });

    } else {
      console.log(`Disconnected user ${socket.id} not found in any active session.`);
    }
  });

  // Modify join-session to handle reconnection AND host recreation after server restart
  socket.on('join-session', ({ sessionId, username, isHostAttemptingRejoin = false }) => { // Destructure new flag
    let session = sessions.get(sessionId);

    // --- Handle Session Not Found ---
    if (!session) {
      // Scenario 1: Host is trying to rejoin after server restart
      if (isHostAttemptingRejoin) {
        console.log(`Session ${sessionId} not found, but host ${username} (${socket.id}) is attempting to recreate.`);
        // Recreate the session using the old ID
        session = {
          id: sessionId,
          hostId: socket.id,
          participants: [{
            id: socket.id,
            name: username,
            isHost: true,
            status: 'connected' // Mark as connected immediately
          }],
          selectedContent: null, // Start fresh, host needs to reselect
          currentIndex: 0,
        };
        sessions.set(sessionId, session); // Add the recreated session to the map

        socket.join(sessionId);

        // Emit 'session-created' so client updates state correctly
        socket.emit('session-created', {
          sessionId,
          username: username,
          isHost: true,
          userId: socket.id
        });

        // No need to update participants here as only host exists initially

        console.log(`Session ${sessionId} recreated by host ${username}`);
        return; // Session recreated, handler finished
      }
      // Scenario 2: Joiner trying to join a non-existent session
      else {
        socket.emit('session-not-found', { sessionId });
        console.log(`Join attempt failed: Session ${sessionId} not found and joiner was not host.`);
        return;
      }
    }
    // --- End Handle Session Not Found ---

    // --- Check for Existing Participant (by username) ---
    const existingParticipantIndex = session.participants.findIndex(p => p.name === username);
    let existingParticipant = existingParticipantIndex !== -1 ? session.participants[existingParticipantIndex] : null;

    if (existingParticipant) {
      // User with this name exists.
      if (existingParticipant.status === 'disconnected') {
        // --- Handle Reconnection ---
        console.log(`User ${username} (${socket.id}) is rejoining session ${sessionId} (was disconnected).`);
        const oldSocketId = existingParticipant.id;
        if (disconnectTimers.has(oldSocketId)) {
          clearTimeout(disconnectTimers.get(oldSocketId));
          disconnectTimers.delete(oldSocketId);
          console.log(`Cleared cleanup timer for ${oldSocketId}.`);
        }
        // Update participant record
        session.participants[existingParticipantIndex] = {
          ...existingParticipant,
          id: socket.id, // New socket ID
          status: 'connected',
          disconnectedAt: undefined // Remove timestamp
        };

      } else {
        // --- Handle Username Conflict / Rapid Reconnect ---
        // User is already marked 'connected'. Assume this is the same user reconnecting quickly
        // or a state mismatch. Update the socket ID associated with this user.
        console.warn(`Username ${username} already marked as connected in session ${sessionId}. Updating socket ID from ${existingParticipant.id} to ${socket.id}.`);
        // Update the existing participant record with the new socket ID
         session.participants[existingParticipantIndex] = {
          ...existingParticipant,
          id: socket.id, // Update to the new socket ID
          status: 'connected', // Ensure status is connected
          disconnectedAt: undefined // Ensure no disconnect timestamp
        };
        // Note: We are NOT explicitly disconnecting the old socket here.
      }

      // --- Common actions after handling existing user (reconnect or conflict resolution) ---
      const updatedParticipant = session.participants[existingParticipantIndex]; // Get the updated record
      socket.join(sessionId);
      socket.emit('session-joined', { // Send confirmation to the joining/rejoining socket
        sessionId,
        username: updatedParticipant.name,
        isHost: updatedParticipant.isHost,
        hostSelectedContent: session.selectedContent,
        userId: socket.id,
        currentIndex: session.currentIndex,
        contentSelected: !!session.selectedContent,
        participants: session.participants.map(p => ({ ...p, status: p.status || 'connected' }))
      });
      io.to(sessionId).emit('update_participants', { // Update everyone
        participants: session.participants.map(p => ({ ...p, status: p.status || 'connected' }))
      });
      return; // Join/Rejoin handled

    } else {
      // --- Handle New Participant ---
      console.log(`Adding ${username} (${socket.id}) as a new participant to session ${sessionId}.`);
      const newParticipant = {
        id: socket.id,
        name: username,
        isHost: false, // New joiners are never host initially
        status: 'connected'
      };
      session.participants.push(newParticipant);
      // --- Common actions for new participant ---
      socket.join(sessionId);
      socket.emit('session-joined', { // Send confirmation to the new joiner
        sessionId,
        username: newParticipant.name,
        isHost: newParticipant.isHost,
        hostSelectedContent: session.selectedContent,
        userId: socket.id,
        currentIndex: session.currentIndex,
        contentSelected: !!session.selectedContent,
        participants: session.participants.map(p => ({ ...p, status: p.status || 'connected' }))
      });
      io.to(sessionId).emit('update_participants', { // Update everyone
        participants: session.participants.map(p => ({ ...p, status: p.status || 'connected' }))
      });
      console.log(`User ${username} joined session ${sessionId} as a new participant.`);
    }
  });

});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
