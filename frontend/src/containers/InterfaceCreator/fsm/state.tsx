import {
  ReqorePanel,
  ReqoreTag,
  ReqoreTagGroup,
  ReqoreThemeContext,
} from '@qoretechnologies/reqore';
import { IReqoreEffect } from '@qoretechnologies/reqore/dist/components/Effect';
import { IReqoreIconName } from '@qoretechnologies/reqore/dist/types/icons';
import size from 'lodash/size';
import React, { useContext, useEffect, useState } from 'react';
import { useDrag } from 'react-dnd';
import styled, { keyframes } from 'styled-components';
import { ContextMenuContext } from '../../../context/contextMenu';
import { InitialContext } from '../../../context/init';
import { TextContext } from '../../../context/text';
import { insertAtIndex } from '../../../helpers/functions';
import { IFSMState, STATE_ITEM_TYPE } from './';

export interface IFSMStateProps extends IFSMState {
  selected?: boolean;
  onDblClick: (id: string) => any;
  onClick: (id: string) => any;
  onEditClick: (id: string) => any;
  onDeleteClick: (id: string) => any;
  onUpdate: (id: string, data: any) => any;
  onTransitionOrderClick: (id: string) => any;
  startTransitionDrag: (id: string) => any;
  stopTransitionDrag: (id: string) => any;
  selectedState?: number;
  isAvailableForTransition: (stateId: string, id: string) => boolean;
  onExecutionOrderClick: () => void;
  id: string;
  isIsolated: boolean;
  category: TStateTypes;
}

export interface IFSMStateStyleProps {
  x: number;
  y: number;
  selected: boolean;
  initial: boolean;
  final: boolean;
  type: 'mapper' | 'connector' | 'pipeline' | 'fsm' | 'block' | 'if';
  isAvailableForTransition: boolean;
  isIsolated: boolean;
  isIncompatible?: boolean;
  error?: boolean;
}

export type TStateTypes = 'interfaces' | 'logic' | 'api' | 'other';

export const getStateColor = (stateType: TStateTypes): IReqoreEffect['gradient'] => {
  let color;
  switch (stateType) {
    case 'interfaces':
      color = '#e8970b';
      break;
    case 'logic':
      color = '#3b3b3b';
      break;
    case 'api':
      color = '#1914b0';
      break;
    default:
      color = '#950ea1';
      break;
  }

  return {
    colors: {
      0: 'main',
      100: color,
    },
    animate: 'hover',
    direction: 'to right bottom',
  };
};

const wiggleAnimation = (type) => keyframes`
    0% {
        transform: ${type === 'if' ? 'rotate(43deg)' : 'rotate(-2deg)'} ${
  type === 'connector' ? 'skew(15deg)' : ''
};
    }

    50% {
        transform: ${type === 'if' ? 'rotate(47deg)' : 'rotate(2deg)'} ${
  type === 'connector' ? 'skew(15deg)' : ''
};
    }

    100% {
        transform: ${type === 'if' ? 'rotate(43deg)' : 'rotate(-2deg)'} ${
  type === 'connector' ? 'skew(15deg)' : ''
};
    }
`;

const StyledStateName = styled.p`
  padding: 0;
  margin: 0;
  font-weight: 500;
  text-align: center;
`;

const StyledStateAction = styled.p`
  padding: 0;
  margin: 0;
  color: #a9a9a9;
  font-size: 11px;
  text-align: center;
`;

export const StyledStateTextWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-flow: column;
`;

// IS ISOLATED
// SELECTED
// INITIAL
// FINAL
// TYPE
// IS AVAILABLE FOR TRANSITION
// IS INCOMPATIBLE
// ERROR
const StyledFSMState = styled(ReqorePanel)`
  left: ${({ x }) => `${x}px`};
  top: ${({ y }) => `${y}px`};
  min-width: 250px;
  max-width: 330px;

  position: absolute !important;
  z-index: 20;

  &:hover {
    box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.1);
  }
`;

export const calculateFontSize = (name, isAction?: boolean) => {
  if (!name) {
    return undefined;
  }

  const len = name.length;

  if (len > 20) {
    return isAction ? '8px' : '12px';
  }

  return undefined;
};

export const getStateCategory = (type: string): TStateTypes => {
  if (type === 'mapper') {
    return 'interfaces';
  }

  if (type === 'connector') {
    return 'interfaces';
  }

  if (type === 'pipeline') {
    return 'interfaces';
  }

  if (type === 'fsm') {
    return 'logic';
  }

  if (type === 'block') {
    return 'logic';
  }

  if (type === 'if') {
    return 'logic';
  }

  if (type === 'apicall') {
    return 'api';
  }

  return 'other';
};

export const getStateType = ({ type, action, ...rest }: IFSMState) => {
  if (type === 'block') {
    return `${rest['block-type'] || 'for'} block (${size(rest.states)})`;
  }

  if (type === 'fsm') {
    return `fsm`;
  }

  if (type === 'if') {
    return `if statement`;
  }

  if (!action || !action.type || !action.value) {
    return '';
  }

  if (action.value?.class) {
    return `${action.value.class}:${action.value.connector} ${action.type}`;
  }

  if (action.value?.path || action.value?.path === '') {
    return `${action.value.type}/${action.value.name}${action.value.path}`;
  }

  return action.value;
};

const FSMState: React.FC<IFSMStateProps> = ({
  position,
  id,
  selected,
  onClick,
  onDblClick,
  onEditClick,
  onDeleteClick,
  onTransitionOrderClick,
  name,
  action,
  initial,
  final,
  type,
  onUpdate,
  selectedState,
  isAvailableForTransition,
  toggleDragging,
  onExecutionOrderClick,
  isIsolated,
  error,
  ...rest
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [_, drag] = useDrag({
    type: STATE_ITEM_TYPE,
    item() {
      setIsDragging(true);
      return { name: 'state', type: STATE_ITEM_TYPE, id };
    },
    end: () => {
      setIsDragging(false);
    },
  });

  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [shouldWiggle, setShouldWiggle] = useState<boolean>(false);
  const [isCompatible, setIsCompatible] = useState<boolean>(null);
  const [isLoadingCheck, setIsLoadingCheck] = useState<boolean>(false);
  const { addMenu } = useContext(ContextMenuContext);
  const t = useContext(TextContext);
  const { qorus_instance } = useContext(InitialContext);
  const theme = useContext(ReqoreThemeContext);

  useEffect(() => {
    (async () => {
      if (selectedState) {
        setIsLoadingCheck(true);
        const isAvailable = await isAvailableForTransition(selectedState, id);
        setIsCompatible(isAvailable);
        setIsLoadingCheck(false);
        setShouldWiggle(true);
      } else {
        setShouldWiggle(false);
        setIsLoadingCheck(false);
        setIsCompatible(null);
      }
    })();
  }, [selectedState]);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>, func: (id: string) => any) => {
    func(id);
  };

  const handleMouseEnter = (event) => {
    event?.stopPropagation();
    setIsHovered(true);
    toggleDragging(false);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    toggleDragging(true);
  };

  return (
    <StyledFSMState
      key={id}
      id={`state-${id}`}
      ref={drag}
      intent={shouldWiggle ? 'info' : undefined}
      //customTheme={{ main: getStateColor(getStateCategory(type)) }}
      contentEffect={{
        gradient: getStateColor(getStateCategory(action?.type || type)),
      }}
      icon="CodeLine"
      name={`fsm-state-${name}`}
      x={position?.x}
      y={position?.y}
      onDoubleClick={selectedState ? undefined : (e) => handleClick(e, onDblClick)}
      onClick={!selectedState || !shouldWiggle ? undefined : (e) => handleClick(e, onClick)}
      size="small"
      selected={selected}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={initial}
      final={final}
      minimal
      tooltip={type === 'block' && !qorus_instance ? t('CannotManageBlock') : undefined}
      isIsolated={isIsolated}
      className={isIsolated ? 'isolated-state' : ''}
      isAvailableForTransition={shouldWiggle}
      isIncompatible={selectedState && !isCompatible}
      error={error}
      type={action?.type || type}
      label={!isLoadingCheck ? name : t('LoadingCompatibilityCheck')}
      actions={[
        {
          group: [
            {
              icon: 'Edit2Line' as IReqoreIconName,
              disabled: type === 'block' && !qorus_instance,
              onClick: (e) => handleClick(e, onEditClick),
              minimal: true,
              flat: true,
              size: 'small',
            },
            {
              icon: 'DeleteBin4Fill' as IReqoreIconName,
              onClick: (e) => handleClick(e, onDeleteClick),
              intent: 'danger',
              minimal: true,
              flat: true,
              size: 'small',
            },
          ],
        },
      ]}
      onContextMenu={(event) => {
        event.persist();
        event.preventDefault();

        let menuData = [
          {
            title: name,
          },
          {
            item: t('Initial'),
            onClick: () => {
              onUpdate(id, { initial: !initial });
            },
            icon: 'flow-linear',
            rightIcon: initial ? 'small-tick' : undefined,
          },
          {
            title: t('Actions'),
          },
          {
            item: t('ManageTransitions'),
            onClick: () => {
              onTransitionOrderClick(id);
            },
            icon: 'property',
          },
          {
            item: t('RemoveAllTransitions'),
            onClick: () => {
              onUpdate(id, { transitions: null });
            },
            icon: 'trash',
          },
          {
            item: t('Edit'),
            onClick: () => onEditClick(id),
            icon: 'edit',
            disabled: type === 'block' && !qorus_instance,
            intent: 'warning',
          },
          {
            item: t('Delete'),
            onClick: () => onDeleteClick(id),
            icon: 'trash',
            intent: 'danger',
          },
        ];

        if (initial) {
          menuData = insertAtIndex(menuData, 3, {
            item: t('ManageExecutionOrder'),
            onClick: () => {
              onExecutionOrderClick();
            },
            icon: 'property',
          });
        }

        addMenu({
          event,
          data: menuData,
        });
      }}
    >
      <ReqoreTagGroup size="small" hasBottomMargin={false}>
        <ReqoreTag minimal wrap label={getStateType({ type, action, ...rest })} />
        {final && <ReqoreTag color="#6e1977" label={t('Final')} />}
        {initial && <ReqoreTag color="#7fbb26" label={t('Initial')} />}
      </ReqoreTagGroup>
    </StyledFSMState>
  );
};

export default FSMState;
