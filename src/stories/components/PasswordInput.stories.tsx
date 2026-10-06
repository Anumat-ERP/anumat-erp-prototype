import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field, PasswordInput } from '../../ui';
function Demo() { return <Field label="Password"><PasswordInput defaultValue="demo-password" /></Field>; }
const meta = {title:'Components/Forms/PasswordInput', component: Demo, parameters: {docs: {description: {component: ''}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
