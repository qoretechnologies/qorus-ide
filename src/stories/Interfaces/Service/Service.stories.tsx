import { expect } from '@storybook/jest';
import { StoryObj } from '@storybook/react';
import { fireEvent, waitFor } from '@storybook/testing-library';
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
  _testsCreatorDraftSaveCheck,
  _testsCreatorViewCode,
  _testsExpectFieldsCountToMatch,
  _testsSelectItemFromDropdown,
  _testsWaitForText,
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
  title: 'Interfaces Manager/Service',
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
    initialData: { subtab: 'service' },
  },
};

export const Existing: Story = {
  args: {
    initialData: {
      subtab: 'service',
      service: interfaces.service[0].data.service,
    },
  },
};

export const ViewCode: Story = {
  ...Existing,
  play: async () => {
    await _testsCreatorViewCode();
  },
};

export const DraftIsSaved: Story = {
  ...New,
  play: async () => {
    await _testsCreatorDraftSaveCheck();
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

    await _testsExpectFieldsCountToMatch(2, true, 'service');
  },
};

export const FieldCanBeRemoved: Story = {
  ...Existing,
  play: async () => {
    await _testsExpectFieldsCountToMatch(9, true, 'service');
    await _testsClickButton({ selector: '.creator-field-remove' });
    await _testsConfirmDialog();
    await _testsExpectFieldsCountToMatch(8, true, 'service');
  },
};

export const FieldsCanBeAdded: Story = {
  ...New,
  play: async () => {
    await _testsExpectFieldsCountToMatch(4, true, 'service');
    await _testsSelectItemFromDropdown(
      undefined,
      'base-class-name',
      'Optional fields available (28)'
    )();
    await _testsExpectFieldsCountToMatch(5, true, 'service');
    await _testsSelectItemFromDropdown(
      undefined,
      'SelectAll',
      'Optional fields available (27)'
    )();
    await _testsExpectFieldsCountToMatch(24, true, 'service');
  },
};

export const ChangesCanBeDiscarded: Story = {
  ...New,
  play: async () => {
    await _testsExpectFieldsCountToMatch(4, true, 'service');
    await _testsSelectItemFromDropdown(
      undefined,
      'SelectAll',
      'Optional fields available (28)'
    )();
    await _testsExpectFieldsCountToMatch(24, true, 'service');
    await _testsClickButton({ label: 'DiscardChangesButton' });
    await _testsConfirmDialog();
    await _testsExpectFieldsCountToMatch(4, true, 'service');
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
