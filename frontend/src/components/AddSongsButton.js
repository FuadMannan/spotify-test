import { Button } from 'react-bootstrap';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { saveTracksBatch } from '../util/queries';
import { AuthContext } from '../App';
import { getLibrary } from '../util/queries';

export function AddSongsButton() {
  const {
    profile,
    tokens,
    library,
    setLibrary,
    libraryGenerator,
    setStatus,
    statuses,
  } = useContext(AuthContext);
  const [jsonData, setJsonData] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (jsonData) {
      setStatus(statuses[2]);
      const IDs = jsonData.map((item) => item.track.id).reverse();
      saveTracksBatch(tokens.access_token, IDs)
        .then(() => {
          setJsonData(null);
          libraryGenerator.current = getLibrary(
            tokens.access_token,
            profile.country,
            library.length
          );
          setLibrary([...library]);
          setStatus(statuses[0]);
        })
        .catch((error) => console.log(error));
    }
  }, [jsonData, tokens, library, setLibrary, libraryGenerator, profile]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const parsedData = JSON.parse(e.target.result);
        setJsonData(parsedData);
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    };

    if (file) {
      reader.readAsText(file);
    }
  };

  const handleClick = () => fileInputRef?.current.click();

  return (
    <>
      <Button variant='spotify' onClick={handleClick} disabled={jsonData}>
        {jsonData ? 'Adding songs..' : 'Add songs'}
      </Button>
      <input
        type='file'
        accept='.json'
        ref={fileInputRef}
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
    </>
  );
}
