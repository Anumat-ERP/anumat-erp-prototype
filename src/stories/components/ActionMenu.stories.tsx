import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ActionMenu, Button } from '../../ui';
function Demo() { const [last,setLast]=useState("No action yet"); return <div className="story-stack"><ActionMenu trigger={<Button>Task actions</Button>} items={[{content:"Edit",onAction:()=>setLast("Edit selected")},{content:"Duplicate",onAction:()=>setLast("Duplicate selected")},{content:"Delete",destructive:true,onAction:()=>setLast("Delete selected")},{content:"Archive",disabled:true}]} /><p role="status">{last}</p></div>; }
const meta = {title:'Components/Actions/ActionMenu', component: Demo, parameters: {docs: {description: {component: ''}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
