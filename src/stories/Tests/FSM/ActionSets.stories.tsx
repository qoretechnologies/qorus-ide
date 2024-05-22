import { StoryObj } from '@storybook/react';
import { expect, fireEvent, waitFor, within } from '@storybook/test';
import FSMView from '../../../containers/InterfaceCreator/fsm';
import { InterfacesProvider } from '../../../providers/Interfaces';
import { Existing } from '../../Views/FSM.stories';
import { StoryMeta } from '../../types';
import {
    _testsClickStateByLabel,
    _testsCloseAppCatalogue,
    _testsDeleteState,
    _testsOpenAppCatalogue,
    _testsSelectAppOrAction,
    _testsSelectFromAppCatalogue,
    _testsSelectStateByLabel,
    sleep,
} from '../utils';
import { SwitchesToBuilder } from './Basic.stories';

const meta = {
  component: FSMView,
  title: 'Tests/FSM/Action Sets',
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

export const CreateNewSet: StoryFSM = {
  ...Existing,
  play: async ({ canvasElement, openAfter = true, ...rest }) => {
    const canvas = within(canvasElement);
    await SwitchesToBuilder.play({ canvasElement, ...rest });

    await sleep(500);

    await _testsSelectStateByLabel(canvas, 'Get User Info');
    await _testsSelectStateByLabel(canvas, 'Send Discord Message');

    await sleep(200);

    await fireEvent.click(document.querySelector('#save-action-set'));

    await sleep(200);

    await fireEvent.change(
      document.querySelectorAll('.system-option.reqore-textarea')[0],
      {
        target: { value: 'Test action set' },
      }
    );

    await sleep(200);

    await fireEvent.click(document.querySelector('#submit-action-set'));

    await waitFor(
      () =>
        expect(document.querySelector('.reqore-modal')).not.toBeInTheDocument(),
      {
        timeout: 10000,
      }
    );

    if (openAfter) {
      await _testsOpenAppCatalogue(undefined, 500, 200);
      await _testsSelectAppOrAction(canvas, 'Saved Favorites');
    }
  },
};

export const CreateNewSetWithEventTrigger: StoryFSM = {
  ...Existing,
  play: async ({ canvasElement, openAfter = true, ...rest }) => {
    const canvas = within(canvasElement);
    await SwitchesToBuilder.play({ canvasElement, ...rest });

    await sleep(500);

    await _testsSelectStateByLabel(canvas, 'Schedule');
    await _testsSelectStateByLabel(canvas, 'Get User Info');
    await _testsSelectStateByLabel(canvas, 'Send Discord Message');

    await sleep(200);

    await fireEvent.click(document.querySelector('#save-action-set'));

    await sleep(200);

    await fireEvent.change(
      document.querySelectorAll('.system-option.reqore-textarea')[0],
      {
        target: { value: 'With Event Trigger' },
      }
    );

    await sleep(200);

    await fireEvent.click(document.querySelector('#submit-action-set'));

    await waitFor(
      () =>
        expect(document.querySelector('.reqore-modal')).not.toBeInTheDocument(),
      {
        timeout: 10000,
      }
    );

    if (openAfter) {
      await _testsDeleteState('Schedule');
      await _testsOpenAppCatalogue(undefined, 500, 200);
      await _testsSelectAppOrAction(canvas, 'Saved Favorites');
    }
  },
};

export const AddNewSet: StoryFSM = {
  ...Existing,
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);
    await CreateNewSet.play({ canvasElement, openAfter: false, ...rest });

    await _testsOpenAppCatalogue(undefined, 500, 400);

    await _testsSelectFromAppCatalogue(
      canvas,
      undefined,
      'Saved Favorites',
      'Test action set'
    );

    await sleep(200);

    await expect(document.querySelectorAll('.fsm-state').length).toBe(5);
  },
};

export const AddNewSetWithEventTrigger: StoryFSM = {
  ...Existing,
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);
    await CreateNewSetWithEventTrigger.play({
      canvasElement,
      openAfter: false,
      ...rest,
    });

    await _testsDeleteState('Schedule');

    await _testsOpenAppCatalogue(undefined, 500, 200);

    await _testsSelectFromAppCatalogue(
      canvas,
      undefined,
      'Saved Favorites',
      'With Event Trigger'
    );

    await sleep(200);

    await expect(document.querySelectorAll('.fsm-state').length).toBe(5);
  },
};

export const AddNewSetFromState: StoryFSM = {
  ...Existing,
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);
    await CreateNewSet.play({ canvasElement, openAfter: false, ...rest });

    await fireEvent.click(document.querySelectorAll('.add-new-state-after')[0]);

    await _testsSelectFromAppCatalogue(
      canvas,
      undefined,
      'Saved Favorites',
      'Test action set'
    );

    await sleep(200);

    await expect(document.querySelectorAll('.fsm-state').length).toBe(5);
  },
};

export const AddNewSetFromStateFromSet: StoryFSM = {
  ...Existing,
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);
    await AddNewSetFromState.play({ canvasElement, openAfter: false, ...rest });

    await fireEvent.click(document.querySelectorAll('.add-new-state-after')[3]);

    await _testsSelectFromAppCatalogue(
      canvas,
      undefined,
      'Saved Favorites',
      'Test action set'
    );

    await sleep(200);

    await expect(document.querySelectorAll('.fsm-state').length).toBe(7);
  },
};

export const AddNewSetFromStateAndFreely: StoryFSM = {
  ...Existing,
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);
    await CreateNewSet.play({ canvasElement, openAfter: false, ...rest });

    await fireEvent.click(document.querySelectorAll('.add-new-state-after')[0]);

    await _testsSelectFromAppCatalogue(
      canvas,
      undefined,
      'Saved Favorites',
      'Test action set'
    );

    await sleep(200);

    await expect(document.querySelectorAll('.fsm-state').length).toBe(5);

    await await _testsOpenAppCatalogue(undefined, 850, 250);

    await _testsSelectFromAppCatalogue(
      canvas,
      undefined,
      'Saved Favorites',
      'Test action set'
    );

    await sleep(200);

    await expect(document.querySelectorAll('.fsm-state').length).toBe(7);
  },
};

export const RemoveActionSet: StoryFSM = {
  ...CreateNewSet,
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);
    await CreateNewSet.play({ canvasElement, openAfter: false, ...rest });

    await _testsOpenAppCatalogue(undefined, 500, 200);

    await expect(
      document.querySelectorAll('.reqore-collection-item').length
    ).toBe(29);

    await _testsSelectAppOrAction(canvas, 'Saved Favorites');

    await fireEvent.click(document.querySelector('.action-set-remove'));

    await sleep(200);

    await expect(
      document.querySelectorAll('.reqore-collection-item').length
    ).toBe(28);
  },
};

export const SaveStateAsFavorite: StoryFSM = {
  ...Existing,
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);
    await SwitchesToBuilder.play({ canvasElement, ...rest });
    await sleep(500);
    await _testsClickStateByLabel(canvas, 'Get User Info');
    await waitFor(
      () =>
        expect(
          document.querySelector('.state-favorite-button')
        ).toBeInTheDocument(),
      { timeout: 10000 }
    );
    await sleep(500);
    await fireEvent.click(document.querySelector('.state-favorite-button'));
    await sleep(200);
    await _testsOpenAppCatalogue(undefined, 500, 200);
    await _testsSelectAppOrAction(canvas, 'Saved Favorites');
    await expect(
      canvas.queryAllByText('Get User Info', {
        selector: '.fsm-app-selector h4',
      })
    ).toHaveLength(1);
  },
};

export const RemoveFavoriteState: StoryFSM = {
  ...SaveStateAsFavorite,
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);
    await SaveStateAsFavorite.play({ canvasElement, ...rest });
    await sleep(200);
    await fireEvent.click(document.querySelector('.action-set-remove'));
    await expect(canvas.queryAllByText('Saved Favorites')).toHaveLength(0);
    await _testsCloseAppCatalogue();
  },
};
