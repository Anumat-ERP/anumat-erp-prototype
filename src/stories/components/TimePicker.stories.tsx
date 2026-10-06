import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TimePicker } from '../../ui';
function Demo({disabled=false}) { const [value,setValue]=useState("09:30"); return <TimePicker label="Start time" value={value} disabled={disabled} onChange={e=>setValue(e.target.value)} />; }
const meta = {title:'Components/Forms/TimePicker', component: Demo, parameters: {docs: {description: {component: '24-hour time using shared selects; every minute is available.'}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = {args:{disabled:true}};
