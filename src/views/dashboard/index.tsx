import {
  ReqoreColumns,
  ReqoreIcon,
  ReqoreMenu,
  ReqoreMenuItem,
  ReqorePanel,
  ReqoreTextEffect,
} from '@qoretechnologies/reqore';
import { IReqoreCustomTheme } from '@qoretechnologies/reqore/dist/constants/theme';
import { map } from 'lodash';
import { useContext } from 'react';
import { useAsyncRetry } from 'react-use';
import { useContextSelector } from 'use-context-selector';
import Loader from '../../components/Loader';
import { interfaceIcons, interfaceImages } from '../../constants/interfaces';
import { Messages } from '../../constants/messages';
import { InitialContext } from '../../context/init';
import { InterfacesContext } from '../../context/interfaces';
import { callBackendBasic } from '../../helpers/functions';
import { DashboardDrafts } from './Drafts';
import { DashboardQogLog } from './QogLog';
import { DashboardQogPanel } from './QogPanel';
import { DashboardStatus } from './Status';

export const Dashboard = () => {
  const { changeTab, changeDraft } = useContext(InitialContext);
  const { categories } = useContextSelector(
    InterfacesContext,
    ({ categories }) => ({ categories })
  );

  const draft = useAsyncRetry(async () => {
    const data = await callBackendBasic(
      Messages.GET_LATEST_DRAFT,
      undefined,
      undefined,
      undefined,
      undefined,
      true
    );

    return data?.data?.draft;
  }, []);

  const interfacesCount = useAsyncRetry<number>(async () => {
    const data = await callBackendBasic(
      Messages.GET_TOTAL_OBJECT_COUNT,
      undefined,
      undefined,
      undefined,
      undefined,
      true
    );

    return data?.data;
  }, []);

  const theme: IReqoreCustomTheme = { main: '#000000' };

  if (draft.loading || interfacesCount.loading) {
    return (
      <ReqorePanel
        flat
        contentStyle={{
          display: 'flex',
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        fill
      >
        <Loader centered text='Loading dashboard...' />
      </ReqorePanel>
    );
  }

  return (
    <ReqorePanel
      flat
      fill
      rounded={false}
      contentEffect={{
        gradient: {
          type: 'radial',
          colors: {
            0: '#222222',
            100: '#111111',
          },
        },
      }}
      contentStyle={{ maxWidth: '1280px', margin: '0 auto' }}
    >
      <ReqoreColumns
        minColumnWidth='100%'
        columnsGap='10px'
        maxColumnWidth='1024px'
      >
        <DashboardQogPanel />

        <ReqoreColumns columnsGap='10px'>
          <DashboardQogLog />
          <DashboardDrafts />
        </ReqoreColumns>
        <ReqoreColumns
          minColumnWidth='100%'
          columnsGap='10px'
          maxColumnWidth='1024px'
        >
          <ReqoreColumns columnsGap='10px' style={{ gridAutoRows: 'auto' }}>
            <ReqoreColumns
              columnsGap='10px'
              minColumnWidth='150px'
              style={{ gridAutoRows: 'auto' }}
            >
              <ReqorePanel
                minimal
                customTheme={theme}
                label='Tip of the day'
                icon='LightbulbFill'
                contentEffect={{
                  gradient: {
                    direction: 'to right bottom',
                    colors: {
                      0: 'main',
                      100: '#031234',
                    },
                    animate: 'hover',
                    animationSpeed: 5,
                  },
                }}
                contentStyle={{
                  display: 'flex',
                  flexFlow: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <ReqoreTextEffect
                  effect={{
                    opacity: 0.8,
                    textAlign: 'center',
                    textSize: '15px',
                    gradient: {
                      colors: {
                        0: '#ffffff',
                        100: '#8fbcff',
                      },
                      animationSpeed: 5,
                      animate: 'always',
                    },
                  }}
                >
                  Did you know that you can clone an interface by clicking on
                  the clone button{' '}
                  <ReqoreIcon size='tiny' icon='FileCopyLine' color='#ffffff' />{' '}
                  in the interface view?
                </ReqoreTextEffect>
              </ReqorePanel>
              <ReqoreColumns
                columnsGap='10px'
                minColumnWidth='100%'
                style={{ gridAutoRows: 'auto' }}
              >
                <ReqorePanel
                  customTheme={theme}
                  contentStyle={{
                    display: 'flex',
                    flexFlow: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  contentEffect={{
                    gradient: {
                      type: 'radial',
                      shape: 'ellipse',
                      //direction: 'to right bottom',
                      colors: {
                        100: 'main',
                        0: '#2d1254',
                      },
                      animate: 'hover',
                      animationSpeed: 5,
                    },
                  }}
                  onClick={() => changeTab('Interfaces')}
                >
                  <ReqoreTextEffect
                    effect={{
                      textAlign: 'center',
                      textSize: '20px',
                      weight: 'bold',
                    }}
                  >
                    Browse All <br />{' '}
                    <ReqoreTextEffect
                      effect={{
                        gradient: {
                          colors: {
                            0: '#1e4d9f',
                            50: '#bb33ff',
                            100: '#ff8c00',
                          },
                          animationSpeed: 5,
                          animate: 'always',
                        },
                        textSize: '20px',
                        weight: 'thick',
                      }}
                    >
                      {interfacesCount.value.toString()}
                    </ReqoreTextEffect>{' '}
                    Objects
                  </ReqoreTextEffect>
                </ReqorePanel>
                <ReqorePanel
                  customTheme={theme}
                  fill
                  contentStyle={{
                    display: 'flex',
                    flexFlow: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onClick={() => {}}
                  contentEffect={{
                    interactive: true,
                    gradient: {
                      direction: 'to right bottom',
                      colors: {
                        0: 'main',

                        200: '#66efd8',
                      },
                      animate: 'hover',
                      animationSpeed: 5,
                    },
                  }}
                  tooltip={{
                    delay: 0.1,
                    handler: 'click',
                    noWrapper: true,
                    useTargetWidth: true,
                    noArrow: true,
                    content: (
                      <ReqoreMenu customTheme={{ main: '#0d476e' }} rounded>
                        {map(categories, (category, categoryName) => (
                          <ReqoreMenuItem
                            icon={interfaceIcons[categoryName]}
                            leftIconProps={{
                              icon: interfaceIcons[categoryName],
                              image: interfaceImages[categoryName],
                            }}
                            key={categoryName}
                            onClick={() =>
                              changeTab('CreateInterface', categoryName)
                            }
                          >
                            {category.singular_display_name}
                          </ReqoreMenuItem>
                        ))}
                      </ReqoreMenu>
                    ),
                  }}
                >
                  <ReqoreTextEffect
                    effect={{
                      textAlign: 'center',
                      textSize: '20px',
                      weight: 'bold',
                    }}
                  >
                    <ReqoreIcon icon='AddFill' margin='right' /> Create{' '}
                    <ReqoreTextEffect
                      effect={{
                        gradient: {
                          colors: {
                            0: '#38ee7e',
                            50: '#66efd8',
                            100: '#09d506',
                          },
                          animationSpeed: 5,
                          animate: 'always',
                        },
                        textSize: '20px',
                        weight: 'thick',
                      }}
                    >
                      New
                    </ReqoreTextEffect>
                    <ReqoreIcon icon='ArrowDownSFill' margin='left' />
                  </ReqoreTextEffect>
                </ReqorePanel>
              </ReqoreColumns>
              <DashboardStatus />
            </ReqoreColumns>
          </ReqoreColumns>
        </ReqoreColumns>
      </ReqoreColumns>
    </ReqorePanel>
  );
};
