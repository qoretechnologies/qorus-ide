import { StoryObj } from '@storybook/react';
import { fireEvent, waitFor, within } from '@storybook/testing-library';
import { InterfacesView } from '../../containers/InterfacesView';
import { StoryMeta } from '../types';

const meta = {
  component: InterfacesView,
  title: 'Views/Interfaces',
  args: {
    reqoreOptions: {
      animations: {
        dialogs: false,
      },
    },
  },
} as StoryMeta<typeof InterfacesView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);

    await waitFor(() => canvas.getAllByText('Example Fsm'), { timeout: 10000 });
  },
};

export const ChangeTab: Story = {
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);

    await Default.play({ canvasElement, ...rest });

    await fireEvent.click(canvas.getAllByText('Classes')[0]);

    await waitFor(() => canvas.getAllByText('Java Test'), {
      timeout: 10000,
    });
  },
};
