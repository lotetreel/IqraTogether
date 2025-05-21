import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HadithSelectionPage from './HadithSelectionPage';

// --- Mocks ---
// Mock duaCollection
const mockContentMapData = {
  'mizan_vol1_ch1': {
    id: 'mizan_vol1_ch1',
    type: 'hadith_chapter',
    source: 'Mizan al-Hikmah',
    volume: 1,
    chapter_num: 1,
    chapter_title_en: "SELF-SACRIFICE",
    chapter_title_ar: "الإيثار",
    sections: [
      {
        id: 'mizan_vol1_ch1_sec1',
        section_num: 1,
        section_title_en: "The Virtue of Self-Sacrifice",
        section_title_ar: "فَضلُ الإيثارِ",
        hadiths: [
          { id: 'mizan_v1_c1_s1_h1', hadith_num: 1, arabic: "الإِيثارُ أعلَى المَكارِمِ.", english: "Self-sacrifice is the highest of virtues.", footnotes: "Footnote 1" },
          { id: 'mizan_v1_c1_s1_h2', hadith_num: 2, arabic: "الإِيثارُ شيمَةُ الأَبرارِ.", english: "Self-sacrifice is a characteristic of the righteous.", footnotes: "" }
        ]
      },
      {
        id: 'mizan_vol1_ch1_sec2',
        section_num: 2,
        section_title_en: "Other Aspects",
        section_title_ar: "جوانب أخرى",
        hadiths: [
          { id: 'mizan_v1_c1_s2_h3', hadith_num: 3, arabic: "الكَرَمُ الإيثارُ.", english: "Generosity is self-sacrifice.", footnotes: "" }
        ]
      }
    ]
  },
  'mizan_vol1_ch2': {
    id: 'mizan_vol1_ch2',
    type: 'hadith_chapter',
    source: 'Mizan al-Hikmah',
    volume: 1,
    chapter_num: 2,
    chapter_title_en: "KNOWLEDGE",
    chapter_title_ar: "العلم",
    sections: [
      {
        id: 'mizan_vol1_ch2_sec1',
        section_num: 1,
        section_title_en: "The Virtue of Knowledge",
        section_title_ar: "فضل العلم",
        hadiths: [
          { id: 'mizan_v1_c2_s1_h1', hadith_num: 1, arabic: "العِلْمُ نُورٌ.", english: "Knowledge is light.", footnotes: "" },
          { id: 'mizan_v1_c2_s1_h2', hadith_num: 2, arabic: "اطلُبُوا العِلْمَ مِنَ المَهْدِ إلَى اللَّحْدِ.", english: "Seek knowledge from the cradle to the grave.", footnotes: "A well-known saying." }
        ]
      }
    ]
  },
  'other_book_ch1': { // To be filtered out by the component's loader
    id: 'other_book_ch1',
    type: 'hadith_chapter',
    source: 'Other Book',
    volume: 1,
    chapter_num: 1,
    chapter_title_en: "Test",
    chapter_title_ar: "Test AR",
    sections: []
  }
};

jest.mock('../data/duaCollection', () => ({
  dataReadyPromise: Promise.resolve(),
  contentMap: mockContentMapData,
}));

// Mock MizanHadithSearchResultItem
jest.mock('./MizanHadithSearchResultItem', () => {
  return jest.fn(({ resultItem }) => (
    <div data-testid={`search-result-${resultItem.id}`}>
      <p>{resultItem.english}</p>
      <p>{resultItem.arabic}</p>
      <p>Vol: {resultItem.volumeNumber}, Ch: {resultItem.chapterNumber}, Sec: {resultItem.sectionNumber}, H: {resultItem.hadith_num}</p>
    </div>
  ));
});

// Mock Lucide icons
jest.mock('lucide-react', () => {
  const originalModule = jest.requireActual('lucide-react');
  const Svg = ({ children, ...props }) => <svg {...props}>{children}</svg>; // Simple SVG mock
  const icons = Object.keys(originalModule).reduce((acc, key) => {
    // Mock only functional components (icons)
    if (typeof originalModule[key] === 'function' && /^[A-Z]/.test(key)) {
      acc[key] = (props) => <Svg data-lucide-icon={key.toLowerCase()} {...props} />;
    } else {
      acc[key] = originalModule[key]; // Preserve other exports if any
    }
    return acc;
  }, {});
  return icons;
});


describe('HadithSelectionPage Search Functionality', () => {
  const mockOnSelectHadithChapter = jest.fn();

  beforeEach(async () => {
    // Ensure mocks are cleared and component is re-rendered for each test
    mockOnSelectHadithChapter.mockClear();
    // Wait for the component to finish its initial data loading effect
    render(<HadithSelectionPage onSelectHadithChapter={mockOnSelectHadithChapter} />);
    await screen.findByText('Mizan al-Hikmah - Volume 1'); // Wait for initial content
  });

  test('renders search input field', () => {
    expect(screen.getByPlaceholderText(/Search Hadith/i)).toBeInTheDocument();
  });

  test('empty query: shows no search results, keeps volume selector visible', () => {
    const searchInput = screen.getByPlaceholderText(/Search Hadith/i);
    fireEvent.change(searchInput, { target: { value: ' ' } }); // Empty or whitespace
    
    // Check that search results section is not displaying specific "no results" message for active search
    expect(screen.queryByText(/No hadiths found for your query/i)).not.toBeInTheDocument();
    // Check that MizanHadithSearchResultItem is not rendered
    expect(screen.queryByTestId(/search-result-/)).not.toBeInTheDocument();
    // Volume selector should still be visible
    expect(screen.getByText('Mizan al-Hikmah - Volume 1')).toBeVisible();
  });

  test('no results: shows "No results found" message when query matches nothing', async () => {
    const searchInput = screen.getByPlaceholderText(/Search Hadith/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistentqueryxyz' } });

    await waitFor(() => {
      expect(screen.getByText(/No Results Found/i)).toBeVisible();
      expect(screen.getByText(/No hadiths found for your query: "nonexistentqueryxyz"/i)).toBeVisible();
    });
    expect(screen.queryByTestId(/search-result-/)).not.toBeInTheDocument();
     // Volume selector should be hidden
    expect(screen.queryByText('Mizan al-Hikmah - Volume 1')).not.toBeInTheDocument();
  });

  test('match in English text (case-insensitive, partial)', async () => {
    const searchInput = screen.getByPlaceholderText(/Search Hadith/i);
    fireEvent.change(searchInput, { target: { value: 'sacrifice' } }); // "Self-sacrifice"

    await waitFor(() => {
      // Expect 3 results containing "sacrifice"
      expect(screen.getAllByTestId(/search-result-/)).toHaveLength(3); 
    });

    // Check specific items (first one)
    const firstResult = screen.getByTestId('search-result-mizan_v1_c1_s1_h1');
    expect(firstResult).toHaveTextContent("Self-sacrifice is the highest of virtues.");
    expect(firstResult).toHaveTextContent("الإِيثارُ أعلَى المَكارِمِ.");
    expect(firstResult).toHaveTextContent("Vol: 1, Ch: 1, Sec: 1, H: 1");

    // Check another item
    const thirdResult = screen.getByTestId('search-result-mizan_v1_c1_s2_h3');
    expect(thirdResult).toHaveTextContent("Generosity is self-sacrifice.");
  });

  test('match in Arabic text (partial)', async () => {
    const searchInput = screen.getByPlaceholderText(/Search Hadith/i);
    fireEvent.change(searchInput, { target: { value: 'الإيثار' } }); // "الإيثار"

    await waitFor(() => {
       // Expect 3 results containing "الإيثار" (2 direct, 1 in chapter title used in mock)
       // The search logic currently doesn't search chapter titles, only hadith text.
       // So it should find 2 from hadith text and 1 from another hadith text.
       // The word "الإيثار" is in 3 hadiths: 
       // 1. "الإِيثارُ أعلَى المَكارِمِ."
       // 2. "الإِيثارُ شيمَةُ الأَبرارِ."
       // 3. "الكَرَمُ الإيثارُ."
      expect(screen.getAllByTestId(/search-result-/)).toHaveLength(3);
    });
    expect(screen.getByTestId('search-result-mizan_v1_c1_s1_h1')).toBeInTheDocument();
    expect(screen.getByTestId('search-result-mizan_v1_c1_s1_h2')).toBeInTheDocument();
    expect(screen.getByTestId('search-result-mizan_v1_c1_s2_h3')).toBeInTheDocument();
  });
  
  test('match in multiple hadiths across chapters/sections', async () => {
    const searchInput = screen.getByPlaceholderText(/Search Hadith/i);
    // "is" is very generic and will match multiple items
    fireEvent.change(searchInput, { target: { value: 'is' } }); 

    await waitFor(() => {
      // "Self-sacrifice is the highest of virtues." (Ch1, Sec1, H1)
      // "Self-sacrifice is a characteristic of the righteous." (Ch1, Sec1, H2)
      // "Generosity is self-sacrifice." (Ch1, Sec2, H3)
      // "Knowledge is light." (Ch2, Sec1, H1)
      expect(screen.getAllByTestId(/search-result-/)).toHaveLength(4);
    });
    expect(screen.getByTestId('search-result-mizan_v1_c1_s1_h1')).toBeInTheDocument();
    expect(screen.getByTestId('search-result-mizan_v1_c1_s1_h2')).toBeInTheDocument();
    expect(screen.getByTestId('search-result-mizan_v1_c1_s2_h3')).toBeInTheDocument();
    expect(screen.getByTestId('search-result-mizan_v1_c2_s1_h1')).toBeInTheDocument();
  });

  test('query with leading/trailing spaces is trimmed', async () => {
    const searchInput = screen.getByPlaceholderText(/Search Hadith/i);
    fireEvent.change(searchInput, { target: { value: '  knowledge  ' } });

    await waitFor(() => {
      // "Knowledge is light."
      // "Seek knowledge from the cradle to the grave."
      expect(screen.getAllByTestId(/search-result-/)).toHaveLength(2);
    });
    expect(screen.getByTestId('search-result-mizan_v1_c2_s1_h1')).toBeInTheDocument();
    expect(screen.getByTestId('search-result-mizan_v1_c2_s1_h2')).toBeInTheDocument();
  });

  test('source information correctness', async () => {
    const searchInput = screen.getByPlaceholderText(/Search Hadith/i);
    fireEvent.change(searchInput, { target: { value: 'highest of virtues' } });

    await waitFor(() => {
      expect(screen.getAllByTestId(/search-result-/)).toHaveLength(1);
    });
    
    const resultItem = screen.getByTestId('search-result-mizan_v1_c1_s1_h1');
    expect(resultItem).toHaveTextContent("Self-sacrifice is the highest of virtues.");
    expect(resultItem).toHaveTextContent("الإِيثارُ أعلَى المَكارِمِ.");
    // Check source info from the mocked MizanHadithSearchResultItem structure
    expect(resultItem).toHaveTextContent("Vol: 1, Ch: 1, Sec: 1, H: 1");
    // We can also check the props passed to the mock component if needed for more detailed source check
    // For example, by inspecting MizanHadithSearchResultItem.mock.calls
    const mockCall = MizanHadithSearchResultItem.mock.calls.find(call => call[0].resultItem.id === 'mizan_v1_c1_s1_h1');
    expect(mockCall[0].resultItem.volumeNumber).toBe(1);
    expect(mockCall[0].resultItem.chapterNumber).toBe(1);
    expect(mockCall[0].resultItem.chapterTitleEn).toBe("SELF-SACRIFICE");
    expect(mockCall[0].resultItem.sectionNumber).toBe(1);
    expect(mockCall[0].resultItem.sectionTitleEn).toBe("The Virtue of Self-Sacrifice");
    expect(mockCall[0].resultItem.hadith_num).toBe(1); // or hadithNumberInChapter
  });

  test('clearing search query restores chapter view and hides search results', async () => {
    const searchInput = screen.getByPlaceholderText(/Search Hadith/i);
    fireEvent.change(searchInput, { target: { value: 'knowledge' } });

    await waitFor(() => {
      expect(screen.getAllByTestId(/search-result-/)).toHaveLength(2);
    });
    expect(screen.queryByText('Mizan al-Hikmah - Volume 1')).not.toBeInTheDocument();


    fireEvent.change(searchInput, { target: { value: '' } });
    await waitFor(() => {
      expect(screen.queryByTestId(/search-result-/)).not.toBeInTheDocument();
    });
    expect(screen.getByText('Mizan al-Hikmah - Volume 1')).toBeVisible();
    expect(screen.queryByText(/No hadiths found for your query/i)).not.toBeInTheDocument();
  });

});
