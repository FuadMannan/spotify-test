import { Navbar } from './Navbar';
import { Table, Pagination, Spinner } from 'react-bootstrap';
import { AuthContext } from '../App';
import { useContext, useEffect, useLayoutEffect, useState } from 'react';
import { DownloadButton } from './DownloadButton';

function convertMilliseconds(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function Library() {
  const { library, libraryTotal } = useContext(AuthContext);
  const [page, setPage] = useState(1);
  const [pageRange, setPageRange] = useState([]);
  const [songsOnPage, setSongsOnPage] = useState(null);
  const [totalPaginationItems, setTotalPaginationItems] = useState(1);
  const [paginationItems, setPaginationItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const getSongSelection = () => {
    if (library.length > 0) {
      const start = (page - 1) * BATCH_SIZE;
      const end = page * BATCH_SIZE;
      const songs = library.slice(start, end);
      setSongsOnPage(songs);
    }
  };

  const BATCH_SIZE = 50;
  const PAGINATION_ITEM_WIDTH = 51;

  useEffect(() => {
    const newTotal = Math.ceil(libraryTotal.current / BATCH_SIZE);
    setTotalPages(newTotal);
  }, [libraryTotal]);

  useLayoutEffect(() => {
    const table = document.getElementsByTagName('table')[0];
    const tableWidth = table.offsetWidth;
    const num = Math.floor(tableWidth / PAGINATION_ITEM_WIDTH);
    let newRange;
    if (totalPages + 2 <= num) {
      newRange = [2, totalPages];
    } else {
      newRange = [2, num - 4];
    }
    setPageRange(newRange);
    setTotalPaginationItems(num);
  }, [totalPages]);

  const ellipsisClick = (direction) => {
    let newRange;
    let availablePagination = totalPaginationItems - 6;
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
        if (pageRange[1] + availablePagination >= totalPages) {
          newRange = [pageRange[1] + 1, totalPages - 1];
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
    tempIndices.push(
      <Pagination.Prev
        disabled={page === 1}
        onClick={() => {
          if (page - 1 < pageRange[0] && page !== 2)
            setPageRange([
              pageRange[0] - 1,
              pageRange[1] === totalPages - 1
                ? totalPages - 3
                : pageRange[1] - 1,
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
    if (pageRange[1] < totalPages - 1) {
      tempIndices.push(
        <Pagination.Ellipsis onClick={() => ellipsisClick('next')} />
      );
    }
    if (totalPages > 1) {
      tempIndices.push(
        <Pagination.Item
          key={totalPages}
          active={page === totalPages}
          onClick={() => {
            setPage(totalPages);
            setPageRange([
              totalPages - totalPaginationItems + 5,
              totalPages - 1,
            ]);
          }}
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    tempIndices.push(
      <Pagination.Next
        disabled={page === totalPages}
        onClick={() => {
          if (page + 1 > pageRange[1] && page !== totalPages - 1)
            setPageRange([
              pageRange[0] === 2 ? 4 : pageRange[0] + 1,
              pageRange[1] + 1,
            ]);
          setPage((x) => x + 1);
        }}
      />
    );
    setPaginationItems(tempIndices);
  }, [totalPaginationItems, pageRange, page, totalPages]);

  useEffect(getSongSelection, [page, library]);

  const extractLibrary = (item) => {
    const { added_at } = item;
    const { id, name: track } = item.track;
    const artists = item.track.artists.map((artist) => artist.name);
    const { name: album } = item.track.album;
    return { id, track, artists, album, added_at };
  };

  return (
    <>
      <Navbar />
      <h1>Library</h1>
      <DownloadButton
        data={library.map(extractLibrary)}
        endpoint="http://localhost:8000/download-library"
      />
      <div
        className="d-flex flex-column align-items-center justify-content-center p-5"
        style={{ height: '90vh' }}
      >
        <div id="tableContainer" style={{ overflowY: 'auto', width: '100%' }}>
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
              ) : (
                <tr>
                  <td>
                    <Spinner animation="border" />
                  </td>
                  <td>
                    <Spinner animation="border" />
                  </td>
                  <td>
                    <Spinner animation="border" />
                  </td>
                  <td>
                    <Spinner animation="border" />
                  </td>
                  <td>
                    <Spinner animation="border" />
                  </td>
                  <td>
                    <Spinner animation="border" />
                  </td>
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
