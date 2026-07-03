import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <div className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark" />
          VAPT PLATFORM
        </Link>
        <div className="nav-links">
          <Link to="/">Dashboard</Link>
          <Link to="/new">New Scan</Link>
        </div>
      </div>
    </div>
  );
}
