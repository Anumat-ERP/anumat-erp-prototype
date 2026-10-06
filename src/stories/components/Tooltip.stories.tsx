import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Tooltip, Button } from '../../ui';
function Demo() { return <Tooltip content="Completion requires verified evidence."><Button>Completion requirements</Button></Tooltip>; }
const meta = {title:'Components/Overlays/Tooltip', component: Demo, parameters: {docs: {description: {component: ''}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
