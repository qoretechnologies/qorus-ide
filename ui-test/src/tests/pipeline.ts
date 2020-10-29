import { expect } from 'chai';
import * as path from 'path';
import { WebView } from 'vscode-extension-tester';
import { projectFolder, sleep } from '../utils/common';
import { compareWithGoldFiles } from '../utils/files';
import { addQueue, createPipelineElement } from '../utils/pipeline';
import {
    addAndFillTextOption,
    clickElement,
    fillTextField,
    getElementsCount,
    getNthElement,
    getSelectedFields,
    rightClickElement,
    selectFromContextMenu,
    selectMultiselectItemsByNumbers,
    selectNthFolder,
    selectProviderData,
} from '../utils/webview';

export const openPipelinePage = async (webview: WebView) => {
    await sleep(2000);

    await clickElement(webview, 'CreateInterface');
    await clickElement(webview, 'Pipeline');

    await sleep(3000);

    expect(await getSelectedFields(webview)).to.have.length(5);
};

export const fillPipelineFields = async (webview: WebView) => {
    await sleep(1000);

    await selectNthFolder(webview, 'target_dir', 1);
    await fillTextField(webview, 'field-name', 'PipelineTest');
    await fillTextField(webview, 'field-desc', 'Pipeline test');
    await selectMultiselectItemsByNumbers(webview, [1]);
    await selectProviderData(webview, ['type', 'qore', 'string']);
    await addAndFillTextOption(webview, 'input_search_options', 'test: test');
    await clickElement(webview, 'pipeline-hide-metadata');
    await sleep(300);
};

export const createsPipelineElements = async (webview: WebView) => {
    await createPipelineElement(webview, 1, 'mapper', 'MapperForFSMTest:1.0');
    await createPipelineElement(webview, 2, 'queue');

    // If an element already has a queue as a child, only a queue can be added
    await rightClickElement(await getNthElement(webview, 'pipeline-element', 2));
    expect(await (await getNthElement(webview, `context-menu-item-1`)).getText()).to.eq('Add queue');

    // Elements with queue can only have another queue
    await addQueue(webview, 2);

    // Add incompatible mapper
    await createPipelineElement(webview, 4, 'mapper', 'MapperForFSMTest:1.0', true);

    // Add compatible processor
    await createPipelineElement(webview, 4, 'processor', 'ProcessorClassTest');
    await createPipelineElement(webview, 5, 'mapper', 'MapperForFSMTest:1.0');

    expect(await getElementsCount(webview, 'pipeline-element')).to.eq(6);
};

export const removesPipelineElementAndChildren = async (webview: WebView) => {
    await selectFromContextMenu(webview, 'pipeline-element', 4, 2);

    await sleep(500);

    expect(await getElementsCount(webview, 'pipeline-element')).to.eq(1);
};

export const undoPipelineToPreviousState = async (webview: WebView) => {
    await clickElement(webview, 'pipeline-undo');
    await sleep(500);
    expect(await getElementsCount(webview, 'pipeline-element')).to.eq(6);
};

export const submitPipelineAndCheckFiles = async (webview: WebView) => {
    await clickElement(webview, 'pipeline-submit');

    await sleep(4000);

    await compareWithGoldFiles(path.join(projectFolder, '_tests'), ['PipelineTest.qpipe.yaml'], undefined, (data) => {
        // Remove the RNG ids from the states
        const transformedData = { ...data };

        const removePid = (data: any) => {
            return data.reduce((newData: any, datum: any) => {
                delete datum.pid;

                if (!datum.children) {
                    return [...newData, datum];
                }

                return [
                    ...newData,
                    {
                        ...datum,
                        children: removePid(datum.children),
                    },
                ];
            }, []);
        };

        transformedData.children = removePid(transformedData.children);

        return transformedData;
    });
};
