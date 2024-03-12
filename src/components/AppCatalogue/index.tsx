import { ReqoreCollection } from '@qoretechnologies/reqore';
import { IReqoreCollectionProps } from '@qoretechnologies/reqore/dist/components/Collection';
import { IReqoreCollectionItemProps } from '@qoretechnologies/reqore/dist/components/Collection/item';
import { IReqorePanelProps } from '@qoretechnologies/reqore/dist/components/Panel';
import { IReqoreIconName } from '@qoretechnologies/reqore/dist/types/icons';
import timeago from 'epoch-timeago';
import { map, size } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import {
  IFSMVariable,
  TAppAndAction,
} from '../../containers/InterfaceCreator/fsm';
import { IActionSet } from '../../containers/InterfaceCreator/fsm/ActionSetDialog';
import {
  getStateCategory,
  getStateColor,
} from '../../containers/InterfaceCreator/fsm/state';
import { TAction } from '../../containers/InterfaceCreator/fsm/stateDialog';
import { FSMItemIconByType } from '../../containers/InterfaceCreator/fsm/toolbarItem';
import { getAppAndAction } from '../../helpers/fsm';
import { IOptionsSchema } from '../Field/systemOptions';

export interface IAppAction {
  app: string; //the application name
  action: TAction | string; //the unique action name in the application
  display_name: string; //the dispay name for the application
  subtype?: string; //the subtype for the data provider provided by the connection
  path?: string; //the data provider path for the action
  path_vars?: Record<string, string>; //descriptions for any path variables
  short_desc: string; //the action's short description in plain text
  desc?: string; //the action's long description with markdown formatting
  action_code?: number; //the action's code
  action_code_str?: 'EVENT' | 'API' | 'SEND_MESSAGE' | 'VARIABLE' | 'FIND';
  action_val?: string; //the action value: message or event type)
  logo?: string; //a link to the logo data that will be served directly
  icon?: IReqorePanelProps['icon'];
  iconColor?: IReqorePanelProps['iconColor'];
  type?: TAction;
  varType?: IFSMVariable['variableType'];
  varName?: IFSMVariable['name'];
  varReadOnly?: IFSMVariable['readOnly'];
  actions?: (action: IAppAction) => IReqoreCollectionItemProps['actions'];
  options_url?: string;
  exec_options_url?: string;
  exec_url?: string;
  options?: IOptionsSchema;
  metadata?: Partial<IActionSet>;
}

export interface IApp {
  name: string; // the unique application name;
  builtin?: boolean; //indicates if the application is built-in
  is_action_set?: boolean; //indicates if the application is an action set
  display_name: string; //the dispay name for the application
  desc?: string; //the application description with markdown formatting
  short_desc: string; //the application short description in plain text
  scheme?: string; //any scheme identifying a @ref ConnectionProvider::AbstractConnection "connection" for the application
  oauth2_auth_code?: boolean; //indicates if the application supports the OAuth2 authorization code flow
  logo?: string; //a link to the logo data that will be served directly
  icon?: IReqorePanelProps['icon'];
  iconColor?: IReqorePanelProps['iconColor'];
  logo_file_name?: string; //the file name of the logo
  logo_mime_type?: string; //the mime type for \c logo
  oauth2_client?: {
    //OAuth2 client info, if any
    oauth2_client_id: string; //the OAuth2 client ID to use
    oauth2_client_secret: string; //the OAuth2 client secret to use
    url_type: string; //\c auto: automatically generated or \c required: the user must provide a URL
    oauth2_auth_url: string; //if set, this overrides the REST connection option
    oauth2_token_url: string; //if set, this overrides the REST connection option
    required_options: string[]; //a list of connection options that must be filled in by the user to create the connection
  };
  actions?: IAppAction[];
  collectionActions?: (app: IApp) => IReqoreCollectionItemProps['actions'];
}

export interface IAppCatalogueProps extends IReqoreCollectionProps {
  apps: IApp[];
  onActionSelect: (action: IAppAction, app: IApp) => void;
  icon?: IReqoreIconName;
  image?: string;
  favorites?: string[];
  onFavoriteClick?: (app: string) => void;
  type?: 'action' | 'event';
}

export const AppCatalogue = ({
  apps,
  onActionSelect,
  label,
  icon,
  image,
  defaultQuery = '',
  favorites = [],
  onFavoriteClick,
  type,
  sortable = true,
}: IAppCatalogueProps) => {
  const [selectedAppName, setSelectedAppName] = useState<string>(undefined);
  const [query, setQuery] = useState<string | number>(defaultQuery);
  const selectedApp = useMemo(
    () => apps.find((app) => app.name === selectedAppName),
    [apps, selectedAppName]
  );

  const breadcrumbs: IReqorePanelProps['breadcrumbs'] = useMemo(() => {
    let result: IReqorePanelProps['breadcrumbs'] = {
      flat: false,
      items: [
        {
          label: label as string,
          minimal: true,
          icon,
          badge: size(apps),
          leftIconProps: image
            ? {
                image,
              }
            : undefined,
          onClick: () => setSelectedAppName(undefined),
        },
      ],
    };

    if (selectedApp) {
      result.items.push({
        label: selectedApp.display_name,
        badge: size(selectedApp.actions),
        icon: selectedApp.icon || 'BlazeLine',
        leftIconProps: {
          image: selectedApp.logo,
          rounded: true,
        },
        minimal: true,
      });
    }

    return result;
  }, [selectedApp]);

  const getFilteredActions = useCallback(
    (actions: IAppAction[]) => {
      return actions.filter((action) => {
        return type !== 'event'
          ? action.action_code_str !== 'EVENT'
          : action.action_code_str === 'EVENT';
      });
    },
    [type]
  );

  const buildActionTags = (
    action: IAppAction
  ): IReqoreCollectionItemProps['tags'] => {
    let tags: IReqoreCollectionItemProps['tags'] = [];

    if (action.metadata?.updated) {
      tags.push({
        icon: 'TimeLine',
        label: timeago(action.metadata.updated),
      });
    }

    if (size(action.metadata?.states) > 1) {
      tags = [
        ...tags,
        ...map(action.metadata.states, (state) => ({
          label: state.name,
          icon:
            state.action?.type !== 'appaction'
              ? FSMItemIconByType[state.action?.type]
              : 'QuestionLine',
          leftIconProps: {
            image: getAppAndAction(
              apps,
              (state.action?.value as TAppAndAction)?.app
            )?.app?.logo,
          },
          effect: {
            gradient: getStateColor(
              getStateCategory(state.action?.type),
              state.is_event_trigger
            ),
          },
        })),
      ];
    }

    return tags;
  };

  const getActionLogo = (action) => {
    if (size(action.metadata?.states) === 1) {
      // Get the first state from the states object
      const firstStateKey = Object.keys(action.metadata?.states)[0];
      const firstState = action.metadata?.states[firstStateKey];

      return getAppAndAction(apps, firstState.action?.value?.app)?.app?.logo;
    }

    return action.logo || selectedApp.logo;
  };

  if (selectedApp) {
    return (
      <ReqoreCollection
        filterable
        sortable
        zoomable
        fill
        key={selectedApp.name}
        padded={false}
        minColumnWidth='300px'
        defaultQuery={query.toString()}
        onQueryChange={(q) => setQuery(q)}
        inputInTitle={false}
        responsiveTitle={false}
        inputProps={{ fluid: true }}
        defaultZoom={0.5}
        breadcrumbs={breadcrumbs}
        items={getFilteredActions(selectedApp.actions).map(
          (action): IReqoreCollectionItemProps => ({
            label: action.display_name,
            content: <>{action.short_desc}</>,
            tags: buildActionTags(action),
            iconImage: getActionLogo(action),
            icon: action.icon || selectedApp.icon,
            iconColor: action.iconColor || selectedApp.iconColor,
            contentEffect: {
              gradient: {
                direction: 'to right bottom',
                colors: {
                  50: 'main',
                  200: selectedApp.builtin ? '#6f1977' : 'info:lighten:2',
                },
              },
            },

            onClick: () => onActionSelect(action, selectedApp),
            iconProps: {
              size: 'huge',
              rounded: true,
            },
            actions: [...(action.actions?.(action) || [])],
          })
        )}
      />
    );
  }

  return (
    <ReqoreCollection
      filterable
      fill
      sortable={sortable}
      zoomable
      padded={false}
      minColumnWidth='300px'
      responsiveTitle={false}
      inputInTitle={false}
      inputProps={{ fluid: true }}
      defaultZoom={0.5}
      onQueryChange={(q) => setQuery(q)}
      defaultQuery={query.toString()}
      selectedIcon='StarFill'
      showSelectedFirst
      breadcrumbs={breadcrumbs}
      items={apps.map((app) => ({
        label: app.display_name,
        badge: size(getFilteredActions(app.actions)),
        content: <>{app.short_desc}</>,
        selected: favorites.includes(app.name),
        iconImage: app.logo,
        icon: app.icon,
        iconColor: app.iconColor,
        contentEffect: {
          gradient: {
            direction: 'to right bottom',
            colors: {
              50: 'main',
              200: app.builtin ? '#6f1977' : 'info:lighten:2',
            },
          },
        },
        actions: [
          {
            show: favorites.includes(app.name) ? true : 'hover',
            icon: favorites.includes(app.name) ? 'StarFill' : 'StarLine',
            intent: 'info',
            tooltip: 'Add to favorites',
            onClick: () => {
              onFavoriteClick(app.name);
            },
          },
          ...(app.collectionActions?.(app) || []),
        ],
        minimal: true,
        searchString: `${app.actions.reduce(
          (acc, action) => `${acc} ${action.display_name.toLowerCase()}`,
          ''
        )}`,
        iconProps: {
          size: 'huge',
          rounded: true,
        },
        onClick: () => setSelectedAppName(app.name),
      }))}
    />
  );
};
