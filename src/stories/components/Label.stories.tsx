import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Label } from '../../ui/components/label';
import { Input } from '../../ui';
function Demo() { return <div className="story-stack"><Label htmlFor="label-demo">Task title</Label><Input id="label-demo" /></div>; }
const meta = {title:'Components/Forms/Label', component: Demo, parameters: {docs: {description: {component: ''}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
