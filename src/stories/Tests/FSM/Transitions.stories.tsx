import { expect } from '@storybook/jest';
import { StoryObj } from '@storybook/react';
import { fireEvent, waitFor, within } from '@storybook/testing-library';
import FSMView from '../../../containers/InterfaceCreator/fsm';
import QodexWithIfState from '../../Data/qodexWithIfState.json';
import { Existing } from '../../Views/FSM.stories';
import { StoryMeta } from '../../types';
import {
  _testsAddNewState,
  _testsCloseStateDetail,
  _testsConfirmDialog,
  sleep,
} from '../utils';
import { SwitchesToBuilder } from './Basic.stories';

const meta = {
  component: FSMView,
  title: 'Tests/FSM/Transitions',
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

export const TransitionCanBeDeleted: StoryFSM = {
  ...Existing,
  play: async ({ canvasElement, ...rest }) => {
    await SwitchesToBuilder.play({ canvasElement, ...rest });
    await fireEvent.click(document.querySelector('.fsm-transition'));

    await waitFor(
      () => {
        expect(
          document.querySelectorAll('.fsm-delete-transition')
        ).toHaveLength(1);
      },
      { timeout: 5000 }
    );

    await fireEvent.click(document.querySelector('.fsm-delete-transition'));
    await fireEvent.click(document.querySelector('.fsm-save-transitions'));

    await waitFor(
      () => {
        expect(document.querySelectorAll('.reqore-modal')).toHaveLength(0);
      },
      { timeout: 5000 }
    );

    await sleep(500);

    await expect(document.querySelectorAll('.fsm-transition')).toHaveLength(1);
  },
};

export const TransitionsCanBeReset: StoryFSM = {
  ...Existing,
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);

    await SwitchesToBuilder.play({ canvasElement, ...rest });
    await fireEvent.click(document.querySelector('.fsm-transition'));

    await waitFor(
      () => {
        expect(
          document.querySelectorAll('.fsm-delete-transition')
        ).toHaveLength(1);
      },
      { timeout: 5000 }
    );

    await fireEvent.click(document.querySelector('.fsm-delete-transition'));

    await waitFor(
      () => {
        expect(canvas.queryByText(/AllTransitionsRemoved/)).toBeTruthy();
      },
      { timeout: 5000 }
    );

    await fireEvent.click(document.querySelector('.fsm-reset-transitions'));

    await waitFor(
      () => {
        expect(
          document.querySelectorAll('.fsm-delete-transition')
        ).toHaveLength(1);
      },
      { timeout: 5000 }
    );
  },
};

export const NewTrueAndFalseTransitionsOnIfState: StoryFSM = {
  args: {
    fsm: QodexWithIfState,
  },
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);

    await SwitchesToBuilder.play({ canvasElement, ...rest });

    await waitFor(
      () => {
        expect(document.querySelectorAll('.fsm-state')).toHaveLength(4);
      },
      { timeout: 5000 }
    );

    await _testsAddNewState(
      'mapper',
      canvas,
      undefined,
      undefined,
      undefined,
      'Gj4QBAh7u3Am',
      'true'
    );

    await sleep(500);

    await _testsAddNewState(
      'mapper',
      canvas,
      undefined,
      undefined,
      undefined,
      'Gj4QBAh7u3Am',
      'false'
    );

    await _testsCloseStateDetail();
    await _testsConfirmDialog();

    await waitFor(
      () => {
        expect(document.querySelectorAll('.fsm-state')).toHaveLength(6);
      },
      { timeout: 5000 }
    );
  },
};
