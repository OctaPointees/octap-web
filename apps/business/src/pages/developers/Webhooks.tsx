import { useDemo } from '../../hooks/useDemo';
import { useState } from 'react';
import { registerHook, toggleHook } from '../../services/demo';

export default function Webhooks() {
  const { hooks } = useDemo();
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  return (
    <>
      <h1 className="text-2xl font-bold">Webhooks</h1>
      <p>Manage simulated endpoints. Test events are local previews; no network request is sent.</p>
      <form
        className="card p-4 flex flex-wrap gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            registerHook(url);
            setUrl('');
            setMessage('Demo endpoint registered');
          } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Registration failed');
          }
        }}
      >
        <label className="flex-1">
          HTTPS endpoint
          <input
            required
            type="url"
            className="block w-full bg-transparent border rounded p-2"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/webhook"
          />
        </label>
        <button className="btn-primary-dark" type="submit">
          Register endpoint
        </button>
      </form>
      <ul className="card p-4 flex flex-col gap-4">
        {hooks.map((hook) => (
          <li key={hook.id} className="flex flex-wrap items-center gap-3">
            <span className="flex-1 break-all">{hook.url}</span>
            <span>{hook.enabled ? 'Enabled' : 'Disabled'}</span>
            <button
              aria-label={`${hook.enabled ? 'Disable' : 'Enable'} ${hook.url}`}
              onClick={() => {
                try {
                  toggleHook(hook.id);
                } catch {
                  setMessage('Could not update endpoint');
                }
              }}
            >
              {hook.enabled ? 'Disable' : 'Enable'}
            </button>
            <button
              disabled={!hook.enabled}
              onClick={() =>
                setMessage(`Simulated credits.earn.confirmed delivery to ${hook.url}: HTTP 200`)
              }
            >
              Preview test event
            </button>
          </li>
        ))}
      </ul>
      <p role="status">{message}</p>
    </>
  );
}
