import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Tag, Button } from '../../ui';
function Demo() { const [visible,setVisible]=useState(true); return visible ? <Tag onRemove={()=>setVisible(false)}>Sprint 1</Tag> : <Button onClick={()=>setVisible(true)}>Restore tag</Button>; }
const meta = {title:'Components/Content/Tag', component: Demo, parameters: {docs: {description: {component: ''}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
