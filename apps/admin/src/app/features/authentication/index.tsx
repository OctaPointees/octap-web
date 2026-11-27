import { LeftPanel, SignInPanel } from './components';

export default function AdminAuthentication() {
  return (
    <div
      className="screen-wrapper flex gap-8 flex-col place-center overflow-y-auto bg-contain bg-no-repeat rounded-box"
      style={{
        backgroundImage: `
            url('/illustrations/server.png'), 
            linear-gradient(180deg, #0000, #0000, var(--color-base-200), color-mix(in oklab, var(--color-primary), #0000 80%))
        `,
      }}
    >
      <div className="flex-1"></div>

      <div className="flex w-full max-w-310 min-h-120 rounded-box border-8 border-base-100/40 p-8 pt-12 backdrop-blur-2xl bg-base-100/87">
        <LeftPanel />
        <div className="w-12"></div>
        <SignInPanel />
      </div>

      <div className="flex-1"></div>

      <div className="text-base-content/67 text-center py-8">
        <div className="font-bold">
          Version 1.0.0 | <span>ENV_{import.meta.env['VITE_ENVIRONMENT'] ?? 'UNKNOWN'}</span>
        </div>
      </div>
    </div>
  );
}
