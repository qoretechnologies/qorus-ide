import { StoryObj } from '@storybook/react';
import { CreateInterfaceFromTextModal } from '../../components/CreateInterfaceFromText/modal';
import { StoryMeta } from '../types';

const meta = {
  component: CreateInterfaceFromTextModal,
  title: 'Components/Interface From Text Modal',
} as StoryMeta<typeof CreateInterfaceFromTextModal>;

export default meta;
export type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    type: 'fsm',
  },
};
