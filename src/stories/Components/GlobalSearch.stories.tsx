import { StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { GlobalSearch } from '../../components/GlobalSearch';
import { InterfacesProvider } from '../../providers/Interfaces';
import { sleep } from '../Tests/utils';
import { StoryMeta } from '../types';

const meta = {
  component: GlobalSearch,
  title: 'Components/Global Search',
  render: (props) => (
    <InterfacesProvider>
      <GlobalSearch />
    </InterfacesProvider>
  ),
} as StoryMeta<typeof GlobalSearch>;

export default meta;
export type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, ...rest }) => {
    await waitFor(
      () => expect(canvasElement.querySelector('.reqore-input')).toBeTruthy(),
      { timeout: 5000 }
    );
    await sleep(500);
    await userEvent.click(canvasElement.querySelector('.reqore-input')!);
  },
};

export const NoResults: Story = {
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);
    await Default.play({ canvasElement, ...rest });
    await userEvent.type(
      canvasElement.querySelector('.reqore-input')!,
      'no results'
    );
    await sleep(1100);
    await waitFor(
      () => expect(canvas.queryAllByText('No results found')).toBeTruthy(),
      { timeout: 10000 }
    );
  },
};

export const Results: Story = {
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);
    await Default.play({ canvasElement, ...rest });
    await userEvent.type(canvasElement.querySelector('.reqore-input')!, 'fsm');
    await waitFor(() => expect(canvas.queryByText(/Found/)).toBeTruthy(), {
      timeout: 5000,
    });
  },
};
