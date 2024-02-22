import { expect } from '@storybook/jest';
import { StoryObj } from '@storybook/react';
import { fireEvent, waitFor, within } from '@storybook/testing-library';
import { useState } from 'react';
import {
  ExpressionBuilder,
  IExpression,
} from '../../components/ExpressionBuilder';
import {
  _testsOpenTemplates,
  _testsSelectItemFromCollection,
  sleep,
} from '../Tests/utils';
import { StoryMeta } from '../types';

const meta = {
  component: ExpressionBuilder,
  title: 'Components/Expression Builder',
  render: (args) => {
    const [exp, setExp] = useState<IExpression>(args.value);

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

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(
      () => expect(document.querySelectorAll('.expression')).toHaveLength(1),
      { timeout: 10000 }
    );
  },
};
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
  play: async ({ canvasElement }) => {
    await waitFor(
      () => expect(document.querySelectorAll('.expression')).toHaveLength(1),
      { timeout: 10000 }
    );
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
  play: async ({ canvasElement }) => {
    await waitFor(
      () => expect(document.querySelectorAll('.expression')).toHaveLength(6),
      { timeout: 10000 }
    );
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
  play: async ({ canvasElement }) => {
    await waitFor(
      () => expect(document.querySelectorAll('.expression')).toHaveLength(1),
      { timeout: 10000 }
    );
  },
};

export const WithSelectableType: Story = {
  args: {
    value: {
      exp: 'EQUALS-BOOL',
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
  play: async ({ canvasElement }) => {
    await waitFor(
      () => expect(document.querySelectorAll('.expression')).toHaveLength(1),
      { timeout: 10000 }
    );
  },
};

export const ArgsChangeWhenOperatorChanges: Story = {
  ...WithSimpleValue,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(
      () => expect(document.querySelectorAll('.expression')).toHaveLength(1),
      { timeout: 10000 }
    );

    await expect(
      document.querySelectorAll('.expression .reqore-textarea')
    ).toHaveLength(2);

    await _testsSelectItemFromCollection(canvas, 'is between', 'contains')();

    await expect(
      document.querySelectorAll('.expression .reqore-textarea')
    ).toHaveLength(3);
  },
};

export const NewGroupsCanBeCreated: Story = {
  ...WithSimpleValue,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(
      () => expect(document.querySelectorAll('.expression')).toHaveLength(1),
      { timeout: 10000 }
    );

    await fireEvent.click(document.querySelector('.expression-and'));

    await waitFor(
      () => expect(document.querySelectorAll('.expression')).toHaveLength(2),
      { timeout: 10000 }
    );

    await fireEvent.click(document.querySelector('.expression-or'));

    await waitFor(
      () => expect(document.querySelectorAll('.expression')).toHaveLength(3),
      { timeout: 10000 }
    );
  },
};

export const GroupsCanBeDeleted: Story = {
  ...WithComplexValue,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(
      () => expect(document.querySelectorAll('.expression')).toHaveLength(6),
      { timeout: 10000 }
    );

    await sleep(1000);

    await fireEvent.click(
      document.querySelectorAll('.expression-group-remove')[1]
    );

    await waitFor(
      () => expect(document.querySelectorAll('.expression')).toHaveLength(5),
      { timeout: 10000 }
    );
  },
};

export const ExpressionIsResetWhenValueIsRemoved: Story = {
  ...WithIntType,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(
      () => expect(document.querySelectorAll('.expression')).toHaveLength(1),
      { timeout: 10000 }
    );

    await fireEvent.click(
      document.querySelectorAll('.expression .template-remove')[0]
    );

    await expect(
      document.querySelector('.expression-operator-selector')
    ).not.toBeInTheDocument();
  },
};

export const NewExpression: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(
      () => expect(document.querySelectorAll('.expression')).toHaveLength(1),
      { timeout: 10000 }
    );

    await _testsOpenTemplates();

    await sleep(300);

    await fireEvent.click(canvas.getAllByText(/Context Data/)[0]);

    await sleep(300);

    await fireEvent.click(canvas.getAllByText(/Interface Name/)[0]);

    await sleep(300);

    await _testsSelectItemFromCollection(canvas, 'ends with')();

    await sleep(300);

    await fireEvent.change(
      document.querySelectorAll('.expression .reqore-textarea')[1],
      {
        target: { value: 'test' },
      }
    );

    await fireEvent.click(
      document.querySelector('.expression .reqore-checkbox')
    );
  },
};
