import { StoryObj } from '@storybook/react';
import { expect, fireEvent, waitFor, within } from '@storybook/test';

import { useState } from 'react';
import { ConnectionManagement } from '../../components/ConnectionManagement';
import { AppsContext } from '../../context/apps';
import apps from '../Data/apps.json';
import { StoryMeta } from '../types';

const meta = {
  component: ConnectionManagement,
  title: 'Components/Connection Management',
  render: (args) => {
    const [connection, setConnection] = useState(args.selectedConnection);

    return (
      // @ts-ignore
      <AppsContext.Provider value={{ apps }}>
        <ConnectionManagement {...args} onChange={setConnection} selectedConnection={connection} />
      </AppsContext.Provider>
    );
  },
} as StoryMeta<typeof ConnectionManagement>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = {
  args: {
    selectedConnection: 'google-calendar',
  },
};

export const Compact: Story = {
  args: {
    compact: true,
    selectedConnection: 'google-calendar',
  },
};

export const SelectedOAuth2UnAuthorized: Story = {
  name: 'Selected OAuth2 Un-Authorized',
  args: {
    selectedConnection: 'google-calendar',
    metadata: {
      needs_auth: true,
      oauth2_auth_code: true,
    },
  },
};

export const SelectedOAuth2Authorized: Story = {
  name: 'Selected OAuth2 Authorized',
  args: {
    selectedConnection: 'google-calendar',
    metadata: {
      oauth2_auth_code: true,
    },
  },
};

export const NewConnection: Story = {
  args: {
    app: 'GoogleCalendar',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => canvas.getAllByText('Create new connection')[0], {
      timeout: 5000,
    });

    await fireEvent.click(canvas.getAllByText('Create new connection')[0]);
  },
};

export const NewConnectionWithRequiredOptions: Story = {
  args: {
    app: 'Dynamics',
  },
  play: async ({ canvasElement, ...rest }) => {
    await NewConnection.play({ canvasElement, ...rest });

    await waitFor(
      () => expect(document.querySelectorAll('.reqore-collection-item').length).toBe(1),
      { timeout: 5000 }
    );
  },
};

// TODO: Fix this test
// export const EditingConnection: Story = {
//   args: {
//     app: 'GoogleCalendar',
//   },
//   parameters: {
//     chromatic: { disable: true },
//   },
//   play: async ({ canvasElement, ...rest }) => {
//     const canvas = within(canvasElement);

//     await NewConnection.play({ canvasElement, ...rest });

//     await sleep(500);

//     await waitFor(() => canvas.getAllByText('Edit connection')[0], {
//       timeout: 15000,
//     });

//     await fireEvent.click(canvas.getAllByText('Edit connection')[0]);

//     await waitFor(
//       () => expect(document.querySelectorAll('.reqore-collection-item').length).toBeGreaterThan(1),
//       { timeout: 5000 }
//     );
//   },
// };
