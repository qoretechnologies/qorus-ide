import { StoryObj } from '@storybook/react';
import MultiSelect from '../../components/Field/multiSelect';

export default {
  component: MultiSelect,
  title: 'Fields/Multi Select',
};

export const Default: StoryObj<typeof MultiSelect> = {};
export const WithValue: StoryObj<typeof MultiSelect> = {
  args: {
    default_items: [
      { name: 'test', value: 'test', short_desc: 'This is a test' },
      { name: 'test 2', value: 'test 2', intent: 'info' },
    ],
    value: ['test'],
    openOnMount: true,
  },
};
