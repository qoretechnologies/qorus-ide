import { ReqoreMessage, ReqoreTag } from '@qoretechnologies/reqore';
import Push from 'push.js';
import { useContext, useEffect } from 'react';
import { InitialContext } from '../context/init';
import { addMessageListener } from '../hocomponents/withMessageHandler';
import { useQorusStorage } from '../hooks/useQorusStorage';
import Logo from '../images/QorusDeveloperTools_Small.png';

export const NotificationsStatusMessage = () => {
  if (Push.Permission.get() === Push.Permission.GRANTED) {
    return null;
  }

  if (Push.Permission.get() === Push.Permission.DENIED) {
    return (
      <ReqoreMessage intent='danger' opaque={false} margin='bottom'>
        <div>
          Notifications have been denied. You will have to enable them in your
          browser settings to receive notifications about Qog executions.
        </div>
      </ReqoreMessage>
    );
  }

  return (
    <ReqoreMessage intent='info' opaque={false} margin='bottom'>
      <div>
        Notifications have not yet been allowed. Click{' '}
        <ReqoreTag
          size='small'
          fixed
          label='here'
          intent='info'
          onClick={() => Push.Permission.request()}
        />{' '}
        to allow them. You can alternatively enable them in your browser
        settings to receive notifications about Qog executions.
      </div>
    </ReqoreMessage>
  );
};

export const NotificationsHandler = ({ children }) => {
  const { changeTab } = useContext(InitialContext);
  const [qogSettings] = useQorusStorage('settings.qogs', {});

  useEffect(() => {
    const listener = addMessageListener(
      'SUBSCRIPTION-EVENT',
      ({ data }) => {
        const settings = qogSettings?.[data.event_data.info.fsmid];

        if (!settings) return;

        if (data?.event_id === 'FSM_EXEC_START' && settings.startNotification) {
          Push.create('Qorus Developer Tools', {
            body: `Qog "${data.event_data.info.display_name}" started`,
            icon: Logo,
            timeout: 4000,
            onClick: () =>
              changeTab('CreateInterface', 'fsm', data.event_data.info.fsmid),
          });
        }

        if (data?.event_id === 'FSM_EXEC_RESULT' && settings.endNotification) {
          Push.create('Qorus Developer Tools', {
            body: `Qog "${data.event_data.info.display_name}" ${
              data.event_data.info.success ? 'finished' : 'resulted in error!'
            }`,
            icon: Logo,
            timeout: !data.event_data.info.success ? 20000 : 4000,
            onClick: () =>
              changeTab('CreateInterface', 'fsm', data.event_data.info.fsmid),
          });
        }
      },
      true
    );

    return () => {
      listener();
    };
  }, [JSON.stringify(qogSettings)]);
  return <>{children}</>;
};
