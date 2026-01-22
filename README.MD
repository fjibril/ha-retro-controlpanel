## TODO
- ~~get font sizes right~~
- ~~make the flip switch smaller~~
- ~~make the 7-segment centered~~
- hacs custom repo
- ~~make it adhere to ha card size changes~~
- ~~Collect README template~~
- ~~fix scale on VU meter~~
- ~~Add title from options~~
-  ~~fix yellow threshold~~
- refine README
- ~~Make it listen to rows~~
- ~~shave off the one pixel row above and below~~
- ~~VU meter~~
- ~~click actions~~
- externalize html
- externalize css as in https://github.com/maxwroc/lovelace-card-boilerplate/blob/master/src/custom-element/my-custom-card.ts
- code formatting
- github actions
- Editor
- publish to hacs

# Retro Control Panel
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg?style=for-the-badge)](https://github.com/hacs/integration)
![Project Version](https://img.shields.io/github/v/release/YOUR_GITHUB_USERNAME/retro-control-panel?style=for-the-badge)

A Home Assistant Lovelace card that brings the aesthetic of vintage cockpits, analog power stations, and retro villain lairs to your dashboard.

### Screenshots
| Main Interface |
| :--- |
| ![Retro Control Panel](https://raw.githubusercontent.com/fjibril/ha-retro-controlpanel/docs/screenshot.png) |

---

### Installation

#### HACS (Recommended)
1. Open **HACS** in Home Assistant.
2. Click the **three dots** in the top right and select **Custom repositories**.
4. Repository: `https://github.com/fjibril/ha-retro-controlpanel`
5. Category: `Dashboard`
6. Click **Add** and then **Install**.

#### Manual
1. Download `retro-controlpanel-card.js` from the [latest release](https://github.com/fjibril/ha-retro-controlpanel/releases).
2. Copy the file to `www/community/retro-control-panel/`.
3. Add the following to your resources:
   ```yaml
   url: /local/community/retro-control-panel/retro-controlpanel-card.js
   type: JavaScript module


---

### Configuration Options

#### Main Card Options
| Name | Type | Requirement | Description |
| :--- | :--- | :--- | :--- |
| type | string | Required | Must be custom:retro-controlpanel-card |
| title | string | Optional | Title displayed at the top of the panel. |
| rows | list | Required | A list of row objects containing entities. |

#### Entity Options
| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| entity | string | Required | The entity ID (input_number, input_boolean, etc). |
| type | string | Required | One of `seven_segment`, `vu_meter`, `flip_switch`, or `button`. |
| num_digits | number | 4 | Used for `seven_segment`. Total digits to display. |
| leading_zeros | boolean | false | Used for `seven_segment` to fill `num_digits` with leading zeroes. |
| maximum_fraction_digits | number | 0 | Used for `seven_segment`. Decimal precision. |
| min / max | number | 0/100 | Used for `vu_meter`. Defines the analog scale. |
| green_threshold | number | | Threshold for the green zone. Everything below will display green LEDs. |
| yellow_threshold | number | | Threshold for the yellow zone. Everything below that is not green will display yellow LEDs. Anything above will display red LEDs.|
| segments | number | 10 | Used for `vu_meter`. Number of LED segments. |

---

### Example Usage
```yaml
type: custom:retro-controlpanel-card
title: My Retro Control Panel
rows:
  - entities:
      - entity: input_number.my_temperature_1
        type: seven_segment
        num_digits: 4
        leading_zeros: true
        maximum_fraction_digits: 2
      - entity: input_number.my_temperature_1
        type: vu_meter
        min: 10
        max: 40
        green_threshold: 70
        yellow_threshold: 40
        segments: 10
      - entity: input_boolean.my_toggle
        type: flip_switch
  - entities:
      - entity: input_number.my_temperature_2
        type: seven_segment
        maximum_fraction_digits: 2
        num_digits: 4
      - entity: input_button.my_press_button
        type: button
      - entity: input_boolean.my_toggle
        type: button
  - entities:
      - entity: script.new_script
        type: button
```