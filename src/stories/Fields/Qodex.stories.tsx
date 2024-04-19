import { StoryObj } from '@storybook/react';
import { useState } from 'react';
import { QodexFields } from '../../containers/InterfaceCreator/fsm/Fields';
import { InterfacesProvider } from '../../providers/Interfaces';
import { StoryMeta } from '../types';

const meta = {
  component: QodexFields,
  title: 'Fields/Qodex Fields',
  render: (args) => {
    const [val, setVal] = useState(args.value);
    const [settings, setSettings] = useState(args.settings);

    return (
      <InterfacesProvider>
        <QodexFields
          {...args}
          settings={settings}
          onSettingsChange={setSettings}
          value={val}
          onChange={(v) => {
            setVal(v);
          }}
        />
      </InterfacesProvider>
    );
  },
} as StoryMeta<typeof QodexFields>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
export const WithValue: StoryObj<typeof meta> = {
  args: {
    value: {
      display_name: 'Untitled Qodex',
      desc: 'test',
      short_desc: 'short test',
    },
    id: 10,
  },
};
