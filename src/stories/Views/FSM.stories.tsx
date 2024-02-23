import { expect } from '@storybook/jest';
import { StoryObj } from '@storybook/react';
import { fireEvent, waitFor, within } from '@storybook/testing-library';
import FSMView from '../../containers/InterfaceCreator/fsm';
import fsm from '../Data/fsm.json';
import fsmWithoutInitialState from '../Data/fsmWithoutInitialState.json';
import multipleVariablesFsm from '../Data/multipleVariablesFsm.json';
import qodex from '../Data/qodex.json';
import qodexWithMultipleAppsAndActions from '../Data/qodexWithMultipleAppsAndActions.json';
import transactionStateFsm from '../Data/transacitonStateFsm.json';
import { AutoAlign } from '../Tests/FSM/Alignment.stories';
import { SwitchesToBuilder } from '../Tests/FSM/Basic.stories';
import {
  _testsAddNewState,
  _testsClickState,
  _testsClickStateByLabel,
  _testsCreateSelectionBox,
  _testsDoubleClickState,
  _testsOpenAppCatalogue,
  _testsSelectAppOrAction,
  _testsSelectState,
  sleep,
} from '../Tests/utils';
import { StoryMeta } from '../types';

const meta = {
  component: FSMView,
  title: 'Views/FSM',
  args: {
    reqoreOptions: {
      animations: {
        dialogs: false,
      },
    },
  },
} as StoryMeta<typeof FSMView>;

export default meta;

type StoryFSM = StoryObj<typeof meta>;
export const New: StoryFSM = {};
export const Existing: StoryFSM = {
  args: {
    fsm: qodex,
  },
};
export const ExistingFSMWithInitialState: StoryFSM = {
  args: {
    fsm,
  },
};

export const ExistingFSMWithoutInitialState: StoryFSM = {
  args: {
    fsm: fsmWithoutInitialState,
  },
};

export const ExportData: StoryFSM = {
  args: {
    fsm: qodexWithMultipleAppsAndActions,
  },
  play: async ({ canvasElement, stateType, ...rest }) => {
    await SwitchesToBuilder.play({ canvasElement, ...rest });

    await sleep(1000);

    await fireEvent.click(document.querySelector(`.fsm-publish-more`));
    await waitFor(
      () =>
        expect(document.querySelector('.fsm-export-data')).toBeInTheDocument(),
      {
        timeout: 10000,
      }
    );
    await fireEvent.click(document.querySelector(`.fsm-export-data`));
    await waitFor(
      () => expect(document.querySelector('.reqore-modal')).toBeInTheDocument(),
      {
        timeout: 10000,
      }
    );
  },
};

export const CatalogueOpen: StoryFSM = {
  args: {
    fsm: multipleVariablesFsm,
  },
  play: async ({ canvasElement, stateType, ...rest }) => {
    await SwitchesToBuilder.play({ canvasElement, ...rest });

    await sleep(1000);

    await fireEvent.dblClick(
      document.querySelector(`#fsm-diagram .element-pan`)
    );
    await waitFor(
      () =>
        expect(document.querySelector('.fsm-app-selector')).toBeInTheDocument(),
      {
        timeout: 10000,
      }
    );
  },
};

export const NewState: StoryFSM = {
  play: async ({ canvasElement, stateType = 'trigger', ...rest }) => {
    const canvas = within(canvasElement);

    await SwitchesToBuilder.play({ canvasElement, ...rest });

    if (stateType !== 'trigger') {
      await _testsAddNewState('trigger', canvas, undefined, 50, 50);

      await sleep(1000);

      await waitFor(
        () =>
          expect(
            document.querySelector('.state-saved-flag')
          ).toBeInTheDocument(),
        {
          timeout: 5000,
        }
      );
    }

    await _testsAddNewState(
      stateType,
      canvas,
      undefined,
      50,
      stateType === 'trigger' ? 50 : 250,
      stateType === 'trigger' ? undefined : 0
    );

    if (stateType !== 'trigger') {
      await expect(document.querySelectorAll('.fsm-state')).toHaveLength(2);
    } else {
      await expect(document.querySelectorAll('.fsm-state')).toHaveLength(1);
    }
  },
};

export const SelectedState: StoryFSM = {
  args: {
    fsm: qodex,
  },
  play: async ({ canvasElement, ...rest }) => {
    await SwitchesToBuilder.play({ canvasElement, ...rest });
    await waitFor(() => document.querySelector('#state-3'));
    await _testsClickState('Get User Info');
  },
};

export const MultipleDeepVariableStates: StoryFSM = {
  args: {
    fsm: multipleVariablesFsm,
  },
  play: async ({ canvasElement, stateType, ...rest }) => {
    const canvas = within(canvasElement);
    await SwitchesToBuilder.play({ canvasElement, ...rest });

    await _testsClickState('State 2');

    await waitFor(
      async () =>
        await expect(
          document.querySelector('.state-next-button')
        ).toBeDisabled(),
      {
        timeout: 5000,
      }
    );

    // Fill the required option
    await waitFor(
      async () => {
        await fireEvent.change(
          document.querySelectorAll('.system-option .reqore-textarea')[0],
          {
            target: {
              value: 'This is a test',
            },
          }
        );
      },
      { timeout: 5000 }
    );

    await waitFor(
      async () =>
        await expect(
          document.querySelector('.state-next-button')
        ).toBeEnabled(),
      {
        timeout: 5000,
      }
    );

    await waitFor(async () => await canvas.findAllByText('Next'), {
      timeout: 5000,
    });

    await fireEvent.click(canvas.getAllByText('Next')[0]);

    await waitFor(async () => await canvas.findAllByText('State 2.State 3'), {
      timeout: 5000,
    });

    await _testsClickStateByLabel(canvas, 'State 2.State 3');

    await waitFor(
      async () =>
        await expect(
          document.querySelector('.state-next-button')
        ).toBeDisabled(),
      {
        timeout: 5000,
      }
    );

    // Fill the required option
    await waitFor(
      async () => {
        await fireEvent.change(
          document.querySelectorAll('.system-option .reqore-textarea')[1],
          {
            target: {
              value: 'This is a test 2',
            },
          }
        );
      },
      { timeout: 5000 }
    );

    await waitFor(
      async () =>
        await expect(
          document.querySelector('.state-next-button')
        ).toBeEnabled(),
      {
        timeout: 5000,
      }
    );

    await waitFor(async () => await canvas.findAllByText('Next'), {
      timeout: 5000,
    });

    await fireEvent.click(canvas.getAllByText('Next')[0]);

    await waitFor(
      async () =>
        expect(
          canvas.getAllByText('State 2.State 3.State 6')[0]
        ).toBeInTheDocument(),
      {
        timeout: 5000,
      }
    );
  },
};

export const TransactionState: StoryFSM = {
  args: {
    fsm: transactionStateFsm,
  },
  play: async ({ canvasElement, stateType, ...rest }) => {
    const canvas = within(canvasElement);
    await SwitchesToBuilder.play({ canvasElement, ...rest });

    await _testsClickState('State 1');

    await sleep(1500);

    await waitFor(async () => await canvas.findAllByText('Next'), {
      timeout: 5000,
    });

    await sleep(1500);

    await fireEvent.click(canvas.getAllByText('Next')[0]);
  },
};

export const ReadonlyVariablesInState: StoryFSM = {
  args: {
    fsm: multipleVariablesFsm,
  },
  play: async ({ canvasElement, stateType, ...rest }) => {
    const canvas = within(canvasElement);
    await MultipleDeepVariableStates.play({ canvasElement, ...rest });
    await sleep(1000);
    await _testsOpenAppCatalogue('State-2.State-3');
    await _testsSelectAppOrAction(canvas, 'Variables');
  },
};

export const IncompatibleStates: StoryFSM = {
  args: {
    fsm,
  },
  play: async ({ canvasElement, ...rest }) => {
    await AutoAlign.play({ canvasElement, ...rest });

    await sleep(500);

    // Fake double click lol
    await _testsDoubleClickState('Save Intent Info');
  },
};

export const SelectedStates: StoryFSM = {
  args: {
    fsm,
  },
  play: async ({ canvasElement, ...rest }) => {
    await AutoAlign.play({ canvasElement, ...rest });

    await sleep(500);

    await _testsSelectState('Save Intent Info');
    await _testsSelectState('Intent: Call Back Later?');
    await _testsSelectState('Intent: Update Ticket Info');
  },
};

export const SelectionBox: StoryFSM = {
  args: {
    fsm,
  },
  play: async ({ canvasElement, ...rest }) => {
    await AutoAlign.play({ canvasElement, ...rest });

    await sleep(500);

    await _testsCreateSelectionBox(400, 200, 600, 400);
  },
};
