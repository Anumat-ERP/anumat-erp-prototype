import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Banner,
  Button,
  Card,
  Field,
  Input,
  Modal,
  PageHeader,
  useToast,
} from "@app/ui";
import { useStore } from "../data/store";
import type { DataState } from "../data/types";
import { readWorkspaceBackup, workspaceBackup } from "../lib/workspaceBackup";
import { useLocale } from "../i18n/LocaleProvider";
export function WorkspaceData() {
  const { activeWorkspace, me } = useStore();
  return <WorkspaceDataForm key={`${activeWorkspace}-${me.id}`} />;
}
function WorkspaceDataForm() {
  const { state, me, activeWorkspace, workspaces, dispatch } = useStore();
  const { t: tr } = useLocale();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [snapshot, setSnapshot] = useState<DataState>();
  const [error, setError] = useState<string>();
  const [reading, setReading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const owner = me.access === "owner";
  const download = () => {
    if (!owner) return;
    const blob = new Blob([workspaceBackup(state)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `anumat-${state.org.name.replace(
      /[^\p{L}\p{N}_-]+/gu,
      "-",
    )}-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast({ title: tr("Local backup downloaded") });
  };
  return (
    <>
      <PageHeader
        title={tr("Workspace data")}
        subtitle={tr(
          "Back up, restore, or remove this company’s browser-local records.",
        )}
      />
      <Banner title={tr("Local prototype data")}>
        {tr(
          "Backups contain this company’s records and settings. Uploaded file bytes are not included; keep the original files. Nothing is uploaded to a server.",
        )}
      </Banner>
      {!owner && (
        <Banner title={tr("Owner access required")}>
          {tr(
            "Only the workspace owner can export, restore, or remove a company.",
          )}
        </Banner>
      )}
      {owner && (
        <>
          <Card className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">
              {tr("Download a local backup")}
            </h2>
            <p>
              {tr(
                "Keep a copy before changing demo data. Backups can contain personal and compensation fields.",
              )}
            </p>
            <Button className="self-start" onClick={download}>
              {tr("Download workspace backup")}
            </Button>
          </Card>
          <Card className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">
              {tr("Restore as a separate company")}
            </h2>
            <p>
              {tr(
                "Review a versioned Anumat backup, then create a restored copy. Existing companies stay available.",
              )}
            </p>
            <Field
              label={tr("Anumat backup file")}
              error={error ? tr(error) : undefined}
            >
              <Input
                type="file"
                accept=".json,application/json"
                disabled={reading}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  setSnapshot(undefined);
                  setError(undefined);
                  if (!file) return;
                  if (file.size > 10 * 1024 * 1024) {
                    setError("Choose an Anumat backup smaller than 10 MB.");
                    return;
                  }
                  setReading(true);
                  try {
                    setSnapshot(readWorkspaceBackup(await file.text()));
                  } catch {
                    setError(
                      "This is not a supported Anumat workspace backup.",
                    );
                  } finally {
                    setReading(false);
                    event.target.value = "";
                  }
                }}
              />
            </Field>
            {reading && <p role="status">{tr("Reading backup…")}</p>}
            {snapshot && (
              <div className="flex flex-col gap-4">
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">
                      {tr("Company")}
                    </dt>
                    <dd className="font-medium">{snapshot.org.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">
                      {tr("Records")}
                    </dt>
                    <dd>
                      {tr(
                        "{employees} employees · {tasks} tasks · {requests} requests",
                        {
                          employees: snapshot.hr?.employees.length ?? 0,
                          tasks: snapshot.tasks.length,
                          requests: snapshot.requests.length,
                        },
                      )}
                    </dd>
                  </div>
                </dl>
                <Button
                  variant="primary"
                  className="self-start"
                  onClick={() => {
                    dispatch({ type: "restoreWorkspace", snapshot });
                    navigate("/work");
                    toast({ title: tr("Restored a separate company") });
                  }}
                >
                  {tr("Restore company copy")}
                </Button>
              </div>
            )}
          </Card>
          <Card className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">
              {tr("Remove this local company")}
            </h2>
            <p>
              {tr(
                "Remove its records from this browser. Other companies, downloaded backups, and saved files remain.",
              )}
            </p>
            <Button
              variant="critical"
              className="self-start"
              disabled={workspaces.length < 2}
              onClick={() => setRemoving(true)}
            >
              {tr("Remove local company")}
            </Button>
            {workspaces.length < 2 && (
              <p className="text-sm text-muted-foreground">
                {tr("Create another company before removing the last one.")}
              </p>
            )}
          </Card>
        </>
      )}
      <Modal
        open={removing}
        onOpenChange={(open) => {
          setRemoving(open);
          if (!open) setConfirmation("");
        }}
        title={tr("Remove local company?")}
        description={tr(
          "Type the company name to confirm removal from this browser.",
        )}
        primaryAction={{
          content: tr("Remove company records"),
          destructive: true,
          disabled: confirmation !== state.org.name,
          onAction: () => {
            if (
              confirmation !== state.org.name ||
              !owner ||
              workspaces.length < 2
            )
              return;
            dispatch({
              type: "removeWorkspace",
              id: activeWorkspace,
              name: confirmation,
            });
            navigate("/discover");
            toast({ title: tr("Local company removed") });
          },
        }}
        secondaryActions={[
          { content: tr("Keep company"), onAction: () => setRemoving(false) },
        ]}
      >
        <Field label={tr("Company name")} helpText={state.org.name}>
          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            autoComplete="off"
          />
        </Field>
      </Modal>
    </>
  );
}
