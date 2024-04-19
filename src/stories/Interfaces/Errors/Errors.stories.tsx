import { expect } from '@storybook/jest';
import { StoryObj } from '@storybook/react';
import { fireEvent, waitFor } from '@storybook/testing-library';
import { compose } from 'recompose';
import { CreateInterface } from '../../../containers/InterfaceCreator';
import withErrors from '../../../hocomponents/withErrors';
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
  _testsCreatorDraftSaveCheck,
  _testsExpectFieldsCountToMatch,
  _testsSelectItemFromDropdown,
} from '../../Tests/utils';
import { StoryMeta } from '../../types';

const Creator = compose(
  withFields(),
  withInitialData(),
  withMethods(),
  withSteps(),
  withGlobalOptions(),
  withMapper(),
  withErrors()
)(DraftsProvider);

const meta = {
  component: CreateInterface,
  title: 'Interfaces Manager/Errors',
  render: (args) => {
    return (
      <InterfacesProvider>
        <Creator errors={args?.data?.errors}>
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
    data: { subtab: 'errors' },
  },
};

export const Existing: Story = {
  args: {
    data: {
      subtab: 'errors',
      errors: interfaces.errors[0].data.errors,
    },
  },
};

export const ShowsMethods: Story = {
  ...Existing,
  play: async () => {
    await _testsClickButton({ label: 'Next' });
  },
};

export const DraftIsSaved: Story = {
  ...New,
  parameters: {
    chromatic: { disable: true },
  },

  play: async () => {
    await _testsCreatorDraftSaveCheck();
  },
};

export const FieldsAreFiltered: Story = {
  ...Existing,
  parameters: {
    chromatic: { disable: true },
  },

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

    await _testsExpectFieldsCountToMatch(2, true, 'errors');
  },
};

export const FieldCanBeRemoved: Story = {
  ...Existing,
  parameters: {
    chromatic: { disable: true },
  },

  play: async () => {
    await _testsExpectFieldsCountToMatch(4, true, 'errors');
    await _testsClickButton({ selector: '.creator-field-remove' });
    await _testsConfirmDialog();
    await _testsExpectFieldsCountToMatch(3, true, 'errors');
  },
};

export const FieldsCanBeAdded: Story = {
  ...New,
  parameters: {
    chromatic: { disable: true },
  },

  play: async () => {
    await _testsExpectFieldsCountToMatch(2, true, 'errors');
    await _testsSelectItemFromDropdown(
      undefined,
      'name',
      'Optional fields available (2)'
    )();
    await _testsExpectFieldsCountToMatch(3, true, 'errors');
    await _testsSelectItemFromDropdown(
      undefined,
      'SelectAll',
      'Optional fields available (1)'
    )();
    await _testsExpectFieldsCountToMatch(4, true, 'errors');
  },
};

export const ChangesCanBeDiscarded: Story = {
  ...New,
  parameters: {
    chromatic: { disable: true },
  },

  play: async () => {
    await _testsExpectFieldsCountToMatch(2, true, 'errors');
    await _testsSelectItemFromDropdown(
      undefined,
      'SelectAll',
      'Optional fields available (2)'
    )();
    await _testsExpectFieldsCountToMatch(4, true, 'errors');
    await _testsClickButton({ label: 'DiscardChangesButton' });
    await _testsConfirmDialog();
    await _testsExpectFieldsCountToMatch(2, true, 'errors');
  },
};

export const SubmittedDataAreCorrect: Story = {
  args: {
    ...Existing.args,
  },
  parameters: {
    chromatic: { disable: true },
  },
  play: async ({ args, ...rest }) => {
    await FieldCanBeRemoved.play({ args, ...rest });
    await DraftIsSaved.play({ args, ...rest });
    await _testsClickButton({ label: 'Next' });
    await _testsClickButton({ label: 'Submit', wait: 10000 });

    await waitFor(
      () =>
        expect(args.onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ display_name: 'Test' })
        ),
      { timeout: 5000 }
    );
  },
};
