import {
  ReqoreControlGroup,
  ReqoreH1,
  ReqoreHorizontalSpacer,
  ReqoreMessage,
  ReqoreModal,
  ReqoreP,
  ReqoreTabs,
  ReqoreTabsContent,
  ReqoreVerticalSpacer,
  useReqore,
  useReqoreProperty,
  useReqoreTheme,
} from '@qoretechnologies/reqore';
import {
  ReqoreTextEffect,
  StyledEffect,
} from '@qoretechnologies/reqore/dist/components/Effect';
import { ReqoreExportModal } from '@qoretechnologies/reqore/dist/components/ExportModal';
import { ReqraftLog, useReqraftStorage } from '@qoretechnologies/reqraft';
import { debounce, drop, every, find, findKey, omit, some } from 'lodash';
import cloneDeep from 'lodash/cloneDeep';
import filter from 'lodash/filter';
import forEach from 'lodash/forEach';
import isEqual from 'lodash/isEqual';
import map from 'lodash/map';
import maxBy from 'lodash/maxBy';
import reduce from 'lodash/reduce';
import size from 'lodash/size';
import React, {
  Dispatch,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDebounce, useUnmount, useUpdateEffect } from 'react-use';
import useMount from 'react-use/lib/useMount';
import compose from 'recompose/compose';
import shortid from 'shortid';
import styled, { css, keyframes } from 'styled-components';
import Content from '../../../components/Content';
import { DragSelectArea } from '../../../components/DragSelectArea';
import { IExpression } from '../../../components/ExpressionBuilder';
import { IProviderType } from '../../../components/Field/connectors';
import {
  NegativeColorEffect,
  PositiveColorEffect,
  SaveColorEffect,
  WarningColorEffect,
} from '../../../components/Field/multiPair';
import {
  IOptions,
  IQorusType,
  TFlatOptions,
} from '../../../components/Field/systemOptions';
import Loader from '../../../components/Loader';
import { calculateValueWithZoom } from '../../../components/PanElement';
import { interfaceIcons } from '../../../constants/interfaces';
import { Messages } from '../../../constants/messages';
import { AppsContext } from '../../../context/apps';
import { DraftsContext, IDraftData } from '../../../context/drafts';
import { GlobalContext } from '../../../context/global';
import { InitialContext } from '../../../context/init';
import { TextContext } from '../../../context/text';
import { getStateBoundingRect } from '../../../helpers/diagram';
import {
  IStateCorners,
  alignStates,
  areStatesAConnectedGroup,
  areVariablesValid,
  autoAlign,
  buildMetadata,
  checkOverlap,
  getStatesConnectedtoState,
  getVariable,
  isStateValid,
  positionStateInFreeSpot,
  prepareFSMDataForPublishing,
  removeAllStatesWithVariable,
  removeFSMState,
  removeMultipleFSMStates,
  repositionStateGroup,
} from '../../../helpers/fsm';
import {
  ITypeComparatorData,
  areTypesCompatible,
  fetchData,
  formatAndFixOptionsToKeyValuePairs,
  getDraftId,
  getStateProvider,
  hasValue,
  isFSMStateValid,
  isStateIsolated,
} from '../../../helpers/functions';
import { validateField } from '../../../helpers/validations';
import withGlobalOptionsConsumer from '../../../hocomponents/withGlobalOptionsConsumer';
import withMapperConsumer from '../../../hocomponents/withMapperConsumer';
import { useApps } from '../../../hooks/useApps';
import { useMoveByDragging } from '../../../hooks/useMoveByDragging';
import { useQorusStorage } from '../../../hooks/useQorusStorage';
import TinyGrid from '../../../images/graphy-dark.png';
import { ActionSetDialog } from './ActionSetDialog';
import { AppSelector } from './AppSelector';
import { QodexFields, TQogNotificationStorageItems } from './Fields';
import { QodexTestRunModal } from './TestRunModal';
import FSMDiagramWrapper from './diagramWrapper';
import FSMInitialOrderDialog from './initialOrderDialog';
import FSMState from './state';
import { FSMStateDetail } from './stateDetail';
import { TAction } from './stateDialog';
import FSMTransitionDialog, { IModifiedTransitions } from './transitionDialog';
import { FSMVariables } from './variables';

export interface IFSMViewProps {
  onSubmitSuccess?: (data: any) => any;
  setFsmReset?: (func?: any) => void;
  embedded?: boolean;
  isQodex?: boolean;
  defaultStates?: IFSMStates;
  parentStateName?: string;
  defaultInterfaceId?: string;
  states?: IFSMStates;
  setStates?: Dispatch<React.SetStateAction<IFSMStates>>;
  fsm?: any;
  metadata?: Partial<IFSMMetadata>;
  setMetadata?: Dispatch<React.SetStateAction<any>>;
  onHideMetadataClick?: (cur?: any) => any;
  isExternalMetadataHidden?: boolean;
  interfaceContext?: {
    target_dir?: string;
    inputType?: IProviderType;
    [key: string]: any;
  };
  onStatesChange?: (states: IFSMStates) => void;
  setMapper?: (mapper: any) => void;
}

export interface IDraggableItem {
  type: 'toolbar-item' | 'state';
  name: 'fsm' | 'state' | 'block' | 'if';
  displayName?: string;
  desc?: string;
  id?: number;
  stateType?: TAction;
  varType?: 'globalvar' | 'localvar' | 'autovar';
  varName?: string;
  injected?: boolean;
  injectedData?: any;
  actionData?: any;
  is_event_trigger?: boolean;
  transitions?: IFSMTransition[];
}

export interface IFSMTransition {
  state?: string;
  fsm?: number;
  condition?: string | IExpression;
  language?: string;
  fake?: boolean;
  errors?: string[];
  branch?: 'true' | 'false';
}

export type TTrigger = { class?: string; connector?: string; method?: string };

export interface IFSMMetadata {
  name?: string;
  display_name: string;
  desc?: string;
  short_desc?: string;
  target_dir?: string;
  groups?: any[];
  'input-type'?: IProviderType;
  'output-type'?: IProviderType;
  globalvar?: TFSMVariables;
  localvar?: TFSMVariables;
  autovar?: TFSMAutoVariables;
}

export type TFSMStateType = 'state' | 'fsm' | 'block' | 'if';
export type TVariableActionValue = {
  var_type: 'globalvar' | 'localvar' | 'autovar';
  var_name: string;
  transaction_action?: 'commit' | 'rollback' | 'begin-transaction';
  action_type?:
    | 'search'
    | 'search-single'
    | 'update'
    | 'create'
    | 'delete'
    | 'transaction'
    | 'send-message'
    | 'apicall';
} & Partial<IProviderType>;

export type TFSMClassConnectorAction = {
  class: string;
  connector: string;
  prefix?: string;
};
export type TAppAndAction = { app: string; action: string; options: IOptions };
export type TFSMStateAction = {
  type: TAction;
  value?:
    | string
    | TFSMClassConnectorAction
    | IProviderType
    | TVariableActionValue
    | TAppAndAction;
};

export interface IFSMState {
  name?: string;
  desc?: string;
  key?: string;
  corners?: IStateCorners;
  isNew?: boolean;
  isValid?: boolean;
  initial?: boolean;
  is_event_trigger?: boolean;
  position?: {
    x?: number;
    y?: number;
  };
  transitions?: IFSMTransition[];
  'error-transitions'?: IFSMTransition[];
  action?: TFSMStateAction;
  'block-type'?: 'while' | 'for' | 'foreach' | 'transaction';
  type: TFSMStateType;
  states?: IFSMStates;
  fsm?: string;
  id: string;
  condition?: any;
  language?: 'qore' | 'python';
  execution_order?: number;
  keyId?: string;
  disabled?: boolean;
  error?: boolean;
  injected?: boolean;
  injectedData?: {
    from: string;
    to: string;
    name?: string;
  };
}

export interface IFSMStates {
  [name: string]: IFSMState;
}

export const TOOLBAR_ITEM_TYPE = 'toolbar-item';
export const STATE_ITEM_TYPE = 'state';

export const DIAGRAM_SIZE = 4000;
export const IF_STATE_SIZE = 80;
export const STATE_WIDTH = 350;
export const STATE_HEIGHT = 120;
const DIAGRAM_DRAG_KEY = 'Shift';
const DROP_ACCEPTS: string[] = [TOOLBAR_ITEM_TYPE, STATE_ITEM_TYPE];

export const StyledToolbarWrapper = styled.div`
  margin-bottom: 10px;
  margin-top: 10px;
  overflow: hidden;
`;

const StyledDiagramWrapper = styled(StyledEffect)`
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  user-select: none;
`;

const StyledDiagram = styled(StyledEffect)<{ path: string }>`
  width: ${DIAGRAM_SIZE}px;
  height: ${DIAGRAM_SIZE}px;
  background-image: ${({ bgColor }) => `url(${TinyGrid})`};
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

export const StyledCompatibilityLoader = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background: #00000030;
  z-index: 2000;
`;

const StyledFSMLineAnimation = keyframes`
  to {
    stroke-dashoffset: 0;
  }
`;

const StyledFSMLine = styled.path`
  cursor: pointer;
  fill: none;
  filter: drop-shadow(0 0 2px #000000);
  transition: stroke-dashoffset 0.2s linear;
  stroke-dashoffset: 1000;
  stroke-linejoin: round;
  stroke-linecap: round;
  stroke-miterlimit: 10;

  &:hover {
    stroke-width: 6;
  }

  ${({ deselected }) =>
    deselected &&
    css`
      opacity: 0.2;
    `}

  ${({ selected, fake }) =>
    selected || fake
      ? css`
          opacity: ${fake ? 0.8 : 1};
          stroke-dasharray: ${fake ? 3 : 7};
          stroke-linejoin: round;
          stroke-linecap: round;
          stroke-miterlimit: 10;
          animation: ${StyledFSMLineAnimation} ${fake ? 20 : 10}s linear
            infinite;
        `
      : undefined}
`;

const StyledLineText = styled.text`
  ${({ deselected }) =>
    deselected &&
    css`
      opacity: 0.2;
    `}
`;

const StyledFSMCircle = styled.circle`
  transition: all 0.2s linear;
  cursor: pointer;

  &:hover {
    stroke-width: 6;
  }
`;

export interface IFSMVariable {
  type: IQorusType;
  value: any;
  desc?: string;
  name?: string;
  variableType: 'globalvar' | 'localvar' | 'autovar';
  readOnly?: boolean;
}

export interface IFSMAutoVariable extends Omit<IFSMVariable, 'readOnly'> {
  readOnly: true;
}

export type TFSMVariables = Record<string, IFSMVariable>;
export type TFSMAutoVariables = Record<string, IFSMAutoVariable>;
export interface IFSMSelectedState {
  fromMouseDown?: boolean;
}
export type TFSMSelectedStates = Record<string, IFSMSelectedState>;

export interface IFSMSettings {
  notifyOnStart?: boolean;
  notifyOnEnd?: boolean;
}

export const FSMContext = React.createContext<any>({});

export const FSMView: React.FC<IFSMViewProps> = ({
  onSubmitSuccess,
  setFsmReset,
  interfaceContext,
  embedded = false,
  states = {},
  setStates,
  metadata,
  setMetadata,
  parentStateName,
  onStatesChange,
  onHideMetadataClick,
  isExternalMetadataHidden,
  defaultInterfaceId,
  setMapper,
  isQodex,
  ...rest
}) => {
  const t = useContext(TextContext);
  const {
    sidebarOpen,
    path,
    image_path,
    callBackend,
    qorus_instance,
    saveDraft,
    changeInitialData,
    ...init
  }: any = useContext(InitialContext);
  const confirmAction = useReqoreProperty('confirmAction');
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  parentStateName = parentStateName?.replace(/ /g, '-');

  const fsm = rest?.fsm || init?.fsm;
  const { addNotification, addModal, removeModal } = useReqore();
  const { resetAllInterfaceData }: any = useContext(GlobalContext);
  const { maybeApplyDraft, draft } = useContext(DraftsContext);
  const [interfaceId, setInterfaceId] = useState(null);
  const [hasUnsavedState, setHasUnsavedState] = useState<boolean>(false);
  const [st, setSt] = useState<IFSMStates>(cloneDeep(fsm?.states || {}));
  const [mt, setMt] = useState<IFSMMetadata>(
    buildMetadata(fsm, interfaceContext)
  );
  const [actState, setActState] = useState<string | number>(undefined);
  const [storageSettings, update] =
    useQorusStorage<TQogNotificationStorageItems>('settings.qogs', {});
  const [settings, setSettings] = useState<TFlatOptions>(undefined);
  const wrapperRef = useRef(null);
  const showTransitionsToaster = useRef(0);
  const currentXPan = useRef<number>();
  const currentYPan = useRef<number>();
  const diagramRef = useRef(null);

  const stateRefs = useRef<Record<string | number, HTMLDivElement>>({}); // Refs for each state
  const timeSinceDiagramMouseDown = useRef<number>(0);

  let activeState;
  let setActiveState;

  if (!embedded) {
    states = st;
    setStates = setSt;

    metadata = mt;
    setMetadata = setMt;

    activeState = searchParams.get('state');

    setActiveState = (id) => {
      searchParams.set('state', id);
      setSearchParams(searchParams);
    };
  } else {
    activeState = actState;
    setActiveState = setActState;
  }

  const changeHistory = useRef<
    { metadata: string; states: string; key: string }[]
  >([
    {
      metadata: JSON.stringify(metadata || {}),
      states: JSON.stringify(states || {}),
      key: 'init',
    },
  ]);
  const currentHistoryPosition = useRef<number>(0);

  const [isMovingStates, setIsMovingStates] = useState<boolean>(false);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedStates, setSelectedStates] = useState<TFSMSelectedStates>({});

  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [showStateIds, setShowStateIds] = useState<boolean>(false);
  const [showVariables, setShowVariables] = useState<{
    show?: boolean;
    selected?: {
      name: string;
      variableType: 'globalvar' | 'localvar' | 'autovar';
    };
  }>(undefined);

  const [testRun, setTestRun] = useState(undefined);

  const [isEventTriggerChecked, setIsEventTriggerChecked] =
    useState<boolean>(false);
  const [compatibilityChecked, setCompatibilityChecked] =
    useState<boolean>(true);
  const [outputCompatibility, setOutputCompatibility] = useState<
    { [key: string]: boolean } | undefined
  >(undefined);
  const [inputCompatibility, setInputCompatibility] = useState<
    { [key: string]: boolean } | undefined
  >(undefined);
  const [isReady, setIsReady] = useState<boolean>(embedded || false);
  const [editingTransition, setEditingTransition] = useState<
    { stateId: number; index: number }[] | null
  >([]);
  const [editingTransitionOrder, setEditingTransitionOrder] = useState<
    number | null
  >(null);
  const [editingInitialOrder, setEditingInitialOrder] =
    useState<boolean>(false);
  const [wrapperDimensions, setWrapperDimensions] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });
  const [isMetadataHidden, setIsMetadataHidden] = useState<boolean>(true);
  const [addingNewStateAt, setIsAddingNewStateAt] = useState<{
    x: number;
    y: number;
    fromState?: string | number;
    branch?: IFSMTransition['branch'];
  }>(undefined);
  const [isAddingActionSet, setIsAddingActionSet] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);

  const [paneWidth, setPaneWidth] = useReqraftStorage<number>(
    'qog.pane-size',
    250
  );

  const theme = useReqoreTheme();

  const targetStatesTransitionIndexes = useRef<
    Record<string | number, Record<'left' | 'right' | 'top' | 'bottom', number>>
  >({});
  const statesTransitionIndexes = useRef<
    Record<string | number, Record<'left' | 'right' | 'top' | 'bottom', number>>
  >({});
  const transitionIndexes = useRef<
    Record<string | number, Record<'left' | 'right' | 'top' | 'bottom', number>>
  >({});

  const apps = useApps();

  const getDiagramBoundingRect = (): DOMRect => {
    return document
      .getElementById(
        `${parentStateName ? `${parentStateName}-` : ''}fsm-diagram`
      )!
      ?.getBoundingClientRect();
  };

  const calculateNewStatePositionOnDiagram = (x: number, y: number) => {
    const diagram = getDiagramBoundingRect();

    const newX =
      calculateValueWithZoom(x - diagram.left, zoom) +
      calculateValueWithZoom(currentXPan.current, zoom);
    const newY =
      calculateValueWithZoom(y - diagram.top, zoom) +
      calculateValueWithZoom(currentYPan.current, zoom);

    return { x: newX, y: newY };
  };

  const addNewState = (
    item: IDraggableItem,
    x,
    y,
    onSuccess?: (stateId: string) => any,
    isInjectedTriggerState?: boolean,
    fromState?: string | number,
    branch?: IFSMTransition['branch']
  ) => {
    const parentStateId = parseInt(parentStateName) || 0;
    const generatedId = shortid.generate();
    const id = (
      item.id ??
      (parentStateName ? `${parentStateId}.${generatedId}` : generatedId)
    ).toString();

    setStates((cur: IFSMStates): IFSMStates => {
      const newStates = cloneDeep(cur);
      let newX = x;
      let newY = y;

      // If we are creating a new state from a state, we need to add a transition
      if (fromState) {
        newStates[fromState].transitions = [
          ...(newStates[fromState].transitions || []),
          {
            state: id,
            branch,
          },
        ];

        newX = newStates[fromState].position.x;
        newY = newStates[fromState].position.y + 200;

        const newPosition = positionStateInFreeSpot(newStates, newX, newY);

        newX = newPosition.x;
        newY = newPosition.y;
      }

      const result = {
        ...newStates,
        [id]: {
          position: {
            x: newX,
            y: newY,
          },
          key: id,
          keyId: id,
          isNew: !isInjectedTriggerState,
          isValid: !!isInjectedTriggerState,
          is_event_trigger: item.is_event_trigger,
          name: getStateName(item, id),
          desc: item.desc,
          injected: item.injected,
          injectedData: item.injectedData,
          type: item.name,
          'block-type':
            item.name === 'block'
              ? (item.stateType as 'while' | 'for' | 'foreach')
              : undefined,
          id,
          states: item.name === 'block' ? {} : undefined,
          condition: undefined,
          action:
            item.name === 'state'
              ? {
                  type: item.stateType,
                  value:
                    item.stateType === 'var-action'
                      ? { var_type: item.varType, var_name: item.varName }
                      : item.actionData,
                }
              : undefined,
          transitions: item.transitions,
        },
      };

      updateHistory(result, metadata, 'add new state');

      return result;
    });

    onSuccess?.(id);

    if (!isInjectedTriggerState) {
      setActiveState(id);
    }
    setEditingTransitionOrder(undefined);
  };

  useMoveByDragging(
    selectedStates,
    states,
    stateRefs.current,
    (data) => {
      const fixedStates = updateMultipleStatePositions(data);
      debouncedStateMoveHistoryUpdate(fixedStates);
    },
    () => {
      setIsMovingStates(true);
    },
    (deselect) => {
      setIsMovingStates(false);

      if (deselect) {
        setSelectedStates({});
      }
    },
    zoom
  );

  const getStateName = (item, id) => {
    // If the state is an FSM user has to select it as the name of the state
    if (item.displayName && item.stateType !== 'fsm') {
      return item.displayName;
    }

    if (item.injected) {
      return `Map ${item.injectedData.from} to ${item.injectedData.to}`;
    }

    if (parentStateName) {
      return `${parentStateName}.State ${id}`;
    }

    if (item.name === 'block' || item.name === 'if') {
      return `State ${id}`;
    }

    return item.name === 'state' ? `State ${id}` : null;
  };

  const getStateType = (state: IFSMState) => {
    if (state.type === 'block') {
      return 'block';
    }

    if (state.type === 'fsm') {
      return 'fsm';
    }

    if (state.type === 'if') {
      return 'if';
    }

    return state.action?.type;
  };

  const areStatesValid = (states: IFSMStates): boolean => {
    let valid = true;

    forEach(states, (state, id) => {
      if (state.isValid === false) {
        valid = false;
        // stop the loop
        return;
      }

      if (isStateIsolated(id, states)) {
        valid = false;

        return;
      }
    });

    return valid;
  };

  const hasEventTriggerState = useCallback(() => {
    return find(states, (state) => {
      return state.is_event_trigger;
    });
  }, [states]);

  const areMetadataValid = (): boolean => {
    if (
      metadata['input-type'] &&
      !validateField('type-selector', metadata['input-type'])
    ) {
      return false;
    }

    if (
      metadata['output-type'] &&
      !validateField('type-selector', metadata['output-type'])
    ) {
      return false;
    }

    return validateField('string', metadata.display_name);
  };

  const isFSMValid = () => {
    return (
      areMetadataValid() &&
      areStatesValid(states) &&
      isTypeCompatible('input') &&
      isTypeCompatible('output') &&
      size(states) > 1 &&
      areVariablesValid({
        transient: metadata.globalvar,
        persistent: metadata.localvar,
      }) &&
      hasEventTriggerState()
    );
  };

  const applyDraft = () => {
    if (!maybeApplyDraft) {
      setIsReady(true);
    }

    maybeApplyDraft?.(
      'fsm',
      undefined,
      fsm,
      ({ fsmData: { metadata, states }, id }: IDraftData) => {
        setInterfaceId(id);
        setMetadata(metadata);
        setStates(states);

        changeHistory.current[0] = {
          metadata: JSON.stringify(metadata || {}),
          states: JSON.stringify(states || {}),
          key: 'init from draft',
        };

        if (!params.id && size(states) === 0) {
          setIsAddingNewStateAt({ x: 0, y: 0 });
        }
      },
      undefined,
      () => {
        setIsReady(true);
      }
    );
  };

  const zoomIn = () => {
    setZoom(zoom + 0.1 > 1.5 ? 1.5 : zoom + 0.1);
  };

  const zoomOut = () => {
    setZoom(zoom - 0.1 < 0.5 ? 0.5 : zoom - 0.1);
  };

  useEffect(() => {
    if (!embedded) {
      if (searchParams.get('draftId') || draft) {
        applyDraft();
      } else {
        if (!params.id && size(states) === 0) {
          setIsAddingNewStateAt({ x: 0, y: 0 });
        }
      }
    }
  }, [searchParams.get('draftId'), draft, embedded]);

  // We need to hide the modal if the draft is applied
  // For example when switching from one draft to another or from
  // a new Qog to a draft, but only if interface id has changed
  useUpdateEffect(() => {
    if (size(states) !== 0) {
      setIsAddingNewStateAt(undefined);
    }
  }, [interfaceId]);

  useMount(() => {
    if (!embedded) {
      setFsmReset?.(() => reset);
      // Set interface id
      const id = fsm?.id || defaultInterfaceId || shortid.generate();
      setInterfaceId(id);
      setSettings(storageSettings[id] || {});

      // Apply the draft with "type" as first parameter and a custom function
      applyDraft();

      // Check if this FSM has ended in error the last time it ran
      if (init.fsmMetadata?.lastError) {
        addModal(
          {
            minimal: true,
            blur: 4,
            flat: true,
            maxSize: '700px',
            label: 'Qog Finished In Error',
            children: (
              <ReqoreMessage
                intent='danger'
                style={{ fontFamily: 'monospace' }}
                size='small'
                title='This Qog Finished In An Error The Last Time It Ran'
              >
                "{init.fsmMetadata.lastError}"
              </ReqoreMessage>
            ),
          },
          'qog-error'
        );
      }
    } else {
      setInterfaceId(defaultInterfaceId);
      setSettings(storageSettings[defaultInterfaceId] || {});
    }
  });

  useUnmount(() => {
    setIsAddingNewStateAt(undefined);
    removeModal('qog-error');
    changeInitialData?.('fsmMetadata', undefined);
  });

  useDebounce(
    async () => {
      if (!embedded) {
        const fsmStates = fsm?.states || {};
        const modifiedFsm = fsm || { display_name: 'Untitled Qog' };
        const draftId = getDraftId(fsm, interfaceId);
        const hasChanged = modifiedFsm
          ? some(metadata, (value, key) => {
              return !value && !modifiedFsm[key]
                ? false
                : !isEqual(
                    value,
                    key === 'groups' ? modifiedFsm[key] || [] : modifiedFsm[key]
                  );
            }) || !isEqual(states, fsmStates)
          : true;

        if (
          draftId &&
          (hasValue(metadata.desc) ||
            hasValue(metadata.name) ||
            hasValue(metadata.short_desc) ||
            hasValue(metadata.display_name) ||
            hasValue(metadata['input-type']) ||
            hasValue(metadata['output-type']) ||
            size(metadata.groups) ||
            size(states)) &&
          hasChanged
        ) {
          saveDraft(
            'fsm',
            draftId,
            {
              fsmData: {
                metadata,
                states: reduce(
                  states,
                  (acc, state, key) => ({
                    ...acc,
                    [key]: omit(state, 'isValid'),
                  }),
                  {}
                ),
              },
            },
            metadata.display_name
          );
        }
      }
    },
    1500,
    [JSON.stringify(metadata), JSON.stringify(states)]
  );

  useUpdateEffect(() => {
    if (isReady && !apps.loading) {
      if (embedded || fsm) {
        let newStates = embedded ? states : cloneDeep(states || {});

        if (size(newStates) === 0) {
          setCompatibilityChecked(true);
        } else {
          (async () => {
            for await (const [stateId] of Object.entries(states)) {
              newStates = await fixIncomptibleStates(stateId, newStates);
            }
          })();
        }

        // Check if the trigger state is missing (old Qogs known as FSMs did not need them)
        if (
          !embedded &&
          !find(newStates, (state) => {
            return state.is_event_trigger;
          }) &&
          !isEventTriggerChecked
        ) {
          let transitions: IFSMTransition[];
          const initialStateId = findKey(newStates, (state: IFSMState) => {
            if (size(newStates) === 1) {
              return true;
            }

            return state.initial;
          });

          if (initialStateId) {
            transitions = [
              {
                state: initialStateId,
              },
            ];

            delete newStates[initialStateId].initial;
          }

          const id = `0_${shortid.generate()}`;

          newStates[id] = {
            position: {
              x: 50,
              y: 50,
            },
            key: id,
            keyId: id,
            isNew: false,
            isValid: true,
            is_event_trigger: true,
            name: 'On Demand',
            desc: 'Injected state for backwards compatibility',
            type: 'state',
            id,
            action: {
              type: 'appaction',
              value: {
                app: 'QorusTriggers',
                action: 'on-demand',
              } as TAppAndAction,
            },
            transitions,
          };

          const { alignedStates } = autoAlign(newStates);

          newStates = alignedStates;

          addNotification({
            type: 'info',
            content:
              'An on-demand trigger action has been added to this interface because it was missing',
            duration: 5000,
            size: 'small',
          });
        }

        if (!isEqual(newStates, states)) {
          updateHistory(newStates, metadata, 'first change');
          setStates((cur) => ({ ...cur, ...newStates }));
        }
      }

      setCompatibilityChecked(true);
      setIsEventTriggerChecked(true);

      const { width, height } = wrapperRef.current.getBoundingClientRect();

      currentXPan.current = 0;
      currentYPan.current = 0;

      setWrapperDimensions({ width, height });
    }
  }, [isReady, apps.loading, JSON.stringify(states)]);

  useEffect(() => {
    if (states && onStatesChange) {
      onStatesChange(states);
    }
  }, [states]);

  useEffect(() => {
    if (!selectedState) {
      // Remove fake transitions
      setStates((cur) => {
        const newStates = cloneDeep(cur);

        forEach(newStates, (state) => {
          state.transitions = filter(state.transitions, (transition) => {
            return !transition.fake;
          });
        });

        return newStates;
      });
    }
  }, [selectedState]);

  useDebounce(
    () => {
      if (metadata?.['input-type']) {
        areFinalStatesCompatibleWithInputType();
      }

      if (metadata?.['output-type']) {
        areFinalStatesCompatibleWithOutputType();
      }
    },
    100,
    [metadata?.['input-type'], metadata?.['output-type'], states]
  );

  const setWrapperPan = (x, y) => {
    currentXPan.current = x;
    currentYPan.current = y;
  };

  const getTransitionByState = (
    stateId: string | number,
    targetId: string | number
  ): IFSMTransition | null => {
    if (!states[stateId]) {
      return null;
    }

    const { transitions } = states[stateId];

    return transitions?.find(
      (transition) => transition.state === targetId && !transition.fake
    );
  };

  // This function gets all the states that do not have any transitions out of them
  const getEndStates = (): IFSMState[] => {
    return filter(states, (state: IFSMState) => {
      return !size(state.transitions);
    });
  };

  const getStartStates = (): IFSMState[] => {
    return filter(states, (state: IFSMState) => {
      return !!state.initial;
    });
  };

  const getStateDataForComparison = useCallback(
    (
      state: IFSMState,
      providerType: 'input' | 'output'
    ): ITypeComparatorData | null => {
      if (state.action) {
        if (!state.action.value) {
          return null;
        }

        const { type, value } = state.action;

        const obj = {
          interfaceName:
            type === 'connector'
              ? (value as TFSMClassConnectorAction).class
              : value,
          interfaceKind: type,
          connectorName:
            type === 'connector'
              ? (value as TFSMClassConnectorAction).connector
              : undefined,
          typeData: state[`${providerType}-type`] || state['input-output-type'],
        };

        if (!obj.typeData) {
          delete obj.typeData;
        }

        // If the state is a variable, we need to get the variable data
        if (type === 'var-action') {
          const { var_name, var_type, action_type } = state.action
            .value as TVariableActionValue;
          const variableData = getVariable(var_name, var_type, metadata);

          if (variableData?.value) {
            return {
              ...obj,
              interfaceKind: action_type,
              interfaceName: {
                ...(value as TVariableActionValue),
                ...variableData.value,
              },
            };
          }
        }

        return obj as ITypeComparatorData;
      }

      if (!state[`${providerType}-type`] && !state['input-output-type']) {
        return null;
      }

      return {
        typeData: state[`${providerType}-type`] || state['input-output-type'],
      };
    },
    [metadata]
  );

  const isTypeCompatible = (position: 'input' | 'output') => {
    if (position === 'input' && !inputCompatibility) {
      return true;
    }

    if (position === 'output' && !outputCompatibility) {
      return true;
    }

    const isCompatible = every(
      position === 'input' ? inputCompatibility : outputCompatibility,
      (result) => {
        return result === true;
      }
    );

    return isCompatible;
  };

  const areFinalStatesCompatibleWithOutputType = async () => {
    setCompatibilityChecked(false);
    setOutputCompatibility(undefined);

    const endStates = getEndStates();

    if (!endStates.length) {
      setOutputCompatibility(undefined);
      setCompatibilityChecked(true);
      return;
    }

    const outputType: IProviderType | undefined = cloneDeep(
      metadata['output-type']
    );

    if (!outputType) {
      setOutputCompatibility(undefined);
      setCompatibilityChecked(true);
      return;
    }

    outputType.options = await formatAndFixOptionsToKeyValuePairs(
      outputType.options
    );

    const compareHash = {};

    for await (const state of endStates) {
      const stateData = getStateDataForComparison(state, 'output');
      if (!stateData) {
        continue;
      }

      const output = await getStateProvider(stateData, 'output');
      if (!output) {
        continue;
      }

      output.options = await formatAndFixOptionsToKeyValuePairs(output.options);

      compareHash[state.id] = {
        type: output,
        base_type: outputType,
      };
    }

    const comparison = await fetchData(
      '/dataprovider/compareManyTypes',
      'PUT',
      {
        types: compareHash,
      }
    );

    setCompatibilityChecked(true);
    setOutputCompatibility(comparison.data);
  };

  const areFinalStatesCompatibleWithInputType = async () => {
    setCompatibilityChecked(false);
    setInputCompatibility(undefined);

    const startStates = getStartStates();

    if (!startStates.length) {
      setInputCompatibility(undefined);
      setCompatibilityChecked(true);
      return;
    }

    const inputType: IProviderType | undefined = cloneDeep(
      metadata['input-type']
    );

    if (!inputType) {
      setInputCompatibility(undefined);
      setCompatibilityChecked(true);
      return;
    }

    // Format and fix the options
    inputType.options = await formatAndFixOptionsToKeyValuePairs(
      inputType.options
    );

    const compareHash = {};

    for await (const state of startStates) {
      const stateData = getStateDataForComparison(state, 'input');

      if (!stateData) {
        continue;
      }

      const input: IProviderType = await getStateProvider(stateData, 'input');

      if (!input) {
        continue;
      }

      input.options = await formatAndFixOptionsToKeyValuePairs(input.options);

      compareHash[state.id] = {
        type: inputType,
        base_type: input,
      };
    }

    const comparison = await fetchData(
      '/dataprovider/compareManyTypes',
      'PUT',
      {
        types: compareHash,
      }
    );

    setCompatibilityChecked(true);
    setInputCompatibility(comparison.data);
  };

  const areStatesCompatible = useCallback(
    async (
      stateId: string | number,
      targetId: string | number,
      localStates: IFSMStates = states
    ): Promise<boolean> => {
      const outputState = localStates[stateId];
      const inputState = localStates[targetId];

      const compatible = await areTypesCompatible(
        getStateDataForComparison(outputState, 'output'),
        getStateDataForComparison(inputState, 'input')
      );

      return compatible;
    },
    [states, getStateDataForComparison]
  );

  const createFakeTransitionsForState = useCallback(
    async (stateId) => {
      const newStates: IFSMStates = cloneDeep(states);
      // For every state, check if it is available for transition
      for await (const [id, state] of Object.entries(newStates)) {
        if (id === stateId) {
          continue;
        }

        const isAvailable = await isAvailableForTransition(stateId, id);

        if (!isAvailable) {
          continue;
        }

        newStates[stateId].transitions = [
          ...(newStates[stateId].transitions || []),
          {
            state: id.toString(),
            fake: true,
          },
        ];
      }

      setStates((cur) => ({ ...cur, ...newStates }));
    },
    [states]
  );

  const isAvailableForTransition = useCallback(
    async (stateId: string, targetId: string): Promise<boolean> => {
      // If the target state is an App, we only allow one connection
      if (states[targetId].action?.type === 'appaction') {
        return size(getStatesConnectedtoState(targetId, states)) === 0;
      }

      if (getTransitionByState(stateId, targetId)) {
        return Promise.resolve(false);
      }

      const areCompatible = await areStatesCompatible(stateId, targetId);

      return areCompatible;
    },
    [areStatesCompatible]
  );

  const handleStateClick = useCallback(
    async (id: string) => {
      if (selectedState) {
        // Do nothing if the selected transition already
        // exists
        if (getTransitionByState(selectedState, id)) {
          return;
        }

        const selectedStateType = states[selectedState].type;
        const targetStateType = states[id].type;

        // Also do nothing is the user is trying to transition FSM to itself or IF to itself
        if (
          (targetStateType === 'fsm' || targetStateType === 'if') &&
          selectedState === id
        ) {
          return;
        }

        // Check if the states are compatible
        const isCompatible = await areStatesCompatible(selectedState, id);

        if (!isCompatible) {
          setSelectedState(null);

          const outputType = await getStateProvider(
            getStateDataForComparison(states[id], 'input'),
            'input'
          );
          const inputType = await getStateProvider(
            getStateDataForComparison(states[selectedState], 'output'),
            'output'
          );
          setMapper({
            hasInitialInput: true,
            hasInitialOutput: true,
            mapper_options: {
              'mapper-input': inputType,
              'mapper-output': outputType,
            },
          });

          addNewState(
            {
              name: 'state',
              type: 'toolbar-item',
              stateType: 'mapper',
              injected: true,
              injectedData: {
                from: states[selectedState].name,
                to: states[id].name,
                name: metadata.name,
              },
            },
            (states[selectedState].position.x + states[id].position.x) / 2,
            (states[selectedState].position.y + states[id].position.y) / 2,
            // Add both transition immediately when the state is added
            // to the diagram
            (stateId: string) => {
              setStates((cur) => {
                const newBoxes = { ...cur };

                newBoxes[selectedState].transitions = [
                  ...(newBoxes[selectedState].transitions || []),
                  {
                    state: stateId.toString(),
                    language: 'qore',
                  },
                ];

                newBoxes[stateId].transitions = [
                  ...(newBoxes[stateId].transitions || []),
                  {
                    state: id.toString(),
                    language: 'qore',
                  },
                ];

                updateHistory(newBoxes, metadata, 'handleStateClick');

                return newBoxes;
              });
            }
          );

          return;
        }

        setStates((cur) => {
          const newBoxes = { ...cur };

          newBoxes[selectedState].transitions = [
            ...(newBoxes[selectedState].transitions || []),
            {
              state: id.toString(),
              branch: selectedStateType === 'if' ? 'true' : undefined,
              language: 'qore',
            },
          ];

          updateHistory(
            newBoxes,
            metadata,
            'handleStateClick unselected state'
          );

          return newBoxes;
        });

        setSelectedState(null);
      } else {
        createFakeTransitionsForState(id);
        setSelectedState(id);
      }
    },
    [
      selectedState,
      states,
      metadata,
      getStateDataForComparison,
      areStatesCompatible,
    ]
  );

  const handleSelectState = useCallback(
    (id: string, fromMouseDown?: boolean) => {
      setSelectedStates((cur) => {
        const result = { ...cur };

        if (selectedStates[id]) {
          delete result[id];
        } else {
          result[id] = { fromMouseDown };
        }

        return result;
      });
    },
    [selectedStates]
  );

  const handleNewStateClick = useCallback(
    (id: string, branch: IFSMTransition['branch']) => {
      const onConfirm = () => {
        setIsAddingNewStateAt({ x: 0, y: 0, fromState: id, branch });
      };

      if (hasUnsavedState) {
        confirmAction({
          title: 'Unsaved changes',
          intent: 'warning',
          description:
            'You have unsaved changes. Are you sure you want to close the active action detail?',
          onConfirm,
        });
      } else {
        onConfirm();
      }
    },
    [hasUnsavedState]
  );

  const handlePassStateRef = useCallback(
    (id, ref) => {
      if (ref) {
        stateRefs.current[id] = ref;
      }
    },
    [stateRefs]
  );

  const updateHistory = (
    data: IFSMStates,
    metadata: Partial<IFSMMetadata>,
    key: string
  ) => {
    if (currentHistoryPosition.current >= 0) {
      changeHistory.current.length = currentHistoryPosition.current + 1;
    }
    changeHistory.current.push({
      states: JSON.stringify(data),
      metadata: JSON.stringify(metadata),
      key,
    });

    if (changeHistory.current.length > 10) {
      changeHistory.current.shift();
    } else {
      currentHistoryPosition.current += 1;
    }
  };

  const fixIncomptibleStates = useCallback(
    async (
      id: string | number,
      localStates: IFSMStates,
      onFinish?: () => any
    ) => {
      const newStates = { ...localStates };

      for await (const [stateId, state] of Object.entries(newStates)) {
        if (
          !state.transitions ||
          size(state.transitions) === 0 ||
          !state.transitions.find((transitions) => transitions.state === id)
        ) {
          Promise.resolve();
        } else {
          // Check if this state is compatible with the modified state
          const isCompatible = await areStatesCompatible(
            stateId,
            id,
            newStates
          );
          // Is compatible no change needed
          if (!isCompatible) {
            showTransitionsToaster.current += 1;
            // Filter out any transitions
            newStates[stateId].transitions = state.transitions.filter(
              (transition) => transition.state !== id
            );
          }
        }

        // Set states without action
        if (!isFSMStateValid(state)) {
          newStates[stateId].error = true;
        }
      }

      if (onFinish) {
        onFinish();
      }

      return newStates;
    },
    []
  );

  const preUpdateStateData = useCallback(
    async (
      id: string | number,
      data: Partial<IFSMState>,
      isValid?: boolean
    ) => {
      let fixedStates: IFSMStates = { ...states };

      fixedStates[id] = {
        ...fixedStates[id],
        ...data,
        isValid:
          isValid === false || isValid === true
            ? isValid
            : fixedStates[id].isValid,
      };

      // Delete `isNew` from the fixed state
      delete fixedStates[id].isNew;

      if (
        data.type !== states[id].type ||
        !isEqual(data.action, states[id].action)
      ) {
        if (size(fixedStates[id].transitions)) {
          const newTransitions = [];

          for await (const transition of fixedStates[id].transitions) {
            const isCompatible = await areStatesCompatible(
              id,
              transition.state,
              fixedStates
            );

            if (isCompatible) {
              newTransitions.push(transition);
            } else {
              showTransitionsToaster.current += 1;
            }
          }

          fixedStates[id].transitions = newTransitions;
        }

        // Check if transitions are null and remove them
        if (size(fixedStates[id].transitions) === 0) {
          delete fixedStates[id].transitions;
        }

        fixedStates = await fixIncomptibleStates(id, fixedStates);
      }

      return fixedStates;
    },
    [states, areStatesCompatible, fixIncomptibleStates, metadata]
  );

  const updateStateData = useCallback(
    async (
      id: string | number,
      data: Partial<IFSMState>,
      isValid?: boolean
    ) => {
      const fixedStates = await preUpdateStateData(id, data, isValid);

      if (!isEqual(fixedStates, states)) {
        updateHistory(fixedStates, metadata, 'updateStateData');
      }

      setStates((cur) => ({ ...cur, ...fixedStates }));
    },
    [states, areStatesCompatible, fixIncomptibleStates]
  );

  const debouncedStateMoveHistoryUpdate = debounce((data: IFSMStates) => {
    updateHistory(data, metadata, 'move states');
  }, 200);

  const updateMultipleStatePositions = useCallback(
    (data: Record<string, Partial<IFSMState>>) => {
      const fixedStates: IFSMStates = { ...states };

      forEach(data, (item, id) => {
        fixedStates[id] = {
          ...fixedStates[id],
          ...item,
        };
      });

      setStates((cur) => ({ ...cur, ...fixedStates }));

      return fixedStates;
    },
    [preUpdateStateData]
  );

  const updateMultipleTransitionData = async (
    newData: IModifiedTransitions
  ) => {
    let fixedStates: IFSMStates = { ...states };

    for await (const [id, transitionData] of Object.entries(newData)) {
      const [stateId, index] = id.split(':');
      const anotherTransitionData = transitionData?.data;
      const remove = !transitionData;

      let transitionsCopy = [...(states[stateId].transitions || [])];

      if (remove) {
        delete transitionsCopy[index];
      } else {
        transitionsCopy[index] = {
          ...transitionsCopy[index],
          ...anotherTransitionData,
        };
      }

      transitionsCopy = transitionsCopy.filter((t) => t);

      // @ts-expect-error
      const data: IFSMState = { transitions: transitionsCopy };

      fixedStates[stateId] = {
        ...fixedStates[stateId],
        ...data,
      };

      // Remove the transitions if they are empty
      if (size(fixedStates[stateId].transitions) === 0) {
        delete fixedStates[stateId].transitions;
      }

      if (
        data?.type !== states[stateId].type ||
        !isEqual(data.action, states[stateId].action)
      ) {
        if (size(fixedStates[stateId].transitions)) {
          const newTransitions = [];

          for await (const transition of fixedStates[stateId].transitions) {
            const isCompatible = await areStatesCompatible(
              stateId,
              transition.state,
              fixedStates
            );

            if (isCompatible) {
              newTransitions.push(transition);
            } else {
              showTransitionsToaster.current += 1;
            }
          }

          fixedStates[stateId].transitions = newTransitions;
        }

        fixedStates = await fixIncomptibleStates(stateId, fixedStates);
      }
    }

    updateHistory(fixedStates, metadata, 'updateMultipleTransitionData');
    setStates((cur) => ({ ...cur, ...fixedStates }));
  };

  const handleSubmitClick = async (testRun?: boolean, publish?: boolean) => {
    const submit = async () => {
      const data = prepareFSMDataForPublishing(metadata, states);

      if (testRun) {
        delete data['input-type'];
        delete data['output-type'];

        setTestRun(data);

        return;
      }

      const result = await callBackend(
        fsm ? Messages.EDIT_INTERFACE : Messages.CREATE_INTERFACE,
        undefined,
        {
          iface_kind: 'fsm',
          id: interfaceId,
          orig_data: fsm,
          no_data_return: !!onSubmitSuccess,
          data: {
            ...fsm,
            ...data,
          },
        },
        t('Saving FSM...'),
        true
      );

      update({
        ...storageSettings,
        [fsm ? interfaceId : result.id]: settings,
      });

      if (result.ok) {
        setInterfaceId(result.id);

        if (onSubmitSuccess) {
          onSubmitSuccess({
            ...metadata,
            states,
          });
        }
      }
    };

    // Check if there are any unsaved states
    if (hasUnsavedState) {
      confirmAction({
        title: 'Unsaved changes',
        intent: 'warning',
        description:
          'You have unsaved changes. Are you sure you want to save your Qog?',
        onConfirm: submit,
      });
    } else {
      submit();
    }
  };

  const hasBothWayTransition = useCallback(
    (
      stateId: string,
      targetId: string
    ): { stateId: string; index: number } | null => {
      const transitionIndex = states[targetId].transitions?.findIndex(
        (transition) => transition.state === stateId
      );

      if (transitionIndex && transitionIndex >= 0) {
        return { stateId: targetId, index: transitionIndex };
      }

      return null;
    },
    [states]
  );

  const handleDiagramDblClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.persist();

      setIsAddingNewStateAt({
        x: event.clientX,
        y: event.clientY,
      });
    },
    [states, zoom]
  );

  const isTransitionToSelf = useCallback(
    (stateId: string, targetId: string): boolean => {
      return stateId === targetId;
    },
    []
  );

  const hasTransitionToItself = useCallback(
    (stateId: string): boolean => {
      return !!states[stateId].transitions?.find((transition) =>
        isTransitionToSelf(stateId, transition.state)
      );
    },
    [states]
  );

  const handleExecutionOrderClick = useCallback(() => {
    setEditingInitialOrder(true);
  }, []);

  const handleTransitionOrderClick = useCallback((id) => {
    setEditingTransitionOrder(id);
  }, []);

  const handleMultipleStateDeleteClick = useCallback(
    (selectedStates: TFSMSelectedStates): void => {
      confirmAction({
        title: 'Delete states',
        description: `Are you sure you want to delete the selected states`,
        intent: 'danger',
        onConfirm: () => {
          setStates((current) => {
            const newStates = removeMultipleFSMStates(
              current,
              Object.keys(selectedStates),
              interfaceId,
              (newStates) => {
                // If this state was deleted because of unfilled data, do not
                // save history
                updateHistory(
                  newStates,
                  metadata,
                  'handleMultipleStateDeleteClick'
                );
              }
            );

            return newStates;
          });
          setHoveredState(null);
          setSelectedStates({});
        },
      });
    },
    []
  );

  const handleStateDeleteClick = useCallback(
    (id: string | number, unfilled?: boolean): void => {
      confirmAction({
        title: 'Delete action',
        description: `Are you sure you want to delete state ${name}?`,
        intent: 'danger',
        onConfirm: () => {
          setStates((current) => {
            const newStates = removeFSMState(
              current,
              id,
              interfaceId,
              (newStates) => {
                // If this state was deleted because of unfilled data, do not
                // save history
                if (!unfilled) {
                  updateHistory(newStates, metadata, 'handleStateDeleteClick');
                }
              }
            );

            return newStates;
          });
          setHoveredState(null);
        },
      });
    },
    []
  );

  const handleStateCloneClick = useCallback(
    (id: string | number): void => {
      const state = cloneDeep(states[id]);
      const newId = shortid.generate();

      state.id = newId;
      state.key = newId;
      state.keyId = newId;

      const { x, y } = positionStateInFreeSpot(
        states,
        state.position.x + STATE_WIDTH + 50,
        state.position.y
      );

      state.position.x = x;
      state.position.y = y;

      state.transitions = [];

      setStates((cur) => ({ ...cur, [newId]: state }));
      setHoveredState(null);
      setActiveState(newId);
    },
    [states]
  );

  const getTargetStateLocation = ({
    x1,
    y1,
    x2,
    y2,
    startStateId,
    endStateId,
  }): 'left' | 'right' | 'bottom' | 'top' => {
    const modifiedX1 = x1 + 10000;
    const modifiedX2 = x2 + 10000;
    const modifiedY1 = y1 + 10000;
    const modifiedY2 = y2 + 10000;

    const startStateData = getStateBoundingRect(startStateId);
    const endStateData = getStateBoundingRect(endStateId);

    if (endStateData.width === 0) {
      endStateData.width = STATE_WIDTH;
      endStateData.height = 120;
    }

    const endOfStartState = x1 + startStateData.width;
    const endOfEndState = x2 + endStateData.width;

    if (!startStateData || !endStateData) {
      return 'left';
    }

    const sides = [];
    const horizontal = modifiedX1 - modifiedX2;
    const vertical = modifiedY1 - modifiedY2;

    if (
      (x1 > x2 && x1 < endOfEndState) ||
      (endOfStartState > x2 && endOfStartState < endOfEndState)
    ) {
      if (y1 > y2) {
        sides.push({ side: 'top', value: Math.abs(vertical) });
      } else {
        sides.push({ side: 'bottom', value: Math.abs(vertical) });
      }
    } else {
      if (x1 > x2) {
        sides.push({ side: 'left', value: Math.abs(horizontal) });
      } else {
        sides.push({ side: 'right', value: Math.abs(horizontal) });
      }

      if (y1 > y2) {
        sides.push({ side: 'top', value: Math.abs(vertical) });
      } else {
        sides.push({ side: 'bottom', value: Math.abs(vertical) });
      }
    }

    const { side } = maxBy(sides, 'value');

    return side;
  };

  const getTransitionPath = (
    { x1, y1, x2, y2, startStateId, endStateId, side },
    startIndex,
    endIndex,
    startStateCountPerSide,
    endStateCountPerSide
  ): string => {
    const startStateData = getStateBoundingRect(startStateId);
    const endStateData = getStateBoundingRect(endStateId);

    if (endStateData.width === 0) {
      endStateData.width = STATE_WIDTH;
      endStateData.height = 120;
    }

    const linesGap = (startStateData.height * 0.9) / startStateCountPerSide;
    const endLinesGap = (endStateData.height * 0.9) / endStateCountPerSide;

    let path = '';
    const startStateCenter = {
      x: x1 + startStateData.width / 2,
      y: y1 + startStateData.height / 2,
    };
    const endStateCenter = {
      x: x2 + endStateData.width / 2,
      y: y2 + endStateData.height / 2,
    };
    const startEndVerticalDifference = Math.abs(y1 - y2);

    // If we are going to the bottom
    if (side === 'bottom') {
      path = `M ${startStateCenter.x - linesGap * startIndex} ${
        startStateCenter.y + startStateData.height / 2
      } V ${
        startStateCenter.y + startEndVerticalDifference / 2 + 10 * startIndex
      }
      H ${endStateCenter.x - endLinesGap * endIndex}
      V ${endStateCenter.y - endStateData.height / 2}`;
    }

    if (side === 'top') {
      path = `M ${startStateCenter.x - linesGap * startIndex} ${
        startStateCenter.y - startStateData.height / 2
      } V ${
        startStateCenter.y - startEndVerticalDifference / 2 - 10 * startIndex
      } H ${endStateCenter.x - endLinesGap * endIndex} V ${
        endStateCenter.y + endStateData.height / 2
      }`;
    }

    if (side === 'left') {
      const horizontalDiff = x1 - (x2 + endStateData.width);

      path = `M ${startStateCenter.x - startStateData.width / 2} ${
        startStateCenter.y - linesGap * startIndex
      } H ${x2 + endStateData.width + horizontalDiff / 2 - 10 * startIndex} V ${
        endStateCenter.y - endLinesGap * endIndex
      } H ${endStateCenter.x + endStateData.width / 2}`;
    }

    if (side === 'right') {
      const endOfStartState = x1 + startStateData.width;
      const horizontalDiff = x2 - endOfStartState;

      path = `M ${endOfStartState} ${
        startStateCenter.y - linesGap * startIndex
      } H ${endOfStartState + horizontalDiff / 2 + 10 * startIndex} V ${
        endStateCenter.y - endLinesGap * endIndex
      } H ${x2}`;
    }

    return path;
  };

  // Turn 1 2 3 4 5 into -1 -2 0 1 2
  const getTransitionIndex = (index: number, length: number): number => {
    // Create the array of length and fill it with numbers from 1 to length
    const indexes = Array.from(Array(length).keys()).map((i) => i + 1);
    const list = indexes.map((i) => i - 1 - (length - 1) / 2);

    return list[index - 1];
  };

  const mirrorSide = (side) => {
    switch (side) {
      case 'top':
        return 'bottom';
      case 'bottom':
        return 'top';
      case 'left':
        return 'right';
      case 'right':
        return 'left';
      default:
        return side;
    }
  };

  const getTransitions = () => {
    transitionIndexes.current = {};
    statesTransitionIndexes.current = {};
    targetStatesTransitionIndexes.current = {};

    return reduce(
      states,
      (newTransitions: any[], state: IFSMState, id: string) => {
        if (!state.transitions) {
          return newTransitions;
        }

        const stateTransitions = state.transitions.map(
          (transition: IFSMTransition, index: number) => {
            const transitionData: any = {
              isError: !!transition.errors,
              transitionIndex: index,
              state: id,
              targetState: transition.state,
              startStateId: id,
              endStateId: transition.state,
              x1: state.position.x,
              y1: state.position.y,
              x2: states[transition.state].position.x,
              y2: states[transition.state].position.y,
              order: !!transition.errors ? 0 : 1,
              branch: transition.branch,
              fake: transition.fake,
            };

            // Get the transition line path and the locaiton of the target state
            const side = getTargetStateLocation(transitionData);

            if (!targetStatesTransitionIndexes.current[transition.state]) {
              targetStatesTransitionIndexes.current[transition.state] = {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
              };
            }
            targetStatesTransitionIndexes.current[transition.state][
              mirrorSide(side)
            ] += 1;

            if (!statesTransitionIndexes.current[id]) {
              statesTransitionIndexes.current[id] = {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
              };
            }

            statesTransitionIndexes.current[id][side] += 1;

            if (!transitionIndexes.current[id]) {
              transitionIndexes.current[id] = {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
              };
            }
            transitionIndexes.current[id][side] += 1;

            if (!transitionIndexes.current[transition.state]) {
              transitionIndexes.current[transition.state] = {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
              };
            }

            transitionIndexes.current[transition.state][mirrorSide(side)] += 1;

            transitionData.transitionIndexPerStateSide =
              statesTransitionIndexes.current[id][side];
            transitionData.transitionIndexPerTargetStateSide =
              targetStatesTransitionIndexes.current[transition.state][
                mirrorSide(side)
              ];
            transitionData.transitionIndexPerSide =
              transitionIndexes.current[id][side];
            transitionData.transitionEndIndexPerSide =
              transitionIndexes.current[transition.state][mirrorSide(side)];

            return {
              ...transitionData,
              side,
              endSide: mirrorSide(side),
            };
          }
        );

        return [...newTransitions, ...stateTransitions];
      },
      []
    ).sort((a, b) => a.order - b.order);
  };

  const reset = () => {
    setStates(cloneDeep(fsm?.states || {}));
    setSelectedStates({});
    changeHistory.current = [JSON.stringify(cloneDeep(fsm?.states || {}))];
    currentHistoryPosition.current = 0;
    setMetadata({
      name: fsm?.name,
      desc: fsm?.desc,
      target_dir: fsm?.target_dir,
      groups: fsm?.groups || [],
      'input-type': fsm?.['input-type'],
      'output-type': fsm?.['output-type'],
    });
  };

  const getTransitionColor = (isError, branch, fake?: boolean) => {
    if (fake) {
      return '#2bb8fe';
    }

    if (isError || branch === 'false') {
      return '#d38d8d';
    }

    if (branch === 'true') {
      return '#92d091';
    }

    return '#d7d7d7';
  };

  const getTransitionEndMarker = (isError, branch, fake?: boolean) => {
    if (fake) {
      return 'fake';
    }

    if (isError) {
      return 'error';
    }

    if (branch) {
      return branch;
    }

    return '';
  };

  const handleActivateStateClick = useCallback(
    (id) => {
      if (hasUnsavedState) {
        confirmAction({
          title: 'Unsaved changes',
          intent: 'warning',
          description:
            'You have unsaved changes. Are you sure you want to close the active action detail?',
          onConfirm: () => setActiveState(id),
        });
      } else {
        setActiveState(id);
      }
    },
    [hasUnsavedState, searchParams]
  );

  const getStatesFromSelectedStates = (): IFSMStates => {
    return reduce(
      selectedStates,
      (newStates, _selected, id) => {
        return {
          ...newStates,
          [id]: states[id],
        };
      },
      {}
    );
  };

  function calculateTextRotation(side: any) {
    switch (side) {
      case 'top':
        return 90;
      case 'bottom':
        return 270;
      case 'left':
        return 180;
      case 'right':
        return 0;
      default:
        return 0;
    }
  }

  function calculateTextTranslation(side: any) {
    switch (side) {
      case 'top':
        return 5;
      case 'bottom':
        return -15;
      case 'left':
        return 20;
      case 'right':
        return -5;
      default:
        return 0;
    }
  }

  const renderAppCatalogue = () => {
    if (addingNewStateAt) {
      const isFirstTriggerState =
        (size(states) === 0 || !hasEventTriggerState()) &&
        !embedded &&
        !addingNewStateAt.fromState;

      const variables = reduce(
        {
          ...(metadata.globalvar || {}),
          ...(metadata.localvar || {}),
          ...(metadata.autovar || {}),
        },
        (newVariables, variable, variableId) =>
          variable.type === 'data-provider'
            ? { ...newVariables, [variableId]: variable }
            : newVariables,
        {}
      );

      return (
        <ReqoreModal
          isOpen
          minimal
          customTheme={{ main: 'main:darken' }}
          contentEffect={{
            gradient: {
              colors: {
                0: 'main:lighten',
                100: 'main',
              },
              shape: 'circle',
              direction: 'to bottom',
            },
          }}
          blur={5}
          label={isFirstTriggerState ? undefined : 'Add new action'}
          onClose={() => setIsAddingNewStateAt(undefined)}
          width='90vw'
          height='90vh'
          className='fsm-app-selector'
          style={{
            userSelect: 'none',
          }}
        >
          {isFirstTriggerState && (
            <>
              <ReqoreVerticalSpacer height={25} />
              <ReqoreControlGroup
                horizontalAlign='center'
                fluid
                size='huge'
                vertical
              >
                <ReqoreH1 effect={{ textSize: '40px' }}>
                  What would you like to{' '}
                  <ReqoreTextEffect
                    effect={{
                      gradient: {
                        colors: {
                          0: '#0099ff',
                          50: '#d400ff',
                          100: '#6a00ff',
                        },
                        animationSpeed: 5,
                        animate: 'always',
                      },
                    }}
                  >
                    automate
                  </ReqoreTextEffect>
                </ReqoreH1>
                <ReqoreVerticalSpacer height={7} />
                <ReqoreP size='normal' effect={{ brightness: 75 }}>
                  React to changes in your favorite application or run an action
                  on schedule
                </ReqoreP>
              </ReqoreControlGroup>
              <ReqoreVerticalSpacer height={35} />
            </>
          )}
          <AppSelector
            type={isFirstTriggerState ? 'event' : 'action'}
            variables={variables}
            showVariables={setShowVariables}
            onActionSetSelect={(stateGroup: IFSMStates) => {
              let x = 0;
              let y = 0;
              let freeStateIds = [];

              if (addingNewStateAt.fromState) {
                ({ x, y } = positionStateInFreeSpot(
                  states,
                  states[addingNewStateAt.fromState].position.x,
                  states[addingNewStateAt.fromState].position.y + 200
                ));
                // If adding from a state, add the transition too
                // Get the state that no other states are connecting to
                forEach(stateGroup, (_state, stateId) => {
                  if (!size(getStatesConnectedtoState(stateId, stateGroup))) {
                    freeStateIds.push(stateId);
                  }
                });
              } else {
                ({ x, y } = calculateNewStatePositionOnDiagram(
                  addingNewStateAt.x,
                  addingNewStateAt.y
                ));
              }

              const fixedStates = repositionStateGroup(stateGroup, x, y);

              setStates((cur) => {
                const result = { ...cur, ...fixedStates };

                if (addingNewStateAt.fromState && size(freeStateIds)) {
                  result[addingNewStateAt.fromState].transitions = [
                    ...(result[addingNewStateAt.fromState].transitions || []),
                    ...freeStateIds.map((id) => ({
                      state: id,
                      language: 'qore',
                    })),
                  ];
                }

                return result;
              });

              setIsAddingNewStateAt(undefined);
            }}
            onActionSelect={(action, app) => {
              const { x, y } = calculateNewStatePositionOnDiagram(
                addingNewStateAt.x,
                addingNewStateAt.y
              );

              let stateName;

              switch (action.type) {
                case 'if':
                  stateName = 'if';
                  break;
                case 'fsm':
                  stateName = 'fsm';
                  break;
                case 'while':
                case 'for':
                case 'foreach':
                case 'transaction':
                  stateName = 'block';
                  break;
                default:
                  stateName = 'state';
                  break;
              }

              addNewState(
                {
                  name: stateName,
                  displayName: `${action.display_name}`,
                  desc: action.short_desc,
                  type: 'state',
                  stateType: action.type,
                  is_event_trigger: isFirstTriggerState,
                  actionData:
                    action.type === 'appaction'
                      ? {
                          app: app.name,
                          action: action.action,
                        }
                      : undefined,
                  varName: action.varName,
                  varType: action.varType,
                },
                isFirstTriggerState ? 50 : x,
                isFirstTriggerState ? 50 : y,
                undefined,
                undefined,
                addingNewStateAt.fromState,
                addingNewStateAt.branch
              );

              setIsAddingNewStateAt(undefined);
            }}
            fetchData={fetchData}
          />
        </ReqoreModal>
      );
    }

    return null;
  };

  const renderStateDetail = () => {
    const state = activeState || editingTransitionOrder;

    if (!state || !states[state]) {
      return null;
    }

    const stateData = states[state];

    return (
      <FSMStateDetail
        key={state}
        id={state}
        onClose={() => {
          setActiveState(undefined);
          setSelectedState(undefined);
          setEditingTransitionOrder(undefined);
        }}
        interfaceId={interfaceId}
        data={stateData}
        onSubmit={(data, createNew?: boolean, isValid?: boolean) => {
          updateStateData(state, data, isValid);

          if (createNew) {
            setIsAddingNewStateAt({ x: 0, y: 0, fromState: state });
          }
        }}
        onSavedStatusChanged={(saved?: boolean) => {
          setHasUnsavedState(!saved);
        }}
        onDelete={(unfilled?: boolean) =>
          handleStateDeleteClick(state, unfilled)
        }
        onFavorite={(state: IFSMState) => {
          if (apps.isSingleActionWithNameSaved(state.name)) {
            const { id } = apps.getSingleActionWithNameSaved(state.name);

            apps.removeActionSet(id);
          } else {
            apps.addNewActionSet({
              id: state.id,
              states: { [state.id]: state },
            });
          }
        }}
        onCloneClick={() => handleStateCloneClick(state)}
        getIsAlreadySaved={apps.isSingleActionWithNameSaved}
        states={states}
        activeTab={editingTransitionOrder ? 'transitions' : 'configuration'}
        inputProvider={getStateDataForComparison(states[state], 'input')}
        outputProvider={getStateDataForComparison(states[state], 'output')}
        metadata={metadata}
        resizable={{
          defaultSize: {
            width: `${paneWidth}px`,
            height: '100%',
          },
          onResizeStop: (_e, _dir, _ref, delta) => {
            setPaneWidth(paneWidth + delta.width);
          },
        }}
      />
    );
  };

  if (!isReady || apps.loading) {
    return <Loader centered text={t('Loading...')} />;
  }

  if (showTransitionsToaster.current) {
    addNotification({
      content: `${showTransitionsToaster.current} ${t(
        'IncompatibleTransitionsRemoved'
      )}`,
      intent: 'warning',
    });
    showTransitionsToaster.current = 0;
  }

  const renderVariables = (autoSave?: boolean) => {
    return (
      <FSMVariables
        autoSave={autoSave}
        onClose={autoSave ? undefined : () => setShowVariables(undefined)}
        onSubmit={({ globalvar, localvar, changes }) => {
          setMetadata({
            ...metadata,
            globalvar,
            localvar,
          });
          // For each change, remove the state using this variable
          changes.forEach(({ name, type }) => {
            setStates(
              removeAllStatesWithVariable(name, type, states, interfaceId)
            );
          });
        }}
        globalvar={metadata?.globalvar}
        localvar={metadata?.localvar}
        autovar={metadata?.autovar}
        selectedVariable={showVariables?.selected}
      />
    );
  };

  const renderFSM = () => (
    <AppsContext.Provider value={apps}>
      {!compatibilityChecked && (
        <StyledCompatibilityLoader>
          <Loader text={t('CheckingCompatibility')} />
        </StyledCompatibilityLoader>
      )}
      {isAddingActionSet && (
        <ActionSetDialog
          onClose={() => {
            setIsAddingActionSet(false);
            setSelectedStates({});
          }}
          states={getStatesFromSelectedStates()}
        />
      )}
      {testRun && (
        <QodexTestRunModal
          isOpen
          id={interfaceId}
          onClose={() => setTestRun(undefined)}
          data={{
            type: 'fsm',
            ...testRun,
          }}
          {...{
            minimal: true,
            icon: 'PlayLine',
            blur: 3,
            label: `Test run of ${metadata.name}`,
          }}
        />
      )}
      {showVariables?.show && renderVariables()}

      {renderAppCatalogue()}

      <Content
        label={
          embedded
            ? `${parentStateName} inline implementation`
            : metadata.display_name
        }
        onLabelEdit={
          embedded
            ? undefined
            : (name) => setMetadata({ ...metadata, display_name: name })
        }
        contentStyle={{ display: 'flex' }}
        padded={!embedded}
        transparent={embedded}
        badge={
          embedded
            ? {
                onClick: () => {
                  onHideMetadataClick((cur) => !cur);
                  setSelectedStates({});
                },
                icon: 'ArrowLeftLine',
              }
            : undefined
        }
        responsiveActions={false}
        actions={[
          {
            group: [
              {
                icon: 'ArrowGoBackLine',
                className: 'qog-undo',
                tooltip: 'Undo',
                compact: true,
                disabled: currentHistoryPosition.current === 0,
                onClick: () => {
                  if (currentHistoryPosition.current > 0) {
                    currentHistoryPosition.current -= 1;
                    setStates(
                      JSON.parse(
                        changeHistory.current[currentHistoryPosition.current]
                          .states
                      )
                    );
                    setMetadata(
                      JSON.parse(
                        changeHistory.current[currentHistoryPosition.current]
                          .metadata
                      )
                    );
                  }
                },
              },
              {
                icon: 'ArrowGoForwardLine',
                className: 'qog-redo',
                tooltip: 'Redo',
                compact: true,
                disabled:
                  currentHistoryPosition.current ===
                    changeHistory.current.length - 1 ||
                  changeHistory.current.length === 1,
                onClick: () => {
                  if (
                    currentHistoryPosition.current <
                    changeHistory.current.length - 1
                  ) {
                    currentHistoryPosition.current += 1;

                    setStates(
                      JSON.parse(
                        changeHistory.current[currentHistoryPosition.current]
                          .states
                      )
                    );

                    setMetadata(
                      JSON.parse(
                        changeHistory.current[currentHistoryPosition.current]
                          .metadata
                      )
                    );
                  }
                },
              },
            ],
          },
          {
            as: ReqoreHorizontalSpacer,
            props: {
              width: 5,
              lineSize: 'tiny',
            },
          },
          {
            tooltip: 'Save selected states as action set',
            compact: true,
            id: 'save-action-set',
            icon: 'Save3Fill',
            show:
              selectedStates &&
              size(selectedStates) > 1 &&
              areStatesAConnectedGroup(getStatesFromSelectedStates()),
            effect: {
              gradient: {
                colors: {
                  0: '#5865f2',
                  100: '#6e1977',
                },
                animate: 'always',
              },
            },
            onClick: () => {
              setIsAddingActionSet(true);
            },
          },
          {
            tooltip: 'Delete selected',
            compact: true,
            id: 'delete-multiple-states',
            icon: 'DeleteBin4Line',
            show: !!size(selectedStates),
            effect: NegativeColorEffect,
            onClick: () => {
              handleMultipleStateDeleteClick(selectedStates);
            },
          },
          {
            as: ReqoreHorizontalSpacer,
            props: {
              width: 5,
              lineSize: 'tiny',
            },
            show:
              (selectedStates &&
                size(selectedStates) > 1 &&
                areStatesAConnectedGroup(getStatesFromSelectedStates())) ||
              !!size(selectedStates),
          },
          {
            group: [
              {
                icon: 'AlignTop',
                className: 'align-top',
                tooltip: 'Align vertically to top',
                compact: true,
                onClick: () => {
                  const alignedStates = {
                    ...states,
                    ...alignStates(
                      'vertical',
                      'top',
                      getStatesFromSelectedStates(),
                      zoom
                    ),
                  };
                  setStates(alignedStates);
                  updateHistory(alignedStates, metadata, 'align-top');
                  setSelectedStates({});
                },
              },
              {
                icon: 'AlignVertically',
                className: 'align-center',
                tooltip: 'Align vertically to center',
                compact: true,
                onClick: () => {
                  const alignedStates = {
                    ...states,
                    ...alignStates(
                      'vertical',
                      'center',
                      getStatesFromSelectedStates(),
                      zoom
                    ),
                  };
                  setStates(alignedStates);
                  updateHistory(alignedStates, metadata, 'align-center');
                  setSelectedStates({});
                },
              },
              {
                icon: 'AlignBottom',
                className: 'align-bottom',
                tooltip: 'Align vertically to bottom',
                compact: true,
                onClick: () => {
                  const alignedStates = {
                    ...states,
                    ...alignStates(
                      'vertical',
                      'bottom',
                      getStatesFromSelectedStates(),
                      zoom
                    ),
                  };
                  setStates(alignedStates);
                  updateHistory(alignedStates, metadata, 'align-bottom');
                  setSelectedStates({});
                },
              },
            ],
            show: size(selectedStates) > 1,
          },
          {
            group: [
              {
                icon: 'AlignTop',
                leftIconProps: {
                  rotation: -90,
                },
                compact: true,
                className: 'align-left',
                tooltip: 'Align horizontally to left',
                onClick: () => {
                  const alignedStates = {
                    ...states,
                    ...alignStates(
                      'horizontal',
                      'top',
                      getStatesFromSelectedStates(),
                      zoom
                    ),
                  };
                  setStates(alignedStates);
                  updateHistory(alignedStates, metadata, 'align-left');
                  setSelectedStates({});
                },
              },
              {
                icon: 'AlignVertically',
                leftIconProps: {
                  rotation: -90,
                },
                compact: true,
                className: 'align-middle',
                tooltip: 'Align horizontally to center',
                onClick: () => {
                  const alignedStates = {
                    ...states,
                    ...alignStates(
                      'horizontal',
                      'center',
                      getStatesFromSelectedStates(),
                      zoom
                    ),
                  };
                  updateHistory(alignedStates, metadata, 'align-middle');
                  setStates(alignedStates);
                  setSelectedStates({});
                },
              },
              {
                icon: 'AlignTop',
                leftIconProps: {
                  rotation: 90,
                },
                compact: true,
                className: 'align-right',
                tooltip: 'Align horizontally to right',
                onClick: () => {
                  const alignedStates = {
                    ...states,
                    ...alignStates(
                      'horizontal',
                      'bottom',
                      getStatesFromSelectedStates(),
                      zoom
                    ),
                  };
                  updateHistory(alignedStates, metadata, 'align-right');
                  setStates(alignedStates);
                  setSelectedStates({});
                },
              },
            ],
            show: size(selectedStates) > 1,
          },
          {
            tooltip: 'Smart align',
            compact: true,
            id: 'auto-align-states',
            icon: 'Apps2Line',
            show: isMetadataHidden,
            flat: !checkOverlap(states),
            effect: checkOverlap(states)
              ? {
                  gradient: {
                    colors: {
                      0: '#5865f2',
                      100: '#6e1977',
                    },
                    animate: 'always',
                  },
                }
              : undefined,
            onClick: () => {
              const { alignedStates } = autoAlign(states);

              updateHistory(alignedStates, metadata, 'auto-align-states');
              setStates(alignedStates);
            },
          },
          {
            as: ReqoreHorizontalSpacer,
            props: {
              width: 5,
              lineSize: 'tiny',
            },
          },
          {
            show: isMetadataHidden,
            compact: true,
            icon: 'More2Line',
            className: 'fsm-more-actions',
            actions: [
              {
                icon: 'ZoomInLine',
                label: 'Zoom in',
                onClick: () => zoomIn(),
                tooltip: t('Zoom in'),
                className: `fsm-${
                  parentStateName ? `${parentStateName}-` : ''
                }zoom-in`,
              },
              {
                icon: 'HistoryLine',
                onClick: () => setZoom(1),
                tooltip: t('Reset zoom'),
                label: `${Math.round(zoom * 100)}% [Reset]`,
                intent: zoom > 0.9 && zoom < 1.09 ? undefined : 'info',
                className: `fsm-${
                  parentStateName ? `${parentStateName}-` : ''
                }zoom-reset`,
              },
              {
                icon: 'ZoomOutLine',
                label: 'Zoom out',
                onClick: () => zoomOut(),
                tooltip: t('Zoom out'),
                className: `fsm-${
                  parentStateName ? `${parentStateName}-` : ''
                }zoom-out`,
              },
              {
                divider: true,
                size: 'tiny',
              },
              {
                className: 'fsm-export-data',
                label: 'Export Raw Data',
                icon: 'DownloadLine',
                onClick: () => {
                  addModal(
                    <ReqoreExportModal
                      data={{
                        ...metadata,
                        states,
                      }}
                    />
                  );
                },
              },
              {
                icon: 'PriceTag2Line',
                label: 'Show state & path IDs',
                id: 'show-state-ids',
                active: showStateIds,
                onClick: () => setShowStateIds(!showStateIds),
                intent: showStateIds ? 'info' : undefined,
              },
            ],
          },
          {
            as: ReqoreHorizontalSpacer,
            props: {
              width: 5,
              lineSize: 'tiny',
            },
            show: !embedded,
          },
          {
            tooltip: 'Test run',
            label: 'Test',
            compact: true,
            onClick: () => handleSubmitClick(true),
            disabled: !isFSMValid(),
            className: 'fsm-test-run',
            icon: 'PlayLine',
            effect: PositiveColorEffect,
            show: !embedded,
          },
          {
            compact: true,
            label:
              !areMetadataValid() || !isFSMValid()
                ? 'Fix to publish'
                : t('Publish'),
            onClick: () => handleSubmitClick(false, true),
            readOnly: !areMetadataValid() || !isFSMValid(),
            icon:
              !areMetadataValid() || !isFSMValid()
                ? 'ErrorWarningLine'
                : 'UploadCloud2Line',
            effect:
              !areMetadataValid() || !isFSMValid()
                ? WarningColorEffect
                : SaveColorEffect,
            show: !embedded,
            className: 'qodex-publish',
            tooltip: isFSMValid()
              ? 'Publish your Qog'
              : {
                  intent: 'warning',
                  content: (
                    <>
                      {size(states) < 2 && (
                        <ReqoreP>
                          - At least 1 trigger and 1 normal states are required
                        </ReqoreP>
                      )}
                      {!areMetadataValid() && (
                        <ReqoreP>
                          - Metadata is not valid, please make sure the name of
                          your Qog is valid and that input & output types are
                          compatible
                        </ReqoreP>
                      )}
                      {!areStatesValid(states) && (
                        <ReqoreP>
                          - All states need to be valid (invalid states have red
                          border) and connected (isolated states have red
                          warning icon)
                        </ReqoreP>
                      )}
                      {!hasEventTriggerState() && (
                        <ReqoreP>
                          - You need to have at least 1 trigger state (state
                          with event trigger)
                        </ReqoreP>
                      )}
                      {!areVariablesValid({
                        transient: metadata.globalvar,
                        persistent: metadata.localvar,
                      }) && (
                        <ReqoreP>
                          - Variables implementation is invalid, please check
                          the "Variables" tab
                        </ReqoreP>
                      )}
                    </>
                  ),
                },
          },
        ]}
      >
        <ReqoreTabs
          unMountOnTabChange={false}
          flat={false}
          useReactTransition={
            process.env.NODE_ENV === 'development' ||
            process.env.NODE_ENV === 'production'
          }
          tabs={[
            { label: 'Flow', icon: interfaceIcons.fsm, id: 'flow' },
            {
              label: 'Settings',
              icon: 'SettingsLine',
              id: 'settings',
              intent: areMetadataValid() ? undefined : 'danger',
              show: !embedded,
              fixed: true,
            },
            {
              label: 'Variables',
              fixed: true,
              badge:
                size(metadata.autovar) +
                size(metadata.globalvar) +
                size(metadata.localvar),
              icon: 'MoneyDollarBoxLine',
              id: 'vars',
              intent: areVariablesValid({
                transient: metadata.globalvar,
                persistent: metadata.localvar,
              })
                ? undefined
                : 'danger',
            },
            {
              label: 'Log',
              fixed: true,
              icon: 'ListSettingsLine',
              id: 'log',
              disabled: !init.supports_enable,
              show: !embedded,
            },
          ]}
          fill
          tabsPadding='top'
        >
          <ReqoreTabsContent tabId='flow' style={{ flexFlow: 'row' }}>
            {!isMetadataHidden && !embedded ? (
              <ReqoreModal
                label='Qog settings'
                icon='SettingsLine'
                isOpen
                blur={3}
                onClose={() => setIsMetadataHidden(true)}
                bottomActions={[
                  {
                    label: 'Done',
                    icon: 'CheckLine',
                    onClick: () => setIsMetadataHidden(true),
                    position: 'right',
                  },
                ]}
              ></ReqoreModal>
            ) : null}
            {editingInitialOrder && (
              <FSMInitialOrderDialog
                onClose={() => setEditingInitialOrder(null)}
                onSubmit={(data) =>
                  setStates((cur) => {
                    const result = { ...cur };

                    forEach(data, (stateData, keyId) => {
                      result[keyId] = stateData;
                    });

                    updateHistory(result, metadata, 'initial-order');

                    return result;
                  })
                }
                allStates={states}
                states={reduce(
                  states,
                  (initialStates, state, stateId) => {
                    if (state.initial) {
                      return { ...initialStates, [stateId]: state };
                    }

                    return initialStates;
                  },
                  {}
                )}
                fsmName={metadata.name}
                interfaceId={interfaceId}
              />
            )}
            {size(editingTransition) ? (
              <FSMTransitionDialog
                onSubmit={async (newData) => {
                  await updateMultipleTransitionData(newData);
                }}
                onClose={() => setEditingTransition([])}
                states={states}
                editingData={editingTransition}
              />
            ) : null}

            <>
              <div style={{ display: 'flex', overflow: 'hidden' }}>
                <div
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    minHeight: 100,
                    userSelect: 'none',
                  }}
                >
                  <StyledDiagramWrapper
                    as='div'
                    theme={theme}
                    ref={wrapperRef}
                    id={`${
                      parentStateName ? `${parentStateName}-` : ''
                    }fsm-diagram`}
                  >
                    {wrapperRef.current && (
                      <DragSelectArea
                        element={wrapperRef.current}
                        onFinish={({ startX, startY, endX, endY }) => {
                          const left = calculateValueWithZoom(
                            Math.min(startX, endX) + currentXPan.current,
                            zoom
                          );
                          const top = calculateValueWithZoom(
                            Math.min(startY, endY) + currentYPan.current,
                            zoom
                          );
                          const right = calculateValueWithZoom(
                            Math.max(startX, endX) + currentXPan.current,
                            zoom
                          );
                          const bottom = calculateValueWithZoom(
                            Math.max(startY, endY) + currentYPan.current,
                            zoom
                          );

                          const selectedStates = reduce(
                            states,
                            (newStates, state, id) => {
                              const {
                                position: { x, y },
                              } = state;
                              const { width, height } =
                                getStateBoundingRect(id);

                              if (
                                x >= left &&
                                x + width <= right &&
                                y >= top &&
                                y + height <= bottom
                              ) {
                                return {
                                  ...newStates,
                                  [id]: { fromMouseDown: false },
                                };
                              }

                              return newStates;
                            },
                            {}
                          );

                          setSelectedStates((cur) => {
                            return { ...cur, ...selectedStates };
                          });
                        }}
                      />
                    )}
                    <FSMDiagramWrapper
                      wrapperDimensions={wrapperDimensions}
                      setPan={setWrapperPan}
                      setShowStateIds={setShowStateIds}
                      showStateIds={showStateIds}
                      zoom={zoom}
                      onDoubleClick={handleDiagramDblClick}
                      zoomIn={zoomIn}
                      zoomOut={zoomOut}
                      enableEdgeMovement={isMovingStates}
                      wrapperSize={{
                        width:
                          wrapperRef.current?.getBoundingClientRect()?.width ||
                          0,
                        height:
                          wrapperRef.current?.getBoundingClientRect()?.height ||
                          0,
                      }}
                      id={`${
                        parentStateName ? `${parentStateName}-` : ''
                      }fsm-diagram`}
                      items={map(states, (state, id) => ({
                        x: state.position.x,
                        y: state.position.y,
                        type: getStateType(state),
                        id,
                      }))}
                    >
                      <StyledDiagram
                        as='div'
                        id='fsm-states-wrapper'
                        key={JSON.stringify(wrapperDimensions)}
                        ref={(r) => {
                          drop(r);
                          diagramRef.current = r;
                        }}
                        path={image_path}
                        onMouseDown={() => {
                          timeSinceDiagramMouseDown.current = Date.now();
                        }}
                        onMouseUp={() => {
                          if (
                            Date.now() - timeSinceDiagramMouseDown.current <
                            200
                          ) {
                            if (size(selectedStates) > 0) {
                              setSelectedStates({});
                            }

                            setSelectedState(null);
                            timeSinceDiagramMouseDown.current = 0;
                          }
                        }}
                        bgColor={theme.main}
                        theme={theme}
                        style={{
                          zoom,
                        }}
                      >
                        {map(states, (state, id) => (
                          <FSMState
                            key={id}
                            {...state}
                            id={id}
                            selected={selectedState === id}
                            onDblClick={handleStateClick}
                            onClick={handleStateClick}
                            onSelect={handleSelectState}
                            onUpdate={updateStateData}
                            onDeleteClick={handleStateDeleteClick}
                            onCloneClick={handleStateCloneClick}
                            onMouseEnter={setHoveredState}
                            onMouseLeave={setHoveredState}
                            onNewStateClick={handleNewStateClick}
                            hasTransitionToItself={hasTransitionToItself(id)}
                            variableDescription={
                              getVariable(
                                state.action?.value?.var_name,
                                state.action?.value?.var_type,
                                metadata
                              )?.desc
                            }
                            showStateIds={showStateIds}
                            selectedState={selectedState}
                            isInSelectedList={!!selectedStates[id]}
                            isBeingDragged={
                              selectedStates[id] &&
                              selectedStates[id].fromMouseDown &&
                              size(selectedStates) === 1
                            }
                            isActive={activeState === id}
                            hoveredState={hoveredState}
                            isConnectedToHoveredState={
                              !!getStatesConnectedtoState(id, states)[
                                hoveredState
                              ]
                            }
                            isAvailableForTransition={isAvailableForTransition}
                            onTransitionOrderClick={handleTransitionOrderClick}
                            onExecutionOrderClick={handleExecutionOrderClick}
                            isIsolated={isStateIsolated(id, states)}
                            getStateDataForComparison={
                              getStateDataForComparison
                            }
                            activateState={handleActivateStateClick}
                            zoom={zoom}
                            passRef={handlePassStateRef}
                            isValid={
                              'isValid' in state
                                ? state.isValid
                                : isStateValid(state, metadata)
                            }
                          />
                        ))}
                        <svg
                          height='100%'
                          width='100%'
                          style={{
                            position: 'absolute',
                            boxShadow: 'inset 0 0 50px 2px #00000080',
                            zIndex: hoveredState ? 20 : undefined,
                            pointerEvents: hoveredState ? 'none' : undefined,
                          }}
                        >
                          <defs>
                            <marker
                              id='arrowhead'
                              markerUnits='userSpaceOnUse'
                              markerWidth='30'
                              markerHeight='30'
                              refX='20'
                              refY='10'
                              orient='auto'
                            >
                              <path
                                d='M2,2 L2,20 L20,10 L2,2'
                                fill={getTransitionColor(null, null)}
                              />
                            </marker>
                            <marker
                              id='arrowheaderror'
                              markerUnits='userSpaceOnUse'
                              markerWidth='30'
                              markerHeight='30'
                              refX='20'
                              refY='10'
                              orient='auto'
                            >
                              <path
                                d='M2,2 L2,20 L20,10 L2,2'
                                fill={getTransitionColor(null, 'false')}
                              />
                            </marker>
                            <marker
                              id='arrowheadtrue'
                              markerUnits='userSpaceOnUse'
                              markerWidth='30'
                              markerHeight='30'
                              refX='20'
                              refY='10'
                              orient='auto'
                            >
                              <path
                                d='M2,2 L2,20 L20,10 L2,2'
                                fill={getTransitionColor(null, 'true')}
                              />
                            </marker>
                            <marker
                              id='arrowheadfalse'
                              markerUnits='userSpaceOnUse'
                              markerWidth='30'
                              markerHeight='30'
                              refX='20'
                              refY='10'
                              orient='auto'
                            >
                              <path
                                d='M2,2 L2,20 L20,10 L2,2'
                                fill={getTransitionColor(null, 'false')}
                              />
                            </marker>
                            <marker
                              id='arrowheadfake'
                              markerUnits='userSpaceOnUse'
                              markerWidth='30'
                              markerHeight='30'
                              refX='20'
                              refY='10'
                              orient='auto'
                            >
                              <path
                                d='M2,2 L2,20 L20,10 L2,2'
                                fill={getTransitionColor(
                                  undefined,
                                  undefined,
                                  true
                                )}
                              />
                            </marker>
                          </defs>
                          {getTransitions().map(
                            (
                              {
                                state,
                                fake,
                                targetState,
                                isError,
                                branch,
                                transitionIndex,
                                path,
                                side,
                                endSide,
                                transitionIndexPerSide,
                                transitionEndIndexPerSide,
                                ...rest
                              },
                              index
                            ) =>
                              !isTransitionToSelf(state, targetState) ? (
                                <>
                                  <StyledFSMLine
                                    className='fsm-transition'
                                    onClick={() => {
                                      setEditingTransition((cur) => {
                                        const result = [...cur];

                                        result.push({
                                          stateId: state,
                                          index: transitionIndex,
                                        });

                                        const hasBothWay = hasBothWayTransition(
                                          state,
                                          targetState
                                        );

                                        if (hasBothWay) {
                                          result.push(hasBothWay);
                                        }

                                        return result;
                                      });
                                    }}
                                    key={Date.now()}
                                    name={`fsm-transition${
                                      isError
                                        ? '-error'
                                        : branch
                                          ? `-${branch}`
                                          : ''
                                    }`}
                                    id={`fsm-transition-${index}`}
                                    stroke={getTransitionColor(
                                      isError,
                                      branch,
                                      fake
                                    )}
                                    strokeWidth={1}
                                    markerEnd={`url(#arrowhead${getTransitionEndMarker(
                                      isError,
                                      branch,
                                      fake
                                    )})`}
                                    d={getTransitionPath(
                                      {
                                        side,
                                        endSide,
                                        ...rest,
                                        state,
                                        targetState,
                                      },
                                      getTransitionIndex(
                                        transitionIndexPerSide,
                                        transitionIndexes.current[state][side]
                                      ),
                                      getTransitionIndex(
                                        transitionEndIndexPerSide,
                                        transitionIndexes.current[targetState][
                                          endSide
                                        ]
                                      ),
                                      transitionIndexes.current[state][side],
                                      transitionIndexes.current[targetState][
                                        endSide
                                      ]
                                    )}
                                    deselected={
                                      hoveredState && hoveredState !== state
                                    }
                                    selected={hoveredState === state}
                                    fake={fake}
                                  />
                                  {showStateIds && (
                                    <StyledLineText
                                      style={{
                                        transform: `rotate(${calculateTextRotation(
                                          side
                                        )}deg) translateY(${calculateTextTranslation(
                                          side
                                        )}px)`,
                                        transformBox: 'fill-box',
                                        transformOrigin: 'center',
                                      }}
                                      deselected={
                                        hoveredState && hoveredState !== state
                                      }
                                    >
                                      <textPath
                                        href={`#fsm-transition-${index}`}
                                        startOffset='10px'
                                        fill='#ffffff'
                                      >
                                        {targetState}
                                      </textPath>
                                    </StyledLineText>
                                  )}
                                </>
                              ) : null
                          )}
                        </svg>
                      </StyledDiagram>
                    </FSMDiagramWrapper>
                  </StyledDiagramWrapper>
                </div>
              </div>
            </>
            {renderStateDetail()}
          </ReqoreTabsContent>
          <ReqoreTabsContent tabId='settings' style={{ overflowY: 'auto' }}>
            <QodexFields
              id={interfaceId}
              settings={settings}
              onSettingsChange={setSettings}
              value={omit(metadata, [
                'target_dir',
                'autovar',
                'globalvar',
                'localvar',
              ])}
              onChange={(fields) => {
                updateHistory(states, fields, 'metadata');
                setMetadata(fields);
              }}
            />
          </ReqoreTabsContent>
          <ReqoreTabsContent tabId='vars'>
            {renderVariables(true)}
          </ReqoreTabsContent>
          <ReqoreTabsContent tabId='log'>
            <ReqraftLog
              label='Qog Log Viewer'
              url={`log/fsms/${fsm?.id}`}
              socketOptions={{
                reconnect: true,
                openOnMount: fsm?.id && init.supports_enable,
              }}
              messageFormatter={(message) => ({
                ...message,
                intent: message.message.includes('[ERROR]')
                  ? 'danger'
                  : undefined,
              })}
              filterable
              fill
              autoScroll
              showTimestamps
            />
          </ReqoreTabsContent>
        </ReqoreTabs>
      </Content>
    </AppsContext.Provider>
  );

  if (embedded) {
    return renderFSM();
  }

  return (
    <FSMContext.Provider value={{ metadata, states }}>
      {renderFSM()}
    </FSMContext.Provider>
  );
};

export default compose(
  withGlobalOptionsConsumer(),
  withMapperConsumer()
)(FSMView) as React.FC<IFSMViewProps>;
