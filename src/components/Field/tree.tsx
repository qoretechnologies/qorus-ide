import {
  ReqoreButton,
  ReqoreControlGroup,
  ReqoreHorizontalSpacer,
  ReqoreMessage,
  ReqorePanel,
  ReqoreVerticalSpacer,
} from '@qoretechnologies/reqore';
import { size } from 'lodash';
import { FunctionComponent, useContext, useState } from 'react';
import useMount from 'react-use/lib/useMount';
import styled from 'styled-components';
import Field from '.';
import { TTranslator } from '../../App';
import { InitialContext } from '../../context/init';
import { TextContext } from '../../context/text';
import { validateField } from '../../helpers/validations';
import {
  addMessageListener,
  postMessage,
} from '../../hocomponents/withMessageHandler';
import SourceDirs from '../../project_config/sourceDirs';
import CustomDialog from '../CustomDialog';
import {
  ContentWrapper,
  FieldWrapper,
  IField,
  IFieldChange,
} from '../FieldWrapper';
import Loader from '../Loader';
import { PositiveColorEffect } from './multiPair';

export interface ITreeField {
  get_message: { action: string; object_type: string };
  return_message: { action: string; object_type: string; return_value: string };
  name: string;
  t: TTranslator;
  single?: boolean;
  useRelativePath?: boolean;
  notFixed?: boolean;
  expanded?: boolean;
  label?: string;
}

const StyledTreeScroller = styled.div`
  overflow: auto;
`;

const TreeField: FunctionComponent<
  ITreeField & IField & IFieldChange & any
> = ({
  get_message,
  return_message,
  onChange,
  name,
  value = [],
  default_value,
  single,
  useRelativePath,
  notFixed,
  onFolderCreated,
  expanded,
  canManageSourceDirs,
  label,
  filesOnly,
  showValue = true,
}) => {
  const t = useContext(TextContext);
  const { callBackend } = useContext(InitialContext);
  const [isRootExpanded, setRootExpanded] = useState<boolean>(false);
  const [_expanded, setExpanded] = useState<string[]>([]);
  const [items, setItems] = useState<any>([]);
  const [folderDialog, setFolderDialog] = useState<any>(undefined);
  const [manageSourceDirs, setManageSourceDirs] = useState<any>(false);

  useMount(() => {
    if (default_value) {
      onChange(name, default_value);
    }

    addMessageListener(return_message.action, (data: any) => {
      // Check if this is the correct
      // object type
      if (
        !data.object_type ||
        data.object_type === return_message.object_type
      ) {
        setItems(data[return_message.return_value]);
      }
    });
    postMessage(get_message.action, { object_type: get_message.object_type });
  });

  const handleNodeClick: (node: any) => void = (node) => {
    // Which path should be used
    const usedPath: string = useRelativePath
      ? node.nodeData.rel_path
      : node.nodeData.path;
    // If we are dealing with single string
    if (single) {
      onChange(name, usedPath);
    } else {
      // Multiple files can be selected
      if (value.find((sel) => sel.name === usedPath)) {
        // Remove the selected item
        onChange(
          name,
          value.filter((path) => path.name !== usedPath)
        );
      } else {
        onChange(name, [...value, { name: usedPath }]);
      }
    }
  };

  const handleNodeCollapse: (node: any) => void = (node) => {
    // Which path should be used
    const usedPath: string = useRelativePath
      ? node.nodeData.rel_path
      : node.nodeData.path;

    setExpanded((currentExpanded: string[]): string[] =>
      currentExpanded.filter((path: string) => path !== usedPath)
    );
  };

  const handleNodeExpand: (node: any) => void = (node) => {
    // Which path should be used
    const usedPath: string = useRelativePath
      ? node.nodeData.rel_path
      : node.nodeData.path;

    setExpanded((currentExpanded: string[]): string[] => [
      ...currentExpanded,
      usedPath,
    ]);
  };

  const handleCreateDirSubmit = async (addSource?: boolean) => {
    setFolderDialog({ ...folderDialog, loading: true });

    const data = await callBackend('create-directory', undefined, {
      path: `${folderDialog.abs_path}${
        folderDialog.newPath.startsWith('/')
          ? folderDialog.newPath
          : `/${folderDialog.newPath}`
      }`,
      add_source: addSource,
    });

    if (data.ok) {
      setFolderDialog(undefined);
      postMessage(get_message.action, { object_type: get_message.object_type });
      if (onFolderCreated) {
        onFolderCreated();
      }
    } else {
      setFolderDialog((cur) => ({
        ...cur,
        loading: false,
        error: data.message,
      }));
    }
  };

  const transformItems: (data: any[]) => any[] = (data) => {
    const result = data.reduce((newData, item, index): any[] => {
      // Recursively build the child nodes (folders and files)
      const childNodes: any[] | undefined =
        size(item.dirs) + size(item.files)
          ? transformItems([...item.dirs, ...(item.files || [])])
          : undefined;
      // Check if this item is a file
      const isFile: boolean = !(size(item.dirs) + size(item.files));
      // Build the absolute path
      const path: string =
        isFile && filesOnly
          ? `${useRelativePath ? item.rel_path : item.abs_path}/${item.name}`
          : useRelativePath
          ? item.rel_path
          : item.abs_path;
      const isExpanded = _expanded.includes(
        useRelativePath ? item.rel_path : item.abs_path
      );
      // Return the transformed data
      return [
        ...newData,
        {
          ...item,
          id: index,
          depth: index,
          hasCaret: !isFile && size(item.dirs) + size(item.files) !== 0,
          isSelected: single
            ? value === path
            : value.find((sel) => sel.name === path),
          icon:
            isFile && filesOnly
              ? 'document'
              : isExpanded
              ? 'folder-open'
              : 'folder-close',
          isFile,
          isExpanded,
          label: item.basename,
          childNodes,
          nodeData: {
            path,
            rel_path: item.rel_path,
          },
        },
      ];
    }, []);

    return result;
  };

  const renderFolders = (data) => (
    <ReqoreControlGroup vertical fluid>
      {data.map((item) => (
        <>
          <ReqoreControlGroup>
            {size(item.childNodes) ? (
              <ReqoreButton
                fixed
                onClick={() =>
                  !item.isExpanded
                    ? handleNodeExpand(item)
                    : handleNodeCollapse(item)
                }
                minimal
                flat
                iconColor={item.isExpanded ? 'info:lighten:2' : undefined}
                icon={item.isExpanded ? 'ArrowDownSLine' : 'ArrowRightSLine'}
              />
            ) : (
              <>
                {/* @ts-expect-error */}
                <ReqoreButton readOnly fixed minimal flat icon='' />
              </>
            )}
            <ReqoreButton
              onClick={
                !filesOnly || (filesOnly && item.isFile)
                  ? () => {
                      handleNodeClick(item);
                    }
                  : undefined
              }
              readOnly={!(!filesOnly || (filesOnly && item.isFile))}
              active={item.isSelected}
              flat={!item.isSelected}
              leftIconColor={item.isExpanded ? 'info:lighten:2' : undefined}
              icon={
                item.isFile && filesOnly
                  ? 'FileLine'
                  : item.isExpanded
                  ? 'FolderOpenLine'
                  : 'FolderLine'
              }
              rightIcon={item.isSelected ? 'CheckLine' : undefined}
              effect={
                item.isSelected
                  ? {
                      gradient: {
                        colors: {
                          0: 'main',
                          160: 'info:lighten',
                        },
                      },
                    }
                  : {
                      weight: item.isFile ? 'light' : undefined,
                    }
              }
            >
              {item.label}
            </ReqoreButton>
            <ReqoreButton
              fixed
              effect={PositiveColorEffect}
              icon='FolderAddFill'
              onClick={() => setFolderDialog({ ...item, newPath: '' })}
            />
          </ReqoreControlGroup>
          {item.childNodes && item.isExpanded ? (
            <ReqoreControlGroup>
              <ReqoreHorizontalSpacer width={20} />
              {renderFolders(item.childNodes)}
            </ReqoreControlGroup>
          ) : null}
        </>
      ))}
    </ReqoreControlGroup>
  );

  return (
    <>
      {folderDialog && (
        <CustomDialog
          icon='FolderAddLine'
          isOpen
          label={t('CreateNewDir')}
          onClose={() => {
            setFolderDialog(undefined);
          }}
          bottomActions={[
            {
              label: t('CreateFolder'),
              disabled:
                folderDialog.loading ||
                !validateField('string', folderDialog.newPath),
              icon: 'CheckLine',
              intent: 'success',
              onClick: () => handleCreateDirSubmit(),
              position: 'right',
            },
            {
              label: t('CreateFolderAndAddSource'),
              disabled:
                folderDialog.loading ||
                !validateField('string', folderDialog.newPath),
              icon: 'CheckDoubleLine',
              intent: 'success',
              onClick: () => handleCreateDirSubmit(true),
              position: 'right',
            },
          ]}
        >
          <ReqoreMessage intent='info' size='small'>
            {t('AddingNewDirectoryTo')} <strong>{folderDialog.abs_path}</strong>
            . {t('MultipleSubdirectoriesNewDir')}
          </ReqoreMessage>
          <ReqoreVerticalSpacer height={10} />
          {folderDialog.error && (
            <ReqoreMessage intent='danger'>{folderDialog.error}</ReqoreMessage>
          )}
          <ContentWrapper>
            <FieldWrapper
              compact
              label={t('field-label-newDir')}
              isValid={validateField('string', folderDialog.newPath)}
            >
              <Field
                type='string'
                value={folderDialog.newPath}
                onChange={(_name, value) =>
                  setFolderDialog((cur) => ({ ...cur, newPath: value }))
                }
                name='new-directory'
              />
            </FieldWrapper>
          </ContentWrapper>
        </CustomDialog>
      )}
      {manageSourceDirs && (
        <SourceDirs
          isOpen
          onClose={() => {
            setManageSourceDirs(false);
            postMessage(get_message.action, {
              object_type: get_message.object_type,
            });
          }}
        />
      )}
      {single && value && showValue ? (
        <>
          <ReqoreMessage
            intent={!size(value) ? 'warning' : 'info'}
            size='small'
          >
            {!size(value) ? t('ValueIsEmpty') : value}
          </ReqoreMessage>
          <ReqoreVerticalSpacer height={10} />
        </>
      ) : null}
      <ReqorePanel
        label={label || 'Add / Remove Source Directories'}
        collapsible
        isCollapsed={!expanded}
        icon='FolderAddLine'
        fluid
        size='small'
        minimal
        actions={[
          {
            icon: 'Settings3Fill',
            onClick: () => setManageSourceDirs(true),
            tooltip: 'Manage source directories',
            show: canManageSourceDirs === true,
          },
        ]}
      >
        {size(items) ? (
          <StyledTreeScroller>
            {renderFolders(transformItems(items))}
          </StyledTreeScroller>
        ) : (
          <Loader inline />
        )}
      </ReqorePanel>
    </>
  );
};

export default TreeField;
