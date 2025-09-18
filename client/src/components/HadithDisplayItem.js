import React, { useMemo, useRef, useState } from 'react';
import { Copy, CheckCircle, Download, Loader2 } from 'lucide-react';
import { toJpeg } from 'html-to-image';

const HadithDisplayItem = ({ hadith, arabicFontSize, translationFontSize, showTranslation }) => {
  const [copiedType, setCopiedType] = useState(null); // null, 'arabic', 'all'
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageStatus, setImageStatus] = useState(null);
  const shareCardRef = useRef(null);

  const englishTextForDisplay = useMemo(() => {
    if (!hadith) {
      return '';
    }

    const parts = [];

    if (hadith.thaqalaynSanad) {
      parts.push(hadith.thaqalaynSanad.trim());
    }

    if (hadith.thaqalaynMatn) {
      parts.push(hadith.thaqalaynMatn.trim());
    }

    if (parts.length === 0 && hadith.englishText) {
      parts.push(hadith.englishText.trim());
    }

    return parts.join(' ');
  }, [hadith]);

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

  const handleGenerateShareImage = async () => {
    if (!shareCardRef.current || isGeneratingImage) {
      return;
    }

    setImageStatus(null);
    setIsGeneratingImage(true);

    try {
      const dataUrl = await toJpeg(shareCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        quality: 0.95,
        backgroundColor: '#f6f4ef',
      });

      const link = document.createElement('a');
      const fileName = hadith?.id ? `hadith-${hadith.id}.jpeg` : 'hadith-share.jpeg';
      link.download = fileName;
      link.href = dataUrl;
      link.click();

      setImageStatus('saved');
    } catch (error) {
      console.error('Failed to generate Hadith share image', error);
      setImageStatus('error');
    } finally {
      setIsGeneratingImage(false);
      setTimeout(() => setImageStatus(null), 4000);
    }
  };

  return (
    <div className="p-3 border-l-4 border-primary-200 dark:border-primary-700 bg-white dark:bg-dark-bg-secondary rounded-r-md">
      {/* Hidden share card used to render the JPEG with a decorative border */}
      <div
        ref={shareCardRef}
        className="fixed -top-[9999px] left-[-9999px] w-[720px]"
        style={{ pointerEvents: 'none', zIndex: -1 }}
      >
        <div className="relative rounded-[32px] bg-gradient-to-br from-amber-200 via-rose-100 to-emerald-100 p-[14px] shadow-[0_40px_80px_-20px_rgba(15,23,42,0.35)]">
          <div className="relative rounded-[26px] bg-white px-12 py-14 flex flex-col gap-8 text-slate-800">
            <div className="text-center uppercase tracking-[0.35em] text-xs font-semibold text-amber-500">
              Hadith {hadith?.id}
            </div>
            {hadith?.arabicText && (
              <div dir="rtl" className="text-3xl leading-loose font-uthmani text-slate-900 text-right">
                {hadith.arabicText}
              </div>
            )}
            {englishTextForDisplay && (
              <>
                <div className="h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                <div className="text-left text-lg leading-relaxed whitespace-pre-line">
                  {englishTextForDisplay}
                </div>
              </>
            )}
            <div className="text-center text-[11px] tracking-[0.25em] uppercase text-slate-400">
              Share the Light of Knowledge
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-2">
        Hadith {hadith.id}
      </p>

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

      <div className="mt-4 flex flex-wrap items-center gap-2">
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
        <button
          onClick={handleGenerateShareImage}
          className={`btn btn-sm text-xs flex items-center ${isGeneratingImage ? 'btn-disabled opacity-70 cursor-wait' : 'btn-primary'}`}
          aria-label="Generate a shareable Hadith image"
          disabled={isGeneratingImage}
        >
          {isGeneratingImage ? (
            <Loader2 size={14} className="mr-1 animate-spin" />
          ) : (
            <Download size={14} className="mr-1" />
          )}
          {isGeneratingImage ? 'Creating...' : 'Share as Image'}
        </button>
        {imageStatus === 'saved' && (
          <span className="text-xs text-green-600 dark:text-green-400">Image saved!</span>
        )}
        {imageStatus === 'error' && (
          <span className="text-xs text-red-600 dark:text-red-400">Could not create image.</span>
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
