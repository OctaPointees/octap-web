import { useState } from 'react';
import { clearSession } from '../auth';
import { Link, useNavigate } from 'react-router-dom';
import { DEV_TABS } from '../pages/developers/tabs';

export default function DeveloperToolbar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [notices, setNotices] = useState(false);
  const matches = DEV_TABS.filter(([, label]) => label.toLowerCase().includes(query.toLowerCase()));
  return (
    <header className="developer-toolbar card p-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex flex-1 items-center gap-2">
          <i className="ti ti-search" aria-hidden="true" />
          <input
            className="w-full min-w-0 bg-transparent"
            aria-label="Search developer pages"
            placeholder="Search developer pages"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn-secondary-dark"
          onClick={() => {
            clearSession();
            navigate('/login');
          }}
        >
          Log out
        </button>
        <span className="status-pill warning">Demo / Test</span>
        <button
          type="button"
          className="btn-secondary-dark"
          aria-expanded={notices}
          onClick={() => setNotices(!notices)}
        >
          Notifications
        </button>
      </div>
      {query && (
        <nav aria-label="Search results" className="flex flex-wrap gap-3 py-3">
          {matches.length ? (
            matches.map(([id, label]) => (
              <Link key={id} to={`/developers/${id}`} onClick={() => setQuery('')}>
                {label}
              </Link>
            ))
          ) : (
            <p role="status">No matching pages</p>
          )}
        </nav>
      )}
      {notices && (
        <p role="status" className="py-2 text-sm">
          No new demo notifications.
        </p>
      )}
      <p className="mt-2 text-xs">
        Simulated data. No real points, money, or API credentials are created.
      </p>
    </header>
  );
}
