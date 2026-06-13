import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/monitoring', label: 'Monitoring' },
  { to: '/students', label: 'Daftar Siswa' },
  { to: '/reviews', label: 'Review Jurnal' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/visits', label: 'Monitoring Visits' },
];

function Sidebar() {
  return (
    <nav className="bg-gray-100 w-full sm:w-48 p-4 flex sm:flex-col gap-2">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `px-3 py-2 rounded text-sm font-medium ${
              isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default Sidebar;
