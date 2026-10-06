import type { Meta, StoryObj } from "@storybook/react-vite";
import { App } from "../../App";
const meta = {
  title: "Apps/Workspace foundation",
  component: App,
  parameters: {
    layout: "fullscreen",
    hr: true,
    docs: {
      description: {
        component:
          "Personal work and company setup, owner backup/recovery and personal notification simulation. Uses production routes with fictional in-memory records. File bytes are excluded from JSON backups. No external messages are sent.",
      },
    },
  },
} satisfies Meta<typeof App>;
export default meta;
type Story = StoryObj<typeof meta>;
export const MyWork: Story = { parameters: { route: "/work" } };
export const MyWorkMember: Story = {
  parameters: { route: "/work", role: "member" },
};
export const MyWorkEmpty: Story = {
  parameters: { route: "/work", empty: true },
};
export const CompanySettings: Story = {
  parameters: { route: "/settings/company" },
};
export const CompanySettingsReadOnly: Story = {
  parameters: { route: "/settings/company", role: "member" },
};
export const CompanySettingsKhmerDark: Story = {
  parameters: { route: "/settings/company" },
  globals: { locale: "km", theme: "dark" },
};
export const WorkspaceData: Story = { parameters: { route: "/settings/data" } };
export const WorkspaceDataOwnerRequired: Story = {
  parameters: { route: "/settings/data", role: "member" },
};
export const DeliveryPreviews: Story = {
  parameters: { route: "/settings/delivery" },
};
