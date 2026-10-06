import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SelectionCheckbox } from '../../ui/components/selection-checkbox';
function Demo({mixed=false}) { const [checked,setChecked]=useState(false); return <SelectionCheckbox label="Select all tasks" checked={mixed ? "indeterminate" : checked} onCheckedChange={setChecked} />; }
const meta = {title:'Components/Forms/SelectionCheckbox', component: Demo, parameters: {docs: {description: {component: ''}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Indeterminate: Story = {args:{mixed:true}};
