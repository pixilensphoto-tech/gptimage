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
              - paragraph [ref=e20]: Placeholder created at May 18, 2026, 4:52 AM
            - generic [ref=e21]: failed
          - generic [ref=e22]:
            - generic [ref=e23]:
              - generic [ref=e24]: Upscale
              - generic [ref=e25]: 100%
            - generic [ref=e26]:
              - paragraph [ref=e27]: Pyramid yoga pose
              - paragraph [ref=e28]: May 18, 2026, 4:52 AM
            - paragraph [ref=e29]: "Aspect ratio: 9:16"
            - paragraph [ref=e30]: fetch failed
            - button "Delete" [ref=e34]
        - article [ref=e35]:
          - generic [ref=e36]:
            - generic [ref=e37]:
              - paragraph [ref=e39]: Upscale failed
              - paragraph [ref=e40]: Placeholder created at May 18, 2026, 4:46 AM
            - generic [ref=e41]: failed
          - generic [ref=e42]:
            - generic [ref=e43]:
              - generic [ref=e44]: Upscale
              - generic [ref=e45]: 100%
            - generic [ref=e46]:
              - paragraph [ref=e47]: Professional fashion editorial portrait
              - paragraph [ref=e48]: May 18, 2026, 4:46 AM
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
              - paragraph [ref=e67]: Pyramid yoga pose
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
            - link "Pyramid yoga pose" [ref=e97] [cursor=pointer]:
              - /url: https://i.ibb.co/3yBWkMs6/upscale-d57aa877-a03c-4cc3-b013-007552b64676.png
              - img "Pyramid yoga pose" [ref=e98]
            - generic [ref=e99]: succeeded
          - generic [ref=e100]:
            - generic [ref=e101]:
              - generic [ref=e102]: Upscale
              - generic [ref=e103]: 100%
            - generic [ref=e104]:
              - paragraph [ref=e105]: Pyramid yoga pose
              - paragraph [ref=e106]: May 18, 2026, 4:42 AM
            - paragraph [ref=e107]: "Aspect ratio: 9:16"
            - generic [ref=e110]:
              - link "Open image" [ref=e111] [cursor=pointer]:
                - /url: https://i.ibb.co/3yBWkMs6/upscale-d57aa877-a03c-4cc3-b013-007552b64676.png
              - link "Download" [ref=e112] [cursor=pointer]:
                - /url: https://i.ibb.co/3yBWkMs6/upscale-d57aa877-a03c-4cc3-b013-007552b64676.png
              - button "Queueing..." [disabled] [ref=e114]
              - button "Delete" [ref=e116]
        - article [ref=e117]:
          - generic [ref=e118]:
            - link "Upscale result" [ref=e119] [cursor=pointer]:
              - /url: https://i.ibb.co/n8BKPYG6/upscale-3bc68c32-e5de-4a22-ba2e-d1a3dc380dfc.png
              - img "Upscale result" [ref=e120]
            - generic [ref=e121]: succeeded
          - generic [ref=e122]:
            - generic [ref=e123]:
              - generic [ref=e124]: Upscale
              - generic [ref=e125]: 100%
            - generic [ref=e126]:
              - paragraph [ref=e127]: Upscaled image ready
              - paragraph [ref=e128]: May 18, 2026, 4:42 AM
            - paragraph [ref=e129]: "Aspect ratio: 9:16"
            - generic [ref=e132]:
              - link "Open image" [ref=e133] [cursor=pointer]:
                - /url: https://i.ibb.co/n8BKPYG6/upscale-3bc68c32-e5de-4a22-ba2e-d1a3dc380dfc.png
              - link "Download" [ref=e134] [cursor=pointer]:
                - /url: https://i.ibb.co/n8BKPYG6/upscale-3bc68c32-e5de-4a22-ba2e-d1a3dc380dfc.png
              - button "AI Upscale" [ref=e136]
              - button "Delete" [ref=e138]
        - article [ref=e139]:
          - generic [ref=e140]:
            - generic [ref=e141]:
              - paragraph [ref=e143]: Upscale failed
              - paragraph [ref=e144]: Placeholder created at May 18, 2026, 4:26 AM
            - generic [ref=e145]: failed
          - generic [ref=e146]:
            - generic [ref=e147]:
              - generic [ref=e148]: Upscale
              - generic [ref=e149]: 100%
            - generic [ref=e150]:
              - paragraph [ref=e151]: Pyramid yoga pose
              - paragraph [ref=e152]: May 18, 2026, 4:26 AM
            - paragraph [ref=e153]: "Aspect ratio: 9:16"
            - paragraph [ref=e154]: fetch failed
            - button "Delete" [ref=e158]
        - article [ref=e159]:
          - generic [ref=e160]:
            - generic [ref=e161]:
              - paragraph [ref=e163]: Upscale failed
              - paragraph [ref=e164]: Placeholder created at May 18, 2026, 4:23 AM
            - generic [ref=e165]: failed
          - generic [ref=e166]:
            - generic [ref=e167]:
              - generic [ref=e168]: Upscale
              - generic [ref=e169]: 100%
            - generic [ref=e170]:
              - paragraph [ref=e171]: Upscale failed
              - paragraph [ref=e172]: May 18, 2026, 4:23 AM
            - paragraph [ref=e173]: "Aspect ratio: 9:16"
            - paragraph [ref=e174]: fetch failed
            - button "Delete" [ref=e178]
        - article [ref=e179]:
          - generic [ref=e180]:
            - generic [ref=e181]:
              - paragraph [ref=e183]: Upscale failed
              - paragraph [ref=e184]: Placeholder created at May 18, 2026, 4:21 AM
            - generic [ref=e185]: failed
          - generic [ref=e186]:
            - generic [ref=e187]:
              - generic [ref=e188]: Upscale
              - generic [ref=e189]: 100%
            - generic [ref=e190]:
              - paragraph [ref=e191]: Pyramid yoga pose
              - paragraph [ref=e192]: May 18, 2026, 4:21 AM
            - paragraph [ref=e193]: "Aspect ratio: 9:16"
            - paragraph [ref=e194]: fetch failed
            - button "Delete" [ref=e198]
        - article [ref=e199]:
          - generic [ref=e200]:
            - generic [ref=e201]:
              - paragraph [ref=e203]: Upscale failed
              - paragraph [ref=e204]: Placeholder created at May 18, 2026, 4:18 AM
            - generic [ref=e205]: failed
          - generic [ref=e206]:
            - generic [ref=e207]:
              - generic [ref=e208]: Upscale
              - generic [ref=e209]: 100%
            - generic [ref=e210]:
              - paragraph [ref=e211]: Upscale failed
              - paragraph [ref=e212]: May 18, 2026, 4:18 AM
            - paragraph [ref=e213]: "Aspect ratio: 9:16"
            - paragraph [ref=e214]: fetch failed
            - button "Delete" [ref=e218]
        - article [ref=e219]:
          - generic [ref=e220]:
            - generic [ref=e221]:
              - paragraph [ref=e223]: Upscale failed
              - paragraph [ref=e224]: Placeholder created at May 18, 2026, 4:17 AM
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
            - link "Codex Then Tryon result" [ref=e241] [cursor=pointer]:
              - /url: https://i.ibb.co/R4sSkHxJ/codex-codex-image.png
              - img "Codex Then Tryon result" [ref=e242]
            - generic [ref=e243]: failed
          - generic [ref=e244]:
            - generic [ref=e245]:
              - generic [ref=e246]: Codex Then Tryon
              - generic [ref=e247]: 100%
            - generic [ref=e248]:
              - paragraph [ref=e249]: Codex or try-on failed
              - paragraph [ref=e250]: May 18, 2026, 2:57 AM
            - paragraph [ref=e251]: "Aspect ratio: 9:16"
            - paragraph [ref=e252]: identityImages[0] must include base64, dataUrl, or path
            - generic [ref=e255]:
              - link "Open image" [ref=e256] [cursor=pointer]:
                - /url: https://i.ibb.co/R4sSkHxJ/codex-codex-image.png
              - link "Download" [ref=e257] [cursor=pointer]:
                - /url: https://i.ibb.co/R4sSkHxJ/codex-codex-image.png
              - button "AI Upscale" [ref=e259]
              - button "Delete" [ref=e261]
        - article [ref=e262]:
          - generic [ref=e263]:
            - link "Codex Then Tryon result" [ref=e264] [cursor=pointer]:
              - /url: https://i.ibb.co/XnNxNHx/codex-codex-image.png
              - img "Codex Then Tryon result" [ref=e265]
            - generic [ref=e266]: failed
          - generic [ref=e267]:
            - generic [ref=e268]:
              - generic [ref=e269]: Codex Then Tryon
              - generic [ref=e270]: 100%
            - generic [ref=e271]:
              - paragraph [ref=e272]: Codex or try-on failed
              - paragraph [ref=e273]: May 18, 2026, 2:50 AM
            - paragraph [ref=e274]: "Aspect ratio: 9:16"
            - paragraph [ref=e275]: identityImages[0] must include base64, dataUrl, or path
            - generic [ref=e278]:
              - link "Open image" [ref=e279] [cursor=pointer]:
                - /url: https://i.ibb.co/XnNxNHx/codex-codex-image.png
              - link "Download" [ref=e280] [cursor=pointer]:
                - /url: https://i.ibb.co/XnNxNHx/codex-codex-image.png
              - button "AI Upscale" [ref=e282]
              - button "Delete" [ref=e284]
        - article [ref=e285]:
          - generic [ref=e286]:
            - link "same woman doing pyramid pose, hands back" [ref=e287] [cursor=pointer]:
              - /url: https://i.ibb.co/60Zx6fyW/codex-codex-image.png
              - img "same woman doing pyramid pose, hands back" [ref=e288]
            - generic [ref=e289]: failed
          - generic [ref=e290]:
            - generic [ref=e291]:
              - generic [ref=e292]: Codex Then Tryon
              - generic [ref=e293]: 100%
            - generic [ref=e294]:
              - paragraph [ref=e295]: same woman doing pyramid pose, hands back
              - paragraph [ref=e296]: May 18, 2026, 2:47 AM
            - paragraph [ref=e297]: "Aspect ratio: 16:9"
            - paragraph [ref=e298]: identityImages[0] must include base64, dataUrl, or path
            - generic [ref=e301]:
              - link "Open image" [ref=e302] [cursor=pointer]:
                - /url: https://i.ibb.co/60Zx6fyW/codex-codex-image.png
              - link "Download" [ref=e303] [cursor=pointer]:
                - /url: https://i.ibb.co/60Zx6fyW/codex-codex-image.png
              - button "AI Upscale" [ref=e305]
              - button "Delete" [ref=e307]
        - article [ref=e308]:
          - generic [ref=e309]:
            - link "Codex Then Tryon result" [ref=e310] [cursor=pointer]:
              - /url: https://i.ibb.co/v4bZkN1T/codex-codex-image.png
              - img "Codex Then Tryon result" [ref=e311]
            - generic [ref=e312]: failed
          - generic [ref=e313]:
            - generic [ref=e314]:
              - generic [ref=e315]: Codex Then Tryon
              - generic [ref=e316]: 100%
            - generic [ref=e317]:
              - paragraph [ref=e318]: Codex or try-on failed
              - paragraph [ref=e319]: May 18, 2026, 2:01 AM
            - paragraph [ref=e320]: "Aspect ratio: 16:9"
            - paragraph [ref=e321]: identityImages[0] must include base64, dataUrl, or path
            - generic [ref=e324]:
              - link "Open image" [ref=e325] [cursor=pointer]:
                - /url: https://i.ibb.co/v4bZkN1T/codex-codex-image.png
              - link "Download" [ref=e326] [cursor=pointer]:
                - /url: https://i.ibb.co/v4bZkN1T/codex-codex-image.png
              - button "AI Upscale" [ref=e328]
              - button "Delete" [ref=e330]
        - article [ref=e331]:
          - generic [ref=e332]:
            - link "Codex Then Tryon result" [ref=e333] [cursor=pointer]:
              - /url: https://i.ibb.co/9MZp6Fd/codex-codex-image.png
              - img "Codex Then Tryon result" [ref=e334]
            - generic [ref=e335]: failed
          - generic [ref=e336]:
            - generic [ref=e337]:
              - generic [ref=e338]: Codex Then Tryon
              - generic [ref=e339]: 100%
            - generic [ref=e340]:
              - paragraph [ref=e341]: Codex or try-on failed
              - paragraph [ref=e342]: May 18, 2026, 1:46 AM
            - paragraph [ref=e343]: "Aspect ratio: 9:16"
            - paragraph [ref=e344]: identityImages[0] must include base64, dataUrl, or path
            - generic [ref=e347]:
              - link "Open image" [ref=e348] [cursor=pointer]:
                - /url: https://i.ibb.co/9MZp6Fd/codex-codex-image.png
              - link "Download" [ref=e349] [cursor=pointer]:
                - /url: https://i.ibb.co/9MZp6Fd/codex-codex-image.png
              - button "AI Upscale" [ref=e351]
              - button "Delete" [ref=e353]
        - article [ref=e354]:
          - generic [ref=e355]:
            - link "Codex Then Tryon result" [ref=e356] [cursor=pointer]:
              - /url: https://i.ibb.co/23RSJQM8/codex-codex-image.png
              - img "Codex Then Tryon result" [ref=e357]
            - generic [ref=e358]: failed
          - generic [ref=e359]:
            - generic [ref=e360]:
              - generic [ref=e361]: Codex Then Tryon
              - generic [ref=e362]: 100%
            - generic [ref=e363]:
              - paragraph [ref=e364]: Codex or try-on failed
              - paragraph [ref=e365]: May 18, 2026, 12:35 AM
            - paragraph [ref=e366]: "Aspect ratio: 9:16"
            - paragraph [ref=e367]: identityImages[0] must include base64, dataUrl, or path
            - generic [ref=e370]:
              - link "Open image" [ref=e371] [cursor=pointer]:
                - /url: https://i.ibb.co/23RSJQM8/codex-codex-image.png
              - link "Download" [ref=e372] [cursor=pointer]:
                - /url: https://i.ibb.co/23RSJQM8/codex-codex-image.png
              - button "AI Upscale" [ref=e374]
              - button "Delete" [ref=e376]
        - article [ref=e377]:
          - generic [ref=e378]:
            - link "woman doing pyramid pose looking downwards" [ref=e379] [cursor=pointer]:
              - /url: https://i.ibb.co/sT6sp73/codex-codex-image.png
              - img "woman doing pyramid pose looking downwards" [ref=e380]
            - generic [ref=e381]: failed
          - generic [ref=e382]:
            - generic [ref=e383]:
              - generic [ref=e384]: Codex Then Tryon
              - generic [ref=e385]: 100%
            - generic [ref=e386]:
              - paragraph [ref=e387]: woman doing pyramid pose looking downwards
              - paragraph [ref=e388]: May 18, 2026, 12:21 AM
            - paragraph [ref=e389]: "Aspect ratio: 9:16"
            - paragraph [ref=e390]: identityImages[0] must include base64, dataUrl, or path
            - generic [ref=e393]:
              - link "Open image" [ref=e394] [cursor=pointer]:
                - /url: https://i.ibb.co/sT6sp73/codex-codex-image.png
              - link "Download" [ref=e395] [cursor=pointer]:
                - /url: https://i.ibb.co/sT6sp73/codex-codex-image.png
              - button "AI Upscale" [ref=e397]
              - button "Delete" [ref=e399]
        - article [ref=e400]:
          - generic [ref=e401]:
            - link "Pyramid yoga pose" [ref=e402] [cursor=pointer]:
              - /url: https://i.ibb.co/MkLP52TL/codex-codex-image.png
              - img "Pyramid yoga pose" [ref=e403]
            - generic [ref=e404]: succeeded
          - generic [ref=e405]:
            - generic [ref=e406]:
              - generic [ref=e407]: Codex
              - generic [ref=e408]: 100%
            - generic [ref=e409]:
              - paragraph [ref=e410]: Pyramid yoga pose
              - paragraph [ref=e411]: May 17, 2026, 10:45 PM
            - paragraph [ref=e412]: "Aspect ratio: 9:16"
            - generic [ref=e415]:
              - link "Open image" [ref=e416] [cursor=pointer]:
                - /url: https://i.ibb.co/MkLP52TL/codex-codex-image.png
              - link "Download" [ref=e417] [cursor=pointer]:
                - /url: https://i.ibb.co/MkLP52TL/codex-codex-image.png
              - button "AI Upscale" [ref=e419]
              - button "Delete" [ref=e421]
        - article [ref=e422]:
          - generic [ref=e423]:
            - link "Professional fashion editorial portrait" [ref=e424] [cursor=pointer]:
              - /url: https://i.ibb.co/8gsjtDr0/codex-image.png
              - img "Professional fashion editorial portrait" [ref=e425]
            - generic [ref=e426]: succeeded
          - generic [ref=e427]:
            - generic [ref=e428]:
              - generic [ref=e429]: Codex
              - generic [ref=e430]: 100%
            - generic [ref=e431]:
              - paragraph [ref=e432]: Professional fashion editorial portrait
              - paragraph [ref=e433]: May 17, 2026, 6:27 PM
            - paragraph [ref=e434]: "Aspect ratio: 9:16"
            - generic [ref=e437]:
              - link "Open image" [ref=e438] [cursor=pointer]:
                - /url: https://i.ibb.co/8gsjtDr0/codex-image.png
              - link "Download" [ref=e439] [cursor=pointer]:
                - /url: https://i.ibb.co/8gsjtDr0/codex-image.png
              - button "AI Upscale" [ref=e441]
              - button "Delete" [ref=e443]
  - alert [ref=e444]
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