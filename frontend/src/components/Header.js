import { Link } from 'react-router-dom';
import { Navbar, Container, Nav } from 'react-bootstrap';

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
            eventKey='tracks'
            to='/library'
            state={{ mode: 'library' }}
          >
            Tracks
          </Nav.Link>
          <Nav.Link
            as={Link}
            eventKey='shadowTracks'
            to='/library'
            state={{ mode: 'shadowEntries' }}
          >
            Shadow Tracks
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
}
