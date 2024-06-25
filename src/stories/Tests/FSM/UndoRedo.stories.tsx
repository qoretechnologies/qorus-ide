import { StoryObj } from '@storybook/react';
import { within } from '@storybook/test';
import FSMView from '../../../containers/InterfaceCreator/fsm';
import { InterfacesProvider } from '../../../providers/Interfaces';
import { StoryMeta } from '../../types';
import {
  _testsQogExpectStateCount,
  _testsQogRedo,
  _testsQogUndo,
  _testsSelectItemFromCollection,
  _testsWaitForText,
  sleep,
} from '../utils';
import { NewStatesAfterState } from './Basic.stories';

const meta = {
  component: FSMView,
  title: 'Tests/FSM/Undo & Redo',
  render: (args) => (
    <InterfacesProvider>
      <FSMView {...args} />
    </InterfacesProvider>
  ),
} as StoryMeta<typeof FSMView, { stateType?: string }>;

export default meta;

type StoryFSM = StoryObj<typeof meta>;

export const UndoOnce: StoryFSM = {
  ...NewStatesAfterState,
  play: async ({ canvasElement, ...rest }) => {
    await NewStatesAfterState.play({ canvasElement, ...rest });

    await _testsQogUndo();
    await _testsQogExpectStateCount(2);
  },
};

export const UndoAll: StoryFSM = {
  ...NewStatesAfterState,
  play: async ({ canvasElement, ...rest }) => {
    await NewStatesAfterState.play({ canvasElement, ...rest });

    await _testsQogUndo();
    await sleep(300);
    await _testsQogUndo();
    await sleep(300);
    await _testsQogUndo();
    await sleep(300);
    await _testsQogUndo();
    await sleep(300);
    await _testsQogUndo();
    await sleep(300);
    await _testsQogUndo();
    await sleep(300);
    await _testsQogExpectStateCount(0);
  },
};

export const RedoOnce: StoryFSM = {
  ...UndoAll,
  play: async ({ canvasElement, ...rest }) => {
    await UndoAll.play({ canvasElement, ...rest });

    await _testsQogRedo();
    await _testsQogExpectStateCount(1);
  },
};

export const RedoAll: StoryFSM = {
  ...UndoAll,
  play: async ({ canvasElement, ...rest }) => {
    await UndoAll.play({ canvasElement, ...rest });

    await _testsQogRedo();
    await sleep(300);
    await _testsQogRedo();
    await sleep(300);
    await _testsQogRedo();
    await sleep(300);
    await _testsQogRedo();
    await sleep(300);
    await _testsQogRedo();
    await sleep(300);
    await _testsQogRedo();
    await sleep(300);
    await _testsQogExpectStateCount(3);
  },
};

export const UndoOptionsAndStateData: StoryFSM = {
  ...NewStatesAfterState,
  parameters: {
    chromatic: { disable: true },
  },
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);
    await NewStatesAfterState.play({ canvasElement, ...rest });

    await sleep(500);
    await _testsSelectItemFromCollection(canvas, 'Discord New')();
    await sleep(3000);
    await _testsQogUndo();
    await sleep(3000);

    if (!canvas.queryAllByText('PleaseSelect')[0]) {
      await _testsQogUndo();
      await sleep(500);
    }

    await _testsWaitForText('PleaseSelect');
  },
};

export const RedoOptionsAndStateData: StoryFSM = {
  ...UndoOptionsAndStateData,
  parameters: {
    chromatic: { disable: true },
  },
  play: async ({ canvasElement, ...rest }) => {
    await UndoOptionsAndStateData.play({ canvasElement, ...rest });

    await sleep(3000);
    await _testsQogRedo();
    await sleep(3000);

    await _testsWaitForText('Discord New');
  },
};
