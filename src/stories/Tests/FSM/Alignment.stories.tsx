import { StoryObj } from '@storybook/react';
import { expect, fireEvent, waitFor, within } from '@storybook/test';
import FSMView from '../../../containers/InterfaceCreator/fsm';
import { InterfacesProvider } from '../../../providers/Interfaces';
import fsm from '../../Data/fsm.json';
import { SelectedStates } from '../../Views/FSM.stories';
import { StoryMeta } from '../../types';
import { sleep } from '../utils';
import { SwitchesToBuilder } from './Basic.stories';

const meta = {
  component: FSMView,
  title: 'Tests/FSM/Aligning states',
  render: (args) => (
    <InterfacesProvider>
      <FSMView {...args} />
    </InterfacesProvider>
  ),
} as StoryMeta<typeof FSMView, { stateType?: string }>;

export default meta;

type StoryFSM = StoryObj<typeof meta>;

export const AutoAlign: StoryFSM = {
  name: 'Smart Align',
  args: {
    fsm,
  },
  play: async ({ canvasElement, ...rest }) => {
    await SwitchesToBuilder.play({ canvasElement, ...rest });

    const canvas = within(canvasElement);

    await waitFor(
      async () => {
        await expect(
          document.querySelectorAll('#fsm-diagram .reqore-panel').length
        ).toBe(9);
        await sleep(1000);
        await fireEvent.click(
          document.querySelectorAll('#auto-align-states')[0]
        );
      },
      { timeout: 5000 }
    );
  },
};

export const VerticalTop: StoryFSM = {
  args: {
    fsm,
  },
  play: async ({ canvasElement, ...rest }) => {
    await SelectedStates.play({ canvasElement, ...rest });
    await fireEvent.click(document.querySelector('.align-top'));
  },
};

export const VerticalCenter: StoryFSM = {
  args: {
    fsm,
  },
  play: async ({ canvasElement, ...rest }) => {
    await SelectedStates.play({ canvasElement, ...rest });
    await fireEvent.click(document.querySelector('.align-center'));
  },
};

export const VerticalBottom: StoryFSM = {
  args: {
    fsm,
  },
  play: async ({ canvasElement, ...rest }) => {
    await SelectedStates.play({ canvasElement, ...rest });
    await fireEvent.click(document.querySelector('.align-bottom'));
  },
};

export const HorizontalLeft: StoryFSM = {
  args: {
    fsm,
  },
  play: async ({ canvasElement, ...rest }) => {
    await SelectedStates.play({ canvasElement, ...rest });
    await fireEvent.click(document.querySelector('.align-left'));
  },
};

export const HorizontalMiddle: StoryFSM = {
  args: {
    fsm,
  },
  play: async ({ canvasElement, ...rest }) => {
    await SelectedStates.play({ canvasElement, ...rest });
    await fireEvent.click(document.querySelector('.align-middle'));
  },
};

export const HorizontalRight: StoryFSM = {
  args: {
    fsm,
  },
  play: async ({ canvasElement, ...rest }) => {
    await SelectedStates.play({ canvasElement, ...rest });
    await fireEvent.click(document.querySelector('.align-right'));
  },
};
