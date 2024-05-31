import { Meta, StoryObj } from '@storybook/react';
import { expect, fireEvent, fn, waitFor, within } from '@storybook/test';
import { useEffect, useState } from 'react';
import Options, {
  IOptionsSchema,
} from '../../../components/Field/systemOptions';

const meta = {
  component: Options,
  title: 'Fields/Options',
  args: {
    onChange: fn(),
  },
} as Meta<typeof Options>;

export default meta;

const getOptions = (allOptional: boolean = false): IOptionsSchema => ({
  basicOption: { type: 'string', preselected: !allOptional },
  optionWithDescription: {
    type: 'string',
    display_name: 'Option with description',
    desc: 'Option with markdown `description`\n\r ## Nice',
    preselected: !allOptional,
    supports_templates: true,
  },
  optionWithShortDescription: {
    type: 'list',
    display_name: 'Option with short description',
    short_desc: 'Option with short description',
    required: !allOptional,
    depends_on: ['basicOption', 'nonExistentOption'],
    supports_templates: true,
  },
  hiddenOption: {
    type: 'string',
    display_name: 'I am hidden',
    short_desc: 'I am hidden because I am not preselected or required',
  },
  optionWithValue: {
    type: 'string',
    display_name: 'Option with value',
    supports_templates: true,
  },
  optionWithInvalidValue: {
    type: 'string',
    display_name: 'Option with invalid value',
  },
  templateOption: {
    type: 'string',
    display_name: 'Template option',
    supports_templates: true,
  },
  optionWithMessages: {
    short_desc: 'Option with some messages',
    preselected: !allOptional,
    type: 'string',
    display_name: 'Option with messages',
    supports_templates: true,
    messages: [
      {
        title: 'Success',
        intent: 'success',
        content: 'A successful message with title',
      },
      {
        intent: 'danger',
        content: 'A dangerous message',
      },
    ],
  },
  disabledOption: {
    type: 'number',
    display_name: 'Disabled option',
    disabled: true,
    preselected: !allOptional,
  },
  optionWithAutoSelect: {
    type: 'string',
    display_name: 'Option with auto select',
    allowed_values: [
      { name: 'Allowed value 1', short_desc: 'Allowed value 1' },
    ],
    required: !allOptional,
    supports_templates: true,
  },
  optionWithBrokenAllowedValues: {
    type: 'string',
    supports_templates: true,
    display_name: 'Option with allowed values',
    allowed_values: [
      { name: 'Allowed value 1', short_desc: 'Allowed value 1' },
      { name: 'Allowed value 2', short_desc: 'Allowed value 2' },
    ],
    required: !allOptional,
  },
  selectedOption: {
    type: 'hash',
    supports_templates: true,
    display_name: 'Selected option',
  },
  optionWithDependents: {
    supports_templates: true,
    type: 'date',
    display_name: 'Option with dependents',
    short_desc: 'Option with dependents',
    has_dependents: true,
    required: !allOptional,
  },
  schemaOption: {
    supports_templates: true,
    type: 'hash',
    preselected: !allOptional,
    display_name: 'Schema Option',
    short_desc: 'Option with arg schema',
    arg_schema: {
      schemaOption1: {
        type: 'string',
        display_name: 'Schema option 1',
        short_desc: 'Schema option 1',
        required: true,
      },
      optionWithAutoSelect: {
        type: 'string',
        display_name: 'Option with auto select',
        allowed_values: [
          { name: 'Allowed value 1', short_desc: 'Allowed value 1' },
        ],
        required: true,
      },
    },
  },
  colorOption: {
    type: 'rgbcolor',
    required: true,
    value: {
      r: 255,
      g: 0,
      b: 0,
      a: 1,
    },
  },
});

export const Basic: StoryObj<typeof meta> = {
  render: ({ value, onChange, ...rest }) => {
    const [val, setValue] = useState(value);

    useEffect(() => {
      onChange?.('options', val);
    }, [val]);

    return <Options {...rest} value={val} onChange={(_n, v) => setValue(v)} />;
  },
  args: {
    minColumnWidth: '300px',
    options: getOptions(),
    value: {
      optionWithValue: { type: 'string', value: '123' },
      optionWithInvalidValue: { type: 'string', value: 123 },
      templateOption: { type: 'string', value: '$local:test' },
      selectedOption: { type: 'hash', value: undefined },
    },
  },
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);

    await waitFor(
      () =>
        expect(
          canvas.getAllByDisplayValue('$local:test')[0]
        ).toBeInTheDocument(),
      {
        timeout: 10000,
      }
    );
    await waitFor(
      () =>
        expect(
          document.querySelectorAll('.reqore-collection-item.system-option')
            .length
        ).toBe(14),
      {
        timeout: 10000,
      }
    );

    await expect(rest.args.onChange).toHaveBeenLastCalledWith(
      'options',
      expect.objectContaining({
        optionWithAutoSelect: {
          type: 'string',
          value: 'Allowed value 1',
        },
        optionWithValue: { type: 'string', value: '123' },
        optionWithInvalidValue: { type: 'string', value: 123 },
        templateOption: { type: 'string', value: '$local:test' },
        selectedOption: { type: 'hash', value: undefined },
      })
    );
  },
};

export const Optional: StoryObj<typeof meta> = {
  args: {
    minColumnWidth: '300px',
    options: getOptions(true),
  },
};

export const OptionalOpened: StoryObj<typeof meta> = {
  args: {
    minColumnWidth: '300px',
    options: getOptions(true),
  },
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);

    await waitFor(
      () =>
        expect(canvas.queryAllByText(/AddNewOption/)[0]).toBeInTheDocument(),
      {
        timeout: 10000,
      }
    );

    await fireEvent.click(canvas.queryAllByText(/AddNewOption/)[0]);
  },
};

export const OptionalWithValues: StoryObj<typeof meta> = {
  args: {
    minColumnWidth: '300px',
    options: getOptions(true),
    value: {
      optionWithValue: { type: 'string', value: '123' },
      optionWithInvalidValue: { type: 'string', value: 123 },
      templateOption: { type: 'string', value: '$local:test' },
      selectedOption: { type: 'hash', value: undefined },
    },
  },
};

export const NonExistentOptionsFiltered: StoryObj<typeof meta> = {
  args: {
    value: {
      option1: { type: 'string', value: 'option1' },
      option2: { type: 'string', value: 'option2' },
      option3: { type: 'string', value: 'option3' },
    },
    options: {
      option1: { type: 'string' },
      option2: { type: 'string' },
    },
  },
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);

    await waitFor(
      () =>
        expect(canvas.getAllByDisplayValue('option1')[0]).toBeInTheDocument(),
      {
        timeout: 10000,
      }
    );
    await fireEvent.change(
      document.querySelectorAll('.system-option .reqore-textarea')[0],
      {
        target: { value: 'option1a' },
      }
    );

    await expect(rest.args.onChange).toHaveBeenLastCalledWith(
      undefined,
      {
        option1: { type: 'string', value: 'option1a' },
        option2: { type: 'string', value: 'option2' },
        option3: { type: 'string', value: 'option3' },
      },
      {}
    );
  },
};

export const OptionsWithOnChangeTriggerEvents: StoryObj<typeof meta> = {
  args: {
    value: {
      optionWithRefetchAndReset: { type: 'string', value: 'option1' },
      option2: { type: 'string', value: 'option2' },
    },
    options: {
      optionWithRefetchAndReset: {
        type: 'string',
        on_change: ['refetch', 'reset'],
      },
      option2: { type: 'string' },
    },
  },
  play: async ({ canvasElement, ...rest }) => {
    const canvas = within(canvasElement);

    await waitFor(
      () =>
        expect(canvas.getAllByDisplayValue('option1')[0]).toBeInTheDocument(),
      {
        timeout: 10000,
      }
    );
    await fireEvent.change(
      document.querySelectorAll('.system-option .reqore-textarea')[1],
      {
        target: { value: 'option1a' },
      }
    );

    await expect(rest.args.onChange).toHaveBeenLastCalledWith(
      undefined,
      {
        optionWithRefetchAndReset: { type: 'string', value: 'option1a' },
        option2: { type: 'string', value: 'option2' },
      },
      {
        events: ['refetch', 'reset'],
      }
    );
  },
};

export const OptionWithExpression: StoryObj<typeof meta> = {
  args: {
    options: {
      optionWithExpression: {
        type: 'string',
        display_name: 'Expression option',
        short_desc: 'Option with expression support',
        supports_expressions: true,
        supports_templates: true,
        required: true,
        preselected: true,
      },
    },
    value: {
      optionWithExpression: {
        type: 'string',
        value: {
          exp: 'SUBSTR',
          args: [
            {
              type: 'string',
              value: {
                exp: 'SUBSTR',
                args: [
                  {
                    type: 'string',
                    value: '$local:name',
                  },
                  {
                    value: 1,
                    type: 'int',
                    is_expression: false,
                  },
                  {
                    value: 1,
                    type: 'int',
                    is_expression: false,
                  },
                ],
              },
              is_expression: true,
            },
            {
              value: 1,
              type: 'int',
              is_expression: false,
            },
            {
              value: 2,
              type: 'int',
              is_expression: false,
            },
          ],
        },
        is_expression: true,
      },
    },
  },
};
