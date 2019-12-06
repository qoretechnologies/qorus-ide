import React, { FunctionComponent } from 'react';
import InterfaceCreatorPanel, { ContentWrapper, ActionsWrapper, IField } from './panel';
import compose from 'recompose/compose';
import withTextContext from '../../hocomponents/withTextContext';
import { TTranslator } from '../../App';
import styled from 'styled-components';
import withFieldsConsumer from '../../hocomponents/withFieldsConsumer';
import { omit } from 'lodash';
import { MapperContext } from '../../context/mapper';
import MapperCreator from '../Mapper';
import withInitialDataConsumer from '../../hocomponents/withInitialDataConsumer';
import { Callout } from '@blueprintjs/core';

export const CreatorWrapper = styled.div`
    display: flex;
    flex: 1;
    flex-flow: row;
    overflow: hidden;
`;

export interface IMapperViewProps {
    t: TTranslator;
    mapper: any;
    isFormValid: (type: string) => boolean;
}

const MapperView: FunctionComponent<IMapperViewProps> = ({
    t,
    isFormValid,
    selectedFields,
    initialData: { mapper, qorus_instance, changeInitialData },
}) => {
    if (!qorus_instance) {
        return (
            <Callout title={t('MapperNoInstanceTitle')} icon="warning-sign" intent="warning">
                {t('MapperNoInstance')}
            </Callout>
        );
    }

    return (
        <MapperContext.Consumer>
            {({ showMapperConnections, setShowMapperConnections }) => (
                <>
                    {!showMapperConnections && (
                        <CreatorWrapper>
                            <InterfaceCreatorPanel
                                type={'mapper'}
                                submitLabel={t('Next')}
                                onSubmit={() => {
                                    setShowMapperConnections(true);
                                }}
                                data={mapper && omit(mapper, ['connections'])}
                                isEditing={!!mapper}
                                onDataFinishLoading={
                                    mapper && mapper.show_diagram
                                        ? () => {
                                              setShowMapperConnections(true);
                                          }
                                        : null
                                }
                            />
                        </CreatorWrapper>
                    )}
                    {showMapperConnections && (
                        <MapperCreator
                            onBackClick={() => {
                                setShowMapperConnections(false);
                                changeInitialData('mapper.show_diagram', false);
                            }}
                            isFormValid={isFormValid('mapper')}
                            methods={selectedFields.mapper.find((field: IField) => field.name === 'functions')?.value}
                        />
                    )}
                </>
            )}
        </MapperContext.Consumer>
    );
};

export default compose(withTextContext(), withFieldsConsumer(), withInitialDataConsumer())(MapperView);
