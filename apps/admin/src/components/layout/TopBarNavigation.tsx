import { MagnifyingGlass, Minus, Plus, SignOut, Square, User, type Icon } from 'phosphor-react';

import { Button } from '@octap/shared/components';
import { PageLogo } from '../shared/PageLogo';
import { NavLink } from 'react-router';
import { cn, wait } from '@octap/shared/utils';
import { Input, Menu } from '@base-ui/react';

import { useRef, useState } from 'react';
import { useAuth } from '@octap/shared/authentication';

const NAV_CLSS = {
  nav: 'btn btn-block btn-soft text-right h-full overflow-hidden py-1 gap-4 group-hover:translate-y-0 transition-all',
};

export type NavOption = {
  label: string;
  path: string;
  icon: Icon;
  /** Count badge, e.g. items awaiting review. */
  badge?: number;
  end?: boolean;
};

type Props = {
  subtitle?: string;
  options: NavOption[];
  footer?: React.ReactNode;
};

export function TopBarNavigation(props: Props) {
  const { subtitle, options } = props;

  return (
    <div className="flex items-center h-20 gap-4 p-4 group">
      <PageLogo subtitle={subtitle} className="w-80" />

      <nav className="flex items-center flex-1 h-full gap-2 overflow-y-hidden">
        {options.map((opt) => {
          const Icon = opt.icon ?? Square;

          return (
            <NavLink to={opt.path} className="flex-1 h-full max-w-60">
              {({ isActive }) => (
                <span
                  className={cn(NAV_CLSS.nav, {
                    'btn-primary btn-active': isActive,
                  })}
                >
                  <Icon size="2em" weight={isActive ? 'fill' : 'bold'} />
                  <span className="flex-1">{opt.label}</span>
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <SearchBar />
    </div>
  );
}

function SearchBar() {
  const inpRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [focus, setFocus] = useState(false);

  const focusInput = () => {
    inpRef.current?.focus();
  };

  const showInput = query.length || focus;

  return (
    <div className="h-full gap-0 p-0 input input-ghost group w-fit">
      <Button
        className={cn('h-full btn-primary btn-soft', { 'rounded-r-none btn-active': showInput })}
        onClick={focusInput}
      >
        <MagnifyingGlass size="1.5em" />
      </Button>

      <Input
        placeholder="Search . . ."
        className={cn('min-w-0 w-0 p-0 transition-all rounded-r-field', {
          'px-3 w-64 border border-primary': showInput,
        })}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        ref={inpRef}
        value={query}
        onValueChange={setQuery}
      />

      <AccountInfo />
    </div>
  );
}

const ACC_CLSS = {
  Trigger:
    'size-12 ml-4 outline-2 outline-base-300 hover:outline-primary rounded-box overflow-hidden cursor-pointer transition-all',
  Item: 'btn p-3 text-left! h-auto',
  Popup: 'menu bg-base-200 w-92 border-1 border-base-300 rounded-field shadow-lg',
  Separator: 'divider my-0',
};

function AccountInfo() {
  const user = useAuth().identity?.user;

  // useEffect(() => {
  //   client.console.me().then((res) => {
  //     const { data } = res;
  //     setUser(data?.data ?? null);
  //   });
  // }, [client]);

  if (user == null) {
    return <div className={ACC_CLSS.Trigger}></div>;
  }

  // if (user === 0) {
  //   return (
  //     <div className={styles.Trigger}>
  //       <div className="flex items-center justify-center size-full">
  //         <span className="loading"></span>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <Menu.Root>
      <Menu.Trigger>
        <div className={ACC_CLSS.Trigger}>
          <div className="flex items-center justify-center size-full">
            <User size="2em" />
          </div>
        </div>
      </Menu.Trigger>

      <Menu.Portal className="">
        <Menu.Positioner sideOffset={8} align="start">
          <Menu.Popup className={ACC_CLSS.Popup}>
            <div className="p-2 truncate">
              <div className="font-bold">
                {user.fullName} ({user.systemRole})
              </div>
              <div>{user.email}</div>
            </div>

            {/* <Menu.Item className={styles.Item}>
              <div className="flex-1">View Profile</div>
              <User size="1.5em" />
            </Menu.Item> */}
            <ZoomAdjustMenuItem />
            <Menu.Separator className={ACC_CLSS.Separator} />
            <LogoutButton />
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function ZoomAdjustMenuItem() {
  const VAR = '--global-font-size';
  const ROOT = document.documentElement;
  const MIN = 12;
  const MAX = 20;

  const getSizeFromVar = () => {
    const size = Number(getComputedStyle(ROOT).getPropertyValue(VAR));
    return isNaN(size) ? 16 : size;
  };

  const [size, setSize] = useState(() => getSizeFromVar());

  const update = (v = 16) => [ROOT.style.setProperty(VAR, v + ''), v][1] as number;
  const clamp = (v: number) => (v < MIN ? MIN : v > MAX ? MAX : v);
  const inc = () => setSize(update(clamp(size + 1)));
  const dec = () => setSize(update(clamp(size - 1)));

  return (
    <Menu.Item className={'p-2 flex items-center'} closeOnClick={false}>
      <div className="flex-1">
        Font Size ({MIN} - {MAX})
      </div>

      <div className="*:btn-sm flex items-center">
        <Button children={<Minus />} className="btn-soft" onClick={dec} />
        <div className="pointer-events-none btn">{size}</div>
        <Button children={<Plus />} className="btn-soft" onClick={inc} />
      </div>
    </Menu.Item>
  );
}

function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const { signOut } = useAuth();

  const logout = async () => {
    setLoading(true);
    wait(1000 + Math.random() * 1000).then(signOut);
  };

  return (
    <Menu.Item
      render={() => (
        <Button className="btn-error" onClick={logout} icon={SignOut} loading={loading}>
          Log out
        </Button>
      )}
    ></Menu.Item>
  );
}
