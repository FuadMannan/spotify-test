const API = 'https://api.spotify.com/v1';
const TRACKS = `${API}/tracks`;
const SAVED_TRACKS = `${API}/me/tracks`;

const header = (token) => {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

async function rateCall(url, body) {
  let done = false;
  let response;
  while (!done) {
    response = await fetch(url, body);
    if ([429, 500].includes(response.status)) {
      const retryAfter = response.headers.get('Retry-After');
      const retryAfterMs = (retryAfter ? parseInt(retryAfter) : 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
    } else if (response.ok) {
      done = true;
    } else {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  }
  const data = await response.json();
  return data;
}

async function fetchSavedSongsBatch(token, market, offset) {
  const URL = `${SAVED_TRACKS}?market=${market}&limit=50&offset=${offset}`;
  return await rateCall(URL, header(token));
}

export async function* libraryGenerator(token, market) {
  let { total, items: songBatch } = await fetchSavedSongsBatch(
    token,
    market,
    0
  );
  let songs = [songBatch, total];
  yield songs;
  let remaining = total - songBatch.length
  const miniBatches = Math.ceil(total / 1000);
  for (let i = 0; i < miniBatches; i++) {
    if (i > 0) remaining -= songs.length;
    const batch = remaining > 1000 ? 20 : Math.ceil(remaining / 50);
    const promises = [];
    for (let j = 0; j < batch; j++) {
      const offset = i * 1000 + j * 50;
      if (offset === 0) continue;
      promises.push(fetchSavedSongsBatch(token, market, offset));
    }
    try {
      const results = await Promise.all(promises);
      songBatch = results.map((x) => x.items).flat();
      songs = [...songBatch];
      yield songs;
    } catch (error) {
      console.error('Error fetching songs:', error);
      return [];
    }
  }
}
