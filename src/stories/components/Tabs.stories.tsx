import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui';
function Demo() { return <Tabs defaultValue="list"><TabsList><TabsTrigger value="list">List</TabsTrigger><TabsTrigger value="board" badge={3}>Board</TabsTrigger><TabsTrigger value="archived" disabled>Archived</TabsTrigger></TabsList><TabsContent value="list">Task list content</TabsContent><TabsContent value="board">Task board content</TabsContent></Tabs>; }
const meta = {title:'Components/Navigation/Tabs', component: Demo, parameters: {docs: {description: {component: ''}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
