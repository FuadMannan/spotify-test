import { Button, Modal } from 'react-bootstrap';
import { useContext, useState } from 'react';
import { deleteTracksBatch, getLibrary } from '../util/queries';
import { AuthContext } from '../App';

export function DeleteSongsButton() {
  const {
    tokens,
    libraryTracks,
    setLibraryTracks,
    libraryGenerator,
    status,
    setStatus,
    statuses,
    setShadowEntries,
    setShadowEntriesTotal,
  } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);

  const handleClose = () => setShowModal(false);
  const handleshow = () => setShowModal(true);
  const handleClick = () => {
    setStatus(statuses[3]);
    const IDs = libraryTracks.map((item) => item.track.id);
    deleteTracksBatch(tokens.access_token, IDs)
      .then(() => {
        libraryGenerator.current = getLibrary(tokens.access_token);
        setLibraryTracks([]);
        setShadowEntries({ identified: [], marketCorrected: [] });
        setShadowEntriesTotal(0);
        setTimeout(() => {
          setStatus(statuses[0]);
        }, 3000);
      })
      .catch((error) => console.log(error));
  };

  return (
    <>
      <Button
        variant='danger'
        onClick={handleshow}
        disabled={
          libraryTracks === null ||
          libraryTracks.length === 0 ||
          ![null, statuses[4]].includes(status)
        }
      >
        Delete ALL Songs
      </Button>
      <Modal
        data-bs-theme={'dark'}
        className='text-light'
        show={showModal}
        onHide={handleClose}
      >
        <Modal.Header closeButton>
          <Modal.Title>Warning</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          This action is irreversible. Please ensure you download a JSON file of
          your library before proceeding.
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={handleClose}>
            Close
          </Button>
          <Button
            variant='danger'
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
