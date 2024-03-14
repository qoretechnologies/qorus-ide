import { expect } from '@storybook/jest';
import { StoryObj } from '@storybook/react';
import { fireEvent, waitFor, within } from '@storybook/testing-library';
import FSMView from '../../../containers/InterfaceCreator/fsm';
import fsm from '../../Data/fsm.json';
import { Existing, NewState } from '../../Views/FSM.stories';
import { StoryMeta } from '../../types';
import {
  _testsClickState,
  _testsCloneState,
  _testsCloseStateDetail,
  _testsConfirmDialog,
  _testsCreateSelectionBox,
  _testsDeleteMultipleStates,
  _testsDeleteState,
  _testsDoubleClickState,
  _testsSelectFromAppCatalogue,
  sleep,
} from '../utils';
import { AutoAlign } from './Alignment.stories';

const meta = {
  component: FSMView,
  title: 'Tests/FSM/Basic',
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

export const SwitchesToBuilder: StoryFSM = {
  args: {
    fsm,
  },
  play: async () => {
    await waitFor(
      async () => {
        await expect(
          document.querySelector('#fsm-diagram svg')
        ).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  },
};

export const NewStatesAfterState: StoryFSM = {
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);

    await NewState.play({ canvasElement, ...rest });

    await sleep(1000);

    await fireEvent.click(document.querySelector('.add-new-state-after'));
    await _testsSelectFromAppCatalogue(
      canvas,
      undefined,
      'Discord',
      'Get Server Info'
    );

    await sleep(300);

    await fireEvent.click(document.querySelectorAll('.add-new-state-after')[0]);
    await _testsSelectFromAppCatalogue(
      canvas,
      undefined,
      'Discord',
      'Get User Info'
    );

    await expect(document.querySelectorAll('.fsm-state').length).toBe(3);
  },
};

export const ShowsStateIds: StoryFSM = {
  args: {
    fsm,
  },
  play: async ({ canvasElement, ...rest }) => {
    await AutoAlign.play({ canvasElement, ...rest });

    const canvas = within(canvasElement);

    await sleep(1000);

    await fireEvent.click(document.querySelector('.fsm-more-actions'));
    await sleep(100);
    await fireEvent.click(document.querySelector('#show-state-ids'));
    await sleep(100);
    await expect(
      canvas.getAllByText('[1] Save Intent Info')[0]
    ).toBeInTheDocument();
  },
};

export const SelectedStateChange: StoryFSM = {
  args: {
    fsm,
  },
  play: async ({ canvasElement, ...rest }) => {
    await SwitchesToBuilder.play({ canvasElement, ...rest });

    await _testsClickState('Intent: Close Ticket?');

    await sleep(1000);

    await waitFor(
      async () => {
        await expect(
          document.querySelector('.fsm-state-detail')
        ).toBeInTheDocument();
        await expect(
          document.querySelector('.fsm-state-detail h3').textContent
        ).toBe('Intent: Close Ticket?');
      },
      { timeout: 10000 }
    );

    await sleep(500);

    await _testsClickState('Save Intent Info');

    await sleep(500);

    await waitFor(
      async () => {
        // Make sure the h3 with text `Intent: Close Ticket?` inside .reqore-drawer is visible
        await expect(
          document.querySelector('.fsm-state-detail h3').textContent
        ).toBe('Save Intent Info');
      },
      { timeout: 10000 }
    );
  },
};

export const StateIsDeleted: StoryFSM = {
  args: {
    fsm,
  },
  play: async ({ canvasElement, ...rest }) => {
    await AutoAlign.play({ canvasElement, ...rest });

    await sleep(1500);

    await expect(document.querySelectorAll('.fsm-state').length).toBe(9);
    await expect(document.querySelectorAll('.fsm-transition').length).toBe(8);

    await _testsDeleteState('Intent: Close Ticket?');

    await expect(document.querySelectorAll('.fsm-state').length).toBe(8);
    await expect(document.querySelectorAll('.fsm-transition').length).toBe(5);
  },
};

export const MultipleStatesAreDeleted: StoryFSM = {
  args: {
    fsm,
  },
  play: async ({ canvasElement, ...rest }) => {
    await SwitchesToBuilder.play({ canvasElement, ...rest });
    await sleep(500);

    await _testsCreateSelectionBox(300, 100, 800, 800, true);

    await sleep(500);

    await expect(document.querySelectorAll('.fsm-state').length).toBe(9);
    await expect(document.querySelectorAll('.fsm-transition').length).toBe(8);

    await _testsDeleteMultipleStates();

    await expect(document.querySelectorAll('.fsm-state').length).toBe(6);
  },
};

export const StatesCanBeCloned: StoryFSM = {
  ...Existing,
  play: async ({ canvasElement, ...rest }) => {
    await SwitchesToBuilder.play({ canvasElement, ...rest });

    await sleep(200);

    await _testsCloneState('Get User Info');
  },
};

export const StatesCanBeConnected: StoryFSM = {
  args: {
    fsm,
  },
  play: async ({ canvasElement, ...rest }) => {
    await StateIsDeleted.play({ canvasElement, ...rest });

    await sleep(200);

    await expect(document.querySelectorAll('.fsm-transition').length).toBe(5);

    // Fake double click lol
    await _testsDoubleClickState('Save Intent Info');

    await sleep(2000);

    await _testsClickState('Update Ticket Info');

    await sleep(2000);

    await waitFor(
      () => expect(document.querySelectorAll('.fsm-transition').length).toBe(6),
      {
        timeout: 10000,
      }
    );
  },
};

export const StateIsNotRemovedIfUnfinished: StoryFSM = {
  parameters: {
    chromatic: { disable: true },
  },
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);

    await NewState.play({ canvasElement, ...rest });

    await sleep(1000);

    await fireEvent.click(document.querySelector('.add-new-state-after'));
    await _testsSelectFromAppCatalogue(
      canvas,
      undefined,
      'Discord',
      'Get Server Info'
    );

    await sleep(1000);

    await _testsCloseStateDetail();

    await sleep(1000);

    await _testsConfirmDialog();

    await sleep(200);

    await expect(document.querySelectorAll('.fsm-state').length).toBe(2);
  },
};

export const ZoomIn: StoryFSM = {
  args: {
    fsm,
  },
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);
    await SwitchesToBuilder.play({ canvasElement, ...rest });

    await expect(document.querySelectorAll('.fsm-state').length).toBe(8);

    await sleep(1000);

    await fireEvent.click(document.querySelector('.fsm-more-actions'));
    await sleep(100);
    await fireEvent.click(document.querySelector('.fsm-zoom-in'));
    await sleep(100);

    await fireEvent.click(document.querySelector('.fsm-more-actions'));
    await sleep(100);
    await fireEvent.click(document.querySelector('.fsm-zoom-in'));
    await sleep(100);

    await fireEvent.click(document.querySelector('.fsm-more-actions'));
    await sleep(100);
    await fireEvent.click(document.querySelector('.fsm-zoom-in'));

    await sleep(100);
    await fireEvent.wheel(document.querySelector('#fsm-diagram'), {
      deltaY: -1,
    });
    await sleep(100);
    await fireEvent.wheel(document.querySelector('#fsm-diagram'), {
      deltaY: -1,
    });
    await sleep(100);

    await fireEvent.click(document.querySelector('.fsm-more-actions'));
    await sleep(100);
    await expect(canvas.getAllByText('150% [Reset]')[0]).toBeInTheDocument();
  },
};

export const ZoomOut: StoryFSM = {
  args: {
    fsm,
  },
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);
    await SwitchesToBuilder.play({ canvasElement, ...rest });

    await expect(document.querySelectorAll('.fsm-state').length).toBe(8);

    await sleep(1000);

    await fireEvent.click(document.querySelector('.fsm-more-actions'));
    await sleep(100);
    await fireEvent.click(document.querySelector('.fsm-zoom-out'));
    await fireEvent.click(document.querySelector('.fsm-more-actions'));
    await sleep(100);
    await fireEvent.click(document.querySelector('.fsm-zoom-out'));
    await fireEvent.click(document.querySelector('.fsm-more-actions'));
    await sleep(100);
    await fireEvent.click(document.querySelector('.fsm-zoom-out'));
    await sleep(100);
    await fireEvent.wheel(document.querySelector('#fsm-diagram'), {
      deltaY: 1,
    });
    await sleep(100);
    await fireEvent.wheel(document.querySelector('#fsm-diagram'), {
      deltaY: 1,
    });
    await sleep(100);

    await fireEvent.click(document.querySelector('.fsm-more-actions'));
    await sleep(100);
    await expect(canvas.getAllByText('50% [Reset]')[0]).toBeInTheDocument();
  },
};

export const ZoomReset: StoryFSM = {
  args: {
    fsm,
  },
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);
    await ZoomOut.play({ canvasElement, ...rest });

    await fireEvent.click(document.querySelector('.fsm-zoom-reset'));
    await sleep(100);
    await fireEvent.click(document.querySelector('.fsm-more-actions'));
    await sleep(100);
    await expect(canvas.getAllByText('100% [Reset]')[0]).toBeInTheDocument();
  },
};
