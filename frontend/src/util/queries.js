const API = 'https://api.spotify.com/v1';
const TRACKS = `${API}/tracks`;
const SAVED_TRACKS = `${API}/me/tracks`;
const SAVED_ALBUMS = `${API}/me/albums`;

const header = (token, requestMethod = 'GET') => {
  return {
    method: requestMethod,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

async function rateCall(url, body) {
  let response;
  for (let i = 0; i <= 20; i++) {
    if (i === 20) {
      console.error('Issue fetching URL:', url);
      return {};
    }
    response = await fetch(url, body);
    if ([429, 500, 502, 504].includes(response.status)) {
      const retryAfter = response.headers.get('Retry-After');
      const retryAfterMs = (retryAfter ? parseInt(retryAfter) : 1 + i) * 1000;
      await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
    } else if (response.ok) {
      break;
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

function getEndpoint(itemType) {
  let endpoint;
  if (itemType === 'tracks') {
    endpoint = SAVED_TRACKS;
  } else if (itemType === 'albums') {
    endpoint = SAVED_ALBUMS;
  }
  return endpoint;
}

async function getSavedItems(token, itemType, offset) {
  let endpoint;
  if (itemType === 'tracks') {
    endpoint = SAVED_TRACKS;
  } else if (itemType === 'albums') {
    endpoint = SAVED_ALBUMS;
  }
  const URL = `${endpoint}?limit=50&offset=${offset}`;
  return await rateCall(URL, header(token));
}

async function getItemsInfoWithMarket(token, ids, market = null) {
  const URL = `${TRACKS}?${market ? `market=${market}&` : ''}ids=${ids.join(
    ','
  )}`;
  return await rateCall(URL, header(token));
}

async function updateTracks(token, ids, method) {
  const URL = `${SAVED_TRACKS}?ids=${ids.join(',')}`;
  return await rateCall(URL, header(token, method));
}

async function saveTracks(token, ids) {
  return await updateTracks(token, ids, 'PUT');
}

async function deleteTracks(token, ids) {
  return await updateTracks(token, ids, 'DELETE');
}

export async function* getLibrary(
  token,
  itemType = 'tracks',
  initialOffset = 0
) {
  let { total, items } = await getSavedItems(token, itemType, initialOffset);
  yield { songs: items, total };
  let remaining = total - items.length - initialOffset;
  const batches = Math.ceil(remaining / 1000);
  for (let i = 0; i < batches; i++) {
    const miniBatch = remaining > 1000 ? 20 : Math.ceil(remaining / 50);
    const promises = [];
    for (let j = 1; j <= miniBatch; j++) {
      const batchOffset = i * 1000 + j * 50;
      promises.push(
        getSavedItems(token, itemType, initialOffset + batchOffset)
      );
    }
    try {
      const results = await Promise.all(promises);
      items = results.map((x) => x.items).flat();
      remaining -= items.length;
      yield [...items];
    } catch (error) {
      console.error('Error fetching songs:', error);
      return [];
    }
  }
}

export async function getShadowEntries(token, market, library) {
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
      promises.push(getItemsInfoWithMarket(token, trackIDs, market));
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
  const results = { identified: [], marketCorrected: [] };
  for (let i = 0; i < library.length; i++) {
    if (
      library[i].track.album.id !== searchResults[i].album.id ||
      library[i].track.id !== searchResults[i].id
    ) {
      results.identified.push(library[i]);
      results.marketCorrected.push(searchResults[i]);
    }
  }
  return results;
}

export async function saveTracksBatch(token, trackIDs) {
  const batches = Math.ceil(trackIDs.length / 50);
  const results = [];
  for (let i = 0; i < batches; i++) {
    const batchIDs = trackIDs.slice(
      i * 50,
      Math.min((i + 1) * 50, trackIDs.length)
    );
    results.push(await saveTracks(token, batchIDs));
  }
  return results;
}

export async function deleteTracksBatch(token, trackIDs) {
  const batches = Math.ceil(trackIDs.length / 50);
  const promises = [];
  const results = [];
  for (let i = 0; i < batches; i++) {
    const batchIDs = trackIDs.slice(
      i * 50,
      Math.min((i + 1) * 50, trackIDs.length)
    );
    promises.push(deleteTracks(token, batchIDs));
    results.push(await Promise.all(promises));
    promises.pop();
  }
  return results;
}
