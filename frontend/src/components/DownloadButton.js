import { useContext } from 'react';
import { Button } from 'react-bootstrap';
import { AuthContext } from '../App';

export function DownloadButton(props) {
  const { libraryTracks, totalTracks, shadowEntries, status, statuses } =
    useContext(AuthContext);
  const endpoint = 'http://localhost:8000/download-library';

  const handleDownload = () => {
    const data = props.mode === 'library' ? libraryTracks : shadowEntries;
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
      disabled={
        libraryTracks.length !== totalTracks ||
        ![null, statuses[4]].includes(status)
      }
    >
      Download as JSON
    </Button>
  );
}
