const API = 'https://api.spotify.com/v1';
const TRACKS = `${API}/tracks`;
const SAVED_TRACKS = `${API}/me/tracks`;

const header = (token, requestMethod = 'GET') => {
  return {
    method: requestMethod,
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
  const contentLength = response.headers.get('Content-Length');
  if (contentLength && parseInt(contentLength) > 0) {
    const data = await response.json();
    return data;
  } else {
    return {};
  }
}

async function fetchSavedSongsBatch(token, market, offset) {
  const URL = `${SAVED_TRACKS}?market=${market}&limit=50&offset=${offset}`;
  return await rateCall(URL, header(token));
}

async function fetchSongsBatch(token, market, ids) {
  const URL = `${TRACKS}?market=${market}&ids=${ids.join(',')}`;
  return await rateCall(URL, header(token));
}

async function saveSongsBatch(token, ids) {
  const URL = `${SAVED_TRACKS}?ids=${ids.join(',')}`;
  return await rateCall(URL, header(token, 'PUT'));
}

export async function* libraryGenerator(token, market) {
  let { total, items } = await fetchSavedSongsBatch(token, market, 0);
  yield { songs: items, total };
  let remaining = total - items.length;
  const batches = Math.ceil(total / 1000);
  for (let i = 0; i < batches; i++) {
    if (i > 0) remaining -= items.length;
    const miniBatch = remaining > 1000 ? 20 : Math.ceil(remaining / 50);
    const promises = [];
    for (let j = 0; j < miniBatch; j++) {
      const offset = i * 1000 + j * 50;
      if (offset === 0) continue;
      promises.push(fetchSavedSongsBatch(token, market, offset));
    }
    try {
      const results = await Promise.all(promises);
      items = results.map((x) => x.items).flat();
      yield [...items];
    } catch (error) {
      console.error('Error fetching songs:', error);
      return [];
    }
  }
}

export async function findShadowEntries(token, market, library) {
  const batches = Math.ceil(library.length / 1000);
  let searchResults = [];
  let remaining = library.length;
  for (let i = 0; i < batches; i++) {
    const batch = remaining > 1000 ? 20 : Math.ceil(remaining / 50);
    const promises = [];
    for (let j = 0; j < batch; j++) {
      const start = i * 1000 + j * 50;
      const end = start + 50;
      const trackIDs = library.slice(start, end).map((item) => item.track.id);
      promises.push(fetchSongsBatch(token, market, trackIDs));
    }
    try {
      const results = await Promise.all(promises);
      let tracks = results.map((x) => x.tracks).flat();
      searchResults.push(...tracks);
      remaining -= tracks.length;
    } catch (error) {
      console.error('Error fetching songs:', error);
      return [];
    }
  }
  const shadowEntries = library.filter((item, i) => {
    return item.track.album.id !== searchResults[i].album.id;
  });
  return shadowEntries;
}

export async function addSongs(token, trackIDs) {
  const batches = Math.ceil(trackIDs.length / 50);
  const promises = [];
  for (let i = 0; i < batches; i++) {
    const batchIDs = trackIDs.slice(
      i * 50,
      Math.min((i + 1) * 50, trackIDs.length)
    );
    promises.push(saveSongsBatch(token, batchIDs));
  }
  const results = await Promise.all(promises);
  return results;
}
