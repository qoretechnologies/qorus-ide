import {
  ReqoreCollection,
  ReqoreMessage,
  ReqoreSpinner,
  ReqoreTree,
} from '@qoretechnologies/reqore';
import { IReqoreCollectionItemProps } from '@qoretechnologies/reqore/dist/components/Collection/item';
import { map, size } from 'lodash';
import { useAsyncRetry } from 'react-use';
import { IFSMMetadata, IFSMStates } from '.';
import { getAppAndAction, getBuiltInAppAndAction } from '../../../helpers/fsm';
import { fetchData } from '../../../helpers/functions';
import { useApps } from '../../../hooks/useApps';

export interface IQodexTestRunModalProps {
  data?: Partial<IFSMMetadata> & { states: IFSMStates; type: 'fsm' };
  id?: string | number;
  liveRun?: boolean;
}

export const QodexTestRunModal = ({
  data,
  id,
  liveRun,
}: IQodexTestRunModalProps) => {
  const { apps } = useApps();
  const { loading, value, error } = useAsyncRetry(async () => {
    let response;

    if (liveRun) {
      response = await fetchData(
        `/fsms/${id}?action=exec&state_data=true`,
        'POST',
        undefined,
        false
      );
    } else {
      response = await fetchData(
        '/fsms/exec?state_data=true',
        'POST',
        {
          fsm: {
            type: 'fsm',
            id,
            ...data,
          },
        },
        false
      );
    }

    if (response.ok) {
      return response.data.state_data;
    }
  }, [data]);

  if (loading) {
    return (
      <ReqoreSpinner type={5} iconColor='info:lighten' centered>
        {' '}
        Loading ...{' '}
      </ReqoreSpinner>
    );
  }

  if (error) {
    return (
      <ReqoreMessage opaque={false} intent='danger'>
        {' '}
        {error}{' '}
      </ReqoreMessage>
    );
  }

  if (!size(data) && !liveRun) {
    return (
      <ReqoreMessage opaque={false} intent='warning'>
        {' '}
        No data{' '}
      </ReqoreMessage>
    );
  }

  const responseList = Object.keys(value)
    .sort((a, b) => {
      const aSort = value[a]?.sort || 0;
      const bSort = value[b]?.sort || 0;

      return bSort - aSort;
    })
    .map((key) => ({ ...value[key], key }));

  return (
    <ReqoreCollection
      sortable={false}
      showAs='list'
      filterable
      padded={false}
      zoomable
      fill
      defaultZoom={0.5}
      items={map(
        responseList,
        (
          { success, key, response, name, type, ...rest },
          index
        ): IReqoreCollectionItemProps => {
          let { app } = getAppAndAction(apps, rest.app, rest.action);

          if (!app) {
            ({ app } = getBuiltInAppAndAction(apps, type));
          }

          return {
            label: `[${size(responseList) - index}] ${
              name || data.states[key].name
            }`,
            intent: success ? 'success' : 'danger',
            content:
              typeof response === 'string' ||
              typeof response === 'number' ||
              !response ? (
                JSON.stringify(response)
              ) : (
                <ReqoreTree data={response} />
              ),
            // @ts-expect-error
            collapsible: true,
            isCollapsed: index > 0,
            iconImage: app?.logo,
            iconProps: {
              size: '25px',
            },
            badge: [
              {
                icon: success ? 'CheckLine' : 'CloseLine',
                color: success ? 'success:lighten' : 'danger:lighten',
              },
              app?.display_name,
            ],
          };
        }
      )}
    />
  );
};
