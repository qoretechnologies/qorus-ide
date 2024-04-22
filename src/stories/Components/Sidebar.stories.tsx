import { StoryObj } from '@storybook/react';
import { Sidebar } from '../../components/Sidebar';
import { InterfacesProvider } from '../../providers/Interfaces';
import { StoryMeta } from '../types';

const meta = {
  component: Sidebar,
  title: 'Components/Sidebar',
  render: (props) => (
    <InterfacesProvider>
      <Sidebar {...props} />
    </InterfacesProvider>
  ),
} as StoryMeta<typeof Sidebar>;

export default meta;
export type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
export const ActivePath: Story = {
  args: {
    _location: {
      pathname: '/Interfaces/mapper',
    },
  },
};
