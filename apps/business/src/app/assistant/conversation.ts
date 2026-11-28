/**
 * The dashboard assistant's conversation, kept in the browser (OCT-309). Core stores no conversation:
 * every message sends the history with it (`POST .../assistant/messages`, OCT-308). So the panel
 * keeps it here, in `sessionStorage`: one key per signed-in user and organization, which survives a
 * reload or moving between pages, and goes away with the tab.
 *
 * Plain functions over a `Storage`, with no React and no imports, so `node --test` can check them.
 * Every storage call is guarded: private mode or blocked site data only means the conversation is not
 * kept across a reload.
 */

export interface AssistantTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface Conversation {
  turns: AssistantTurn[];
  /**
   * An answer was still streaming when the page went away. Core aborts that turn when the request
   * closes, so it can't be resumed: the panel shows it as interrupted and the user asks again.
   */
  interrupted: boolean;
}

/** The part of `Storage` this needs: `sessionStorage` in the app, a fake in tests. */
export type ConversationStorage = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'
>;

/** Core's limits on one request (`assistant.service.ts`). */
export const MAX_MESSAGE_CHARS = 4_000;
export const MAX_HISTORY_TURNS = 40;
export const MAX_CONVERSATION_CHARS = 60_000;

const PREFIX = 'octap.business.assistant.';
/** The conversation key in use in this tab, so switching organization can clear the previous one. */
const ACTIVE_KEY = `${PREFIX}active`;
const VERSION = 1;

interface Stored {
  v: typeof VERSION;
  turns: AssistantTurn[];
  /** Set while an answer streams; still set on load means the page went away mid-answer. */
  streaming: boolean;
}

export const EMPTY: Conversation = { turns: [], interrupted: false };

/** One conversation per user and organization: another account in the same tab never sees it. */
export function conversationKey(userId: string, organizationId: string): string {
  return `${PREFIX}${userId}.${organizationId}`;
}

/**
 * Loads the conversation for `key`, and makes it the tab's active one: a conversation of another
 * organization (or user) left from before is cleared, as switching organization starts afresh.
 */
export function openConversation(storage: ConversationStorage | null, key: string): Conversation {
  const previous = safely(() => storage?.getItem(ACTIVE_KEY) ?? null, null);
  if (previous && previous !== key) safely(() => storage?.removeItem(previous), undefined);
  safely(() => storage?.setItem(ACTIVE_KEY, key), undefined);
  const stored = parse(safely(() => storage?.getItem(key) ?? null, null));
  if (!stored) return EMPTY;
  // A reload mid-answer: keep what was said, drop the partial answer, and say it was cut off.
  if (stored.streaming) {
    const turns =
      stored.turns.at(-1)?.role === 'assistant' ? stored.turns.slice(0, -1) : stored.turns;
    saveConversation(storage, key, turns, false);
    return { turns, interrupted: true };
  }
  return { turns: stored.turns, interrupted: false };
}

/** Saves the turns; `streaming` while the last answer is still arriving. */
export function saveConversation(
  storage: ConversationStorage | null,
  key: string,
  turns: AssistantTurn[],
  streaming: boolean,
): void {
  const value: Stored = { v: VERSION, turns, streaming };
  safely(() => storage?.setItem(key, JSON.stringify(value)), undefined);
}

/** "New conversation": forgets this one. */
export function clearConversation(storage: ConversationStorage | null, key: string): void {
  safely(() => storage?.removeItem(key), undefined);
}

/** Sign-out: forgets every conversation kept in this tab. */
export function clearAllConversations(storage: ConversationStorage | null): void {
  if (!storage) return;
  const keys = safely(() => {
    const found: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key?.startsWith(PREFIX)) found.push(key);
    }
    return found;
  }, [] as string[]);
  for (const key of keys) safely(() => storage.removeItem(key), undefined);
}

/**
 * The `history` to send with `message`: turns with text only (an answer that ended at a limit or a
 * refusal before any text carries nothing), starting with a user turn, and trimmed from the oldest
 * end so the request stays within Core's limits.
 */
export function historyFor(turns: AssistantTurn[], message: string): AssistantTurn[] {
  let history = turns.filter((turn) => turn.text.trim().length > 0);
  const size = (list: AssistantTurn[]) =>
    list.reduce((sum, turn) => sum + turn.text.length, message.trim().length);
  while (
    history.length > 0 &&
    (history.length > MAX_HISTORY_TURNS || size(history) > MAX_CONVERSATION_CHARS)
  )
    history = history.slice(1);
  // Core wants the history to start with a question.
  while (history.length > 0 && history[0].role !== 'user') history = history.slice(1);
  return history;
}

function parse(raw: string | null): Stored | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Stored>;
    if (value?.v !== VERSION || !Array.isArray(value.turns)) return null;
    const turns = value.turns.filter(
      (turn): turn is AssistantTurn =>
        !!turn &&
        (turn.role === 'user' || turn.role === 'assistant') &&
        typeof turn.text === 'string',
    );
    return { v: VERSION, turns, streaming: value.streaming === true };
  } catch {
    return null;
  }
}

function safely<T>(work: () => T, fallback: T): T {
  try {
    return work();
  } catch {
    return fallback;
  }
}
