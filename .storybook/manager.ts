import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';
addons.setConfig({ theme: create({ base: 'light', brandTitle: 'Anumat · UI Library', colorPrimary: '#087ba7', colorSecondary: '#087ba7', fontBase: 'Inter, sans-serif' }) });
