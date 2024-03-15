import {
  IQorusSidebarItem,
  IQorusSidebarItems,
} from '@qoretechnologies/reqore/dist/components/Sidebar';
import { map } from 'lodash';
import { Link } from 'react-router-dom';
import { interfaceIcons } from '../../constants/interfaces';
import { TQorusInterfaceCount } from '../../containers/InterfacesView';

export const buildMenu = (
  interfaces: TQorusInterfaceCount
): IQorusSidebarItems => ({
  IDE: {
    items: [
      {
        name: 'Developer Portal',
        icon: 'CodeBoxLine',
        props: {
          to: '/',
        },
        activePaths: ['/', '/ide'],
        id: 'ide',
        as: Link,
        submenu: map(
          interfaces,
          (item, id): IQorusSidebarItem => ({
            name: item.display_name,
            icon: interfaceIcons[id],
            props: {
              to: `/Interfaces/${id}`,
            },
            activePaths: [`/Interfaces/${id}`],
            as: Link,
            id: id,
          })
        ),
      },
    ],
  },
  Dashboard: {
    items: [
      {
        name: 'Operational Dashboard',
        icon: 'Home2Fill',
        props: {
          href: '/dashboard',
        },
        activePaths: ['/dashboard'],
        id: 'dashboard',
        as: 'a',
      },
    ],
  },
  Interfaces: {
    items: [
      {
        name: 'Operational Interfaces',
        id: 'interfaces',
        icon: 'LayoutMasonryFill',
        submenu: [
          {
            name: 'Workflows',
            icon: 'ExchangeLine',
            props: {
              href: '/workflows',
            },
            activePaths: ['/workflow', '/order'],
            id: 'workflows',
            as: 'a',
          },
          {
            name: 'Services',
            icon: 'GitMergeLine',
            props: {
              href: '/services',
            },
            activePaths: ['/service'],
            id: 'services',
            as: 'a',
          },
          {
            name: 'Jobs',
            icon: 'CalendarLine',
            props: {
              href: '/jobs',
            },
            activePaths: ['/job'],
            id: 'jobs',
            as: 'a',
          },
          {
            name: 'Groups',
            icon: 'BubbleChartFill',
            props: {
              href: '/groups',
            },
            activePaths: ['/groups'],
            id: 'groups',
            as: 'a',
          },
          {
            name: 'Connections',
            icon: 'StackshareLine',
            props: {
              href: '/remote',
            },
            activePaths: ['/remote'],
            id: 'remote',
            as: 'a',
          },
          {
            name: 'Search',
            icon: 'SearchLine',
            props: {
              href: '/search',
            },
            activePaths: ['/search'],
            id: 'search',
            as: 'a',
          },
        ],
      },
    ],
  },
  Global: {
    items: [
      {
        name: 'Global',
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
            name: 'RBAC',
            icon: 'GroupLine',
            props: {
              href: '/rbac',
            },
            activePaths: ['/rbac'],
            id: 'rbac',
            as: 'a',
          },
          {
            name: 'Valuemaps',
            icon: 'MapLine',
            props: {
              href: '/valuemaps',
            },
            activePaths: ['/valuemaps'],
            id: 'valuemaps',
            as: 'a',
          },
          {
            name: 'SLAs',
            icon: 'TimeLine',
            props: {
              href: '/slas',
            },
            activePaths: ['/slas', '/sla'],
            id: 'slas',
            as: 'a',
          },
          {
            name: 'Releases',
            icon: 'InstallLine',
            props: {
              href: '/releases',
            },
            activePaths: ['/releases'],
            id: 'releases',
            as: 'a',
          },
          {
            name: 'Errors',
            icon: 'ErrorWarningLine',
            props: {
              href: '/errors',
            },
            activePaths: ['/errors'],
            id: 'errors',
            as: 'a',
          },
          {
            name: 'Types',
            icon: 'Key2Fill',
            props: {
              href: '/types',
            },
            activePaths: ['/types'],
            id: 'types',
            as: 'a',
          },
        ],
      },
    ],
  },
  System: {
    items: [
      {
        name: 'System',
        icon: 'Settings2Line',
        activePaths: ['/system'],
        id: 'system',
        submenu: [
          {
            name: 'Alerts',
            icon: 'AlarmWarningLine',
            props: {
              href: '/system/alerts',
            },
            activePaths: ['/system/alerts'],
            id: 'alerts',
            as: 'a',
          },
          {
            name: 'Cluster',
            icon: 'GridFill',
            props: {
              href: '/system/cluster',
            },
            activePaths: ['/system/cluster'],
            id: 'cluster',
            as: 'a',
          },
          {
            name: 'Order Stats',
            icon: 'PieChartLine',
            props: {
              href: '/system/orderStats',
            },
            activePaths: ['/system/orderStats'],
            id: 'orderstats',
            as: 'a',
          },
          // { name: 'Providers', icon: 'settings', link: '/system/providers' },
          {
            name: 'Options',
            icon: 'SettingsLine',
            props: {
              href: '/system/options',
            },
            activePaths: ['/system/options'],
            id: 'options',
            as: 'a',
          },
          {
            name: 'Properties',
            icon: 'StackLine',
            props: {
              href: '/system/props',
            },
            activePaths: ['/system/props'],
            id: 'props',
            as: 'a',
          },
          {
            name: 'Cache',
            icon: 'DatabaseLine',
            props: {
              href: '/system/sqlcache',
            },
            activePaths: ['/system/sqlcache'],
            id: 'sqlcache',
            as: 'a',
          },
          {
            name: 'HTTP Services',
            icon: 'GlobeLine',
            props: {
              href: '/system/http',
            },
            activePaths: ['/system/http'],
            id: 'http',
            as: 'a',
          },
          {
            name: 'Config Items',
            icon: 'Settings6Line',
            props: {
              href: '/system/config-items',
            },
            activePaths: ['/system/config-items'],
            id: 'config-items',
            as: 'a',
          },
        ],
      },
    ],
  },
  Other: {
    items: [
      {
        name: 'More',
        icon: 'MoreFill',
        activePaths: ['/ocmd', '/library', '/extensions', '/logs', '/info'],
        id: 'more',
        submenu: [
          {
            name: 'OCMD',
            icon: 'TerminalLine',
            props: { href: '/ocmd' },
            activePaths: ['/ocmd'],
            id: 'ocmd',
            as: 'a',
          },
          {
            name: 'Library',
            icon: 'Book3Line',
            props: {
              href: '/library',
            },
            activePaths: ['/library'],
            id: 'library',
            as: 'a',
          },
          {
            name: 'Extensions',
            icon: 'AppsLine',
            props: {
              href: '/extensions',
            },
            activePaths: ['/extensions'],
            id: 'extensions',
            as: 'a',
          },
          {
            name: 'Logs',
            icon: 'FileTextLine',
            props: {
              href: '/logs',
            },
            activePaths: ['/logs'],
            id: 'logs',
            as: 'a',
          },
          {
            name: 'Info',
            icon: 'InformationLine',
            props: {
              href: '/info',
            },
            activePaths: ['/info'],
            id: 'info',
            as: 'a',
          },
        ],
      },
    ],
  },
});
