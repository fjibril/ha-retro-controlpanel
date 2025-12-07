import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant } from 'custom-card-helpers';
import { RetroControlpanelCardConfig, EntityConfig, DisplayType } from './types';

@customElement('retro-controlpanel-card-editor')
export class RetroControlpanelCardEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config!: RetroControlpanelCardConfig;
  @state() private _selectedEntityIndex = 0;

  public setConfig(config: RetroControlpanelCardConfig): void {
    this._config = config;
  }

  protected render() {
    if (!this.hass || !this._config) {
      return html``;
    }

    return html`
      <div class="card-config">
        <!-- Card Title -->
        <ha-textfield
          label="Title (Optional)"
          .value=${this._config.title || ''}
          .configValue=${'title'}
          @input=${this._valueChanged}
        ></ha-textfield>

        <!-- ConfigRows List -->
        <div class="entityRows">
          <div class="header">
            <div class="title">Rows</div>
            <ha-icon-button
              .label=${'Add Row'}
              @click=${this._addEntityRow}
            >
              <ha-icon icon="mdi:plus"></ha-icon>
            </ha-icon-button>

          ${this._config.entities?.map((entityConfRow, rowIndex) =>
            html`

          <!-- Entities List -->
          <div class="entities">
            <div class="header">
              <div class="title">Entities</div>
              <ha-icon-button
                .label=${'Add Entity'}
                @click=${this._addEntity(rowIndex)}
              >
                <ha-icon icon="mdi:plus"></ha-icon>
              </ha-icon-button>
            </div>

            ${entityConfRow.entities?.map((entityConf, index) =>
              this._renderEntityEditor(entityConf, index)
            )}
            </div>
            `)}
        </div>
      </div>
    `;
  }

  private _renderEntityEditor(entityConf: string | EntityConfig, index: number) {
    const config = typeof entityConf === 'string'
      ? { entity: entityConf, type: 'button' as DisplayType }
      : entityConf;

    return html`
      <div class="entity-row">
        <div class="handle">
          <ha-icon icon="mdi:drag"></ha-icon>
        </div>

        <!-- Entity Picker -->
        <ha-entity-picker
          label="Entity"
          .hass=${this.hass}
          .value=${config.entity}
          .configValue=${'entity'}
          .index=${index}
          @value-changed=${this._entityChanged}
          allow-custom-entity
        ></ha-entity-picker>

        <!-- Type Dropdown (ENUM) -->
        <ha-select
          label="Display Type"
          .value=${config.type || 'button'}
          .configValue=${'type'}
          .index=${index}
          @selected=${this._typeChanged}
          @closed=${(e) => e.stopPropagation()}
        >
          ${Object.values(DisplayType).map(
            (type) => html`
              <mwc-list-item .value=${type}>
                ${this._getTypeLabel(type)}
              </mwc-list-item>
            `
          )}
        </ha-select>

        <!-- Name (Optional) -->
        <ha-textfield
          label="Name (Optional)"
          .value=${config.name || ''}
          .configValue=${'name'}
          .index=${index}
          @input=${this._entityValueChanged}
        ></ha-textfield>

        <!-- Icon (Optional) -->
        <ha-icon-picker
          label="Icon (Optional)"
          .hass=${this.hass}
          .value=${config.icon || ''}
          .configValue=${'icon'}
          .index=${index}
          @value-changed=${this._entityValueChanged}
        ></ha-icon-picker>

        <!-- Show State Toggle -->
        <ha-formfield label="Show State">
          <ha-switch
            .checked=${config.show_state !== false}
            .configValue=${'show_state'}
            .index=${index}
            @change=${this._entitySwitchChanged}
          ></ha-switch>
        </ha-formfield>

        <!-- Delete Button -->
        <ha-icon-button
          .label=${'Delete Entity'}
          .index=${index}
          @click=${this._deleteEntity}
        >
          <ha-icon icon="mdi:delete"></ha-icon>
        </ha-icon-button>
      </div>
    `;
  }

  private _getTypeLabel(type: DisplayType): string {
    const labels: Record<DisplayType, string> = {
      seven_segment: 'Seven Segment Display',
      flip_switch: 'Flip Switch',
      indicator_button: 'Indicator Button',
      button: 'Button',
    };
    return labels[type] || type;
  }

  private _valueChanged(ev: CustomEvent): void {
    if (!this._config || !this.hass) return;

    const target = ev.target as any;
    const configValue = target.configValue;

    if (this[`_${configValue}`] === target.value) return;

    if (target.value === '') {
      const newConfig = { ...this._config };
      delete newConfig[configValue];
      this._config = newConfig;
    } else {
      this._config = {
        ...this._config,
        [configValue]: target.value,
      };
    }

    this._configChanged();
  }

  private _entityChanged(ev: CustomEvent): void {
    const target = ev.target as any;
    const index = target.index;
    const row = target.parentElement.index
    const newValue = ev.detail.value;

    this._updateEntityConfig(row, index, 'entity', newValue);
  }

  private _typeChanged(ev: CustomEvent): void {
    const target = ev.target as any;
    const index = target.index;
    const row = target.parentElement.index
    const newValue = target.value;

    this._updateEntityConfig(row, index, 'type', newValue);
  }

  private _entityValueChanged(ev: CustomEvent): void {
    const target = ev.target as any;
    const index = target.index;
    const row = target.parentElement.index
    const configValue = target.configValue;
    const newValue = ev.detail?.value ?? target.value;

    this._updateEntityConfig(row, index, configValue, newValue);
  }

  private _entitySwitchChanged(ev: CustomEvent): void {
    const target = ev.target as any;
    const index = target.index;
    const row = target.parentElement.index
    const configValue = target.configValue;
    const newValue = target.checked;

    this._updateEntityConfig(row, index, configValue, newValue);
  }

  private _updateEntityConfig(row: number, index: number, key: string, value: any): void {
    const entities = [...this._config.entities];
    const entityConf = entities[row].entities[index];

    // Convert string to object if needed
    const config = typeof entityConf === 'string'
      ? { entity: entityConf, type: 'button' as DisplayType }
      : { ...entityConf };

    // Update the property
    if (value === '' || value === undefined) {
      delete config[key];
    } else {
      config[key] = value;
    }

    entities[row].entities[index] = config;
    this._config = { ...this._config, entities };
    this._configChanged();
  }

  private _addEntity(rowIndex: number): void {
    const entityRows = this._config.entities ? [...this._config.entities] : [];
    const entities = entityRows[rowIndex] ? [...entityRows[rowIndex].entities] : [];
    entities.push({
      entity: '',
      type: 'button' as DisplayType,  // Default type
    });
    entityRows[rowIndex] = { entities };
    this._config = { ...this._config, entityRows };
    this._configChanged();
  }

  private _addEntityRow(): void {
    const entityRows = this._config.entities ? [...this._config.entities] : [];
    const entities = this._config.entities ? [...this._config.entities] : [];
    entityRows.push({entities: [{
      entity: '',
      type: 'button' as DisplayType,  // Default type
    }]});
    this._config = { ...this._config, entityRows };
    this._configChanged();
  }

  private _deleteEntity(ev: CustomEvent): void {
    const target = ev.target as any;
    const index = target.index;

    const entities = [...this._config.entities];
    entities.splice(index, 1);
    this._config = { ...this._config, entities };
    this._configChanged();
  }

  private _configChanged(): void {
    const event = new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  static styles = css`
    .card-config {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .entities {
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      padding: 16px;
    }

    .entities .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .entities .title {
      font-weight: 500;
      font-size: 16px;
    }

    .entity-row {
      display: grid;
      grid-template-columns: auto 1fr 1fr;
      gap: 8px;
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      margin-bottom: 8px;
      align-items: center;
    }

    .handle {
      cursor: grab;
      color: var(--secondary-text-color);
    }

    ha-select {
      width: 100%;
    }

    ha-textfield,
    ha-entity-picker,
    ha-icon-picker {
      width: 100%;
    }

    ha-formfield {
      grid-column: span 2;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'retro-controlpanel-card-editor': RetroControlpanelCardEditor;
  }
}