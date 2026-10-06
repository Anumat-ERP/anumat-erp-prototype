import type { StorybookConfig } from '@storybook/react-vite';
const config: StorybookConfig = {
  stories: ['../src/stories/**/*.mdx', '../src/stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: '@storybook/react-vite',
  core: { disableTelemetry: true },
  async viteFinal(config) {
    // Reuse Vite's aliases and Tailwind; app deployment chunk rules do not belong to the docs build.
    config.base = './';
    if (config.build?.rollupOptions?.output) config.build.rollupOptions.output = undefined;
    return config;
  },
};
export default config;
