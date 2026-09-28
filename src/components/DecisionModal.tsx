import { Field, Modal, Text, Textarea } from '@repo/ui';
import { useState } from 'react';

export type Decision = 'approve' | 'changes' | 'decline';

const COPY: Record<Decision, { title: string; action: string; label: string; help: string; required: boolean }> = {
  approve: {
    title: 'Approve this request?',
    action: 'Approve',
    label: 'Comment',
    help: 'Optional. The requester and the next approver see it.',
    required: false,
  },
  changes: {
    title: 'Request changes',
    action: 'Send back',
    label: 'What needs to change?',
    help: 'The request goes back to the requester with your note.',
    required: true,
  },
  decline: {
    title: 'Decline this request?',
    action: 'Decline',
    label: 'Reason',
    help: 'The requester sees this. The request is closed and cannot be resubmitted.',
    required: true,
  },
};

/** Confirms a decision on the current approval step, with an optional or required comment. */
export function DecisionModal({
  decision,
  requestTitle,
  nextStep,
  onClose,
  onConfirm,
}: {
  decision: Decision | null;
  requestTitle: string;
  nextStep?: string;
  onClose: () => void;
  onConfirm: (decision: Decision, comment: string) => void;
}) {
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string>();
  const copy = decision ? COPY[decision] : COPY.approve;

  const close = () => {
    setComment('');
    setError(undefined);
    onClose();
  };
  const confirm = () => {
    if (!decision) return;
    if (copy.required && !comment.trim()) {
      setError(decision === 'changes' ? 'Say what needs to change, so the requester can fix it.' : 'Give a reason for declining.');
      return;
    }
    onConfirm(decision, comment.trim());
    close();
  };

  return (
    <Modal
      open={decision !== null}
      onOpenChange={(open) => (open ? undefined : close())}
      title={copy.title}
      description={requestTitle}
      primaryAction={{ content: copy.action, onAction: confirm, destructive: decision === 'decline' }}
      secondaryActions={[{ content: 'Cancel', onAction: close }]}
    >
      <div className="flex flex-col gap-4">
        {decision === 'approve' ? (
          <Text tone="muted">{nextStep ? `It moves on to ${nextStep}.` : 'This is the last step, so the request will be approved.'}</Text>
        ) : null}
        <Field label={copy.label} helpText={copy.help} required={copy.required} optional={!copy.required} error={error}>
          <Textarea
            rows={3}
            autoGrow
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (error) setError(undefined);
            }}
          />
        </Field>
      </div>
    </Modal>
  );
}
