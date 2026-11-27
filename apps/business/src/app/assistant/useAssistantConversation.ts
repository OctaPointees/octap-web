import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '@octap/shared/authentication';
import { useOrganization } from '../organization/hooks/useOrganization';
import {
  EMPTY,
  clearConversation,
  conversationKey,
  historyFor,
  openConversation,
  saveConversation,
  type AssistantTurn,
  type Conversation,
} from './conversation';

/** `sessionStorage`, or `null` where the browser refuses it. */
function sessionStore(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export interface AssistantConversation extends Conversation {
  /** An answer is arriving. */
  streaming: boolean;
  /**
   * Starts a turn: returns the `history` to send with `message` (Core keeps none), then shows the
   * question and an empty answer to fill with `appendAnswer`.
   */
  ask(message: string): AssistantTurn[];
  /** Adds text to the answer being streamed. */
  appendAnswer(text: string): void;
  /** The answer ended, with text or without (a limit or a refusal). */
  finish(): void;
  /** "New conversation". */
  reset(): void;
}

/**
 * The assistant panel's conversation for the current user and organization (OCT-309), kept in
 * `sessionStorage` so it survives a reload and moving between pages. Mount the panel in the
 * organization's layout, not in a page, so navigating doesn't unmount it mid-answer. Switching
 * organization starts afresh (the previous one is cleared), and sign-out clears every conversation
 * (`clearAllConversations` in `Root.tsx`).
 */
export function useAssistantConversation(): AssistantConversation {
  const { identity } = useAuth();
  const { organizationId } = useOrganization();
  const key = conversationKey(identity?.user.id ?? 'signed-out', organizationId);
  const [state, setState] = useState(() => ({
    key,
    ...openConversation(sessionStore(), key),
    streaming: false,
  }));
  // Another organization or user in the same mounted panel: load that one instead.
  let current = state;
  if (state.key !== key) {
    current = { key, ...openConversation(sessionStore(), key), streaming: false };
    setState(current);
  }

  const update = useCallback(
    (change: (turns: AssistantTurn[]) => AssistantTurn[], streaming: boolean) =>
      setState((previous) => {
        const turns = change(previous.turns);
        saveConversation(sessionStore(), previous.key, turns, streaming);
        return { ...previous, turns, streaming, interrupted: false };
      }),
    [],
  );

  const ask = useCallback(
    (message: string) => {
      const history = historyFor(current.turns, message);
      update(
        (turns) => [
          ...turns,
          { role: 'user', text: message.trim() },
          { role: 'assistant', text: '' },
        ],
        true,
      );
      return history;
    },
    [current.turns, update],
  );

  const appendAnswer = useCallback(
    (text: string) =>
      update((turns) => {
        const last = turns.at(-1);
        if (last?.role !== 'assistant') return [...turns, { role: 'assistant', text }];
        return [...turns.slice(0, -1), { role: 'assistant', text: last.text + text }];
      }, true),
    [update],
  );

  const finish = useCallback(() => update((turns) => turns, false), [update]);

  const reset = useCallback(() => {
    clearConversation(sessionStore(), current.key);
    setState({ key: current.key, ...EMPTY, streaming: false });
  }, [current.key]);

  return useMemo(
    () => ({
      turns: current.turns,
      interrupted: current.interrupted,
      streaming: current.streaming,
      ask,
      appendAnswer,
      finish,
      reset,
    }),
    [current.turns, current.interrupted, current.streaming, ask, appendAnswer, finish, reset],
  );
}
