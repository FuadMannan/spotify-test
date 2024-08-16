import { Navbar } from './Navbar';
import { Table, Pagination, Spinner, Button } from 'react-bootstrap';
import { AuthContext } from '../App';
import { useContext, useEffect, useLayoutEffect, useState } from 'react';
import { DownloadButton } from './DownloadButton';
import { AddSongsButton } from './AddSongsButton';
import { findShadowEntries } from '../util/queries';

function convertMilliseconds(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function Library() {
  const {
    library,
    libraryTotal,
    tokens,
    profile,
    shadowEntries,
    setShadowEntries,
    shadowEntriesTotal,
  } = useContext(AuthContext);
  const [page, setPage] = useState(1);
  const [pageRange, setPageRange] = useState([]);
  const [songsOnPage, setSongsOnPage] = useState(null);
  const [totalPaginationItems, setTotalPaginationItems] = useState(1);
  const [paginationItems, setPaginationItems] = useState([]);
  const [totalPages, setTotalPages] = useState({
    library: 1,
    shadowEntries: 0,
  });
  const [mode, setMode] = useState('library');

  // sets songs on page
  const getSongSelection = () => {
    if (library.length > 0) {
      const start = (page - 1) * BATCH_SIZE;
      const end = page * BATCH_SIZE;
      const songs =
        mode === 'library'
          ? library.slice(start, end)
          : shadowEntries.slice(start, end);
      setSongsOnPage(songs);
    }
  };

  const BATCH_SIZE = 50;
  const PAGINATION_ITEM_WIDTH = 51;

  useEffect(() => {
    const newLibraryTotal = Math.ceil(libraryTotal.current / BATCH_SIZE);
    const newShadowTotal = Math.ceil(shadowEntriesTotal.current / BATCH_SIZE);
    setTotalPages({ library: newLibraryTotal, shadowEntries: newShadowTotal });
  }, [libraryTotal, shadowEntriesTotal.current]);

  useLayoutEffect(() => {
    const table = document.getElementsByTagName('table')[0];
    const tableWidth = table.offsetWidth;
    const num = Math.floor(tableWidth / PAGINATION_ITEM_WIDTH);
    let newRange;
    const context =
      mode === 'library' ? totalPages.library : totalPages.shadowEntries;
    if (context + 2 <= num) {
      newRange = [2, context];
    } else {
      newRange = [2, num - 4];
    }
    setPageRange(newRange);
    setTotalPaginationItems(num);
  }, [totalPages, mode]);

  const ellipsisClick = (direction) => {
    let newRange;
    let availablePagination = totalPaginationItems - 6;
    const context =
      mode === 'library' ? totalPages.library : totalPages.shadowEntries;
    switch (direction) {
      case 'prev':
        if (pageRange[0] - availablePagination <= 1) {
          newRange = [2, availablePagination + 2];
        } else {
          newRange = [pageRange[0] - availablePagination, pageRange[0] - 1];
        }
        setPage((x) => newRange[1]);
        break;
      case 'next':
        if (pageRange[1] + availablePagination >= context) {
          newRange = [pageRange[1] + 1, context - 1];
        } else {
          newRange = [pageRange[1] + 1, pageRange[1] + availablePagination];
        }
        setPage((x) => newRange[0]);
        break;
      default:
        break;
    }
    setPageRange(newRange);
  };

  useEffect(() => {
    const tempIndices = [];
    const context =
      mode === 'library' ? totalPages.library : totalPages.shadowEntries;
    tempIndices.push(
      <Pagination.Prev
        disabled={page === 1}
        onClick={() => {
          if (page - 1 < pageRange[0] && page !== 2)
            setPageRange([
              pageRange[0] - 1,
              pageRange[1] === context - 1 ? context - 3 : pageRange[1] - 1,
            ]);
          setPage((x) => x - 1);
        }}
      />,
      <Pagination.Item
        key={1}
        active={page === 1}
        onClick={() => {
          setPage(1);
          setPageRange([2, totalPaginationItems - 4]);
        }}
      >
        1
      </Pagination.Item>
    );
    if (pageRange[0] > 2) {
      if (pageRange[0] === 3) {
        tempIndices.push(
          <Pagination.Item
            key={2}
            active={page === 2}
            onClick={() => {
              setPage(2);
              setPageRange([3, totalPaginationItems - 4]);
            }}
          >
            2
          </Pagination.Item>
        );
      } else {
        tempIndices.push(
          <Pagination.Ellipsis onClick={() => ellipsisClick('prev')} />
        );
      }
    }
    for (let index = pageRange[0]; index <= pageRange[1]; index++) {
      tempIndices.push(
        <Pagination.Item
          key={index}
          active={index === page}
          onClick={() => setPage(index)}
        >
          {index}
        </Pagination.Item>
      );
    }
    if (pageRange[1] < context - 1) {
      tempIndices.push(
        <Pagination.Ellipsis onClick={() => ellipsisClick('next')} />
      );
    }
    if (context > 1) {
      tempIndices.push(
        <Pagination.Item
          key={context}
          active={page === context}
          onClick={() => {
            setPage(context);
            setPageRange([context - totalPaginationItems + 5, context - 1]);
          }}
        >
          {context}
        </Pagination.Item>
      );
    }
    tempIndices.push(
      <Pagination.Next
        disabled={page === context}
        onClick={() => {
          if (page + 1 > pageRange[1] && page !== context - 1)
            setPageRange([
              pageRange[0] === 2 ? 4 : pageRange[0] + 1,
              pageRange[1] + 1,
            ]);
          setPage((x) => x + 1);
        }}
      />
    );
    setPaginationItems(tempIndices);
  }, [totalPaginationItems, pageRange, page, totalPages, mode, shadowEntries]);

  useEffect(getSongSelection, [page, library, mode, shadowEntries]);

  const extractLibrary = (item) => {
    const { added_at } = item;
    const { id, name: track } = item.track;
    const artists = item.track.artists.map((artist) => artist.name);
    const { name: album } = item.track.album;
    return { id, track, artists, album, added_at };
  };

  useEffect(() => {
    if (library && library.length === libraryTotal.current && !shadowEntries) {
      findShadowEntries(tokens.access_token, profile.country, library).then(
        (entries) => {
          setShadowEntries(entries);
          shadowEntriesTotal.current = entries.length;
        }
      );
    }
  }, [library]);

  return (
    <>
      <Navbar />
      <h1>Library</h1>
      <div>
        <div className='d-inline p-2'>
          <DownloadButton
            data={library.map(extractLibrary)}
            endpoint='http://localhost:8000/download-library'
            disabled={library.length !== libraryTotal.current}
          />
        </div>
        <div className='d-inline p-2'>
          <AddSongsButton />
        </div>
        <div className='d-inline p-2'>
          <Button
            variant='success'
            onClick={() => {
              if (mode === 'library') {
                setMode('shadow');
              } else {
                setMode('library');
              }
              setPage(1);
            }}
            disabled={
              !shadowEntries ||
              shadowEntries.length !== shadowEntriesTotal.current
            }
          >
            {mode === 'library' ? 'View Shadow Entries' : 'View Library'}
          </Button>
        </div>
      </div>
      <div
        className='d-flex flex-column align-items-center justify-content-center p-5'
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
              {songsOnPage &&
              Array.isArray(songsOnPage) &&
              songsOnPage.length !== 0 ? (
                songsOnPage.map((song, i) => (
                  <tr>
                    <td>{(page - 1) * BATCH_SIZE + i + 1}</td>
                    <td>
                      <a href={song.track.external_urls.spotify}>
                        {song.track.name}
                      </a>
                    </td>
                    <td>
                      {song.track.artists.map((artist, i) => (
                        <>
                          <a href={artist.external_urls.spotify}>
                            {artist.name}
                          </a>
                          {song.track.artists.length > 1 &&
                          i < song.track.artists.length - 1
                            ? ', '
                            : ''}
                        </>
                      ))}
                    </td>
                    <td>
                      <a href={song.track.album.external_urls.spotify}>
                        {song.track.album.name}
                      </a>
                    </td>
                    <td>{song.added_at}</td>
                    <td>{convertMilliseconds(song.track.duration_ms)}</td>
                  </tr>
                ))
              ) : library.length !== libraryTotal.current ? (
                <tr>
                  <td>
                    <Spinner animation='border' />
                  </td>
                  <td>
                    <Spinner animation='border' />
                  </td>
                  <td>
                    <Spinner animation='border' />
                  </td>
                  <td>
                    <Spinner animation='border' />
                  </td>
                  <td>
                    <Spinner animation='border' />
                  </td>
                  <td>
                    <Spinner animation='border' />
                  </td>
                </tr>
              ) : (
                <tr>
                  <td>N/A</td>
                  <td>N/A</td>
                  <td>N/A</td>
                  <td>N/A</td>
                  <td>N/A</td>
                  <td>N/A</td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
        <Pagination>{paginationItems.map((x) => x)}</Pagination>
      </div>
    </>
  );
}
