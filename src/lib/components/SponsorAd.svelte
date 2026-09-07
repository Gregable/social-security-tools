<script lang="ts">
import SponsorLogo from '$lib/images/social-security-advisors.png';
import { SPONSOR } from '$lib/sponsor';

export let animated = false;
export let isVisible = true;
</script>

<div
  class="pageBreakAvoid sponsor"
  class:animated
  class:animate-in={isVisible}
>
  <div class="spon-container">
    <div class="left-top-region">
      <h2 class="project-title">{SPONSOR.name}</h2>
      <h4 class="sponsor-badge">Sponsor</h4>
    </div>
    <div class="left-bottom-region">
      <img
        src={SponsorLogo}
        width="313"
        height="163"
        class="sponsor-image image-fit"
        alt=""
      />
    </div>
    <div class="right-region">
      <div class="text">
        <h3 class="mobile-title">
          {SPONSOR.name} <span class="mobile-sponsor-badge">Sponsor</span>
        </h3>
        <p>
          Still weighing when to file? You can schedule a free call with a
          Social Security specialist at <span class="inline-link"
            >{SPONSOR.name}</span
          > to talk through your specific situation.
        </p>
        <ul>
          <li>
            A real person looks at your numbers, including things this
            calculator doesn't cover like taxes, pensions, and health.
          </li>
          <li>The first call is free, and you pick the time.</li>
          <li>If you want more help after that, they can also handle the filing.</li>
        </ul>
        <div class="cta-section">
          <div class="cta-button">Schedule a Free Call →</div>
          <div class="cta-subtext">
            Opens their scheduling calendar in a new tab
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Reset elements that guide-page global styles would otherwise inflate */
  .sponsor p,
  .sponsor ul,
  .sponsor li {
    font-size: inherit;
    line-height: normal;
  }

  .text {
    margin: 0 0.5em;
    font-size: 1.2em;
  }

  h2,
  h4 {
    margin: 0.5em 0;
  }

  .spon-container {
    display: grid;
    grid-template-columns: 30% 70%;
    grid-template-rows: auto auto;
    gap: 10px;
    padding: 10px 4px 4px 0;
  }
  .left-top-region {
    grid-column-start: 1;
    grid-column-end: 2;
    grid-row-start: 1;
    grid-row-end: 2;
  }
  .left-bottom-region {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    grid-column-start: 1;
    grid-column-end: 2;
    grid-row-start: 2;
    grid-row-end: 3;
  }
  .right-region {
    display: flex;
    align-items: center;
    grid-column-start: 2;
    grid-column-end: 3;
    grid-row-start: 1;
    grid-row-end: 3;
  }
  @media (max-width: 600px) {
    .left-bottom-region,
    .left-top-region,
    li {
      display: none;
    }
    .text {
      margin: 0;
    }
    .spon-container {
      grid-template-columns: 1fr;
      gap: 0;
    }
    .right-region {
      grid-row: auto;
    }

    /* Show mobile title only on small screens */
    .mobile-title {
      display: block;
      margin: 0 0 10px 0;
    }

    /* Optimize CTA for mobile */
    .cta-section {
      margin-top: 15px;
    }

    .cta-button {
      padding: 10px 20px;
      font-size: 1em;
    }
  }
  li {
    margin-bottom: 14px;
  }

  /* Base sponsor styles (always visible when not animated) */
  .sponsor {
    background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
    padding-left: 20px;
    cursor: pointer;
    border: 2px solid #337ab7;
    border-radius: 8px;
    position: relative;
    /* Reset inherited styles so the ad looks identical in all contexts */
    font-size: 16px;
    line-height: normal;
  }

  /* Only apply entrance animation when animated prop is set */
  .sponsor.animated {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
    transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .sponsor.animated.animate-in {
    opacity: 1;
    transform: translateY(0) scale(1);
    transition:
      all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94),
      border-color 0.3s ease,
      background 0.3s ease,
      box-shadow 0.3s ease;
  }

  /* Staggered animation for child elements (only when animated) */
  .sponsor.animated .left-top-region,
  .sponsor.animated .left-bottom-region,
  .sponsor.animated .right-region {
    opacity: 0;
    transform: translateX(-20px);
    transition: all 0.6s ease;
    transition-delay: 0.2s;
  }

  .sponsor.animated.animate-in .left-top-region,
  .sponsor.animated.animate-in .left-bottom-region,
  .sponsor.animated.animate-in .right-region {
    opacity: 1;
    transform: translateX(0);
  }

  .sponsor.animated.animate-in .left-bottom-region {
    transition-delay: 0.3s;
  }

  .sponsor.animated.animate-in .right-region {
    transition-delay: 0.4s;
  }

  /* CTA button entrance animation (only when animated) */
  .sponsor.animated .cta-section {
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.5s ease;
    transition-delay: 0.6s;
  }

  .sponsor.animated.animate-in .cta-section {
    opacity: 1;
    transform: translateY(0);
  }

  .sponsor:hover {
    border-color: #23527c;
    background: linear-gradient(135deg, #e8f4ff 0%, #d4ebff 100%);
    box-shadow: 0 6px 20px rgba(51, 122, 183, 0.15);
  }

  .project-title {
    color: #337ab7;
    text-decoration: underline;
    text-decoration-color: rgba(51, 122, 183, 0.5);
    text-underline-offset: 3px;
    margin: 0.5em 0;
    transition: all 0.3s ease;
  }

  .sponsor:hover .project-title {
    color: #23527c;
    text-decoration-color: rgba(35, 82, 124, 0.8);
    transform: translateX(2px);
  }

  .sponsor-badge {
    background: #337ab7;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.9em;
    display: inline-block;
    margin: 0.5em 0;
  }

  .inline-link {
    color: #337ab7;
    text-decoration: underline;
    text-decoration-color: rgba(51, 122, 183, 0.5);
    text-underline-offset: 2px;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .sponsor:hover .inline-link {
    color: #23527c;
    text-decoration-color: rgba(35, 82, 124, 0.8);
    transform: translateX(1px);
  }

  .cta-section {
    margin-top: 20px;
    text-align: center;
  }

  .cta-button {
    background: linear-gradient(135deg, #337ab7 0%, #23527c 100%);
    color: white;
    padding: 12px 24px;
    border-radius: 6px;
    font-weight: bold;
    font-size: 1.1em;
    display: inline-block;
    margin-bottom: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
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
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    background: linear-gradient(135deg, #23527c 0%, #1a3d5c 100%);
  }

  .cta-button:hover::before {
    left: 100%;
  }

  .cta-subtext {
    font-size: 0.9em;
    color: #666;
    font-style: italic;
  }

  .mobile-title {
    display: none; /* Hidden by default, shown only on mobile */
    color: #337ab7;
    font-size: 1.4em;
    font-weight: bold;
    text-decoration: underline;
    text-decoration-color: rgba(51, 122, 183, 0.5);
    text-underline-offset: 2px;
  }

  .mobile-sponsor-badge {
    background: #337ab7;
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.7em;
    font-weight: normal;
    margin-left: 8px;
  }

  img.image-fit {
    max-width: 100%;
    height: auto;
    /* Override guide-page image chrome so the logo sits flat on the card */
    border: none;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
    transition:
      transform 0.3s ease,
      filter 0.3s ease;
  }

  .sponsor:hover img.image-fit {
    transform: scale(1.02);
    filter: brightness(1.05) saturate(1.1);
  }
</style>
