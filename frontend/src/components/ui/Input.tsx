import {
  forwardRef,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, id, ...props },
  ref,
) {
  return (
    <Field label={label} error={error} htmlFor={id}>
      <input
        ref={ref}
        id={id}
        className={clsx(
          "w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors",
          "focus:border-primary focus:ring-1 focus:ring-primary",
          error ? "border-danger" : "border-border",
          className,
        )}
        {...props}
      />
    </Field>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, label, error, id, ...props },
  ref,
) {
  return (
    <Field label={label} error={error} htmlFor={id}>
      <textarea
        ref={ref}
        id={id}
        className={clsx(
          "w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors",
          "focus:border-primary focus:ring-1 focus:ring-primary",
          error ? "border-danger" : "border-border",
          className,
        )}
        {...props}
      />
    </Field>
  );
});

function Field({
  label,
  error,
  htmlFor,
  children,
}: {
  label?: string;
  error?: string;
  htmlFor?: LabelHTMLAttributes<HTMLLabelElement>["htmlFor"];
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
        </label>
      ) : null}
      {children}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
