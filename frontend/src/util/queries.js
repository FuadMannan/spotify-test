const API = 'https://api.spotify.com/v1';
const SAVED_TRACKS = `${API}/me/tracks`;

async function fetchSongsBatch(token, market, offset) {
  let done = false;
  let response;
  while (!done) {
    response = await fetch(
      `${SAVED_TRACKS}?market=${market}&limit=50&offset=${offset}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
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

export async function* libraryGenerator(token, market) {
  let { total, items: songBatch } = await fetchSongsBatch(token, market, 0);
  let songs = [songBatch, total];
  yield songs;
  const miniBatches = Math.ceil(total / 1000);
  for (let i = 0; i < miniBatches; i++) {
    const remaining = total - songs.length;
    const batch = remaining > 1000 ? 20 : Math.ceil(remaining / 50);
    const promises = [];
    for (let j = 0; j < batch; j++) {
      const offset = i * 1000 + j * 50;
      if (offset === 0) continue;
      promises.push(fetchSongsBatch(token, market, offset));
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
