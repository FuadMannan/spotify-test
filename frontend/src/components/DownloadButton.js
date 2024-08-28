import { useContext } from 'react';
import { Button } from 'react-bootstrap';
import { AuthContext } from '../App';

export function DownloadButton(props) {
  const { library, libraryTotal, shadowEntries } = useContext(AuthContext);
  const endpoint = 'http://localhost:8000/download-library';

  const extractLibrary = (item) => {
    const { added_at } = item;
    const track = { id: item.track.id, name: item.track.name };
    const artists = item.track.artists.map((artist) => {
      return { id: artist.id, name: artist.name };
    });
    const album = {
      id: item.track.album.id,
      name: item.track.album.name,
      artists: item.track.album.artists.map((artist) => {
        return { id: artist.id, name: artist.name };
      }),
    };
    return { track, artists, album, added_at };
  };

  const handleDownload = () => {
    const data =
      props.mode === 'library'
        ? library.map(extractLibrary)
        : shadowEntries.map(extractLibrary);
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.ok) {
          return response.blob();
        }
        throw new Error('Network response was not ok.');
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'library.json'; // Specify the file name
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error('Error downloading the file:', error);
      });
  };

  return (
    <Button
      variant='spotify'
      onClick={handleDownload}
      disabled={library.length !== libraryTotal}
    >
      {props.mode === 'library'
        ? 'Download Library as JSON'
        : 'Download Shadow Entries as JSON'}
    </Button>
  );
}
