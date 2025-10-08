<script lang="ts">
  // Intro banner shown when the Open Social Security integration is active
  import favicon from './favicon.ico';
</script>

<div class="intro-banner">
  <div class="banner-content">
    <img src={favicon} alt="Open Social Security" class="favicon" />
    <span>
      You're using this calculator via <strong>Open Social Security</strong>. At
      the end of your report, you'll see a link to return to Open Social
      Security with your information.
    </span>
  </div>
</div>

<style>
  .intro-banner {
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
    border-left: 4px solid #1976d2;
    margin: 1em auto;
    padding: 0.75em 1em;
    max-width: 1080px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .banner-content {
    color: #0d47a1;
    font-size: 0.95em;
    line-height: 1.5;
    display: flex;
    align-items: center;
    gap: 0.5em;
  }

  .favicon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    background-color: white;
    border-radius: 2px;
    padding: 1px;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  @media print {
    .intro-banner {
      display: none;
    }
  }

  @media screen and (max-width: 600px) {
    .intro-banner {
      margin: 0.5em;
      padding: 0.5em 0.75em;
    }
    .banner-content {
      font-size: 0.9em;
    }
  }
</style>
