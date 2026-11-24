<!--
  @component
  One Retirement Chartplotter setting, drawn like Chartplotter's own field:
  the label above a box with the value. Number fields are typed into a box
  there and get a copy button; select fields are dropdowns or pickers and get
  a dropdown arrow. `owner` names the person in couples, so each copy button
  has a distinct accessible name.
-->
<script lang="ts">
import type { RcpField } from '$lib/integrations/retirement-chartplotter';
import CopyButton from '../CopyButton.svelte';

export let field: RcpField;
export let owner: string | null = null;
</script>

<div class="rcp-field">
  <span class="rcp-label">{field.label}</span>
  <div class="rcp-control">
    <span class="rcp-box" class:select={field.kind === 'select'}>
      <span class="value">{field.value}</span>
    </span>
    {#if field.kind === 'number'}
      <CopyButton
        value={field.copyValue}
        label={owner === null
          ? `Copy ${field.label}`
          : `Copy ${field.label} (${owner})`}
      />
    {/if}
  </div>
</div>

<style>
  .rcp-field {
    margin: 0.6em 0 0.9em;
  }

  .rcp-label {
    display: block;
    margin-bottom: 0.35em;
    color: #000;
  }

  .rcp-control {
    display: flex;
    align-items: center;
    gap: 0.5em;
  }

  .rcp-box {
    flex: 1;
    display: flex;
    align-items: center;
    min-height: 44px;
    box-sizing: border-box;
    padding: 8px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #fff;
  }

  .rcp-box.select {
    padding: 10px 12px;
    border-color: #ccc;
    color: #1f2937;
    font-size: 0.9em;
  }

  .rcp-box.select::after {
    content: '\25BE';
    margin-left: auto;
    padding-left: 0.5em;
    color: #4b5563;
  }

  .value {
    font-weight: 600;
  }
</style>
