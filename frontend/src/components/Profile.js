import { Fragment, useEffect, useContext } from 'react';
import { Card, Spinner } from 'react-bootstrap';
import { AuthContext } from '../App';
import { getLibrary } from '../util/queries';

function accessTokenQuery(clientId, code) {
  const verifier = sessionStorage.getItem('verifier');

  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', 'http://localhost:3000');
  params.append('code_verifier', verifier);
  const query = {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  };
  return query;
}

async function fetchInitialTokens(clientId, code) {
  const query = accessTokenQuery(clientId, code);

  const result = await fetch('https://accounts.spotify.com/api/token', query);

  const { access_token, refresh_token, expires_in } = await result.json();
  const expires_at = Date.now() + expires_in * 1000;
  return { access_token, refresh_token, expires_at };
}

function profileQuery(token) {
  return {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  };
}

async function fetchProfile(token) {
  const result = await fetch(
    'https://api.spotify.com/v1/me',
    profileQuery(token)
  );

  return await result.json();
}

export function Profile() {
  const {
    clientId,
    code,
    profile,
    setProfile,
    tokens,
    setTokens,
    setLibraryTracks,
    setShadowEntries,
    libraryGenerator,
    setStatus,
    statuses,
  } = useContext(AuthContext);

  useEffect(() => {
    const initTokens = async () => {
      if (!tokens) {
        const result = await fetchInitialTokens(clientId, code);
        if (!Object.values(result).includes(undefined)) {
          setTokens(result);
          sessionStorage.setItem('spotifyTokens', JSON.stringify(result));
          window.history.replaceState(null, '', '/');
        }
      }
    };
    initTokens();
  }, []);

  useEffect(() => {
    const getProfile = async () => {
      if (tokens && profile.id === '') {
        const result = await fetchProfile(tokens.access_token);
        if (result.images) result.images.sort((a, b) => b.height - a.height);
        if (profile.id === '' && !Object.keys(result).includes('error')) {
          setProfile(result);
          sessionStorage.setItem('spotifyProfile', JSON.stringify(result));
          libraryGenerator.current = getLibrary(tokens.access_token);
          setShadowEntries({ identified: [], marketCorrected: [] });
          setTimeout(() => {
            setStatus(statuses[0]);
          }, 1000);
        }
      }
    };
    getProfile();
  }, [tokens]);

  return (
    <>
      {profile.id === '' ? (
        <Fragment>
          <p>Permission granted</p>
          <Card data-bs-theme='dark'>
            <Card.Body>
              <Spinner animation='border'></Spinner>
              <Card.Text>Loading profile</Card.Text>
            </Card.Body>
          </Card>
        </Fragment>
      ) : (
        <div>
          <h1>Profile Data</h1>
          <section
            id='profile'
            className='position-absolute top-50 start-50 translate-middle'
          >
            <h2>
              Logged in as
              <span id='displayName'>
                {profile && profile.display_name ? profile.display_name : ''}
              </span>
            </h2>
            <span id='avatar'>
              {profile.images[0] ? (
                <img
                  width={profile.images[0].width}
                  height={profile.images[0].height}
                  src={profile.images[0].url}
                  alt='User avatar'
                />
              ) : (
                <div className='blankProfileImage'>
                  <svg viewBox='0 0 24 24'>
                    <path d='M10.165 11.101a2.5 2.5 0 0 1-.67 3.766L5.5 17.173A2.998 2.998 0 0 0 4 19.771v.232h16.001v-.232a3 3 0 0 0-1.5-2.598l-3.995-2.306a2.5 2.5 0 0 1-.67-3.766l.521-.626.002-.002c.8-.955 1.303-1.987 1.375-3.19.041-.706-.088-1.433-.187-1.727a3.717 3.717 0 0 0-.768-1.334 3.767 3.767 0 0 0-5.557 0c-.34.37-.593.82-.768 1.334-.1.294-.228 1.021-.187 1.727.072 1.203.575 2.235 1.375 3.19l.002.002.521.626zm5.727.657-.52.624a.5.5 0 0 0 .134.753l3.995 2.306a5 5 0 0 1 2.5 4.33v2.232H2V19.77a5 5 0 0 1 2.5-4.33l3.995-2.306a.5.5 0 0 0 .134-.753l-.518-.622-.002-.002c-1-1.192-1.735-2.62-1.838-4.356-.056-.947.101-1.935.29-2.49A5.713 5.713 0 0 1 7.748 2.87a5.768 5.768 0 0 1 8.505 0 5.713 5.713 0 0 1 1.187 2.043c.189.554.346 1.542.29 2.489-.103 1.736-.838 3.163-1.837 4.355m-.001.001z'></path>
                  </svg>
                </div>
              )}
            </span>
            <div>
              <ul style={{ textAlign: 'initial' }}>
                <li>
                  User ID: <span id='id'>{profile.id ? profile.id : ''}</span>
                </li>
                {profile.images[0] && (
                  <li>
                    Profile Image:
                    <span id='imgUrl'>{profile.images[0].url}</span>
                  </li>
                )}
              </ul>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
