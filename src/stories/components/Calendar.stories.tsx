import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Calendar } from '../../ui';
function Demo() { const [date,setDate]=useState<Date|undefined>(new Date(2026,9,12)); return <Calendar mode="single" selected={date} onSelect={setDate} defaultMonth={new Date(2026,9,1)} />; }
const meta = {title:'Components/Forms/Calendar', component: Demo, parameters: {docs: {description: {component: ''}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
