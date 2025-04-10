import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const IQRA_TOGETHER_BASE_DIR = 'iqratogether_data'; // Base directory for all app data

/**
 * Ensures the base directory for app data exists.
 */
const ensureBaseDirectoryExists = async () => {
  try {
    await Filesystem.mkdir({
      path: IQRA_TOGETHER_BASE_DIR,
      directory: Directory.Documents, // Use Documents directory for user-visible data
      recursive: true, // Create parent directories if needed
    });
    console.log(`Base directory ensured: ${IQRA_TOGETHER_BASE_DIR}`);
  } catch (error) {
    // Ignore error if directory already exists (common case)
    if (error.message !== 'Directory exists') {
      console.error('Error ensuring base directory:', error);
      throw error; // Re-throw other errors
    }
  }
};

/**
 * Constructs the full path for a piece of content within the app's data directory.
 * Example: iqratogether_data/quran/1.json
 * Example: iqratogether_data/images/alrahman/Verse1.png
 *
 * @param {'quran' | 'dua' | 'images'} type - The type of content.
 * @param {string | number} id - The identifier (e.g., Surah number, Dua ID, Surah name for images).
 * @param {string} [filename] - The specific filename (required for images, optional otherwise).
 * @returns {string} The relative path within the Documents directory.
 */
const getFilePath = (type, id, filename) => {
  switch (type) {
    case 'quran':
      return `${IQRA_TOGETHER_BASE_DIR}/quran/${id}.json`;
    case 'dua':
      return `${IQRA_TOGETHER_BASE_DIR}/dua/${id}.json`;
    case 'images':
      if (!filename) throw new Error('Filename is required for image type');
      // Assuming id here is the Surah name/folder (e.g., 'AlRahman')
      return `${IQRA_TOGETHER_BASE_DIR}/images/${id}/${filename}`;
    default:
      throw new Error(`Unknown content type: ${type}`);
  }
};

/**
 * Checks if a file exists at the specified path in the Documents directory.
 * @param {string} path - The relative path within the Documents directory.
 * @returns {Promise<boolean>} True if the file exists, false otherwise.
 */
export const checkFileExists = async (path) => {
  try {
    await Filesystem.stat({
      path: path,
      directory: Directory.Documents,
    });
    return true;
  } catch (error) {
    // 'File does not exist' is the expected error for non-existent files
    if (error.message === 'File does not exist') {
      return false;
    }
    // Log other unexpected errors
    console.error(`Error checking file existence for ${path}:`, error);
    return false; // Treat other errors as file not existing for safety
  }
};

/**
 * Saves JSON data to a file in the Documents directory.
 * @param {object} data - The JSON data to save.
 * @param {string} path - The relative path within the Documents directory.
 */
export const saveJsonData = async (data, path) => {
  await ensureBaseDirectoryExists(); // Ensure base directory exists first
  try {
    await Filesystem.writeFile({
      path: path,
      data: JSON.stringify(data),
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true, // Create intermediate directories if needed
    });
    console.log(`JSON data saved to: ${path}`);
  } catch (error) {
    console.error(`Error saving JSON data to ${path}:`, error);
    throw error;
  }
};

/**
 * Reads and parses JSON data from a file in the Documents directory.
 * @param {string} path - The relative path within the Documents directory.
 * @returns {Promise<object | null>} The parsed JSON data, or null if file not found or error occurs.
 */
export const readJsonFile = async (path) => {
  try {
    const result = await Filesystem.readFile({
      path: path,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
    return JSON.parse(result.data);
  } catch (error) {
     // 'File does not exist' is the expected error for non-existent files
     if (error.message === 'File does not exist') {
        console.log(`JSON file not found locally: ${path}`);
        return null;
      }
    console.error(`Error reading JSON file from ${path}:`, error);
    return null; // Return null on error
  }
};

/**
 * Downloads a file from a URL and saves it to the specified path in the Documents directory.
 * NOTE: This might require network permissions on Android.
 * NOTE: Capacitor's downloadFile doesn't directly support progress reporting yet.
 *
 * @param {string} url - The URL to download from.
 * @param {string} path - The relative destination path within the Documents directory.
 */
export const downloadAndSaveFile = async (url, path) => {
  await ensureBaseDirectoryExists(); // Ensure base directory exists first
  try {
    // downloadFile saves the file and returns the path
    const result = await Filesystem.downloadFile({
      url: url,
      path: path, // Destination path
      directory: Directory.Documents,
      recursive: true, // Create intermediate directories
      // Progress reporting is not directly supported in the core plugin yet
      // progress: (status) => {
      //   console.log(`Download progress for ${url}: ${status.bytes} / ${status.contentLength}`);
      // }
    });
    console.log(`File downloaded from ${url} and saved to: ${result.path}`);
    return result.path; // Returns the final path where the file was saved
  } catch (error) {
    console.error(`Error downloading file from ${url} to ${path}:`, error);
    // Attempt to delete potentially partial file on error
    try {
      await Filesystem.deleteFile({ path: path, directory: Directory.Documents });
    } catch (deleteError) {
      // Ignore deletion error
    }
    throw error;
  }
};

/**
 * Deletes a file or an entire directory recursively.
 * @param {string} path - The relative path within the Documents directory.
 */
export const deleteFileOrDirectory = async (path) => {
  try {
    // Check if it's a file or directory first
    const stat = await Filesystem.stat({ path: path, directory: Directory.Documents });

    if (stat.type === 'file') {
      await Filesystem.deleteFile({ path: path, directory: Directory.Documents });
      console.log(`File deleted: ${path}`);
    } else if (stat.type === 'directory') {
      await Filesystem.rmdir({
        path: path,
        directory: Directory.Documents,
        recursive: true, // Delete directory and its contents
      });
      console.log(`Directory deleted: ${path}`);
    }
  } catch (error) {
     // 'File does not exist' is common if trying to delete something already gone
     if (error.message === 'File does not exist') {
        console.log(`Attempted to delete non-existent path: ${path}`);
        return; // Not really an error in this context
      }
    console.error(`Error deleting path ${path}:`, error);
    throw error;
  }
};

// --- Example Usage (for testing/reference) ---
/*
// To save Quran Surah 1 data:
const surah1Data = { id: 1, title: "Al-Fatiha", verses: [...] };
const surah1Path = getFilePath('quran', 1);
await saveJsonData(surah1Data, surah1Path);

// To read Quran Surah 1 data:
const loadedSurah1Data = await readJsonFile(surah1Path);
if (loadedSurah1Data) { console.log("Loaded Surah 1:", loadedSurah1Data); }

// To check if Verse 1 of Al-Rahman image exists:
const verse1ImagePath = getFilePath('images', 'AlRahman', 'Verse1.png');
const exists = await checkFileExists(verse1ImagePath);
console.log("Verse 1 image exists:", exists);

// To download Verse 1 image (assuming URL is known):
const imageUrl = 'http://example.com/path/to/Verse1.png';
await downloadAndSaveFile(imageUrl, verse1ImagePath);

// To delete the Al-Rahman images folder:
const alRahmanFolderPath = `${IQRA_TOGETHER_BASE_DIR}/images/AlRahman`;
await deleteFileOrDirectory(alRahmanFolderPath);
*/

// Export necessary functions
export {
  getFilePath,
  // checkFileExists is already exported above
  // saveJsonData, // Maybe keep internal if only used via higher-level functions
  // readJsonFile, // Maybe keep internal
  // downloadAndSaveFile, // Maybe keep internal
  // deleteFileOrDirectory // Maybe keep internal
};

// TODO: Add higher-level functions like:
// - downloadQuranSurah(surahId)
// - downloadDua(duaId)
// - downloadSurahImages(surahName)
// - getQuranSurahLocal(surahId) -> reads JSON
// - getDuaLocal(duaId) -> reads JSON
// - getLocalImagePath(surahName, verseNumber) -> returns path if exists
// - deleteQuranSurah(surahId)
// - deleteDua(duaId)
// - deleteSurahImages(surahName)
// - getStorageUsage()
