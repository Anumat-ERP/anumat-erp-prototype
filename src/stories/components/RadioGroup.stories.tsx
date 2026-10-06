import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '../../ui';
function Demo({disabled=false}) { return <RadioGroup legend="Answer privacy" defaultValue="anonymous" disabled={disabled}><RadioGroupItem value="anonymous" label="Anonymous" /><RadioGroupItem value="named" label="Named" /></RadioGroup>; }
const meta = {title:'Components/Forms/RadioGroup', component: Demo, parameters: {docs: {description: {component: ''}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = {args:{disabled:true}};
