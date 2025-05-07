import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import HadithDisplayItem from './HadithDisplayItem'; // Import the new component

const AlKafiSelectionPage = ({ onSelectAlKafi, isKidsMode, arabicFontSize, translationFontSize, showTranslation }) => {
  const [allVolumesData, setAllVolumesData] = useState([]); // Will store all loaded and processed volumes
  const [selectedVolume, setSelectedVolume] = useState(null); // Initially no volume selected
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAllVolumesData = async () => {
      setIsLoading(true);
      setError(null);
      const volumeNumbers = Array.from({ length: 8 }, (_, i) => i + 1); // Volumes 1 to 8
      const fetchedVolumes = [];

      try {
        const promises = volumeNumbers.map(async (num) => {
          const response = await fetch(`/data/AlKafi/AlKafi Volume ${num}.json`);
          if (!response.ok) {
            console.warn(`HTTP error for Volume ${num}! status: ${response.status}`);
            // Optionally throw an error or return null to indicate failure for this volume
            // For now, let's log and skip, or the Promise.all will fail entirely
            return null; 
          }
          const hadiths = await response.json();
          if (hadiths && hadiths.length > 0) {
            // Derive volume ID and name from the first hadith of the volume
            // Ensure these fields exist and are consistent within the volume's JSON
            const volumeId = hadiths[0].bookId || `AlKafi-Volume-${num}-Unknown`;
            const volumeName = hadiths[0].book || `Al-Kāfi - Volume ${num}`;
            return {
              id: volumeId,
              name: volumeName,
              books: processHadithsIntoBooks(hadiths), // Process hadiths for this volume
              originalHadiths: hadiths, // Keep original hadiths if needed later
            };
          }
          return null; // In case a JSON is empty or malformed
        });

        const results = await Promise.all(promises);
        
        // Filter out any null results (failed fetches)
        const validVolumes = results.filter(vol => vol !== null);
        
        if (validVolumes.length === 0 && volumeNumbers.length > 0) {
            throw new Error("No Al-Kafi volume data could be loaded.");
        }

        setAllVolumesData(validVolumes);
        // Do NOT auto-select a volume here. User will pick.
        // setSelectedVolume(null); // Already default
        setIsLoading(false);
      } catch (e) {
        console.error("Error fetching Al-Kafi data:", e);
        setError(`Failed to load Al-Kafi data: ${e.message}. Please try again later.`);
        setIsLoading(false);
      }
    };

    fetchAllVolumesData();
  }, []);

  const processHadithsIntoBooks = (hadiths) => {
    if (!hadiths || hadiths.length === 0) return []; // Handle empty hadith list for a volume

    const booksMap = new Map();
    hadiths.forEach(hadith => {
      // Ensure categoryId is a number for consistent ID generation and sorting
      const categoryIdNum = parseInt(hadith.categoryId, 10);
      if (isNaN(categoryIdNum)) {
        console.warn(`Invalid categoryId found: ${hadith.categoryId} for hadith ${hadith.id}. Skipping book processing for this hadith.`);
        return; 
      }

      if (!booksMap.has(hadith.category)) {
        booksMap.set(hadith.category, {
          // Use a more robust ID for books, perhaps combining volume and categoryId
          // For now, categoryId should be unique within a volume for books.
          id: categoryIdNum, 
          name: hadith.category,
          categoryId: categoryIdNum, // Store for sorting
          chaptersMap: new Map(),
        });
      }
      const book = booksMap.get(hadith.category);

      // Ensure chapterInCategoryId is a number
      const chapterInCatIdNum = parseInt(hadith.chapterInCategoryId, 10);
      if (isNaN(chapterInCatIdNum)) {
        console.warn(`Invalid chapterInCategoryId: ${hadith.chapterInCategoryId} for hadith ${hadith.id}. Defaulting to 0 for chapter processing.`);
        // Default to 0 or handle as an error, depending on requirements
      }
      
      const chapterKey = hadith.chapter; // Use chapter name as key for the map
      if (!book.chaptersMap.has(chapterKey)) {
        book.chaptersMap.set(chapterKey, {
          // Create a unique ID for the chapter, e.g., bookId-chapterName (slugified)
          // or bookId-chapterInCategoryId if chapterInCategoryId is reliably unique within a book
          id: `${categoryIdNum}-${(chapterInCatIdNum !== undefined ? chapterInCatIdNum : chapterKey.replace(/\s+/g, '-').toLowerCase())}`,
          name: hadith.chapter,
          chapterInCategoryId: chapterInCatIdNum !== undefined ? chapterInCatIdNum : 0, // Store for sorting
          hadiths: [],
        });
      }
      book.chaptersMap.get(chapterKey).hadiths.push(hadith);
    });

    const sortedBooks = Array.from(booksMap.values()).sort((a, b) => {
      return (a.categoryId || 0) - (b.categoryId || 0);
    });

    return sortedBooks.map(book => ({
      ...book,
      chapters: Array.from(book.chaptersMap.values()).sort((a, b) => {
        return (a.chapterInCategoryId || 0) - (b.chapterInCategoryId || 0);
      }),
    }));
  };


  const handleSelectVolume = (volume) => {
    setSelectedVolume(volume);
    setSelectedBook(null);
    setSelectedChapter(null);
  };

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setSelectedChapter(null);
  };

  const handleSelectChapter = (chapter) => {
    setSelectedChapter(chapter);
    // When a chapter is selected, we can inform DuaSyncApp
    // This allows DuaSyncApp to know which chapter is being viewed,
    // potentially for displaying title or other context.
    // The actual display of all hadiths will happen within this component.
    if (onSelectAlKafi && selectedVolume && selectedBook) {
      onSelectAlKafi({
        type: 'alkafi_chapter', // New type to signify chapter view
        volumeId: selectedVolume.id,
        volumeName: selectedVolume.name,
        bookId: selectedBook.id,
        bookName: selectedBook.name,
        chapterId: chapter.id,
        chapterName: chapter.name,
        title: `${selectedBook.name} - ${chapter.name}`,
        hadiths: chapter.hadiths, // Pass all hadiths of the chapter
        startInKidsMode: isKidsMode,
      });
    }
  };

  // handleSelectHadith is no longer needed here as we display all hadiths

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LucideIcons.Loader size={32} className="animate-spin text-primary-500 dark:text-primary-400" />
        <span className="ml-3 text-gray-600 dark:text-dark-text-secondary">Loading Al-Kafi Data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-xl">
        <LucideIcons.AlertTriangle size={48} className="mx-auto text-red-400 dark:text-red-500 mb-4" />
        <p className="text-red-700 dark:text-red-300 mb-2 font-medium">{error}</p>
      </div>
    );
  }

  if (allVolumesData.length === 0) { // Check if any volumes were loaded
    return <div className="text-center py-10">No Al-Kafi data available or failed to load all volumes.</div>;
  }

  // Navigation breadcrumbs
  const renderBreadcrumbs = () => (
    <div className="mb-6 text-sm text-gray-600 dark:text-dark-text-muted flex items-center flex-wrap">
      <button 
        onClick={() => { setSelectedVolume(null); setSelectedBook(null); setSelectedChapter(null); }} 
        className={`${!selectedVolume ? 'font-semibold text-primary-600 dark:text-primary-400' : 'hover:underline'}`}
      >
        Al-Kāfi Volumes
      </button>
      {selectedVolume && (
        <>
          <LucideIcons.ChevronRight size={16} className="mx-1" />
          <button 
            onClick={() => { setSelectedBook(null); setSelectedChapter(null); }} 
            className={`${!selectedBook ? 'font-semibold text-primary-600 dark:text-primary-400' : 'hover:underline'}`}
          >
            {selectedVolume.name}
          </button>
        </>
      )}
      {selectedBook && (
        <>
          <LucideIcons.ChevronRight size={16} className="mx-1" />
          <button 
            onClick={() => setSelectedChapter(null)} 
            className={`${!selectedChapter ? 'font-semibold text-primary-600 dark:text-primary-400' : 'hover:underline'}`}
          >
            {selectedBook.name}
          </button>
        </>
      )}
      {selectedChapter && (
        <>
          <LucideIcons.ChevronRight size={16} className="mx-1" />
          <span className="font-semibold text-primary-600 dark:text-primary-400">{selectedChapter.name}</span>
        </>
      )}
    </div>
  );
  
  // Display Volumes
  if (!selectedVolume) {
    return (
      <div className="space-y-4">
        {renderBreadcrumbs()}
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-dark-text-primary">Select a Volume</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allVolumesData.map(vol => (
            <div key={vol.id} onClick={() => handleSelectVolume(vol)}
                 className="card p-5 cursor-pointer hover:bg-primary-50 dark:hover:bg-dark-bg-tertiary transition-all duration-200 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl rounded-lg border border-gray-200 dark:border-dark-bg-border">
              <h3 className="font-semibold text-lg text-primary-700 dark:text-primary-400 mb-1">{vol.name}</h3>
              <p className="text-xs text-gray-500 dark:text-dark-text-muted">{vol.books.length} books</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Display Books in the selected Volume
  // This block was duplicated, ensuring only one remains. The content is the same.
  if (!selectedBook) {
    return (
      <div className="space-y-4">
        {renderBreadcrumbs()}
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-dark-text-secondary">Books in {selectedVolume.name}</h2>
        {selectedVolume.books.map(book => (
          <div key={book.id} onClick={() => handleSelectBook(book)}
               className="card p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors">
            <h3 className="font-medium text-lg text-primary-700 dark:text-primary-400">{book.name}</h3>
            <p className="text-sm text-gray-500 dark:text-dark-text-muted">{book.chapters.length} chapters</p>
          </div>
        ))}
      </div>
    );
  }

  // Display Chapters in the selected Book
  if (!selectedChapter) {
    return (
      <div className="space-y-4">
        {renderBreadcrumbs()}
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-dark-text-secondary">Chapters in {selectedBook.name}</h2>
        {selectedBook.chapters.map(chapter => (
          <div key={chapter.id} onClick={() => handleSelectChapter(chapter)}
               className="card p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors">
            <h3 className="font-medium text-lg text-primary-700 dark:text-primary-400">{chapter.name}</h3>
            <p className="text-sm text-gray-500 dark:text-dark-text-muted">{chapter.hadiths.length} hadiths</p>
          </div>
        ))}
      </div>
    );
  }

  // Display all Hadiths in the selected Chapter
  return (
    <div className="space-y-2">
      {renderBreadcrumbs()}
      <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-dark-text-secondary">
        Hadiths in {selectedChapter.name}
      </h2>
      <div className="max-h-[70vh] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {selectedChapter.hadiths.sort((a, b) => a.id - b.id).map(hadith => (
          <HadithDisplayItem
            key={hadith.id}
            hadith={hadith}
            arabicFontSize={arabicFontSize}
            translationFontSize={translationFontSize}
            showTranslation={showTranslation}
          />
        ))}
      </div>
    </div>
  );
};

export default AlKafiSelectionPage;
