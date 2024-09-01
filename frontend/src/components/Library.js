import { Header } from './Header';
import {
  Table,
  Pagination,
  Spinner,
  OverlayTrigger,
  Tooltip,
  Dropdown,
} from 'react-bootstrap';
import { AuthContext } from '../App';
import { useContext, useEffect, useLayoutEffect, useState } from 'react';
import { DownloadButton } from './DownloadButton';
import { AddSongsButton } from './AddSongsButton';
import { DeleteSongsButton } from './DeleteAllSongsButton';
import { Status } from './Status';
import { getShadowEntries } from '../util/queries';

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
    setShadowEntriesTotal,
    status,
    setStatus,
    statuses,
  } = useContext(AuthContext);
  const [page, setPage] = useState({ current: 1, range: [] });
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
    const start = (page.current - 1) * BATCH_SIZE;
    const end = page.current * BATCH_SIZE;
    const songs =
      mode === 'library'
        ? library.slice(start, end)
        : shadowEntries.slice(start, end);
    setSongsOnPage(songs);
  };

  const BATCH_SIZE = 50;
  const PAGINATION_ITEM_WIDTH = 51;

  // sets total pages
  useEffect(() => {
    const newLibraryTotal = Math.ceil(libraryTotal / BATCH_SIZE);
    const newShadowTotal = Math.ceil(shadowEntriesTotal / BATCH_SIZE);
    setTotalPages({ library: newLibraryTotal, shadowEntries: newShadowTotal });
  }, [libraryTotal, shadowEntriesTotal]);

  // sets initial page range, total pagination items
  useLayoutEffect(() => {
    const table = document.getElementsByTagName('table')[0];
    const tableWidth = table.offsetWidth;
    const newTotalPaginationItems = Math.floor(
      tableWidth / PAGINATION_ITEM_WIDTH
    );
    let newRange;
    const totalContextPages = totalPages[mode];
    // all pages fit, no need for ellipsis
    if (totalContextPages + 2 <= newTotalPaginationItems) {
      newRange = totalContextPages === 1 ? [] : [2, totalContextPages - 1];
    } else {
      newRange = [2, newTotalPaginationItems - 4];
    }
    setPage({ current: 1, range: newRange });
    setTotalPaginationItems(newTotalPaginationItems);
  }, [totalPages, mode]);

  // sets pagination items
  useEffect(() => {
    const directionKeys = ['prev', 'next'];
    const ellipsisClick = (direction) => {
      let current = page.current;
      let range;
      let availablePagination = totalPaginationItems - 6;
      const context = totalPages[mode];
      let delta;
      switch (direction) {
        case directionKeys[0]:
          delta = page.range[0] - availablePagination;
          if (delta <= 1) {
            range = [2, availablePagination + 2];
          } else {
            const start = delta === 3 ? delta - 1 : delta;
            const end = delta === 2 ? page.range[0] : page.range[0] - 1;
            range = [start, end];
          }
          break;
        case directionKeys[1]:
          delta = page.range[1] + availablePagination;
          if (delta >= context) {
            range = [context - availablePagination - 1, context - 1];
          } else {
            const start =
              delta === context - 1 ? page.range[1] : page.range[1] + 1;
            const end = delta === context - 2 ? delta + 1 : delta;
            range = [start, end];
          }
          break;
        default:
          break;
      }
      current =
        range[0] < current && current < range[1]
          ? current
          : direction === directionKeys[0]
          ? range[1]
          : range[0];
      setPage({ current, range });
    };

    const tempIndices = [];
    const totalContextPages = totalPages[mode];
    const prev = page.current - 1;
    const next = page.current + 1;
    const hasEllipsis = totalContextPages + 2 > totalPaginationItems;
    tempIndices.push(
      // PREVIOUS BUTTON
      <Pagination.Prev
        disabled={page.current === 1}
        key={directionKeys[0]}
        onClick={() => {
          const current = page.current - 1;
          const range = [];
          // not all pages can be shown, use ellipsis
          if (hasEllipsis && 2 <= prev && prev < page.range[0]) {
            if (prev === 2) {
              range.push(prev, page.range[1]);
            } else if (
              page.current === page.range[0] &&
              page.range[1] === totalContextPages - 1
            ) {
              range.push(prev, page.range[1] - 2);
            } else {
              range.push(prev, page.range[1] - 1);
            }
          } else {
            range.push(...page.range);
          }
          setPage({ current, range });
        }}
      />,

      // FIRST PAGE
      <Pagination.Item
        key={1}
        active={page.current === 1}
        onClick={() => {
          if (page.current !== 1) {
            const range = [];
            // not all pages can be shown
            if (hasEllipsis) {
              range.push(2, totalPaginationItems - 4);
            } else if (totalContextPages > 1) {
              range.push(2, totalContextPages - 1);
            }
            setPage({ current: 1, range });
          }
        }}
      >
        1
      </Pagination.Item>
    );

    // LEFT ELLIPSIS
    if (hasEllipsis && page.range[0] !== 2) {
      tempIndices.push(
        <Pagination.Ellipsis
          key={'lEllipsis'}
          onClick={() => ellipsisClick(directionKeys[0])}
        />
      );
    }

    // PAGE RANGE (MIDDLE PAGES)
    for (let index = page.range[0]; index <= page.range[1]; index++) {
      tempIndices.push(
        <Pagination.Item
          key={index}
          active={index === page.current}
          onClick={() => setPage({ ...page, current: index })}
        >
          {index}
        </Pagination.Item>
      );
    }

    // RIGHT ELLIPSIS
    if (hasEllipsis && page.range[1] < totalContextPages - 1) {
      tempIndices.push(
        <Pagination.Ellipsis
          key={'rEllipsis'}
          onClick={() => ellipsisClick(directionKeys[1])}
        />
      );
    }

    // LAST PAGE
    if (totalContextPages > 1) {
      tempIndices.push(
        <Pagination.Item
          key={totalContextPages}
          active={page.current === totalContextPages}
          onClick={() => {
            const range = [];
            if (hasEllipsis) {
              range.push(
                totalContextPages - totalPaginationItems + 5,
                totalContextPages - 1
              );
            } else {
              range.push(2, totalContextPages - 1);
            }
            setPage({ current: totalContextPages, range });
          }}
        >
          {totalContextPages}
        </Pagination.Item>
      );
    }

    // NEXT BUTTON
    tempIndices.push(
      <Pagination.Next
        disabled={page.current === totalContextPages || totalContextPages === 0}
        key={directionKeys[1]}
        onClick={() => {
          const current = page.current + 1;
          const range = [];
          if (
            hasEllipsis &&
            next <= totalContextPages - 1 &&
            next > page.range[1]
          ) {
            if (page.range[0] === 2) {
              range.push(page.range[0] + 2, next);
            } else if (next === totalContextPages - 1) {
              range.push(page.range[0], next);
            } else {
              range.push(page.range[0] + 1, next);
            }
          } else {
            range.push(...page.range);
          }
          setPage({ current, range });
        }}
      />
    );
    setPaginationItems(tempIndices);
  }, [totalPaginationItems, page, totalPages, mode]);

  useEffect(getSongSelection, [page, library, mode, shadowEntries]);

  useEffect(() => {
    if (
      library?.length > 0 &&
      library?.length === libraryTotal &&
      status === statuses[1]
    ) {
      getShadowEntries(tokens.access_token, profile.country, library).then(
        (entries) => {
          if (entries.length !== shadowEntriesTotal) {
            setShadowEntriesTotal(entries.length);
            setShadowEntries(entries);
          }
          setStatus(statuses[4]);
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [library, libraryTotal, status]);

  useEffect(() => {
    const container = document.getElementById('innerTableContainer');
    container.scrollTop = 0;
  }, [page]);

  const TooltipHelper = ({ children, title, href }) => (
    <OverlayTrigger
      placement='top-start'
      overlay={<Tooltip disabled={true}>{title}</Tooltip>}
    >
      <a className='link-body-emphasis' href={href}>
        {children}
      </a>
    </OverlayTrigger>
  );

  return (
    <>
      <Header />
      <h1>Library</h1>
      <div>
        <div className='d-inline p-2'>
          <DownloadButton mode={mode} />
        </div>
        <div className='d-inline p-2'>
          <AddSongsButton />
        </div>
        <div className='d-inline p-2'>
          <Dropdown data-bs-theme='dark'>
            <Dropdown.Toggle
              variant='spotify'
              disabled={
                shadowEntries === null ||
                (shadowEntries !== null &&
                  shadowEntries.length !== shadowEntriesTotal)
              }
            >
              Mode: {mode === 'library' ? 'Library' : 'Shadow Entries'}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setMode('library')}>
                Library
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setMode('shadowEntries')}>
                Shadow Entries
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
        <div className='d-inline p-2'>
          <DeleteSongsButton />
        </div>
        <Status />
      </div>
      <div
        id='outerTableContainer'
        className='d-flex flex-column align-items-center justify-content-center p-5'
      >
        <div id='innerTableContainer'>
          <Table striped hover data-bs-theme='dark' className='mb-0'>
            <thead className='sticky-header'>
              <tr>
                <th style={{ width: '5vw' }}>#</th>
                <th style={{ width: '25vw' }}>Title</th>
                <th style={{ width: '20vw' }}>Artist</th>
                <th style={{ width: '20vw' }}>Album</th>
                <th style={{ width: '15vw' }}>Date added</th>
                <th style={{ width: '5vw' }}>Length</th>
              </tr>
            </thead>
            <tbody>
              {songsOnPage &&
              Array.isArray(songsOnPage) &&
              songsOnPage.length !== 0 ? (
                songsOnPage.map((song, i) => (
                  <tr>
                    <td>{(page.current - 1) * BATCH_SIZE + i + 1}</td>
                    <td className='truncate'>
                      <TooltipHelper
                        title={song.track.name}
                        href={song.track.external_urls.spotify}
                      >
                        {song.track.name}
                      </TooltipHelper>
                    </td>
                    <td className='truncate'>
                      {song.track.artists.map((artist, i) => (
                        <>
                          <TooltipHelper
                            title={song.track.artists
                              .map((artist) => artist.name)
                              .join(', ')}
                            href={artist.external_urls.spotify}
                          >
                            {artist.name}
                          </TooltipHelper>
                          {song.track.artists.length > 1 &&
                          i < song.track.artists.length - 1
                            ? ', '
                            : ''}
                        </>
                      ))}
                    </td>
                    <td className='truncate'>
                      <TooltipHelper
                        title={song.track.album.name}
                        href={song.track.album.external_urls.spotify}
                      >
                        {song.track.album.name}
                      </TooltipHelper>
                    </td>
                    <td>{song.added_at}</td>
                    <td>{convertMilliseconds(song.track.duration_ms)}</td>
                  </tr>
                ))
              ) : library.length !== libraryTotal ? (
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
        <Pagination data-bs-theme='dark'>
          {paginationItems.map((x) => x)}
        </Pagination>
      </div>
    </>
  );
}
