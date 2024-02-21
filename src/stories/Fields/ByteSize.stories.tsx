import { StoryObj } from '@storybook/react';
import { useState } from 'react';
import Component from '../../components/Field/byteSize';

const meta = {
  component: Component,
  title: 'Fields/Byte Size',
  render: (args) => {
    const [value, setValue] = useState(args.value || args.default_value || '');

    return (
      <Component {...args} value={value} onChange={(name, v) => setValue(v)} />
    );
  },
};

export default meta;

export const Default: StoryObj<typeof Component> = {};

export const WithDefaultValue: StoryObj<typeof Component> = {
  args: {
    default_value: '5 MiB',
  },
};

export const WithValue: StoryObj<typeof Component> = {
  args: {
    ...WithDefaultValue.args,
    value: '4 KB',
  },
};
