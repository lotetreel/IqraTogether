import React, { useState, useEffect } from 'react';
// Remove direct import of quranCollection
import { duaCollection } from '../data/duaCollection'; 
import { useSocket } from '../contexts/SocketContext'; // Import useSocket
import { Search, Star, Clock, BookOpen, Heart, BarChart2, Book, Loader } from 'lucide-react'; // Add Loader
import BackButton from './ui/BackButton';
import AlFatihaImage from '../assets/images/AlFatiha.png'; // Correct import path from src

const DuaSelectionPage = ({ onSelectDua, onSelectQuran, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('quran'); // Default to Quran
  const [filter, setFilter] = useState('all'); 
  
  // Get Quran list and fetch action from context
  const { quranSurahList, getQuranMetadata, error: socketError } = useSocket(); 
  const [isLoadingQuranList, setIsLoadingQuranList] = useState(false);

  // Fetch Quran metadata when component mounts, tab changes to Quran, or connection is established
  useEffect(() => {
    // Only fetch if Quran tab is active, list is empty, AND socket is connected
    if (activeTab === 'quran' && quranSurahList.length === 0 && connectionStatus === 'connected') {
      setIsLoadingQuranList(true);
      console.log("Attempting to fetch Quran metadata..."); // Add log
      getQuranMetadata(); // Call the action from context
      // Loading state is now primarily handled by the effect below based on list/error changes
    } else if (activeTab === 'quran' && quranSurahList.length === 0 && connectionStatus !== 'connected') {
      console.log("Quran tab active, but socket not connected. Waiting for connection..."); // Add log
      // Optionally set loading state here too, or let the user see an empty state briefly
      // setIsLoadingQuranList(true); // Maybe set loading even if not connected yet?
    }
  // Add connectionStatus to dependencies
  }, [activeTab, getQuranMetadata, quranSurahList.length, connectionStatus]);

  // Update loading state when list populates or error occurs
  useEffect(() => {
    if (quranSurahList.length > 0 || socketError) {
      setIsLoadingQuranList(false);
    }
  }, [quranSurahList, socketError]);

  // --- Filtering Logic ---
  const filterContent = (items, type) => {
    return items.filter(item => {
      // Basic search match (adapt fields as needed)
      const titleMatch = item.title?.toLowerCase().includes(searchTerm.toLowerCase());
      // Add description search if available in metadata
      // const descriptionMatch = item.description?.toLowerCase().includes(searchTerm.toLowerCase()); 
      const matchesSearch = titleMatch; // || descriptionMatch;

      if (!matchesSearch) return false;

      // Filter logic (adapt properties based on metadata)
      if (filter === 'all') return true;
      
      // Example filters (adjust based on actual metadata fields)
      // if (filter === 'popular') return item.popularity >= 5; // Assuming popularity exists
      
      // Filter by length based on totalAyahs for Quran
      if (type === 'quran') {
          const totalAyahs = item.totalAyahs || 0;
          if (filter === 'short') return totalAyahs > 0 && totalAyahs <= 20;
          if (filter === 'medium') return totalAyahs > 20 && totalAyahs <= 100;
          if (filter === 'long') return totalAyahs > 100;
      } 
      // Add length filters for Duas if needed (using existing 'length' property)
      else if (type === 'dua') {
          if (filter === 'short') return item.length === 'Short';
          if (filter === 'medium') return item.length === 'Medium';
          if (filter === 'long') return (item.length === 'Long' || item.length === 'Very Long');
      }

      return true; // Default pass if no specific filter matches
    });
  };

  const filteredDuas = filterContent(duaCollection, 'dua');
  const filteredQuran = filterContent(quranSurahList, 'quran'); // Use quranSurahList from context
  // --- End Filtering Logic ---

  return (
    <div className="animate-fade-in">
      
      <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-800 dark:text-dark-text-primary mb-4">
        {activeTab === 'duas' ? 'Select a Dua to IqraTogether' : 'Select a Surah to IqraTogether'}
      </h1>
      
      <p className="text-center text-gray-600 dark:text-dark-text-secondary mb-8 max-w-lg mx-auto">
        Choose content to share with your session participants. Everyone will follow along as you navigate.
      </p>
      
      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 dark:bg-dark-bg-tertiary rounded-xl p-1.5 shadow-inner-light">
          {/* Quran Button First */}
          <button
            onClick={() => setActiveTab('quran')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'quran' 
                ? 'bg-gradient-primary text-white shadow-md' 
                : 'text-gray-700 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-bg-secondary'
            }`}
          >
            <span className="flex items-center">
              <Book size={18} className="mr-2" />
              Quran
            </span>
          </button>
          {/* Duas Button Second */}
          <button
            onClick={() => setActiveTab('duas')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'duas' 
                ? 'bg-gradient-primary text-white shadow-md' 
                : 'text-gray-700 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-bg-secondary'
            }`}
          >
            <span className="flex items-center">
              <Heart size={18} className="mr-2" />
              Duas
            </span>
          </button>
        </div>
      </div>
      
      {/* Search and filters */}
      <div className="mb-8">
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'duas' ? 'duas' : 'surahs'}...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input w-full pl-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
              filter === 'all' 
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 ring-1 ring-primary-300 dark:ring-primary-700' 
                : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-bg-secondary'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('popular')}
            className={`px-4 py-2 rounded-lg text-sm flex items-center transition-all duration-200 ${
              filter === 'popular' 
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 ring-1 ring-primary-300 dark:ring-primary-700' 
                : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-bg-secondary'
            }`}
          >
            <Star size={16} className="mr-1.5" /> Popular
          </button>
          <button
            onClick={() => setFilter('short')}
            className={`px-4 py-2 rounded-lg text-sm flex items-center transition-all duration-200 ${
              filter === 'short' 
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 ring-1 ring-primary-300 dark:ring-primary-700' 
                : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-bg-secondary'
            }`}
          >
            <Clock size={16} className="mr-1.5" /> Short
          </button>
          <button
            onClick={() => setFilter('medium')}
            className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
              filter === 'medium' 
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 ring-1 ring-primary-300 dark:ring-primary-700' 
                : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-bg-secondary'
            }`}
          >
            Medium
          </button>
          <button
            onClick={() => setFilter('long')}
            className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
              filter === 'long' 
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 ring-1 ring-primary-300 dark:ring-primary-700' 
                : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-bg-secondary'
            }`}
          >
            <BarChart2 size={16} className="mr-1.5" /> Long
          </button>
        </div>
      </div>
      
      {/* Collection grid */}
      {/* Collection grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'duas' ? (
          // --- Dua Rendering (remains mostly the same) ---
          filteredDuas.map(dua => ( // Removed onError from Dua image below
            <div 
              key={dua.id}
              // Pass the full dua object or necessary info to onSelectDua
              onClick={() => onSelectDua({ id: dua.id, title: dua.title, type: 'dua' })} 
              className="card group cursor-pointer overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            >
              {/* Dua card content... (keep existing structure) */}
              <div className="h-40 w-full overflow-hidden relative">
                 <img 
                   src={dua.image || `https://via.placeholder.com/300x200/EFEFEF/AAAAAA?text=${encodeURIComponent(dua.title)}`} // Use placeholder if no image
                   alt={dua.title} 
                   className="w-full h-full object-cover transition-transform duration-700 transform group-hover:scale-110"
                   // Removed onError handler
                 />
                 <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                   <div className="flex justify-between items-end">
                     <h3 className="text-white font-bold text-lg">{dua.title}</h3>
                     {dua.length && (
                       <div className="badge bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                         {dua.length}
                       </div>
                     )}
                   </div>
                   {dua.arabic && <p className="text-white/80 text-sm">{dua.arabic}</p>}
                 </div>
               </div>
               <div className="p-4 relative">
                 {dua.source && <p className="text-sm text-gray-500 dark:text-dark-text-muted mb-2">Source: {dua.source}</p>}
                 {dua.description && <p className="text-gray-700 dark:text-dark-text-secondary line-clamp-3">{dua.description}</p>}
                 <div className="mt-3 flex items-center justify-between">
                   {dua.recitationTime && <span className="text-xs text-gray-500 dark:text-dark-text-muted">{dua.recitationTime}</span>}
                   {dua.popularity && (
                     <div className="flex">
                       {Array.from({ length: dua.popularity }).map((_, i) => (
                         <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                       ))}
                     </div>
                   )}
                 </div>
                 <div className="absolute inset-0 bg-primary-500/0 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:bg-primary-500/10">
                   <span className="btn-primary py-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                     Select Dua
                   </span>
                 </div>
               </div>
            </div>
          ))
        ) : isLoadingQuranList ? (
            // --- Loading State for Quran ---
            <div className="col-span-full flex justify-center items-center py-12">
              <Loader size={32} className="animate-spin text-primary-500 dark:text-primary-400" />
              <span className="ml-3 text-gray-600 dark:text-dark-text-secondary">Loading Quran list...</span>
            </div>
        ) : socketError && quranSurahList.length === 0 ? (
             // --- Error State for Quran ---
             <div className="col-span-full text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-xl">
               <Search size={48} className="mx-auto text-red-300 dark:text-red-600 mb-4" />
               <p className="text-red-600 dark:text-red-300 mb-2 font-medium">Failed to load Quran list</p>
               <p className="text-sm text-red-500 dark:text-red-400">{socketError}</p>
             </div>
        ) : (
          // --- Quran Rendering (using quranSurahList) ---
          filteredQuran.map(surah => { // Removed console.log
            return (
            <div 
              key={surah.id}
              // Pass necessary info to onSelectQuran
              onClick={() => onSelectQuran({ id: surah.id, title: surah.title, type: 'quran' })} 
              className="card group cursor-pointer overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            >
              {/* Adapt card content based on quranMetadata structure */}
              <div className="h-40 w-full overflow-hidden relative">
                 {/* Use specific image for Al-Fatiha (id: 1 or "1"), otherwise placeholder */}
                 <img 
                   src={surah.id === 1 || surah.id === '1' ? AlFatihaImage : `https://via.placeholder.com/300x200/EFEFEF/AAAAAA?text=${encodeURIComponent(surah.title)}`} 
                   alt={surah.title} 
                   className="w-full h-full object-cover transition-transform duration-700 transform group-hover:scale-110"
                   // Removed onError handler
                 />
                 <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                   <div className="flex justify-between items-end">
                     <h3 className="text-white font-bold text-lg">{surah.title}</h3>
                     {/* Display length based on totalAyahs */}
                     {surah.totalAyahs > 0 && (
                       <div className="badge bg-accent-100 text-accent-800 dark:bg-accent-900/50 dark:text-accent-200">
                         {surah.totalAyahs} Ayahs
                       </div>
                     )}
                   </div>
                   {/* Display Arabic name if available */}
                   {surah.arabic && <p className="text-white/80 text-sm">{surah.arabic}</p>}
                 </div>
               </div>
               <div className="p-4 relative">
                 {/* Add description if available in metadata */}
                 {/* {surah.description && <p className="text-gray-700 dark:text-dark-text-secondary line-clamp-3 mb-2">{surah.description}</p>} */}
                 <div className="mt-1 flex items-center justify-between">
                   <span className="flex items-center text-xs text-gray-500 dark:text-dark-text-muted">
                     <BookOpen size={14} className="mr-1" /> Quran
                   </span>
                   {/* Add popularity stars if available */}
                   {/* {surah.popularity && (
                     <div className="flex">
                       {Array.from({ length: surah.popularity }).map((_, i) => (
                         <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                       ))}
                     </div>
                   )} */}
                 </div>
                 <div className="absolute inset-0 bg-accent-500/0 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:bg-accent-500/10">
                   <span className="btn-accent py-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                     Select Surah
                   </span>
                 </div>
               </div>
            </div>
          )})
        )}
      </div>
      
      {/* No results */}
      {/* Adjust condition to check loading/error state for Quran */}
      {(activeTab === 'duas' && filteredDuas.length === 0) || 
       (activeTab === 'quran' && !isLoadingQuranList && !socketError && filteredQuran.length === 0) ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-dark-bg-secondary rounded-xl mt-6">
          <Search size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-dark-text-muted mb-2">No results found</p>
          <p className="text-sm text-gray-400 dark:text-dark-text-muted">Try a different search term or filter</p>
        </div>
      ) : null}
    </div>
  );
};

export default DuaSelectionPage;
