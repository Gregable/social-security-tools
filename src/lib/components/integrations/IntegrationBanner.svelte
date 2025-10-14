<script lang="ts">
  // Shared banner component for integration intro messages
  export let logo: string;
  export let logoAlt: string;
</script>

<div class="intro-banner">
  <div class="banner-content">
    <img src={logo} alt={logoAlt} class="logo" />
    <span>
      <slot />
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

  .logo {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    border-radius: 2px;
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
