<script lang="ts">
import posthog from 'posthog-js';
import { browser } from '$app/environment';
import { page } from '$app/stores';

function handleCtaClick() {
  if (browser) {
    const guideSlug = $page.url.pathname.replace('/guides/', '');
    posthog.capture('Guide: CTA Clicked', {
      guide_slug: guideSlug,
      cta_type: 'calculate_my_benefits',
    });
  }
}
</script>

<div class="footer">
  <div class="footer-content">
    <div class="footer-icon">📊</div>
    <h2>Ready to Calculate Your Benefits?</h2>
    <p>
      Get personalized insights into your Social Security retirement benefits
      with our free calculator.
    </p>
    <div class="features">
      <div class="feature">
        <span class="feature-icon">✓</span>
        <span>Copy & paste your earnings record</span>
      </div>
      <div class="feature">
        <span class="feature-icon">✓</span>
        <span>Explore "What If?" scenarios</span>
      </div>
      <div class="feature">
        <span class="feature-icon">✓</span>
        <span>100% free and private</span>
      </div>
    </div>
    <div class="cta-container">
      <a href="/calculator" class="cta-button" role="button" on:click={handleCtaClick}>
        <span class="cta-text">Calculate My Benefits</span>
      </a>
      <div class="trust-indicators">
        <span class="trust-item">🔒 Secure</span>
        <span class="trust-item">⚡ Fast</span>
        <span class="trust-item">💰 Free</span>
      </div>
    </div>
  </div>
</div>

<style>
  .footer {
    background: linear-gradient(135deg, #f8fafe 0%, #e8f4f8 100%);
    border: 1px solid #e0e6ed;
    border-radius: 12px;
    margin: 4em auto 2em auto;
    padding: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    max-width: 600px;
  }

  .footer-content {
    padding: 2.5em 2em;
    text-align: center;
  }

  .footer-icon {
    font-size: 2.5em;
    margin-bottom: 0.5em;
    opacity: 0.8;
  }

  .footer h2 {
    color: #2c3e50;
    font-size: 1.8em;
    font-weight: 600;
    margin: 0 0 0.5em 0;
    line-height: 1.2;
  }

  .footer p {
    color: #5a6c7d;
    font-size: 1.1em;
    line-height: 1.4;
    margin: 0 0 1.5em 0;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }

  .features {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    margin: 1.5em 0;
    text-align: left;
    max-width: 300px;
    margin-left: auto;
    margin-right: auto;
  }

  .feature {
    display: flex;
    align-items: center;
    gap: 0.5em;
    font-size: 0.95em;
    color: #4a5568;
  }

  .feature-icon {
    color: #5cb85c;
    font-weight: bold;
    font-size: 1.1em;
  }

  .cta-container {
    margin-top: 2em;
  }

  .cta-button {
    background: linear-gradient(135deg, #5cb85c 0%, #4cae4c 100%);
    color: #fff;
    padding: 16px 32px;
    border-radius: 50px;
    font-size: 1.1em;
    font-weight: 600;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow:
      0 4px 12px rgba(92, 184, 92, 0.3),
      0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .cta-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s;
  }

  .cta-button:hover {
    transform: translateY(-2px);
    box-shadow:
      0 6px 20px rgba(92, 184, 92, 0.4),
      0 4px 8px rgba(0, 0, 0, 0.15);
    background: linear-gradient(135deg, #4cae4c 0%, #449d44 100%);
  }

  .cta-button:hover::before {
    left: 100%;
  }

  .cta-button:active {
    transform: translateY(0);
  }

  .cta-text {
    color: #fff;
  }

  .trust-indicators {
    display: flex;
    justify-content: center;
    gap: 1.5em;
    margin-top: 1.5em;
    opacity: 0.8;
  }

  .trust-item {
    font-size: 0.85em;
    color: #6b7280;
    font-weight: 500;
  }

  /* Mobile Styles */
  @media (max-width: 768px) {
    .footer {
      margin: 3em 1em 2em 1em;
      border-radius: 8px;
    }

    .footer-content {
      padding: 2em 1.5em;
    }

    .footer h2 {
      font-size: 1.5em;
    }

    .footer p {
      font-size: 1em;
    }

    .features {
      max-width: none;
      margin: 1.2em 0;
    }

    .cta-button {
      padding: 14px 28px;
      font-size: 1em;
      width: 100%;
      max-width: 280px;
    }

    .trust-indicators {
      display: none; /* Hide on mobile to avoid stacking */
    }
  }

  @media (max-width: 480px) {
    .footer-content {
      padding: 1.5em 1em;
    }

    .footer h2 {
      font-size: 1.3em;
    }

    .footer-icon {
      font-size: 2em;
    }

    .features {
      text-align: center;
    }

    .feature {
      justify-content: center;
    }
  }
</style>
