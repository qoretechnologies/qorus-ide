import {
  ReqoreInput,
  ReqoreMenu,
  ReqoreMenuDivider,
  ReqoreMenuItem,
  ReqoreSpinner,
} from '@qoretechnologies/reqore';
import { IReqoreInputProps } from '@qoretechnologies/reqore/dist/components/Input';
import { size } from 'lodash';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAsyncRetry, useDebounce } from 'react-use';
import { interfaceIcons, interfaceImages } from '../../constants/interfaces';
import { IQorusListInterface } from '../../containers/InterfacesView';
import { fetchData } from '../../helpers/functions';

export const GlobalSearch = () => {
  const [query, setQuery] = useState<string>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { value, loading } = useAsyncRetry<IQorusListInterface[]>(async () => {
    if (searchQuery) {
      const data = await fetchData(
        `/system/interfaces?substring=${searchQuery}`
      );

      return data.data;
    }

    return [];
  }, [searchQuery]);

  const finalValue = searchQuery ? value : [];

  useDebounce(
    () => {
      setSearchQuery(query);
    },
    300,
    [query]
  );

  const tooltip: IReqoreInputProps['tooltip'] =
    useMemo((): IReqoreInputProps['tooltip'] => {
      if (searchQuery && loading) {
        return {
          content: (
            <ReqoreSpinner type={5} iconColor='info:lighten'>
              Searching...
            </ReqoreSpinner>
          ),
          noArrow: true,
          noWrapper: false,
          useTargetWidth: true,
          handler: 'focus',
          openOnMount: true,
        };
      }

      if (size(finalValue)) {
        return {
          useTargetWidth: true,
          noArrow: true,
          noWrapper: true,
          handler: 'focus',
          openOnMount: true,
          content: (
            <ReqoreMenu maxHeight='300px'>
              <ReqoreMenuDivider
                label={`Found ${size(finalValue)} results`}
                padded='none'
              />
              {finalValue.map((item) => (
                <ReqoreMenuItem
                  key={`${item.type}-${item.id}`}
                  leftIconProps={{
                    icon: interfaceIcons[item.type],
                    image: interfaceImages[item.type],
                  }}
                  badge={[item.type]}
                  tooltip={item.data?.short_desc}
                  as={process.env.NODE_ENV === 'storybook' ? 'a' : Link}
                  // @ts-ignore
                  to={`/CreateInterface/${item.type}/${item.id}`}
                >
                  {item.label}
                </ReqoreMenuItem>
              ))}
            </ReqoreMenu>
          ),
        };
      } else if (searchQuery) {
        return {
          content: 'No results found',
          noArrow: true,
          noWrapper: true,
          useTargetWidth: true,
          handler: 'focus',
          openOnMount: true,
        };
      }

      return {
        content: 'Start typing to search...',
        icon: 'SearchLine',
        noArrow: true,
        noWrapper: true,
        useTargetWidth: true,
        handler: 'focus',
        openOnMount: false,
      };
    }, [JSON.stringify(finalValue), loading, searchQuery]);

  return (
    <ReqoreInput
      placeholder='Search...'
      icon='Search2Line'
      pill
      intent='muted'
      iconColor='muted'
      leftIconProps={{
        size: 'small',
      }}
      width={400}
      onChange={(e: any) => setQuery(e.target.value)}
      onClearClick={() => {
        setQuery('');
        setSearchQuery('');
      }}
      value={query}
      tooltip={tooltip}
    />
  );
};
