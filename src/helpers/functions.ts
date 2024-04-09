import { IReqoreDropdownProps } from '@qoretechnologies/reqore/dist/components/Dropdown';
import { IReqoreDropdownItem } from '@qoretechnologies/reqore/dist/components/Dropdown/list';
import { IReqoreFormTemplates } from '@qoretechnologies/reqore/dist/components/Textarea';
import { IReqoreNotificationData } from '@qoretechnologies/reqore/dist/containers/ReqoreProvider';
import { cloneDeep } from 'lodash';
import forEach from 'lodash/forEach';
import isArray from 'lodash/isArray';
import isBoolean from 'lodash/isBoolean';
import isFunction from 'lodash/isFunction';
import isNull from 'lodash/isNull';
import isNumber from 'lodash/isNumber';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import isUndefined from 'lodash/isUndefined';
import map from 'lodash/map';
import maxBy from 'lodash/maxBy';
import omit from 'lodash/omit';
import set from 'lodash/set';
import size from 'lodash/size';
import shortid from 'shortid';
import { apiHost, apiToken } from '../common/vscode';
import { TExpressionSchemaArg } from '../components/ExpressionBuilder';
import { IProviderType } from '../components/Field/connectors';
import { IOptions, IQorusType } from '../components/Field/systemOptions';
import { interfaceKindTransform } from '../constants/interfaces';
import { Messages } from '../constants/messages';
import {
  IFSMState,
  IFSMStates,
  IFSMTransition,
  TFSMClassConnectorAction,
  TVariableActionValue,
} from '../containers/InterfaceCreator/fsm';
import { TQodexTemplates } from '../containers/InterfaceCreator/fsm/AppActionOptions';
import { TAction } from '../containers/InterfaceCreator/fsm/stateDialog';
import { IQorusInterface } from '../containers/InterfacesView';
import {
  addMessageListener,
  postMessage,
} from '../hocomponents/withMessageHandler';
import { IQorusTypeObject } from '../hooks/useQorusTypes';
import { isStateValid } from './fsm';
const md5 = require('md5');

const functionOrStringExp: Function = (
  item: Function | string,
  ...itemArguments
) => (typeof item === 'function' ? item(...itemArguments) : item);

const getType = (item: any): string => {
  if (isBoolean(item)) {
    return 'boolean';
  }

  if (isString(item)) {
    return 'string';
  }

  if (isNumber(item)) {
    return 'number';
  }

  if (isArray(item)) {
    return 'array';
  }

  if (isFunction(item)) {
    return 'function';
  }

  if (isObject(item)) {
    return 'object';
  }

  if (isNull(item) || isUndefined(item)) {
    return 'null';
  }

  return 'null';
};

export const splitByteSize = (value: string): [number, string] => {
  const bytes: string[] = (value || '').match(/\d+/g);
  const size: string[] = (value || '').match(/[a-zA-Z]+/g);

  return [Number(bytes?.[0]), size?.[0]];
};

export const insertAtIndex = (array: any[] = [], index = 0, value) => {
  return [...array.slice(0, index), value, ...array.slice(index)];
};

export const getMaxExecutionOrderFromStates = (states: IFSMStates): number => {
  if (!states || size(states) === 0) {
    return 0;
  }

  const { execution_order }: IFSMState =
    maxBy(
      map(states, (state: IFSMState) => state),
      'execution_order'
    ) || {};

  return execution_order || 0;
};

export const isStateIsolated = (
  stateKey: string,
  states: IFSMStates,
  checkedStates: string[] = []
): boolean => {
  if (states[stateKey].is_event_trigger) {
    return false;
  }

  let isIsolated = true;

  forEach(states, (stateData, keyId) => {
    if (
      stateData.transitions?.find(
        (transition: IFSMTransition) =>
          transition.state === stateKey && !transition.fake
      )
    ) {
      isIsolated = false;
    }
  });

  return isIsolated;
};

export interface ITypeComparatorData {
  interfaceName?:
    | string
    | IProviderType
    | TVariableActionValue
    | TFSMClassConnectorAction;
  connectorName?: string;
  interfaceKind?: 'if' | 'block' | 'processor' | TAction | 'transaction';
  typeData?: any;
}

export const getProviderFromInterfaceObject = (
  data,
  type: 'input' | 'output',
  connectorName?: string
) => {
  switch (data.type) {
    case 'mapper': {
      return data?.mapper_options?.[`mapper-${type}`];
    }
    case 'class': {
      if (connectorName) {
        return data?.['class-connectors']?.find(
          (connector) => connector.name === connectorName
        )?.[`${type}-provider`];
      }

      return data?.processor?.[`processor-${type}-type`];
    }
    case 'pipeline': {
      return data?.[`${type}-provider`];
    }
  }
};

export const getStateProvider = async (
  data: ITypeComparatorData,
  providerType: 'input' | 'output'
) => {
  if (!data) {
    return Promise.resolve(null);
  }

  if (data.interfaceKind === 'appaction') {
    return Promise.resolve(null);
  }

  if (data.interfaceKind === 'transaction') {
    return null;
  }

  if (
    data.interfaceKind === 'apicall' ||
    data.interfaceKind === 'send-message' ||
    data.interfaceKind === 'search-single' ||
    data.interfaceKind === 'search' ||
    data.interfaceKind === 'update' ||
    data.interfaceKind === 'create' ||
    data.interfaceKind === 'delete'
  ) {
    return Promise.resolve({
      ...(data?.interfaceName as IProviderType),
      typeAction: data.interfaceKind,
    });
  }

  if ('typeData' in data && !data.typeData) {
    return Promise.resolve(null);
  }

  if (data.typeData) {
    return Promise.resolve(data.typeData);
  }

  const interfaceKind =
    data.interfaceKind === 'connector' || data.interfaceKind === 'processor'
      ? 'class'
      : data.interfaceKind;
  const interfaceData = await callBackendBasic(
    Messages.GET_INTERFACE_DATA,
    'return-interface-data-complete',
    {
      name: data.interfaceName,
      iface_kind: interfaceKind,
    }
  );

  if (!interfaceData.ok) {
    return null;
  }

  return getProviderFromInterfaceObject(
    interfaceData.data[interfaceKind],
    providerType,
    data.connectorName
  );
};

export const areTypesCompatible = async (
  outputTypeData?: ITypeComparatorData,
  inputTypeData?: ITypeComparatorData
): Promise<boolean> => {
  if (!outputTypeData || !inputTypeData) {
    return Promise.resolve(true);
  }

  let output = cloneDeep(await getStateProvider(outputTypeData, 'output'));
  let input = cloneDeep(await getStateProvider(inputTypeData, 'input'));

  if (!input || !output) {
    return Promise.resolve(true);
  }

  output.options = await formatAndFixOptionsToKeyValuePairs(output.options);
  input.options = await formatAndFixOptionsToKeyValuePairs(input.options);

  const comparison = await fetchData(
    '/dataprovider/compareTypes?context=ui',
    'PUT',
    {
      base_type: input,
      type: output,
    }
  );

  if (!comparison.ok) {
    return true;
  }

  return comparison.data;
};

export const formatAndFixOptionsToKeyValuePairs = async (
  options?: IOptions
): Promise<IOptions> => {
  const newOptions = cloneDeep(options || {});

  for await (const optionName of Object.keys(newOptions || {})) {
    let newValue = newOptions[optionName].value;

    if (newOptions[optionName].type === 'file-as-string') {
      // We need to fetch the file contents from the server
      // Load the contents into the schema string
      const { fileData } = await callBackendBasic(
        Messages.GET_FILE_CONTENT,
        undefined,
        {
          file: newOptions[optionName].value,
        }
      );

      newValue = fileData;
    }

    newOptions[optionName] = newValue;
  }

  return newOptions;
};

export const areConnectorsCompatible = async (
  type: 'input' | 'output',
  value: string,
  data: any,
  isMapper?: boolean
) => {
  // First check if this input is compatible with previous output
  const currentInputOutput: ITypeComparatorData = isMapper
    ? {
        interfaceKind: 'mapper',
        interfaceName: value,
      }
    : {
        interfaceKind: 'connector',
        interfaceName: data.class,
        connectorName: value,
      };

  let item;
  let mapper;

  if (isMapper) {
    item = type === 'input' ? data.previousItemData : data.nextItemData;
    mapper = null;
  } else {
    item = type === 'input' ? data.previousItemData : data.nextItemData;
    mapper = type === 'input' ? data.mapper : data.nextItemData?.mapper;
  }

  let isCompatibleWithItem;

  if (item) {
    const comparator: ITypeComparatorData = mapper
      ? {
          interfaceKind: 'mapper',
          interfaceName: mapper,
        }
      : {
          interfaceKind: 'connector',
          interfaceName: item.class,
          connectorName: item.connector,
        };

    isCompatibleWithItem = await areTypesCompatible(
      type === 'input' ? comparator : currentInputOutput,
      type === 'input' ? currentInputOutput : comparator
    );
  } else {
    isCompatibleWithItem = true;
    Promise.resolve();
  }

  return isCompatibleWithItem ? true : false;
};

export const isFSMStateValid = (state: IFSMState) => {
  if (state.type === 'state') {
    return !!(state.action?.type && state.action?.value);
  }

  return true;
};

export const callBackendBasic: (
  getMessage: string,
  returnMessage?: string,
  data?: any,
  toastMessage?: string,
  addNotificationCall?: any,
  useWebSocket?: boolean
) => Promise<any> = async (
  getMessage,
  returnMessage,
  data,
  toastMessage,
  addNotificationCall,
  useWebSocket
) => {
  // Create the unique ID for this request
  const uniqueId: string = shortid.generate();
  // Create new toast
  if (toastMessage) {
    addNotificationCall?.({
      content: toastMessage || 'Request in progress',
      intent: 'warning',
      duration: 30000,
      id: uniqueId,
    } as IReqoreNotificationData);
  }

  return new Promise((resolve, reject) => {
    // Create a timeout that will reject the request
    // after 2 minutes
    let timeout: NodeJS.Timer | null = setTimeout(() => {
      resolve({
        ok: false,
        message: 'Request timed out',
      });
    }, 300000);
    // Watch for the request to complete
    // if the ID matches then resolve
    const listener = addMessageListener(
      returnMessage || `${getMessage}-complete`,
      (data) => {
        if (data.request_id === uniqueId) {
          if (toastMessage) {
            addNotificationCall?.({
              content: data.message || `Request ${getMessage} failed!`,
              intent: data.ok ? 'success' : 'danger',
              duration: 3000,
              id: uniqueId,
            });
          }

          clearTimeout(timeout);
          timeout = null;
          listener();
          resolve(data);
        }
      },
      useWebSocket
    );

    // Fetch the data
    postMessage(
      getMessage,
      {
        request_id: uniqueId,
        ...data,
      },
      useWebSocket
    );
  });
};

export const getPipelineClosestParentOutputData = (
  item: any,
  pipelineInputProvider?: any
): ITypeComparatorData => {
  if (!item || item.type === 'start') {
    return {
      typeData: pipelineInputProvider,
    };
  }

  if (item.type === 'queue') {
    return getPipelineClosestParentOutputData(
      item.parent,
      pipelineInputProvider
    );
  }

  return {
    interfaceName: item.name,
    interfaceKind: item.type,
  };
};

const flattenPipeline = (data, parent?: any) => {
  return data.reduce((newData, element) => {
    const newElement = { ...element };

    if (parent) {
      newElement.parent = parent;
    }

    if (size(newElement.children) === 0) {
      return [...newData, newElement];
    }

    return [
      ...newData,
      newElement,
      ...flattenPipeline(newElement.children, newElement),
    ];
  }, []);
};

export const checkPipelineCompatibility = async (elements, inputProvider) => {
  const flattened = flattenPipeline(elements);
  const newElements = [...elements];

  for await (const element of flattened) {
    // If the element is a queue or a start element (a circle with no value / data) it's automatically compatible
    if (element.type === 'queue' || element.type === 'start') {
      Promise.resolve();
    } else {
      const isCompatibleWithParent = await areTypesCompatible(
        getPipelineClosestParentOutputData(element.parent, inputProvider),
        {
          interfaceKind: element.type,
          interfaceName: element.name,
        }
      );

      if (!isCompatibleWithParent) {
        set(newElements, element.path, {
          ...omit(element, ['parent']),
          isCompatible: false,
        });
      } else {
        set(newElements, element.path, {
          ...omit(element, ['parent', 'isCompatible']),
        });
      }
    }
  }

  return newElements;
};

const fetchCache: {
  [key: string]: {
    actualCall: Promise<any>;
    data: any;
  };
} = {};

const doFetchData = async (
  url: string,
  method = 'GET',
  body?: { [key: string]: any }
) => {
  return fetch(`${apiHost}api/latest/${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify(body),
  }).catch((error) => {
    return new Response(JSON.stringify({}), {
      status: 500,
      statusText: `Request failed ${error.message}`,
    });
  });
};

export const fetchData: (
  url: string,
  method?: string,
  body?: { [key: string]: any },
  forceCache?: boolean
) => Promise<any> = async (url, method = 'GET', body, forceCache = true) => {
  const cache = method === 'DELETE' || method === 'POST' ? false : forceCache;
  const cacheKey = `${url}:${method}:${JSON.stringify(body || {})}`;

  if (fetchCache[cacheKey]?.data) {
    return {
      action: 'fetch-data-complete',
      data: fetchCache[cacheKey].data,
      ok: true,
    };
  }

  if (!fetchCache[cacheKey]?.actualCall || !cache) {
    const fetchCall = doFetchData(url, method, body);

    if (cache) {
      fetchCache[cacheKey] = { actualCall: null, data: null };
      fetchCache[cacheKey].actualCall = fetchCall;
    }

    const requestData = await fetchCall;

    if (requestData.status === 401) {
      window.location.href = '/?next=' + window.location.pathname;
    }

    if (!requestData.ok) {
      delete fetchCache[cacheKey];

      return {
        action: 'fetch-data-complete',
        data: null,
        ok: false,
        code: requestData.status,
        error: requestData.statusText,
      };
    }

    const json = await requestData.json();

    if (cache) {
      fetchCache[cacheKey].data = json;
    }

    return {
      action: 'fetch-data-complete',
      data: json,
      ok: requestData.ok,
      error: !requestData.ok ? json : undefined,
    };
  } else {
    // We need to wait for the call to finish and the data to be available
    while (!fetchCache[cacheKey]?.data) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return {
      action: 'fetch-data-complete',
      data: fetchCache[cacheKey].data,
      ok: true,
    };
  }
};

export { functionOrStringExp, getType };

export const deleteDraft = async (
  type: string,
  id?: string,
  notify: boolean = false,
  addNotification?: any
) => {
  await callBackendBasic(
    Messages.DELETE_DRAFT,
    undefined,
    {
      id,
      type: interfaceKindTransform[type],
    },
    notify ? 'DeletingDraft' : undefined,
    addNotification,
    true
  );
};

export const getTargetFile = (data: any) => {
  return data?.id;
};

export const insertUrlPartBeforeQuery = (
  url: string,
  part: string,
  query?: string
) => {
  const urlParts = url.split('?');
  const urlWithoutQuery = urlParts[0];
  const q = `?${urlParts[1] || ''}${urlParts[1] && query ? '&' : ''}${
    query ? query : ''
  }`;

  return `${urlWithoutQuery}${part}${q}`;
};

export const hasValue = (value) => {
  if (value && value !== '') {
    return true;
  } else {
    return false;
  }
};
export const getDraftId = (
  data: IQorusInterface['data'],
  interfaceId?: string
) => {
  return data?.id ?? interfaceId;
};

export const filterTemplatesByType = (
  templates: IReqoreFormTemplates = {},
  fieldType: IQorusType = 'string'
): IReqoreFormTemplates => {
  const newTemplates = cloneDeep(templates);

  newTemplates.items = newTemplates.items?.reduce((newItems, item) => {
    if (item.divider) {
      return [...newItems, item];
    }
    const subItems = item.items?.filter((subItem) => {
      return (
        subItem.badge === fieldType ||
        (fieldType === 'string' &&
          isTypeStringCompatible(subItem.badge as string))
      );
    });

    return [
      ...newItems,
      {
        ...item,
        items: subItems,
      },
    ];
  }, []);

  return newTemplates;
};

export const findTemplate = (
  templates: IReqoreFormTemplates,
  value: string
): IReqoreDropdownItem | undefined => {
  let result: IReqoreDropdownItem | undefined = undefined;

  templates.items?.forEach((item) => {
    const val = item.items?.find((subItem) => subItem.value === value);

    if (val) {
      result = val;
      return;
    }
  });

  return result;
};

export const buildTemplates = (
  templates?: TQodexTemplates,
  states?: IFSMStates,
  title?: string
) => {
  if (!size(templates)) {
    return undefined;
  }

  return {
    items: [
      {
        divider: true,
        label: title || 'Use data from Qorus',
        size: 'small',
        textAlign: 'left',
        dividerAlign: 'left',
      },
      ...map(
        templates,
        (
          { display_name, items, app, short_desc, action, internal, logo },
          dataId
        ): IReqoreDropdownItem => {
          const isValid = internal || isStateValid(states[dataId]);
          return {
            disabled: !isValid,
            intent: isValid === false ? 'danger' : undefined,
            label: display_name,
            description: short_desc,
            leftIconProps: {
              image: logo,
            },
            badge: app,
            items: map(
              items,
              ({ display_name, value, example_value, name, type }) => ({
                label: display_name,
                description: example_value
                  ? `Example value: ${JSON.stringify(example_value)}`
                  : undefined,
                badge: type,
                value,
              })
            ),
          };
        }
      ),
    ],
  } as IReqoreDropdownProps;
};

export const getTypesAccepted = (
  types: IQorusType[] = [],
  qorusTypes?: IQorusTypeObject[]
): IQorusTypeObject[] | undefined => {
  if (!size(types)) {
    return undefined;
  }

  const _types = cloneDeep(types).filter(
    (type) => type !== 'nothing' && type !== 'null'
  );

  if (size(_types) === 1) {
    if (_types[0] === 'auto' || _types[0] === 'any') {
      return undefined;
    }

    return [
      qorusTypes?.find((t) => t.name === _types[0]) || { name: _types[0] },
    ];
  }

  return _types.map(
    (type) => qorusTypes?.find((t) => t.name === type) || { name: type }
  );
};

export const getExpressionArgumentType = (
  arg: TExpressionSchemaArg,
  qorusTypes?: IQorusTypeObject[],
  currentType?: IQorusType,
  firstArgType?: IQorusType
): IQorusType => {
  const acceptedTypes = getTypesAccepted(arg.type.types_accepted, qorusTypes);

  // If there is only one accepted type, return it
  if (size(acceptedTypes) === 1) {
    return acceptedTypes[0]?.name;
  }

  if (currentType) {
    return currentType;
  }

  // Check if this type exists in the accepted types
  const type = acceptedTypes?.find((t) => t.name === firstArgType);

  if (type) {
    return type.name;
  }

  return arg.type.base_type;
};

export const isTypeStringCompatible = (type: string) => {
  const strongType = type.replace('*', '').replace('soft', '');

  return (
    strongType === 'string' ||
    strongType === 'number' ||
    strongType === 'boolean' ||
    strongType === 'date' ||
    strongType === 'int' ||
    strongType === 'bool' ||
    strongType === 'float'
  );
};
