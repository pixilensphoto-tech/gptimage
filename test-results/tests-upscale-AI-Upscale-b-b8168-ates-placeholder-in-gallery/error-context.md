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
              - paragraph [ref=e20]: Placeholder created at May 18, 2026, 4:46 AM
            - generic [ref=e21]: failed
          - generic [ref=e22]:
            - generic [ref=e23]:
              - generic [ref=e24]: Upscale
              - generic [ref=e25]: 100%
            - generic [ref=e26]:
              - paragraph [ref=e27]: Pyramid yoga pose
              - paragraph [ref=e28]: May 18, 2026, 4:46 AM
            - paragraph [ref=e29]: "Aspect ratio: 9:16"
            - paragraph [ref=e30]: fetch failed
            - button "Delete" [ref=e34]
        - article [ref=e35]:
          - generic [ref=e36]:
            - link "Pyramid yoga pose" [ref=e37] [cursor=pointer]:
              - /url: https://i.ibb.co/3yBWkMs6/upscale-d57aa877-a03c-4cc3-b013-007552b64676.png
              - img "Pyramid yoga pose" [ref=e38]
            - generic [ref=e39]: succeeded
          - generic [ref=e40]:
            - generic [ref=e41]:
              - generic [ref=e42]: Upscale
              - generic [ref=e43]: 100%
            - generic [ref=e44]:
              - paragraph [ref=e45]: Pyramid yoga pose
              - paragraph [ref=e46]: May 18, 2026, 4:42 AM
            - paragraph [ref=e47]: "Aspect ratio: 9:16"
            - generic [ref=e50]:
              - link "Open image" [ref=e51] [cursor=pointer]:
                - /url: https://i.ibb.co/3yBWkMs6/upscale-d57aa877-a03c-4cc3-b013-007552b64676.png
              - link "Download" [ref=e52] [cursor=pointer]:
                - /url: https://i.ibb.co/3yBWkMs6/upscale-d57aa877-a03c-4cc3-b013-007552b64676.png
              - button "Queueing..." [disabled] [ref=e54]
              - button "Delete" [ref=e56]
        - article [ref=e57]:
          - generic [ref=e58]:
            - link "Upscale result" [ref=e59] [cursor=pointer]:
              - /url: https://i.ibb.co/n8BKPYG6/upscale-3bc68c32-e5de-4a22-ba2e-d1a3dc380dfc.png
              - img "Upscale result" [ref=e60]
            - generic [ref=e61]: succeeded
          - generic [ref=e62]:
            - generic [ref=e63]:
              - generic [ref=e64]: Upscale
              - generic [ref=e65]: 100%
            - generic [ref=e66]:
              - paragraph [ref=e67]: Upscaled image ready
              - paragraph [ref=e68]: May 18, 2026, 4:42 AM
            - paragraph [ref=e69]: "Aspect ratio: 9:16"
            - generic [ref=e72]:
              - link "Open image" [ref=e73] [cursor=pointer]:
                - /url: https://i.ibb.co/n8BKPYG6/upscale-3bc68c32-e5de-4a22-ba2e-d1a3dc380dfc.png
              - link "Download" [ref=e74] [cursor=pointer]:
                - /url: https://i.ibb.co/n8BKPYG6/upscale-3bc68c32-e5de-4a22-ba2e-d1a3dc380dfc.png
              - button "AI Upscale" [ref=e76]
              - button "Delete" [ref=e78]
        - article [ref=e79]:
          - generic [ref=e80]:
            - generic [ref=e81]:
              - paragraph [ref=e83]: Upscale failed
              - paragraph [ref=e84]: Placeholder created at May 18, 2026, 4:26 AM
            - generic [ref=e85]: failed
          - generic [ref=e86]:
            - generic [ref=e87]:
              - generic [ref=e88]: Upscale
              - generic [ref=e89]: 100%
            - generic [ref=e90]:
              - paragraph [ref=e91]: Pyramid yoga pose
              - paragraph [ref=e92]: May 18, 2026, 4:26 AM
            - paragraph [ref=e93]: "Aspect ratio: 9:16"
            - paragraph [ref=e94]: fetch failed
            - button "Delete" [ref=e98]
        - article [ref=e99]:
          - generic [ref=e100]:
            - generic [ref=e101]:
              - paragraph [ref=e103]: Upscale failed
              - paragraph [ref=e104]: Placeholder created at May 18, 2026, 4:23 AM
            - generic [ref=e105]: failed
          - generic [ref=e106]:
            - generic [ref=e107]:
              - generic [ref=e108]: Upscale
              - generic [ref=e109]: 100%
            - generic [ref=e110]:
              - paragraph [ref=e111]: Upscale failed
              - paragraph [ref=e112]: May 18, 2026, 4:23 AM
            - paragraph [ref=e113]: "Aspect ratio: 9:16"
            - paragraph [ref=e114]: fetch failed
            - button "Delete" [ref=e118]
        - article [ref=e119]:
          - generic [ref=e120]:
            - generic [ref=e121]:
              - paragraph [ref=e123]: Upscale failed
              - paragraph [ref=e124]: Placeholder created at May 18, 2026, 4:21 AM
            - generic [ref=e125]: failed
          - generic [ref=e126]:
            - generic [ref=e127]:
              - generic [ref=e128]: Upscale
              - generic [ref=e129]: 100%
            - generic [ref=e130]:
              - paragraph [ref=e131]: Pyramid yoga pose
              - paragraph [ref=e132]: May 18, 2026, 4:21 AM
            - paragraph [ref=e133]: "Aspect ratio: 9:16"
            - paragraph [ref=e134]: fetch failed
            - button "Delete" [ref=e138]
        - article [ref=e139]:
          - generic [ref=e140]:
            - generic [ref=e141]:
              - paragraph [ref=e143]: Upscale failed
              - paragraph [ref=e144]: Placeholder created at May 18, 2026, 4:18 AM
            - generic [ref=e145]: failed
          - generic [ref=e146]:
            - generic [ref=e147]:
              - generic [ref=e148]: Upscale
              - generic [ref=e149]: 100%
            - generic [ref=e150]:
              - paragraph [ref=e151]: Upscale failed
              - paragraph [ref=e152]: May 18, 2026, 4:18 AM
            - paragraph [ref=e153]: "Aspect ratio: 9:16"
            - paragraph [ref=e154]: fetch failed
            - button "Delete" [ref=e158]
        - article [ref=e159]:
          - generic [ref=e160]:
            - generic [ref=e161]:
              - paragraph [ref=e163]: Upscale failed
              - paragraph [ref=e164]: Placeholder created at May 18, 2026, 4:17 AM
            - generic [ref=e165]: failed
          - generic [ref=e166]:
            - generic [ref=e167]:
              - generic [ref=e168]: Upscale
              - generic [ref=e169]: 100%
            - generic [ref=e170]:
              - paragraph [ref=e171]: Upscale failed
              - paragraph [ref=e172]: May 18, 2026, 4:18 AM
            - paragraph [ref=e173]: "Aspect ratio: 9:16"
            - paragraph [ref=e174]: fetch failed
            - button "Delete" [ref=e178]
        - article [ref=e179]:
          - generic [ref=e180]:
            - link "Codex Then Tryon result" [ref=e181] [cursor=pointer]:
              - /url: https://i.ibb.co/R4sSkHxJ/codex-codex-image.png
              - img "Codex Then Tryon result" [ref=e182]
            - generic [ref=e183]: failed
          - generic [ref=e184]:
            - generic [ref=e185]:
              - generic [ref=e186]: Codex Then Tryon
              - generic [ref=e187]: 100%
            - generic [ref=e188]:
              - paragraph [ref=e189]: Codex or try-on failed
              - paragraph [ref=e190]: May 18, 2026, 2:57 AM
            - paragraph [ref=e191]: "Aspect ratio: 9:16"
            - paragraph [ref=e192]: identityImages[0] must include base64, dataUrl, or path
            - generic [ref=e195]:
              - link "Open image" [ref=e196] [cursor=pointer]:
                - /url: https://i.ibb.co/R4sSkHxJ/codex-codex-image.png
              - link "Download" [ref=e197] [cursor=pointer]:
                - /url: https://i.ibb.co/R4sSkHxJ/codex-codex-image.png
              - button "AI Upscale" [ref=e199]
              - button "Delete" [ref=e201]
        - article [ref=e202]:
          - generic [ref=e203]:
            - link "Codex Then Tryon result" [ref=e204] [cursor=pointer]:
              - /url: https://i.ibb.co/XnNxNHx/codex-codex-image.png
              - img "Codex Then Tryon result" [ref=e205]
            - generic [ref=e206]: failed
          - generic [ref=e207]:
            - generic [ref=e208]:
              - generic [ref=e209]: Codex Then Tryon
              - generic [ref=e210]: 100%
            - generic [ref=e211]:
              - paragraph [ref=e212]: Codex or try-on failed
              - paragraph [ref=e213]: May 18, 2026, 2:50 AM
            - paragraph [ref=e214]: "Aspect ratio: 9:16"
            - paragraph [ref=e215]: identityImages[0] must include base64, dataUrl, or path
            - generic [ref=e218]:
              - link "Open image" [ref=e219] [cursor=pointer]:
                - /url: https://i.ibb.co/XnNxNHx/codex-codex-image.png
              - link "Download" [ref=e220] [cursor=pointer]:
                - /url: https://i.ibb.co/XnNxNHx/codex-codex-image.png
              - button "AI Upscale" [ref=e222]
              - button "Delete" [ref=e224]
        - article [ref=e225]:
          - generic [ref=e226]:
            - link "same woman doing pyramid pose, hands back" [ref=e227] [cursor=pointer]:
              - /url: https://i.ibb.co/60Zx6fyW/codex-codex-image.png
              - img "same woman doing pyramid pose, hands back" [ref=e228]
            - generic [ref=e229]: failed
          - generic [ref=e230]:
            - generic [ref=e231]:
              - generic [ref=e232]: Codex Then Tryon
              - generic [ref=e233]: 100%
            - generic [ref=e234]:
              - paragraph [ref=e235]: same woman doing pyramid pose, hands back
              - paragraph [ref=e236]: May 18, 2026, 2:47 AM
            - paragraph [ref=e237]: "Aspect ratio: 16:9"
            - paragraph [ref=e238]: identityImages[0] must include base64, dataUrl, or path
            - generic [ref=e241]:
              - link "Open image" [ref=e242] [cursor=pointer]:
                - /url: https://i.ibb.co/60Zx6fyW/codex-codex-image.png
              - link "Download" [ref=e243] [cursor=pointer]:
                - /url: https://i.ibb.co/60Zx6fyW/codex-codex-image.png
              - button "AI Upscale" [ref=e245]
              - button "Delete" [ref=e247]
        - article [ref=e248]:
          - generic [ref=e249]:
            - link "Codex Then Tryon result" [ref=e250] [cursor=pointer]:
              - /url: https://i.ibb.co/v4bZkN1T/codex-codex-image.png
              - img "Codex Then Tryon result" [ref=e251]
            - generic [ref=e252]: failed
          - generic [ref=e253]:
            - generic [ref=e254]:
              - generic [ref=e255]: Codex Then Tryon
              - generic [ref=e256]: 100%
            - generic [ref=e257]:
              - paragraph [ref=e258]: Codex or try-on failed
              - paragraph [ref=e259]: May 18, 2026, 2:01 AM
            - paragraph [ref=e260]: "Aspect ratio: 16:9"
            - paragraph [ref=e261]: identityImages[0] must include base64, dataUrl, or path
            - generic [ref=e264]:
              - link "Open image" [ref=e265] [cursor=pointer]:
                - /url: https://i.ibb.co/v4bZkN1T/codex-codex-image.png
              - link "Download" [ref=e266] [cursor=pointer]:
                - /url: https://i.ibb.co/v4bZkN1T/codex-codex-image.png
              - button "AI Upscale" [ref=e268]
              - button "Delete" [ref=e270]
        - article [ref=e271]:
          - generic [ref=e272]:
            - link "Codex Then Tryon result" [ref=e273] [cursor=pointer]:
              - /url: https://i.ibb.co/9MZp6Fd/codex-codex-image.png
              - img "Codex Then Tryon result" [ref=e274]
            - generic [ref=e275]: failed
          - generic [ref=e276]:
            - generic [ref=e277]:
              - generic [ref=e278]: Codex Then Tryon
              - generic [ref=e279]: 100%
            - generic [ref=e280]:
              - paragraph [ref=e281]: Codex or try-on failed
              - paragraph [ref=e282]: May 18, 2026, 1:46 AM
            - paragraph [ref=e283]: "Aspect ratio: 9:16"
            - paragraph [ref=e284]: identityImages[0] must include base64, dataUrl, or path
            - generic [ref=e287]:
              - link "Open image" [ref=e288] [cursor=pointer]:
                - /url: https://i.ibb.co/9MZp6Fd/codex-codex-image.png
              - link "Download" [ref=e289] [cursor=pointer]:
                - /url: https://i.ibb.co/9MZp6Fd/codex-codex-image.png
              - button "AI Upscale" [ref=e291]
              - button "Delete" [ref=e293]
        - article [ref=e294]:
          - generic [ref=e295]:
            - link "Codex Then Tryon result" [ref=e296] [cursor=pointer]:
              - /url: https://i.ibb.co/23RSJQM8/codex-codex-image.png
              - img "Codex Then Tryon result" [ref=e297]
            - generic [ref=e298]: failed
          - generic [ref=e299]:
            - generic [ref=e300]:
              - generic [ref=e301]: Codex Then Tryon
              - generic [ref=e302]: 100%
            - generic [ref=e303]:
              - paragraph [ref=e304]: Codex or try-on failed
              - paragraph [ref=e305]: May 18, 2026, 12:35 AM
            - paragraph [ref=e306]: "Aspect ratio: 9:16"
            - paragraph [ref=e307]: identityImages[0] must include base64, dataUrl, or path
            - generic [ref=e310]:
              - link "Open image" [ref=e311] [cursor=pointer]:
                - /url: https://i.ibb.co/23RSJQM8/codex-codex-image.png
              - link "Download" [ref=e312] [cursor=pointer]:
                - /url: https://i.ibb.co/23RSJQM8/codex-codex-image.png
              - button "AI Upscale" [ref=e314]
              - button "Delete" [ref=e316]
        - article [ref=e317]:
          - generic [ref=e318]:
            - link "woman doing pyramid pose looking downwards" [ref=e319] [cursor=pointer]:
              - /url: https://i.ibb.co/sT6sp73/codex-codex-image.png
              - img "woman doing pyramid pose looking downwards" [ref=e320]
            - generic [ref=e321]: failed
          - generic [ref=e322]:
            - generic [ref=e323]:
              - generic [ref=e324]: Codex Then Tryon
              - generic [ref=e325]: 100%
            - generic [ref=e326]:
              - paragraph [ref=e327]: woman doing pyramid pose looking downwards
              - paragraph [ref=e328]: May 18, 2026, 12:21 AM
            - paragraph [ref=e329]: "Aspect ratio: 9:16"
            - paragraph [ref=e330]: identityImages[0] must include base64, dataUrl, or path
            - generic [ref=e333]:
              - link "Open image" [ref=e334] [cursor=pointer]:
                - /url: https://i.ibb.co/sT6sp73/codex-codex-image.png
              - link "Download" [ref=e335] [cursor=pointer]:
                - /url: https://i.ibb.co/sT6sp73/codex-codex-image.png
              - button "AI Upscale" [ref=e337]
              - button "Delete" [ref=e339]
        - article [ref=e340]:
          - generic [ref=e341]:
            - link "Pyramid yoga pose" [ref=e342] [cursor=pointer]:
              - /url: https://i.ibb.co/MkLP52TL/codex-codex-image.png
              - img "Pyramid yoga pose" [ref=e343]
            - generic [ref=e344]: succeeded
          - generic [ref=e345]:
            - generic [ref=e346]:
              - generic [ref=e347]: Codex
              - generic [ref=e348]: 100%
            - generic [ref=e349]:
              - paragraph [ref=e350]: Pyramid yoga pose
              - paragraph [ref=e351]: May 17, 2026, 10:45 PM
            - paragraph [ref=e352]: "Aspect ratio: 9:16"
            - generic [ref=e355]:
              - link "Open image" [ref=e356] [cursor=pointer]:
                - /url: https://i.ibb.co/MkLP52TL/codex-codex-image.png
              - link "Download" [ref=e357] [cursor=pointer]:
                - /url: https://i.ibb.co/MkLP52TL/codex-codex-image.png
              - button "AI Upscale" [ref=e359]
              - button "Delete" [ref=e361]
        - article [ref=e362]:
          - generic [ref=e363]:
            - link "Professional fashion editorial portrait" [ref=e364] [cursor=pointer]:
              - /url: https://i.ibb.co/8gsjtDr0/codex-image.png
              - img "Professional fashion editorial portrait" [ref=e365]
            - generic [ref=e366]: succeeded
          - generic [ref=e367]:
            - generic [ref=e368]:
              - generic [ref=e369]: Codex
              - generic [ref=e370]: 100%
            - generic [ref=e371]:
              - paragraph [ref=e372]: Professional fashion editorial portrait
              - paragraph [ref=e373]: May 17, 2026, 6:27 PM
            - paragraph [ref=e374]: "Aspect ratio: 9:16"
            - generic [ref=e377]:
              - link "Open image" [ref=e378] [cursor=pointer]:
                - /url: https://i.ibb.co/8gsjtDr0/codex-image.png
              - link "Download" [ref=e379] [cursor=pointer]:
                - /url: https://i.ibb.co/8gsjtDr0/codex-image.png
              - button "AI Upscale" [ref=e381]
              - button "Delete" [ref=e383]
  - alert [ref=e384]
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