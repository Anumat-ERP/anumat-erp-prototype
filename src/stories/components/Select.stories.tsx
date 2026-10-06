import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from '../../ui';

const meta = { title: 'Components/Forms/Select', component: Select, args: { 'aria-label': 'Priority', placeholder: 'Choose priority', options: [{value:'high',label:'High'}, {value:'medium',label:'Medium'}, {value:'low',label:'Low'}] }, parameters: { docs: { description: { component: 'The shared Radix select provides keyboard navigation and themed menus. Persist option values, not translated labels.' } } } } satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Selected: Story = { args: { defaultValue: 'medium' } };
export const Disabled: Story = { args: { disabled: true } };
export const Invalid: Story = { args: { invalid: true } };
export const Grouped: Story = { args: { options: [{label:'Planning',options:[{value:'epic',label:'Epic'},{value:'story',label:'Story'}]}, {label:'Delivery', options:[{value:'task',label:'Task'},{value:'bug',label:'Bug',disabled:true}]}] } };
