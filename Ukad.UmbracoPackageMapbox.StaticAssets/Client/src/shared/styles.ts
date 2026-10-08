import { css } from "@umbraco-cms/backoffice/external/lit";

/**
 * Plain number inputs styled like uui-input. uui-input cannot take step="any", so it reports
 * coordinates with many decimals as invalid; the Umbraco 13 editors used plain number inputs too.
 */
export const numberFieldStyles = css`
  .number-field {
    box-sizing: border-box;
    height: var(--uui-size-11, 36px);
    padding: 0 var(--uui-size-space-3, 9px);
    min-width: 0;
    font: inherit;
    color: var(--uui-color-text);
    background: var(--uui-color-surface);
    border: 1px solid var(--uui-color-border);
    border-radius: var(--uui-border-radius, 3px);
  }

  .number-field:hover {
    border-color: var(--uui-color-border-emphasis);
  }

  .number-field:focus {
    outline: 2px solid var(--uui-color-focus);
    outline-offset: -1px;
  }

  .number-field[readonly] {
    color: var(--uui-color-disabled-contrast);
    background: var(--uui-color-disabled);
    border-color: var(--uui-color-disabled-standalone, var(--uui-color-border));
  }
`;
