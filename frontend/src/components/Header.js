import { Link } from 'react-router-dom';
import { Navbar, Container, Nav } from 'react-bootstrap';

export function Header() {
  return (
    <Navbar className='bg-gradient' variant='dark'>
      <Container>
        <Navbar.Brand href='/'>Dedupify</Navbar.Brand>
        <Nav className='me-auto'>
          <Nav.Link as={Link} to='/'>
            Home
          </Nav.Link>
          <Nav.Link as={Link} to='/library'>
            Library
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
}
