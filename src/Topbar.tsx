import {
  ReqoreButton,
  ReqoreControlGroup,
  ReqoreHeader,
  ReqoreNavbarGroup,
  ReqoreNavbarItem,
} from '@qoretechnologies/reqore';
import { GlobalSearch } from './components/GlobalSearch';
import { useQorusStorage } from './hooks/useQorusStorage';

export const Topbar = () => {
  const [isSidebarOpen, update] = useQorusStorage<boolean>(
    'sidebar-open',
    true
  );

  return (
    <ReqoreHeader>
      <ReqoreNavbarGroup position='left'>
        <ReqoreNavbarItem>
          {isSidebarOpen === false && (
            <ReqoreButton
              compact
              minimal
              flat
              icon='SideBarFill'
              onClick={() => update(true)}
              tooltip='Show sidebar'
            />
          )}
          <img
            src={`${process.env.PUBLIC_URL}/logo.png`}
            style={{
              padding: '14px 0px 10px 5px',
              verticalAlign: 'middle',
              height: '48px',
              display: 'inline-block !important',
            }}
          />
        </ReqoreNavbarItem>
      </ReqoreNavbarGroup>
      <ReqoreNavbarGroup position='right'>
        <ReqoreNavbarItem>
          <ReqoreControlGroup>
            <GlobalSearch />
            <ReqoreButton
              icon='UserFill'
              minimal
              flat
              as='a'
              href='/user'
              tooltip='User Settings'
            />
          </ReqoreControlGroup>
        </ReqoreNavbarItem>
      </ReqoreNavbarGroup>
    </ReqoreHeader>
  );
};
