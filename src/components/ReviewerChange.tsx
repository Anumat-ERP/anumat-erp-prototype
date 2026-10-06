import { useEffect, useState } from "react";
import { Banner, Field, Modal, Select, Textarea, useToast } from "@app/ui";
import { useStore } from "../data/store";
import { appPeople, canContributeToApp } from "../lib/appAccess";
import { reviewerChangeProblem } from "../lib/approvalDelegation";
import { useLocale } from "../i18n/LocaleProvider";
export function ReviewerChange({
  requestId,
  open,
  onOpenChange,
}: {
  requestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { state, dispatch } = useStore();
  const { t: tr } = useLocale();
  const { toast } = useToast();
  const [reviewer, setReviewer] = useState("");
  const [reason, setReason] = useState("");
  const [revision, setRevision] = useState("");
  const [error, setError] = useState<string>();
  const request = state.requests.find((r) => r.id === requestId);
  const current = request?.steps.find((s) => s.status === "current");
  useEffect(() => {
    if (open) {
      setReviewer("");
      setReason("");
      setError(undefined);
      setRevision(request?.updatedAt ?? "");
    }
  }, [open, requestId]);
  const submit = () => {
    const problem = reviewerChangeProblem(
      state,
      requestId,
      reviewer,
      reason,
      revision,
    );
    if (problem) {
      setError(problem);
      return;
    }
    dispatch({
      type: "changeReviewer",
      requestId,
      personId: reviewer,
      reason,
      expectedUpdatedAt: revision,
    });
    onOpenChange(false);
    toast({ title: tr("Reviewer changed") });
  };
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={tr("Change reviewer")}
      description={tr(
        "Hand this review to an eligible teammate. The original submission and change reason stay in its history.",
      )}
      primaryAction={{
        content: tr("Confirm reviewer change"),
        onAction: submit,
      }}
      secondaryActions={[
        {
          content: tr("Keep current reviewer"),
          onAction: () => onOpenChange(false),
        },
      ]}
    >
      <div className="flex flex-col gap-5">
        {error && <Banner tone="critical">{tr(error)}</Banner>}
        <Field label={tr("New reviewer")} required>
          <Select
            value={reviewer}
            onChange={(e) => setReviewer(e.target.value)}
            options={[
              { value: "", label: tr("Choose a reviewer") },
              ...appPeople(state, "approvals")
                .filter(
                  (p) =>
                    p.id !== request?.requesterId &&
                    p.id !== current?.approverId &&
                    canContributeToApp(state, "approvals", p.id),
                )
                .map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        </Field>
        <Field label={tr("Reason for reviewer change")} required>
          <Textarea
            rows={3}
            maxLength={1000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
