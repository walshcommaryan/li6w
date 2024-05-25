import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_KEY = "AIzaSyDtVVE3CdN4LuEQeXoR0lp2f8lQsawX7Ns";
const fromLang = 'en';

const initialContent = [
  'GOD created us to be with Him.',
  'OUR sins separate us from God.',
  'SINS cannot be removed by good deeds.',
  'PAYING the price for sin, Jesus died and rose again.',
  'EVERYONE who trusts in Him alone has eternal life.',
  'LIFE with Jesus starts now and lasts forever.',
];

const nextContent = [
  'Are you ready to put your faith in Jesus alone to forgive you of all your sins?',
  'If so, the Bible tells us that our heart and soul are transformed when we put our trust in Jesus. When we do, a new relationship begins with God. A prayer is one way for you to express your newfound faith in Jesus',
  'Prayer:',
  'Dear God, I know that my sins have broken my relationship with you and that nothing I could do could ever change that. But right now, I believe that Jesus died in my place and rose again from the dead. I trust in Him to forgive me for my sins. Through faith in Him, I am entering and eternal relationship with you. Thank you for this free gift! Amen.'
];

function App() {
  const [translations, setTranslations] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('th');
  const [audioContent, setAudioContent] = useState([]); 
  const [supportedLanguages, setSupportedLanguages] = useState([]);
  const [languageNames, setLanguageNames] = useState([]); // New state for language names
  const [menuCollapsed, setMenuCollapsed] = useState(true);
  const [currentPage, setCurrentPage] = useState('initial');

  const toggleMenu = () => {
    setMenuCollapsed(!menuCollapsed);
  };

  const fetchLanguageNames = async (targetLanguage) => {
    try {
      const response = await axios.post(
        `https://translation.googleapis.com/language/translate/v2/languages?key=${API_KEY}`,
        {
          target: targetLanguage,
        }
      );

      const languages = response.data.data.languages;
      const languageNames = languages.map(language => language.name);
      setLanguageNames(languageNames);
      return { languages, languageNames }; // Return both languages and languageNames
    } catch (error) {
      console.error("Error fetching language names:", error);
      return { languages: [], languageNames: [] }; // Return empty arrays in case of an error
    }
  };

  useEffect(() => {
    const fetchTranslationsAndAudio = async () => {
      const allContent = [...initialContent, ...nextContent];
      const translatedContent = await Promise.all(
        allContent.map(async line => {
          const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json"
            },
            body: JSON.stringify({
              q: line,
              source: fromLang,
              target: selectedLanguage,
            }),
          });
          const data = await response.json();
          return data.data.translations[0].translatedText;
        })
      );
  
      setTranslations(translatedContent);
  
      const audioResponses = await Promise.all(
        translatedContent.map(async (translatedText, index) => {
          try {
            const ttsResponse = await axios.post(
              `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`,
              {
                input: { text: translatedText },
                voice: { languageCode: selectedLanguage },
                audioConfig: { audioEncoding: 'MP3' }
              }
            );
            return ttsResponse.data.audioContent;
          } catch (error) {
            console.error(`TTS error for translation ${index}:`, error);
            return null; // You can set a placeholder or handle the error as needed
          }
        })
      );
  
      setAudioContent(audioResponses);

      // Check local storage for cached languages
      const cachedLanguages = localStorage.getItem('supportedLanguages');
      const cachedLanguageNames = localStorage.getItem('languageNames');

      if (cachedLanguages && cachedLanguageNames) {
        setSupportedLanguages(JSON.parse(cachedLanguages));
        setLanguageNames(JSON.parse(cachedLanguageNames));
      } else {
        // Fetch from API if not in local storage
        const { languages, languageNames } = await fetchLanguageNames('en');
        setSupportedLanguages(languages);
        setLanguageNames(languageNames);

        // Cache the results in local storage
        localStorage.setItem('supportedLanguages', JSON.stringify(languages));
        localStorage.setItem('languageNames', JSON.stringify(languageNames));
      }
    };

    fetchTranslationsAndAudio();
  }, [selectedLanguage]);

  const handleNextPage = () => {
    setCurrentPage('next');
  };

  const handleBackPage = () => {
    setCurrentPage('initial');
  };

  return (
    <div className="bg-gray-100 min-h-screen flex">
      <div className={`w-1/4 bg-white p-4 ${menuCollapsed ? 'hidden' : 'block'} transform ${menuCollapsed ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'} transition-all duration-300 ease-in-out`}>
        <h2 className="text-lg font-semibold py-4 w-auto">Select Language:</h2>
        <select
          className="py-2 px-4 rounded bg-gray-300 w-auto max-w-full"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
        >
          {supportedLanguages.map((language, index) => (
            <option key={index} value={language.language}>
              {languageNames[index]}
            </option>
          ))}
        </select>
      </div>
      <div className="bg-gray-100 p-6">
        <button
          className={`bg-gray-300 p-2 rounded-md text-sm mt-2 transform transition-transform ${menuCollapsed ? '' : 'rotate-180'}`}
          onClick={toggleMenu}
        >
          <span className="transform transition-transform rotate-180">
            {menuCollapsed ? '→' : '→'}
          </span>
        </button>
      </div>
      <div className="mx-auto">
        <div className="bg-gray-100 py-6 inline-block">
          <header className="text-left mb-10">
            <h1 className="text-3xl font-semibold">LI6W Acrostic Translation</h1>
          </header>
          <div className="bg-white inline-block p-2 md:p-4 rounded-lg shadow-md">
            {translations.length > 0 ? (
              currentPage === 'initial' ? (
                initialContent.map((line, index) => (
                  <div key={index} className="text-base md:text-lg my-2">
                    <div>{line}</div>
                    <div
                      className="text-sm md:text-base text-gray-600 mt-1"
                      dangerouslySetInnerHTML={{ __html: translations[index] }}
                    />
                    {audioContent[index] !== null && (
                      <div className="mt-1">
                        <button
                          className="cursor-pointer"
                          onClick={() => {
                            const audio = new Audio(
                              `data:audio/mp3;base64,${audioContent[index]}`
                            );
                            audio.play();
                          }}
                        >
                          <img
                            src={require('./icons/icons8-play-64.png')} 
                            alt="Play"
                            className="w-4 h-4 text-blue-500"
                          />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                nextContent.map((line, index) => (
                  <div key={index} className="text-base md:text-lg my-2">
                    <div>{line}</div>
                    <div
                      className="text-sm md:text-base text-gray-600 mt-1"
                      dangerouslySetInnerHTML={{ __html: translations[index + initialContent.length] }}
                    />
                    {audioContent[index + initialContent.length] !== null && (
                      <div className="mt-1">
                        <button
                          className="cursor-pointer"
                          onClick={() => {
                            const audio = new Audio(
                              `data:audio/mp3;base64,${audioContent[index+ initialContent.length]}`
                            );
                            audio.play();
                          }}
                        >
                          <img
                            src={require('./icons/icons8-play-64.png')}
                            alt="Play"
                            className="w-4 h-4 text-blue-500"
                          />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )
            ) : (
              <div>Loading translations...</div>
            )}
            {currentPage === 'initial' && translations.length > 0 && (
              <button className="text-blue-500" onClick={handleNextPage}>
                Next
              </button>
            )}
            {currentPage === 'next' && (
              <button className="text-blue-500" onClick={handleBackPage}>
                Back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
