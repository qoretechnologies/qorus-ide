import { StoryObj } from '@storybook/react';
import { expect, fireEvent, fn, waitFor } from '@storybook/test';
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
  args: {
    onSubmit: fn(),
  },
  title: 'Interfaces Manager/Value Map',
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
    data: { subtab: 'value-map' },
  },
};

export const Existing: Story = {
  args: {
    data: {
      subtab: 'value-map',
      'value-map': interfaces['value-map'][0].data['value-map'],
    },
  },
};

export const DraftIsSaved: Story = {
  ...New,
  parameters: {
    chromatic: { disable: true },
  },
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

    await _testsExpectFieldsCountToMatch(2);
  },
};

export const FieldCanBeRemoved: Story = {
  ...Existing,
  parameters: {
    chromatic: { disable: true },
  },
  play: async (args) => {
    await ClassStories.FieldCanBeRemoved.play({
      ...args,
      beforeCount: 9,
      afterCount: 8,
    });
  },
};

export const FieldsCanBeAdded: Story = {
  ...New,
  parameters: {
    chromatic: { disable: true },
  },
  play: async () => {
    await _testsExpectFieldsCountToMatch(2, true);
    await _testsSelectItemFromDropdown(
      undefined,
      'short_desc',
      'Optional fields available (7)'
    )();
    await _testsExpectFieldsCountToMatch(3, true);
    await sleep(300);
    await _testsSelectItemFromDropdown(
      undefined,
      'SelectAll',
      'Optional fields available (6)'
    )();
    await _testsExpectFieldsCountToMatch(8, true);
  },
};

export const ChangesCanBeDiscarded: Story = {
  ...New,
  parameters: {
    chromatic: { disable: true },
  },
  play: async () => {
    await _testsExpectFieldsCountToMatch(2, true);
    await _testsSelectItemFromDropdown(
      undefined,
      'SelectAll',
      'Optional fields available (7)'
    )();
    await _testsExpectFieldsCountToMatch(8, true);
    await fireEvent.change(
      document.querySelector('.creator-field .reqore-input'),
      { target: { value: 'Test' } }
    );
    await _testsClickButton({ label: 'Reset' });
    await _testsConfirmDialog();
    await _testsExpectFieldsCountToMatch(2, true);
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
