import {
  ReqoreButton,
  ReqoreControlGroup,
  ReqoreH4,
  ReqorePanel,
  useReqoreProperty,
} from '@qoretechnologies/reqore';
import timeago from 'epoch-timeago';
import { reduce, size } from 'lodash';
import { useContext } from 'react';
import Loader from '../../components/Loader';
import { interfaceIcons, interfaceImages } from '../../constants/interfaces';
import { IQorusListInterface } from '../../containers/InterfacesView';
import { InitialContext } from '../../context/init';
import { deleteDraft } from '../../helpers/functions';
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
  const { changeTab, changeDraft } = useContext(InitialContext);
  const addNotification = useReqoreProperty('addNotification');
  const { loading, value = {}, retry } = useFetchInterfaces();

  const drafts = reduce<
    Record<string, IQorusListInterface[]>,
    IQorusListInterface[]
  >(
    value as Record<string, IQorusListInterface[]>,
    (acc, item) => {
      return [...acc, ...item];
    },
    []
  )
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
      actions={[
        {
          icon: 'RefreshLine',
          onClick: retry,
          minimal: true,
          iconColor: '#c3893e',
          flat: true,
          loading,
        },
      ]}
    >
      {loading ? (
        <Loader text='Loading...' />
      ) : (
        <>
          {size(drafts) ? (
            <ReqoreControlGroup vertical fluid>
              {drafts.map((item) => (
                <ReqoreControlGroup stack key={item.id}>
                  <ReqoreButton
                    icon={interfaceIcons[item.type]}
                    leftIconProps={{
                      icon: interfaceIcons[item.type],
                      image: interfaceImages[item.type],
                    }}
                    label={`${item.label}`}
                    onClick={() => {
                      if (item.data) {
                        changeTab('CreateInterface', item.type, item.data.id);
                      } else {
                        changeDraft({ type: item.type, id: item.id });
                      }
                    }}
                    customTheme={{ main: '#8e5930:darken:5:0.5' }}
                    badge={{
                      label: timeago(Math.floor(new Date(item.date).getTime())),
                      align: 'right',
                    }}
                  />
                  <ReqoreButton
                    icon='CloseLine'
                    customTheme={{ main: '#8e5930:darken:5:0.5' }}
                    fixed
                    onClick={() => {
                      deleteDraft(item.type, item.id, true, addNotification);
                      retry();
                    }}
                  />
                </ReqoreControlGroup>
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
