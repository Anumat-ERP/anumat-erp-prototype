import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from '../../ui';

const meta = { title: 'Components/Content/Divider', component: Divider, args: {}, parameters: { docs: { description: { component: '' } } } } satisfies Meta<typeof Divider>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
