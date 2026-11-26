import { useForm } from '@tanstack/react-form';
import { Field } from '@base-ui/react';

import { MagnifyingGlass, PaperPlaneRight } from 'phosphor-react';

import { Button } from '@octap/shared/components';
import { useState } from 'react';

const DefaultFilterValue = { query: '' };
type FilterTypes = typeof DefaultFilterValue;

interface ISearchAndFilterProps {
  onSubmit?: (props: FilterTypes) => Promise<unknown>;
}

export function SearchAndFilterForm({ onSubmit: handleSubmit }: ISearchAndFilterProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: DefaultFilterValue,
    async onSubmit(state) {
      try {
        setLoading(true);
        console.log('Submitting');
        const pr = await handleSubmit?.(state.value);
        return pr;
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field name="query">
        {(f) => {
          return (
            <Field.Root className="input w-full rounded-t-none">
              <MagnifyingGlass />
              <Field.Control
                value={f.state.value}
                placeholder="Search & Filter"
                onValueChange={(v) => f.setValue(v)}
                autoComplete="false"
                spellCheck="false"
              />
              <Field.Error match={f.state.meta.isValid} children={f.state.meta.errors.join(', ')} />
            </Field.Root>
          );
        }}
      </form.Field>

      <Button
        className="btn-block btn-primary mt-2"
        loading={loading}
        icon={PaperPlaneRight}
        type="submit"
      >
        Apply
      </Button>
    </form>
  );
}
