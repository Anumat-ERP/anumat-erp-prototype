import { useState } from 'react';
import {
  Banner,
  Button,
  Card,
  DataTable,
  DatePicker,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
} from '@app/ui';
import { AppPeople } from '../pages/AppPeople';
import { useStore, uid } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import { appRole, appPeople, isAppAdmin } from '../lib/appAccess';
import {
  canReadCompensation,
  canWriteCompensation,
  hrProblem,
  hrState,
} from './engine';
import {
  EMPLOYEE_HEADERS,
  previewEmployees,
  type ImportResult,
} from './import';
import { downloadCSV } from './export';
import type { Employee, HRApp, HRCommand } from './types';
export function HRPeople({ app }: { app: HRApp }) {
  const { state, dispatch } = useStore();
  const { t: tr } = useLocale();
  return (
    <>
      <AppPeople app={app} />
      {isAppAdmin(state, app) && (
        <Card>
          <h2 className="text-lg font-semibold">{tr('Data scope')}</h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            {tr(
              'Members start with their own employee records. Department scope includes the same branch and department. Admins can see all records in this app.',
            )}
          </p>
          <div className="space-y-3">
            {state.people
              .filter(
                (p) =>
                  appRole(state, app, p.id) &&
                  appRole(state, app, p.id) !== 'admin',
              )
              .map((p) => (
                <Field key={p.id} label={p.name}>
                  <Select
                    value={hrState(state).scopes[app]?.[p.id] ?? 'own'}
                    onChange={(e) =>
                      dispatch({
                        type: 'hr',
                        command: {
                          kind: 'scope',
                          app,
                          personId: p.id,
                          scope: e.target.value as 'own' | 'department' | 'all',
                        },
                      })
                    }
                    options={[
                      { value: 'own', label: tr('Own records') },
                      {
                        value: 'department',
                        label: tr('Department in own branch'),
                      },
                      { value: 'all', label: tr('All employee records') },
                    ]}
                  />
                </Field>
              ))}
          </div>
        </Card>
      )}
      {app === 'employees' &&
        state.people.find((p) => p.id === state.meId)?.access === 'owner' && (
          <Card>
            <h2 className="text-lg font-semibold">
              {tr('Compensation access')}
            </h2>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">
              {tr(
                'Employee app admins do not automatically receive salary access. Grant read or write access separately.',
              )}
            </p>
            <div className="space-y-3">
              {state.people
                .filter(
                  (p) =>
                    isAppAdmin(state, 'employees', p.id) &&
                    p.access !== 'owner',
                )
                .map((p) => (
                  <Field key={p.id} label={p.name}>
                    <Select
                      value={
                        hrState(state).compensationAccess?.[p.id] ?? 'none'
                      }
                      onChange={(e) =>
                        dispatch({
                          type: 'hr',
                          command: {
                            kind: 'compensationAccess',
                            personId: p.id,
                            access: e.target.value as 'none' | 'read' | 'write',
                          },
                        })
                      }
                      options={[
                        { value: 'none', label: tr('No compensation access') },
                        { value: 'read', label: tr('Read compensation') },
                        {
                          value: 'write',
                          label: tr('Read and edit compensation'),
                        },
                      ]}
                    />
                  </Field>
                ))}
            </div>
          </Card>
        )}
    </>
  );
}
export function EmployeeImport({ close }: { close: () => void }) {
  const { state, dispatch } = useStore();
  const { t: tr } = useLocale();
  const [csv, setCSV] = useState(''),
    [preview, setPreview] = useState<ImportResult[]>([]),
    [problem, setProblem] = useState('');
  const valid = preview.filter((row) => !row.problem);
  return (
    <Modal
      open
      onOpenChange={(open) => !open && close()}
      title={tr('Import employees')}
      size="lg"
      primaryAction={{
        content: tr('Import {count} valid rows', { count: valid.length }),
        disabled: !valid.length,
        onAction: () => {
          const command: HRCommand = {
            kind: 'import',
            records: valid.map((row) => row.record),
          };
          const error = hrProblem(state, command);
          if (error) {
            setProblem(tr(error));
            return;
          }
          dispatch({ type: 'hr', command });
          close();
        },
      }}
      secondaryActions={[{ content: tr('Cancel'), onAction: close }]}
    >
      <div className="space-y-4">
        <Banner>
          {tr(
            'Imports create employees without accounts. Invalid and duplicate rows are skipped; existing employees are never overwritten.',
          )}
        </Banner>
        <Button
          variant="secondary"
          onClick={() =>
            downloadCSV(
              [
                {
                  code: 'EMP-2001',
                  name: 'Example employee',
                  email: 'employee@example.test',
                  department: 'Operations',
                  branch: 'Phnom Penh',
                  position: 'Coordinator',
                  startDate: new Date().toISOString().slice(0, 10),
                  salary: 650,
                  currency: 'USD',
                  leaveAllowance: 18,
                },
              ],
              'employee-template.csv',
            )
          }
        >
          {tr('Download CSV template')}
        </Button>
        <Field
          label={tr('Paste employee CSV')}
          helpText={EMPLOYEE_HEADERS.join(',')}
        >
          <Textarea
            rows={7}
            value={csv}
            onChange={(e) => {
              setCSV(e.target.value);
              setPreview([]);
              setProblem('');
            }}
          />
        </Field>
        <Button
          onClick={() => {
            try {
              setPreview(previewEmployees(state, csv));
              setProblem('');
            } catch (error) {
              setProblem(tr((error as Error).message));
            }
          }}
        >
          {tr('Validate import')}
        </Button>
        {problem && <Banner tone="critical">{problem}</Banner>}
        {preview.length > 0 && (
          <>
            <Banner>
              {tr('{valid} ready · {invalid} skipped · {total} total', {
                valid: valid.length,
                invalid: preview.length - valid.length,
                total: preview.length,
              })}
            </Banner>
            <DataTable
              caption={tr('Import preview')}
              rows={preview.map((row) => ({ ...row, id: String(row.line) }))}
              columns={[
                { id: 'line', header: tr('Row'), numeric: true },
                {
                  id: 'name',
                  header: tr('Employee'),
                  cell: (row) => row.record.name,
                },
                {
                  id: 'problem',
                  header: tr('Result'),
                  cell: (row) =>
                    row.problem ? tr(row.problem) : tr('Ready to import'),
                },
              ]}
            />
          </>
        )}
      </div>
    </Modal>
  );
}
export function EmployeeChangeForm({
  employee,
  close,
}: {
  employee: Employee;
  close: () => void;
}) {
  const { state, dispatch } = useStore();
  const { t: tr } = useLocale();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10)),
    [reason, setReason] = useState(''),
    [problem, setProblem] = useState('');
  const [patch, setPatch] = useState({
    position: employee.position,
    department: employee.department,
    branch: employee.branch,
    salary: employee.salary,
    currency: employee.currency,
    managerId: employee.managerId,
  });
  const [reviewerId, setReviewerId] = useState('');
  const command: HRCommand = {
    kind: 'schedule',
    change: {
      id: uid('change'),
      reviewerId: reviewerId || undefined,
      employeeId: employee.id,
      effectiveDate: date,
      reason,
      patch,
      expectedVersion: employee.version,
      status: 'pending',
      createdById: state.meId,
      createdAt: '',
    },
  };
  return (
    <Modal
      open
      onOpenChange={(open) => !open && close()}
      title={tr('Schedule employee change')}
      primaryAction={{
        content: tr('Schedule change'),
        onAction: () => {
          const error = hrProblem(state, command);
          if (error) setProblem(tr(error));
          else {
            dispatch({ type: 'hr', command });
            close();
          }
        },
      }}
      secondaryActions={[{ content: tr('Cancel'), onAction: close }]}
    >
      <div className="space-y-4">
        <Banner>
          {tr(
            'Current employment stays unchanged until an admin applies this change on or after its effective date.',
          )}
        </Banner>
        {problem && <Banner tone="critical">{problem}</Banner>}
        <Field label={tr('Independent reviewer (optional)')}><Select value={reviewerId} onChange={e=>setReviewerId(e.target.value)} options={[{value:'',label:tr('Admin-recorded change')},...appPeople(state,'employees').filter(p=>isAppAdmin(state,'employees',p.id)&&p.id!==state.meId&&p.id!==employee.accountId).map(p=>({value:p.id,label:p.name}))]}/></Field>
        <p>{tr('Choose a reviewer when the change needs independent approval. Admin-recorded changes use the current direct scheduling policy.')}</p>
        <DatePicker
          label={tr('Effective date')}
          value={date}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDate(e.target.value)}
        />
        {(['position', 'department', 'branch'] as const).map((key) => (
          <Field
            key={key}
            label={tr(
              key === 'position'
                ? 'Position'
                : key === 'department'
                  ? 'Department'
                  : 'Branch',
            )}
          >
            <Input
              value={patch[key]}
              onChange={(e) =>
                setPatch((p) => ({ ...p, [key]: e.target.value }))
              }
            />
          </Field>
        ))}
        {canReadCompensation(state) && (
          <Field label={tr('Illustrative base pay')}>
            <Input
              type="number"
              disabled={!canWriteCompensation(state)}
              value={patch.salary}
              onChange={(e) =>
                setPatch((p) => ({ ...p, salary: Number(e.target.value) }))
              }
            />
          </Field>
        )}
        <Field label={tr('Currency')}>
          <Select
            disabled={!canWriteCompensation(state)}
            value={patch.currency}
            options={[
              { value: 'USD', label: 'USD' },
              { value: 'KHR', label: 'KHR' },
            ]}
            onChange={(e) =>
              setPatch((p) => ({
                ...p,
                currency: e.target.value as Employee['currency'],
              }))
            }
          />
        </Field>
        <Field label={tr('Change reason')}>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
