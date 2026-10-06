import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '../../ui';
import { CardHeader } from '../../ui';
const meta = { title: 'Components/Content/Card', component: Card, args: { children: <><CardHeader title="Sprint 1" description="October delivery plan" /><p>Keep related information together.</p></> }, parameters: { docs: { description: { component: '' } } } } satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Muted: Story = { args: { tone: 'muted' } };
export const Flush: Story = { args: { flush: true } };
