import { find, size, some } from 'lodash';
import { IApp, IAppAction } from '../components/AppCatalogue';
import { IActionSet } from '../containers/InterfaceCreator/fsm/ActionSetDialog';
import {
  changeStateIdsToGenerated,
  removeTransitionsFromStateGroup,
} from '../helpers/fsm';
import { useQorusStorage } from './useQorusStorage';

export interface IActionsSetsHookFunctions {
  addNewActionSet?: (actionSet: IActionSet) => void;
  removeActionSet?: (actionSetId: string) => void;
  isSingleActionWithNameSaved?: (name: string) => boolean;
  getSingleActionWithNameSaved?: (name: string) => IActionSet;
}

export interface IActionSetsHook extends IActionsSetsHookFunctions {
  app: IApp;
  value: IActionSet[];
}

export const buildAppFromActionSets = (
  actionSets: IActionSet[],
  onRemoveClick?: IActionSetsHook['removeActionSet']
): IApp => {
  return {
    display_name: 'Saved Favorites',
    name: 'action_sets',
    icon: 'StarFill',
    iconColor: 'info',
    short_desc: 'States and groups of states you saved as favorites',
    builtin: false,
    is_action_set: true,
    actions: actionSets.map(({ options, states, id, updated }): IAppAction => {
      const action_code_str = !!find(states, (state) => state.is_event_trigger)
        ? 'EVENT'
        : 'API';

      if (size(states) === 1) {
        // Get the first state from the states object
        const firstStateKey = Object.keys(states)[0];
        const firstState = states[firstStateKey];

        return {
          display_name: firstState.name,
          action: firstState.id,
          short_desc: firstState.desc,
          action_code_str,
          app: 'action_sets',
          actions: () => [
            {
              icon: 'DeleteBinLine',
              intent: 'danger',
              size: 'small',
              className: 'action-set-remove',
              onClick: () => onRemoveClick?.(id),
            },
          ],
          metadata: {
            updated,
            states,
          },
        };
      }

      return {
        display_name: options.name.value,
        action: options.name.value,
        short_desc: options.shortDescription?.value,
        icon: 'CollageLine',
        action_code_str,
        app: 'action_sets',
        actions: () => [
          {
            icon: 'DeleteBinLine',
            intent: 'danger',
            size: 'small',
            className: 'action-set-remove',

            onClick: () => onRemoveClick?.(id),
          },
        ],
        metadata: {
          updated,
          states,
        },
      };
    }),
  };
};

export const useActionSets = (): IActionSetsHook => {
  const [actionSets, update] = useQorusStorage<IActionSet[]>(
    'customActionSets',
    []
  );

  const addNewActionSet = (actionSet: IActionSet) => {
    // Fix the states
    let fixedStates = changeStateIdsToGenerated(actionSet.states);
    // Remove non existing transitions
    fixedStates = removeTransitionsFromStateGroup(fixedStates);
    // Update the storage
    update([
      ...actionSets,
      { ...actionSet, states: fixedStates, updated: Date.now() },
    ]);
  };

  const removeActionSet = (actionSetId: string) => {
    update(actionSets.filter((actionSet) => actionSet.id !== actionSetId));
  };

  const isSingleActionWithNameSaved = (name: string) => {
    return actionSets.some((actionSet) => {
      return (
        size(actionSet.states) === 1 &&
        some(actionSet.states, (state) => state.name === name)
      );
    });
  };

  const getSingleActionWithNameSaved = (name: string): IActionSet => {
    return actionSets.find((actionSet) => {
      return (
        size(actionSet.states) === 1 &&
        some(actionSet.states, (state) => state.name === name)
      );
    });
  };

  return {
    app: buildAppFromActionSets(actionSets, removeActionSet),
    value: actionSets,
    addNewActionSet,
    removeActionSet,
    isSingleActionWithNameSaved,
    getSingleActionWithNameSaved,
  };
};
