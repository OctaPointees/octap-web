import { Field as BaseField } from '@base-ui/react/field';
import { cn } from '@octap/shared/utils';
import { Info } from 'phosphor-react';

import { useState, type ChangeEvent, type HTMLInputTypeAttribute } from 'react';

const CLSS = {
  SUPPORT: 'flex min-h-2 items-center py-2 text-sm font-bold',
};

interface IFieldProps {
  control?: [string, (value: string) => void];
  supportText?: { text: string; type: 'info' | 'warn' | 'error' };

  type?: HTMLInputTypeAttribute;
  label?: string;
  autoComplete?: string;
  placeholder?: string;
  disabled?: boolean;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  maxLength?: number;
}

export function Field({
  control,
  type,
  autoComplete,
  label,
  supportText: support,
  placeholder,
  disabled,
  min,
  max,
  step,
  maxLength,
}: IFieldProps) {
  const [localValue, setLocalValue] = useState('');
  const [value, setValue] = control ?? [localValue, setLocalValue];
  const isError = support?.type === 'error';

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.currentTarget.value);
  };

  return (
    <BaseField.Root invalid={isError} disabled={disabled}>
      {label && <BaseField.Label className="text-sm">{label}</BaseField.Label>}
      <div className={cn('input w-full', { 'input-error': isError })}>
        <BaseField.Control
          type={type}
          spellCheck={false}
          autoComplete={autoComplete}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          maxLength={maxLength}
        />
      </div>
      {isError ? (
        <BaseField.Error match={true} className={cn(CLSS.SUPPORT, 'text-error')}>
          <div className="flex-1 border-l-4 pl-2">{support?.text}</div>
          {support && <Info size="1.4em" weight="bold" />}
        </BaseField.Error>
      ) : (
        <BaseField.Description
          className={cn(CLSS.SUPPORT, { 'text-warning': support?.type === 'warn' })}
        >
          <span className="flex-1">{support?.text}</span>
          {support && <Info size="1.2em" weight="bold" />}
        </BaseField.Description>
      )}
    </BaseField.Root>
  );
}
