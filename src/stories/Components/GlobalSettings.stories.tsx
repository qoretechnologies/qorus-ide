import { StoryObj } from '@storybook/react';
import { GlobalSettings } from '../../components/GlobalSettings';
import { storiesStorageMockEmpty } from '../Data/storage';
import { StoryMeta } from '../types';

const meta = {
  component: GlobalSettings,
  title: 'Components/Global Settings',
  args: {
    reqraftOptions: {
      waitForStorage: true,
    },
  },
  parameters: {
    mockData: [...storiesStorageMockEmpty],
  },
} as StoryMeta<typeof GlobalSettings>;

export default meta;
export type Story = StoryObj<typeof meta>;

export const Default: Story = {};
