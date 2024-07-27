const API = 'https://api.spotify.com/v1';
const SAVED_TRACKS = `${API}/me/tracks`;

async function getSavedTracks({
  token = null,
  market = null,
  next = null,
  offset = 0,
  limit = 50
}) {
  const URL = next != null
    ? next
    : `${SAVED_TRACKS}?market=${market}&limit=${limit}&offset=${offset}`;
  const payload = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  try {
    const response = await fetch(URL, payload);
    const data = await response.json();
    return data;
  } catch (error) {
    console.log(error);
  }
}

export async function* libraryGenerator(token, market) {
  let results = await getSavedTracks({token, market});
  yield [results.items, results.total];
  let next = results.next;
  next = next.replace(/locale.+&/, '');
  while (next) {
    try {
      results = await getSavedTracks({token, next});
      yield results.items;
      next = results.next?.replace(/locale.+&/, '');
    } catch (error) {
      console.log(error);
    }
  }
}
