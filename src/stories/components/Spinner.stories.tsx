import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Spinner } from '../../ui/components/spinner';
function Demo() { return <div className="story-row"><Spinner size="sm" label="Loading tasks" /><Spinner size="md" label="Loading" /><Spinner size="lg" label="Loading workspace" /></div>; }
const meta = {title:'Components/Feedback/Spinner', component: Demo, parameters: {docs: {description: {component: ''}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
