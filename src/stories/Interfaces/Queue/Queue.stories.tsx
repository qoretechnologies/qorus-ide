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
  _testsExpectFieldsCountToMatch,
  _testsSelectItemFromDropdown,
} from '../../Tests/utils';
import { StoryMeta } from '../../types';
import * as ClassStories from '../Class/Class.stories';

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
  title: 'Interfaces Manager/Queue',
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
    initialData: { subtab: 'queue' },
  },
};

export const Existing: Story = {
  args: {
    initialData: {
      subtab: 'queue',
      queue: interfaces.queue[0].data.queue,
    },
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

    await _testsExpectFieldsCountToMatch(2);
  },
};

export const FieldCanBeRemoved: Story = {
  ...Existing,
  play: async (args) => {
    await ClassStories.FieldCanBeRemoved.play({
      ...args,
      beforeCount: 4,
      afterCount: 3,
    });
  },
};

export const FieldsCanBeAdded: Story = {
  ...New,
  play: async () => {
    await _testsExpectFieldsCountToMatch(2, true);
    await _testsSelectItemFromDropdown(
      undefined,
      'name',
      'Optional fields available (2)'
    )();
    await _testsExpectFieldsCountToMatch(3, true);
    await _testsSelectItemFromDropdown(
      undefined,
      'SelectAll',
      'Optional fields available (1)'
    )();
    await _testsExpectFieldsCountToMatch(4, true);
  },
};

export const ChangesCanBeDiscarded: Story = {
  ...New,
  play: async () => {
    await _testsExpectFieldsCountToMatch(2, true);
    await _testsSelectItemFromDropdown(
      undefined,
      'SelectAll',
      'Optional fields available (2)'
    )();
    await _testsExpectFieldsCountToMatch(4, true);
    await _testsClickButton({ label: 'DiscardChangesButton' });
    await _testsConfirmDialog();
    await _testsExpectFieldsCountToMatch(2, true);
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
