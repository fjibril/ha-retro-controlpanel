import { ActionHandlerEvent, computeDomain, handleAction, HomeAssistant } from 'custom-card-helpers';
import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { EntityConfig } from './types';

/**
 * Base class for all retro control panel entities
 * Provides common action handling functionality
 */
export class EntityBase extends LitElement {
  @property({ type: Object }) protected hass?: HomeAssistant;
  @property({ type: Object }) protected config!: EntityConfig;

  protected _getDefaultAction(entityId: string): string {
      const domain = computeDomain(entityId); //entityId.split('.')[0];

    // Domains that should use toggle
    const toggleDomains = ['light', 'switch', 'input_boolean', 'fan', 'cover'];
    if (toggleDomains.includes(domain)) {
      return 'toggle';
    }

    // Button domains use press
    const pressDomains = ['button', 'input_button'];
    if (pressDomains.includes(domain)) {
      return 'press';
    }

    // Domains that should use turn_on (scenes, scripts, etc.)
    const turnOnDomains = ['scene', 'script', 'automation'];
    if (turnOnDomains.includes(domain)) {
      return 'call-service';
    }

    // Default to more-info for entities that don't match specific domains
    return 'more-info';
  }

  protected _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this.config && ev.detail.action) {
      const action = ev.detail.action;
      const configToUse = { ...this.config };

      if (action === 'tap' && !this.config.tap_action) {
        const entityId = this.config.entity;
        const domain = entityId.split('.')[0];
        const defaultActionType = this._getDefaultAction(entityId);

        if (defaultActionType === 'press') {
          configToUse.tap_action = {
            action: 'call-service',
            service: `${domain}.press`,
            target: {
              entity_id: entityId,
            },
          };
        } else if (defaultActionType === 'call-service') {
          configToUse.tap_action = {
            action: 'call-service',
            service: `${domain}.turn_on`,
            target: {
              entity_id: entityId,
            },
          };
        } else if (defaultActionType === 'more-info') {
          configToUse.tap_action = {
            action: 'more-info',
          };
        } else {
          configToUse.tap_action = {
            action: 'toggle',
          };
        }
      }

      handleAction(this, this.hass, configToUse, action);
    }
  }
}
