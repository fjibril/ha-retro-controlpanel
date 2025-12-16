import { ActionConfig, LovelaceCardConfig } from "custom-card-helpers";

export enum DisplayType {
  SevenSegment = 'seven_segment',
  FlipSwitch = 'flip_switch',
  IndicatorButton = 'indicator_button',
  Button = 'button',
  VUMeter = 'vu_meter',
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

export interface VUMeterEntityConfig extends EntityConfig {
  min?: number;              // Minimum value (default: 0)
  max?: number;              // Maximum value (default: 100)
  green_threshold?: number;  // Percentage threshold for green/yellow (default: 70)
  yellow_threshold?: number; // Percentage threshold for yellow/red (default: 90)
  segments?: number;         // Number of segments to display (default: 20)
  unit?: string;             // Optional unit label (e.g., 'dB', '%', 'V')
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