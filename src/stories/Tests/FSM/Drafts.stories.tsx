import { StoryObj } from '@storybook/react';
import FSMView from '../../../containers/InterfaceCreator/fsm';
import { StoryMeta } from '../../types';
import { InterfacesProvider } from '../../../providers/Interfaces';

const meta = {
  component: FSMView,
  title: 'Tests/FSM/Drafts',
  render: (args) => (
    <InterfacesProvider>
      <FSMView {...args} />
    </InterfacesProvider>
  ),
  args: {
    reqoreOptions: {
      animations: {
        dialogs: false,
      },
    },
  },
} as StoryMeta<typeof FSMView, { stateType?: string }>;

export default meta;

type StoryFSM = StoryObj<typeof meta>;

export const SavesDrafts: StoryFSM = {};
