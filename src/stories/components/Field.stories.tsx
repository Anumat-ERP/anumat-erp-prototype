import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field, Input } from '../../ui';
function Demo({error=false, disabled=false, floating=false}) { return <Field label="Task title" required disabled={disabled} floating={floating} helpText="Describe the work in a few words." error={error ? 'Enter a task title.' : undefined}><Input placeholder="Prepare onboarding" /></Field>; }
const meta = {title:'Components/Forms/Field', component: Demo, parameters: {docs: {description: {component: 'Field links labels, help text and errors to its control.'}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Error: Story = {args:{error:true}};
export const Disabled: Story = {args:{disabled:true}};
export const Floating: Story = {args:{floating:true}};
