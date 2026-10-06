import { useState } from "react";
import { Link } from "react-router";
import {
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  Field,
  PageHeader,
  Select,
  useToast,
} from "@app/ui";
import { NOTIFICATION_APPS, prefsFor, useStore } from "../data/store";
import { appRole, APP_NAMES } from "../lib/appAccess";
import type { NotificationEvent, Channel } from "../data/types";
import { useLocale } from "../i18n/LocaleProvider";
export function DeliveryPreviews() {
  const { activeWorkspace, me } = useStore();
  return <DeliveryPreviewsForm key={`${activeWorkspace}-${me.id}`} />;
}
function DeliveryPreviewsForm() {
  const { state, me, dispatch } = useStore();
  const { t: tr } = useLocale();
  const { toast } = useToast();
  const prefs = prefsFor(state, me.id);
  const events = (Object.keys(NOTIFICATION_APPS) as NotificationEvent[]).filter(
    (event) => appRole(state, NOTIFICATION_APPS[event]),
  );
  const [event, setEvent] = useState<NotificationEvent>(events[0] ?? "tasks");
  const [channel, setChannel] = useState<Channel>("email");
  const [result, setResult] = useState<"failed" | "previewed">("failed");
  const destination =
    channel === "email" ? prefs.email : prefs.telegram?.username;
  const enabled = Boolean(
    destination &&
      prefs.events[event]?.includes(channel) &&
      appRole(state, NOTIFICATION_APPS[event]),
  );
  const items = (state.deliveryPreviews ?? []).filter(
    (item) =>
      item.personId === me.id && appRole(state, NOTIFICATION_APPS[item.event]),
  );
  const preview = () => {
    if (!enabled) return;
    dispatch({ type: "previewDelivery", event, channel, result });
    toast({
      title: tr(
        result === "failed"
          ? "Delivery failure simulated"
          : "Delivery success simulated",
      ),
    });
  };
  return (
    <>
      <PageHeader
        title={tr("Delivery previews")}
        subtitle={tr(
          "Test personal notification settings and recovery without sending a message.",
        )}
        secondaryActions={[
          {
            content: tr("Notification settings"),
            href: "/settings/notifications",
          },
        ]}
      />
      <Banner title={tr("Simulation only")}>
        {tr(
          "No email or Telegram message is sent. These results and attempts are saved only in this browser.",
        )}
      </Banner>
      {events.length > 0 && (
        <Card className="flex flex-col gap-5">
          <h2 className="text-lg font-semibold">{tr("Test a notification")}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={tr("Notification app")}>
              <Select
                value={event}
                onChange={(e) => setEvent(e.target.value as NotificationEvent)}
                options={events.map((event) => ({
                  value: event,
                  label: `${tr(APP_NAMES[NOTIFICATION_APPS[event]])}${
                    event === "requestUpdates"
                      ? ` · ${tr("Request updates")}`
                      : ""
                  }`,
                }))}
              />
            </Field>
            <Field label={tr("Delivery channel")}>
              <Select
                value={channel}
                onChange={(e) => setChannel(e.target.value as Channel)}
                options={[
                  { value: "email", label: tr("Email") },
                  { value: "telegram", label: tr("Telegram") },
                ]}
              />
            </Field>
            <Field label={tr("Simulated outcome")}>
              <Select
                value={result}
                onChange={(e) => setResult(e.target.value as typeof result)}
                options={[
                  { value: "failed", label: tr("Failure") },
                  { value: "previewed", label: tr("Success") },
                ]}
              />
            </Field>
          </div>
          <p className="text-sm text-muted-foreground">
            {enabled
              ? `${tr("Preview destination")}: ${destination}`
              : tr(
                  "Save a destination and enable this app’s channel in Notification settings first.",
                )}
          </p>
          <Button
            variant="primary"
            className="self-start"
            disabled={!enabled}
            onClick={preview}
          >
            {tr("Run delivery preview")}
          </Button>
        </Card>
      )}
      <section>
        <h2 className="mb-4 text-lg font-semibold">{tr("Attempt history")}</h2>
        {!items.length ? (
          <EmptyState image={null} heading={tr("No delivery previews yet")}>
            {tr(
              "Configure your channel, then simulate a failed or successful delivery.",
            )}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {items
              .slice()
              .reverse()
              .map((item) => {
                const failed = item.attempts.at(-1)?.result === "failed";
                const current =
                  item.channel === "email"
                    ? prefs.email
                    : prefs.telegram?.username;
                const retry =
                  failed &&
                  current === item.destination &&
                  prefs.events[item.event]?.includes(item.channel);
                return (
                  <li key={item.id} className="flex flex-col gap-3 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">
                          {tr(APP_NAMES[NOTIFICATION_APPS[item.event]])} ·{" "}
                          {tr(item.channel === "email" ? "Email" : "Telegram")}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {item.destination}
                        </p>
                      </div>
                      <Badge tone={failed ? "critical" : "success"}>
                        {tr(failed ? "Simulated failure" : "Simulated success")}
                      </Badge>
                    </div>
                    <ol className="text-sm text-muted-foreground">
                      {item.attempts.map((attempt, i) => (
                        <li key={`${attempt.at}-${i}`}>
                          {i + 1}.{" "}
                          {tr(
                            attempt.result === "failed" ? "Failure" : "Success",
                          )}{" "}
                          · {new Date(attempt.at).toLocaleString()}
                        </li>
                      ))}
                    </ol>
                    {failed && (
                      <div>
                        <Button
                          disabled={!retry}
                          onClick={() =>
                            dispatch({
                              type: "previewDelivery",
                              event: item.event,
                              channel: item.channel,
                              result: "previewed",
                              previewId: item.id,
                            })
                          }
                        >
                          {tr("Retry preview")}
                        </Button>
                        {!retry && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {tr(
                              "The destination changed or this channel is disabled. Create a new preview after checking settings.",
                            )}
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
          </ul>
        )}
      </section>
      <Link
        to="/settings/notifications"
        className="self-start text-fg-link underline"
      >
        {tr("Manage my notification channels")}
      </Link>
    </>
  );
}
