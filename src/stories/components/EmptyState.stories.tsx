import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyState } from '../../ui';
import { Button } from '../../ui';
const meta = { title: 'Components/Feedback/EmptyState', component: EmptyState, args: { heading: 'No tasks yet', children: 'Create a task to plan your work.', action: <Button variant="primary">Create task</Button> }, parameters: { docs: { description: { component: '' } } } } satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Filtered: Story = { args: { heading: 'No tasks match', children: 'Try another search or clear the filters.', action: <Button>Clear filters</Button> } };
export const Compact: Story = { args: { size: 'card', image: null } };
