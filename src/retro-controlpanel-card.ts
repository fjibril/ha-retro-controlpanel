/// <reference path="./types.d.ts" /> //<-- workaround for not picking up html templates. hopefully temporary.

import { HomeAssistant } from 'custom-card-helpers';
import { LitElement, TemplateResult, css, html, svg, unsafeCSS, nothing } from 'lit';
import template from './retro-controlpanel-card.html';
//import template from './tmp.html';
import { DisplayType, EntityConfig, RetroControlpanelCardConfig, SevenSegmentEntityConfig } from './types';
import { customElement } from 'lit/decorators.js';
import ninePatchCPBG from './img/cp3_bg.png';
import ninePatchElementBG from './img/cp5_s_bg.png';
import ninePatch7SegBG from './img/val_bg.9.png';
import { map } from 'lit/directives/map.js';
import { range } from 'lit/directives/range.js';
import './retro-label';
import './push_button';
import './vu-meter';

@customElement('retro-controlpanel-card')
class RetroControlpanelCard extends LitElement {

  private config: RetroControlpanelCardConfig | undefined;
  private _hass: HomeAssistant | undefined;
  private model: { userName: string; entityId: string; stateStr: string; } | undefined;

  static mdiAlert = "M13,13H11V9H13M13,17H11V15H13M12,2A10,10 0 1,0 22,12A10,10 0 0,0 12,2Z";

  static styles = css`
    .card-container {
        border-image: url(${unsafeCSS(ninePatchCPBG)}) 50 fill stretch;
        border-width: 3.125em;
        border-style: solid;
        padding: 1em;
    }

    .grid {
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        height: 100%;  /* Fill available card space */
    }

    .grid-row {
        display: flex;
        justify-content: center;  /* Center items when fewer than 3 */
        gap: 0.5em;
        flex: 1 1 auto;  /* Each row takes equal space */
        min-height: 150px;
    }

    .grid-cell {
        flex: 0 0 calc((100% - 1em) / 3);  /* Each cell is 1/3 width minus gap */
        max-width: calc((100% - 1em) / 3);
        border-image: url(${unsafeCSS(ninePatchElementBG)}) 16 stretch;
        background-color: #929393;
        border-width: 1em;
        border-style: solid;
        min-width: 2em;
        min-height: 2em;
        box-sizing: border-box;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding: 0.5em;
        gap: 0.5em;
        container-type: inline-size;  /* Enable container queries for child elements */
        /* Grid cells automatically get height from grid-auto-rows */
    }

    .seven-segment-display {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 7.5em;
      width: fit-content;
      min-width: 12.5em;
      border-width: 2em; /* adjust to match your image's border */
      border-style: solid;
      border-image: url(${unsafeCSS(ninePatch7SegBG)}) 32 fill stretch; /* adjust slice to your border width */
      background: #111;
      box-sizing: border-box;
    }
    .digits {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5em; /* adjust for spacing */
    }

    .digit {
      height: 100%;
      width: 100%;
    }

    .warning {
      --ha-label-badge-color: var(--label-badge-yellow);
    }
    /* Warning/status light */
    .status-light {
    width: 2em;
    height: 2em;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #5cff33, #3eec38);
    border: 0.125em solid var(--metal-dark);
    box-shadow:
      0 0 0.5em rgba(107, 255, 53, 0.6),
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

  @keyframes pulse-light {
    0%, 100% {
      box-shadow:
          0 0 0.5em rgba(107, 255, 53, 0.6),
          inset 0 -0.0625em 0.125em rgba(0, 0, 0, 0.5),
          inset 0.0625em 0.0625em 0 rgba(255, 255, 255, 0.2);
    }
    50% {
      box-shadow:
        0 0 0.9375em rgba(107, 255, 53, 0.8),
        inset 0 -0.0625em 0.125em rgba(0, 0, 0, 0.5),
        inset 0.0625em 0.0625em 0 rgba(255, 255, 255, 0.2);
    }
  }
  `;


  // required
  //TODO: Config type such as https://github.com/denysdovhan/vacuum-card/blob/353b4e183592344ba85a400f5def42e686f278e6/src/types.ts#L59
  public setConfig(config: RetroControlpanelCardConfig): void {
    if (!config.rows || !Array.isArray(config.rows)) {
      throw new Error('You must define entities');
    }

    // Normalize and validate entities
    const normalizedEntityRows = config.rows.map((entityConfRow, rowIndex) => {
      const normalizedEntities = entityConfRow.entities.map((entityConf, index) => {
        // Create a shallow copy to avoid mutating possibly non-extensible input
        const entity = (typeof entityConf === 'string')
          ? { entity: entityConf, type: DisplayType.SevenSegment } as any
          : { ...(entityConf as any) };

        // Validate entity ID exists
        if (!entity.entity) {
          throw new Error(`Entity at row ${rowIndex} index ${index} must have an entity ID`);
        }

        // Validate type
        if (!entity.type) {
          throw new Error(`Entity ${entity.entity} must have a type`);
        }

        if (!Object.values(DisplayType).includes(entity.type)) {
          throw new Error(
            `Invalid type "${entity.type}" for entity ${entity.entity}. ` +
            `Must be one of: ${Object.values(DisplayType).join(', ')}`
          );
        }

        // Apply defaults for seven-segment configs without mutating original
        if (entity.type === DisplayType.SevenSegment) {
          const s = entity as SevenSegmentEntityConfig;
          // Only set defaults if not already provided
          s.num_digits = s.num_digits ?? 3;
          s.maximum_fraction_digits = s.maximum_fraction_digits ?? 1;
        }

        return entity as EntityConfig;
      });
      return { entities: normalizedEntities };
    });
    this.config = { ...config, rows: normalizedEntityRows };
  }

  public static async getConfigElement(): Promise<HTMLElement> {
    // TypeScript may not find the module's type declarations for the dynamic import.
    // Use a short-term suppression; for a long-term fix add a declaration file
    // (e.g. `retro-controlpanel-card-editor.d.ts`) or ensure the editor module
    // is emitted with .js declarations that TypeScript can resolve.
    await import('./retro-controlpanel-card-editor');
    return document.createElement('retro-controlpanel-card-editor');
  }


  public static getStubConfig(): Partial<RetroControlpanelCardConfig> {
    return {
      entities: [{
        entities: [
          {
            entity: 'input_number.temperature1',
            type: DisplayType.SevenSegment,
          },
        ]
      }],
      title: "Control Panel"
    };
  }

  // Card size for masonry view (1 unit = 50px)
  public getCardSize(): number {
    if (!this.config?.rows) return 3;
    // Each row is approximately 3 units tall (150px), plus 2 for padding/border
    return (this.config.rows.length * 3) + 2;
  }

  // Grid sizing for sections view
  public getGridOptions() {
    const rowCount = this.config?.rows?.length || 1;
    return {
      columns: 12,  // Full width
      rows: rowCount * 3,  // 3 grid cells per data row
      min_rows: 3,
    };
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    this.requestUpdate();
  }

  render() {
    if (!this.config) return html``;

    const entityId = this.config.entity;
    const state = this._hass?.states?.[entityId];
    const stateStr = state ? state.state : 'unavailable';

    const userName = this._hass?.user?.name ?? 'User';

    this.model = {
      userName: String(userName),
      entityId: String(entityId),
      stateStr: String(stateStr),
    };

    return template.call(this);
  }



  /*
  updated(changedProperties) {
    super.updated(changedProperties);

    if (this._connected && changedProperties.has("state")) {
      this._startInterval(this.state);
    }
  }
*/


}

// not needed with @customElement decorator
//customElements.define('retro-control-panel-card', RetroControlPanelCard);

//Register with HA for adding new cards
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: "retro-controlpanel-card",
  name: "Retro Control Panel Card",
  description: "Mechanical switches, buttons and seven segment displays."
});
