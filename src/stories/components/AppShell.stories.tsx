import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AppShell, Navigation, Button, PageHeader, EmptyState } from '../../ui';
function Demo() { return <AppShell sidebarHeader={<strong>Anumat</strong>} navigation={<Navigation sections={[{items:[{label:"Tasks",href:"#tasks",selected:true}]}]} />} breadcrumb="Task management" topBar={<Button>Account</Button>}><PageHeader title="Tasks" subtitle="The workspace shell handles desktop and mobile navigation." /><EmptyState heading="Plan your first task" image={null} /></AppShell>; }
const meta = {title:'Components/Navigation/AppShell', component: Demo, parameters: {docs: {description: {component: 'Use Apps stories for the full production sidebar and app context.'}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
