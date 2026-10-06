import type { Meta, StoryObj } from '@storybook/react-vite';
import { App } from '../../App';
const meta = {
  title: 'Apps/HR lifecycle',
  component: App,
  parameters: {
    layout: 'fullscreen',
    hr: true,
    docs: {
      description: {
        component:
          'Connected local HR workflows using the production shell and shared controls. Fictional data is isolated from browser storage. Payroll is illustrative. Permission, empty, long-content, and Khmer surfaces use actual application behavior.',
      },
    },
  },
} satisfies Meta<typeof App>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Employees: Story = { parameters: { route: '/employees' } };
export const EmployeeDetails: Story = {
  parameters: { route: '/employees?record=hr-alex' },
};
export const EmployeeSelfService: Story = {
  parameters: { route: '/employees?record=hr-alex', role: 'member' },
};
export const EmployeeViewer: Story = {
  parameters: { route: '/employees', role: 'viewer' },
};
export const EmployeeEmpty: Story = {
  parameters: { route: '/employees', empty: true },
};
export const EmployeeKhmerDark: Story = {
  parameters: { route: '/employees' },
  globals: { locale: 'km', theme: 'dark' },
};
export const EmployeePeople: Story = {
  parameters: { route: '/employees/people' },
};
export const Leave: Story = { parameters: { route: '/employees?tab=leaves' } };
export const Recruitment: Story = { parameters: { route: '/recruitment' } };
export const CandidateDetails: Story = {
  parameters: { route: '/recruitment?tab=applications&record=hr-application' },
};
export const Attendance: Story = { parameters: { route: '/attendance' } };
export const AttendancePeriods: Story = {
  parameters: { route: '/attendance?tab=attendancePeriods' },
};
export const PayrollPreview: Story = { parameters: { route: '/payroll' } };
export const Performance: Story = { parameters: { route: '/performance' } };
export const Training: Story = { parameters: { route: '/training' } };
export const CourseDetails: Story = {
  parameters: { route: '/training?record=hr-course' },
};
export const Enrollments: Story = {
  parameters: { route: '/training?tab=enrollments' },
};
export const Assets: Story = { parameters: { route: '/assets' } };
export const RoomReservations: Story = {
  parameters: { route: '/assets?tab=reservations' },
};
export const Reports: Story = { parameters: { route: '/reports' } };
export const EmployeeDashboard: Story = {
  parameters: { route: '/home?app=employees' },
};
export const PayrollDashboard: Story = {
  parameters: { route: '/home?app=payroll' },
};
