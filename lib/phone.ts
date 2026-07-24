import { AsYouType } from "libphonenumber-js/min";

export function formatPhoneAsYouType(value: string): string {
  return new AsYouType().input(value);
}
