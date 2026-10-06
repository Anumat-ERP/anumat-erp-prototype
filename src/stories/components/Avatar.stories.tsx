import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../../ui';

const meta = { title: 'Components/Content/Avatar', component: Avatar, args: { name: 'Dara Sok' }, parameters: { docs: { description: { component: '' } } } } satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Small: Story = { args: { size: 'sm' } };
export const Large: Story = { args: { size: 'xl' } };
export const Square: Story = { args: { shape: 'square' } };
export const Unknown: Story = { args: { name: '' } };
export const Decorative: Story = { args: { decorative: true } };
