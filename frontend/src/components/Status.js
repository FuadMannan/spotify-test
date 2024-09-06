import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../App';
import { Spinner } from 'react-bootstrap';

export function Status() {
  const { status, setStatus, statuses, libraryTracks, libraryTotal } =
    useContext(AuthContext);
  const [inProgress, setInProgress] = useState(false);
  const [transition, setTransition] = useState('slideIn');

  useEffect(() => {
    setInProgress(status && status !== statuses[4]);
    if (status === statuses[4]) {
      setTimeout(() => {
        setTransition('slideOut');
        setTimeout(() => {
          setStatus(null);
          setTransition('slideIn');
        }, 1000);
      }, 2500);
    }
  }, [status, setStatus, statuses]);

  return (
    <>
      {status ? (
        <div className={`p-2 ${transition} status`}>
          {inProgress ? (
            <>
              {status}:{' '}
              {status === statuses[0] ? (
                `${libraryTracks.length}/${libraryTotal}`
              ) : (
                <Spinner animation='border' size='sm' className='ms-3' />
              )}
            </>
          ) : (
            statuses[4]
          )}
        </div>
      ) : (
        <div className='p-2 status'></div>
      )}
    </>
  );
}
