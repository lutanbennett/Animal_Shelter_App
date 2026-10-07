"use client";

import { useState, type ComponentProps } from "react";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";

type InputProps = Omit<ComponentProps<"input">, "type" | "value" | "defaultValue" | "onChange" | "required">;

/**
 * A date field that may be left blank, with a visible Clear button beside it
 * once it holds a value.
 *
 * A bare `<input type="date">` can only be emptied from inside the browser's
 * own picker, and on a phone that picker often has no way back to empty
 * (iOS's "Reset" returns to the value the page loaded with), so touching an
 * optional date by accident made it mandatory. Every optional date in the
 * app uses this instead; required dates stay plain inputs.
 *
 * Controlled (`value` + `onValueChange`) or uncontrolled (`defaultValue`,
 * submitted through `name` like a plain input). Cleared, it submits "",
 * which the actions' `str()` helpers already turn into null.
 */
export function OptionalDateInput({
  value,
  defaultValue,
  onValueChange,
  label,
  className,
  wrapperClassName,
  ...rest
}: InputProps & {
  value?: string;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  /** The field's visible label, read out as "Clear <label>". */
  label: string;
  wrapperClassName?: string;
}) {
  const { t } = useI18n();
  const [own, setOwn] = useState(defaultValue ?? "");
  const current = value ?? own;

  function change(next: string) {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  return (
    <div className={`flex items-center gap-2 ${wrapperClassName ?? ""}`}>
      <input
        {...rest}
        type="date"
        value={current}
        onChange={(e) => change(e.target.value)}
        className={`min-w-0 flex-1 ${className ?? ""}`}
      />
      {current !== "" && !rest.disabled && (
        <ActionButton icon={ACTION_ICONS.clear} onClick={() => change("")} aria-label={t.common.clearDateLabel(label)}>
          {t.common.clearDate}
        </ActionButton>
      )}
    </div>
  );
}
