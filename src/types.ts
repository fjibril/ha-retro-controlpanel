import { ActionConfig, LovelaceCardConfig } from "custom-card-helpers";

export enum DisplayType {
  SevenSegment = 'seven_segment',
  FlipSwitch = 'flip_switch',
  IndicatorButton = 'indicator_button',
  Button = 'button',
}


export interface EntityConfig {
  entity: string;           // Required
  type: DisplayType;  // Required enum
  name?: string;            // Optional custom name
  icon?: string;            // Optional custom icon
  show_state?: boolean;     // Optional display toggle
  color?: string;           // Optional color
  tap_action?: ActionConfig; // Optional action
  // Add any other per-entity options
}

export interface SevenSegmentEntityConfig extends EntityConfig {
  num_digits?: number;
  maximum_fraction_digits?: number;
  leading_zeros?: boolean;
  unit?: string;  // Optional unit label (e.g., '°C', '°F', '%')
}

export interface EntityConfigRow {
  entities: EntityConfig[];  // Array of entity configs
}

export interface RetroControlpanelCardConfig extends LovelaceCardConfig{
  type: string;
  rows: EntityConfigRow[];  // Array of entity config rows
  title?: string;
  // Global card options
}