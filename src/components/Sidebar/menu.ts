import { IReqoreMenuDividerProps } from '@qoretechnologies/reqore/dist/components/Menu/divider';
import { IReqoreMenuItemProps } from '@qoretechnologies/reqore/dist/components/Menu/item';
import { map } from 'lodash';
import { Link } from 'react-router-dom';
import { interfaceIcons } from '../../constants/interfaces';
import { TQorusInterfaceCount } from '../../containers/InterfacesView';
export interface IMenuItem extends IReqoreMenuItemProps {
  submenu?: TMenuItem[];
  activePaths?: string[];
  to?: string;
  href?: string;
}

export type TMenuItem =
  | IMenuItem
  | ({ divider: true } & IReqoreMenuDividerProps);
export type TMenu = TMenuItem[];

export const buildMenu = (interfaces: TQorusInterfaceCount): TMenu => [
  {
    label: 'Developer Portal',
    icon: 'CodeBoxLine',

    to: '/',
    activePaths: ['/', '/ide'],
    id: 'ide',
    as: Link,
    submenu: map(
      interfaces,
      (item, id): TMenuItem => ({
        label: item.display_name,
        icon: interfaceIcons[id],
        to: `/Interfaces/${id}`,
        badge: [item.items + item.drafts],
        tooltip: {
          content: item.short_desc,
          maxWidth: '400px',
          delay: 300,
        },
        wrap: false,
        activePaths: [`/Interfaces/${id}`],
        as: Link,
        id: id,
      })
    ),
  },
  {
    divider: true,
  },
  {
    label: 'Operational Dashboard',
    icon: 'Home2Fill',
    href: '/dashboard',
    activePaths: ['/dashboard'],
    id: 'dashboard',
    as: 'a',
  },
  {
    label: 'Operational Interfaces',
    id: 'interfaces',
    icon: 'LayoutMasonryFill',
    submenu: [
      {
        label: 'Workflows',
        icon: 'ExchangeLine',
        href: '/workflows',
        activePaths: ['/workflow', '/order'],
        id: 'workflows',
        as: 'a',
      },
      {
        label: 'Services',
        icon: 'GitMergeLine',
        href: '/services',
        activePaths: ['/service'],
        id: 'services',
        as: 'a',
      },
      {
        label: 'Jobs',
        icon: 'CalendarLine',
        href: '/jobs',
        activePaths: ['/job'],
        id: 'jobs',
        as: 'a',
      },
      {
        label: 'Groups',
        icon: 'BubbleChartFill',
        href: '/groups',
        activePaths: ['/groups'],
        id: 'groups',
        as: 'a',
      },
      {
        label: 'Connections',
        icon: 'StackshareLine',
        href: '/remote',
        activePaths: ['/remote'],
        id: 'remote',
        as: 'a',
      },
      {
        label: 'Search',
        icon: 'SearchLine',
        href: '/search',
        activePaths: ['/search'],
        id: 'search',
        as: 'a',
      },
    ],
  },
  {
    label: 'Global',
    icon: 'LayoutGridFill',
    activePaths: [
      '/rbac',
      '/valuemaps',
      '/slas',
      '/sla',
      '/releases',
      '/errors',
    ],
    id: 'global',
    submenu: [
      {
        label: 'RBAC',
        icon: 'GroupLine',
        href: '/rbac',
        activePaths: ['/rbac'],
        id: 'rbac',
        as: 'a',
      },
      {
        label: 'Valuemaps',
        icon: 'MapLine',
        href: '/valuemaps',
        activePaths: ['/valuemaps'],
        id: 'valuemaps',
        as: 'a',
      },
      {
        label: 'SLAs',
        icon: 'TimeLine',
        href: '/slas',
        activePaths: ['/slas', '/sla'],
        id: 'slas',
        as: 'a',
      },
      {
        label: 'Releases',
        icon: 'InstallLine',
        href: '/releases',
        activePaths: ['/releases'],
        id: 'releases',
        as: 'a',
      },
      {
        label: 'Errors',
        icon: 'ErrorWarningLine',
        href: '/errors',
        activePaths: ['/errors'],
        id: 'errors',
        as: 'a',
      },
      {
        label: 'Types',
        icon: 'Key2Fill',
        href: '/types',
        activePaths: ['/types'],
        id: 'types',
        as: 'a',
      },
    ],
  },
  {
    label: 'System',
    icon: 'Settings2Line',
    activePaths: ['/system'],
    id: 'system',
    submenu: [
      {
        label: 'Alerts',
        icon: 'AlarmWarningLine',
        href: '/system/alerts',
        activePaths: ['/system/alerts'],
        id: 'alerts',
        as: 'a',
      },
      {
        label: 'Cluster',
        icon: 'GridFill',
        href: '/system/cluster',
        activePaths: ['/system/cluster'],
        id: 'cluster',
        as: 'a',
      },
      {
        label: 'Order Stats',
        icon: 'PieChartLine',
        href: '/system/orderStats',
        activePaths: ['/system/orderStats'],
        id: 'orderstats',
        as: 'a',
      },
      {
        label: 'Options',
        icon: 'SettingsLine',
        href: '/system/options',
        activePaths: ['/system/options'],
        id: 'options',
        as: 'a',
      },
      {
        label: 'Properties',
        icon: 'StackLine',
        href: '/system/props',
        activePaths: ['/system/props'],
        id: 'props',
        as: 'a',
      },
      {
        label: 'Cache',
        icon: 'DatabaseLine',
        href: '/system/sqlcache',
        activePaths: ['/system/sqlcache'],
        id: 'sqlcache',
        as: 'a',
      },
      {
        label: 'HTTP Services',
        icon: 'GlobeLine',
        href: '/system/http',
        activePaths: ['/system/http'],
        id: 'http',
        as: 'a',
      },
      {
        label: 'Config Items',
        icon: 'Settings6Line',
        href: '/system/config-items',
        activePaths: ['/system/config-items'],
        id: 'config-items',
        as: 'a',
      },
    ],
  },
  {
    label: 'More',
    icon: 'MoreFill',
    activePaths: ['/ocmd', '/library', '/extensions', '/logs', '/info'],
    id: 'more',
    submenu: [
      {
        label: 'OCMD',
        icon: 'TerminalLine',
        href: '/ocmd',
        activePaths: ['/ocmd'],
        id: 'ocmd',
        as: 'a',
      },
      {
        label: 'Library',
        icon: 'Book3Line',
        href: '/library',
        activePaths: ['/library'],
        id: 'library',
        as: 'a',
      },
      {
        label: 'Extensions',
        icon: 'AppsLine',
        href: '/extensions',
        activePaths: ['/extensions'],
        id: 'extensions',
        as: 'a',
      },
      {
        label: 'Logs',
        icon: 'FileTextLine',
        href: '/logs',
        activePaths: ['/logs'],
        id: 'logs',
        as: 'a',
      },
      {
        label: 'Info',
        icon: 'InformationLine',
        href: '/info',
        activePaths: ['/info'],
        id: 'info',
        as: 'a',
      },
    ],
  },
];
