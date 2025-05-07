import React, { useState } from 'react';
import { Copy, CheckCircle } from 'lucide-react';

const HadithDisplayItem = ({ hadith, arabicFontSize, translationFontSize, showTranslation }) => {
  const [copiedType, setCopiedType] = useState(null); // null, 'arabic', 'all'

  if (!hadith) {
    return null;
  }

  const handleCopy = async (type) => {
    let textToCopy = '';
    if (type === 'arabic') {
      textToCopy = hadith.arabicText || '';
    } else if (type === 'all') {
      const arabicPart = hadith.arabicText || '';
      let englishPart = '';

      if (hadith.thaqalaynSanad && hadith.thaqalaynMatn) {
        englishPart = `${hadith.thaqalaynSanad} ${hadith.thaqalaynMatn}`;
      } else if (hadith.englishText) {
        englishPart = hadith.englishText;
      } else if (hadith.thaqalaynSanad) {
        englishPart = hadith.thaqalaynSanad;
      } else if (hadith.thaqalaynMatn) {
        englishPart = hadith.thaqalaynMatn;
      }
      
      textToCopy = arabicPart;
      if (englishPart) {
        textToCopy += `\n\n${englishPart}`;
      }
    }

    if (textToCopy) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        setCopiedType(type);
        setTimeout(() => setCopiedType(null), 2000); // Reset after 2 seconds
      } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy text. Please try again.');
      }
    }
  };

  // Default font sizes if not provided
  const currentArabicFontSize = arabicFontSize || 1.5;
  const currentTranslationFontSize = translationFontSize || 1.125;

  return (
    <div className="card p-4 mb-4 shadow-sm">
      <h4 className="font-semibold text-lg text-primary-700 dark:text-primary-400 mb-2">
        Hadith {hadith.id}
      </h4>

      {/* Full Arabic Text (includes Arabic Sanad and Matn) */}
      {hadith.arabicText && (
        <div className="mb-3 text-right" dir="rtl">
          <p 
            className="leading-loose font-uthmani"
            style={{ fontSize: `${currentArabicFontSize}rem` }}
          >
            {hadith.arabicText}
          </p>
        </div>
      )}

      {/* English Translation Section (Sanad and Matn) */}
      {showTranslation && (
        <div className={`${hadith.arabicText ? 'border-t pt-3 border-gray-200 dark:border-gray-700' : ''} mt-2`}>
          <p 
            className="text-gray-800 dark:text-dark-text-primary" // Base styling for the paragraph
            style={{ fontSize: `${currentTranslationFontSize}rem` }}
          >
            {hadith.thaqalaynSanad && (
              <span 
                className="text-gray-700 dark:text-dark-text-secondary" // Non-italic, slightly less prominent
                style={{ fontSize: `${currentTranslationFontSize * 0.95}rem` }}
              >
                {hadith.thaqalaynSanad}
              </span>
            )}
            {hadith.thaqalaynSanad && hadith.thaqalaynMatn && " "} {/* Space if both Sanad and Matn exist */}
            {hadith.thaqalaynMatn && (
              <span>{hadith.thaqalaynMatn}</span> // Matn part
            )}
            {/* Fallback: if no specific Sanad AND no specific Matn, but englishText exists */}
            {!hadith.thaqalaynSanad && !hadith.thaqalaynMatn && hadith.englishText && (
              <span>{hadith.englishText}</span>
            )}
            {/* Case: Only Sanad exists, no Matn, no englishText (unlikely but covered) */}
            {hadith.thaqalaynSanad && !hadith.thaqalaynMatn && !hadith.englishText && (
                 <span 
                 className="text-gray-700 dark:text-dark-text-secondary"
                 style={{ fontSize: `${currentTranslationFontSize * 0.95}rem` }}
               >
                 {hadith.thaqalaynSanad}
               </span>
            )}
             {/* Case: Only Matn exists, no Sanad, no englishText (unlikely but covered) */}
             {!hadith.thaqalaynSanad && hadith.thaqalaynMatn && !hadith.englishText && (
                <span>{hadith.thaqalaynMatn}</span>
            )}
          </p>
        </div>
      )}

      <div className="mt-4 flex space-x-2">
        {hadith.arabicText && (
          <button
            onClick={() => handleCopy('arabic')}
            className="btn btn-sm btn-ghost text-xs flex items-center"
            aria-label="Copy Arabic text"
          >
            {copiedType === 'arabic' ? <CheckCircle size={14} className="mr-1 text-green-500" /> : <Copy size={14} className="mr-1" />}
            {copiedType === 'arabic' ? 'Copied Arabic' : 'Copy Arabic'}
          </button>
        )}
        {(hadith.arabicText || hadith.thaqalaynSanad || hadith.thaqalaynMatn || hadith.englishText) && showTranslation && (
          <button
            onClick={() => handleCopy('all')}
            className="btn btn-sm btn-ghost text-xs flex items-center"
            aria-label="Copy Arabic and English text"
          >
            {copiedType === 'all' ? <CheckCircle size={14} className="mr-1 text-green-500" /> : <Copy size={14} className="mr-1" />}
            {copiedType === 'all' ? 'Copied All' : 'Copy All'}
          </button>
        )}
      </div>

      {/* Optionally, display other info like grading if needed */}
      {/* 
      {showTranslation && hadith.majlisiGrading && (
        <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-2">
          Majlisi Grading: {hadith.majlisiGrading}
        </p>
      )}
      */}
    </div>
  );
};

export default HadithDisplayItem;
