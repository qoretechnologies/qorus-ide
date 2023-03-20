import { cloneDeep } from 'lodash';
import { IFSMState, IFSMStates } from '../containers/InterfaceCreator/fsm';
import { getStateBoundingRect } from './diagram';

export const autoAlign = (states: IFSMStates, config?: IAutoAlignConfig) => {
  let _margin = 50;
  let _columnWidth = _margin + 350;
  let _gridWidth = 4000;
  let _gridHeight = 4000;
  let _rowHeight = _margin + 150;

  let _grid: IGrid[] = [];
  let alignedStates: IFSMStates = cloneDeep(states);

  /**
   * Creates the background grid to align the states
   * @param states states to be aligned
   * @returns IGrid[] array of grid cells sorted row wise
   */
  const createGrid = (states: IFSMStates): IGrid[] => {
    const keys = Object.keys(states);
    let yAxisAllState: number[] = [];
    let xAxisAllState: number[] = [];

    // Separate the x and y coordinates of all the states, sort them to find the starting point of the grid
    keys.forEach((key) => {
      yAxisAllState.push(states[key].position?.y);
      xAxisAllState.push(states[key].position?.x);
    });
    yAxisAllState.sort((a, b) => {
      if (a < b) {
        return -1;
      }
      if (a > b) {
        return 1;
      }
      return 0;
    });
    xAxisAllState.sort((a, b) => {
      if (Number(a) < Number(b)) {
        return -1;
      }
      if (Number(a) > Number(b)) {
        return 1;
      }
      return 0;
    });

    // Starting point of the grid
    const gridStartingPoint = { x: xAxisAllState[0], y: yAxisAllState[0] };
    const noOfColumns = Math.round((_gridWidth - gridStartingPoint.x) / _columnWidth);
    const noOfRows = Math.round(_gridHeight / _rowHeight);

    // Create the grid
    for (let i = 0; i < noOfRows; i++) {
      for (let j = 0; j < noOfColumns; j++) {
        let obj: any = {};
        obj.id = `${i}${j}`;
        const xPosition = gridStartingPoint.x + j * _columnWidth;
        const yPosition = gridStartingPoint.y + i * _rowHeight;
        const position = { x: xPosition, y: yPosition };
        obj.position = position;
        _grid.push(obj);
      }
    }

    // Sort the grid row wise
    _grid.sort((a, b) => {
      if (Number(a.id) < Number(b.id)) {
        return -1;
      }
      return 1;
    });

    _grid.forEach((cell) => {
      const cellPosition = cell.position;
      const alignedStateKey = Object.keys(alignedStates).find(
        (key) => alignedStates[key].position === cellPosition
      );
      if (alignedStateKey) {
        cell.state = alignedStates[alignedStateKey];
        cell.occupied = true;
      }
    });

    return _grid;
  };

  /**
   * Finds the next row index of the grid cell on the same column
   * @param id id of the grid cell
   * @returns index of the next row cell
   */
  const getNextLineIndex = (id: string): number => {
    const idSplit = id.split('');
    let nextLineId = String(Number(idSplit[0]) + 1);
    nextLineId = `${nextLineId}${idSplit[1]}`;
    const index = _grid.findIndex((cell) => cell.id === nextLineId);
    return index;
  };

  /**
   * Finds the next column index of the grid cell on the same row
   * @param id id of the grid cell
   * @returns index of the next column cell
   */
  const getNextColumnIndex = (id: string): number => {
    let nextId = String(Number(id) + 1);
    let padded: string;
    if (nextId.length < 2) {
      padded = nextId.padStart(2, '0');
    } else {
      padded = nextId;
    }
    const nextColumnIndex = _grid.findIndex((cell) => cell.id === padded);
    return nextColumnIndex;
  };

  /**
   * Finds the previous row index of the grid cell on the same column
   * @param id id of the grid cell
   * @returns index of the previous row cell in the same column
   */
  const getPreviousLineIndex = (id: string): number => {
    const idSplit = id.split('');
    let nextLineId = String(Number(idSplit[0]) - 1);
    nextLineId = `${nextLineId}${idSplit[1]}`;
    const index = _grid.findIndex((cell) => cell.id === nextLineId);
    return index;
  };

  const isAligned = (state: IFSMState, selectedGrid: IGrid): boolean => {
    const position = state.position;
    const selectedGridIndex = _grid.findIndex((cell) => cell === selectedGrid);
    const aligned = _grid.find((cell) => {
      return cell.position.x === position.x && cell.position.y === position.y;
    });
    if (aligned) {
      _grid[selectedGridIndex].occupied = true;
      _grid[selectedGridIndex].state = state;
    }
    return aligned ? true : false;
  };

  /**
   * Finds the row for the state to be aligned and shifts the state to the end of the row
   * @param state state to be aligned
   */
  const shiftState = (state: IFSMState): void => {
    let selectedGrid: IGrid | undefined;
    for (let i = 0; i < _grid.length; i++) {
      const nextLineIndex = getNextLineIndex(_grid[i].id);
      const row = {
        top: _grid[i].position,
        bottom: _grid[nextLineIndex].position,
      };
      // tackle states that are not overlapped by row
      if (row.top.y <= state.position.y && row.bottom.y >= state.corners?.bottomLeftCorner.y!) {
        selectedGrid = _grid[i];
        if (selectedGrid.occupied) {
          if (selectedGrid.state?.corners?.bottomLeftCorner.y! < state.position.y) {
            selectedGrid = _grid[nextLineIndex];
          }
        }
        break;
      }
      // tackle the states that are overlapped between rows towards bottom
      if (
        row.top.y <= state.position.y &&
        row.bottom.y >= state.position.y &&
        row.bottom.y <= state.corners?.bottomLeftCorner.y!
      ) {
        selectedGrid = _grid[nextLineIndex] ? _grid[nextLineIndex] : undefined;
        break;
      }
      // tackle the states that are overlapped between rows towards top
      if (
        row.top.y >= state.position.y &&
        row.top.y <= state.corners?.bottomLeftCorner.y! &&
        row.bottom.y > state.corners?.bottomLeftCorner.y!
      ) {
        selectedGrid = _grid[getPreviousLineIndex(_grid[i].id)] ?? _grid[i];
      }
    }
    if (typeof selectedGrid !== 'undefined' && !isAligned(state, selectedGrid)) {
      if (selectedGrid.occupied) {
        let i = _grid.findIndex((cell) => cell === selectedGrid) + 1;
        while (i < _grid.length) {
          if (!_grid[i].occupied) {
            selectedGrid = _grid[i];
            break;
          }
          i++;
        }
      }
      state.position = selectedGrid!.position;
      alignedStates[state.key!] = state;
      const index = _grid.findIndex((cell) => cell.id === selectedGrid!.id);
      _grid[index].occupied = true;
      _grid[index].state = state;
    }
  };

  /**
   * Aligns the states in the array with the grid
   * @param statesArr array of states to be aligned
   */
  const findOverlapAndShift = (statesArr: IFSMState[]): void => {
    for (let j = 0; j < statesArr.length; j++) {
      const activeState = statesArr[j];
      shiftState(activeState);
    }
  };

  /**
   * Calculates the corners of the state with margin
   * @param state state for which corners with margin are to be calculated
   * @returns corners of the state with margin
   */
  const getStateCornersWithMargin = (state: IFSMState): IStateConers => {
    const stateRef = getStateBoundingRect(state.key!);

    // Calculating all four corners of the state with margin
    const topLeftCorner = {
      x: state.position?.x - _margin,
      y: state.position?.y - _margin,
    };
    const topRightCorner = {
      x: state.position?.x + stateRef.width + _margin,
      y: state.position?.y - _margin,
    };
    const bottomLeftCorner = {
      x: state.position?.x - _margin,
      y: state.position?.y + stateRef.height + _margin,
    };
    const bottomRightCorner = {
      x: state.position?.x + stateRef.width + _margin,
      y: state.position?.y + stateRef.height + _margin,
    };
    return {
      topLeftCorner,
      topRightCorner,
      bottomLeftCorner,
      bottomRightCorner,
    };
  };

  /**
   * Finds the overlapping states and aligns them with the grid
   * @param states states to be aligned
   */
  const alignStates = (states: IFSMStates): void => {
    // alignedStates = states;
    const keys = Object.keys(states);
    let statesArr: IFSMState[] = [];

    // Create an array of states and calculate the corners with margin
    keys.forEach((key) => {
      const state = states[key];
      state.key = key;
      state.corners = getStateCornersWithMargin(state);
      if (state.position?.x && state.position?.y) statesArr.push(state);
    });

    findOverlapAndShift(statesArr);
  };

  // If config is provided then use the values from config else use the default values
  if (config) {
    _margin = config.margin ?? 50;
    _columnWidth = _margin + (config.columnWidth ?? 350);
    _gridWidth = config.gridWidth ?? 4000;
    _gridHeight = config.gridHeight ?? 4000;
    _rowHeight = _margin + (config.rowHeight ?? 150);
  }

  if (config?.grid && config.grid.length > 0) {
    _grid = cloneDeep(config.grid);
  } else {
    createGrid(states);
  }

  // Align the states with the grid
  alignStates(alignedStates);
  return { alignedStates, grid: _grid };
};

export interface IStateConers {
  topLeftCorner: IFSMState['position'];
  topRightCorner: IFSMState['position'];
  bottomRightCorner: IFSMState['position'];
  bottomLeftCorner: IFSMState['position'];
}

export interface IStateRows {
  [x: string | number]: IFSMState[];
}

export interface IGrid {
  position: IFSMState['position'];
  id: string;
  occupied?: boolean;
  state?: IFSMState;
}

export interface IAutoAlignConfig {
  margin?: number;
  columnWidth?: number;
  gridWidth?: number;
  gridHeight?: number;
  rowHeight?: number;
  grid?: IGrid[];
}