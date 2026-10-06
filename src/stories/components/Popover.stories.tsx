import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent, Button, Select } from '../../ui';
function Demo() { return <Popover><PopoverTrigger asChild><Button>Filter by sprint</Button></PopoverTrigger><PopoverContent><p>Select the sprint scope.</p><Select aria-label="Sprint scope" options={[{value:"all",label:"All sprints"},{value:"one",label:"Sprint 1"}]} defaultValue="all" /></PopoverContent></Popover>; }
const meta = {title:'Components/Overlays/Popover', component: Demo, parameters: {docs: {description: {component: ''}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
