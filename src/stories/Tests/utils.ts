import {
  expect,
  fireEvent,
  screen,
  userEvent,
  waitFor,
  within,
} from '@storybook/test';

const stateCategory = {
  mapper: 'Interfaces',
  pipeline: 'Interfaces',
  connector: 'Interfaces',
  fsm: 'Logic',
  while: 'Logic',
  for: 'Logic',
  if: 'Logic',
  foreach: 'Logic',
  transaction: 'Logic',
  apicall: 'API',
  'send-message': 'API',
  'search-single': 'Data',
  search: 'Data',
  create: 'Data',
  update: 'Data',
  delete: 'Data',
  trigger: 'Action Triggers',
  schedule: 'Action Triggers',
  appaction: 'appaction',
};

const stateLabel = {
  mapper: 'Mapper',
  pipeline: 'Pipeline',
  connector: 'Class Connector',
  fsm: 'Flow',
  while: 'While',
  for: 'For',
  if: 'If',
  foreach: 'Foreach',
  transaction: 'Transaction',
  apicall: 'Call API',
  'send-message': 'Send Message',
  'search-single': 'Single Search',
  search: 'Search',
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
  trigger: 'On-Demand',
  schedule: 'Schedule',
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export function _testsSubmitFSMState(buttonId?: string) {
  return async () => {
    await sleep(850);
  };
}

export async function _testsQodexCanBePublished() {
  await waitFor(
    () => expect(screen.getAllByText('Publish')[0]).toBeInTheDocument(),
    {
      timeout: 10000,
    }
  );
}

export async function _testsCloseStateDetail() {
  await fireEvent.click(
    document.querySelector('.fsm-state-detail .reqore-button')
  );
}

export async function _testsOpenAppCatalogue(
  wrapperId?: string,
  x: number = 100,
  y: number = 100
) {
  const fullWrapperId = `${wrapperId ? `${wrapperId}-` : ''}fsm-diagram`;

  await waitFor(
    () => expect(document.getElementById(fullWrapperId)).toBeInTheDocument(),
    {
      timeout: 10000,
    }
  );

  const wrapper = document
    .getElementById(fullWrapperId)
    .querySelector('.element-pan');

  await fireEvent.dblClick(wrapper, {
    clientX: wrapper.getBoundingClientRect().left + x,
    clientY: wrapper.getBoundingClientRect().top + y,
  });

  await waitFor(
    () =>
      expect(document.querySelector('.fsm-app-selector')).toBeInTheDocument(),
    {
      timeout: 10000,
    }
  );
}

export async function _testsCloseAppCatalogue() {
  await fireEvent.click(
    document.querySelector('.fsm-app-selector .reqore-drawer-close-button')
  );
}

export async function _testsManageVariableFromCatalogue(variableName: string) {
  await userEvent.click(
    screen
      .getByText(variableName)
      .closest('.reqore-panel-title')
      .querySelector('.manage-variable')
  );
}

export async function _testsSelectAppOrAction(canvas, appOrAction: string) {
  await waitFor(
    () => canvas.getByText(appOrAction, { selector: '.fsm-app-selector h4' }),
    {
      timeout: 10000,
    }
  );
  await fireEvent.click(
    canvas.getByText(appOrAction, { selector: '.fsm-app-selector h4' })
  );
}

export async function _testsOpenAppCatalogueFromState(
  stateId?: number | string,
  branch?: 'true' | 'false'
) {
  const className = `.add-new-state-after${branch ? `-${branch}` : ''}`;

  if (!stateId) {
    await fireEvent.click(document.querySelector(className));
    return;
  }

  await fireEvent.click(
    document.querySelector(`#state-${stateId} ${className}`)
  );
}

export async function _testsSelectFromAppCatalogue(
  canvas,
  stateType?: keyof typeof stateCategory,
  app?: string,
  action?: string
) {
  await waitFor(
    () =>
      expect(document.querySelector('.fsm-app-selector')).toBeInTheDocument(),
    {
      timeout: 10000,
    }
  );

  if (app) {
    if (action) {
      await _testsSelectAppOrAction(canvas, app);
      await _testsSelectAppOrAction(canvas, action);
    } else {
      await _testsSelectAppOrAction(canvas, app);
    }

    return;
  }

  const category = stateCategory[stateType];
  const label = stateLabel[stateType];

  await _testsSelectAppOrAction(canvas, category);
  await _testsSelectAppOrAction(canvas, label);
}

export async function _testsAddNewState(
  stateType: keyof typeof stateCategory,
  canvas,
  wrapperId?: string,
  x?: number,
  y?: number,
  stateId?: number | string,
  branch?: 'true' | 'false'
) {
  if (stateId || stateId === 0) {
    await _testsOpenAppCatalogueFromState(stateId, branch);
  } else {
    await _testsOpenAppCatalogue(wrapperId, x, y);
  }

  await _testsSelectFromAppCatalogue(canvas, stateType);
}

export async function _testsAddNewVariableState(
  variableName: string,
  canvas,
  wrapperId?: string
) {
  await _testsOpenAppCatalogue(wrapperId);
  await _testsSelectAppOrAction(canvas, 'Variables');
  await _testsSelectAppOrAction(canvas, variableName);
}

export function _testsSelectItemFromDropdown(
  canvas: any = screen,
  itemLabel: string | number,
  dropdownLabel: string = 'PleaseSelect',
  className?: string
) {
  return async () => {
    if (className) {
      await waitFor(
        () =>
          expect(document.querySelectorAll(className)[0]).toBeInTheDocument(),
        {
          timeout: 10000,
        }
      );
      await fireEvent.click(document.querySelectorAll(className)[0]);
    } else {
      await waitFor(async () => await canvas.queryAllByText(dropdownLabel)[0], {
        timeout: 10000,
      });
      // HOW TO GET RID OF THIS SLEEP?????????????
      await sleep(100);

      await fireEvent.click(canvas.queryAllByText(dropdownLabel)[0]);

      await sleep(300);
    }

    await waitFor(
      () =>
        expect(document.querySelector('.q-select-input')).toBeInTheDocument(),
      {
        timeout: 10000,
      }
    );

    const parent = within(
      document.querySelector('.reqore-popover-content .reqore-menu')
    );

    await waitFor(async () => await parent.getAllByText(itemLabel)[0], {
      timeout: 10000,
    });

    await fireEvent.click(parent.queryAllByText(itemLabel)[0]);
  };
}

export function _testsSelectItemFromCollection(
  canvas,
  itemLabel: string,
  collectionLabel: string = 'PleaseSelect'
) {
  return async () => {
    await waitFor(async () => await canvas.getAllByText(collectionLabel)[0], {
      timeout: 10000,
    });

    await sleep(500);

    await fireEvent.click(canvas.getAllByText(collectionLabel)[0]);

    await waitFor(
      () =>
        expect(document.querySelector('.q-select-dialog')).toBeInTheDocument(),
      {
        timeout: 10000,
      }
    );
    await waitFor(async () => await canvas.getByText(itemLabel), {
      timeout: 10000,
    });

    await fireEvent.click(canvas.getByText(itemLabel));
  };
}

export async function _testsCreateSelectionBox(
  x: number,
  y: number,
  width: number,
  height: number,
  confirm?: boolean
) {
  await fireEvent.mouseOver(document.querySelector('#fsm-diagram'));

  await fireEvent.keyDown(document, {
    key: 'Meta',
    shiftKey: true,
  });

  await sleep(200);

  await fireEvent.mouseDown(document.querySelector('#fsm-diagram'), {
    clientX: x,
    clientY: y,
    shiftKey: true,
  });

  await sleep(200);

  await fireEvent.mouseMove(document.querySelector('#fsm-diagram'), {
    clientX: x + width,
    clientY: y + height,
    shiftKey: true,
  });

  await sleep(1000);

  if (confirm) {
    await fireEvent.mouseUp(document.querySelector('#fsm-diagram'), {
      clientX: x + width,
      clientY: y + height,
      shiftKey: true,
    });
  }
}

export async function _testsMoveState(
  id: string | number,
  times: number,
  x: number = 0,
  y: number = 0,
  coeficient = 1
) {
  await fireEvent.mouseDown(document.querySelector(`#state-${id}`));

  await sleep(100);

  const { left, top } = document
    .querySelector(`#state-${id}`)
    .getBoundingClientRect();

  await fireEvent.mouseMove(document.querySelector(`#state-${id}`), {
    clientX: left,
    clientY: top,
  });

  for await (const _ of Array(Math.round(times)).keys()) {
    const { left, top } = document
      .querySelector(`#state-${id}`)
      .getBoundingClientRect();

    if (left > window.innerWidth - 100 || top > window.innerHeight - 100) {
      break;
    }

    await sleep(16.67);

    await fireEvent.mouseMove(document.querySelector(`#state-${id}`), {
      clientX: left + x * coeficient,
      clientY: top + y * coeficient,
    });
  }

  await sleep(100);

  const dim = document.querySelector(`#state-${id}`).getBoundingClientRect();

  await fireEvent.mouseUp(document.querySelector(`#state-${id}`), {
    clientX: dim.left,
    clientY: dim.top,
  });
}

export async function _testsConfirmDialog() {
  await waitFor(async () => screen.getAllByText('Confirm')[0], {
    timeout: 5000,
  });
  await fireEvent.click(screen.getAllByText('Confirm')[0]);
  await sleep(200);
}

export async function _testsCloneState(name: string) {
  await _testsClickState(name);
  await waitFor(
    () => expect(document.querySelector('.state-clone-button')).toBeEnabled(),
    {
      timeout: 5000,
    }
  );
  await fireEvent.click(document.querySelector('.state-clone-button'));
  await sleep(200);
}

export async function _testsDeleteState(name: string) {
  await _testsClickState(name);
  await waitFor(
    () =>
      expect(
        document.querySelector('.state-delete-button')
      ).toBeInTheDocument(),
    {
      timeout: 5000,
    }
  );
  await fireEvent.click(document.querySelector('.state-delete-button'));
  await sleep(200);
  await _testsConfirmDialog();
}

export async function _testsDeleteMultipleStates() {
  await waitFor(
    () =>
      expect(
        document.querySelector('#delete-multiple-states')
      ).toBeInTheDocument(),
    {
      timeout: 5000,
    }
  );
  await fireEvent.click(document.querySelector('#delete-multiple-states'));
  await sleep(200);
  await _testsConfirmDialog();
}

export async function _testsSelectState(name: string) {
  await _testsClickState(name, { shiftKey: true });
}

export async function _testsSelectStateByLabel(canvas, label) {
  await _testsClickState(label, { shiftKey: true });
}

export async function _testsDoubleClickState(name, options = {}) {
  await _testsClickState(name, options);
  await _testsClickState(name, options);
}

export async function _testsClickState(
  name: string,
  options = {},
  nth: number = 0
) {
  await fireEvent.mouseOver(
    screen
      .getAllByText(name, { selector: `.fsm-state h4` })
      [nth].closest('.fsm-state'),
    options
  );
  await sleep(100);
  await fireEvent.mouseDown(
    screen
      .getAllByText(name, { selector: `.fsm-state h4` })
      [nth].closest('.fsm-state'),
    {
      ...options,
      timeStamp: 0,
    }
  );
  await fireEvent.mouseUp(
    screen
      .getAllByText(name, { selector: `.fsm-state h4` })
      [nth].closest('.fsm-state'),
    {
      ...options,
      timeStamp: 100,
    }
  );
}

export function _testsGetStateByLabel(label: string, nth: number = 0) {
  return screen
    .getAllByText(label, { selector: `.fsm-state h4` })
    [nth].closest('.fsm-state');
}

export async function _testsClickStateByLabel(canvas, label, options = {}) {
  await fireEvent.mouseOver(canvas.getAllByText(label)[0], options);
  await sleep(100);
  await fireEvent.mouseDown(canvas.getAllByText(label)[0], {
    ...options,
    timeStamp: 0,
  });
  await fireEvent.mouseUp(canvas.getAllByText(label)[0], {
    ...options,
    timeStamp: 100,
  });
}

export async function _testsOpenTemplates() {
  await waitFor(
    async () => {
      await expect(
        document.querySelector('.template-selector')
      ).toBeInTheDocument();
    },
    { timeout: 10000 }
  );

  await sleep(500);

  await _testsClickButton({ selector: '.template-selector', wait: 5000 });

  await waitFor(
    () =>
      expect(
        document.querySelector('.reqore-popover-content')
      ).toBeInTheDocument(),
    { timeout: 10000 }
  );
}

export async function _testsWaitForText(text: string, selector?: string) {
  await waitFor(
    () =>
      expect(screen.queryAllByText(text, { selector })[0]).toBeInTheDocument(),
    {
      timeout: 10000,
    }
  );
}

export async function _testsCreatorViewCode() {
  const canvas = screen;
  await waitFor(
    () => expect(canvas.queryAllByText('Edit code')[0]).toBeInTheDocument(),
    { timeout: 5000 }
  );
  await fireEvent.click(canvas.queryAllByText('Edit code')[0]);
  await waitFor(
    () => expect(canvas.queryAllByText('Code Editor')[0]).toBeInTheDocument(),
    { timeout: 5000 }
  );
}

export async function _testsCreatorDraftSaveCheck() {
  await _testsWaitForText('field-label-display_name');

  await fireEvent.change(
    document.querySelector('.creator-field .reqore-input'),
    { target: { value: 'Test' } }
  );

  await _testsWaitForText('DraftSaved just now');
}

export async function _testsExpectFieldsCountToMatch(
  count: number,
  wait?: boolean,
  type?: string
) {
  const selector = type ? `.${type}-creator .creator-field` : '.creator-field';

  if (wait) {
    await waitFor(
      () => expect(document.querySelectorAll(selector)).toHaveLength(count),
      {
        timeout: 5000,
      }
    );
  } else {
    await expect(document.querySelectorAll(selector)).toHaveLength(count);
  }
}

export async function _testsClickButton({
  label,
  selector,
  nth = 0,
  wait = 7000,
  parent = '.reqore-button',
}: {
  label?: string;
  selector?: string;
  nth?: number;
  wait?: number;
  parent?: string;
}) {
  if (!label) {
    await waitFor(
      () =>
        expect(document.querySelectorAll(selector)[nth]).toBeInTheDocument(),
      { timeout: wait }
    );
    await fireEvent.click(document.querySelectorAll(selector)[nth]);
  } else {
    await waitFor(
      () =>
        expect(
          screen.queryAllByText(label, { selector })[nth]
        ).toBeInTheDocument(),
      { timeout: wait }
    );
    await waitFor(
      () =>
        expect(
          screen.queryAllByText(label, { selector })[nth].closest(parent)
        ).toBeEnabled(),
      { timeout: wait }
    );
    await fireEvent.click(screen.queryAllByText(label, { selector })[nth]);
  }
}
