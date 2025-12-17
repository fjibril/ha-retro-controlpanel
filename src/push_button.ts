import { ActionHandlerEvent, handleAction, hasAction, HomeAssistant } from 'custom-card-helpers';
import { html, css, nothing, TemplateResult, unsafeCSS } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { customElement, property } from 'lit/decorators.js';
import { PushButtonConfig } from './types';
import onImg from './img/button_on.png';
import offImg from './img/button_off.png';
import bgImg from './img/btn_bg9.png';
import { actionHandler } from './action-handler-directive';
import { EntityBase } from './entity-base';

@customElement('push-button')
export class PushButton extends EntityBase {
  // Internal config storage
  @property({ type: Object }) protected config!: PushButtonConfig;

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
        <push-button
          class="warning"
          label="Error"
          description="Entity not found"
        >
          <ha-svg-icon .path=${"M13,13H11V9H13M13,17H11V15H13M12,2A10,10 0 1,0 22,12A10,10 0 0,0 12,2Z"}></ha-svg-icon>
        </push-button>
      `;
    }

    // Use the nine-patch as the full button background and a colored fill
    // inside that is driven by `config.color`. The container uses CSS
    // variable `--btn-color` so users can provide any color string.
    const color = (this.config && (this.config as any).color) || (this.config && this.config.color) || '#39d353';

    const ret = html`
    <div
      class="push-button"
      role="button"
      tabindex="0"
      .actionHandler=${actionHandler({
                hasHold: hasAction(this.config.hold_action),
                hasDoubleClick: hasAction(this.config.double_tap_action),
              })}


              @action=${this._handleAction}
      aria-pressed="${stateStr === 'on'}"
      title="Toggle ${entityId}"
      style="--btn-color: ${color};"
    >
      <div class="button-bg">
        <div class="button-fill ${classMap({on: stateStr === 'on', off: stateStr !== 'on'})}"></div>
      </div>
    </div>
  `;
    return ret;
  }

  static styles = css`
    :host {
      width: 100%;  /* Fill available width */
      flex: 1 1 auto;  /* Fill available space */
      display: flex;
      box-sizing: border-box;
      min-height: 0;  /* Allow shrinking */
    }

    .push-button {
      display: flex;
      flex-direction: column;
      justify-content: center;  /* Center button vertically in available space */
      align-items: center;  /* Center button horizontally */
      width: 100%;
      height: 100%;  /* Fill host element */
      margin: 0;
      box-sizing: border-box;
      cursor: pointer;
      padding: 0.5em;
    }

    .button-bg {
      width: 50%;  /* Button takes 50% of cell width */
      aspect-ratio: 2 / 1;  /* Rectangular button - wider than tall */
      box-sizing: border-box;
      border-width: 0.5em;
      border-style: solid;
      border-image: url(${unsafeCSS(bgImg)}) 0.5em fill stretch;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      padding: 0;
    }
    .button-fill {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      background: linear-gradient(180deg, color-mix(in srgb, var(--btn-color) 90%, black 10%), color-mix(in srgb, var(--btn-color) 70%, black 30%));
      transition: filter 0.12s ease, box-shadow 0.12s ease, transform 0.08s ease;
      border: 0.08em solid rgba(0,0,0,0.5);
      box-shadow: inset 0 0.25em 0.6em rgba(255,255,255,0.08), inset 0 -0.6em 1.2em rgba(0,0,0,0.5);
      overflow: hidden;
    }

    /* plastic highlight bar at top */
    .button-fill::before {
      content: '';
      position: absolute;
      left: 8%;
      right: 8%;
      top: 6%;
      height: 18%;
      background: linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.06));
      border-radius: 0.15em;
      pointer-events: none;
      z-index: 1;
    }

    /* transparent plastic window overlay */
    .button-fill::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02), rgba(0,0,0,0.04));
      pointer-events: none;
      z-index: 2;
      border-radius: 0.3em;
    }

    .button-fill.on {
      filter: brightness(1.5) saturate(1.2);
      box-shadow: 0 0 1.2em color-mix(in srgb, var(--btn-color) 70%, white),
                  inset 0 0.25em 0.6em rgba(255,255,255,0.1),
                  inset 0 -0.6em 1.2em rgba(0,0,0,0.35);
      transform: translateY(-0.03em);
    }

    .button-fill.off {
      filter: brightness(0.45) saturate(0.4) contrast(0.9);
      box-shadow: inset 0 0.25em 0.6em rgba(255,255,255,0.02),
                  inset 0 -0.45em 0.9em rgba(0,0,0,0.7);
      transform: translateY(0.02em);
    }

    .warning {
      --ha-label-badge-color: var(--label-badge-yellow);
    }
  `;
}
