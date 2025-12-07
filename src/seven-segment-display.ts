import { HomeAssistant } from 'custom-card-helpers';
import { LitElement, html, css, svg, nothing, TemplateResult, unsafeCSS } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { map } from "lit/directives/map.js";
import { range } from "lit/directives/range.js";
import { customElement, property, state } from 'lit/decorators.js';
import { EntityConfig, SevenSegmentEntityConfig } from './types';
import ninePatch7SegBG from './img/val_bg.9.png';

@customElement('seven-segment-display')
export class SevenSegmentDisplay extends LitElement {
  // Public properties
  @property({ type: Object }) private hass?: HomeAssistant;

  // Internal config storage
   @property({ type: Object }) private config!: SevenSegmentEntityConfig;

    private static  digitMap: Record<string, string[]> = {
    '0': ['a','b','c','d','e','f'],
    '1': ['b','c'],
    '2': ['a','b','g','e','d'],
    '3': ['a','b','g','c','d'],
    '4': ['f','g','b','c'],
    '5': ['a','f','g','c','d'],
    '6': ['a','f','g','e','c','d'],
    '7': ['a','b','c'],
    '8': ['a','b','c','d','e','f','g'],
    '9': ['a','b','c','d','f','g'],
    '-': ['g'],
    ' ': [],
  };

  // Determine if a given segment should be on or off for a digit
  private onOff(digit: string, segment: string): 'on' | 'off' {
    const map = SevenSegmentDisplay.digitMap;
    return (map[digit] && map[digit].includes(segment)) ? 'on' : 'off';
  }

  isNumeric(n: unknown): boolean {
    return !isNaN(Number(n as any)) && isFinite(Number(n as any));
  }

  /**
   * Formats a number with priority on significant digits, then fractions.
   * Pads the result to exactly numDigits length with either zeros or spaces.
   *
   * @param value - The number to format
   * @param numDigits - Total significant digits desired (also the output string length)
   * @param maxFractionDigits - Maximum fraction digits to show
   * @param useLeadingZeros - If true, pad with zeros; if false, pad with spaces (default: false)
   * @returns Formatted and padded string of length numDigits
   */
  formatWithPrioritySigDigits(
    value: number,
    numDigits: number,
    maxFractionDigits: number,
    useLeadingZeros?: boolean
  ): string {
    // If padding option is not provided, keep original simple formatting
    if (useLeadingZeros === undefined) {
      return new Intl.NumberFormat('en', {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxFractionDigits,
        useGrouping: false,
      }).format(value);
    }

    // Try reducing fraction digits (from max -> 0) to make the formatted
    // string fit within numDigits. This prioritizes showing integer digits
    // and counts the minus sign as one of the characters.
    for (let frac = maxFractionDigits; frac >= 0; frac--) {
      const formatted = new Intl.NumberFormat('en', {
        minimumFractionDigits: 0,
        maximumFractionDigits: frac,
        useGrouping: false,
      }).format(value);

      if (formatted.length <= numDigits) {
        const padAmount = numDigits - formatted.length;
        if (padAmount > 0) {
          const padChar = useLeadingZeros ? '0' : ' ';

          // If using zeros and number is negative, place minus sign first
          if (useLeadingZeros && formatted.startsWith('-')) {
            const numberPart = formatted.slice(1);
            return '-' + padChar.repeat(padAmount) + numberPart;
          }

          return padChar.repeat(padAmount) + formatted;
        }

        return formatted;
      }
    }

    // If even with zero fraction digits the value is too wide, truncate
    // the numeric portion to fit while keeping the minus sign if present.
    const fallback = new Intl.NumberFormat('en', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      useGrouping: false,
    }).format(value);

    if (fallback.length <= numDigits) return fallback;

    if (fallback.startsWith('-')) {
      // Keep minus then take as many characters of the magnitude as fit
      const mag = fallback.slice(1);
      const take = Math.max(0, numDigits - 1);
      return '-' + mag.slice(0, take);
    }

    return fallback.slice(0, numDigits);
  }


  render(): TemplateResult | typeof nothing {
    if (!this.config) {
      return nothing;
    }
    const entityId = this.config.entity;
    const state = this.hass && this.hass.states ? this.hass.states[entityId] : undefined;
    let stateStr: String = state ? state.state : "unavailable";

    const entityState = state;

    if (!entityState) {
      return html`
        <seven-segment-display
          class="warning"
          label="Error"
          description=Entity not found
        >
          <ha-svg-icon .path=${"M13,13H11V9H13M13,17H11V15H13M12,2A10,10 0 1,0 22,12A10,10 0 0,0 12,2Z"}></ha-svg-icon>
        </seven-segment-display>
      `;
    }

    stateStr = this.formatWithPrioritySigDigits(Number(stateStr), this.config.num_digits ?? 3, this.config.maximum_fraction_digits ?? 2, this.config.leading_zeros ?? false);
    const dotIndex = (stateStr as string).indexOf('.');
    const accountForDotChar = dotIndex >= 0 ? 1 : 0;
    //stateStr = (stateStr as string).slice(((this.numDigits as number) + accountForDotChar) * -1);

    // Remove the character at the found position
    stateStr = dotIndex >= 0 ?
      (stateStr as string).substring(0, dotIndex) + (stateStr as string).substring(dotIndex + 1)
      : (stateStr as string);

    // Get unit from config or state attributes (config takes precedence)
    const unit = this.config.unit || (state?.attributes?.unit_of_measurement as string | undefined);

    const ret = html`
    <div class="seven-segment-display">
      <div class="digits">
        ${map(range((stateStr as string).length), (i: number) =>
          this.render7segmentDigit((stateStr as string)[i], i + 1 === dotIndex)
        )}
      </div>
      <retro-label .label=${unit} variant="dymo"></retro-label>
    </div>
  `;
    return ret;
  }

  render7segmentDigit(value: string, withDot: boolean) {
    const ret = svg`
      <svg xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 57 80" class="digit">

        <!-- Define reusable segment shapes -->
        <defs>
          <!-- Horizontal segment -->
          <polygon id="h-seg" points="11,0 37,0 42,5 37,10 11,10 6,5"/>
          <!-- Vertical segment -->
          <polygon id="v-seg" points="0,11 5,6 10,11 10,34 5,39 0,39"/>
        </defs>

        <!-- All 7 segments with their labels -->
        <g id="seven-segment-display">
          <!-- Segment A (top) -->
          <use xlink:href="#h-seg" x="0" y="0" id="segment-a" class="segment-${this.onOff(value,'a')}"/>

          <!-- Segment B (top right) -->
          <use xlink:href="#v-seg" x="-48" y="0" transform="scale(-1,1)" id="segment-b" class="segment-${this.onOff(value,'b')}"/>

          <!-- Segment C (bottom right) -->
          <use xlink:href="#v-seg" x="-48" y="-80" transform="scale(-1,-1)" id="segment-c" class="segment-${this.onOff(value,'c')}"/>

          <!-- Segment D (bottom) -->
          <use xlink:href="#h-seg" x="0" y="70" id="segment-d" class="segment-${this.onOff(value,'d')}"/>

          <!-- Segment E (bottom left) -->
          <use xlink:href="#v-seg" x="0" y="-80" transform="scale(1,-1)" id="segment-e" class="segment-${this.onOff(value,'e')}"/>

          <!-- Segment F (top left) -->
          <use xlink:href="#v-seg" x="0" y="0" id="segment-f" class="segment-${this.onOff(value,'f')}"/>

          <!-- Segment G (middle) -->
          <use xlink:href="#h-seg" x="0" y="35" id="segment-g" class="segment-${this.onOff(value,'g')}"/>

          <!-- Decimal point (optional) -->
          <circle cx="52" cy="75" r="5" id="decimal-point" class="segment-${withDot ? 'on' : 'off'}"/>
        </g>

        <!-- Basic styling -->
        <style>
          polygon, circle {

            stroke: #666666;
            stroke-width: 0.5;
          }

          .segment-on {
            fill: #ff0000;
          }

          .segment-off {
            fill: #333333;
          }
        </style>
      </svg>`;
    return ret;
  }

  updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties as any);

    if ((this as any)._connected && changedProperties.has("state")) {
      // placeholder for original behaviour
      // this._startInterval(this.state);
    }
  }

  static styles = css`
    .seven-segment-display {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: auto;
      width: fit-content;
      border-width: 2em; /* adjust to match your image's border */
      border-style: solid;
      border-image: url(${unsafeCSS(ninePatch7SegBG)}) 32 fill stretch; /* adjust slice to your border width */
      background: #111;
      box-sizing: border-box;
      gap: 0.375em;
    }
    .digits {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5em;
      margin-right: 1.2em;
      margin-bottom: 1em;
      margin-top: 0.2em
    }

    .digit {
      height: 100%;
      width: 100%;
    }

    .unit-label {
      font-family: 'Courier New', monospace;
      font-size: 1em;
      font-weight: bold;
      color: #ff6633;
      letter-spacing: 0.125em;
      text-align: center;
      padding: 0 0.5em 0.5em 0.5em;
    }

    .warning {
      --ha-label-badge-color: var(--label-badge-yellow);
    }
  `;
}
