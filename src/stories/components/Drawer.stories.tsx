import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Drawer, Button, Field, Textarea } from '../../ui';
function Demo() { return <Drawer trigger={<Button>Open task details</Button>} title="Prepare onboarding" description="Task · High priority"><Field label="Expected outcome"><Textarea defaultValue="Every new starter can access their tools." /></Field></Drawer>; }
const meta = {title:'Components/Overlays/Drawer', component: Demo, parameters: {docs: {description: {component: ''}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
