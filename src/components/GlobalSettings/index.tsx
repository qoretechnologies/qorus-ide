import { useReqraftStorage } from '@qoretechnologies/reqraft';
import Options, { IOptions, IOptionsSchema } from '../Field/systemOptions';

export const GlobalSettingsSchema: IOptionsSchema = {
  autoSaveDraft: {
    type: 'boolean',
    display_name: 'Auto Save Drafts',
    default_value: true,
    preselected: true,
    short_desc: 'Whether drafts are saved automatically or not',
  },
  allowAiCreateDialog: {
    type: 'boolean',
    display_name: 'Allow AI Creation Dialog',
    default_value: true,
    preselected: true,
    short_desc:
      'This toggle controls whether you will be asked to create your interface using our AI generation tool or manually',
  },
};

export const GlobalSettings = () => {
  const [value, setValue] = useReqraftStorage<IOptions>('config', {});

  return (
    <Options
      label={undefined}
      badge={undefined}
      flat
      name='global-settings'
      value={value}
      options={GlobalSettingsSchema}
      onChange={(_name, value) => setValue(value)}
      actions={[
        {
          label: 'Reset',
          icon: 'HistoryLine',
          onClick: () => setValue({}),
        },
      ]}
    />
  );
};
