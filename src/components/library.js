import { Navbar } from './navbar';
import { Table, Pagination } from 'react-bootstrap';
import { AuthContext } from '../App';
import { useContext, useEffect, useState } from 'react';

function convertMilliseconds(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function Library() {
  const { library, libraryTotal } = useContext(AuthContext);

  const [page, setPage] = useState(1);
  const [songsOnPage, setSongsOnPage] = useState(null);

  const getSongSelection = () =>{
    if (library.length > 0) {
      const start = (page - 1) * BATCH_SIZE;
      const end = page * BATCH_SIZE;
      const songs = library.slice(start, end);
      setSongsOnPage(songs);
    }
  }

  const BATCH_SIZE = 50;

  useEffect(getSongSelection, [page, library]);

  return (
    <>
      <Navbar />
      <h1>Library</h1>
      <div
        className="d-flex flex-column align-items-center justify-content-center p-5"
        style={{ height: '90vh' }}
      >
        <div id='tableContainer' style={{ overflowY: 'auto', width: '100%' }}>
          <Table striped bordered hover style={{ marginBottom: '0px' }}>
            <thead>
              <tr>
                <th>#</th>
                <th style={{ width: '25vw' }}>Title</th>
                <th style={{ width: '20vw' }}>Artist</th>
                <th style={{ width: '20vw' }}>Album</th>
                <th style={{ width: '15vw' }}>Date added</th>
                <th>Length</th>
              </tr>
            </thead>
            <tbody>
              {songsOnPage ? (
                songsOnPage.map((song, i) => (
                  <tr>
                    <td>{(page - 1) * BATCH_SIZE + i + 1}</td>
                    <td>{song.track.name}</td>
                    <td>
                      {song.track.artists
                        .map((artist) => artist.name)
                        .toString()
                        .replaceAll(',', ', ')}
                    </td>
                    <td>{song.track.album.name}</td>
                    <td>{song.added_at}</td>
                    <td>{convertMilliseconds(song.track.duration_ms)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </>
  );
}
