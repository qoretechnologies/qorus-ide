import {
  ReqoreButton,
  ReqoreH3,
  ReqoreIcon,
  ReqorePanel,
} from '@qoretechnologies/reqore';
import timeago from 'epoch-timeago';
import { useContext, useEffect, useState } from 'react';
import { interfaceIcons } from '../../constants/interfaces';
import { IQorusListInterface } from '../../containers/InterfacesView';
import { InitialContext } from '../../context/init';
import { addMessageListener } from '../../hocomponents/withMessageHandler';
import { useFetchInterfaces } from '../../hooks/useFetchInterfaces';

export const DashboardStatus = () => {
  const { changeTab } = useContext(InitialContext);
  const { loading, value } = useFetchInterfaces('fsm');
  const [latestWithError, setLatestWithError] =
    useState<IQorusListInterface>(undefined);

  useEffect(() => {
    const latest = value
      .filter((item) => !!item.data?.last_error)
      .sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })[0];

    setLatestWithError(latest);

    const listener = addMessageListener(
      'SUBSCRIPTION-EVENT',
      ({ data }) => {
        if (data?.event_id === 'FSM_EXEC_RESULT') {
          if (data.event_data.info.error) {
            setLatestWithError({
              id: data.event_data.info.id,
              label: data.event_data.info.label,
              type: 'fsm',
              data: {
                id: data.event_data.info.id,
                last_error: data.event_data.info.error,
                last_executed: Math.floor(
                  new Date(data.event_data.time).getTime()
                ),
              },
            });
          }
        }
      },
      true
    );

    return () => {
      listener();
    };
  }, [value]);

  if (loading) {
    return null;
  }

  return (
    <ReqorePanel
      icon={latestWithError ? 'ErrorWarningFill' : undefined}
      customTheme={{ main: 'main' }}
      minimal
      fill
      contentEffect={{
        gradient: {
          type: 'radial',
          shape: 'ellipse',
          colors: {
            100: `${latestWithError ? 'danger:darken:1:0.5' : '#023a27'}`,
            0: 'main',
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
      label={latestWithError ? 'Error Found' : undefined}
      headerEffect={{
        gradient: {
          colors: {
            0: '#f39999',
            50: '#ff0000',
            100: '#cf8484',
          },
          animationSpeed: 5,
          animate: 'hover',
        },
      }}
    >
      {latestWithError ? (
        // Monospace font
        <ReqoreButton
          compact
          icon={interfaceIcons[latestWithError.type]}
          description={`"${latestWithError.data.last_error}"`}
          customTheme={{ main: '#c33e3e:darken:3:0.1' }}
          badge={{
            label: timeago(latestWithError.data.last_executed),
            align: 'right',
          }}
          onClick={() =>
            changeTab(
              'CreateInterface',
              latestWithError.type,
              latestWithError.data.id
            )
          }
          flat={false}
        >
          {latestWithError.label}
        </ReqoreButton>
      ) : (
        <ReqoreH3>
          <ReqoreIcon icon='CheckDoubleFill' margin='right' intent='success' />{' '}
          No problems detected
        </ReqoreH3>
      )}
    </ReqorePanel>
  );
};
