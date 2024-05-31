import { StoryObj } from '@storybook/react';
import { expect, waitFor } from '@storybook/test';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import App from '../../App';
import reducer from '../../reducers';
import { StoryMeta } from '../types';

const meta = {
  component: App,
  render: (args) => {
    const store = createStore(reducer);

    return (
      <Provider store={store}>
        <App {...args} />
      </Provider>
    );
  },
  args: {
    isFullIDE: true,
  },
  title: 'Views/Full IDE',
} as StoryMeta<typeof App>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(
      () => expect(document.querySelectorAll('.reqore-panel')).toHaveLength(8),
      { timeout: 14000 }
    );
  },
};
