import { StoryObj } from '@storybook/react';
import { expect, fireEvent, waitFor, within } from '@storybook/test';
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
  title: 'Interfaces Manager/Step',
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
    data: { subtab: 'step' },
  },
};

export const Existing: Story = {
  args: {
    data: { subtab: 'step', step: interfaces.step[0].data.step },
  },
};

export const ViewCode: Story = {
  ...Existing,
  play: async () => {
    await _testsCreatorViewCode();
  },
};

export const CodeCanBeDocked: Story = {
  ...Existing,
  play: async ({ canvasElement, rest }) => {
    const canvas = within(canvasElement);
    await ViewCode.play({ canvasElement, ...rest });

    await waitFor(
      () => expect(canvas.queryAllByText('Dock')[0]).toBeInTheDocument(),
      { timeout: 5000 }
    );
    await fireEvent.click(canvas.queryAllByText('Dock')[0]);
    await sleep(200);
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

    await _testsExpectFieldsCountToMatch(2);
  },
};

export const FieldCanBeRemoved: Story = {
  ...Existing,
  parameters: {
    chromatic: { disable: true },
  },
  play: async () => {
    await _testsExpectFieldsCountToMatch(12, true);
    await _testsClickButton({ selector: '.creator-field-remove' });
    await _testsConfirmDialog();
    await _testsExpectFieldsCountToMatch(11, true);
  },
};

export const FieldsCanBeAdded: Story = {
  ...New,
  parameters: {
    chromatic: { disable: true },
  },
  play: async () => {
    await _testsExpectFieldsCountToMatch(4, true);
    await _testsSelectItemFromDropdown(
      undefined,
      'name',
      'Optional fields available (18)'
    )();
    await _testsExpectFieldsCountToMatch(5, true);
    await _testsSelectItemFromDropdown(
      undefined,
      'SelectAll',
      'Optional fields available (17)'
    )();
    await _testsExpectFieldsCountToMatch(22, true);
  },
};

export const ChangesCanBeDiscarded: Story = {
  ...New,
  parameters: {
    chromatic: { disable: true },
  },
  play: async () => {
    await _testsExpectFieldsCountToMatch(4, true);
    await _testsSelectItemFromDropdown(
      undefined,
      'SelectAll',
      'Optional fields available (18)'
    )();
    await _testsExpectFieldsCountToMatch(22, true);
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
