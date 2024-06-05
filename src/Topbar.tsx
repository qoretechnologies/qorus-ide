import {
  ReqoreButton,
  ReqoreControlGroup,
  ReqoreHeader,
  ReqoreModal,
  ReqoreNavbarGroup,
  ReqoreNavbarItem,
} from '@qoretechnologies/reqore';
import { useReqraftStorage } from '@qoretechnologies/reqraft';
import { useState } from 'react';
import { GlobalSearch } from './components/GlobalSearch';
import { GlobalSettings } from './components/GlobalSettings';

export const Topbar = () => {
  const [isSidebarOpen, update] = useReqraftStorage<boolean>(
    'sidebar-open',
    true,
    false
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      {isSettingsOpen && (
        <ReqoreModal
          isOpen
          label='Your application config'
          icon='Settings2Line'
          minimal
          blur={3}
          width='500px'
          onClose={() => setIsSettingsOpen(false)}
        >
          <GlobalSettings />
        </ReqoreModal>
      )}
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
              <ReqoreButton
                icon='SettingsLine'
                minimal
                flat
                tooltip='Application Settings'
                onClick={() => setIsSettingsOpen(true)}
              />
            </ReqoreControlGroup>
          </ReqoreNavbarItem>
        </ReqoreNavbarGroup>
      </ReqoreHeader>
    </>
  );
};
