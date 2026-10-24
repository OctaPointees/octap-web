import { useState } from 'react';
import Modal from '../../components/Modal';
import { createKey } from '../../services/demo';

export default function ApiKeysModal({
  onClose,
  secret: initialSecret,
}: {
  onClose: () => void;
  secret?: string;
}) {
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState(['read']);
  const [secret, setSecret] = useState(initialSecret ?? '');
  const [message, setMessage] = useState('');
  return (
    <Modal title={secret ? 'Save demo secret' : 'Create demo API key'} onClose={onClose}>
      {secret ? (
        <>
          <p>
            This fake secret is shown only in this dialog. It cannot authenticate against OctaP
            Core.
          </p>
          <code className="block break-all my-4">{secret}</code>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(secret);
                setMessage('Copied');
              } catch {
                setMessage('Copy failed. Select and copy the secret above.');
              }
            }}
          >
            Copy secret
          </button>
        </>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              setSecret(createKey(name, scopes));
            } catch (error) {
              setMessage(error instanceof Error ? error.message : 'Unable to create key');
            }
          }}
        >
          <label>
            Key name
            <input
              required
              maxLength={80}
              className="block w-full border rounded p-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <fieldset>
            <legend>Scopes</legend>
            {['read', 'write', 'admin'].map((scope) => (
              <label className="flex gap-2" key={scope}>
                <input
                  type="checkbox"
                  checked={scopes.includes(scope)}
                  onChange={(e) =>
                    setScopes(
                      e.target.checked ? [...scopes, scope] : scopes.filter((s) => s !== scope),
                    )
                  }
                />
                {scope}
              </label>
            ))}
          </fieldset>
          <button type="submit">Create demo key</button>
        </form>
      )}
      <p role="status" className="mt-3">
        {message}
      </p>
    </Modal>
  );
}
