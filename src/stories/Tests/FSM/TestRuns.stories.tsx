import { expect } from '@storybook/jest';
import { StoryObj } from '@storybook/react';
import { fireEvent, waitFor } from '@storybook/testing-library';
import FSMView from '../../../containers/InterfaceCreator/fsm';
import QodexWithIfState from '../../Data/qodexWithIfState.json';
import { StoryMeta } from '../../types';
import { SwitchesToBuilder } from './Basic.stories';

const meta = {
  component: FSMView,
  title: 'Tests/FSM/Test Runs',
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

export const SuccessfulyRunsTest: StoryFSM = {
  args: {
    fsm: QodexWithIfState,
  },
  play: async ({ canvasElement, ...rest }) => {
    await SwitchesToBuilder.play({ canvasElement, ...rest });
    await fireEvent.click(document.querySelector('.fsm-test-run'));

    await waitFor(
      () => {
        expect(
          document.querySelectorAll('.reqore-modal .reqore-collection-item')
        ).toHaveLength(3);
      },
      { timeout: 10000 }
    );
  },
};
