import { Button } from '@octap/shared/components';
import { ArrowLeft, WarningOctagon } from 'phosphor-react';
import { NavLink } from 'react-router';

export function NotFoundTemplate() {
  return (
    <div className="screen-wrapper flex place-center">
      <div className="flex items-center justify-between max-w-270 w-full p-8">
        <div className="select-none relative">
          <img src="/icons/logo_light.png" className="w-70" />
          <WarningOctagon
            size={100}
            className="text-error absolute bottom-0 right-0 translate-2/3"
            weight="fill"
          />
        </div>

        <div className="flex-col items-end justify-center gap-4 select-none">
          <div className="text-[10rem] font-bold font-mono">[404]</div>

          <div className="text-right">
            <div className="text-2xl text-bold">Sorry, but we couldn't find what you need!</div>
            <div className="text-lg">Please try again later</div>
          </div>

          <div className="h-2"></div>

          <div className="flex gap-2">
            <NavLink to="/">
              <Button icon={ArrowLeft} className="btn-primary">
                Return to Dashboard
              </Button>
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}
