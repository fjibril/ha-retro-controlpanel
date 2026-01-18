import { ActionHandlerEvent, handleAction, hasAction, HomeAssistant } from 'custom-card-helpers';
import { html, css, nothing, TemplateResult, PropertyValues } from 'lit';
import { map } from "lit/directives/map.js";
import { range } from "lit/directives/range.js";
import { customElement, property, query, state } from 'lit/decorators.js';
import { VUMeterEntityConfig } from './types';
import { actionHandler } from './action-handler-directive';
import { EntityBase } from './entity-base';

@customElement('vu-meter')
export class VUMeter extends EntityBase {
  // Internal config storage
  @property({ type: Object }) protected config!: VUMeterEntityConfig;

  @state() private hideAlternatingScaleLabels = false;
  @state() private hideBigPrimaryScaleLabels = false;

  @query('.vu-meter-scale') private scaleEl?: HTMLDivElement;

  private resizeObserver?: ResizeObserver;

  private static readonly DEFAULT_MIN = 0;
  private static readonly DEFAULT_MAX = 100;
  private static readonly DEFAULT_GREEN_THRESHOLD = 70;
  private static readonly DEFAULT_YELLOW_THRESHOLD = 90;
  private static readonly DEFAULT_SEGMENTS = 20;

  /**
   * Calculate the percentage of the current value within the min-max range
   */
  private getPercentage(value: number): number {
    const min = this.config.min ?? VUMeter.DEFAULT_MIN;
    const max = this.config.max ?? VUMeter.DEFAULT_MAX;

    if (max <= min) return 0;

    const percentage = ((value - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, percentage));
  }

  /**
   * Determine the color zone for a segment based on its percentage
   */
  private getSegmentColor(segmentPercentage: number): 'green' | 'yellow' | 'red' {
    const greenThreshold = this.config.green_threshold ?? VUMeter.DEFAULT_GREEN_THRESHOLD;
    const yellowThreshold = this.config.yellow_threshold ?? VUMeter.DEFAULT_YELLOW_THRESHOLD;

    if (segmentPercentage <= greenThreshold) {
      return 'green';
    } else if (segmentPercentage <= yellowThreshold) {
      return 'yellow';
    } else {
      return 'red';
    }
  }

  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    this.observeScaleWidth();
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    this.handleLabelOverlap();
  }

  disconnectedCallback(): void {
    this.resizeObserver?.disconnect();
    super.disconnectedCallback();
  }

  private observeScaleWidth(): void {
    if (!this.scaleEl) {
      return;
    }

    if (!this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this.handleLabelOverlap());
    }

    this.resizeObserver.observe(this.scaleEl);
    this.handleLabelOverlap();
  }

  private handleLabelOverlap(): void {
    const scaleEl = this.scaleEl;
    if (!scaleEl) {
      return;
    }
    const allLabels = Array.from(scaleEl.querySelectorAll('.scale-label')) as HTMLElement[];
    const hasOverlap = this.detectLabelOverlap(allLabels);
    if (hasOverlap !== this.hideAlternatingScaleLabels) {
      this.hideAlternatingScaleLabels = hasOverlap;
      const oddLabels = Array.from(scaleEl.querySelectorAll('.scale-label.secondary')) as HTMLElement[];
      if (hasOverlap) {
        hideLabels(oddLabels);
      } else {
        unhideLabels(allLabels);
      }
    }

    if (hasOverlap) {
      const primaryLabels = Array.from(scaleEl.querySelectorAll('.scale-label.primary')) as HTMLElement[];
      const hasPrimaryOverlap = this.detectLabelOverlap(primaryLabels);

      if (hasPrimaryOverlap !== this.hideBigPrimaryScaleLabels) {
        this.hideBigPrimaryScaleLabels = hasPrimaryOverlap;
      const tertiaryLabels = Array.from(scaleEl.querySelectorAll('.scale-label.tertiary')) as HTMLElement[];
        if (hasPrimaryOverlap) {
          hideLabels(tertiaryLabels);
        } else {
          unhideLabels(tertiaryLabels);
        }
      }
    }

    function hideLabels(labels: HTMLElement[]) {
      for (const label of labels) {
        label.classList.add('auto-hidden');
      }
    }

    function unhideLabels(labels: HTMLElement[]) {
      for (const label of labels) {
          if (label.classList.contains('auto-hidden')) {
            label.classList.remove('auto-hidden');
          }
        }
    }
  }

  private detectLabelOverlap(labels: HTMLElement[]): boolean {
    if (labels.length === 0) {
      return false;
    }

    const minGapPx = 1;
    let hasOverlap = false;
    for (let i = 1; i < labels.length; i += 1) {
      const prevRect = labels[i - 1].getBoundingClientRect();
      const rect = labels[i].getBoundingClientRect();
      if (rect.left - prevRect.right < minGapPx) {
        hasOverlap = true;
        break;
      }
    }
    return hasOverlap;
  }

  render(): TemplateResult | typeof nothing {
    if (!this.config) {
      return nothing;
    }

    const entityId = this.config.entity;
    const state = this.hass && this.hass.states ? this.hass.states[entityId] : undefined;

    if (!state) {
      return html`
        <div class="vu-meter error">
          <div class="error-message">Entity not found</div>
        </div>
      `;
    }

    const rawValue = parseFloat(state.state);
    if (isNaN(rawValue)) {
      return html`
        <div class="vu-meter error">
          <div class="error-message">Invalid value</div>
        </div>
      `;
    }

    const percentage = this.getPercentage(rawValue);
    const numSegments = this.config.segments ?? VUMeter.DEFAULT_SEGMENTS;
    const segmentWidth = 100 / numSegments;
    const min = this.config.min ?? VUMeter.DEFAULT_MIN;
    const max = this.config.max ?? VUMeter.DEFAULT_MAX;

    return html`
      <div class="vu-meter">
        <div class="vu-meter-container" .actionHandler=${actionHandler({
                  hasHold: hasAction(this.config.hold_action),
                  hasDoubleClick: hasAction(this.config.double_tap_action),
                })}  @action=${this._handleAction}>
          <div class="vu-meter-bar">
            ${map(range(numSegments), (i: number) => {
              const segmentStartPercent = i * segmentWidth;
              const divisor = Math.max(1, numSegments - 1);
              const segmentValue = min + ((max - min) * i / divisor);
              // Light from the very first step (min) onward
              const isLit = rawValue >= segmentValue;
              const color = this.getSegmentColor(segmentValue);

              let visibilityClass = 'primary'; // 0, 2, 4...

              if (i % 2 !== 0) {
                visibilityClass = 'secondary'; // 1, 3, 5...
              }

              return html`
                <div class="led ${color} ${isLit ? 'lit' : 'unlit'} ${visibilityClass}"></div>
              `;
            })}
          </div>
          <div class="vu-meter-scale">
            ${map(range(numSegments), (i: number) => {
              const divisor = Math.max(1, numSegments - 1);
              const segmentValue = min + ((max - min) * i / divisor);

              let autoHidden = false;
              let visibilityClasses = ['primary'];

              if (i % 2 !== 0) {
                visibilityClasses = ['secondary']; // 1, 3, 5...
                autoHidden = true;
              } else if (i % 4 === 2) {
                visibilityClasses.push('tertiary'); // 2, 6, 10...
              }

              return html`
                <div class="scale-label ${visibilityClasses.join(' ')} ${autoHidden ? 'auto-hidden' : ''}">
                  ${Math.round(segmentValue)}
                </div>
              `;
            })}
          </div>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      width: 100%;
      flex: 1 1 auto;
      display: flex;
      box-sizing: border-box;
      min-height: 0;
    }

    .vu-meter {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      padding: 0.5em;
      box-sizing: border-box;
      gap: 0.5em;
      justify-content: center;
      border: 0.125em solid var(--metal-dark, #1a1a1a);
      border-radius: 0.25em;
      container-type: inline-size;
    }

    .vu-meter-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      border: 0.125em solid #000;
      border-radius: 0.25em;
      padding: 0.5em;
      gap: 0.125em;
      box-sizing: border-box;
    }

    .vu-meter-label {
      display: flex;
      justify-content: center;
      font-size: 0.8em;
    }

    .vu-meter-bar {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
      width: 100%;
      gap: 0.25em;
    }

    .led {
      width: 100%;
      aspect-ratio: 1 / 1;
      flex: 1 1 0;
      max-width: 100%;
      border-radius: 50%;
      transition: all 0.15s ease-in-out;
      border: 0.0625em solid rgba(0, 0, 0, 0.8);
      box-sizing: border-box;
      min-width: 0;
    }

    /* Unlit LEDs - very dim but visible */
    .led.unlit {
      opacity: 0.2;
    }

    .led.unlit.green {
      background: radial-gradient(circle at 30% 30%, #349e34ff, #04ff04ff);
      box-shadow: inset 0 0.0625em 0.0625em rgba(0, 0, 0, 0.8);
    }

    .led.unlit.yellow {
      background: radial-gradient(circle at 30% 30%, #bbbb3aff, #ffff00ff);
      box-shadow: inset 0 0.0625em 0.0625em rgba(0, 0, 0, 0.8);
    }

    .led.unlit.red {
      background: radial-gradient(circle at 30% 30%, #c61a1a, #ff0000);
      box-shadow: inset 0 0.0625em 0.0625em rgba(0, 0, 0, 0.8);
    }

    /* Lit LEDs - bright and glowing */
    .led.lit.green {
      background: radial-gradient(circle at 30% 30%, #ccffcc, #00ff00, #00aa00);
      box-shadow:
        0 0 0.5em rgba(0, 255, 0, 0.8),
        0 0 0.25em rgba(0, 255, 0, 0.6),
        inset 0 0.0625em 0.125em rgba(255, 255, 255, 0.6),
        inset 0 -0.0625em 0.0625em rgba(0, 0, 0, 0.3);
    }

    .led.lit.yellow {
      background: radial-gradient(circle at 30% 30%, #ffffcc, #ffff00, #ccaa00);
      box-shadow:
        0 0 0.5em rgba(255, 255, 0, 0.8),
        0 0 0.25em rgba(255, 255, 0, 0.6),
        inset 0 0.0625em 0.125em rgba(255, 255, 255, 0.6),
        inset 0 -0.0625em 0.0625em rgba(0, 0, 0, 0.3);
    }

    .led.lit.red {
      background: radial-gradient(circle at 30% 30%, #ffcccc, #ff0000, #aa0000);
      box-shadow:
        0 0 0.5em rgba(255, 0, 0, 0.9),
        0 0 0.25em rgba(255, 0, 0, 0.7),
        inset 0 0.0625em 0.125em rgba(255, 255, 255, 0.6),
        inset 0 -0.0625em 0.0625em rgba(0, 0, 0, 0.3);
      animation: pulse-red 1s infinite alternate;
    }

    @keyframes pulse-red {
      0% {
        filter: brightness(1);
      }
      100% {
        filter: brightness(1.2);
      }
    }

    .vu-meter-scale {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      width: 100%;
      gap: 0.25em;
      box-sizing: border-box;
    }

    .scale-label {
      flex: 1 1 0;
      display: flex;
      justify-content: center;
      white-space: nowrap;
      font-size: clamp(0.2rem, 4cqi, 1rem);
      color: #ccc;
      font-family: 'Courier New', monospace;
      line-height: 1;
      min-height: 0.8em;
      box-sizing: border-box;
      overflow: visible;
      min-width: 0;
    }


    /* Default (Normal Mode) */
    /* Labels: Hide secondary (odd indices) but keep space */


    /* LEDs: Show all (default behavior) */

    /* Wide Mode: Show everything */
    @container (min-width: 210px) {
      .scale-label.secondary {
        visibility: visible;
      }
    }

    .vu-meter-unit {
      display: flex;
      justify-content: center;
      font-size: 0.7em;
    }

    .vu-meter.error {
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #3a1a1a 0%, #2d1d1d 100%);
    }

    .error-message {
      color: #ff6b35;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      text-align: center;
    }

    /* Compact Mode */
    @container (max-width: 140px) {
      .vu-meter-container {
        padding: 0.25em;
      }

      .vu-meter-bar {
        gap: 0.1em;
      }

      .vu-meter-scale {
        gap: 0.1em;
      }

      .led {
        border-width: 0.04em;
      }

      /* LEDs: Hide secondary (odd indices) */
      .led.secondary {
        display: none;
      }

      /* Labels: Hide secondary (odd indices) to match LEDs */
      .scale-label.secondary {
        display: none;
      }

      /* Labels: Hide tertiary (indices 2, 6...) but keep space */
      .scale-label.tertiary {
        visibility: visible;
      }
    }

    .scale-label.auto-hidden {
      visibility: hidden;
    }
  `;
}
