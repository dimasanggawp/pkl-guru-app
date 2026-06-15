import { NavLink } from 'react-router-dom';
import { LayoutGrid, MapPin, Users, BookCheck, Bell, ClipboardList } from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/monitoring', label: 'Monitoring', icon: MapPin },
  { to: '/students', label: 'Daftar Siswa', icon: Users },
  { to: '/reviews', label: 'Review Jurnal', icon: BookCheck },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/visits', label: 'Monitoring Visits', icon: ClipboardList },
];

function Sidebar() {
  return (
    <nav className="bg-surface-alt border-b sm:border-b-0 sm:border-r border-border w-full sm:w-56 p-3 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `nav-link whitespace-nowrap ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            {link.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

export default Sidebar;
