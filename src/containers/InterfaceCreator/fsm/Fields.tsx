import { ReqoreVerticalSpacer } from '@qoretechnologies/reqore';
import Push from 'push.js';
import { useAsyncRetry } from 'react-use';
import Options, {
  IOptionsSchema,
  TFlatOptions,
  flattenOptions,
} from '../../../components/Field/systemOptions';
import Loader from '../../../components/Loader';
import { NotificationsStatusMessage } from '../../../handlers/Notifications';
import { callBackendBasic } from '../../../helpers/functions';

let fields: IOptionsSchema;

export interface IQodexFieldsProps {
  value?: TFlatOptions;
  onChange?: (value: TFlatOptions) => void;
  settings?: TFlatOptions;
  onSettingsChange?: (value: TFlatOptions) => void;

  id?: number;
}

export interface IQogNotificationStorageItem {
  start?: boolean;
  end?: boolean;
}
export type TQogNotificationStorageItems = Record<
  number | string,
  IQogNotificationStorageItem
>;

export const QodexFields = ({
  value,
  onChange,
  settings,
  onSettingsChange,
  id,
}: IQodexFieldsProps) => {
  const { loading } = useAsyncRetry(async () => {
    if (!fields) {
      const data = await callBackendBasic(
        'creator-get-fields-as-options',
        undefined,
        { iface_kind: 'fsm' },
        undefined,
        undefined,
        true
      );

      fields = data.data.fields;
    }

    return fields;
  });

  if (loading) {
    return <Loader />;
  }

  const settingsSchema: IOptionsSchema = {
    startNotification: {
      sort: 1,
      type: 'bool',
      display_name: 'Start Notification',
      short_desc: 'Whether to send a notification when this Qog starts',
      preselected: true,
    },

    endNotification: {
      sort: 2,
      type: 'bool',
      display_name: 'End Notification',
      short_desc: 'Whether to send a notification when this Qog ends',
      preselected: true,
    },
  };

  return (
    <>
      <Options
        icon='InformationLine'
        iconProps={{
          size: 'big',
        }}
        sortable={false}
        label='Qog Metadata'
        name='fsm-fields'
        placeholder='More...'
        options={fields}
        value={value}
        onChange={(_name, metadata) => {
          onChange(flattenOptions(metadata));
        }}
      />
      <ReqoreVerticalSpacer height={10} />
      <NotificationsStatusMessage />
      <Options
        disabled={Push.Permission.get() !== Push.Permission.GRANTED}
        icon='SettingsLine'
        iconProps={{
          size: 'big',
        }}
        sortable={false}
        label='Your Qog Settings'
        name='fsm-settings'
        options={settingsSchema}
        value={settings}
        onChange={(_name, metadata) => {
          onSettingsChange(flattenOptions(metadata));
        }}
      />
    </>
  );
};
