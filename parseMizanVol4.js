const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');

const htmlFilePath = path.join(__dirname, 'client', 'public', 'data', 'MizanAlHikmah', 'the_scale_of_wisdom_04.htm'); // Changed to Vol 4 HTML
const jsonOutputPath = path.join(__dirname, 'client', 'public', 'data', 'MizanAlHikmah', 'mizan_al_hikmah_vol4.json'); // Changed to Vol 4 JSON

// Threshold to differentiate chapter numbers from section numbers
// Vol 4 Chapters seem to be < 1000, Sections >= 1000
const CHAPTER_NUMBER_THRESHOLD = 1000; // Adjusted for Vol 4

console.log(`Reading HTML file from: ${htmlFilePath}`);

try {
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
    const $ = cheerio.load(htmlContent);

    console.log('HTML loaded successfully. Starting parsing...');

    const chapters = [];
    let currentChapter = null;
    let currentSection = null;
    let currentHadithNum = 0; // Global hadith counter
    let currentFootnoteSection = [];
    let pendingArabicTitle = null; // Store potential Arabic title (can be chapter or section)
    let lastProcessedTitleType = null; // 'chapter' or 'section'

    const cleanText = (text) => {
        return text.replace(/\s+/g, ' ').trim();
    };

    const extractFootnotes = (element, footnoteMap) => {
        const footnoteNumbers = [];
        const cleanedElement = element.clone(); // Clone to avoid modifying the original during text extraction
        cleanedElement.find('span.libFootnotenum').each((i, span) => {
            const numText = $(span).text().trim();
            const numMatch = numText.match(/\d+/);
            if (numMatch) {
                const num = parseInt(numMatch[0], 10);
                 if (!isNaN(num)) {
                    footnoteNumbers.push(num);
                }
            }
            $(span).remove(); // Remove span after extracting number
        });
        const text = cleanText(cleanedElement.text());
        return { text, footnoteNumbers: [...new Set(footnoteNumbers)].sort((a, b) => a - b) }; // Return text and unique sorted numbers
    };


    $('#bookContent > *').each((index, element) => {
        const $el = $(element);
        const elTag = element.tagName;
        const elClass = $el.attr('class');
        let elText = $el.text(); // Get raw text first for cleaning

        // Skip initial table of contents elements
        if (elClass && (elClass.includes('libToc') || elClass.includes('idxEnt') || elClass.includes('libCenterTitr') || elClass.includes('libCenterBold'))) {
            // Also skip image tags and initial title/author/ISBN info often wrapped in specific classes or simple p tags
            if (elTag === 'img' || $el.find('img').length > 0) {
                 console.log(`Skipping image element or element containing image.`);
                 return;
            }
            if (elClass && (elClass.includes('libCenterTitr') || elClass.includes('libCenterBold1') || elClass.includes('libCenterBold2') || elClass.includes('contentheading'))) {
                console.log(`Skipping title/header element: ${cleanText(elText).substring(0,50)}`);
                return;
            }
            // Specifically check for "Table of Contents" text
            if (cleanText(elText).toLowerCase().includes("table of contents")) {
                console.log("Skipping 'Table of Contents' marker.");
                return;
            }
            // If it's a ToC entry, skip it.
            if (elClass.includes('libToc') || elClass.includes('idxEnt')) {
                console.log(`Skipping ToC element: ${cleanText(elText).substring(0,50)}`);
                return;
            }
        }
        
        elText = cleanText(elText); // Clean text after initial checks


        // --- Chapter/Section Detection (Using Heading1Center for Chapters, Heading2Center for Sections) ---
        const isChapterHeading = elTag === 'p' && elClass && elClass.includes('Heading1Center');
        const isSectionHeading = elTag === 'p' && elClass && elClass.includes('Heading2Center');

        if (isChapterHeading || isSectionHeading) {
            const text = elText; // Already cleaned
            const matchAr = text.match(/^(\d+)\s*-\s*(.+)/); // Arabic: Number - Title
            // Regex for English: number, optional dot, space, title
            const matchEn = text.match(/^(\d+)\.?\s+(.+)/);

            if (matchAr) {
                pendingArabicTitle = { num: parseInt(matchAr[1], 10), title: matchAr[2] };
                console.log(`Stored Pending Arabic Title (num ${pendingArabicTitle.num}): ${pendingArabicTitle.title}`);
            } else if (matchEn && pendingArabicTitle && pendingArabicTitle.num === parseInt(matchEn[1], 10)) {
                const num = pendingArabicTitle.num;
                const titleAr = pendingArabicTitle.title;
                const titleEn = matchEn[2];

                // Use class to determine if it's a chapter or section
                if (isChapterHeading) { // Treat as Chapter
                    currentChapter = {
                        chapter_num: num,
                        chapter_title_ar: titleAr,
                        chapter_title_en: titleEn,
                        sections: []
                    };
                    chapters.push(currentChapter);
                    currentSection = null; // Reset section
                    lastProcessedTitleType = 'chapter';
                    console.log(`\n--- Found Chapter ${num}: ${titleEn} ---`);
                } else if (isSectionHeading && currentChapter) { // Treat as Section (and a chapter must be active)
                    currentSection = {
                        section_num: num,
                        section_title_ar: titleAr,
                        section_title_en: titleEn,
                        hadiths: []
                    };
                    currentChapter.sections.push(currentSection);
                    currentFootnoteSection = []; // Reset footnotes for new section
                    lastProcessedTitleType = 'section';
                    console.log(`  --- Found Section ${num}: ${titleEn} ---`);
                } else {
                    console.warn(`Warning: Found section-like title (num ${num}) but no active chapter. Skipping: ${titleEn}`);
                }
                pendingArabicTitle = null; // Clear pending title
            } else {
                 if (matchEn) console.log(`Found English Title ${matchEn[1]} but no matching pending Arabic title or numbers mismatch.`);
                 pendingArabicTitle = null; // Mismatch or standalone English title, clear pending
            }
            return;
        }

        // Clear pending title if a non-heading, non-hadith, non-footnote element is encountered
        const isHadithPart = (elTag === 'p' && (elClass?.includes('libAr') || elClass?.includes('libNormal') || elClass?.includes('libBoldItalic')));
        const isFootnotePart = (elTag === 'h3' && elText.toLowerCase() === 'notes') || (elTag === 'p' && elClass?.includes('libFootnote'));
        const isIndexRef = (elTag === 'a' && elClass?.includes('idxRef'));
        const isPageBreak = (elTag === 'div' && elClass?.includes('page')); // Example: <div id="pg0" class="page newStyle">
        const isEmptyParagraph = (elTag === 'p' && elText === '');
        const isBrClearAll = (elTag === 'br' && $el.attr('clear') === 'all');
        // Handle <p class=libBold2>(See also: Qur'an ...)</p>
        const isSeeAlso = (elTag === 'p' && elClass?.includes('libBold2') && elText.toLowerCase().startsWith('(see also:'));


        if (!isHadithPart && !isFootnotePart && !isIndexRef && !isPageBreak && !isEmptyParagraph && !isBrClearAll && !isSeeAlso) {
             if (pendingArabicTitle) {
                 console.log(`Clearing pending Arabic title (num ${pendingArabicTitle.num}) due to intermediate element: <${elTag} class="${elClass || ''}"> Text: ${elText.substring(0,30)}`);
                 pendingArabicTitle = null;
             }
        }


        // --- Footnote Section Detection ---
        if (currentChapter && (currentSection || lastProcessedTitleType === 'chapter') && elTag === 'h3' && elText.toLowerCase() === 'notes') {
            const targetSectionForFootnotes = currentSection || (currentChapter.sections.length > 0 ? currentChapter.sections[currentChapter.sections.length-1] : null);

            const targetContainerForFootnotes = currentSection || (currentChapter && currentChapter.sections.length > 0 ? currentChapter.sections[currentChapter.sections.length - 1] : null);

            if (targetContainerForFootnotes && targetContainerForFootnotes.hadiths) {
                const footnoteMap = {};
                currentFootnoteSection.forEach(fn => {
                    const match = fn.match(/^(\d+)\.?\s*(.*)/); // Optional period after number
                    if (match) {
                        footnoteMap[parseInt(match[1], 10)] = cleanText(match[2]);
                    } else {
                        console.log(`Non-standard footnote found, not mapped: ${fn}`);
                    }
                });

                // Assign footnotes based on stored numbers
                targetContainerForFootnotes.hadiths.forEach(hadith => {
                    const allFootnoteNumbers = [...new Set([...hadith.arabicFootnoteNums, ...hadith.englishFootnoteNums])].sort((a, b) => a - b);
                    hadith.footnotes = allFootnoteNumbers
                        .filter(num => footnoteMap[num]) // Keep only numbers found in the map
                        .map(num => ({ num: num, text: footnoteMap[num] })); // Create footnote objects

                    // Clean up temporary properties
                    delete hadith.arabicFootnoteNums;
                    delete hadith.englishFootnoteNums;
                });
                console.log(`    Processed footnotes for Section ${targetContainerForFootnotes.section_num || ' (belonging to chapter)'}`);
            } else {
                 console.warn("Warning: 'Notes' heading found, but no current section or hadiths to assign to.");
            }
            currentFootnoteSection = [];
            return;
        }

        // --- Footnote Line Collection ---
        if (currentChapter && (currentSection || lastProcessedTitleType === 'chapter') && elTag === 'p' && elClass && elClass.includes('libFootnote')) {
            currentFootnoteSection.push(elText); // elText is already cleaned
            return;
        }

        // --- Hadith Detection ---
        // Ensure we are within a chapter, and either in a section or the chapter itself can contain hadiths (if no sections defined yet)
        const activeHadithContainer = currentSection || (currentChapter && currentChapter.sections.length === 0 ? currentChapter : null);

        if (activeHadithContainer && elTag === 'p' && elClass && elClass.includes('libAr')) {
            const arabicTextElement = $el;
            // Hadith numbers can be like "3272." or "1."
            const hadithNumMatch = arabicTextElement.text().trim().match(/^(\d+)\.?/);


            if (hadithNumMatch) {
                currentHadithNum = parseInt(hadithNumMatch[1], 10);
                let nextElement = $el.next();
                
                // Skip over <br clear=all><p class=libNormal></p> (empty paragraph after a break)
                while(nextElement.length > 0 && 
                      ( (nextElement.is('br') && nextElement.attr('clear') === 'all') || 
                        (nextElement.is('p') && nextElement.hasClass('libNormal') && cleanText(nextElement.text()) === '') )
                     ){
                    console.log("Skipping br or empty p after Arabic Hadith part");
                    nextElement = nextElement.next();
                }


                if (nextElement.length > 0 && nextElement.is('p') && (nextElement.hasClass('libNormal') || nextElement.hasClass('libBoldItalic'))) {
                    const englishTextElement = nextElement;

                    // Extract text and footnote numbers immediately
                    const arabicData = extractFootnotes(arabicTextElement, {}); // Pass empty map as we only need numbers now
                    const englishData = extractFootnotes(englishTextElement, {});

                    const hadithData = {
                        hadith_num: currentHadithNum,
                        arabic: arabicData.text,
                        english: englishData.text,
                        arabicFootnoteNums: arabicData.footnoteNumbers, // Store numbers temporarily
                        englishFootnoteNums: englishData.footnoteNumbers, // Store numbers temporarily
                        footnotes: [] // Will be populated later
                    };

                    if (!activeHadithContainer.hadiths) activeHadithContainer.hadiths = [];
                    activeHadithContainer.hadiths.push(hadithData);

                    console.log(`      Found Hadith ${currentHadithNum}`);
                    nextElement.addClass('processed-english');
                } else {
                    console.warn(`      Found Arabic Hadith ${currentHadithNum} but no subsequent English libNormal/libBoldItalic paragraph. Next element: <${nextElement.prop('tagName')} class="${nextElement.attr('class')}"> Text: ${cleanText(nextElement.text()).substring(0,30)}`);
                }
            }
        } else if (activeHadithContainer && elTag === 'p' && elClass && (elClass.includes('libNormal') || elClass.includes('libBoldItalic')) && !$el.hasClass('processed-english')) {
            // This might be a Quranic verse or other text not directly part of a numbered Hadith pair.
            // If it's a Quranic verse (often libBoldItalic) and part of a section that expects Hadiths,
            // it might need special handling or to be appended to the previous Hadith's English text if appropriate.
            // For now, the script primarily focuses on numbered Ar/En pairs.
            // Handle potential standalone italic text (like Qur'an verses) not immediately following Arabic
            if ($el.hasClass('libBoldItalic') && activeHadithContainer && activeHadithContainer.hadiths && activeHadithContainer.hadiths.length > 0) {
                 const lastHadith = activeHadithContainer.hadiths[activeHadithContainer.hadiths.length - 1];
                 // Check if the last hadith's English text doesn't already end with this text (to avoid duplication)
                 // And check if footnotes haven't been processed yet (indicated by existence of temp properties)
                 if (lastHadith.english && !lastHadith.english.endsWith(elText) && lastHadith.englishFootnoteNums) {
                     console.log(`      Appending italic text to Hadith ${lastHadith.hadith_num}: ${elText.substring(0,50)}`);
                     lastHadith.english += ' ' + elText; // Append the text
                     // Re-extract footnote numbers from the appended element if needed
                     const appendedFootnotes = extractFootnotes($el, {}).footnoteNumbers;
                     lastHadith.englishFootnoteNums = [...new Set([...lastHadith.englishFootnoteNums, ...appendedFootnotes])].sort((a, b) => a - b);
                 }
            } else if ($el.hasClass('libNormal')) {
                 // Log other unprocessed libNormal paragraphs if necessary for debugging
                 // console.log(`Found unprocessed libNormal paragraph: ${elText.substring(0, 50)}`);
            }
        }


        if ($el.hasClass('processed-english')) {
            $el.removeClass('processed-english');
        }
    });

    console.log(`\nParsing complete. Found ${chapters.length} chapters.`);

    // Final footnote processing for the very last section if it didn't have an explicit "Notes"
    const lastChapter = chapters[chapters.length - 1];
    if (lastChapter) {
        const lastActiveSection = lastChapter.sections.length > 0 ? lastChapter.sections[lastChapter.sections.length - 1] : (lastChapter.hadiths && lastChapter.hadiths.length > 0 ? lastChapter : null) ;

        if (lastActiveSection && currentFootnoteSection.length > 0) {
            console.warn("Warning: Found unprocessed footnotes at the end. Processing them for the last section/chapter.");
            const footnoteMap = {};
            currentFootnoteSection.forEach(fn => {
                const match = fn.match(/^(\d+)\.?\s*(.*)/);
                if (match) {
                    footnoteMap[parseInt(match[1], 10)] = cleanText(match[2]);
                }
            });
            if (lastActiveSection.hadiths) {
                 // Assign footnotes based on stored numbers
                 lastActiveSection.hadiths.forEach(hadith => {
                    if (hadith.arabicFootnoteNums || hadith.englishFootnoteNums) { // Check if footnotes need processing
                        const allFootnoteNumbers = [...new Set([...(hadith.arabicFootnoteNums || []), ...(hadith.englishFootnoteNums || [])])].sort((a, b) => a - b);
                        hadith.footnotes = allFootnoteNumbers
                            .filter(num => footnoteMap[num])
                            .map(num => ({ num: num, text: footnoteMap[num] }));

                        delete hadith.arabicFootnoteNums;
                        delete hadith.englishFootnoteNums;
                         console.log(`    Processed final footnotes for Hadith ${hadith.hadith_num}`);
                    }
                });
            }
        }
    }


    const outputDir = path.dirname(jsonOutputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Created output directory: ${outputDir}`);
    }

    fs.writeFileSync(jsonOutputPath, JSON.stringify(chapters, null, 2), 'utf-8');
    console.log(`Successfully parsed and wrote JSON to: ${jsonOutputPath}`);

} catch (error) {
    console.error("Error processing the file:", error);
    console.error(error.stack);
}
