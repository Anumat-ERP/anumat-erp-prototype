import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Input, type InputProps } from './input';
import { IconButton } from './button';

/** Password visibility stays local; the value belongs to the enclosing form. */
export function PasswordInput({ showLabel = 'Show password', hideLabel = 'Hide password', ...props }: Omit<InputProps, 'type' | 'suffix'> & { showLabel?: string; hideLabel?: string }) {
  const [visible, setVisible] = useState(false);
  return <Input {...props} type={visible ? 'text' : 'password'} suffix={
    <IconButton label={visible ? hideLabel : showLabel} icon={visible ? <EyeOff size={20} /> : <Eye size={20} />} aria-pressed={visible} onClick={() => setVisible(!visible)} />
  } />;
}
