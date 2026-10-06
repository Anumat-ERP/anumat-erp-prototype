import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SearchField } from '../../ui';
function Demo() { const [value,setValue]=useState(""); return <SearchField label="Search tasks" labelHidden={false} value={value} onChange={setValue} onClear={()=>setValue("")} />; }
const meta = {title:'Components/Forms/SearchField', component: Demo, parameters: {docs: {description: {component: ''}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
