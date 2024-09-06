import { useContext, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { AuthContext } from '../App';
import {
  deleteTracksBatch,
  getLibrary,
  saveTracksBatch,
} from '../util/queries';

export function ReplaceShadowEntriesButton(props) {
  const {
    tokens,
    libraryTracks,
    setLibraryTracks,
    libraryGenerator,
    shadowEntries,
    status,
    statuses,
    setStatus,
  } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);

  const handleClose = () => setShowModal(false);
  const handleshow = () => setShowModal(true);

  const replaceSongs = async () => {
    const IDs = {
      shadowEntries: shadowEntries.identified.map((x) => x.track.id),
      marketCorrected: shadowEntries.marketCorrected.map((x) => x.id),
    };
    setStatus(statuses[3]);
    deleteTracksBatch(tokens.access_token, IDs.shadowEntries).then(() => {
      setStatus(statuses[2]);
      IDs.marketCorrected = IDs.marketCorrected.reverse();
      saveTracksBatch(tokens.access_token, IDs.marketCorrected).then(() => {
        const newLibrary = libraryTracks.filter((x) => {
          return !IDs.shadowEntries.includes(x.track.id);
        });
        setTimeout(() => {
          console.log(`new library length: ${newLibrary.length}`);
          setLibraryTracks(newLibrary);
          libraryGenerator.current = getLibrary(
            tokens.access_token,
            newLibrary.length
          );
          setStatus(statuses[0]);
        }, 2000);
      });
    });
  };

  return (
    <>
      <Button
        variant='spotify'
        onClick={handleshow}
        disabled={
          ![null, statuses[4]].includes(status) ||
          shadowEntries === null ||
          shadowEntries.identified.length === 0
        }
      >
        Replace Shadow Songs
      </Button>
      <Modal data-bs-theme='dark' className='text-light' show={showModal}>
        <Modal.Header closeButton>
          <Modal.Title>Warning</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <strong>
              Please download the JSON version of your current library before
              replacing songs in case you would like to undo the changes.
            </strong>{' '}
            While changes can be undone, the original "Date added" metadata will
            be lost.
          </p>
          <br />
          <p>
            If there are duplicate tracks or multiple versions of the same
            track, your library will have less songs than before as only 1
            version of a song will be added while the duplicates will be
            removed.
          </p>
          <br />
          <p>
            This may include (but is not limited to): remasters, re-releases,
            n-year anniversary editions, songs on compilations or multiple
            EPs/albums. This is not a steadfast rule, it just depends on how the
            tracks are linked and what versions are available in your
            market/region.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant='spotify'
            onClick={() => {
              replaceSongs();
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
