import { StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor } from '@storybook/test';
import { useState } from 'react';
import Auto from '../../components/Field/auto';
import Loader from '../../components/Loader';
import { useTemplates } from '../../hooks/useTemplates';
import { InterfacesProvider } from '../../providers/Interfaces';
import { _testsClickButton, _testsWaitForText, sleep } from '../Tests/utils';

export default {
  component: Auto,
  title: 'Fields/Auto',
};

export const Default: StoryObj<typeof Auto> = {};
export const Connection: StoryObj<typeof Auto> = {
  args: {
    defaultType: 'connection',
  },
};
export const RichText: StoryObj<typeof Auto> = {
  render: (args) => {
    const [value, setValue] = useState(args.value);
    const templates = useTemplates(true);

    if (templates.loading) {
      return <Loader />;
    }

    return (
      <InterfacesProvider>
        <Auto
          {...args}
          value={value}
          onChange={(name, value) => setValue(value)}
          templates={templates.value}
        />
      </InterfacesProvider>
    );
  },
  args: {
    defaultType: 'richtext',
    value: 'something',
    supports_references: true,
    supports_styling: true,
    supports_templates: true,
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => canvasElement.querySelector('div[contenteditable]'), {
      timeout: 15000,
    });
    await sleep(4500);
    await userEvent.click(canvasElement.querySelector('div[contenteditable]'));
    await sleep(1000);
    await userEvent.click(canvasElement.querySelector('div[contenteditable]'));
    await userEvent.keyboard(' test');

    await expect(canvasElement.querySelector('div[contenteditable]').textContent).toBe(
      'something test'
    );
  },
};
export const ConnectionWithAllowedValues: StoryObj<typeof Auto> = {
  args: {
    defaultType: 'connection',
    allowed_values: [
      {
        name: 'test',
        value: 'test',
        short_desc: 'This is a test',
      },
      {
        name: 'test 2',
        value: 'test 2',
        intent: 'info',
        desc: 'This is a test 2',
      },
    ],
  },
  play: async () => {
    await _testsClickButton({ label: 'PleaseSelect' });
    await _testsWaitForText('Select from items');
  },
};

export const Hash: StoryObj<typeof Auto> = {
  args: {
    value: { key: 'value' },
  },
};

export const ListWithAllowedValues: StoryObj<typeof Auto> = {
  args: {
    defaultType: 'list',
    allowed_values: [
      {
        name: 'test',
        value: 'test',
        short_desc: 'This is a test',
      },
      {
        name: 'test 2',
        value: 'test 2',
        intent: 'info',
      },
    ],
  },
};

export const ListWithElementType: StoryObj<typeof Auto> = {
  render: (args) => {
    const [value, setValue] = useState(args.value);

    return (
      <InterfacesProvider>
        <Auto
          {...args}
          value={value}
          onChange={(name, value) => {
            setValue(value);
          }}
        />
      </InterfacesProvider>
    );
  },
  args: {
    defaultType: 'list',
    element_type: 'int',
  },
};
