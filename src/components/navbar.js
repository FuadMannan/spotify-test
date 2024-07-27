import { Link } from 'react-router-dom';

export function Navbar() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/library">Library</Link>
      </nav>
    </div>
  );
}
