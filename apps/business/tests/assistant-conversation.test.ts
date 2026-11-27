import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  MAX_CONVERSATION_CHARS,
  MAX_HISTORY_TURNS,
  clearAllConversations,
  clearConversation,
  conversationKey,
  historyFor,
  openConversation,
  saveConversation,
  type AssistantTurn,
  type ConversationStorage,
} from '../src/app/assistant/conversation.ts';

/** `sessionStorage` over a Map. */
function memoryStorage(): ConversationStorage & { keys(): string[] } {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
    removeItem: (key) => void store.delete(key),
    key: (index) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
    keys: () => [...store.keys()],
  };
}

const user = (text: string): AssistantTurn => ({ role: 'user', text });
const answer = (text: string): AssistantTurn => ({ role: 'assistant', text });
const A = conversationKey('user-1', 'org-a');
const B = conversationKey('user-1', 'org-b');

describe('assistant conversation storage (OCT-309)', () => {
  it('keeps a conversation per user and organization across a reload', () => {
    const storage = memoryStorage();
    assert.deepEqual(openConversation(storage, A), { turns: [], interrupted: false });
    saveConversation(storage, A, [user('Top members?'), answer('Lan and Minh.')], false);
    assert.deepEqual(openConversation(storage, A), {
      turns: [user('Top members?'), answer('Lan and Minh.')],
      interrupted: false,
    });
    assert.notEqual(conversationKey('user-2', 'org-a'), A);
  });

  it('marks a reload mid-answer as interrupted and drops the partial answer', () => {
    const storage = memoryStorage();
    saveConversation(storage, A, [user('Hi'), answer('Hel')], true);
    assert.deepEqual(openConversation(storage, A), { turns: [user('Hi')], interrupted: true });
    // Saved back as settled: the next load is not interrupted again.
    assert.deepEqual(openConversation(storage, A), { turns: [user('Hi')], interrupted: false });

    saveConversation(storage, A, [user('Hi')], true);
    assert.deepEqual(openConversation(storage, A), { turns: [user('Hi')], interrupted: true });
  });

  it('clears the previous organization when another one opens, and everything on sign-out', () => {
    const storage = memoryStorage();
    openConversation(storage, A);
    saveConversation(storage, A, [user('In A')], false);
    openConversation(storage, B);
    saveConversation(storage, B, [user('In B')], false);
    assert.equal(storage.getItem(A), null);
    assert.deepEqual(openConversation(storage, B).turns, [user('In B')]);

    storage.setItem('unrelated', 'kept');
    clearAllConversations(storage);
    assert.deepEqual(storage.keys(), ['unrelated']);
  });

  it('forgets one conversation on "New conversation"', () => {
    const storage = memoryStorage();
    saveConversation(storage, A, [user('Hi')], false);
    clearConversation(storage, A);
    assert.deepEqual(openConversation(storage, A).turns, []);
  });

  it('ignores damaged or foreign data, and works without storage', () => {
    const storage = memoryStorage();
    for (const raw of ['not json', '{"v":2,"turns":[]}', '{"v":1}', 'null']) {
      storage.setItem(A, raw);
      assert.deepEqual(openConversation(storage, A), { turns: [], interrupted: false });
    }
    storage.setItem(
      A,
      JSON.stringify({
        v: 1,
        turns: [user('ok'), { role: 'system', text: 'x' }, null],
        streaming: false,
      }),
    );
    assert.deepEqual(openConversation(storage, A).turns, [user('ok')]);

    assert.deepEqual(openConversation(null, A), { turns: [], interrupted: false });
    saveConversation(null, A, [user('x')], false);
    clearAllConversations(null);
    const broken = {
      ...memoryStorage(),
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('full');
      },
    };
    assert.deepEqual(openConversation(broken, A), { turns: [], interrupted: false });
    saveConversation(broken, A, [user('x')], false);
  });

  it('sends only turns with text, starting with a question, within Core limits', () => {
    // An answer that ended at the tool limit has no text: Core would drop it, the panel does too.
    assert.deepEqual(historyFor([user('a'), answer(''), user('b'), answer('  ')], 'c'), [
      user('a'),
      user('b'),
    ]);

    const long = Array.from({ length: MAX_HISTORY_TURNS + 6 }, (_, i) =>
      i % 2 ? answer(`a${i}`) : user(`q${i}`),
    );
    const trimmed = historyFor(long, 'next');
    assert.ok(trimmed.length <= MAX_HISTORY_TURNS);
    assert.equal(trimmed[0].role, 'user');
    assert.deepEqual(trimmed.at(-1), long.at(-1));

    const big = 'x'.repeat(MAX_CONVERSATION_CHARS / 2);
    const sized = historyFor([user(big), answer(big), user('short'), answer('ok')], 'next');
    assert.deepEqual(sized, [user('short'), answer('ok')]);
  });
});
