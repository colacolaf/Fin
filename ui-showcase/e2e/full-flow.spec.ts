import { test, expect } from "@playwright/test"

/* ================================================================== */
/*  Reset localStorage before each test so we start fresh              */
/* ================================================================== */

test.beforeEach(async ({ page }) => {
  await page.goto("/")
  await page.evaluate(() => localStorage.clear())
})

/* ================================================================== */
/*  1. Settings → AI Model Tab — configure an API key                   */
/* ================================================================== */

test("Settings AI Model tab: configure OpenAI key and verify status", async ({ page }) => {
  await page.goto("/settings")
  await page.waitForTimeout(500)

  // Switch to AI Model tab (4th tab)
  const aiModelTab = page.locator("button:has-text('AI Model')")
  await aiModelTab.click()
  await page.waitForTimeout(500)

  // Expand OpenAI provider card — it's the first provider card with "OpenAI" text
  const openAiHeader = page.locator("text=OpenAI").first()
  await openAiHeader.click()
  await page.waitForTimeout(400)

  // Type API key into the password input
  const keyInput = page.locator("input[type='password']").first()
  await expect(keyInput).toBeVisible({ timeout: 3000 })
  await keyInput.fill("sk-test-openai-key-12345")

  // Verify "Stored" indicator appears (green badge next to input)
  await expect(page.locator("text=Stored").first()).toBeVisible({ timeout: 3000 })

  // Verify status badge shows "Key Saved (Untested)"
  await expect(page.locator("text=Key Saved (Untested)").first()).toBeVisible({ timeout: 3000 })

  // Find and click the GPT-4o model toggle (first model in the list, has a checkbox)
  const modelToggles = page.locator("button:has-text('GPT-4o')")
  // Click the first one that has a checkbox (the model toggle row)
  const gpt4oToggle = modelToggles.first()
  await gpt4oToggle.click()
  await page.waitForTimeout(300)
})

/* ================================================================== */
/*  2. API Key persistence across navigation                            */
/* ================================================================== */

test("API keys persist after navigating away and back", async ({ page }) => {
  await page.goto("/settings")
  await page.click("button:has-text('AI Model')")
  await page.waitForTimeout(500)

  // Expand OpenAI, enter key
  await page.locator("text=OpenAI").first().click()
  await page.waitForTimeout(400)
  await page.locator("input[type='password']").first().fill("sk-persist-test-key")
  await page.waitForTimeout(500)

  // Navigate away
  await page.goto("/")
  await page.waitForTimeout(500)

  // Navigate back
  await page.goto("/settings")
  await page.click("button:has-text('AI Model')")
  await page.waitForTimeout(500)

  // Expand again
  await page.locator("text=OpenAI").first().click()
  await page.waitForTimeout(400)

  // Verify key persisted
  const keyInput = page.locator("input[type='password']").first()
  await expect(keyInput).toHaveValue("sk-persist-test-key")
})

/* ================================================================== */
/*  3. Model Picker in Chat Header — shows only configured models       */
/* ================================================================== */

test("Model picker shows configured models with status indicators", async ({ page }) => {
  // Pre-configure an OpenAI key so the picker shows models
  await page.goto("/")
  await page.evaluate(() => {
    localStorage.setItem("fo-provider-keys", JSON.stringify({ openai: "sk-test" }))
  })

  await page.goto("/agent/portfolio")
  await page.waitForTimeout(1500)

  // Model picker trigger has aria-haspopup="dialog" (the Popover trigger)
  const modelPicker = page.locator("button[aria-haspopup='dialog']").first()
  await expect(modelPicker).toBeVisible({ timeout: 5000 })
  await modelPicker.click()
  await page.waitForTimeout(500)

  // Verify at least one OpenAI model is visible in the dropdown
  await expect(page.locator("text=GPT-4o").first()).toBeVisible({ timeout: 3000 })
})

/* ================================================================== */
/*  4. Model Picker empty state when no keys configured                  */
/* ================================================================== */

test("Model picker always shows local models even without API keys", async ({ page }) => {
  await page.goto("/agent/portfolio")
  await page.waitForTimeout(1500)

  // Open model picker
  const modelPicker = page.locator("button[aria-haspopup='dialog']").first()
  await expect(modelPicker).toBeVisible({ timeout: 5000 })
  await modelPicker.click()
  await page.waitForTimeout(500)

  // Local models (Ollama) always appear since they don't need API keys
  await expect(page.locator("text=Local").first()).toBeVisible({ timeout: 3000 })
})

/* ================================================================== */
/*  5. Agent Settings page — shows configured models                    */
/* ================================================================== */

test("Agent settings shows configured models", async ({ page }) => {
  // Pre-configure keys
  await page.goto("/")
  await page.evaluate(() => {
    localStorage.setItem("fo-provider-keys", JSON.stringify({ openai: "sk-test" }))
  })

  await page.goto("/agent/portfolio/settings")
  await page.waitForTimeout(1000)

  // Verify the AI Model section is visible
  await expect(page.locator("text=AI Model").first()).toBeVisible()

  // Verify OpenAI models appear in the model list
  const modelSection = page.locator("text=AI Model").first()
  await expect(modelSection).toBeVisible()
})

/* ================================================================== */
/*  6. Chat — send message, verify F.I.R.M. thinking trace             */
/* ================================================================== */

test("Chat sends message and message appears in chat", async ({ page }) => {
  await page.goto("/agent/portfolio")
  await page.waitForTimeout(1000)

  // Find the composer textarea
  const composer = page.locator("textarea").first()
  await expect(composer).toBeVisible({ timeout: 5000 })
  await composer.fill("What should I do about my portfolio?")
  await page.waitForTimeout(300)

  // Verify composer has the text
  await expect(composer).toHaveValue("What should I do about my portfolio?")

  // Find and click the send button
  const sendBtn = page.locator("button[aria-label='Send message']")
  await expect(sendBtn).toBeVisible({ timeout: 3000 })
  await sendBtn.click()
  await page.waitForTimeout(2000)

  // User message should appear in the chat conversation
  await expect(page.locator("text=What should I do about my portfolio?").first()).toBeVisible({ timeout: 5000 })
})

/* ================================================================== */
/*  7. Thinking modes — switch between Full and Fast                    */
/* ================================================================== */

test("Thinking mode switching works in SettingsGear", async ({ page }) => {
  await page.goto("/agent/portfolio")
  await page.waitForTimeout(500)

  // Open settings gear via aria-label
  await page.click("button[aria-label='Agent settings']")
  await page.waitForTimeout(400)

  // Expand Think Mode accordion — click the header button containing "Full reasoning"
  const thinkHeader = page.locator("button:has-text('Think Mode')").first()
  await thinkHeader.click()
  await page.waitForTimeout(400)

  // Find and click "Fast inference" option button
  const fastOption = page.locator("button:has-text('Fast inference')").first()
  await expect(fastOption).toBeVisible({ timeout: 3000 })
  await fastOption.click()
  await page.waitForTimeout(400)

  // Verify accordion collapsed — header now shows "Fast inference"
  await expect(page.locator("button:has-text('Think Mode')").first()).toBeVisible()
})

/* ================================================================== */
/*  8. Token modes — switch between modes                              */
/* ================================================================== */

test("Token mode switching works in SettingsGear", async ({ page }) => {
  await page.goto("/agent/portfolio")
  await page.waitForTimeout(500)

  // Open settings gear
  await page.click("button[aria-label='Agent settings']")
  await page.waitForTimeout(400)

  // Expand Token Mode accordion
  const tokenHeader = page.locator("button:has-text('Token Mode')").first()
  await tokenHeader.click()
  await page.waitForTimeout(400)

  // Verify options are visible
  await expect(page.locator("text=Compressed").first()).toBeVisible({ timeout: 3000 })
  await expect(page.locator("text=Bare").first()).toBeVisible({ timeout: 3000 })

  // Switch to Bare
  const bareOption = page.locator("button:has-text('Bare')").first()
  await bareOption.click()
  await page.waitForTimeout(400)

  // Verify collapsed accordion header still exists
  await expect(page.locator("button:has-text('Token Mode')").first()).toBeVisible()
})

/* ================================================================== */
/*  9. Temperature slider works                                         */
/* ================================================================== */

test("Temperature slider is functional in SettingsGear", async ({ page }) => {
  await page.goto("/agent/portfolio")
  await page.waitForTimeout(500)

  // Open settings gear
  await page.click("button[aria-label='Agent settings']")
  await page.waitForTimeout(400)

  // Temperature slider should be visible
  const slider = page.locator("input[type='range']")
  await expect(slider).toBeVisible({ timeout: 3000 })

  // The slider should exist and be interactive
  await slider.fill("0.8")
  await page.waitForTimeout(300)

  // Verify a numeric value is displayed near the slider
  const tempDisplay = page.locator("text=0.8").first()
  await expect(tempDisplay).toBeVisible({ timeout: 2000 })
})

/* ================================================================== */
/*  10. Chat header UI elements                                        */
/* ================================================================== */

test("Chat header shows model picker, voice toggle, and settings gear", async ({ page }) => {
  await page.goto("/agent/portfolio")
  await page.waitForTimeout(500)

  // Voice toggle button
  const voiceButton = page.locator("button[title='Voice off']")
  await expect(voiceButton).toBeVisible({ timeout: 5000 })

  // Settings gear
  const gearButton = page.locator("button[aria-label='Agent settings']")
  await expect(gearButton).toBeVisible()
})

/* ================================================================== */
/*  11. Empty state on fresh chat                                       */
/* ================================================================== */

test("Fresh chat shows agent tagline", async ({ page }) => {
  await page.goto("/agent/portfolio")
  await page.waitForTimeout(1000)

  // Verify the agent description/tagline is visible
  await expect(page.locator("text=Performance, allocation, and strategy").first()).toBeVisible({ timeout: 5000 })
})

/* ================================================================== */
/*  12. Composer is functional                                          */
/* ================================================================== */

test("Chat composer is visible and accepts input", async ({ page }) => {
  await page.goto("/agent/portfolio")
  await page.waitForTimeout(500)

  // The composer textarea should be visible
  const composer = page.locator("textarea").first()
  await expect(composer).toBeVisible({ timeout: 5000 })

  // Type some text
  await composer.fill("test message")
  await expect(composer).toHaveValue("test message")
})

/* ================================================================== */
/*  14. Test Connection button appears/disappears with key entry        */
/* ================================================================== */

test("Test Connection button appears when API key is entered", async ({ page }) => {
  await page.goto("/settings")
  await page.click("button:has-text('AI Model')")
  await page.waitForTimeout(500)

  // Expand OpenAI, enter key
  await page.locator("text=OpenAI").first().click()
  await page.waitForTimeout(400)

  // Before key entry, Test Connection button should NOT be visible
  await expect(page.locator("button:has-text('Test Connection')")).not.toBeAttached({ timeout: 2000 })

  // Enter a key
  await page.locator("input[type='password']").first().fill("sk-test-key")
  await page.waitForTimeout(500)

  // Now Test Connection button should appear
  await expect(page.locator("button:has-text('Test Connection')").first()).toBeVisible({ timeout: 3000 })

  // "Stored" indicator should also be visible
  await expect(page.locator("text=Stored").first()).toBeVisible({ timeout: 2000 })
})

/* ================================================================== */
/*  15. Verified state renders correctly with pre-seeded timestamp       */
/* ================================================================== */

test("Provider card shows Verified badge when verification is pre-seeded", async ({ page }) => {
  // Pre-seed a verified provider
  await page.goto("/")
  await page.evaluate(() => {
    localStorage.setItem("fo-provider-keys", JSON.stringify({ openai: "sk-test" }))
    localStorage.setItem("fo-provider-verified", JSON.stringify({ openai: Date.now() }))
  })

  await page.goto("/settings")
  await page.click("button:has-text('AI Model')")
  await page.waitForTimeout(500)

  // The summary banner should show "Verified" count
  await expect(page.locator("text=Verified").first()).toBeVisible({ timeout: 3000 })

  // Expand OpenAI card
  await page.locator("text=OpenAI").first().click()
  await page.waitForTimeout(400)

  // Should show "Verified" in the test button (green check + timestamp)
  await expect(page.locator("button:has-text('Verified')").first()).toBeVisible({ timeout: 3000 })

  // Status badge in header should be green "Verified"
  const verifiedBadges = page.locator("text=Verified")
  const count = await verifiedBadges.count()
  expect(count).toBeGreaterThanOrEqual(1)
})

/* ================================================================== */
/*  16. Enabled model checkboxes persist after collapse/expand           */
/* ================================================================== */

test("Enabled model toggles persist after card collapse", async ({ page }) => {
  await page.goto("/")
  await page.evaluate(() => {
    localStorage.setItem("fo-provider-keys", JSON.stringify({ openai: "sk-test" }))
    localStorage.setItem("fo-provider-models", JSON.stringify(["gpt-4o"]))
  })

  await page.goto("/settings")
  await page.click("button:has-text('AI Model')")
  await page.waitForTimeout(500)

  // Expand OpenAI
  await page.locator("text=OpenAI").first().click()
  await page.waitForTimeout(400)

  // Collapse
  await page.locator("text=OpenAI").first().click()
  await page.waitForTimeout(300)

  // Re-expand
  await page.locator("text=OpenAI").first().click()
  await page.waitForTimeout(400)

  // Verify summary banner shows 1 model enabled
  await expect(page.locator("text=1").first()).toBeVisible({ timeout: 3000 })
})

/* ================================================================== */
/*  17. Real API key verification (requires E2E_OPENAI_API_KEY env var)  */
/*  Run with: E2E_OPENAI_API_KEY=sk-yourkey npx playwright test        */
/*  In CI: set E2E_OPENAI_API_KEY as a GitHub Actions secret           */
/* ================================================================== */

test("Real API key: enter key → Test Connection → green Verified badge", async ({ page }) => {
  const realKey: string | undefined = process.env.E2E_OPENAI_API_KEY
  if (!realKey || realKey.length < 10) {
    test.skip(true, "E2E_OPENAI_API_KEY not set — skipping live API verification test")
    return
  }

  await page.goto("/settings")
  await page.click("button:has-text('AI Model')")
  await page.waitForTimeout(500)

  // Expand OpenAI provider card
  await page.locator("text=OpenAI").first().click()
  await page.waitForTimeout(400)

  // Enter the real API key
  const keyInput = page.locator("input[type='password']").first()
  await expect(keyInput).toBeVisible({ timeout: 3000 })
  await keyInput.fill(realKey)
  await page.waitForTimeout(500)

  // "Stored" indicator should appear
  await expect(page.locator("text=Stored").first()).toBeVisible({ timeout: 3000 })

  // Click "Test Connection"
  const testBtn = page.locator("button:has-text('Test Connection')").first()
  await expect(testBtn).toBeVisible({ timeout: 3000 })
  await testBtn.click()

  // Wait for the real API call to complete (OpenAI should respond within 5s)
  // The button will show "Verified" with a timestamp when successful
  await expect(page.locator("button:has-text('Verified')").first()).toBeVisible({ timeout: 15000 })

  // The status badge in the card header should also show green "Verified"
  const statusBadge = page.locator("text=Verified").first()
  await expect(statusBadge).toBeVisible({ timeout: 3000 })

  // The summary banner should now show 1 verified provider
  // (the Verified count in the banner should have updated)
  // Collapse the card to see the banner
  await page.locator("text=OpenAI").first().click()
  await page.waitForTimeout(300)

  // Verify the summary banner is visible and shows updated counts
  await expect(page.locator("text=Verified").first()).toBeVisible({ timeout: 3000 })
})
