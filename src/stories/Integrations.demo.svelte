<!--
  @component
  Demo wrapper for displaying all IntroBanner integration variants.
  Used only in Storybook stories to show consolidated view of all integrations.
-->
<script lang="ts">
// IntroBanners for each integration
import FiCalcIntroBanner from '$lib/components/integrations/ficalc.app/IntroBanner.svelte';
import CFireSimIntroBanner from '$lib/components/integrations/cfiresim.com/IntroBanner.svelte';
import FireCalcIntroBanner from '$lib/components/integrations/firecalc.com/IntroBanner.svelte';
import LinoptIntroBanner from '$lib/components/integrations/linopt.com/IntroBanner.svelte';
import OpenSSIntroBanner from '$lib/components/integrations/opensocialsecurity.com/IntroBanner.svelte';
import OwlPlannerIntroBanner from '$lib/components/integrations/owlplanner.streamlit.app/IntroBanner.svelte';
import FinPodsIntroBanner from '$lib/components/integrations/finpodsai.com/IntroBanner.svelte';

export let isReportView: boolean = false;
</script>

<div class="integrations-demo">
  <div class="demo-header">
    <h2>Integration IntroBanners</h2>
    <p>
      <code>isReportView: {isReportView}</code>
      {#if isReportView}
        - Shows "Scroll to see results" badge
      {:else}
        - No badge (paste flow view)
      {/if}
    </p>
  </div>

  <div class="banner-list">
    <div class="banner-item">
      <h3>FI Calc</h3>
      <FiCalcIntroBanner {isReportView} />
    </div>

    <div class="banner-item">
      <h3>cFIREsim</h3>
      <CFireSimIntroBanner {isReportView} />
    </div>

    <div class="banner-item">
      <h3>FIRECalc</h3>
      <FireCalcIntroBanner {isReportView} />
    </div>

    <div class="banner-item">
      <h3>Linopt</h3>
      <LinoptIntroBanner {isReportView} />
    </div>

    <div class="banner-item">
      <h3>Open Social Security</h3>
      <OpenSSIntroBanner {isReportView} />
    </div>

    <div class="banner-item">
      <h3>Owl Retirement Planner</h3>
      <OwlPlannerIntroBanner {isReportView} />
    </div>

    <div class="banner-item">
      <h3>Fin Pods AI</h3>
      <FinPodsIntroBanner {isReportView} />
    </div>
  </div>
</div>

<style>
  .integrations-demo {
    max-width: 1100px;
    margin: 0 auto;
    padding: 1em;
  }

  .demo-header {
    margin-bottom: 1.5em;
    padding-bottom: 1em;
    border-bottom: 1px solid #dee2e6;
  }

  .demo-header h2 {
    margin: 0 0 0.5em 0;
    color: #212529;
  }

  .demo-header p {
    margin: 0;
    color: #6c757d;
  }

  .demo-header code {
    background: #e9ecef;
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
  }

  .banner-list {
    display: flex;
    flex-direction: column;
    gap: 1.5em;
  }

  .banner-item {
    border: 1px solid #e9ecef;
    border-radius: 8px;
    overflow: hidden;
  }

  .banner-item h3 {
    margin: 0;
    padding: 0.75em 1em;
    background: #f8f9fa;
    font-size: 0.95em;
    color: #495057;
    border-bottom: 1px solid #e9ecef;
  }
</style>
