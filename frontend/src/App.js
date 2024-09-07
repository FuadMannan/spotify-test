import { useState, createContext, useEffect, useRef } from 'react';
import './App.css';
import './custom.scss';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Profile } from './components/Profile';
import { Library } from './components/Library';
import { Header } from './components/Header';
import { AuthGuard } from './components/AuthGuard';
import { getLibrary } from './util/queries';

export const AuthContext = createContext();

function getSession(key) {
  return JSON.parse(sessionStorage.getItem(key));
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
  const isAuthenticated = getSession('spotifyAuthorized') !== false;
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
  const [libraryTracks, setLibraryTracks] = useState([]);
  const [libraryAlbums, setLibraryAlbums] = useState([]);
  const libraryGenerator = useRef(null);
  const [totalTracks, setTotalTracks] = useState(-1);
  const [totalAlbums, setTotalAlbums] = useState(-1);
  const [shadowEntries, setShadowEntries] = useState(null);
  const [shadowEntriesTotal, setShadowEntriesTotal] = useState(-1);
  const [status, setStatus] = useState(null);
  const statuses = [
    'Loading Tracks',
    'Loading Albums',
    'Finding Shadow Tracks',
    'Adding Tracks',
    'Deleting Tracks',
    'Deleting Albums',
    'Completed',
  ];

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
      if (status && statuses.indexOf(status) <= 1) {
        let setState, setTotalState;
        if (status === statuses[0]) {
          libraryGenerator.current = getLibrary(tokens.access_token, 'tracks');
          [setState, setTotalState] = [setLibraryTracks, setTotalTracks];
        } else {
          libraryGenerator.current = getLibrary(tokens.access_token, 'albums');
          [setState, setTotalState] = [setLibraryAlbums, setTotalAlbums];
        }
        let done = false;
        try {
          while (!done) {
            const itemsBatch = await libraryGenerator.current.next();
            if (!itemsBatch.done) {
              if (!Array.isArray(itemsBatch.value)) {
                setTotalState(itemsBatch.value.total);
                itemsBatch.value = itemsBatch.value.songs;
              }
              if (itemsBatch.value) {
                setState((current) => [...current, ...itemsBatch.value]);
              } else if (!itemsBatch.value) {
                throw new Error('Something went wrong');
              }
            } else {
              done = true;
              setTimeout(() => {
                if (status === statuses[0]) {
                  setStatus(statuses[1]);
                } else if (libraryTracks.length === 0) {
                  setStatus(statuses[6]);
                } else {
                  setStatus(statuses[2]);
                }
              }, 1000);
            }
          }
        } catch (error) {
          console.log('Caught error:', error);
        }
      }
    };
    getSongsBatch();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const context = {
    clientId,
    code,
    profile,
    setProfile,
    tokens,
    setTokens,
    libraryTracks,
    setLibraryTracks,
    libraryAlbums,
    setLibraryAlbums,
    libraryGenerator,
    totalTracks,
    totalAlbums,
    shadowEntries,
    setShadowEntries,
    shadowEntriesTotal,
    setShadowEntriesTotal,
    status,
    setStatus,
    statuses,
  };
  return (
    <div className='App bg-dark text-bg-dark'>
      <AuthContext.Provider value={context}>
        <BrowserRouter>
          <Header />
          <Routes>
            <Route
              path='/'
              element={
                <AuthGuard isAuthenticated={isAuthenticated}>
                  <Profile />
                </AuthGuard>
              }
            />
            <Route
              path='/library'
              element={
                <AuthGuard isAuthenticated={isAuthenticated}>
                  <Library />
                </AuthGuard>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthContext.Provider>
    </div>
  );
}

export default App;
