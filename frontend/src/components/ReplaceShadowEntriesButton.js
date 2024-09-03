import { useContext } from 'react';
import { Button } from 'react-bootstrap';
import { AuthContext } from '../App';
import {
  deleteTracksBatch,
  getLibrary,
  saveTracksBatch,
} from '../util/queries';

export function ReplaceShadowEntriesButton(props) {
  const {
    tokens,
    library,
    setLibrary,
    libraryGenerator,
    shadowEntries,
    status,
    statuses,
    setStatus,
  } = useContext(AuthContext);

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
        const newLibrary = library.filter((x) => {
          return !IDs.shadowEntries.includes(x.track.id);
        });
        setTimeout(() => {
          setLibrary(newLibrary);
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
    <Button
      variant='spotify'
      onClick={replaceSongs}
      disabled={
        ![null, statuses[4]].includes(status) ||
        shadowEntries === null ||
        shadowEntries.identified.length === 0
      }
    >
      Replace Shadow Songs
    </Button>
  );
}
