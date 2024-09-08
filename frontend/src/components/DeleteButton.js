import { Button, Dropdown, Modal } from 'react-bootstrap';
import { useContext, useState } from 'react';
import { deleteItemsBatch } from '../util/queries';
import { AuthContext } from '../App';

export function DeleteButton() {
  const {
    tokens,
    libraryTracks,
    setLibraryTracks,
    libraryAlbums,
    setLibraryAlbums,
    status,
    setStatus,
    statuses,
    skipStatus,
    setShadowEntries,
    setShadowEntriesTotal,
  } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const [itemType, setItemType] = useState(null);

  const handleClose = () => {
    setItemType(null);
    setShowModal(false);
  };
  const handleshow = () => setShowModal(true);
  const handleClick = () => {
    setStatus(itemType === 'tracks' ? statuses[4] : statuses[5]);
    const IDs =
      itemType === 'tracks'
        ? libraryTracks.map((item) => item.track.id)
        : libraryAlbums.map((item) => item.album.id);
    deleteItemsBatch(tokens.access_token, IDs, itemType)
      .then(() => {
        let nextStatus;
        if (itemType === 'tracks') {
          setLibraryTracks([]);
          setShadowEntries({ identified: [], marketCorrected: [] });
          setShadowEntriesTotal(0);
          nextStatus = 0;
        } else {
          setLibraryAlbums([]);
          nextStatus = 1;
        }
        setItemType(null);
        skipStatus.current = true;
        setTimeout(() => {
          setStatus(statuses[nextStatus]);
        }, 3000);
      })
      .catch((error) => console.log(error));
  };

  return (
    <>
      <Dropdown data-bs-theme='dark'>
        <Dropdown.Toggle
          variant='danger'
          disabled={![null, statuses[6]].includes(status)}
        >
          Delete
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item
            onClick={() => {
              setItemType('tracks');
              handleshow();
            }}
          >
            Tracks
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => {
              setItemType('albums');
              handleshow();
            }}
          >
            Albums
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
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
