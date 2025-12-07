import { HomeAssistant } from 'custom-card-helpers';
import { LitElement, html, css, svg, nothing, TemplateResult, unsafeCSS } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { map } from "lit/directives/map.js";
import { range } from "lit/directives/range.js";
import { customElement, property, state } from 'lit/decorators.js';
import { EntityConfig } from './types';
import onImg from './img/flipswitch_on.png';
import offImg from './img/flipswitch_off.png';

@customElement('flip-switch')
export class FlipSwitch extends LitElement {
  // Public properties
  @property({ type: Object }) private hass?: HomeAssistant;

  // Internal config storage
   @property({ type: Object }) private config!: EntityConfig;



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
      @click=${() => this._onToggleClick()}
      @keydown=${(e: KeyboardEvent) => this._onKeyDown(e)}
      aria-pressed="${stateStr === 'on'}"
      title="Toggle ${entityId}"
    >
      <div class="image-wrap"><img src="${stateStr === 'on' ? onImg : offImg}" alt="Flip Switch"></div>
      <div class="status-light ${classMap({inactive: stateStr !== 'on'})}"></div>

    </div>
  `;
    return ret;
  }

  private async _onToggleClick(): Promise<void> {
    if (!this.config || !this.hass) return;
    const entityId = this.config.entity;
    try {
      await this.hass.callService('homeassistant', 'toggle', { entity_id: entityId });
    } catch (err) {
      // Log error; avoid throwing from UI code
      // eslint-disable-next-line no-console
      console.error('Failed to toggle entity', entityId, err);
    }
  }

  private _onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      void this._onToggleClick();
    }
  }


  static styles = css`
    .flip-switch {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      /* allow the container to shrink if parent is smaller */
      max-width: 100%;
      box-sizing: border-box;
      overflow: hidden;
      /* allow flex children to shrink */
      flex: 0 1 auto;
      /* allow shrinking in nested flex layouts */
      min-width: 0;
      min-height: 0;
      cursor: pointer;
      gap: 0.375em;
    }

    .flip-switch img {
      /* Let the image scale down to fit the parent but never grow beyond its
         intrinsic size. Keep aspect ratio. */
      display: block;
      width: auto;
      height: auto;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      flex: 0 1 auto;
    }

    .image-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      /* keep the image area constrained so it can shrink */
      max-width: 100%;
      box-sizing: border-box;
      flex: 1 1 auto;
      min-width: 0;
      min-height: 0;
      padding: 0.125em;
    }

    /* Put the status light centered below the image */
    .status-light {
      margin: 0 auto;
    }

    .warning {
      --ha-label-badge-color: var(--label-badge-yellow);
    }

    /* Warning/status light */
  .status-light {
    width: 2em;
    height: 2em;
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
