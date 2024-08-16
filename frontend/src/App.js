import { useState, createContext, useEffect, useRef } from 'react';
import './App.css';
import { Landing } from './components/Landing';

export const AuthContext = createContext();

function getSession(key) {
  if (Object.keys(sessionStorage).includes(key))
    return JSON.parse(sessionStorage.getItem(key));
  return false;
}

async function refreshTokens(clientId) {
  const { refresh_token: current_refresh_token } = JSON.parse(
    sessionStorage.spotifyTokens
  );
  const url = 'https://accounts.spotify.com/api/token';
  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: current_refresh_token,
      client_id: clientId,
    }),
  };
  const body = await fetch(url, payload);
  const { access_token, refresh_token, expires_in } = await body.json();
  const expires_at = Date.now() + expires_in * 1000;
  const tokens = { access_token, refresh_token, expires_at };
  sessionStorage.setItem('spotifyTokens', JSON.stringify(tokens));
  return tokens;
}

function App() {
  const clientId = 'REPLACE WITH CLIENT ID';
  const code = new URLSearchParams(window.location.search).get('code');
  sessionStorage.setItem(
    'spotifyAuthorized',
    code != null || sessionStorage.spotifyAuthorized === 'true'
  );
  const permissionGranted = getSession('spotifyAuthorized');
  const [profile, setProfile] = useState(
    getSession('spotifyProfile') || {
      id: '',
      display_name: '',
      images: [{ width: 0, height: 0, url: '' }],
    }
  );
  const [tokens, setTokens] = useState(
    sessionStorage.spotifyTokens ? sessionStorage.spotifyTokens : null
  );
  const [library, setLibrary] = useState(null);
  const librarySongGenerator = useRef(null);
  const libraryTotal = useRef(-1);
  const [shadowEntries, setShadowEntries] = useState(null);
  const shadowEntriesTotal = useRef(0);

  useEffect(() => {
    if (tokens) {
      const time = tokens.expires_at - Date.now() - 5000;
      setTimeout(() => {
        refreshTokens(clientId).then((result) => setTokens(result));
      }, time);
    }
  }, [tokens]);

  useEffect(() => {
    const getSongsBatch = async () => {
      if (librarySongGenerator.current && library) {
        try {
          const songsBatch = await librarySongGenerator.current.next();
          if (!songsBatch.done && !Array.isArray(songsBatch.value)) {
            libraryTotal.current = songsBatch.value.total;
            songsBatch.value = songsBatch.value.songs;
          }
          if (!songsBatch.done && songsBatch.value) {
            setLibrary((current) => [...current, ...songsBatch.value]);
          } else if (!songsBatch.done && !songsBatch.value) {
            throw new Error('Something went wrong');
          }
        } catch (error) {
          console.log('Caught error:', error);
        }
      }
    };
    getSongsBatch();
  }, [library]);

  const context = {
    clientId,
    code,
    profile,
    setProfile,
    tokens,
    setTokens,
    permissionGranted,
    library,
    setLibrary,
    librarySongGenerator,
    libraryTotal,
    shadowEntries,
    setShadowEntries,
    shadowEntriesTotal,
  };
  return (
    <div className='App'>
      <header className='App-header'>
        <h1>Spotify Test</h1>
      </header>
      <AuthContext.Provider value={context}>
        <Landing />
      </AuthContext.Provider>
    </div>
  );
}

export default App;
