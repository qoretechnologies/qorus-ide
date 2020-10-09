import { EditorView, VSBrowser, WebDriver, WebView, Workbench } from 'vscode-extension-tester';

import { setupWebview } from './common/utils';
import { checkFiles, editJob } from './tests/job';

describe('Edit job test', function () {
    this.timeout(1800000);
    let driver: WebDriver;
    let workbench: Workbench;
    let editorView: EditorView;
    const project_folder: string = process.env.PROJECT_FOLDER || '/builds/mirror/qorus-vscode/ui-test/test_project';

    before(async () => {
        driver = VSBrowser.instance.driver;
        workbench = new Workbench();
        editorView = new EditorView();
    });

    it('Edit job', () => editJob(workbench, editorView, project_folder));
    it('Check changed files', () => checkFiles(project_folder, 'changed_interfaces'));

    this.afterAll(async () => {
        editorView.closeAllEditors();
    });
});
