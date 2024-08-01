import { StoryObj } from '@storybook/react';
import { expect, fireEvent, waitFor, within } from '@storybook/test';
import { EnableToggle } from '../../handlers/EnableToggle';
import { InterfacesProvider } from '../../providers/Interfaces';
import { StoryMeta } from '../types';

const meta = {
  component: EnableToggle,
  title: 'Components/Enable Toggle',
  render: (args) => (
    <InterfacesProvider>
      <EnableToggle {...args} />
    </InterfacesProvider>
  ),
  args: {
    hasLabel: true,
  },
} as StoryMeta<typeof EnableToggle>;

export default meta;
export type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    enabled: false,
    type: 'fsm',
    id: 2,
  },
};

export const Enabled: Story = {
  args: {
    enabled: true,
    type: 'fsm',
    id: 2,
  },
};

export const CanBeToggled: Story = {
  ...Enabled,
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);

    await waitFor(
      () => expect(canvas.getAllByText('Enabled')[0]).toBeInTheDocument(),
      { timeout: 5000 }
    );

    await fireEvent.click(canvas.getAllByText('Enabled')[0]);

    await waitFor(
      () => expect(canvas.getAllByText('Disabled')[0]).toBeInTheDocument(),
      { timeout: 5000 }
    );
  },
};
