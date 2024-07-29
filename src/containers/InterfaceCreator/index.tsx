import { useContext } from 'react';
import compose from 'recompose/compose';
import { InitialContext } from '../../context/init';
import { withIdChecker } from '../../hocomponents/withIdChecker';
import withTextContext from '../../hocomponents/withTextContext';
import ClassConnectionsStateProvider from '../ClassConnectionsStateProvider';
import { ConnectionView } from './connection';
import ErrorsView from './errorsView';
import FSMView from './fsm';
import LibraryView from './libraryView';
import MapperView from './mapperView';
import InterfaceCreatorPanel from './panel';
import Pipeline from './pipeline';
import ServicesView from './servicesView';
import Tab from './tab';
import TypeView from './typeView';
import WorkflowsView, { CreatorWrapper } from './workflowsView';

export interface ICreateInterface {
  initialData: {
    updateCurrentHistoryTab?: (data: { [key: string]: any }) => void;
    [key: string]: any;
  };
  onSubmit: () => any;
  onDelete?: () => any;
  context: any;
  data: any;
}

export const CreateInterface = ({
  onSubmit,
  onDelete,
  data,
  context,
}: ICreateInterface) => {
  const init = useContext(InitialContext);
  const initialData = { ...init, ...data };

  const getName: () => string = () =>
    initialData?.[initialData.subtab]?.name ||
    initialData?.[initialData.subtab]?.path;

  const getID: () => string = () => initialData?.[initialData.subtab]?.id;

  const getVersion: () => string = () =>
    initialData?.[initialData.subtab]?.version;

  return (
    <Tab
      name={getName()}
      id={getID()}
      type={initialData.subtab}
      version={getVersion()}
      data={initialData}
      onDelete={onDelete}
      hasCode={!!initialData[initialData.subtab]?.source}
    >
      {initialData.subtab === 'fsm' && (
        <FSMView
          fsm={initialData.fsm}
          onSubmitSuccess={onSubmit}
          interfaceContext={context}
        />
      )}
      {initialData.subtab === 'connection' && (
        <ConnectionView
          context={context}
          onSubmitSuccess={onSubmit}
          isEditing={!!initialData.connection}
          connection={initialData.connection}
        />
      )}
      {initialData.subtab === 'pipeline' && (
        <Pipeline
          pipeline={initialData.pipeline}
          onSubmitSuccess={onSubmit}
          interfaceContext={context}
        />
      )}
      {initialData.subtab === 'service' && (
        <ClassConnectionsStateProvider type='service'>
          {(classConnectionsProps) => (
            <ServicesView
              service={initialData.service}
              onSubmitSuccess={onSubmit}
              interfaceContext={context}
              classConnectionsProps={classConnectionsProps}
            />
          )}
        </ClassConnectionsStateProvider>
      )}
      {initialData.subtab === 'mapper-code' && (
        <LibraryView
          library={initialData['mapper-code']}
          onSubmitSuccess={onSubmit}
          interfaceContext={context}
        />
      )}
      {initialData.subtab === 'workflow' && (
        <WorkflowsView
          workflow={initialData.workflow}
          onSubmitSuccess={onSubmit}
          interfaceContext={context}
        />
      )}
      {initialData.subtab === 'job' && (
        <CreatorWrapper>
          <ClassConnectionsStateProvider type='job'>
            {(classConnectionsProps) => (
              <InterfaceCreatorPanel
                hasClassConnections
                hasConfigManager
                context={context}
                onSubmitSuccess={onSubmit}
                type={'job'}
                data={initialData.job}
                isEditing={!!initialData.job}
                {...classConnectionsProps}
              />
            )}
          </ClassConnectionsStateProvider>
        </CreatorWrapper>
      )}
      {initialData.subtab === 'class' && (
        <CreatorWrapper>
          <InterfaceCreatorPanel
            type={'class'}
            context={context}
            data={initialData.class}
            isEditing={!!initialData.class}
            hasConfigManager
            onSubmitSuccess={onSubmit}
            definitionsOnly
          />
        </CreatorWrapper>
      )}
      {initialData.subtab === 'step' && (
        <CreatorWrapper>
          <ClassConnectionsStateProvider initialData={initialData} type='step'>
            {(classConnectionsProps) => (
              <InterfaceCreatorPanel
                type={'step'}
                data={initialData.step}
                hasClassConnections
                hasConfigManager
                context={context}
                onSubmitSuccess={onSubmit}
                isEditing={!!initialData.step}
                openFileOnSubmit={!onSubmit}
                forceSubmit
                {...classConnectionsProps}
              />
            )}
          </ClassConnectionsStateProvider>
        </CreatorWrapper>
      )}
      {initialData.subtab === 'mapper' && (
        <MapperView
          onSubmitSuccess={onSubmit}
          interfaceContext={context}
          initialData={initialData}
          data={initialData.mapper}
        />
      )}
      {initialData.subtab === 'group' && (
        <CreatorWrapper>
          <InterfaceCreatorPanel
            type={'group'}
            onSubmitSuccess={onSubmit}
            data={initialData.group}
            isEditing={!!initialData.group}
          />
        </CreatorWrapper>
      )}
      {initialData.subtab === 'event' && (
        <CreatorWrapper>
          <InterfaceCreatorPanel
            type={'event'}
            onSubmitSuccess={onSubmit}
            data={initialData.event}
            isEditing={!!initialData.event}
          />
        </CreatorWrapper>
      )}
      {initialData.subtab === 'queue' && (
        <CreatorWrapper>
          <InterfaceCreatorPanel
            type={'queue'}
            onSubmitSuccess={onSubmit}
            data={initialData.queue}
            isEditing={!!initialData.queue}
          />
        </CreatorWrapper>
      )}
      {initialData.subtab === 'sla' && (
        <CreatorWrapper>
          <InterfaceCreatorPanel
            type={'sla'}
            onSubmitSuccess={onSubmit}
            data={initialData.sla}
            isEditing={!!initialData.sla}
          />
        </CreatorWrapper>
      )}
      {initialData.subtab === 'constant' && (
        <CreatorWrapper>
          <InterfaceCreatorPanel
            type={'constant'}
            onSubmitSuccess={onSubmit}
            data={initialData.constant}
            isEditing={!!initialData.constant}
          />
        </CreatorWrapper>
      )}
      {initialData.subtab === 'function' && (
        <CreatorWrapper>
          <InterfaceCreatorPanel
            type={'function'}
            onSubmitSuccess={onSubmit}
            data={initialData.function}
            isEditing={!!initialData.function}
          />
        </CreatorWrapper>
      )}
      {initialData.subtab === 'value-map' && (
        <CreatorWrapper>
          <InterfaceCreatorPanel
            type={'value-map'}
            onSubmitSuccess={onSubmit}
            data={initialData['value-map']}
            isEditing={!!initialData['value-map']}
          />
        </CreatorWrapper>
      )}
      {initialData.subtab === 'type' && (
        <TypeView onSubmitSuccess={onSubmit} initialData={initialData} />
      )}
      {initialData.subtab === 'errors' && (
        <ErrorsView
          errors={initialData.errors}
          onSubmitSuccess={onSubmit}
          interfaceContext={context}
        />
      )}
    </Tab>
  );
};

export default compose(withTextContext(), withIdChecker())(CreateInterface) as (
  props: ICreateInterface
) => JSX.Element;
