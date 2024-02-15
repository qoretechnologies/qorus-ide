import { StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  ExpressionBuilder,
  IExpression,
} from '../../components/ExpressionBuilder';
import { StoryMeta } from '../types';

const meta = {
  component: ExpressionBuilder,
  title: 'Components/Expression Builder',
  render: (args) => {
    const [exp, setExp] = useState<IExpression>(args.value);

    console.log(exp);

    return (
      <ExpressionBuilder
        {...args}
        localTemplates={{
          label: 'Testing',
          items: [
            {
              label: 'Testing bool',
              badge: 'Test',
              items: [
                {
                  label: 'Testing bool',
                  badge: 'bool',
                  value: '$local:some-bool',
                },
              ],
            },
          ],
        }}
        value={exp}
        onChange={(value) => {
          setExp(value);
        }}
      />
    );
  },
} as StoryMeta<typeof ExpressionBuilder>;

export default meta;
export type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithSimpleValue: Story = {
  args: {
    value: {
      exp: 'CONTAINS',
      args: [
        {
          type: 'string',
          value: '$local:input',
        },
        {
          type: 'string',
          value: 'es',
        },
      ],
    },
  },
};

export const WithComplexValue: Story = {
  args: {
    value: {
      exp: 'AND',
      args: [
        {
          exp: 'OR',
          args: [
            {
              exp: 'CONTAINS',
              args: [
                {
                  type: 'string',
                  value: '$local:input',
                },
                {
                  type: 'string',
                  value: 'es',
                },
              ],
            },
            {
              exp: 'AND',
              args: [
                {
                  exp: 'STARTS-WITH',
                  args: [
                    {
                      type: 'string',
                      value: 'test',
                    },
                    {
                      type: 'string',
                      value: 't',
                    },
                  ],
                },
                {
                  exp: 'STARTS-WITH',
                  args: [
                    {
                      type: 'string',
                      value: 'test',
                    },
                    {
                      type: 'string',
                      value: 't',
                    },
                  ],
                },
              ],
            },
            {
              exp: 'GREATER-THAN-OR-EQUALS',
              args: [
                {
                  type: 'int',
                  value: '23',
                },
                {
                  type: 'string',
                  value: '$local:id',
                },
              ],
            },
          ],
        },
        {
          exp: 'ENDS-WITH',
          args: [
            {
              type: 'string',
              value: '$local:str',
            },
            {
              type: 'string',
              value: '$local:p',
            },
          ],
        },
        {
          exp: 'LESS-THAN',
          args: [
            {
              type: 'int',
              value: '$local:input',
              is_context: true,
            },
            {
              type: 'string',
              value: '$local:p',
            },
          ],
        },
      ],
    },
  },
};

export const WithIntType: Story = {
  args: {
    type: 'int',
    value: {
      exp: 'GREATER-THAN-OR-EQUALS',
      args: [
        {
          type: 'int',
          value: '$local:input',
        },
        {
          type: 'int',
          value: 20,
        },
      ],
    },
  },
};

export const WithSelectableType: Story = {
  args: {
    value: {
      exp: 'EQUALS',
      args: [
        {
          type: 'bool',
          value: '$local:test-bool',
        },
        {
          type: 'bool',
          value: true,
        },
      ],
    },
  },
};
