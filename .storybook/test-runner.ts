import type { TestRunnerConfig } from '@storybook/test-runner';

const config: TestRunnerConfig = {
  logLevel: 'info',
  async preVisit(page) {
    if (await page.evaluate(() => !('takeScreenshot' in window))) {
      await page.exposeBinding('takeScreenshot', async ({ page }) => {
        const image = await page.locator('#storybook-root').screenshot();
        return image.toString('base64');
      });
    }
  },
};

export default config;
