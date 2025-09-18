import React from 'react';
import { X, Bookmark } from 'lucide-react';

const BookmarksDialog = ({ bookmarks, onGoToBookmark, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] animate-fade-in p-4">
      <div className="card w-full max-w-lg animate-slide-up">
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold dark:text-dark-text-primary flex items-center">
            <Bookmark size={24} className="mr-2" />
            Your Bookmarks
          </h3>
          <button onClick={onClose} className="btn-icon">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-2 max-h-[60vh] overflow-y-auto">
          {bookmarks.length > 0 ? (
            bookmarks.map((bookmark, index) => (
              <button
                key={index}
                onClick={() => {
                  onGoToBookmark(bookmark);
                  onClose();
                }}
                className="block w-full text-left p-3 rounded hover:bg-primary-100 dark:hover:bg-dark-bg-tertiary transition-colors duration-150"
              >
                <p className="font-semibold">{bookmark.title} - Verse {bookmark.index + 1}</p>
                <p className="text-sm text-gray-600 dark:text-dark-text-muted italic">"{bookmark.verseText}"</p>
              </button>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-dark-text-muted p-4">You have no bookmarks yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookmarksDialog;
