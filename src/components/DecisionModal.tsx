import { Field, Modal, Text, Textarea } from '@repo/ui';
import { useState } from 'react';
import type { FormField, FormValues } from '../data/types';
import { cleanValues, validateForm } from '../lib/forms';
import { FormRenderer, focusFirstError } from './forms/FormRenderer';

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
  fields = [],
}: {
  decision: Decision | null;
  requestTitle: string;
  nextStep?: string;
  onClose: () => void;
  onConfirm: (decision: Decision, comment: string, answers?: FormValues) => void;
  /** What the approver fills in at this step; asked only when approving. */
  fields?: FormField[];
}) {
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string>();
  const [answers, setAnswers] = useState<FormValues>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const asking = decision === 'approve' && fields.length > 0;
  const copy = decision ? COPY[decision] : COPY.approve;

  const close = () => {
    setComment('');
    setError(undefined);
    setAnswers({});
    setFieldErrors({});
    onClose();
  };
  const confirm = () => {
    if (!decision) return;
    if (asking) {
      const found = validateForm(fields, answers);
      setFieldErrors(found);
      if (Object.keys(found).length) {
        requestAnimationFrame(() => focusFirstError(fields, found, 'step'));
        return;
      }
    }
    if (copy.required && !comment.trim()) {
      setError(decision === 'changes' ? 'Say what needs to change, so the requester can fix it.' : 'Give a reason for declining.');
      return;
    }
    onConfirm(decision, comment.trim(), asking ? cleanValues(fields, answers) : undefined);
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
        {asking ? (
          <div className="flex flex-col gap-4 rounded-lg border border-border p-3 sm:p-4">
            <Text as="h3" variant="label">
              Your step asks for
            </Text>
            <FormRenderer
              fields={fields}
              values={answers}
              onChange={(v) => {
                setAnswers(v);
                if (Object.keys(fieldErrors).length) setFieldErrors(validateForm(fields, v));
              }}
              errors={fieldErrors}
              idPrefix="step"
            />
          </div>
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
