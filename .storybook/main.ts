const config = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-mdx-gfm',
    '@chromaui/addon-visual-tests',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  features: {
    interactionsDebugger: true,
  },
  typescript: { reactDocgen: false },
  env: (config) => ({
    ...config,
    NODE_ENV: 'storybook',
    BROWSER: 'chrome',
    REACT_APP_QORUS_TOKEN: '2f58cd78-a400-4d98-8de2-90fbaa6f805d',
  }),
  webpackFinal: async (config) => {
    return {
      ...config,
      experiments: {
        ...config.experiments,
        topLevelAwait: true,
      },
    };
  },
  refs: {
    reqore: {
      title: 'ReQore',
      url: 'https://reqore.qoretechnologies.com/',
    },
  },
};

export default config;
