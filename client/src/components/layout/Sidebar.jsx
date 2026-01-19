import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  Calendar,
  Link2,
  Briefcase,
  Users,
  Layers,
} from 'lucide-react';
import { ThemeToggle } from './index';
import './layout.css';

const navItems = [
  { path: '/', icon: LayoutGrid, label: 'Grid' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/linkinbio', icon: Link2, label: 'Link in Bio' },
  { path: '/mediakit', icon: Briefcase, label: 'Media Kit' },
  { path: '/workspaces', icon: Users, label: 'Workspaces' },
  { path: '/rollout', icon: Layers, label: 'Rollout' },
];

function Sidebar({ isOpen, onClose }) {
  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />
      <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">PostPilot</span>
        </div>

        <div className="sidebar-nav">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar" />
            <span className="sidebar-username">Creator</span>
          </div>
          <ThemeToggle />
        </div>
      </nav>
    </>
  );
}

export default Sidebar;
