import type { FormEvent } from "react";
import { formatDate } from "@/lib/format";
import type { Dictionary } from "./dictionaries/en";
import type { Locale } from "./locales";

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type TextControl = HTMLInputElement | HTMLTextAreaElement;

/** The app's wording for whatever is wrong with a control, from the browser's own verdict. */
function message(control: Control, t: Dictionary, locale: Locale): string {
  const v = t.validation;
  const { validity } = control;
  const type = control instanceof HTMLInputElement ? control.type : "";

  if (validity.valueMissing) {
    if (type === "checkbox") return v.requiredCheck;
    if (type === "radio" || control instanceof HTMLSelectElement) return v.requiredChoice;
    return v.required;
  }
  if (control instanceof HTMLInputElement) {
    if (validity.typeMismatch) {
      return type === "email" ? v.email : type === "url" ? v.url : v.invalid;
    }
    if (validity.rangeOverflow || validity.rangeUnderflow) {
      const over = validity.rangeOverflow;
      const limit = over ? control.max : control.min;
      if (type === "date") {
        const shown = formatDate(limit, locale);
        return over ? v.notAfter(shown) : v.notBefore(shown);
      }
      return over ? v.atMost(limit) : v.atLeast(limit);
    }
    if (validity.stepMismatch) return v.step;
    if (validity.badInput) return v.number;
  }
  if (validity.tooShort) return v.minLength((control as TextControl).minLength);
  if (validity.tooLong) return v.maxLength((control as TextControl).maxLength);
  if (validity.patternMismatch) return v.pattern;
  return v.invalid;
}

/**
 * Spread onto a `<form>`: `<form {...localizedValidity(t, locale)}>`. The
 * browser still decides *whether* a field is valid (required, min, max,
 * type…) and still points at it, but the words in its bubble are the app's,
 * in the app's language, instead of the phone's. A custom message sticks to
 * a control until it is cleared, so it is cleared as soon as the value
 * changes and the browser re-checks. `invalid` does not bubble, hence the
 * capture handlers.
 */
export function localizedValidity(t: Dictionary, locale: Locale) {
  const clear = (event: FormEvent<HTMLFormElement>) => {
    const target = event.target;
    if (target instanceof HTMLElement && "setCustomValidity" in target) {
      (target as Control).setCustomValidity("");
    }
  };
  return {
    onInvalidCapture: (event: FormEvent<HTMLFormElement>) => {
      const target = event.target as Control;
      target.setCustomValidity("");
      target.setCustomValidity(message(target, t, locale));
    },
    onInputCapture: clear,
    onChangeCapture: clear,
  };
}
