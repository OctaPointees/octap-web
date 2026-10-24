import { useDemo } from '../../hooks/useDemo';
import { useState } from 'react';
import ApiKeysModal from './ApiKeysModal';
import { revokeKey, rotateKey } from '../../services/demo';

export default function ApiKeys() {
  const { keys } = useDemo();
  const [modal, setModal] = useState<{ secret?: string } | null>(null);
  const [message, setMessage] = useState('');
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">API keys</h1>
        <button className="btn-primary-dark" onClick={() => setModal({})}>
          Create demo API key
        </button>
      </div>
      <p>Manage simulated credentials. Only metadata is persisted; these keys do not call Core.</p>
      <div className="card p-4 overflow-x-auto">
        <table className="w-full text-left">
          <caption className="sr-only">Demo API keys</caption>
          <thead>
            <tr>
              {['Name', 'Scopes', 'Status', 'Actions'].map((label) => (
                <th className="p-2" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id}>
                <td className="p-2">{key.name}</td>
                <td className="p-2">{key.scopes.join(', ')}</td>
                <td className="p-2">{key.status}</td>
                <td className="p-2">
                  <div className="flex gap-3">
                    <button
                      disabled={key.status !== 'active'}
                      onClick={() => {
                        try {
                          setModal({ secret: rotateKey(key.id) });
                        } catch {
                          setMessage('Could not rotate the key.');
                        }
                      }}
                    >
                      Rotate
                    </button>
                    <button
                      disabled={key.status !== 'active'}
                      onClick={() => {
                        try {
                          revokeKey(key.id);
                        } catch {
                          setMessage('Could not revoke the key.');
                        }
                      }}
                    >
                      Revoke
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p role="status">{message}</p>
      {modal && <ApiKeysModal secret={modal.secret} onClose={() => setModal(null)} />}
    </>
  );
}
