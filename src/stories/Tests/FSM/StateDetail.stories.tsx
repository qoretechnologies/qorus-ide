import { StoryObj } from '@storybook/react';
import { expect, fireEvent, waitFor, within } from '@storybook/test';
import FSMView from '../../../containers/InterfaceCreator/fsm';
import { InterfacesProvider } from '../../../providers/Interfaces';
import { Existing } from '../../Views/FSM.stories';
import { StoryMeta } from '../../types';
import { _testsClickButton, _testsClickState, sleep } from '../utils';
import { SwitchesToBuilder } from './Basic.stories';

const meta = {
  component: FSMView,
  title: 'Tests/FSM/State Detail',
  render: (args) => (
    <InterfacesProvider>
      <FSMView {...args} />
    </InterfacesProvider>
  ),
} as StoryMeta<typeof FSMView, { stateType?: string }>;

export default meta;

type StoryFSM = StoryObj<typeof meta>;

export const StateDataIsShown: StoryFSM = {
  ...Existing,
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);
    await SwitchesToBuilder.play({ canvasElement, ...rest });
    await _testsClickState(`Send Discord Message`);
    await sleep(500);
    await waitFor(() => canvas.getAllByText('Message Content')[0], {
      timeout: 20000,
    });
    await sleep(5000);
    await document.querySelector('.system-option .reqore-textarea').scrollIntoView();
    await fireEvent.click(document.querySelector('.system-option .reqore-textarea'));
    await sleep(500);
    await _testsClickButton({ label: 'Templates' });
    await sleep(100);
    await expect(
      document.querySelectorAll('.reqore-popover-content .reqore-menu-item')
    ).toHaveLength(3);
  },
};
