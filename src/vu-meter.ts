import { ActionHandlerEvent, handleAction, HomeAssistant } from 'custom-card-helpers';
import { LitElement, html, css, nothing, TemplateResult } from 'lit';
import { map } from "lit/directives/map.js";
import { range } from "lit/directives/range.js";
import { customElement, property } from 'lit/decorators.js';
import { VUMeterEntityConfig } from './types';

@customElement('vu-meter')
export class VUMeter extends LitElement {
  // Public properties
  @property({ type: Object }) private hass?: HomeAssistant;

  // Internal config storage
  @property({ type: Object }) private config!: VUMeterEntityConfig;

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

  private _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this.config && ev.detail.action) {
      handleAction(this, this.hass, this.config, ev.detail.action);
    }
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

    // Get unit from config or state attributes (config takes precedence)
    const unit = this.config.unit || (state?.attributes?.unit_of_measurement as string | undefined);
    const label = this.config.name || state.attributes.friendly_name || entityId;

    return html`
      <div class="vu-meter">
        <div class="vu-meter-container">
          <div class="vu-meter-bar">
            ${map(range(numSegments), (i: number) => {
              const segmentStartPercent = i * segmentWidth;
              const segmentEndPercent = (i + 1) * segmentWidth;
              const segmentMidPercent = (segmentStartPercent + segmentEndPercent) / 2;
              const isLit = percentage >= segmentEndPercent;
              const color = this.getSegmentColor(segmentMidPercent);

              return html`
                <div class="led ${color} ${isLit ? 'lit' : 'unlit'}"></div>
              `;
            })}
          </div>
          <div class="vu-meter-scale">
            ${map(range(numSegments), (i: number) => {
              const segmentValue = min + ((max - min) * (i + 1) / numSegments);
              const showLabel = i === 0 || i === numSegments - 1 || (i + 1) % 2 === 0;

              return html`
                <div class="scale-label">
                  ${showLabel ? Math.round(segmentValue) : ''}
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
      /*background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);*/
      border: 0.125em solid var(--metal-dark, #1a1a1a);
      border-radius: 0.25em;
    }

    .vu-meter-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      /*background: #0a0a0a;*/
      border: 0.125em solid #000;
      border-radius: 0.25em;
      /*box-shadow: inset 0 0.125em 0.25em rgba(0, 0, 0, 0.8);*/
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
    }

    /* Unlit LEDs - very dim but visible */
    .led.unlit {
      opacity: 0.2;
    }

    .led.unlit.green {
      background: radial-gradient(circle at 30% 30%, #1a3a1a, #0a1a0a);
      box-shadow: inset 0 0.0625em 0.0625em rgba(0, 0, 0, 0.8);
    }

    .led.unlit.yellow {
      background: radial-gradient(circle at 30% 30%, #3a3a1a, #1a1a0a);
      box-shadow: inset 0 0.0625em 0.0625em rgba(0, 0, 0, 0.8);
    }

    .led.unlit.red {
      background: radial-gradient(circle at 30% 30%, #3a1a1a, #1a0a0a);
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
      text-align: center;
      font-size: 0.6em;
      color: #ccc;
      font-family: 'Courier New', monospace;
      line-height: 1;
      min-height: 0.8em;
      box-sizing: border-box;
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
  `;
}
