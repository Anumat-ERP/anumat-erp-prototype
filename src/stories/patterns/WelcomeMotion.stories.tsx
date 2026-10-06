import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorkspaceWelcomeMotion } from '../../components/WorkspaceWelcomeMotion';
import '../../styles/module-catalog.css';
const meta = { title: 'Patterns/Workspace welcome motion', component: WorkspaceWelcomeMotion, decorators: [(Story) => <div className="an-modules-intro"><div className="an-modules-intro-copy"><h1>Choose your workspace app</h1><p>A local, one-shot folder animation. Reduced motion and errors keep the static illustration.</p></div><Story /></div>], parameters: { docs: { description: { component: 'Document Folder by Leonard Rey Fernandez, adapted to Anumat mint/teal. Local asset under the Lottie Simple License. Plays once, pauses offscreen/when hidden, and preserves static fallback. Use OS/browser reduced motion to inspect automatic behavior.' } } } } satisfies Meta<typeof WorkspaceWelcomeMotion>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Animated: Story = {};
export const StaticFallback: Story = { args: { motion: 'static' } };
