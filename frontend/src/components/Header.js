import { Link } from 'react-router-dom';
import { Navbar, Container, Nav } from 'react-bootstrap';
import { modes } from './Library';

export function Header() {
  return (
    <Navbar className='bg-gradient' variant='dark'>
      <Container>
        <Navbar.Brand href='/'>Dedupify</Navbar.Brand>
        <Nav className='me-auto' variant='underline'>
          <Nav.Link as={Link} eventKey='profile' to='/'>
            Profile
          </Nav.Link>
          <Nav.Link
            as={Link}
            eventKey={modes[0]}
            to='/library'
            state={{ mode: modes[0] }}
          >
            Tracks
          </Nav.Link>
          <Nav.Link
            as={Link}
            eventKey={modes[1]}
            to='/library'
            state={{ mode: modes[1] }}
          >
            Shadow Tracks
          </Nav.Link>
          <Nav.Link
            as={Link}
            eventKey={modes[2]}
            to='/library'
            state={{ mode: modes[2] }}
          >
            Albums
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
}
