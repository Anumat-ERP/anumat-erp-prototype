import { FormControl, InputLabel, ListSubheader, MenuItem, Select as MuiSelect } from '@mui/material';
import type { SelectChangeEvent, SelectProps as MuiSelectProps } from '@mui/material/Select';
import { Children, isValidElement, type ReactNode } from 'react';
import { useField, useFieldControl } from './field';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
  disabled?: boolean;
}

export interface SelectProps extends Omit<MuiSelectProps<string>, 'size' | 'variant' | 'native' | 'onChange' | 'value' | 'defaultValue'> {
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
  options?: Array<SelectOption | SelectOptionGroup>;
  invalid?: boolean;
  selectClassName?: string;
  onChange?: (event: SelectChangeEvent<string>) => void;
  value?: string;
  defaultValue?: string;
}

interface OptionElementProps {
  value?: string;
  label?: string;
  disabled?: boolean;
  children?: ReactNode;
}

/** Existing callers can still provide HTML option and optgroup children. */
function childOptions(children: ReactNode): Array<SelectOption | SelectOptionGroup> {
  const choices: Array<SelectOption | SelectOptionGroup> = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<OptionElementProps>(child)) return;
    if (child.type === 'option') {
      choices.push({ value: String(child.props.value ?? ''), label: String(child.props.children ?? ''), disabled: child.props.disabled });
    }
    if (child.type === 'optgroup') {
      choices.push({ label: String(child.props.label ?? ''), disabled: child.props.disabled, options: childOptions(child.props.children).filter((option): option is SelectOption => 'value' in option) });
    }
  });
  return choices;
}

export function Select({
  size = 'md',
  placeholder,
  options,
  invalid: invalidProp,
  selectClassName,
  children,
  className,
  style,
  onChange,
  value,
  defaultValue,
  id,
  required,
  disabled,
  'aria-describedby': describedBy,
  'aria-label': ariaLabel,
  ...props
}: SelectProps) {
  const field = useField();
  const floatingLabel = field?.floating ? field.label : undefined;
  const filled = Boolean(value ?? defaultValue);
  const { invalid, ...control } = useFieldControl({
    id,
    required,
    disabled,
    'aria-describedby': describedBy,
    invalid: invalidProp,
  });
  const choices = [...(options ?? []), ...childOptions(children)];
  const flatChoices = choices.flatMap((choice) => 'options' in choice ? choice.options : [choice]);

  return (
    <FormControl
      fullWidth
      size={size === 'lg' ? 'medium' : 'small'}
      error={invalid}
      className={[field?.floating && 'an-floating-field', 'an-select-field', size === 'sm' && 'an-select-sm', className].filter(Boolean).join(' ')}
      style={style}
      disabled={control.disabled}
      required={control.required}
    >
      {floatingLabel ? <InputLabel id={field?.labelId} htmlFor={control.id} shrink={filled} required={control.required}>{floatingLabel}</InputLabel> : null}
      <MuiSelect<string>
        {...props}
        variant="outlined"
        id={control.id}
        labelId={field?.labelId}
        aria-label={ariaLabel}
        aria-describedby={control['aria-describedby']}
        aria-invalid={control['aria-invalid']}
        required={control.required}
        disabled={control.disabled}
        className={selectClassName}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        label={floatingLabel}
        notched={false}
        displayEmpty={Boolean(placeholder && !floatingLabel)}
        renderValue={placeholder ? (selected) => selected === '' ? <span className="an-select-placeholder">{floatingLabel ? '' : placeholder}</span> : flatChoices.find((choice) => choice.value === selected)?.label ?? selected : undefined}
        MenuProps={{ slotProps: { paper: { className: 'an-select-menu' } } }}
      >
        {placeholder ? <MenuItem value="" disabled>{placeholder}</MenuItem> : null}
        {choices.map((choice) => 'options' in choice ? [
          <ListSubheader key={`group-${choice.label}`} className="an-select-group">{choice.label}</ListSubheader>,
          ...choice.options.map((option) => <MenuItem key={`${choice.label}-${option.value}`} value={option.value} disabled={choice.disabled || option.disabled}>{option.label}</MenuItem>),
        ] : <MenuItem key={choice.value} value={choice.value} disabled={choice.disabled}>{choice.label}</MenuItem>)}
      </MuiSelect>
    </FormControl>
  );
}
