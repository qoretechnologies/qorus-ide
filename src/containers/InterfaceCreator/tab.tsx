import { ReqoreButton, ReqorePanel } from '@qoretechnologies/reqore';
import { IReqorePanelAction } from '@qoretechnologies/reqore/dist/components/Panel';
import { useReqraftStorage } from '@qoretechnologies/reqraft';
import timeago from 'epoch-timeago';
import { capitalize, forEach, size } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUnmount } from 'react-use';
import compose from 'recompose/compose';
import styled from 'styled-components';
import { useContextSelector } from 'use-context-selector';
import { TTranslator } from '../../App';
import { CreateInterfaceFromTextModal } from '../../components/CreateInterfaceFromText/modal';
import CustomDialog from '../../components/CustomDialog';
import { DraftsTable } from '../../components/DraftsTable';
import { NegativeColorEffect } from '../../components/Field/multiPair';
import { TOption } from '../../components/Field/systemOptions';
import {
  interfaceIcons,
  interfaceImages,
  interfaceKindTransform,
  supportsAICreation,
} from '../../constants/interfaces';
import { Messages } from '../../constants/messages';
import { DraftsContext, IDraftsContext } from '../../context/drafts';
import { InitialContext } from '../../context/init';
import { InterfacesContext } from '../../context/interfaces';
import { MethodsContext } from '../../context/methods';
import { TextContext } from '../../context/text';
import { EnableToggle } from '../../handlers/EnableToggle';
import { callBackendBasic, deleteDraft } from '../../helpers/functions';
import withFieldsConsumer from '../../hocomponents/withFieldsConsumer';
import withGlobalOptionsConsumer from '../../hocomponents/withGlobalOptionsConsumer';
import { postMessage } from '../../hocomponents/withMessageHandler';
import withMethodsConsumer from '../../hocomponents/withMethodsConsumer';
import withTextContext from '../../hocomponents/withTextContext';

export interface ITabProps {
  initialData: any;
  t: TTranslator;
  children: any;
  type: string;
  isEditing: boolean;
  name: string;
  version?: string;
  resetAllInterfaceData: (type: string) => any;
  onDelete?: () => any;
  hasCode?: boolean;
}

const StyledTab = styled.div`
  display: flex;
  flex: 1;
  flex-flow: column;
  overflow: hidden;
`;

export const StyledHeader = styled.div`
  margin: 0 0 15px 0;
  padding: 0 0 10px 0;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0;
    padding: 0;
  }
`;

const StyledContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  flex-flow: column;
  position: relative;
`;

const StyledSeparator = styled.div`
  width: 10px;
  height: 30px;
  margin-left: 10px;
  border-left: 1px solid #eee;
  display: inline-block;
  vertical-align: bottom;
`;

const getTypeName = (type: string, t): string => {
  switch (type) {
    case 'fsm':
      return t('FiniteStateMachine');
    default:
      return type;
  }
};

const tutorials = {
  default: {
    elements: [
      {
        id: 'tutorial-controls',
        title: 'tutorial-controls',
        text: 'tutorial-controls-content',
        isDefault: true,
        elementData: {
          left: window.innerWidth / 2 - 44,
          top: 10,
          height: 30,
          width: 88,
        },
      },
    ],
  },
  fsm: {
    elements: [
      {
        id: 'fsm-interface-title',
        title: 'tutorial-fsm-title',
        text: 'tutorial-fsm-content',
      },
      {
        id: 'fsm-fields-wrapper',
        title: 'tutorial-fsm-fields-title',
        text: 'tutorial-fsm-fields-content',
      },
      {
        id: 'fsm-toolbar',
        title: 'tutorial-fsm-tools-title',
        text: 'tutorial-fsm-tools-content',
      },
      {
        id: 'fsm-diagram',
        title: 'tutorial-fsm-diagram-title',
        text: 'tutorial-fsm-diagram-content',
      },
      {
        id: 'pan-element-toolbar',
        title: 'tutorial-fsm-toolbar-title',
        text: 'tutorial-fsm-toolbar-content',
      },
    ],
  },
  pipeline: {
    elements: [
      {
        id: 'pipeline-interface-title',
        title: 'tutorial-pipeline-title',
        text: 'tutorial-pipeline-content',
      },
      {
        id: 'pipeline-fields-wrapper',
        title: 'tutorial-pipeline-fields-title',
        text: 'tutorial-pipeline-fields-content',
      },
      {
        id: 'pipeline-diagram',
        title: 'tutorial-pipeline-diagram-title',
        text: 'tutorial-pipeline-diagram-content',
      },
      {
        id: 'pipeline-start',
        title: 'pipeline-start-title',
        text: 'pipeline-start-content',
      },
    ],
  },
};

const TutorialButton = ({ type, onClick }) => {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isSuccessful, setIsSuccessful] = useState<boolean>(false);
  const t = useContext(TextContext);

  useEffect(() => {
    let remainingElements = tutorials[type].elements;
    let timeLeft = 2000;
    let interval = setInterval(() => {
      remainingElements = remainingElements.reduce((newElements, element) => {
        const el = document.querySelector(`#${element.id}`);
        // Check if this element is loaded
        if (el) {
          return [...newElements];
        }
        return [
          ...newElements,
          {
            ...element,
          },
        ];
      }, []);

      timeLeft -= 500;

      if (remainingElements.length === 0 || timeLeft === 0) {
        clearInterval(interval);
        interval = null;
        setIsReady(true);
        setIsSuccessful(timeLeft !== 0);
      }
    }, 200);

    return () => {
      clearInterval(interval);
    };
  });

  return isReady ? (
    <>
      {isSuccessful && (
        <ReqoreButton
          icon='QuestionMark'
          onClick={() => {
            tutorials[type].elements = tutorials[type].elements.map(
              (element) => {
                const el = document.querySelector(`#${element.id}`);

                if (!el) {
                  return undefined;
                }

                return {
                  ...element,
                  elementData: el.getBoundingClientRect(),
                };
              }
            );

            onClick([
              ...tutorials.default.elements,
              ...tutorials[type].elements,
            ]);
          }}
        >
          Tutorial
        </ReqoreButton>
      )}
    </>
  ) : (
    <ReqoreButton intent='pending' minimal>
      {t('WaitingForElements')}
    </ReqoreButton>
  );
};

const Tab: React.FC<ITabProps> = ({
  t,
  data,
  type,
  id,
  version,
  children,
  resetAllInterfaceData,
  updateField,
  removeSubItemFromFields,
  name,
  hasCode,
  onDelete,
  ...rest
}) => {
  const isEditing: () => boolean = () => !!name;
  const [recreateDialog, setRecreateDialog] = useState<any>(null);
  const [draftsOpen, setDraftsOpen] = useState<boolean>(false);
  const { changeTab, isSavingDraft, lastDraft, is_hosted_instance }: any =
    useContext(InitialContext);
  const { methods, setMethods, setMethodsCount }: any =
    useContext(MethodsContext);
  const { addDraft } = useContext<IDraftsContext>(DraftsContext);
  const [draftsCount, setDraftsCount] = useState<number>(0);
  const [isDraftSaved, setIsDraftSaved] = useState<boolean>(false);
  const [localLastDraft, setLastDraft] = useState<string>(null);
  const { categories, clone } = useContextSelector(
    InterfacesContext,
    ({ categories, clone, toggleEnabled }) => ({
      categories,
      clone,
      toggleEnabled,
    })
  );
  const [searchParams] = useSearchParams();
  const [isAiDialogAllowed] = useReqraftStorage<TOption>(
    'config.allowAiCreateDialog',
    { type: 'boolean', value: true }
  );
  const allowAiCreateDialog =
    !searchParams.has('draftId') &&
    supportsAICreation[type] &&
    !isEditing() &&
    isAiDialogAllowed.value === true;
  const [isCreateFromTextOpen, setIsCreateFromTextOpen] =
    useState<boolean>(allowAiCreateDialog);

  useEffect(() => {
    setIsCreateFromTextOpen(allowAiCreateDialog);
  }, [type]);

  useEffect(() => {
    if (lastDraft && lastDraft.type === type) {
      setLastDraft(lastDraft.id);
    }
  }, [lastDraft]);

  useUnmount(() => {
    // Remove the associated type interface from initial data
    resetAllInterfaceData?.(type);
  });

  useEffect(() => {
    if (isSavingDraft) {
      setIsDraftSaved(true);
    } else if (isSavingDraft === false) {
      (async () => {
        const fetchedDrafts = await callBackendBasic(
          Messages.GET_DRAFTS,
          undefined,
          {
            type: interfaceKindTransform[type],
          },
          undefined,
          undefined,
          true
        );

        if (fetchedDrafts.ok) {
          setDraftsCount(size(fetchedDrafts.data.drafts));
        } else {
          setDraftsCount(0);
        }
      })();
    }
  }, [isSavingDraft]);

  // Fetch new drafts count when the type changes
  useEffect(() => {
    setIsDraftSaved(false);
    (async () => {
      const fetchedDrafts = await callBackendBasic(
        Messages.GET_DRAFTS,
        undefined,
        {
          type: interfaceKindTransform[type],
        },
        undefined,
        undefined,
        true
      );

      if (fetchedDrafts.ok) {
        setDraftsCount(size(fetchedDrafts.data.drafts));
      } else {
        setDraftsCount(0);
      }
    })();
  }, [type]);

  useEffect(() => {
    if (recreateDialog) {
      const { message, iface_kind, orig_lang, iface_id } = recreateDialog;

      const isMethodUsedInCC = (name, classConnections): boolean => {
        let isUsed = false;

        forEach(classConnections, (connectorList) => {
          forEach(connectorList, (connectorData) => {
            if (connectorData.trigger === name) {
              isUsed = true;
            }
          });
        });

        return isUsed;
      };

      data.confirmAction(
        message,
        () => {
          if (iface_kind === 'service') {
            // Get the removed methods, only remove methods that are not
            // used in class connections as triggers
            const { 'class-connections': classConnections } = data.service;
            const removedMethods: any[] = methods.filter((method) => {
              return (
                method.name !== 'init' &&
                !isMethodUsedInCC(method.name, classConnections)
              );
            });
            // Set the methods to only leave the init method
            // only if no methods were left
            setMethods((cur) => {
              return size(removedMethods) !== size(methods)
                ? [...cur].filter(
                    (method) =>
                      method.name === 'init' ||
                      isMethodUsedInCC(method.name, classConnections)
                  )
                : [{ name: 'init', desc: '' }];
            });
            // Remove each of the removed methods from the fields
            removedMethods.forEach((method) => {
              removeSubItemFromFields(method.id, 'service-methods');
            });

            setMethodsCount(
              (current: number) => current - size(removedMethods)
            );
          }
          data.changeInitialData('isRecreate', true);
          setRecreateDialog(null);
        },
        'Recreate',
        'warning',
        () => {
          if (orig_lang) {
            updateField(iface_kind, 'lang', orig_lang, iface_id);
          } else {
            resetAllInterfaceData(iface_kind);
          }
          setRecreateDialog(null);
        },
        'warning'
      );
    }
  }, [recreateDialog]);

  const getActions = (): IReqorePanelAction[] => {
    const actions: IReqorePanelAction[] = [];

    if (isEditing()) {
      actions.push({
        label: 'Clone',
        tooltip: 'Clone and edit this interface',
        icon: 'FileCopyLine',
        show: !categories[type].disable_creation,
        onClick: () => {
          clone(type, id);
        },
      });

      const metadata = data[`${type}Metadata`] || {};

      actions.push({
        as: EnableToggle,
        props: {
          enabled: metadata?.enabled,
          type,
          id: data[type].id,
          hasLabel: true,
        },
        show: metadata?.supportsEnable ? true : false,
      });
    }

    if (!isEditing()) {
      actions.push({
        id: 'button-show-drafts',
        icon: 'ListUnordered',
        label: 'Drafts',
        badge: draftsCount,
        disabled: !draftsCount,
        onClick: () => {
          setDraftsOpen(true);
        },
      });
    }

    actions.push({
      id: 'button-discard',
      icon: 'HistoryLine',
      compact: true,
      label: 'Reset',
      tooltip: 'Discard unsaved changes and delete the draft',
      disabled: !searchParams.has('draftId'),
      onClick: () => {
        data.confirmAction(
          'ResetFieldsConfirm',
          () => {
            if (searchParams.has('draftId')) {
              deleteDraft(type, searchParams.get('draftId'));
            }

            resetAllInterfaceData(type);

            changeTab(`proxy`, undefined, undefined, {
              to: `/CreateInterface/${type}${id ? `/${id}` : ''}`,
            });
          },
          'Confirm',
          'warning'
        );
      },
    });

    actions.push({
      id: 'button-cancel',
      icon: 'CloseLine',
      label: 'Cancel',
      compact: true,
      tooltip: 'Cancel you work, delete a draft and go back',
      onClick: () => {
        if (searchParams.has('draftId')) {
          deleteDraft(type, searchParams.get('draftId'));
        }

        resetAllInterfaceData(type);
        changeTab('Interfaces', type);
      },
    });

    if (isEditing()) {
      actions.push({
        icon: 'DeleteBinLine',
        label: 'Delete',
        effect: NegativeColorEffect,
        onClick: () => {
          data.confirmAction(t('ConfirmDeleteInterface'), () => {
            postMessage('delete-objects', {
              [type]: id,
            });

            onDelete?.();
            setIsDraftSaved(false);
            resetAllInterfaceData(type);
          });
        },
      });
    }

    return actions;
  };

  return (
    <>
      {isCreateFromTextOpen && (
        <CreateInterfaceFromTextModal
          type={type}
          onClose={() => setIsCreateFromTextOpen(false)}
        />
      )}
      {draftsOpen && (
        <CustomDialog
          isOpen
          onClose={() => setDraftsOpen(false)}
          label={`${t(capitalize(type))} ${t(`Drafts`)}`}
        >
          <DraftsTable
            interfaceKind={type}
            lastDraft={localLastDraft}
            onClick={(interfaceId, draftData) => {
              setLastDraft(interfaceId);
              setDraftsOpen(false);
              addDraft({
                type,
                id: interfaceId,
                ...draftData,
              });
            }}
          />
        </CustomDialog>
      )}
      <ReqorePanel
        fill
        flat
        responsiveTitle={false}
        responsiveActions={false}
        actions={getActions()}
        breadcrumbs={{
          size: 'normal',
          flat: true,
          responsive: false,
          padded: false,
          items: [
            {
              icon: 'Home4Fill',
              onClick: () => {
                changeTab(is_hosted_instance ? 'Dashboard' : 'ProjectConfig');
              },
            },
            {
              icon: interfaceIcons[type],
              leftIconProps: {
                icon: interfaceIcons[type],
                image: interfaceImages[type],
              },
              label: categories[type].display_name,
              badge: [categories[type].items],
              onClick: () => {
                changeTab('Interfaces', type);
              },
            },
            {
              icon: isEditing() ? 'Edit2Line' : 'AddCircleFill',
              maxWidth: '250px',
              tooltip: isEditing() ? name : t('New'),
              label: isEditing() ? name : t('New'),
              intent: 'info',
              flat: false,
              readOnly: true,
              badge: isSavingDraft
                ? t('SavingDraft')
                : isDraftSaved
                  ? `${t('DraftSaved')} ${timeago(Date.now())}`
                  : undefined,
            },
          ],
        }}
        padded={false}
        contentStyle={{
          overflow: 'hidden',
          display: 'flex',
          flexFlow: 'column',
        }}
      >
        {children}
      </ReqorePanel>
    </>
  );
};

export default compose(
  withFieldsConsumer(),
  withMethodsConsumer(),
  withTextContext(),
  withGlobalOptionsConsumer()
)(Tab);
