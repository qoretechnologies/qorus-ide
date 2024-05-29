import { Meta, StoryObj } from '@storybook/react';
import { expect, fireEvent, fn, waitFor, within } from '@storybook/test';
import { useState } from 'react';
import { TemplateField } from '../../../components/Field/template';
import { buildTemplates } from '../../../helpers/functions';
import templates from '../../Data/templates.json';
import { ShowsTemplatesListForString } from '../../Fields/Template.stories';
import { sleep } from '../utils';

const meta = {
  component: TemplateField,
  title: 'Tests/Fields/Template',
  args: {
    templates: buildTemplates(templates as any),
    onChange: fn(),
  },
} as Meta<typeof TemplateField>;

export default meta;

export const TemplateCanBeSelected: StoryObj<typeof meta> = {
  args: {
    type: 'string',
    defaultType: 'string',
    defaultInternalType: 'string',
  },
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);

    await ShowsTemplatesListForString.play({ canvasElement, ...rest });

    await sleep(500);

    await waitFor(
      () =>
        expect(
          document.querySelector('.reqore-popover-content')
        ).toBeInTheDocument(),
      {
        timeout: 10000,
      }
    );

    await sleep(500);

    await waitFor(async () => await canvas.getAllByText('Context Data')[0], {
      timeout: 10000,
    });

    await fireEvent.click(canvas.getAllByText('Context Data')[0]);

    await sleep(500);

    await waitFor(async () => await canvas.getAllByText('Interface ID')[0], {
      timeout: 10000,
    });

    await fireEvent.click(canvas.getAllByText('Interface ID')[0]);

    await sleep(100);

    await expect(canvas.getByDisplayValue('$local:id')).toBeInTheDocument();
  },
};

export const ValueIsResetWhenChangingToCustom: StoryObj<typeof meta> = {
  render: (args) => {
    const [value, setValue] = useState(args.value);

    return (
      <TemplateField
        {...args}
        value={value}
        onChange={(name, value) => {
          args.onChange(name, value);
          setValue(value);
        }}
      />
    );
  },
  args: {
    type: 'number',
    value: '$config:something',
    name: 'Test Field',
  },
  play: async ({ canvasElement, ...rest }) => {
    await waitFor(
      async () => {
        await expect(
          document.querySelector('.template-selector')
        ).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    await fireEvent.click(document.querySelectorAll('.template-remove')[0]);
    await expect(rest.args.onChange).toHaveBeenLastCalledWith(
      'Test Field',
      undefined
    );
  },
};
