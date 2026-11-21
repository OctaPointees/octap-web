import { Toast } from '@base-ui/react/toast';

/** The one toast queue for an app: `ToasterProvider` renders it, `notify` adds to it. */
export const toastManager = Toast.createToastManager();

/** Any error carrying an HTTP status, such as the SDK's `OctapError` (null when offline). */
const statusOf = (error: unknown) => {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === 'number' ? status : undefined;
};

/** Short-lived results of an action. Page-blocking problems belong inline, not here. */
export const notify = {
  success: (title: string, description?: string) =>
    toastManager.add({ title, description, type: 'success' }),
  info: (title: string, description?: string) =>
    toastManager.add({ title, description, type: 'info' }),
  error: (error: unknown, title = 'Something went wrong') => {
    const status = statusOf(error);
    return toastManager.add({
      title: status ? `${title} (${status})` : title,
      description: error instanceof Error ? error.message : String(error),
      type: 'error',
      priority: 'high',
    });
  },
};
