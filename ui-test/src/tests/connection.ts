import { expect } from 'chai';
import * as path from 'path';
import { WebView } from 'vscode-extension-tester';
import { projectFolder, sleep } from '../utils/common';
import { compareWithGoldFiles } from '../utils/files';
import {
    addAndFillTextOption,
    clickElement,
    fillTextField,
    getSelectedFields,
    selectNthFilteredDropdownItem,
    selectNthFolder,
} from '../utils/webview';

export const opensConnectionPage = async (webview: WebView) => {
    await sleep(2000);

    await clickElement(webview, 'CreateInterface');
    await clickElement(webview, 'Connection');

    await sleep(3000);

    expect(await getSelectedFields(webview)).to.have.length(5);
};

export const fillsConnectionFields = async (webview: WebView) => {
    await sleep(1000);

    await selectNthFolder(webview, 'target_dir', 1);
    await fillTextField(webview, 'field-name', 'ConnectionTest');
    await fillTextField(webview, 'field-desc', 'Connection test');
    await selectNthFilteredDropdownItem(webview, 'protocol', 'http');
    await fillTextField(webview, 'field-address', 'google.com');
    await sleep(300);
    await addAndFillTextOption(webview, 'max_redirects', 5);
    await sleep(1000);
};

export const sumbitsConnectionAndChecksFiles = async (webview: WebView) => {
    await clickElement(webview, 'connection-submit');
    await sleep(4000);

    await compareWithGoldFiles(path.join(projectFolder, '_tests'), ['ConnectionTest.qconn.yaml']);
};
