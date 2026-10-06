import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SidebarProvider, SidebarTrigger, SidebarExpanded } from '../../ui';
function Demo() { return <SidebarProvider><div className="story-row"><SidebarTrigger /><SidebarExpanded>Expanded sidebar content</SidebarExpanded></div></SidebarProvider>; }
const meta = {title:'Components/Navigation/Sidebar', component: Demo, parameters: {docs: {description: {component: ''}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
