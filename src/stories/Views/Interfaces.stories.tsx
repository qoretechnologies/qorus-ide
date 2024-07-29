import { StoryObj } from '@storybook/react';
import { waitFor, within } from '@storybook/test';
import { InterfacesView } from '../../containers/InterfacesView';
import { InterfacesProvider } from '../../providers/Interfaces';
import { StoryMeta } from '../types';

const meta = {
  component: InterfacesView,
  render: (args) => {
    return (
      <InterfacesProvider>
        <InterfacesView {...args} />
      </InterfacesProvider>
    );
  },
  title: 'Views/Interfaces',
} as StoryMeta<typeof InterfacesView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    type: 'fsm',
  },
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);

    await waitFor(() => canvas.getAllByText('Example Fsm'), { timeout: 10000 });
  },
};

export const Deprecated: Story = {
  args: {
    type: 'function',
  },
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);

    await waitFor(() => canvas.getAllByText('Array Eventtest Array'), {
      timeout: 10000,
    });
  },
};
