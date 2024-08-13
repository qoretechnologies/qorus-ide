import { StoryObj } from '@storybook/react';
import jsyaml from 'js-yaml';
import { useState } from 'react';
import Auto from '../../components/Field/auto';
import { buildTemplates } from '../../helpers/functions';
import { InterfacesProvider } from '../../providers/Interfaces';
import templates from '../Data/templates.json';
import { StoryMeta } from '../types';

const meta = {
  component: Auto,
  title: 'Fields/List',
  args: {
    defaultType: 'list',
    templates: buildTemplates(templates as any),
  },
} as StoryMeta<typeof Auto>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ListWithAllowedValues: Story = {
  args: {
    defaultType: 'list',
    allowed_values: [
      {
        name: 'test',
        value: 'test',
        short_desc: 'This is a test',
      },
      {
        name: 'test 2',
        value: 'test 2',
        intent: 'info',
      },
    ],
  },
};

export const ListWithElementType: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value);

    return (
      <InterfacesProvider>
        <Auto
          {...args}
          value={value}
          onChange={(name, value) => {
            console.log(name, value);
            setValue(value);
          }}
        />
      </InterfacesProvider>
    );
  },
  args: {
    defaultType: 'list',
    element_type: 'int',
  },
};

export const ListWithElementTypeAndArgSchema: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value);

    console.log({ templates: args.templates });

    return (
      <InterfacesProvider>
        <Auto
          {...args}
          value={value}
          onChange={(name, value) => {
            console.log(name, value);
            setValue(value);
          }}
        />
      </InterfacesProvider>
    );
  },
  args: {
    defaultType: 'list',
    element_type: 'hash',
    value: jsyaml.dump([
      {
        option1: undefined,
        option2: 500,
      },
      {
        option1: 'this is a second test',
        option3: [
          {
            deepOption: 'Deep option 1',
          },
        ],
      },
    ]),
    arg_schema: {
      option1: {
        type: 'richtext',
        display_name: 'Schema option 1',
        short_desc: 'Schema option 1',
        supports_templates: true,
        required: true,
      },
      option2: {
        type: 'int',
        display_name: 'Schema option 2',
        allowed_values: [
          { name: 500, short_desc: 'Allowed value 1' },
          { name: 700, short_desc: 'Allowed value 2' },
        ],
        required: true,
      },
      option3: {
        type: 'list',
        element_type: 'hash',
        display_name: 'Option 3',
        arg_schema: {
          deepOption: {
            type: 'richtext',
            supports_templates: true,
            supports_references: true,
            supports_styling: true,
            display_name: 'Deep option',
            short_desc: 'Deep option',
            required: true,
          },
        },
      },
      option4: {
        type: 'string',
        display_name: 'Schema option 4',
        short_desc: 'Schema option 4',
        supports_templates: true,
        required: true,
      },
    },
  },
};
