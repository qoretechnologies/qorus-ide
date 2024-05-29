import { StoryObj } from '@storybook/react';
import { InterfacesProvider } from '../../providers/Interfaces';
import { Dashboard } from '../../views/dashboard';
import { StoryMeta } from '../types';

const meta = {
  component: Dashboard,
  title: 'Views/Dashboard',
  render: (args: any) => (
    <InterfacesProvider>
      <Dashboard {...args} />
    </InterfacesProvider>
  ),
} as StoryMeta<typeof Dashboard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
