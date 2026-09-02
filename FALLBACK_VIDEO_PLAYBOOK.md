# 🎥 AI Video Generation Fallback Playbook & Structured Prompt Engine
**Sonría Clínicas Odontológicas Medellín**  
*Pipeline Architecture: Google DeepMind Veo + Multi-Generator Fallback + Youri van Hofwegen (videoprompt.studio) Framework*

---

## 📌 Executive Summary
When credits on Google Gemini / Veo run out, this playbook activates the exact alternate generative video models configured for the system without trial-and-error credit waste. 

By utilizing the **Structured Prompting Standard** taught in [*Best AI Video Prompt Generator 2026 (FREE)*](https://youtu.be/oT-2VO8Jzpk) by Youri van Hofwegen and implemented via [videoprompt.studio](https://www.videoprompt.studio/), each prompt strictly decouples:
1. **Camera Grammar** (Focal length, aperture, exact motion axis)
2. **Subject & Character Anchors** (Specific ethnicity, age, natural skin pores, hands)
3. **Lighting & Color Science** (35mm Arri Alexa grading, Kelvin color temps, volumetric rims)
4. **Action Dynamics** (Organic micro-expressions, surgical hand precision, zero rubber-skin)
5. **Decoupled Audio Architecture** (Silent generation + CLI mixing with Spanish `#262` narration)

---

## 🎛️ Generator Specialization Matrix (Zero Credit Waste)

| Tool | Interface | Primary Shot Assignment | Max Duration | Key Strength |
| :--- | :--- | :--- | :--- | :--- |
| **Runway Gen-3 Alpha** | `app.runwayml.com` | **Shot 3**: Macro Porcelain Veneers & Craftsmanship | 5s / 10s | Luxury commercial lighting, 35mm Arri Alexa grading, specular reflections |
| **Kling AI (1.5 / 2.0)** | `klingai.com` | **Shot 2**: 3D Intraoral Scanner & Hand Mechanics | 5s / 10s | Anatomical fidelity (5 clean fingers, realistic teeth/mouths without distortion) |
| **Luma Dream Machine** | `lumalabs.ai/dream-machine` | **Shot 1**: Drone Clinic Exterior & Arrival | 5s | Smooth physical momentum, glass reflections, lush Medellín mountain vistas |
| **MiniMax Hailuo AI** | `hailuoai.video` | **Shot 4**: Smile Reveal & Patient Joy | 6s | Unmatched photorealistic human micro-expressions, authentic laughter |
| **OpenAI Sora (Sora-2)**| Python CLI / Web | **Shot 5**: Continuous Clinic Outro & #262 Branding | 8s–12s | High physical consistency, smooth multi-subject tracking and hold-frames |

---

## 🎬 5-Shot Storyboard & Prompt Roster

All prompts are mirrored in machine-readable format in [`video_prompts_roster.json`](./video_prompts_roster.json).

### Shot 1: Exterior Establishing & Clinic Arrival
* **Primary**: Luma Dream Machine (Ray 2) | **Fallback**: Google Veo
* **Lens / Camera**: 24mm anamorphic lens, f/4.0. Low-altitude stabilized drone push-in.
* **Prompt**:
  > `Cinematic 4K establishing shot, 24mm anamorphic lens, f/4.0. Exterior of high-end modern dental clinic in El Poblado Medellín, Colombia. Lush tropical mountain reflections in pristine floor-to-ceiling glass windows. Brushed slate and warm teak wood architectural elements. Smooth stabilized drone push-in toward the entrance as automatic glass doors smoothly glide open revealing a warm luxury marble lounge inside. Morning tropical sunlight, crisp reflections, natural depth, zero distortion, Arri Alexa commercial aesthetic.`

### Shot 2: Precision 3D Laser Scanning
* **Primary**: Kling AI 2.0 / 1.5 | **Fallback**: OpenAI Sora
* **Lens / Camera**: 50mm cinema prime, f/2.0. Slow micro-dolly track with gentle parallax.
* **Prompt**:
  > `Cinematic close-up, 50mm cinema lens, f/2.0. Professional Colombian female dentist in slate-blue coat smoothly operating a sleek handheld 3D intraoral digital scanner wand. Realistic human hands with five clean fingers in nitrile gloves. Gentle cyan scanning light traces dental arch. Patient relaxed in modern cream leather chair. Background OLED screen rendering realistic 3D dental scan. Soft medical studio lighting, authentic human skin pores, photorealistic, pristine, calm technology.`

### Shot 3: Macro Porcelain Veneer Craftsmanship
* **Primary**: Runway Gen-3 Alpha | **Fallback**: Google Veo
* **Lens / Camera**: 100mm Macro Cinema Lens, f/2.8. Smooth macro orbital slide.
* **Prompt**:
  > `Extreme macro 100mm lens shot, f/2.8. A handcrafted ultra-thin porcelain dental veneer held delicately by satin titanium tweezers. Luxury watch commercial lighting with soft dual rim highlights. Pristine optical clarity, natural incisal translucency, handcrafted micro-texture mimicking genuine human enamel. Gentle rotation revealing delicate specular light refractions across the ceramic surface. Hyper-detailed, 8K commercial polish, Arri Alexa quality.`

### Shot 4: Emotional Smile Reveal
* **Primary**: MiniMax Hailuo AI | **Fallback**: Kling AI 2.0
* **Lens / Camera**: 85mm Portrait Prime, f/1.8. Gentle handheld push-in with organic breathing.
* **Prompt**:
  > `Cinematic portrait shot, 85mm prime lens, f/1.8, shallow depth of field. 27-year-old Colombian woman with natural olive skin and dark hazel eyes in warm sunlit dental suite. She looks into an elegant handheld mirror, lowers it, and looks toward the camera with genuine emotional wonder. Her face breaks into a radiant, joyful, authentic smile displaying beautiful, natural, luminous teeth. Warm sunlight catchlights in her eyes, lifelike micro-expressions, pure confidence, photorealistic cinema.`

### Shot 5: Outro Hold & Call-to-Action
* **Primary**: OpenAI Sora (Sora-2) | **Fallback**: Luma Dream Machine
* **Lens / Camera**: 35mm wide prime, f/2.4. Slow backward tracking dolly easing to rest.
* **Prompt**:
  > `Cinematic 35mm wide interior shot, f/2.4. Warm luxury reception of Sonría Clínicas Odontológicas in Medellín, Colombia. Lush vertical living wall, warm marble desk, inviting Scandinavian lighting. Friendly professional receptionists offer a welcoming warm smile toward camera. Slow smooth backward tracking camera easing into a stable rest frame. Prestigious healthcare hospitality, premium aesthetic.`

---

## ⚡ Universal 1-Click CLI Concat & Master Mix Script

When the raw clips are generated:
1. Save the 5 MP4 files into `C:\Users\vence\Downloads\` as `clip1.mp4`, `clip2.mp4`, `clip3.mp4`, `clip4.mp4`, `clip5.mp4`.
2. Run:
   ```bash
   python scripts/assemble_fallback_commercial.py
   ```
3. The script automatically:
   - Rescales all clips to standard 1080p 16:9 (`1920x1080@30fps`).
   - Gluelessly concatenates the 5 shots.
   - Ducks any ambient bed to 18% volume under the 14s Spanish voiceover (`media/sonria_spanish_262_master.mp3`).
   - Injects the web `+faststart` header for instantaneous browser loading.
   - Deploys the result to `public/media/sonria_medellin_262_promo.mp4`.
   - Runs the Playwright E2E suite (`npx playwright test`) to guarantee zero regression.
