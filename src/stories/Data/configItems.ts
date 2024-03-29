import { TConfigItem } from '../../containers/ConfigItemManager/filters';

export default {
  global_items: [
    ...Array.from({ length: 10 }, (_v, i) => ({
      name: `Global Item ${i + 1}`,
      default_value: 'test',
      description: 'asg',
      config_group: 'Paged group',
      parent_data: {
        name: 'CFG',
        default_value: 'test',
        description: 'asg',
        config_group: 1,
      },
      parent: {
        'interface-type': 'class',
        'interface-name': 'SomeOtherClass',
        'interface-version': '1',
      },
      parent_class: 'SomeOtherClass',
      type: 'number',
      value: i % 4 !== 0 ? i : undefined,
      level: 'default',
      // Every 5th item is not set
      is_set: i % 5 !== 0,
      yamlData: {
        value: 2,
        default_value: 2,
      },
    })),
  ],
  workflow_items: [
    ...Array.from({ length: 5 }, (_v, i) => ({
      name: `Workflow Item ${i + 1}`,
      default_value: 'test',
      description: 'asg',
      config_group: 'Paged group',
      parent_data: {
        name: 'CFG',
        default_value: 'test',
        description: 'asg',
        config_group: 1,
      },
      parent: {
        'interface-type': 'class',
        'interface-name': 'SomeOtherClass',
        'interface-version': '1',
      },
      parent_class: 'SomeOtherClass',
      type: 'number',
      value: i % 2 !== 0 ? i : undefined,
      level: 'default',
      // Every 2nd item is not set
      is_set: i % 2 !== 0,
      yamlData: {
        value: 2,
        default_value: 2,
      },
    })),
  ],
  items: [
    {
      name: 'CFG',
      default_value: 'test',
      description: 'asg',
      config_group: 1,
      parent_data: {
        name: 'CFG',
        default_value: 'test',
        description: 'asg',
        config_group: 1,
      },
      parent: {
        'interface-type': 'class',
        'interface-name': 'ConfigItems',
        'interface-version': '1',
      },
      parent_class: 'ConfigItems',
      type: 'boolean',
      value: true,
      level: 'default',
      is_set: true,
      yamlData: {
        value: 'test',
        default_value: 'test',
      },
    },
    {
      name: 'Another Item',
      default_value: 'test',
      description: 'asg',
      config_group: 1,
      parent_data: {
        name: 'CFG',
        default_value: 'test',
        description: 'asg',
        config_group: 1,
      },
      parent: {
        'interface-type': 'class',
        'interface-name': 'ConfigItems',
        'interface-version': '1',
      },
      parent_class: 'ConfigItems',
      type: 'string',
      value: 'Some value',
      level: 'default',
      is_set: true,
      yamlData: {
        value: 'test',
        default_value: 'test',
      },
    },
    {
      name: 'CFG',
      default_value: 'test',
      description: 'asg',
      config_group: 'test group',
      parent_data: {
        name: 'CFG',
        default_value: 'test',
        description: 'asg',
        config_group: 1,
      },
      parent: {
        'interface-type': 'class',
        'interface-name': 'MoreConfigItems',
        'interface-version': '1',
      },
      parent_class: 'MoreConfigItems',
      type: 'number',
      value: 2,
      level: 'default',
      is_set: true,
      yamlData: {
        value: 2,
        default_value: 2,
      },
    },
    {
      name: 'No value',
      description: 'asg',
      config_group: 'Another group',
      parent_data: {
        name: 'CFG',
        default_value: 'test',
        description: 'asg',
        config_group: 1,
      },
      parent: {
        'interface-type': 'class',
        'interface-name': 'GreatConfigItems',
        'interface-version': '1',
      },
      parent_class: 'GreatConfigItems',
      type: 'string',
      level: 'default',
      is_set: false,
      yamlData: {
        value: 2,
        default_value: 2,
      },
    },
    ...Array.from({ length: 50 }, (_v, i) => ({
      name: `${i % 6 === 0 ? 'Special' : 'Normal'} Item ${i + 1}`,
      default_value: 'test',
      description: 'asg',
      config_group: 'Paged group',
      parent_data: {
        name: 'CFG',
        default_value: 'test',
        description: 'asg',
        config_group: 1,
      },
      parent: {
        'interface-type': 'class',
        'interface-name': 'SomeOtherClass',
        'interface-version': '1',
      },
      parent_class: 'SomeOtherClass',
      type: 'number',
      value: i % 5 !== 0 ? i : undefined,
      level: i % 17 === 0 ? 'step' : 'default',
      // Every 5th item is not set
      is_set: i % 5 !== 0,
      // Every 12th item is strictly local
      strictly_local: i % 12 === 0,
      yamlData: {
        value: 2,
        default_value: 2,
      },
    })),
  ],
} as Record<string, TConfigItem[]>;
