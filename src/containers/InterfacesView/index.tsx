import { ReqorePanel } from '@qoretechnologies/reqore';
import { useContext, useEffect } from 'react';
import { useContextSelector } from 'use-context-selector';
import { IField } from '../../components/FieldWrapper';
import { InitialContext } from '../../context/init';
import { InterfacesContext } from '../../context/interfaces';
import { IClassConnections } from '../ClassConnectionsManager';
import { IConnection } from '../InterfaceCreator/connection';
import { IFSMMetadata, IFSMStates } from '../InterfaceCreator/fsm';
import {
  IPipelineElement,
  IPipelineMetadata,
} from '../InterfaceCreator/pipeline';
import { InterfacesViewCollection } from './collection';

export interface IQorusListInterface {
  label?: string;
  id: string | number;
  type?: string;
  draft?: boolean;
  hasDraft?: boolean;
  date?: string;
  fsmData?: any;
  data?: {
    id?: string;
    date?: string;
    desc?: string;
    short_desc?: string;
    display_name?: string;
    enabled?: boolean;
    supports_enable?: boolean;
    active?: boolean;
    supports_active?: boolean;
    last_executed?: number;
    last_error?: string;
    next?: string;
    on_demand?: boolean;
    running?: boolean;
    schedule?: Record<string, any>;
    type?: string;
  };
}

export interface IQorusInterface extends Partial<IDraftData> {
  label?: string;
  data?: {
    id: string | number;
    name: string;
    display_name?: string;
    short_desc?: string;
    type: string;
    desc?: string;
    target_dir: string;
    yaml_file: string;
    target_file?: string;
    [key: string]: any;
  };
  draft?: boolean;
  hasDraft?: boolean;
  date?: string;
}

export interface IQorusInterfaceCountItem {
  items: number;
  drafts: number;
  display_name: string;
  short_desc: string;
  singular_display_name: string;
  supports_code?: boolean;
}
export type TQorusInterfaceCount = Record<string, IQorusInterfaceCountItem>;

export interface IDraftData {
  interfaceKind: string;
  interfaceId: string;
  fields?: any[];
  selectedFields?: any[];
  methods?: any;
  selectedMethods?: any;
  steps?: {
    steps: any[];
    stepsData: any[];
    lastStepId?: number;
  };
  diagram?: any;
  typeData?: any;
  pipelineData?: {
    metadata: IPipelineMetadata;
    elements: IPipelineElement[];
  };
  fsmData?: {
    metadata: IFSMMetadata;
    states: IFSMStates;
  };
  isValid?: boolean;
  connectionData?: {
    data: IConnection;
    fields: IField[];
  };
  classConnections?: IClassConnections;
  associatedInterface?: string;
}

export interface IQorusInterfacesViewProps {
  type: string;
}

export const InterfacesView = ({ type }: IQorusInterfacesViewProps) => {
  const { changeTab } = useContext(InitialContext);
  const { categories } = useContextSelector(
    InterfacesContext,
    ({ categories }) => ({ categories })
  );

  useEffect(() => {
    if (!type) {
      changeTab('Interfaces', 'fsm');
    }
  }, [type]);

  return (
    <ReqorePanel
      minimal
      flat
      fill
      responsiveTitle
      responsiveActions={false}
      contentStyle={{
        display: 'flex',
        flexFlow: 'row',
        overflow: 'hidden',
        paddingTop: 0,
        paddingBottom: 0,
      }}
    >
      <InterfacesViewCollection type={type} {...categories[type]} />
    </ReqorePanel>
  );
};
