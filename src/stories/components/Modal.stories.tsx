import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Modal, Button } from '../../ui';
function Demo({destructive=false}) { const [open,setOpen]=useState(false); return <Modal open={open} onOpenChange={setOpen} trigger={<Button>Open confirmation</Button>} title={destructive ? "Delete task?" : "Invite member"} description="This example changes no workspace data." primaryAction={{content:destructive ? "Delete task" : "Send invitation", destructive, onAction:()=>setOpen(false)}} secondaryActions={[{content:"Cancel",onAction:()=>setOpen(false)}]}><p>{destructive ? "This action removes the selected work item." : "App membership is separate from workspace membership."}</p></Modal>; }
const meta = {title:'Components/Overlays/Modal', component: Demo, parameters: {docs: {description: {component: 'Protected focus, Escape dismissal, and focus return. Use destructive confirmation for irreversible actions.'}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Destructive: Story = {args:{destructive:true}};
