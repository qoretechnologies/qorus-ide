import { expect } from '@storybook/jest';
import { StoryObj } from '@storybook/react';
import { fireEvent, waitFor, within } from '@storybook/testing-library';
import { compose } from 'recompose';
import { CreateInterface } from '../../../containers/InterfaceCreator';
import withFields from '../../../hocomponents/withFields';
import withGlobalOptions from '../../../hocomponents/withGlobalOptions';
import withInitialData from '../../../hocomponents/withInitialData';
import withMapper from '../../../hocomponents/withMapper';
import withMethods from '../../../hocomponents/withMethods';
import withSteps from '../../../hocomponents/withSteps';
import { DraftsProvider } from '../../../providers/Drafts';
import { InterfacesProvider } from '../../../providers/Interfaces';
import interfaces from '../../Data/interface_samples.json';
import {
  _testsClickButton,
  _testsConfirmDialog,
  _testsExpectFieldsCountToMatch,
  _testsSelectItemFromDropdown,
  _testsWaitForText,
  sleep,
} from '../../Tests/utils';
import { StoryMeta } from '../../types';

const Creator = compose(
  withFields(),
  withInitialData(),
  withMethods(),
  withSteps(),
  withGlobalOptions(),
  withMapper()
)(DraftsProvider);

const meta = {
  component: CreateInterface,
  title: 'Interfaces Manager/Class',
  render: (args) => {
    return (
      <InterfacesProvider>
        <Creator>
          <CreateInterface {...args} />
        </Creator>
      </InterfacesProvider>
    );
  },
} as StoryMeta<typeof CreateInterface>;

export default meta;

type Story = StoryObj<typeof meta>;

export const New: Story = {
  args: {
    data: { subtab: 'class' },
  },
};

export const Existing: Story = {
  args: {
    data: { subtab: 'class', class: interfaces.class[5].data.class },
  },
};

export const ViewCode: Story = {
  ...Existing,
  play: async ({ canvasElement, rest }) => {
    const canvas = within(canvasElement);
    await waitFor(
      () => expect(canvas.queryAllByText('Edit code')[0]).toBeInTheDocument(),
      { timeout: 5000 }
    );
    await fireEvent.click(canvas.queryAllByText('Edit code')[0]);
    await waitFor(
      () => expect(canvas.queryAllByText('Code Editor')[0]).toBeInTheDocument(),
      { timeout: 5000 }
    );
  },
};

export const DraftIsSaved: Story = {
  ...New,
  play: async () => {
    await _testsWaitForText('field-label-display_name');

    await fireEvent.change(
      document.querySelector('.creator-field .reqore-input'),
      { target: { value: 'Test' } }
    );

    await _testsWaitForText('DraftSaved just now');
  },
};

export const FieldsAreFiltered: Story = {
  ...Existing,
  play: async () => {
    await waitFor(
      () => expect(document.querySelector('.reqore-input')).toBeInTheDocument(),
      {
        timeout: 5000,
      }
    );

    await fireEvent.change(document.querySelector('.reqore-input'), {
      target: { value: 'desc' },
    });

    await _testsExpectFieldsCountToMatch(2);
  },
};

export const FieldCanBeRemoved: Story = {
  ...Existing,
  play: async ({ beforeCount, afterCount }) => {
    await _testsExpectFieldsCountToMatch(beforeCount ?? 7, true);
    await _testsClickButton({ selector: '.creator-field-remove' });
    await _testsConfirmDialog();
    await _testsExpectFieldsCountToMatch(afterCount ?? 6, true);
  },
};

export const FieldsCanBeAdded: Story = {
  ...New,
  play: async () => {
    await _testsExpectFieldsCountToMatch(4, true);
    await _testsSelectItemFromDropdown(
      undefined,
      'base-class-name',
      'Optional fields available (8)'
    )();
    await _testsExpectFieldsCountToMatch(5, true);
    await sleep(300);
    await _testsSelectItemFromDropdown(
      undefined,
      'SelectAll',
      'Optional fields available (7)'
    )();
    await _testsExpectFieldsCountToMatch(12, true);
  },
};

export const ChangesCanBeDiscarded: Story = {
  ...New,
  play: async () => {
    await _testsExpectFieldsCountToMatch(4, true);
    await _testsSelectItemFromDropdown(
      undefined,
      'SelectAll',
      'Optional fields available (8)'
    )();
    await _testsExpectFieldsCountToMatch(12, true);
    await _testsClickButton({ label: 'DiscardChangesButton' });
    await _testsConfirmDialog();
    await _testsExpectFieldsCountToMatch(4, true);
  },
};

export const ConfigItemsAreLoaded: Story = {
  ...New,
  play: async () => {
    await _testsClickButton({ label: 'Manage Configuration Items' });
    await _testsWaitForText('Global Item 10');
  },
};

export const SubmittedDataAreCorrect: Story = {
  args: {
    ...Existing.args,
  },
  play: async ({ args, ...rest }) => {
    await FieldCanBeRemoved.play({ args, ...rest });
    await DraftIsSaved.play({ args, ...rest });
    await _testsClickButton({ label: 'Submit' });

    await waitFor(
      () =>
        expect(args.onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ display_name: 'Test' })
        ),
      { timeout: 5000 }
    );
  },
};
