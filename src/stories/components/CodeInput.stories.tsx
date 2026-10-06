import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { CodeInput } from '../../ui';
function Demo({invalid=false,disabled=false}) { const [value,setValue]=useState(""); return <CodeInput label="Verification code" value={value} onChange={setValue} invalid={invalid} disabled={disabled} />; }
const meta = {title:'Components/Forms/CodeInput', component: Demo, parameters: {docs: {description: {component: 'Six-digit input supports paste and keyboard navigation.'}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Invalid: Story = {args:{invalid:true}};
export const Disabled: Story = {args:{disabled:true}};
