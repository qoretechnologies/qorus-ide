import {
  ReqoreButton,
  ReqoreControlGroup,
  ReqoreH4,
  ReqorePanel,
} from '@qoretechnologies/reqore';
import timeago from 'epoch-timeago';
import { size } from 'lodash';
import { useContext } from 'react';
import { interfaceIcons } from '../../constants/interfaces';
import { InitialContext } from '../../context/init';
import { useFetchInterfaces } from '../../hooks/useFetchInterfaces';

export interface IQogLogItem {
  fsmid: number;
  name: string;
  display_name: string;
  success: boolean;
  exec_time: string;
  exec_timeus: number;
  error?: string;
  time: string;
}

export const DashboardDrafts = () => {
  const { changeTab } = useContext(InitialContext);
  const { loading, value } = useFetchInterfaces('fsm');

  if (loading) {
    return null;
  }

  const drafts = value
    .filter((item) => !!item.draft)
    .sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, 6);

  return (
    <ReqorePanel
      icon='EditLine'
      iconColor='#efad67'
      customTheme={{ main: '#4f3304' }}
      minimal
      fill
      contentEffect={{
        gradient: {
          //direction: 'to right bottom',
          colors: {
            0: '#201500',
            100: '#4f3304',
          },
          animate: 'hover',
          animationSpeed: 5,
        },
      }}
      contentStyle={{
        display: 'flex',
        flexFlow: 'column',
        justifyContent: size(drafts) ? undefined : 'center',
        alignItems: 'center',
      }}
      label='Finish what you started'
      headerEffect={{
        gradient: {
          colors: {
            0: '#c3893e',
            50: '#8e5930',
            100: '#efad67',
          },
          animationSpeed: 5,
          animate: 'hover',
        },
      }}
    >
      {size(drafts) ? (
        <ReqoreControlGroup vertical fluid>
          {drafts.map((item) => (
            <ReqoreButton
              icon={interfaceIcons.fsm}
              label={`${item.label}`}
              onClick={() =>
                changeTab('CreateInterface', item.type, item.data.id)
              }
              customTheme={{ main: '#8e5930:darken:5:0.5' }}
              badge={{
                label: timeago(Math.floor(new Date(item.date).getTime())),
                align: 'right',
              }}
            />
          ))}
        </ReqoreControlGroup>
      ) : (
        <ReqoreH4 effect={{ opacity: 0.5 }}>Nothing to show yet</ReqoreH4>
      )}
    </ReqorePanel>
  );
};
