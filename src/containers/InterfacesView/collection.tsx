import { ReqoreCollection, useReqoreProperty } from '@qoretechnologies/reqore';
import { TReqoreBadge } from '@qoretechnologies/reqore/dist/components/Button';
import { IReqoreCollectionItemProps } from '@qoretechnologies/reqore/dist/components/Collection/item';
import timeago from 'epoch-timeago';
import { size } from 'lodash';
import { useContext, useMemo } from 'react';
import { IQorusInterfaceCountItem } from '.';
import {
  NegativeColorEffect,
  PositiveColorEffect,
  SaveColorEffect,
  SelectorColorEffect,
  SynthColorEffect,
  WarningColorEffect,
} from '../../components/Field/multiPair';
import Loader from '../../components/Loader';
import {
  interfaceIcons,
  interfaceKindTransform,
} from '../../constants/interfaces';
import { InitialContext } from '../../context/init';
import { InterfacesContext } from '../../context/interfaces';
import { deleteDraft } from '../../helpers/functions';
import { useFetchInterfaces } from '../../hooks/useFetchInterfaces';
import { QodexTestRunModal } from '../InterfaceCreator/fsm/TestRunModal';
import { InterfacesViewItem } from './item';

export interface IInterfaceViewCollectionProps
  extends IQorusInterfaceCountItem {
  type: string;
}

export const InterfacesViewCollection = ({
  type,
  display_name,
  singular_display_name,
}: IInterfaceViewCollectionProps) => {
  const addNotification = useReqoreProperty('addNotification');
  const confirmAction = useReqoreProperty('confirmAction');
  const addModal = useReqoreProperty('addModal');
  const { changeDraft, changeTab, qorus_instance } = useContext(InitialContext);
  const { clone } = useContext(InterfacesContext);

  const { value, loading, onDeleteRemoteClick, onToggleEnabledClick, retry } =
    useFetchInterfaces(type);

  const onDeleteClick = async (type, id?) => {
    await deleteDraft(interfaceKindTransform[type], id, true, addNotification);

    retry();
  };

  const getRemotesCount = () => {
    return size(value);
  };

  const getDraftsCount = () => {
    return size(value.filter((item) => item.draft || item.hasDraft));
  };

  const getTags = (item): IReqoreCollectionItemProps['tags'] => {
    let tags: IReqoreCollectionItemProps['tags'] = [];

    if (type === 'fsm') {
      if (!item.data?.on_demand) {
        tags.push({
          icon: item.data?.type === 'event' ? 'LightbulbLine' : 'Calendar2Line',
          tooltip: item.data?.type ? 'Event' : 'Scheduled',
        });
      }

      tags = [
        ...tags,
        {
          icon: item.data?.running ? 'PlayCircleLine' : 'PauseCircleLine',
          intent: item.data?.running ? 'success' : undefined,
          tooltip: item.data?.running ? 'Running' : 'Not currently running',
        },
        {
          icon: 'HistoryLine',
          label: item.data?.last_executed
            ? timeago(item.data?.last_executed)
            : 'Never',
        },
      ];
    }

    if (item.draft) {
      tags.push({
        icon: 'EditLine',
        label: 'Draft',
        intent: item.data ? 'pending' : 'success',
      });
    }

    return tags;
  };

  const badges = useMemo(() => {
    const badgeList: TReqoreBadge[] = [getRemotesCount()];

    badgeList.push({
      label: getDraftsCount(),
      intent: 'pending',
      tooltip: 'Number of drafts, click to remove all drafts',
      onRemoveClick: () => onDeleteClick(type),
    });

    return badgeList;
  }, [getDraftsCount, getRemotesCount, qorus_instance]);

  if (loading) {
    return <Loader text='Loading server data...' />;
  }

  return (
    <ReqoreCollection
      label={display_name}
      filterable
      sortable
      defaultSortBy='date'
      defaultSort='desc'
      minimal
      minColumnWidth='300px'
      badge={badges}
      maxItemHeight={120}
      responsiveActions={false}
      fill
      actions={[
        {
          icon: 'AddCircleLine',
          label: `Create New ${singular_display_name}`,
          flat: false,
          onClick: () => changeTab('CreateInterface', type),
          effect: PositiveColorEffect,
          pill: true,
        },
      ]}
      icon={interfaceIcons[type]}
      sortKeys={{
        running: 'Is Running',
        last_executed: 'Last Executed',
        on_demand: 'Runs On Demand',
        date: 'Modified',
        type: 'Type',
        id: 'ID',
      }}
      inputProps={{
        focusRules: {
          type: 'keypress',
          shortcut: 'letters',
        },
        pill: true,
        intent: 'muted',
        leftIconProps: {
          size: 'small',
          intent: 'muted',
        },
      }}
      items={value.map(
        ({
          label,
          data,
          date,
          draft,
          hasDraft,
          ...rest
        }): IReqoreCollectionItemProps => ({
          label: label || data?.display_name,
          icon: interfaceIcons[type],
          metadata: {
            date: date || data?.date,
            running: data?.running,
            last_executed: data?.last_executed
              ? Date.parse(data?.last_executed)
              : 0,
            on_demand: data?.on_demand,
            type: data?.type,
            id: data?.id,
          },
          content: <InterfacesViewItem data={data} />,
          contentEffect: {
            gradient: {
              direction: 'to right bottom',
              colors: {
                50: 'main',
                300:
                  draft && !data
                    ? 'success'
                    : draft
                    ? 'pending'
                    : 'main:lighten',
              },
            },
          },
          tags: getTags({ label, data, draft, hasDraft, rest }),
          flat: true,
          showHeaderTooltip: true,
          responsiveTitle: false,
          responsiveActions: false,
          size: 'small',
          onClick: () => {
            if (draft) {
              changeDraft({
                type,
                id: rest.id,
              });
            } else {
              changeTab('CreateInterface', type, data?.id);
            }
          },
          actions: [
            {
              icon: 'CloseLine',
              effect: WarningColorEffect,
              tooltip: 'Delete draft',
              size: 'tiny',
              show: draft ? 'hover' : false,
              compact: true,
              onClick: () => {
                confirmAction({
                  title: 'Delete draft',
                  description: 'Are you sure you want to delete this draft?',
                  onConfirm: () => {
                    onDeleteClick(type, rest.id);
                  },
                });
              },
            },
            {
              icon: 'PlayLine',
              leftIconProps: {
                size: '17px',
              },
              compact: true,
              effect: SynthColorEffect,
              tooltip: 'Execute',
              size: 'tiny',
              show:
                type === 'fsm' && (data?.on_demand || data?.type !== 'event')
                  ? 'hover'
                  : false,
              onClick: () => {
                addModal({
                  label: `Execution of "${data?.display_name}"`,
                  children: <QodexTestRunModal id={rest.id} liveRun />,
                });
              },
            },
            {
              icon: 'FileCopyLine',
              compact: true,
              effect: SynthColorEffect,
              tooltip: 'Clone This Interface',
              size: 'tiny',
              show: data ? 'hover' : false,
              onClick: () => {
                clone(type, rest.id);
              },
            },
            {
              icon: 'ToggleLine',
              effect: data?.enabled ? SaveColorEffect : SelectorColorEffect,
              tooltip: data?.enabled ? 'Disable' : 'Enable',
              size: 'tiny',
              compact: true,
              show: data?.supports_enable ? true : false,
              onClick: () => {
                onToggleEnabledClick(data.id, !data.enabled);
              },
            },
            {
              icon: 'DeleteBinLine',
              effect: NegativeColorEffect,
              tooltip: 'Delete',
              compact: true,
              size: 'tiny',
              show: !draft || data ? 'hover' : false,
              onClick: () => {
                confirmAction({
                  title: 'Delete server interface',
                  description:
                    'Are you sure you want to delete this interface FROM THE ACTIVE INSTANCE?',
                  onConfirm: () => {
                    onDeleteRemoteClick(data.id);
                  },
                });
              },
            },
          ],
        })
      )}
    />
  );
};
