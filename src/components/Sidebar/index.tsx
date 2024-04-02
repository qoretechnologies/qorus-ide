import {
  ReqoreButton,
  ReqoreControlGroup,
  ReqoreInput,
  ReqoreMenuDivider,
  ReqoreMenuItem,
  ReqoreMenuSection,
} from '@qoretechnologies/reqore';
import ReqoreMenu, {
  IReqoreMenuProps,
} from '@qoretechnologies/reqore/dist/components/Menu';
import { map, reduce, size } from 'lodash';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useContextSelector } from 'use-context-selector';
import { InterfacesContext } from '../../context/interfaces';
import { useQorusStorage } from '../../hooks/useQorusStorage';
import { TMenu, TMenuItem, buildMenu } from './menu';

export interface ISidebar extends Partial<IReqoreMenuProps> {
  isOpen?: boolean;
  onHideClick?: () => void;
}

export const Sidebar = (props: ISidebar) => {
  const location = useLocation();
  const navigate = useNavigate();
  const categories = useContextSelector(
    InterfacesContext,
    (value) => value.categories
  );
  const menu: TMenu = buildMenu(categories, navigate);
  const [query, setQuery] = useState<string>(undefined);

  const [isSidebarOpen, update] = useQorusStorage<boolean>(
    'sidebar-open',
    true
  );

  const renderMenuItem = (menuData: TMenuItem, menuId: number) => {
    if ('divider' in menuData) {
      return <ReqoreMenuDivider key={menuId} />;
    }

    const matchesPath = menuData.activePaths?.some((path) =>
      location.pathname.startsWith(path)
    );

    if (menuData.submenu) {
      return (
        <ReqoreMenuSection
          label={menuData.label}
          key={menuId}
          icon={menuData.icon}
          isCollapsed={!query && !matchesPath}
          verticalPadding='tiny'
        >
          {map(menuData.submenu, (submenuData, submenuId) =>
            renderMenuItem(submenuData, submenuId)
          )}
        </ReqoreMenuSection>
      );
    }

    return (
      <ReqoreMenuItem
        key={menuId}
        label={menuData.label}
        icon={menuData.icon}
        as={menuData.as}
        tooltip={menuData.label.toString()}
        verticalPadding='tiny'
        selected={matchesPath}
        {...menuData}
      />
    );
  };

  const filteredMenu: TMenu = useMemo<TMenu>(() => {
    if (!query) {
      return menu;
    }

    const filterItems = (items: TMenu): TMenu => {
      return reduce(
        items,
        (acc, item) => {
          if ('divider' in item) {
            acc.push(item);
            return acc;
          }

          if (item.submenu) {
            const submenu = filterItems(item.submenu);
            const hasChildMatch = size(submenu);

            if (hasChildMatch) {
              acc.push({
                ...item,
                submenu,
              });

              return acc;
            }
          }

          if (
            item.label.toString().toLowerCase().includes(query.toLowerCase())
          ) {
            acc.push(item);
          }

          return acc;
        },
        []
      );
    };

    return filterItems(menu);
  }, [menu, query]);

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <ReqoreMenu
      {...props}
      width='250px'
      minimal
      position='left'
      rounded={false}
      customTheme={{ main: '#181818' }}
    >
      <ReqoreControlGroup>
        <ReqoreInput
          icon='Search2Line'
          minimal={false}
          flat={false}
          placeholder='Filter menu "/"'
          intent={query ? 'info' : 'muted'}
          leftIconProps={{ size: 'small' }}
          iconColor={query ? 'info' : 'muted'}
          pill
          value={query}
          onClearClick={() => setQuery('')}
          onChange={(e: any) => setQuery(e.target.value)}
          focusRules={{
            shortcut: '/',
            type: 'keypress',
            clearOnFocus: true,
            doNotInsertShortcut: true,
          }}
        />
        <ReqoreButton
          icon='SideBarLine'
          fixed
          minimal={false}
          onClick={() => update(false)}
        />
      </ReqoreControlGroup>
      {map(filteredMenu, (menuData, menuId) =>
        renderMenuItem(menuData, menuId)
      )}
    </ReqoreMenu>
  );
};
