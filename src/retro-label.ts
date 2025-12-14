import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

// Variants: 'etched' | 'plate' | 'dymo'
export type LabelVariant = 'etched' | 'plate' | 'dymo';

@customElement('retro-label')
class RetroLabel extends LitElement {
  @property({ attribute: false }) hass: any;
  @property({ type: String }) entity?: string;
  @property({ type: String }) label?: string;
  @property({ type: String }) variant: LabelVariant = 'plate';

  static styles = css`
    @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@700&family=Oswald:wght@500&display=swap');

    :host {
      display: inline-block;
      vertical-align: middle;
      margin: 0;  /* No margin to prevent layout issues */
      flex-shrink: 0;  /* Don't shrink labels */
    }

    .label-common {
      text-transform: uppercase;
      text-align: center;
      cursor: default;
      line-height: 1;
    }

    /* --- STYLE 1: ETCHED (Directly into panel) --- */
    .variant-etched {
      font-family: 'Courier Prime', monospace;
      font-weight: 700;
      font-size: clamp(0.6rem, 9cqi, 1.5rem);
      letter-spacing: 0.0625em;
      color: #222; /* Dark ink fill */
      /* White shadow shifted down = light hitting the bottom edge of the groove */
      text-shadow: 0 0.0625em 0 rgba(255, 255, 255, 0.6);
      padding: 0.25em 0.5em;
      background: transparent;
      border: none;
    }

    /* --- STYLE 2: SCREWED PLATE (Industrial Tag) --- */
    .variant-plate {
      font-family: 'Courier Prime', monospace;
      font-weight: 700;
      font-size: clamp(0.6rem, 9cqi, 1.5rem);
      letter-spacing: 0.0625em;
      color: #eee;

      /* Thick Bakelite or Painted Metal look */
      background: linear-gradient(to bottom, #333 0%, #1a1a1a 100%);
      border: 0.0625em solid #000;
      border-top: 0.0625em solid #444; /* Highlight top edge */
      border-radius: 0.125em;
      box-shadow: 0.0625em 0.125em 0.25em rgba(0,0,0,0.5);

      padding: 0.375em 1.5em; /* Extra side padding for screws */
      position: relative;
    }

    /* CSS Screws */
    .variant-plate::before,
    .variant-plate::after {
      content: '';
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 0.375em;
      height: 0.375em;
      border-radius: 50%;
      background: radial-gradient(circle, #ccc 30%, #555 100%);
      box-shadow: inset 0 0.0625em 0.125em rgba(0,0,0,0.8);
      border: 0.0625em solid #222;
    }
    /* Screw Slot (using linear gradient) */
    .screw-slot {
      position: absolute;
      top: 50%;
      transform: translateY(-50%) rotate(-45deg); /* Random angle */
      width: 0.375em;
      height: 0.0625em;
      background: #333;
    }
    .variant-plate::before { left: 0.375em; }
    .variant-plate::after { right: 0.375em; }

    /* --- STYLE 3: DYMO (Label Printer Sticker) --- */
    .variant-dymo {
      font-family: 'Oswald', sans-serif; /* Blocky embossed font */
      font-weight: 500;
      font-size: clamp(0.6rem, 9cqi, 1.5rem);
      letter-spacing: 0.125em;

      /* Plastic Tape Color (Classic Black) */
      background-color: #111;
      background-image: linear-gradient(rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%);

      color: #e0e0e0; /* Bleached plastic white */

      /* Embossed text effect: Blurred shadow around letters */
      text-shadow: 0.0625em 0.0625em 0.0625em rgba(0,0,0,0.8);

      padding: 0.25em 0.5em;
      border-radius: 0.125em;
      box-shadow: 0.0625em 0.0625em 0.1875em rgba(0,0,0,0.4); /* Tape height shadow */

      /* Slightly irregular rotation for sticker feel */
      transform: rotate(-0.5deg);
    }
  `;

  render() {
    let displayText = '---';
    if (this.label) {
      displayText = this.label;
    } else if (this.entity && this.hass) {
      const stateObj = this.hass.states[this.entity];
      displayText = stateObj ? (stateObj.attributes.friendly_name || this.entity) : this.entity;
    }

    // For the plate variant, we render extra span elements to simulate screw slots
    const screwSlots = this.variant === 'plate'
      ? html`<span class="screw-slot" style="left:0.375em"></span><span class="screw-slot" style="right:0.375em"></span>`
      : null;

    return html`
      <div class="label-common variant-${this.variant}">
        ${screwSlots}
        ${displayText}
      </div>
    `;
  }
}

export default RetroLabel;
