import { findIndex, omit, reduce, size } from 'lodash';

export const sortFields = (fields: Record<string, any>): Record<string, any> => {
  let newFields: Record<string, any> = {};
  // Check if every field has a `order` property
  const hasOrder = Object.values(fields).every((field) => field.order !== undefined);
  // If not
  if (!hasOrder) {
    // Add the incremental order property to every field
    newFields = reduce(
      fields,
      (newFields, field, name) => ({
        ...newFields,
        [name]: {
          ...field,
          order: size(newFields),
        },
      }),
      {}
    );
  }

  // sort the object by `order` property
  return Object.keys(newFields)
    .sort((a, b) => newFields[a].order - newFields[b].order)
    .reduce((obj, key) => {
      obj[key] = newFields[key];
      return obj;
    }, {});
};

// This functions flattens the fields, by taking all the
// deep fields from `type` and adds them right after their
// respective parent field
export const flattenFields: (
  fields: any,
  isMapperChild?: boolean,
  parent?: string,
  level?: number,
  path?: string
) => any[] = (fields, isMapperChild = false, parent, level = 0, path = '') =>
  reduce(
    fields,
    (newFields, field, name) => {
      let res = [...newFields];
      // Build the path for the child fields
      const newPath = level === 0 ? name : `${path}.${name}`;
      const parentPath = level !== 0 && `${path}`;
      // Add the current field
      res = [
        ...res,
        { name, ...{ ...field, isMapperChild, level, parent, path: newPath, parentPath } },
      ];
      // Check if this field has hierarchy
      if (size(field.type?.fields)) {
        // Recursively add deep fields
        res = [...res, ...flattenFields(field.type.fields, true, name, level + 1, newPath)];
      }
      // Return the new fields
      return res;
    },
    []
  );

export const getLastChildIndex = (field: any, fields: any[]) => {
  // Only get the child index for fields
  // that actually have children
  if (size(field.type.fields)) {
    // Get the name of the last field
    const name: string = Object.keys(field.type.fields).find(
      (_name, index) => index === size(field.type.fields) - 1
    );
    // Get the index of the last field in this
    // hierarchy based on the name
    return findIndex(fields, (curField) => curField.path === `${field.path}.${name}`);
  }
  // Return nothing
  return 0;
};

export const filterInternalData = (fields) => {
  return reduce(
    fields,
    (newFields, fieldData, field) => {
      return {
        ...newFields,
        [field]: {
          ...omit(fieldData, [
            'canBeNull',
            'firstCustomInHierarchy',
            'parent',
            'isMapperChild',
            'isCustom',
            'level',
          ]),
          type: {
            ...fieldData.type,
            fields: filterInternalData(fieldData.type?.fields),
          },
        },
      };
    },
    {}
  );
};

export const hasStaticDataField = (context: string) =>
  context.startsWith('$static') && !context.startsWith('$static:*');

export const getStaticDataFieldname = (context: string) => {
  return context.match(/\{([^}]+)\}/)?.[1];
};

export const rebuildOptions = (options) => {
  return options
    ? options.reduce(
        (newOptions, opt) => ({
          ...newOptions,
          [opt.name]: opt.value,
        }),
        {}
      )
    : {};
};

export const fixRelations = (relations: {}, outputs: any[], inputs: any[]) => {
  return reduce(
    relations,
    (newRelations, relationData: any, outputPath) => {
      let newOutputPath = outputPath;
      let newRelationData = { ...relationData };
      // Check if the outputPath exists in the outputs
      if (!outputs.find((output) => output.path === outputPath)) {
        // Assume it's a field name if it does not
        newOutputPath = outputPath.replace(/(?<!\\)\./g, '\\.');
      }

      // Check if the relation data name exists & and exists in the inputs
      if (relationData.name && !inputs.find((input) => input.path === relationData.name)) {
        // Assume it's a field name if it does not and escape dots
        newRelationData.name = relationData.name.replace(/(?<!\\)\./g, '\\.');
      }

      return {
        ...newRelations,
        [newOutputPath]: newRelationData,
      };
    },
    {}
  );
};

export const unEscapeMapperName = (name: string): string => {
  return typeof name === 'string' ? name.replace(/\\./g, '.') : name;
};
