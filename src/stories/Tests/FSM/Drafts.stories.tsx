import { StoryObj } from '@storybook/react';
import FSMView from '../../../containers/InterfaceCreator/fsm';
import { InterfacesProvider } from '../../../providers/Interfaces';
import { StoryMeta } from '../../types';

const meta = {
  component: FSMView,
  title: 'Tests/FSM/Drafts',
  render: (args) => (
    <InterfacesProvider>
      <FSMView {...args} />
    </InterfacesProvider>
  ),
} as StoryMeta<typeof FSMView, { stateType?: string }>;

export default meta;

type StoryFSM = StoryObj<typeof meta>;

export const SavesDrafts: StoryFSM = {};
