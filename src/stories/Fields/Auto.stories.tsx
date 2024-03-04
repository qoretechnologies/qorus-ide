import { StoryObj } from '@storybook/react';
import Auto from '../../components/Field/auto';

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
