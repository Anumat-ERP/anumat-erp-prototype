import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Navigation } from '../../ui';
import { LayoutDashboard, ListTodo, Users } from 'lucide-react';
function Demo({collapsed=false}) { return <Navigation collapsed={collapsed} sections={[{title:"Task management",items:[{label:"Dashboard",href:"#dashboard",icon:<LayoutDashboard />},{label:"Tasks",href:"#tasks",selected:true,icon:<ListTodo />},{label:"People & roles",href:"#people",icon:<Users />},{label:"Reports",href:"#reports",disabled:true}]}]} />; }
const meta = {title:'Components/Navigation/Navigation', component: Demo, parameters: {docs: {description: {component: ''}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Collapsed: Story = {args:{collapsed:true}};
