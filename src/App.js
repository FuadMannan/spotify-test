import { useState, createContext } from 'react';
import './App.css';
import { Landing } from './components/auth';

export const AuthContext = createContext();

function getSession(key) {
  if (Object.keys(sessionStorage).includes(key))
    return JSON.parse(sessionStorage.getItem(key));
  return false;
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
  const context = {
    clientId,
    code,
    profile,
    setProfile,
    tokens,
    setTokens,
    permissionGranted,
  };
  return (
    <div className="App">
      <header className="App-header">
        <h1>Spotify Test</h1>
      </header>
      <AuthContext.Provider value={context}>
        <Landing />
      </AuthContext.Provider>
    </div>
  );
}

export default App;
