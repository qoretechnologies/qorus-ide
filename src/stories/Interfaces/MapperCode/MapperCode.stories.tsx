import { StoryObj } from '@storybook/react';
import { expect, fireEvent, fn, waitFor, within } from '@storybook/test';
import { compose } from 'recompose';
import { CreateInterface } from '../../../containers/InterfaceCreator';
import withErrors from '../../../hocomponents/withErrors';
import withFields from '../../../hocomponents/withFields';
import withFunctions from '../../../hocomponents/withFunctions';
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
  sleep,
} from '../../Tests/utils';
import { StoryMeta } from '../../types';

const Creator = compose(
  withFields(),
  withInitialData(),
  withMethods(),
  withSteps(),
  withGlobalOptions(),
  withMapper(),
  withErrors(),
  withFunctions()
)(DraftsProvider);

const meta = {
  component: CreateInterface,
  args: {
    onSubmit: fn(),
  },
  title: 'Interfaces Manager/Mapper Code',
  render: (args) => {
    return (
      <InterfacesProvider>
        <Creator {...{ 'mapper-code': args?.data?.['mapper-code'] }}>
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
    data: { subtab: 'mapper-code' },
  },
};

export const Existing: Story = {
  args: {
    data: {
      subtab: 'mapper-code',
      'mapper-code': interfaces['mapper-code'][0].data['mapper-code'],
    },
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

    await _testsExpectFieldsCountToMatch(2, true, 'mapper-code');
  },
};

export const FieldCanBeRemoved: Story = {
  ...Existing,
  parameters: {
    chromatic: { disable: true },
  },
  play: async () => {
    await _testsExpectFieldsCountToMatch(6, true, 'mapper-code');
    await _testsClickButton({ selector: '.creator-field-remove' });
    await _testsConfirmDialog();
    await _testsExpectFieldsCountToMatch(5, true, 'mapper-code');
  },
};

export const FieldsCanBeAdded: Story = {
  ...New,
  parameters: {
    chromatic: { disable: true },
  },
  play: async () => {
    await _testsExpectFieldsCountToMatch(4, true, 'mapper-code');
    await _testsSelectItemFromDropdown(
      undefined,
      'class-class-name',
      'Optional fields available (3)'
    )();
    await _testsExpectFieldsCountToMatch(5, true, 'mapper-code');
    await _testsSelectItemFromDropdown(
      undefined,
      'SelectAll',
      'Optional fields available (2)'
    )();
    await _testsExpectFieldsCountToMatch(7, true, 'mapper-code');
  },
};

export const ChangesCanBeDiscarded: Story = {
  ...New,
  parameters: {
    chromatic: { disable: true },
  },
  play: async () => {
    await _testsExpectFieldsCountToMatch(4, true, 'mapper-code');
    await _testsSelectItemFromDropdown(
      undefined,
      'SelectAll',
      'Optional fields available (3)'
    )();
    await _testsExpectFieldsCountToMatch(7, true, 'mapper-code');
    await fireEvent.change(
      document.querySelector('.creator-field .reqore-input'),
      { target: { value: 'Test' } }
    );
    await _testsClickButton({ label: 'Reset' });
    await _testsConfirmDialog();
    await _testsExpectFieldsCountToMatch(4, true, 'mapper-code');
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
