import { test, expect } from '@playwright/test';

test.describe('StrategyTimeline Component', () => {
  test('should display payment timeline when strategy is selected', async ({
    page,
  }) => {
    // Navigate to the strategy page
    await page.goto('/strategy');

    // Fill in some basic recipient information
    await page.fill('[data-testid="birthdate-0"]', '1960-01-01');
    await page.fill('[data-testid="birthdate-1"]', '1962-01-01');
    await page.fill('[data-testid="pia-0"]', '2000');
    await page.fill('[data-testid="pia-1"]', '1500');

    // Run calculation
    await page.click('[data-testid="calculate-button"]');

    // Wait for results and select a cell
    await page.waitForSelector('.strategy-cell');
    await page.click('.strategy-cell:first-child');

    // Check if timeline component is visible
    await expect(page.locator('.strategy-timeline-container')).toBeVisible();
    await expect(page.locator('.strategy-timeline-container h3')).toContainText(
      'Payment Timeline'
    );

    // Check if recipient timelines are present
    await expect(page.locator('.recipient-timeline')).toHaveCount(2);

    // Check if benefit periods are displayed
    await expect(page.locator('.timeline-period')).toHaveCount.greaterThan(0);
  });
});
