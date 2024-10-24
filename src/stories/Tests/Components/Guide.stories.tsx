import { StoryObj } from '@storybook/react';
import { Guide } from '../../../components/Guide';
import { StoryMeta } from '../../types';

const meta = {
  component: Guide,
  title: 'Components/Guide',
} as StoryMeta<typeof Guide>;

export default meta;
export type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    pages: [
      {
        label: 'First page',
        content: 'First page content',
      },
      {
        label: 'Second page',
        content: 'Second page content',
      },
    ],
  },
};
