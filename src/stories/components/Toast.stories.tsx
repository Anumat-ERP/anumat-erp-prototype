import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button, useToast } from '../../ui';
function Demo() { const {toast,dismiss}=useToast(); return <div className="story-row"><Button onClick={()=>toast({title:"Task saved",tone:"success"})}>Success toast</Button><Button onClick={()=>toast({title:"Unable to save",description:"Check required fields.",tone:"critical"})}>Error toast</Button><Button onClick={()=>dismiss()}>Dismiss all</Button></div>; }
const meta = {title:'Components/Feedback/Toast', component: Demo, parameters: {docs: {description: {component: ''}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
