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
  _testsCreatorDraftSaveCheck,
  _testsExpectFieldsCountToMatch,
  _testsSelectItemFromDropdown,
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
  args: {
    onSubmit: fn(),
  },
  title: 'Interfaces Manager/Mapper',
  render: (args) => {
    return (
      <InterfacesProvider>
        <Creator mapper={args.data?.mapper}>
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
    data: { subtab: 'mapper' },
  },
};

export const Existing: Story = {
  args: {
    data: {
      subtab: 'mapper',
      mapper: interfaces.mapper[3].data.mapper,
    },
  },
};

export const ViewDiagram: Story = {
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

    await _testsExpectFieldsCountToMatch(2, true, 'mapper');
  },
};

export const FieldCanBeRemoved: Story = {
  ...Existing,
  parameters: {
    chromatic: { disable: true },
  },
  play: async () => {
    await _testsExpectFieldsCountToMatch(7, true, 'mapper');
    await _testsClickButton({ selector: '.creator-field-remove' });
    await _testsConfirmDialog();
    await _testsExpectFieldsCountToMatch(6, true, 'mapper');
  },
};

export const FieldsCanBeAdded: Story = {
  ...New,
  parameters: {
    chromatic: { disable: true },
  },
  play: async () => {
    await _testsExpectFieldsCountToMatch(2, true, 'mapper');
    await _testsSelectItemFromDropdown(
      undefined,
      'name',
      'Optional fields available (8)'
    )();
    await _testsExpectFieldsCountToMatch(3, true, 'mapper');
    await _testsSelectItemFromDropdown(
      undefined,
      'SelectAll',
      'Optional fields available (7)'
    )();
    await _testsExpectFieldsCountToMatch(10, true, 'mapper');
  },
};

export const ChangesCanBeDiscarded: Story = {
  ...New,
  parameters: {
    chromatic: { disable: true },
  },
  play: async () => {
    await _testsExpectFieldsCountToMatch(2, true, 'mapper');
    await _testsSelectItemFromDropdown(
      undefined,
      'SelectAll',
      'Optional fields available (8)'
    )();
    await _testsExpectFieldsCountToMatch(10, true, 'mapper');
    await _testsClickButton({ label: 'Reset' });
    await _testsConfirmDialog();
    await _testsExpectFieldsCountToMatch(2, true, 'mapper');
  },
};

export const SubmittedDataAreCorrect: Story = {
  args: {
    ...Existing.args,
  },
  // disable chromatic
  parameters: {
    chromatic: { disable: true },
  },
  play: async ({ args, ...rest }) => {
    await FieldCanBeRemoved.play({ args, ...rest });
    await DraftIsSaved.play({ args, ...rest });
    await _testsClickButton({ label: 'Next' });
    await sleep(1000);
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
