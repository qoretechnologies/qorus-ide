import {
  ReqoreColumn,
  ReqoreColumns,
  ReqoreMenu,
  ReqoreMenuDivider,
  ReqoreMenuItem,
  ReqorePanel,
  useReqoreProperty,
} from '@qoretechnologies/reqore';
import epochTimeago from 'epoch-timeago';
import { useContext, useState } from 'react';
import { QodexTestRunModal } from '../../containers/InterfaceCreator/fsm/TestRunModal';
import { InitialContext } from '../../context/init';
import { useFetchInterfaces } from '../../hooks/useFetchInterfaces';

export const DashboardQogPanel = () => {
  const { changeTab } = useContext(InitialContext);
  const addModal = useReqoreProperty('addModal');
  const [testRunId, setTestRunId] = useState<{
    id: string | number;
    label: string;
  }>(undefined);
  const { loading, value } = useFetchInterfaces('fsm');

  if (loading) {
    return null;
  }

  const latest = value
    .sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, 5);

  const next = value
    .filter((item) => !!item.data?.next)
    .sort((a, b) => {
      return new Date(b.data.next).getTime() - new Date(a.data.next).getTime();
    })
    .slice(0, 5);

  const runnable = value
    .filter(
      (item) =>
        item.data && (item.data?.on_demand || item.data?.type !== 'event')
    )
    .sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, 5);

  return (
    <ReqorePanel
      customTheme={{ main: '#000000' }}
      minimal
      contentEffect={{
        gradient: {
          type: 'radial',
          shape: 'ellipse',
          //direction: 'to right bottom',
          colors: {
            0: 'main',

            170: '#4f0f68',
          },
          animate: 'hover',
          animationSpeed: 5,
        },
      }}
      contentStyle={{
        display: 'flex',
        flexFlow: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      label='Automations'
      headerEffect={{
        gradient: {
          colors: {
            0: '#832ba7',
            50: '#bd2ff6',
            100: '#5e336f',
          },
          animationSpeed: 5,
          animate: 'always',
        },
        textSize: '40px',
      }}
      actions={[
        {
          label: 'Create New',
          icon: 'AddLine',
          customTheme: { main: '#4f0f68:darken:2:0.7' },
          flat: true,
          onClick: () => changeTab('CreateInterface', 'fsm'),
        },
      ]}
    >
      <ReqoreColumns style={{ width: '100%' }}>
        <ReqoreColumn>
          <ReqoreMenu
            padded={false}
            transparent
            width='100%'
            customTheme={{ main: '#4f0f68:darken:2:0.3' }}
          >
            <ReqoreMenuDivider
              label='Latest'
              align='left'
              padded='top'
              margin='left'
            />
            {latest.map((item) => (
              <ReqoreMenuItem
                compact
                badge={{ label: epochTimeago(item.date), align: 'right' }}
                key={item.id}
                onClick={() => changeTab('CreateInterface', 'fsm', item.id)}
              >
                {item.label}
              </ReqoreMenuItem>
            ))}
          </ReqoreMenu>
        </ReqoreColumn>
        <ReqoreColumn>
          <ReqoreMenu
            padded={false}
            transparent
            style={{ paddingLeft: '5px' }}
            width='100%'
            customTheme={{ main: '#4f0f68:darken:2:0.3' }}
          >
            <ReqoreMenuDivider
              label='Upcoming'
              align='left'
              padded='top'
              margin='left'
            />
            {next.map((item) => (
              <ReqoreMenuItem
                compact
                badge={{ label: epochTimeago(item.data.next), align: 'right' }}
                key={item.id}
                onClick={() => changeTab('CreateInterface', 'fsm', item.id)}
              >
                {item.label}
              </ReqoreMenuItem>
            ))}
          </ReqoreMenu>
        </ReqoreColumn>
        <ReqoreColumn>
          <ReqoreMenu
            padded={false}
            transparent
            style={{ paddingLeft: '5px' }}
            width='100%'
            customTheme={{ main: '#4f0f68:darken:2:0.3' }}
          >
            <ReqoreMenuDivider
              label='Run Now'
              align='left'
              padded='top'
              margin='left'
            />
            {runnable.map((item) => (
              <ReqoreMenuItem
                compact
                badge={{ label: epochTimeago(item.date), align: 'right' }}
                key={item.id}
                onClick={() => changeTab('CreateInterface', 'fsm', item.id)}
                rightIcon='PlayLine'
                onRightIconClick={() => {
                  setTestRunId({ id: item.id, label: item.data?.display_name });
                }}
              >
                {item.label}
              </ReqoreMenuItem>
            ))}
          </ReqoreMenu>
        </ReqoreColumn>
      </ReqoreColumns>
      {testRunId && (
        <QodexTestRunModal
          label={`Execution of "${testRunId.label}"`}
          id={testRunId.id}
          isOpen
          onClose={() => setTestRunId(undefined)}
          liveRun
        />
      )}
    </ReqorePanel>
  );
};
