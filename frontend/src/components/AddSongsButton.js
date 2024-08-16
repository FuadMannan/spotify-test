import { Button } from 'react-bootstrap';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { addSongs } from '../util/queries';
import { AuthContext } from '../App';
import { libraryGenerator } from '../util/queries';

export function AddSongsButton() {
  const { profile, tokens, library, setLibrary, librarySongGenerator } =
    useContext(AuthContext);
  const [jsonData, setJsonData] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (jsonData) {
      const IDs = jsonData.map((item) => item.id);
      addSongs(tokens.access_token, IDs)
        .then(() => {
          setJsonData(null);
          librarySongGenerator.current = libraryGenerator(
            tokens.access_token,
            profile.country,
            library.length
          );
          setLibrary([...library]);
        })
        .catch((error) => console.log(error));
    }
  }, [jsonData, tokens, library, setLibrary, librarySongGenerator, profile]);

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
      <Button variant='success' onClick={handleClick} disabled={jsonData}>
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
