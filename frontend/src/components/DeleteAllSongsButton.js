import { Button } from 'react-bootstrap';
import React, { useContext } from 'react';
import { deleteTracksBatch, getLibrary } from '../util/queries';
import { AuthContext } from '../App';

export function DeleteSongsButton() {
  const {
    profile,
    tokens,
    library,
    setLibrary,
    libraryGenerator,
    setStatus,
    statuses,
  } = useContext(AuthContext);

  const handleClick = () => {
    setStatus(statuses[3]);
    const IDs = library.map((item) => item.track.id);
    deleteTracksBatch(tokens.access_token, IDs)
      .then(() => {
        libraryGenerator.current = getLibrary(
          tokens.access_token,
          profile.country
        );
        setLibrary([]);
        setStatus(statuses[0]);
      })
      .catch((error) => console.log(error));
  };

  return (
    <>
      <Button
        variant='danger'
        onClick={handleClick}
        disabled={library === null || library.length === 0}
      >
        Delete ALL Songs
      </Button>
    </>
  );
}
