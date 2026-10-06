import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from '../../ui';

const meta = { title: 'Components/Content/Text', component: Text, args: { children: 'Work is clearer when ownership is visible.', variant: 'body' }, parameters: { docs: { description: { component: '' } } } } satisfies Meta<typeof Text>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Display: Story = { args: { variant: 'display' } };
export const Heading: Story = { args: { variant: 'heading' } };
export const Title: Story = { args: { variant: 'title' } };
export const Subtitle: Story = { args: { variant: 'subtitle' } };
export const Caption: Story = { args: { variant: 'caption' } };
export const Label: Story = { args: { variant: 'label' } };
export const Mono: Story = { args: { variant: 'mono' } };
export const Muted: Story = { args: { tone: 'muted' } };
export const Critical: Story = { args: { tone: 'critical' } };
export const Numeric: Story = { args: { numeric: true, children: '1,234.50' } };
