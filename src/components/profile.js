import { Fragment, useEffect, useContext } from 'react';
import { Card, Spinner } from 'react-bootstrap';
import { AuthContext } from '../App';

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
  const { clientId, code, profile, setProfile, tokens, setTokens } =
    useContext(AuthContext);

  useEffect(() => {
    const initTokens = async () => {
      if (!tokens) {
        const result = await fetchInitialTokens(clientId, code);
        if (!Object.values(result).includes(undefined)) {
          setTokens(result);
          sessionStorage.setItem('spotifyTokens', JSON.stringify(result));
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
          <Card data-bs-theme="dark">
            <Card.Body>
              <Spinner animation="border"></Spinner>
              <Card.Text>Loading profile</Card.Text>
            </Card.Body>
          </Card>
        </Fragment>
      ) : (
        <div>
          <h1>Display your Spotify profile data</h1>
          <section id="profile" className='position-absolute top-50 start-50 translate-middle'>
            <h2>
              Logged in as{' '}
              <span id="displayName">
                {profile && profile.display_name ? profile.display_name : ''}
              </span>
            </h2>
            <span id="avatar">
              <img
                width={profile.images[0].width}
                height={profile.images[0].height}
                src={profile.images[0].url}
                alt="User avatar"
              />
            </span>
            <div>
            <ul style={{textAlign: 'initial'}}>
              <li>
                User ID: <span id="id">{profile.id ? profile.id : ''}</span>
              </li>
              <li>
                Profile Image: <span id="imgUrl">{profile.images[0].url}</span>
              </li>
            </ul>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
