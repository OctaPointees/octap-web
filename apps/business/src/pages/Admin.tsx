import { Link } from 'react-router-dom';
import { clearSession } from '../auth';

export default function Admin() {
  return (
    <div className="theme-login">
      <div
        className="min-h-[100dvh] flex items-center justify-center p-8 font-body"
        style={{ background: 'var(--ground)', color: 'var(--ink)' }}
      >
        <div className="max-w-md text-center">
          <div
            className="font-head text-xs font-extrabold tracking-wider px-2.5 py-1 rounded-full inline-block"
            style={{ background: '#E8E4FB', color: '#4B3BA8' }}
          >
            ADMIN
          </div>
          <h1 className="font-head text-3xl font-extrabold tracking-tight mt-4">Admin Dashboard</h1>
          <p className="text-muted mt-3 text-base">
            The Platform admin console is a separate app and isn't part of this Partner Dashboard
            prototype.
          </p>
          <Link
            to="/login"
            onClick={clearSession}
            className="btn-brand mt-8 inline-flex"
            style={{ width: 'auto', padding: '0 28px' }}
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
