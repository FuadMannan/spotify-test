import { Button } from 'react-bootstrap';
import React, { useContext } from 'react';
import { deleteTracksBatch, getLibrary } from '../util/queries';
import { AuthContext } from '../App';

export function DeleteSongsButton() {
  const { profile, tokens, library, setLibrary, libraryGenerator } =
    useContext(AuthContext);

  const handleClick = () => {
    const IDs = library.map((item) => item.track.id);
    deleteTracksBatch(tokens.access_token, IDs)
      .then(() => {
        libraryGenerator.current = getLibrary(
          tokens.access_token,
          profile.country
        );
        setLibrary([]);
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
