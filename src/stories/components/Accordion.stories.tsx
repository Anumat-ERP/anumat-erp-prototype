import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../../ui';
function Demo() { return <Accordion type="single" collapsible><AccordionItem value="ready"><AccordionTrigger>Definition of Ready (DoR)</AccordionTrigger><AccordionContent>Confirm scope, dependencies, and ownership before starting.</AccordionContent></AccordionItem><AccordionItem value="done"><AccordionTrigger>Definition of Done (DoD)</AccordionTrigger><AccordionContent>Verify acceptance criteria and completion evidence.</AccordionContent></AccordionItem></Accordion>; }
const meta = {title:'Components/Content/Accordion', component: Demo, parameters: {docs: {description: {component: ''}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
