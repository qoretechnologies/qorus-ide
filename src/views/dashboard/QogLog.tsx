import {
  ReqoreButton,
  ReqoreControlGroup,
  ReqoreH4,
  ReqorePanel,
} from '@qoretechnologies/reqore';
import timeago from 'epoch-timeago';
import { size } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import Loader from '../../components/Loader';
import { InitialContext } from '../../context/init';
import { addMessageListener } from '../../hocomponents/withMessageHandler';
import { useFetchInterfaces } from '../../hooks/useFetchInterfaces';

export interface IQogLogItem {
  fsmid: number | string;
  name: string;
  display_name: string;
  success: boolean;
  exec_time: any;
  exec_timeus?: number;
  error?: string;
  time: any;
}

export const DashboardQogLog = () => {
  const { changeTab } = useContext(InitialContext);
  const [log, setLog] = useState<IQogLogItem[]>([]);
  const { loading, value = [] } = useFetchInterfaces('fsm');

  useEffect(() => {
    if (!loading) {
      if (value) {
        // Get the latest 5 executed qogs
        const latest = value
          .filter((item) => !!item.data?.last_executed)
          .sort((a, b) => {
            return (
              new Date(b.data.last_executed).getTime() -
              new Date(a.data.last_executed).getTime()
            );
          })
          .slice(0, 6);

        setLog(
          latest.map((item) => ({
            fsmid: item.id,
            name: item.label,
            display_name: item.data.display_name,
            success: !item.data.last_error,
            error: item.data.last_error,
            exec_time: item.data.last_executed,
            time: item.data.last_executed,
          }))
        );
      }

      const listener = addMessageListener(
        'SUBSCRIPTION-EVENT',
        ({ data }) => {
          if (
            data?.event_id === 'FSM_EXEC_RESULT' ||
            data?.event_id === 'FSM_EXEC_START'
          ) {
            setLog((prev) => [
              { ...data.event_data.info, time: data.event_data.time },
              ...prev,
            ]);
          }
        },
        true
      );

      return () => {
        listener();
      };
    }
  }, [loading, value]);

  const logs = log.slice(0, 6);

  return (
    <ReqorePanel
      icon='File2Line'
      iconColor='#00a0c0'
      customTheme={{ main: '#000000' }}
      minimal
      fill
      contentEffect={{
        gradient: {
          shape: 'ellipse',
          type: 'radial',
          colors: {
            100: 'main',

            0: '#0d687a',
          },
          animate: 'hover',
          animationSpeed: 5,
        },
      }}
      contentStyle={{
        display: 'flex',
        flexFlow: 'column',
        justifyContent: size(logs) ? undefined : 'center',
        alignItems: 'center',
      }}
      label='Qog Log'
      headerEffect={{
        gradient: {
          colors: {
            0: '#3a6e79',
            50: '#00a0c0',
            100: '#324a4e',
          },
          animationSpeed: 5,
          animate: 'hover',
        },
      }}
    >
      {loading ? (
        <Loader text='Loading...' />
      ) : (
        <>
          {size(logs) ? (
            <ReqoreControlGroup vertical fluid>
              {logs.map((item) => (
                <ReqoreButton
                  compact
                  icon={
                    item.success === false ? 'ErrorWarningLine' : 'CheckLine'
                  }
                  tooltip={{
                    maxWidth: '400px',
                    intent: 'danger',
                    content: item.error,
                  }}
                  label={`${item.display_name} ${
                    item.exec_time ? 'finished' : 'started'
                  } ${item.error ? 'with error' : ''}`}
                  onClick={() =>
                    changeTab('CreateInterface', 'fsm', item.fsmid)
                  }
                  customTheme={{
                    main: `${
                      item.success === false ? 'danger' : 'main'
                    }:darken:3:0.6`,
                  }}
                  badge={{
                    label: timeago(Math.floor(new Date(item.time).getTime())),
                    align: 'right',
                  }}
                />
              ))}
            </ReqoreControlGroup>
          ) : (
            <ReqoreH4 effect={{ opacity: 0.5 }}>Nothing to show yet</ReqoreH4>
          )}
        </>
      )}
    </ReqorePanel>
  );
};
