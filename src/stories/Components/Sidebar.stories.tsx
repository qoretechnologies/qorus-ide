import { StoryObj } from '@storybook/react';
import { Sidebar } from '../../components/Sidebar';
import { StoryMeta } from '../types';

const meta = {
  component: Sidebar,
  title: 'Components/Sidebar',
} as StoryMeta<typeof Sidebar>;

export default meta;
export type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
export const Collapsed: Story = { args: { isCollapsed: true } };
