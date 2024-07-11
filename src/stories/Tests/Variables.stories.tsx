import { StoryObj } from '@storybook/react';
import { expect, fireEvent, fn, waitFor, within } from '@storybook/test';
import { FSMVariables } from '../../containers/InterfaceCreator/fsm/variables';
import { StoryMeta } from '../types';
import { _testsSelectItemFromDropdown, sleep } from './utils';

const meta = {
  component: FSMVariables,
  title: 'Tests/Variables',
  args: {
    onSubmit: fn(),
    onClose: fn(),
  },
} as StoryMeta<typeof FSMVariables, { stateType?: string }>;

export default meta;

type StoryFSM = StoryObj<typeof meta>;

export const NewVariable: StoryFSM = {
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);

    // Open the variables dialog
    await waitFor(
      async () => {
        await expect(
          document.querySelector('.reqore-modal #create-new-variable')
        ).toBeInTheDocument();
      },
      {
        timeout: 10000,
      }
    );

    await fireEvent.click(
      document.querySelector('.reqore-modal #create-new-variable')
    );
    await expect(
      document.querySelector('.reqore-modal #save-variable')
    ).toBeDisabled();

    await fireEvent.change(
      document.querySelectorAll(
        '.reqore-modal .variables-form .reqore-input'
      )[0],
      {
        target: { value: 'testVariable' },
      }
    );
    await fireEvent.change(
      document.querySelectorAll(
        '.reqore-modal .variables-form .reqore-textarea'
      )[0],
      {
        target: { value: 'This is a test description' },
      }
    );

    await _testsSelectItemFromDropdown(canvas, 'data-provider', 'string')();

    await fireEvent.click(
      document.querySelector('.reqore-modal .provider-type-selector')
    );
    await fireEvent.click(canvas.getByText('datasource'));
    await waitFor(
      async () => {
        await fireEvent.click(
          document.querySelector('.reqore-modal .provider-selector')
        );
        await fireEvent.click(canvas.getAllByText('Omquser')[0]);
      },
      {
        timeout: 15000,
      }
    );

    await sleep(1000);

    await waitFor(
      async () => {
        await fireEvent.change(
          document.querySelectorAll('.reqore-modal .reqore-textarea')[1],
          {
            target: { value: 'SELECT * FROM gl_record' },
          }
        );
        await sleep(1000);
        await fireEvent.click(canvas.getAllByText('Apply search options')[0]);
      },
      {
        timeout: 5000,
      }
    );

    await sleep(1000);

    await waitFor(
      async () => {
        await expect(
          document.querySelector('.reqore-modal #save-variable')
        ).toBeEnabled();
        await fireEvent.click(
          document.querySelector('.reqore-modal #save-variable')
        );
        await fireEvent.click(
          document.querySelector('.reqore-modal #submit-variables')
        );
      },
      {
        timeout: 5000,
      }
    );

    if (rest.args.onSubmit) {
      await expect(rest.args.onSubmit).toHaveBeenCalled();
    }
  },
};
