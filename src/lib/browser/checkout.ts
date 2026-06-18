import { chromium, type Browser } from 'playwright';

export interface CheckoutStep {
  name: string;
  selector?: string;
  value?: string;
  action?: 'fill' | 'click' | 'press' | 'wait';
}

export interface BrowserCheckoutInput {
  merchantUrl: string;
  steps?: CheckoutStep[];
  paymentToken?: {
    pan: string;
    exp_month: number;
    exp_year: number;
    cvv: string;
  };
  userAgent?: string;
}

export interface BrowserCheckoutResult {
  success: boolean;
  finalUrl: string;
  screenshots: string[];
  receiptText?: string;
}

export async function executeCheckout(input: BrowserCheckoutInput): Promise<BrowserCheckoutResult> {
  const browser = await chromium.launch({ headless: true });
  const page = await openMerchantPage(browser, input.merchantUrl, input.userAgent);
  const screenshots: string[] = [];

  try {
    if (input.steps?.length) {
      for (const step of input.steps) {
        await runStep(page, step);
        screenshots.push(await captureStepScreenshot(page, step.name));
      }
    }

    const finalUrl = page.url();
    const receiptText = await extractVisibleReceipt(page);

    return {
      success: true,
      finalUrl,
      screenshots,
      receiptText,
    };
  } finally {
    await browser.close();
  }
}

async function openMerchantPage(browser: Browser, merchantUrl: string, userAgent?: string) {
  const context = await browser.newContext({ userAgent });
  const page = await context.newPage();
  await page.goto(merchantUrl, { waitUntil: 'domcontentloaded' });
  return page;
}

async function runStep(page: Awaited<ReturnType<typeof openMerchantPage>>, step: CheckoutStep) {
  if (step.action === 'wait') {
    await page.waitForTimeout(1000);
    return;
  }

  if (!step.selector) {
    return;
  }

  if (step.action === 'fill' && typeof step.value === 'string') {
    await page.locator(step.selector).fill(step.value);
    return;
  }

  if (step.action === 'press' && typeof step.value === 'string') {
    await page.locator(step.selector).press(step.value);
    return;
  }

  await page.locator(step.selector).click();
}

async function captureStepScreenshot(page: Awaited<ReturnType<typeof openMerchantPage>>, stepName: string) {
  const path = `replay-${Date.now()}-${stepName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`;
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function extractVisibleReceipt(page: Awaited<ReturnType<typeof openMerchantPage>>) {
  const receiptSelectors = ['[data-receipt]', '.receipt', '#receipt', 'body'];

  for (const selector of receiptSelectors) {
    const element = page.locator(selector).first();
    if (await element.count()) {
      const text = await element.textContent();
      if (text && text.trim()) {
        return text.trim().slice(0, 1000);
      }
    }
  }

  return undefined;
}
