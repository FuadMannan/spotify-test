import { Button, Modal } from 'react-bootstrap';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { saveItemsBatch } from '../util/queries';
import { AuthContext } from '../App';
import { getLibrary } from '../util/queries';

export function AddSongsButton() {
  const {
    profile,
    tokens,
    libraryTracks,
    setLibraryTracks,
    libraryGenerator,
    status,
    setStatus,
    statuses,
  } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const [jsonData, setJsonData] = useState(null);
  const fileInputRef = useRef(null);

  const handleClose = () => setShowModal(false);
  const handleshow = () => setShowModal(true);

  useEffect(() => {
    if (jsonData) {
      setStatus(statuses[3]);
      const IDs = jsonData.map((item) => item.track.id).reverse();
      saveItemsBatch(tokens.access_token, IDs)
        .then(() => {
          setJsonData(null);
          libraryGenerator.current = getLibrary(
            tokens.access_token,
            libraryTracks.length
          );
          setLibraryTracks([...libraryTracks]);
          setTimeout(() => {
            setStatus(statuses[0]);
          }, 3000);
        })
        .catch((error) => console.log(error));
    }
  }, [
    jsonData,
    tokens,
    libraryTracks,
    setLibraryTracks,
    libraryGenerator,
    profile,
  ]);

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
      <Button
        variant='spotify'
        onClick={handleshow}
        disabled={jsonData || ![null, statuses[6]].includes(status)}
      >
        {jsonData ? 'Adding songs..' : 'Add songs'}
      </Button>
      <input
        type='file'
        accept='.json'
        ref={fileInputRef}
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      <Modal data-bs-theme='dark' className='text-light' show={showModal}>
        <Modal.Header closeButton>
          <Modal.Title>Warning</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Tracks being saved will not be added in the exact order found in the
          upload file. This is due to how Spotify handles requests and cannot be
          avoided. If you would like songs added in order, you may have to do so
          manually. Sorry for the inconvenience.
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant='spotify'
            onClick={() => {
              handleClick();
              handleClose();
            }}
          >
            Proceed
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
