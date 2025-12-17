import { hasAction, HomeAssistant } from 'custom-card-helpers';
import { html, css, svg, nothing, TemplateResult, unsafeCSS } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { map } from "lit/directives/map.js";
import { range } from "lit/directives/range.js";
import { customElement, property, state } from 'lit/decorators.js';
import { EntityConfig } from './types';
import onImg from './img/flipswitch_on.png';
import offImg from './img/flipswitch_off.png';
import { EntityBase } from './entity-base';
import { actionHandler } from './action-handler-directive';

@customElement('flip-switch')
export class FlipSwitch extends EntityBase {
  // Internal config storage
  @property({ type: Object }) protected config!: EntityConfig;



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
        <flip-switch
          class="warning"
          label="Error"
          description=Entity not found
        >
          <ha-svg-icon .path=${"M13,13H11V9H13M13,17H11V15H13M12,2A10,10 0 1,0 22,12A10,10 0 0,0 12,2Z"}></ha-svg-icon>
        </flip-switch>
      `;
    }

    const ret = html`
    <div
      class="flip-switch"
      role="button"
      tabindex="0"
      aria-pressed="${stateStr === 'on'}"
      title="Toggle ${entityId}"
    >
      <div class="status-light ${classMap({ inactive: stateStr !== 'on' })}"></div>
      <div class="image-wrap"
      .actionHandler=${actionHandler({
                        hasHold: hasAction(this.config.hold_action),
                        hasDoubleClick: hasAction(this.config.double_tap_action),
                      })}  @action=${this._handleAction}>
      <img src="${stateStr === 'on' ? onImg : offImg}" alt="Flip Switch">
      </div>


    </div>
  `;
    return ret;
  }

  static styles = css`
    :host {
      width: 100%;
      flex: 1 1 auto;  /* Fill available space */
      display: flex;
      box-sizing: border-box;
      min-height: 0;  /* Allow shrinking */
    }

    .flip-switch {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;  /* Fill host element */
      padding: 0.5em;
      box-sizing: border-box;
      cursor: pointer;
      gap: 1em;
    }

    .image-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1 1 auto;  /* Take available space */
      max-width: 55%;
      max-height: 100%;
      box-sizing: border-box;
      padding: 0.125em;
    }

    .flip-switch img {
      display: block;
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;  /* Maintain aspect ratio */
    }

    .warning {
      --ha-label-badge-color: var(--label-badge-yellow);
    }

  /* Warning/status light */
  .status-light {
    width: 100%;
    aspect-ratio: 1 / 1;
    margin: 0;
    flex: 0 0 auto;
    max-width: 30%;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #ff6b35, #cc3300);
    border: 0.125em solid var(--metal-dark);
    box-shadow:
      0 0 0.5em rgba(255, 107, 53, 0.6),
      inset 0 -0.0625em 0.125em rgba(0, 0, 0, 0.5),
      inset 0.0625em 0.0625em 0 rgba(255, 255, 255, 0.2);
    animation: pulse-light 2s infinite;
  }

  .status-light.inactive {
    background: radial-gradient(circle at 30% 30%, #333, #111);
    box-shadow:
      0 0 0.125em rgba(0, 0, 0, 0.8),
      inset 0 -0.0625em 0.125em rgba(0, 0, 0, 0.5),
      inset 0.0625em 0.0625em 0 rgba(255, 255, 255, 0.1);
  }
  `;
}
