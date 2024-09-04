import { Fragment, useContext } from 'react';
import { Button, Card } from 'react-bootstrap';
import { AuthContext } from '../App';

async function redirectToAuthCodeFlow(clientId) {
  const verifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(verifier);

  sessionStorage.setItem('verifier', verifier);

  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('response_type', 'code');
  params.append('redirect_uri', 'http://localhost:3000');
  params.append(
    'scope',
    'user-read-private user-read-email user-library-read user-library-modify'
  );
  params.append('code_challenge_method', 'S256');
  params.append('code_challenge', challenge);

  document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
  let text = '';
  let possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function Landing() {
  const { clientId } = useContext(AuthContext);
  return (
    <Fragment>
      <Card
        className='h-25 w-25 position-absolute top-50 start-50 translate-middle border-spotify bg-body-secondary'
        data-bs-theme='dark'
      >
        <Card.Body>
          <div className='position-relative top-50 start-50 translate-middle'>
            <Card.Text>Authorization needed to proceed</Card.Text>
            <Button
              variant='spotify'
              onClick={async () => await redirectToAuthCodeFlow(clientId)}
            >
              Proceed to Authorization
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Fragment>
  );
}
