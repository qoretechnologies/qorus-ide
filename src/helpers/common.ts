import { isArray } from 'util';
import { IField } from '../components/FieldWrapper';
import { TConfigItem } from '../containers/ConfigItemManager/filters';
import { postMessage } from '../hocomponents/withMessageHandler';

export const maybeSendOnChangeEvent = (
  field,
  value,
  type,
  interfaceId,
  sendResponse?: boolean
) => {
  // Check if this field has an on_change message
  if (field.on_change) {
    // Check if on_change is a list
    const onChange: string[] = isArray(field.on_change)
      ? field.on_change
      : [field.on_change];
    // Post all the actions
    onChange.forEach((action) => {
      // Post the message with this handler
      postMessage(action, {
        [field.name]: value,
        [`orig_${field.name}`]: field.value,
        iface_kind: type,
        iface_id: interfaceId,
        send_response: sendResponse,
      });
    });
  }
};

export const mapFieldsToGroups = (fields: IField[]) => {
  const groups = {};

  fields.forEach((field) => {
    const group = field.group || field.name;
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(field);
  });

  return groups;
};

export const getUniqueValuesFromConfigItemsByKey = (
  configItems: TConfigItem[],
  key: string
) => {
  const uniqueValues = new Set();

  configItems.forEach((item) => {
    uniqueValues.add(item[key]);
  });

  return Array.from(uniqueValues).filter((item) => item);
};

export const getFilteredItems = (
  items: { [key: string | number]: any }[],
  filters: Record<string, string[]>
): { [key: string | number]: any }[] => {
  const filteredItems = items.filter((item) => {
    let isMatch = true;

    Object.keys(filters).forEach((category) => {
      if (!filters[category].includes(item[category])) {
        isMatch = false;
      }
    });

    return isMatch;
  });

  return filteredItems;
};

export const subTypeToType = (type: string) => {
  if (type === 'service-methods') {
    return 'service';
  } else if (type === 'mapper-methods') {
    return 'mapper-code';
  } else if (type === 'error') {
    return 'errors';
  }

  return type;
};
