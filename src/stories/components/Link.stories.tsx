import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Link } from '../../ui';
function Demo() { return <Link href="#usage">Read usage guidance</Link>; }
const meta = {title:'Components/Navigation/Link', component: Demo, parameters: {docs: {description: {component: ''}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
