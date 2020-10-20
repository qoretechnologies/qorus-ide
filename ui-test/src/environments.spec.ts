import { EditorView, VSBrowser, WebDriver, WebView, Workbench } from 'vscode-extension-tester';
import { addAndRemoveSourceDirectory, createNewSourceDir } from './tests/environments';
import { cleanup } from './utils/common';
import { setupWebview } from './utils/webview';

describe('Environments page test', function () {
    this.timeout(1800000);
    let driver: WebDriver;
    let workbench: Workbench;
    let editorView: EditorView;
    let webview: WebView;
    const project_folder: string = process.env.PROJECT_FOLDER || '/builds/mirror/qorus-vscode/ui-test/test_project';

    before(async () => {
        driver = VSBrowser.instance.driver;
        ({ workbench, editorView, webview } = await setupWebview());
    });

    /*it('Shows environment page', () => openEnvironmentPage(webview));
    it('Adds new environment', () => addEnvironment(webview));
    it('Deletes an environment', () => deleteEnvironment(webview));
    it('Renames an environment', () => renameEnvironment(webview));
    it('Adds new instance', () => addInstance(webview));
    it('Edits an instance', () => editInstance(webview));
    it('Deletes an instance', () => deleteInstance(webview));
    it('Adds new url', () => addUrl(webview));
    it('Deletes url', () => deleteUrl(webview));*/
    it('Adds and removes source directory', () => addAndRemoveSourceDirectory(webview));
    it('Creates new directory and adds it to sources', () => createNewSourceDir(webview));

    // Reset the workbench
    this.afterAll(async () => {
        await cleanup(editorView, webview);
    });
});
