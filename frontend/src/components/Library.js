import {
  Table,
  Pagination,
  Spinner,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap';
import { AuthContext } from '../App';
import { useContext, useEffect, useLayoutEffect, useState } from 'react';
import { DownloadButton } from './DownloadButton';
import { AddSongsButton } from './AddSongsButton';
import { DeleteSongsButton } from './DeleteAllSongsButton';
import { ReplaceShadowEntriesButton } from './ReplaceShadowEntriesButton';
import { Status } from './Status';
import { getShadowEntries } from '../util/queries';
import { useLocation } from 'react-router-dom';

function convertMilliseconds(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor(ms / 60000) % 60;
  const seconds = Math.floor((ms % 60000) / 1000);
  return (
    `${hours > 0 ? hours + ':' : ''}` +
    `${String(minutes).padStart(2, '0')}:` +
    `${String(seconds).padStart(2, '0')}`
  );
}

export const modes = ['tracks', 'shadowTracks', 'albums'];

export function Library() {
  const {
    libraryTracks,
    libraryAlbums,
    totalTracks,
    totalAlbums,
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
  const [itemsOnPage, setItemsOnPage] = useState([]);
  const [totalPaginationItems, setTotalPaginationItems] = useState(1);
  const [paginationItems, setPaginationItems] = useState([]);
  const [totalPages, setTotalPages] = useState(
    modes.reduce((prevMode, currMode) => ({ ...prevMode, [currMode]: 0 }), {})
  );
  const [mode, setMode] = useState(modes[0]);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.mode) {
      setMode(location.state.mode);
    }
  }, [location.state]);

  // sets songs on page

  const BATCH_SIZE = 50;
  const PAGINATION_ITEM_WIDTH = 51;

  // sets total pages
  useEffect(() => {
    const newTotalTracks = Math.ceil(totalTracks / BATCH_SIZE);
    const newTotalShadowTracks = Math.ceil(shadowEntriesTotal / BATCH_SIZE);
    const newTotalAlbums = Math.ceil(totalAlbums / BATCH_SIZE);
    setTotalPages({
      tracks: newTotalTracks,
      shadowTracks: newTotalShadowTracks,
      albums: newTotalAlbums,
    });
  }, [totalTracks, shadowEntriesTotal, totalAlbums]);

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

  useLayoutEffect(() => {
    const getItemSelection = () => {
      const start = (page.current - 1) * BATCH_SIZE;
      const end = page.current * BATCH_SIZE;
      const items =
        mode === modes[0]
          ? libraryTracks
          : mode === modes[1]
          ? shadowEntries.identified
          : libraryAlbums;
      setItemsOnPage(items.slice(start, end));
    };
    getItemSelection();
  }, [page, libraryTracks, mode, shadowEntries, libraryAlbums]);

  useEffect(() => {
    if (status === statuses[2]) {
      getShadowEntries(
        tokens.access_token,
        profile.country,
        libraryTracks
      ).then((entries) => {
        if (entries.identified.length !== shadowEntriesTotal) {
          setShadowEntriesTotal(entries.identified.length);
          setShadowEntries(entries);
        }
        setStatus(statuses[6]);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libraryTracks, totalTracks, status]);

  useEffect(() => {
    const container = document.getElementById('innerTableContainer');
    container.scrollTop = 0;
  }, [page]);

  const TooltipHelper = ({ children, title, href }) => (
    <OverlayTrigger
      placement='top-start'
      overlay={<Tooltip disabled={true}>{title}</Tooltip>}
    >
      {href ? (
        <a className='link-body-emphasis' href={href}>
          {children}
        </a>
      ) : (
        <span>{children}</span>
      )}
    </OverlayTrigger>
  );

  return (
    <>
      <h1>Library</h1>
      <div>
        <div className='d-inline p-2'>
          <DownloadButton mode={mode} />
        </div>
        <div className='d-inline p-2'>
          <AddSongsButton />
        </div>
        <div className='d-inline p-2'>
          <ReplaceShadowEntriesButton />
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
              {(modes.indexOf(mode) < 2 && (
                <tr>
                  <th style={{ width: '5vw' }}>#</th>
                  <th style={{ width: '25vw' }}>Title</th>
                  <th style={{ width: '20vw' }}>Artist</th>
                  <th style={{ width: '20vw' }}>Album</th>
                  <th style={{ width: '15vw' }}>Date Added</th>
                  <th style={{ width: '5vw' }}>Length</th>
                </tr>
              )) ||
                (modes.indexOf(mode) === 2 && (
                  <tr>
                    <th style={{ width: '5vw' }}>#</th>
                    <th style={{ width: '15vw' }}>Album</th>
                    <th style={{ width: '10vw' }}>Artist</th>
                    <th style={{ width: '10vw' }}>Type</th>
                    <th style={{ width: '5vw' }}>Total Tracks</th>
                    <th style={{ width: '10vw' }}>Genres</th>
                    <th style={{ width: '10vw' }}>Label</th>
                    <th style={{ width: '10vw' }}>Release Date</th>
                    <th style={{ width: '10vw' }}>Date Added</th>
                    <th style={{ width: '5vw' }}>Length</th>
                  </tr>
                ))}
            </thead>
            <tbody>
              {modes.indexOf(mode) < 2 ? (
                itemsOnPage.length !== 0 && itemsOnPage[0].track ? (
                  itemsOnPage.map((item, i) => (
                    <tr>
                      <td>{(page.current - 1) * BATCH_SIZE + i + 1}</td>
                      <td className='truncate'>
                        <TooltipHelper
                          title={item.track.name}
                          href={item.track.external_urls.spotify}
                        >
                          {item.track.name}
                        </TooltipHelper>
                      </td>
                      <td className='truncate'>
                        {item.track.artists.map((artist, i) => (
                          <>
                            <TooltipHelper
                              title={item.track.artists
                                .map((artist) => artist.name)
                                .join(', ')}
                              href={artist.external_urls.spotify}
                            >
                              {artist.name}
                            </TooltipHelper>
                            {item.track.artists.length > 1 &&
                            i < item.track.artists.length - 1
                              ? ', '
                              : ''}
                          </>
                        ))}
                      </td>
                      <td className='truncate'>
                        <TooltipHelper
                          title={item.track.album.name}
                          href={item.track.album.external_urls.spotify}
                        >
                          {item.track.album.name}
                        </TooltipHelper>
                      </td>
                      <td>{item.added_at}</td>
                      <td>{convertMilliseconds(item.track.duration_ms)}</td>
                    </tr>
                  ))
                ) : libraryTracks.length !== totalTracks ? (
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
                )
              ) : mode === modes[2] ? (
                itemsOnPage.length !== 0 && itemsOnPage[0].album ? (
                  itemsOnPage.map((item, i) => (
                    <tr>
                      <td>{(page.current - 1) * BATCH_SIZE + i + 1}</td>
                      <td className='truncate'>
                        <TooltipHelper
                          title={item.album.name}
                          href={item.album.external_urls.spotify}
                        >
                          {item.album.name}
                        </TooltipHelper>
                      </td>
                      <td className='truncate'>
                        {item.album.artists.map((artist, i) => (
                          <>
                            <TooltipHelper
                              title={item.album.artists
                                .map((artist) => artist.name)
                                .join(', ')}
                              href={artist.external_urls.spotify}
                            >
                              {artist.name}
                            </TooltipHelper>
                            {item.album.artists.length > 1 &&
                            i < item.album.artists.length - 1
                              ? ', '
                              : ''}
                          </>
                        ))}
                      </td>
                      <td className='truncate'>
                        {item.album.album_type[0].toUpperCase() +
                          item.album.album_type.slice(1)}
                      </td>
                      <td className='truncate'>{item.album.total_tracks}</td>
                      <td className='truncate'>
                        {item.album.genres.length > 0
                          ? item.album.genres.join(', ')
                          : 'N/A'}
                      </td>
                      <td className='truncate'>
                        <TooltipHelper title={item.album.label}>
                          {item.album.label}
                        </TooltipHelper>
                      </td>
                      <td className='truncate'>{item.album.release_date}</td>
                      <td>{item.added_at}</td>
                      <td>
                        {convertMilliseconds(
                          item.album.tracks.items
                            .map((track) => track.duration_ms)
                            .reduce((prev, curr) => prev + curr, 0)
                        )}
                      </td>
                    </tr>
                  ))
                ) : libraryAlbums.length !== totalAlbums ? (
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
                    <td>N/A</td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td>N/A</td>
                  </tr>
                )
              ) : null}
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
