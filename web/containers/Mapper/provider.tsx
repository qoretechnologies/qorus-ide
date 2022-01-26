import { Button, ButtonGroup, Callout, Classes, Spinner } from '@blueprintjs/core';
import { omit } from 'lodash';
import map from 'lodash/map';
import nth from 'lodash/nth';
import size from 'lodash/size';
import React, { FC, useCallback, useContext, useState } from 'react';
import { useDebounce } from 'react-use';
import styled, { css } from 'styled-components';
import CustomDialog from '../../components/CustomDialog';
import SelectField from '../../components/Field/select';
import String from '../../components/Field/string';
import { TextContext } from '../../context/text';
import { validateField } from '../../helpers/validations';
import withInitialDataConsumer from '../../hocomponents/withInitialDataConsumer';

export interface IProviderProps {
  type: 'inputs' | 'outputs';
  provider: string;
  setProvider: any;
  nodes: any[];
  setChildren: any;
  isLoading: boolean;
  setIsLoading: any;
  record: any;
  setRecord: any;
  setFields: any;
  initialData: any;
  clear: any;
  title: string;
  setOptionProvider: any;
  hide: any;
  style: any;
  isConfigItem?: boolean;
}

const StyledWrapper = styled.div<{ compact?: boolean; hasTitle: boolean }>`
  margin-bottom: 10px;
  ${({ compact, hasTitle }) =>
    compact
      ? css`
          margin-top: ${hasTitle ? '10px' : 0};
        `
      : css`
          margin: 0 auto;
          text-align: center;
        `}
  > span {
    vertical-align: middle;
    font-weight: 500;
    line-height: 20px;
  }
`;

const StyledHeader = styled.h3`
  margin: 0;
  margin-bottom: 10px;
  text-align: center;
`;

export let providers: any = {
  type: {
    name: 'type',
    url: 'dataprovider/types',
    suffix: '',
    recordSuffix: '?action=type',
    type: 'type',
  },
  connection: {
    name: 'connection',
    url: 'remote/user',
    filter: 'has_provider',
    namekey: 'name',
    desckey: 'desc',
    suffix: '/provider',
    recordSuffix: '/record',
    requiresRecord: true,
    type: 'connection',
  },
  remote: {
    name: 'remote',
    url: 'remote/qorus',
    filter: 'has_provider',
    namekey: 'name',
    desckey: 'desc',
    suffix: '/provider',
    recordSuffix: '/record',
    requiresRecord: true,
    type: 'remote',
  },
  datasource: {
    name: 'datasource',
    url: 'remote/datasources',
    filter: 'has_provider',
    namekey: 'name',
    desckey: 'desc',
    suffix: '/provider',
    recordSuffix: '/record',
    requiresRecord: true,
    type: 'datasource',
  },
  factory: {
    name: 'factory',
    url: 'dataprovider/factories',
    filter: null,
    inputFilter: 'supports_read',
    outputFilter: 'supports_create',
    suffix: '/provider',
    namekey: 'name',
    desckey: 'desc',
    recordSuffix: '',
    requiresRecord: false,
    suffixRequiresOptions: true,
    type: 'factory',
  },
};

const MapperProvider: FC<IProviderProps> = ({
  provider,
  setProvider,
  nodes,
  setChildren,
  isLoading,
  setIsLoading,
  record,
  setRecord,
  setFields,
  clear,
  initialData: { fetchData },
  setMapperKeys,
  setOptionProvider,
  title,
  type,
  hide,
  compact,
  canSelectNull,
  style,
  isConfigItem,
  options,
}) => {
  const [wildcardDiagram, setWildcardDiagram] = useState(null);
  const [optionString, setOptionString] = useState('');
  const t = useContext(TextContext);

  /* When the options hash changes, we want to update the query string. */
  useDebounce(
    () => {
      if (size(options)) {
        // Turn the options hash into a query string
        const str = map(options, (value, key) => `${key}=${value.value}`).join(',');
        setOptionString(`provider_options={${str}}`);
      } else {
        setOptionString('');
      }
    },
    500,
    [options]
  );

  // Omit type and factory from the list of providers if is config item
  providers = isConfigItem ? omit(providers, ['type']) : providers;

  const handleProviderChange = (provider) => {
    setProvider((current) => {
      // Fetch the url of the provider
      (async () => {
        // Clear the data
        clear && clear(true);
        // Set loading
        setIsLoading(true);
        // Select the provider data
        const { url, filter, inputFilter, outputFilter } = providers[provider];
        // Get the data
        let { data, error } = await fetchData(url);
        // Remove loading
        setIsLoading(false);
        // Filter unwanted data if needed
        if (filter) {
          data = data.filter((datum) => datum[filter]);
        }
        // Filter input filters and output filters
        if (type === 'inputs' || type === 'outputs') {
          if (type === 'inputs' && inputFilter) {
            data = data.filter((datum) => datum[inputFilter]);
          }
          if (type === 'outputs' && outputFilter) {
            data = data.filter((datum) => datum[outputFilter]);
          }
        }
        // Save the children
        let children = data.children || data;
        // Add new child
        setChildren([
          {
            values: children.map((child) => ({
              name: providers[provider].namekey ? child[providers[provider].namekey] : child,
              desc: '',
              url,
              suffix: providers[provider].suffix,
            })),
            value: null,
          },
        ]);
      })();
      // Set the provider
      return provider;
    });
  };

  const handleChildFieldChange: (
    value: string,
    url: string,
    itemIndex: number,
    suffix?: string
  ) => void = async (value, url, itemIndex, suffix) => {
    // Clear the data
    clear && clear(true);
    // Set loading
    setIsLoading(true);
    // Build the suffix
    let suffixString = providers[provider].suffixRequiresOptions
      ? optionString && optionString !== ''
        ? `${suffix}?${optionString}`
        : ''
      : suffix;
    // Fetch the data
    const { data, error } = await fetchData(`${url}/${value}${suffixString}`);
    if (error) {
      console.error(`${url}/${value}${suffix}`, error);
      setIsLoading(false);
      return;
    }
    // Reset loading
    setIsLoading(false);
    // Add new child
    setChildren((current) => {
      // Update this item
      const newItems: any[] = current
        .map((item, index) => {
          const newItem = { ...item };
          // Update the value if the index matches
          if (index === itemIndex) {
            newItem.value = value;
          }
          // Also check if there are items with
          // higher index (children) and remove them
          if (index > itemIndex) {
            return null;
          }
          // Return the item
          return newItem;
        })
        .filter((item) => item);
      if (data.has_type || isConfigItem) {
        (async () => {
          setIsLoading(true);
          if (type === 'outputs' && data.mapper_keys) {
            // Save the mapper keys
            setMapperKeys && setMapperKeys(data.mapper_keys);
          }

          suffixString = providers[provider].suffixRequiresOptions
            ? optionString && optionString !== ''
              ? `${suffix}${providers[provider].recordSuffix}?${optionString}${
                  type === 'outputs' ? '&soft=true' : ''
                }`
              : ''
            : `${suffix}${providers[provider].recordSuffix}`;

          // Fetch the record
          const record = await fetchData(`${url}/${value}${suffixString}`);
          // Remove loading
          setIsLoading(false);
          // Save the name by pulling the 3rd item from the split
          // url (same for every provider type)
          const name = `${url}/${value}`.split('/')[2];
          // Set the provider option
          setOptionProvider({
            type: providers[provider].type,
            name,
            can_manage_fields: record.data.can_manage_fields,
            path: `${url}/${value}`
              .replace(`${name}`, '')
              .replace(`${providers[provider].url}/`, '')
              .replace('provider/', ''),
            options,
          });
          // Set the record data
          setRecord &&
            setRecord(!providers[provider].requiresRecord ? record.data.fields : record.data);
          //
        })();
      }
      // If this provider has children
      if (size(data.children)) {
        // Return the updated items and add
        // the new item
        return [
          ...newItems,
          {
            values: data.children.map((child) => ({
              name: child,
              desc: '',
              url: `${url}/${value}${suffix}`,
              suffix: '',
            })),
            value: null,
          },
        ];
      } else if (data.supports_request) {
        // Return the updated items and add
        // the new item
        return [
          ...newItems,
          {
            values: [
              {
                name: 'request',
                desc: '',
                url: `${url}/${value}${suffix}`,
                suffix: '',
              },
              {
                name: 'response',
                desc: '',
                url: `${url}/${value}${suffix}`,
                suffix: '',
              },
            ],
            value: null,
          },
        ];
      }
      // Return the updated children
      else {
        if (data.fields) {
          // Save the name by pulling the 3rd item from the split
          // url (same for every provider type)
          const name = `${url}/${value}`.split('/')[2];
          // Set the provider option
          setOptionProvider({
            type: providers[provider].type,
            can_manage_fields: data.can_manage_fields,
            name,
            subtype: value === 'request' || value === 'response' ? value : undefined,
            path: `${url}/${value}`
              .replace(`${name}`, '')
              .replace(`${providers[provider].url}/`, '')
              .replace('provider/', '')
              .replace('request', '')
              .replace('response', ''),
          });
          // Set the record data
          setRecord && setRecord(data.fields);
        }
        // Check if there is a record
        else if (isConfigItem || data.has_record || !providers[provider].requiresRecord) {
          (async () => {
            setIsLoading(true);
            if (type === 'outputs' && data.mapper_keys) {
              // Save the mapper keys
              setMapperKeys && setMapperKeys(data.mapper_keys);
            }
            // Fetch the record
            const record = await fetchData(
              `${url}/${value}${suffix}${providers[provider].recordSuffix}${
                type === 'outputs' ? '?soft=true' : ''
              }`
            );
            // Remove loading
            setIsLoading(false);
            // Save the name by pulling the 3rd item from the split
            // url (same for every provider type)
            const name = `${url}/${value}`.split('/')[2];
            // Set the provider option
            setOptionProvider({
              type: providers[provider].type,
              name,
              can_manage_fields: record.data.can_manage_fields,
              path: `${url}/${value}`
                .replace(`${name}`, '')
                .replace(`${providers[provider].url}/`, '')
                .replace('provider/', ''),
              options,
            });
            // Set the record data
            setRecord &&
              setRecord(!providers[provider].requiresRecord ? record.data.fields : record.data);
            //
          })();
        }

        return [...newItems];
      }
    });
  };

  const getDefaultItems = useCallback(
    () =>
      map(providers, ({ name }) => ({ name, desc: '' })).filter((prov) =>
        prov.name === 'null' ? canSelectNull : true
      ),
    []
  );

  return (
    <>
      {wildcardDiagram?.isOpen && (
        <CustomDialog title={t('Wildcard')} isOpen isCloseButtonShown={false}>
          <div className={Classes.DIALOG_BODY}>
            <Callout intent="primary">{t('WildcardReplace')}</Callout>
            <br />
            <String
              name="wildcard"
              onChange={(_name, value) => setWildcardDiagram((cur) => ({ ...cur, value }))}
              value={wildcardDiagram.value}
            />
          </div>
          <div className={Classes.DIALOG_FOOTER}>
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
              <Button
                intent="success"
                disabled={!validateField('string', wildcardDiagram.value)}
                onClick={() => {
                  handleChildFieldChange(
                    wildcardDiagram.value,
                    wildcardDiagram.url,
                    wildcardDiagram.index,
                    wildcardDiagram.suffix
                  );
                  setWildcardDiagram(null);
                }}
                text={t('Submit')}
              />
            </div>
          </div>
        </CustomDialog>
      )}
      <StyledWrapper compact={compact} hasTitle={!!title} style={style}>
        {!compact && <StyledHeader>{title}</StyledHeader>}
        {compact && title && <span>{title}: </span>}{' '}
        <ButtonGroup>
          <SelectField
            name={`provider${type ? `-${type}` : ''}`}
            disabled={isLoading}
            defaultItems={getDefaultItems()}
            onChange={(_name, value) => {
              handleProviderChange(value);
            }}
            value={provider}
          />
          {nodes.map((child, index) => (
            <ButtonGroup>
              <SelectField
                key={`${title}-${index}`}
                name={`provider-${type ? `${type}-` : ''}${index}`}
                disabled={isLoading}
                defaultItems={child.values}
                onChange={(_name, value) => {
                  // Get the child data
                  const { url, suffix } = child.values.find((val) => val.name === value);
                  // If the value is a wildcard present a dialog that the user has to fill
                  if (value === '*') {
                    setWildcardDiagram({
                      index,
                      isOpen: true,
                      url,
                      suffix,
                    });
                  } else {
                    // Change the child
                    handleChildFieldChange(value, url, index, suffix);
                  }
                }}
                value={child.value}
              />
              {index === 0 && size(options) ? (
                <Button
                  icon="refresh"
                  onClick={() => {
                    // Get the child data
                    const { url, suffix } = child.values.find((val) => val.name === child.value);
                    // If the value is a wildcard present a dialog that the user has to fill
                    if (child.value === '*') {
                      setWildcardDiagram({
                        index,
                        isOpen: true,
                        url,
                        suffix,
                      });
                    } else {
                      // Change the child
                      handleChildFieldChange(child.value, url, index, suffix);
                    }
                  }}
                />
              ) : null}
            </ButtonGroup>
          ))}
          {isLoading && <Spinner size={15} />}
          {nodes.length > 0 && (
            <Button
              intent="danger"
              name={`provider-${type ? `${type}-` : ''}back`}
              icon="step-backward"
              className={Classes.FIXED}
              onClick={() => {
                setChildren((cur) => {
                  const result = [...cur];

                  result.pop();

                  const lastChild = nth(result, -2);

                  if (lastChild) {
                    const index = size(result) - 2;
                    const { value, values } = lastChild;
                    const { url, suffix } = values.find((val) => val.name === value);

                    // If the value is a wildcard present a dialog that the user has to fill
                    if (value === '*') {
                      setWildcardDiagram({
                        index,
                        isOpen: true,
                        url,
                        suffix,
                      });
                    } else {
                      // Change the child
                      handleChildFieldChange(value, url, index, suffix);
                    }
                  }

                  // If there are no children then we need to reset the provider
                  if (size(result) === 0) {
                    handleProviderChange(provider);
                  }

                  return result;
                });
              }}
            />
          )}
          {record && (
            <Button
              intent="success"
              name={`provider-${type ? `${type}-` : ''}submit`}
              icon="small-tick"
              onClick={() => {
                setFields(record);
                hide();
              }}
            />
          )}
        </ButtonGroup>
      </StyledWrapper>
    </>
  );
};

export default withInitialDataConsumer()(MapperProvider);
