# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/upscale.spec.ts >> AI Upscale button creates placeholder in gallery
- Location: tests/upscale.spec.ts:5:5

# Error details

```
Error: Upscale failed: fetch failed
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - paragraph [ref=e6]: Pixilens
          - heading "Images" [level=1] [ref=e7]
          - paragraph [ref=e8]: Browse pending, completed, and failed image generations across Codex, try-on, and the shared pipelines.
        - navigation [ref=e9]:
          - link "Home" [ref=e10] [cursor=pointer]:
            - /url: /
          - link "GPT-2" [ref=e11] [cursor=pointer]:
            - /url: /gpt2
          - link "Codex" [ref=e12] [cursor=pointer]:
            - /url: /codex
          - link "Outfit Change" [ref=e13] [cursor=pointer]:
            - /url: /outfitchange
      - generic [ref=e14]:
        - article [ref=e15]:
          - generic [ref=e16]:
            - generic [ref=e17]:
              - paragraph [ref=e19]: Upscale failed
              - paragraph [ref=e20]: Placeholder created at May 18, 2026, 4:55 AM
            - generic [ref=e21]: failed
          - generic [ref=e22]:
            - generic [ref=e23]:
              - generic [ref=e24]: Upscale
              - generic [ref=e25]: 100%
            - generic [ref=e26]:
              - paragraph [ref=e27]: Pyramid yoga pose
              - paragraph [ref=e28]: May 18, 2026, 4:55 AM
            - paragraph [ref=e29]: "Aspect ratio: 9:16"
            - paragraph [ref=e30]: fetch failed
            - button "Delete" [ref=e34]
        - article [ref=e35]:
          - generic [ref=e36]:
            - generic [ref=e37]:
              - paragraph [ref=e39]: Upscale failed
              - paragraph [ref=e40]: Placeholder created at May 18, 2026, 4:52 AM
            - generic [ref=e41]: failed
          - generic [ref=e42]:
            - generic [ref=e43]:
              - generic [ref=e44]: Upscale
              - generic [ref=e45]: 100%
            - generic [ref=e46]:
              - paragraph [ref=e47]: Pyramid yoga pose
              - paragraph [ref=e48]: May 18, 2026, 4:52 AM
            - paragraph [ref=e49]: "Aspect ratio: 9:16"
            - paragraph [ref=e50]: fetch failed
            - button "Delete" [ref=e54]
        - article [ref=e55]:
          - generic [ref=e56]:
            - generic [ref=e57]:
              - paragraph [ref=e59]: Upscale failed
              - paragraph [ref=e60]: Placeholder created at May 18, 2026, 4:46 AM
            - generic [ref=e61]: failed
          - generic [ref=e62]:
            - generic [ref=e63]:
              - generic [ref=e64]: Upscale
              - generic [ref=e65]: 100%
            - generic [ref=e66]:
              - paragraph [ref=e67]: Professional fashion editorial portrait
              - paragraph [ref=e68]: May 18, 2026, 4:46 AM
            - paragraph [ref=e69]: "Aspect ratio: 9:16"
            - paragraph [ref=e70]: fetch failed
            - button "Delete" [ref=e74]
        - article [ref=e75]:
          - generic [ref=e76]:
            - generic [ref=e77]:
              - paragraph [ref=e79]: Upscale failed
              - paragraph [ref=e80]: Placeholder created at May 18, 2026, 4:46 AM
            - generic [ref=e81]: failed
          - generic [ref=e82]:
            - generic [ref=e83]:
              - generic [ref=e84]: Upscale
              - generic [ref=e85]: 100%
            - generic [ref=e86]:
              - paragraph [ref=e87]: Pyramid yoga pose
              - paragraph [ref=e88]: May 18, 2026, 4:46 AM
            - paragraph [ref=e89]: "Aspect ratio: 9:16"
            - paragraph [ref=e90]: fetch failed
            - button "Delete" [ref=e94]
        - article [ref=e95]:
          - generic [ref=e96]:
            - generic [ref=e97]:
              - paragraph [ref=e99]: Upscale failed
              - paragraph [ref=e100]: Placeholder created at May 18, 2026, 4:46 AM
            - generic [ref=e101]: failed
          - generic [ref=e102]:
            - generic [ref=e103]:
              - generic [ref=e104]: Upscale
              - generic [ref=e105]: 100%
            - generic [ref=e106]:
              - paragraph [ref=e107]: Pyramid yoga pose
              - paragraph [ref=e108]: May 18, 2026, 4:46 AM
            - paragraph [ref=e109]: "Aspect ratio: 9:16"
            - paragraph [ref=e110]: fetch failed
            - button "Delete" [ref=e114]
        - article [ref=e115]:
          - generic [ref=e116]:
            - link "Pyramid yoga pose" [ref=e117] [cursor=pointer]:
              - /url: https://i.ibb.co/3yBWkMs6/upscale-d57aa877-a03c-4cc3-b013-007552b64676.png
              - img "Pyramid yoga pose" [ref=e118]
            - generic [ref=e119]: succeeded
          - generic [ref=e120]:
            - generic [ref=e121]:
              - generic [ref=e122]: Upscale
              - generic [ref=e123]: 100%
            - generic [ref=e124]:
              - paragraph [ref=e125]: Pyramid yoga pose
              - paragraph [ref=e126]: May 18, 2026, 4:42 AM
            - paragraph [ref=e127]: "Aspect ratio: 9:16"
            - generic [ref=e130]:
              - link "Open image" [ref=e131] [cursor=pointer]:
                - /url: https://i.ibb.co/3yBWkMs6/upscale-d57aa877-a03c-4cc3-b013-007552b64676.png
              - link "Download" [ref=e132] [cursor=pointer]:
                - /url: https://i.ibb.co/3yBWkMs6/upscale-d57aa877-a03c-4cc3-b013-007552b64676.png
              - button "Queueing..." [disabled] [ref=e134]
              - button "Delete" [ref=e136]
        - article [ref=e137]:
          - generic [ref=e138]:
            - link "Upscale result" [ref=e139] [cursor=pointer]:
              - /url: https://i.ibb.co/n8BKPYG6/upscale-3bc68c32-e5de-4a22-ba2e-d1a3dc380dfc.png
              - img "Upscale result" [ref=e140]
            - generic [ref=e141]: succeeded
          - generic [ref=e142]:
            - generic [ref=e143]:
              - generic [ref=e144]: Upscale
              - generic [ref=e145]: 100%
            - generic [ref=e146]:
              - paragraph [ref=e147]: Upscaled image ready
              - paragraph [ref=e148]: May 18, 2026, 4:42 AM
            - paragraph [ref=e149]: "Aspect ratio: 9:16"
            - generic [ref=e152]:
              - link "Open image" [ref=e153] [cursor=pointer]:
                - /url: https://i.ibb.co/n8BKPYG6/upscale-3bc68c32-e5de-4a22-ba2e-d1a3dc380dfc.png
              - link "Download" [ref=e154] [cursor=pointer]:
                - /url: https://i.ibb.co/n8BKPYG6/upscale-3bc68c32-e5de-4a22-ba2e-d1a3dc380dfc.png
              - button "AI Upscale" [ref=e156]
              - button "Delete" [ref=e158]
        - article [ref=e159]:
          - generic [ref=e160]:
            - generic [ref=e161]:
              - paragraph [ref=e163]: Upscale failed
              - paragraph [ref=e164]: Placeholder created at May 18, 2026, 4:26 AM
            - generic [ref=e165]: failed
          - generic [ref=e166]:
            - generic [ref=e167]:
              - generic [ref=e168]: Upscale
              - generic [ref=e169]: 100%
            - generic [ref=e170]:
              - paragraph [ref=e171]: Pyramid yoga pose
              - paragraph [ref=e172]: May 18, 2026, 4:26 AM
            - paragraph [ref=e173]: "Aspect ratio: 9:16"
            - paragraph [ref=e174]: fetch failed
            - button "Delete" [ref=e178]
        - article [ref=e179]:
          - generic [ref=e180]:
            - generic [ref=e181]:
              - paragraph [ref=e183]: Upscale failed
              - paragraph [ref=e184]: Placeholder created at May 18, 2026, 4:23 AM
            - generic [ref=e185]: failed
          - generic [ref=e186]:
            - generic [ref=e187]:
              - generic [ref=e188]: Upscale
              - generic [ref=e189]: 100%
            - generic [ref=e190]:
              - paragraph [ref=e191]: Upscale failed
              - paragraph [ref=e192]: May 18, 2026, 4:23 AM
            - paragraph [ref=e193]: "Aspect ratio: 9:16"
            - paragraph [ref=e194]: fetch failed
            - button "Delete" [ref=e198]
        - article [ref=e199]:
          - generic [ref=e200]:
            - generic [ref=e201]:
              - paragraph [ref=e203]: Upscale failed
              - paragraph [ref=e204]: Placeholder created at May 18, 2026, 4:21 AM
            - generic [ref=e205]: failed
          - generic [ref=e206]:
            - generic [ref=e207]:
              - generic [ref=e208]: Upscale
              - generic [ref=e209]: 100%
            - generic [ref=e210]:
              - paragraph [ref=e211]: Pyramid yoga pose
              - paragraph [ref=e212]: May 18, 2026, 4:21 AM
            - paragraph [ref=e213]: "Aspect ratio: 9:16"
            - paragraph [ref=e214]: fetch failed
            - button "Delete" [ref=e218]
        - article [ref=e219]:
          - generic [ref=e220]:
            - generic [ref=e221]:
              - paragraph [ref=e223]: Upscale failed
              - paragraph [ref=e224]: Placeholder created at May 18, 2026, 4:18 AM
            - generic [ref=e225]: failed
          - generic [ref=e226]:
            - generic [ref=e227]:
              - generic [ref=e228]: Upscale
              - generic [ref=e229]: 100%
            - generic [ref=e230]:
              - paragraph [ref=e231]: Upscale failed
              - paragraph [ref=e232]: May 18, 2026, 4:18 AM
            - paragraph [ref=e233]: "Aspect ratio: 9:16"
            - paragraph [ref=e234]: fetch failed
            - button "Delete" [ref=e238]
        - article [ref=e239]:
          - generic [ref=e240]:
            - generic [ref=e241]:
              - paragraph [ref=e243]: Upscale failed
              - paragraph [ref=e244]: Placeholder created at May 18, 2026, 4:17 AM
            - generic [ref=e245]: failed
          - generic [ref=e246]:
            - generic [ref=e247]:
              - generic [ref=e248]: Upscale
              - generic [ref=e249]: 100%
            - generic [ref=e250]:
              - paragraph [ref=e251]: Upscale failed
              - paragraph [ref=e252]: May 18, 2026, 4:18 AM
            - paragraph [ref=e253]: "Aspect ratio: 9:16"
            - paragraph [ref=e254]: fetch failed
            - button "Delete" [ref=e258]
        - article [ref=e259]:
          - generic [ref=e260]:
            - link "Codex Then Tryon result" [ref=e261] [cursor=pointer]:
              - /url: https://i.ibb.co/R4sSkHxJ/codex-codex-image.png
              - img "Codex Then Tryon result" [ref=e262]
            - generic [ref=e263]: failed
          - generic [ref=e264]:
            - generic [ref=e265]:
              - generic [ref=e266]: Codex Then Tryon
              - generic [ref=e267]: 100%
            - generic [ref=e268]:
              - paragraph [ref=e269]: Codex or try-on failed
              - paragraph [ref=e270]: May 18, 2026, 2:57 AM
            - paragraph [ref=e271]: "Aspect ratio: 9:16"
            - paragraph [ref=e272]: identityImages[0] must include base64, dataUrl, or path
            - generic [ref=e275]:
              - link "Open image" [ref=e276] [cursor=pointer]:
                - /url: https://i.ibb.co/R4sSkHxJ/codex-codex-image.png
              - link "Download" [ref=e277] [cursor=pointer]:
                - /url: https://i.ibb.co/R4sSkHxJ/codex-codex-image.png
              - button "AI Upscale" [ref=e279]
              - button "Delete" [ref=e281]
        - article [ref=e282]:
          - generic [ref=e283]:
            - link "Codex Then Tryon result" [ref=e284] [cursor=pointer]:
              - /url: https://i.ibb.co/XnNxNHx/codex-codex-image.png
              - img "Codex Then Tryon result" [ref=e285]
            - generic [ref=e286]: failed
          - generic [ref=e287]:
            - generic [ref=e288]:
              - generic [ref=e289]: Codex Then Tryon
              - generic [ref=e290]: 100%
            - generic [ref=e291]:
              - paragraph [ref=e292]: Codex or try-on failed
              - paragraph [ref=e293]: May 18, 2026, 2:50 AM
            - paragraph [ref=e294]: "Aspect ratio: 9:16"
            - paragraph [ref=e295]: identityImages[0] must include base64, dataUrl, or path
            - generic [ref=e298]:
              - link "Open image" [ref=e299] [cursor=pointer]:
                - /url: https://i.ibb.co/XnNxNHx/codex-codex-image.png
              - link "Download" [ref=e300] [cursor=pointer]:
                - /url: https://i.ibb.co/XnNxNHx/codex-codex-image.png
              - button "AI Upscale" [ref=e302]
              - button "Delete" [ref=e304]
        - article [ref=e305]:
          - generic [ref=e306]:
            - link "same woman doing pyramid pose, hands back" [ref=e307] [cursor=pointer]:
              - /url: https://i.ibb.co/60Zx6fyW/codex-codex-image.png
              - img "same woman doing pyramid pose, hands back" [ref=e308]
            - generic [ref=e309]: failed
          - generic [ref=e310]:
            - generic [ref=e311]:
              - generic [ref=e312]: Codex Then Tryon
              - generic [ref=e313]: 100%
            - generic [ref=e314]:
              - paragraph [ref=e315]: same woman doing pyramid pose, hands back
              - paragraph [ref=e316]: May 18, 2026, 2:47 AM
            - paragraph [ref=e317]: "Aspect ratio: 16:9"
            - paragraph [ref=e318]: identityImages[0] must include base64, dataUrl, or path
            - generic [ref=e321]:
              - link "Open image" [ref=e322] [cursor=pointer]:
                - /url: https://i.ibb.co/60Zx6fyW/codex-codex-image.png
              - link "Download" [ref=e323] [cursor=pointer]:
                - /url: https://i.ibb.co/60Zx6fyW/codex-codex-image.png
              - button "AI Upscale" [ref=e325]
              - button "Delete" [ref=e327]
        - article [ref=e328]:
          - generic [ref=e329]:
            - link "Codex Then Tryon result" [ref=e330] [cursor=pointer]:
              - /url: https://i.ibb.co/v4bZkN1T/codex-codex-image.png
              - img "Codex Then Tryon result" [ref=e331]
            - generic [ref=e332]: failed
          - generic [ref=e333]:
            - generic [ref=e334]:
              - generic [ref=e335]: Codex Then Tryon
              - generic [ref=e336]: 100%
            - generic [ref=e337]:
              - paragraph [ref=e338]: Codex or try-on failed
              - paragraph [ref=e339]: May 18, 2026, 2:01 AM
            - paragraph [ref=e340]: "Aspect ratio: 16:9"
            - paragraph [ref=e341]: identityImages[0] must include base64, dataUrl, or path
            - generic [ref=e344]:
              - link "Open image" [ref=e345] [cursor=pointer]:
                - /url: https://i.ibb.co/v4bZkN1T/codex-codex-image.png
              - link "Download" [ref=e346] [cursor=pointer]:
                - /url: https://i.ibb.co/v4bZkN1T/codex-codex-image.png
              - button "AI Upscale" [ref=e348]
              - button "Delete" [ref=e350]
        - article [ref=e351]:
          - generic [ref=e352]:
            - link "Codex Then Tryon result" [ref=e353] [cursor=pointer]:
              - /url: https://i.ibb.co/9MZp6Fd/codex-codex-image.png
              - img "Codex Then Tryon result" [ref=e354]
            - generic [ref=e355]: failed
          - generic [ref=e356]:
            - generic [ref=e357]:
              - generic [ref=e358]: Codex Then Tryon
              - generic [ref=e359]: 100%
            - generic [ref=e360]:
              - paragraph [ref=e361]: Codex or try-on failed
              - paragraph [ref=e362]: May 18, 2026, 1:46 AM
            - paragraph [ref=e363]: "Aspect ratio: 9:16"
            - paragraph [ref=e364]: identityImages[0] must include base64, dataUrl, or path
            - generic [ref=e367]:
              - link "Open image" [ref=e368] [cursor=pointer]:
                - /url: https://i.ibb.co/9MZp6Fd/codex-codex-image.png
              - link "Download" [ref=e369] [cursor=pointer]:
                - /url: https://i.ibb.co/9MZp6Fd/codex-codex-image.png
              - button "AI Upscale" [ref=e371]
              - button "Delete" [ref=e373]
        - article [ref=e374]:
          - generic [ref=e375]:
            - link "Codex Then Tryon result" [ref=e376] [cursor=pointer]:
              - /url: https://i.ibb.co/23RSJQM8/codex-codex-image.png
              - img "Codex Then Tryon result" [ref=e377]
            - generic [ref=e378]: failed
          - generic [ref=e379]:
            - generic [ref=e380]:
              - generic [ref=e381]: Codex Then Tryon
              - generic [ref=e382]: 100%
            - generic [ref=e383]:
              - paragraph [ref=e384]: Codex or try-on failed
              - paragraph [ref=e385]: May 18, 2026, 12:35 AM
            - paragraph [ref=e386]: "Aspect ratio: 9:16"
            - paragraph [ref=e387]: identityImages[0] must include base64, dataUrl, or path
            - generic [ref=e390]:
              - link "Open image" [ref=e391] [cursor=pointer]:
                - /url: https://i.ibb.co/23RSJQM8/codex-codex-image.png
              - link "Download" [ref=e392] [cursor=pointer]:
                - /url: https://i.ibb.co/23RSJQM8/codex-codex-image.png
              - button "AI Upscale" [ref=e394]
              - button "Delete" [ref=e396]
        - article [ref=e397]:
          - generic [ref=e398]:
            - link "woman doing pyramid pose looking downwards" [ref=e399] [cursor=pointer]:
              - /url: https://i.ibb.co/sT6sp73/codex-codex-image.png
              - img "woman doing pyramid pose looking downwards" [ref=e400]
            - generic [ref=e401]: failed
          - generic [ref=e402]:
            - generic [ref=e403]:
              - generic [ref=e404]: Codex Then Tryon
              - generic [ref=e405]: 100%
            - generic [ref=e406]:
              - paragraph [ref=e407]: woman doing pyramid pose looking downwards
              - paragraph [ref=e408]: May 18, 2026, 12:21 AM
            - paragraph [ref=e409]: "Aspect ratio: 9:16"
            - paragraph [ref=e410]: identityImages[0] must include base64, dataUrl, or path
            - generic [ref=e413]:
              - link "Open image" [ref=e414] [cursor=pointer]:
                - /url: https://i.ibb.co/sT6sp73/codex-codex-image.png
              - link "Download" [ref=e415] [cursor=pointer]:
                - /url: https://i.ibb.co/sT6sp73/codex-codex-image.png
              - button "AI Upscale" [ref=e417]
              - button "Delete" [ref=e419]
        - article [ref=e420]:
          - generic [ref=e421]:
            - link "Pyramid yoga pose" [ref=e422] [cursor=pointer]:
              - /url: https://i.ibb.co/MkLP52TL/codex-codex-image.png
              - img "Pyramid yoga pose" [ref=e423]
            - generic [ref=e424]: succeeded
          - generic [ref=e425]:
            - generic [ref=e426]:
              - generic [ref=e427]: Codex
              - generic [ref=e428]: 100%
            - generic [ref=e429]:
              - paragraph [ref=e430]: Pyramid yoga pose
              - paragraph [ref=e431]: May 17, 2026, 10:45 PM
            - paragraph [ref=e432]: "Aspect ratio: 9:16"
            - generic [ref=e435]:
              - link "Open image" [ref=e436] [cursor=pointer]:
                - /url: https://i.ibb.co/MkLP52TL/codex-codex-image.png
              - link "Download" [ref=e437] [cursor=pointer]:
                - /url: https://i.ibb.co/MkLP52TL/codex-codex-image.png
              - button "AI Upscale" [ref=e439]
              - button "Delete" [ref=e441]
        - article [ref=e442]:
          - generic [ref=e443]:
            - link "Professional fashion editorial portrait" [ref=e444] [cursor=pointer]:
              - /url: https://i.ibb.co/8gsjtDr0/codex-image.png
              - img "Professional fashion editorial portrait" [ref=e445]
            - generic [ref=e446]: succeeded
          - generic [ref=e447]:
            - generic [ref=e448]:
              - generic [ref=e449]: Codex
              - generic [ref=e450]: 100%
            - generic [ref=e451]:
              - paragraph [ref=e452]: Professional fashion editorial portrait
              - paragraph [ref=e453]: May 17, 2026, 6:27 PM
            - paragraph [ref=e454]: "Aspect ratio: 9:16"
            - generic [ref=e457]:
              - link "Open image" [ref=e458] [cursor=pointer]:
                - /url: https://i.ibb.co/8gsjtDr0/codex-image.png
              - link "Download" [ref=e459] [cursor=pointer]:
                - /url: https://i.ibb.co/8gsjtDr0/codex-image.png
              - button "AI Upscale" [ref=e461]
              - button "Delete" [ref=e463]
  - alert [ref=e464]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const BASE_URL = 'https://gptimage.pixilens.app';
  4  | 
  5  | test('AI Upscale button creates placeholder in gallery', async ({ page }) => {
  6  |   // 1. Go to gallery
  7  |   await page.goto(`${BASE_URL}/images`);
  8  |   
  9  |   // Wait for images to load
  10 |   await page.waitForSelector('article', { timeout: 30000 });
  11 |   
  12 |   // 2. Find the first image with an AI Upscale button
  13 |   // We'll wait for the button specifically
  14 |   const upscaleButton = page.locator('button').filter({ hasText: /^AI Upscale$/ }).first();
  15 |   await upscaleButton.waitFor({ state: 'visible', timeout: 30000 });
  16 |   
  17 |   await page.screenshot({ path: 'tests/screenshots/before_click.png' });
  18 |   
  19 |   // 3. Click upscale
  20 |   await upscaleButton.click();
  21 |   
  22 |   await page.screenshot({ path: 'tests/screenshots/after_click.png' });
  23 |   
  24 |   // 4. Verify placeholder appears (it should be the first card now)
  25 |   // The placeholder usually has status "Queued AI upscale"
  26 |   const placeholder = page.locator('article').first();
  27 |   await expect(placeholder).toContainText(/Queued AI upscale|processing|succeeded|failed/i, { timeout: 30000 });
  28 |   
  29 |   const status = await placeholder.locator('.absolute.left-3.top-3').textContent();
  30 |   console.log(`Current status: ${status}`);
  31 |   
  32 |   if (status === 'failed') {
  33 |     const errorText = await placeholder.locator('p.text-red-200').textContent();
  34 |     console.error(`Upscale failed with error: ${errorText}`);
> 35 |     throw new Error(`Upscale failed: ${errorText}`);
     |           ^ Error: Upscale failed: fetch failed
  36 |   }
  37 |   
  38 |   // 5. Verify it moves to "processing"
  39 |   await expect(placeholder).toContainText(/processing/i, { timeout: 60000 });
  40 |   
  41 |   await page.screenshot({ path: 'tests/screenshots/final.png' });
  42 | });
  43 | 
```