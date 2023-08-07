<script lang="ts">
  import { onMount } from "svelte";
  import { ChevronRight } from "svelte-bootstrap-icons";

  function scrollTo(id: string) {
    return () => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    };
  }

  let mainColumn: HTMLDivElement;

  let visibleSections: Array<number> = [];

  let observer = new IntersectionObserver(
    (entries, _) => {
      entries.forEach((entry) => {
        let id: number = parseInt(
          entry.target.getAttribute("id").split("-")[1]
        );
        if (entry.isIntersecting) {
          visibleSections.push(id);
        } else {
          visibleSections = visibleSections.filter((x) => x != id);
        }
      });
      // Ensure we are sorting by number, not string:
      visibleSections.sort((n1, n2) => n1 - n2);

      if (lastActiveSection) {
        lastActiveSection.active = false;
      }
      if (visibleSections.length > 0) {
        lastActiveSection = sidebarSections[visibleSections[0]];
        lastActiveSection.active = true;
      }
      sidebarSections = sidebarSections;
    },
    {
      rootMargin: "0px",
      threshold: 0.1,
    }
  );

  class SidebarSection {
    label: string;
    id: string;
    heading: boolean = false;
    active: boolean = false;
  }
  let lastActiveSection: SidebarSection;

  let hasHeading: boolean = false;
  let sidebarSections: Array<SidebarSection> = [];

  onMount(() => {
    // Read the SidebarSection components from the slot and use them to
    // populate the sidebar.
    let children = mainColumn.querySelectorAll("[data-sidebarsection]");
    for (let i = 0; i < children.length; i++) {
      let child = children[i];
      let isHeading = child.getAttribute("data-heading") == "true";
      // If we have no headings, then nothing should be indented. If we have
      // at least one heading, non-heading items should be indented.
      if (isHeading) hasHeading = true;
      sidebarSections.push({
        label: child.getAttribute("data-label"),
        id: child.id,
        heading: isHeading,
        // active highlights a section if it's visible at the top of
        // the viewport. Initially all false.
        active: false,
      });
      observer.observe(child);
    }
    sidebarSections = sidebarSections;
  });
</script>

<div class="twoColumns">
  <div class="sideBar">
    <ul>
      {#each sidebarSections as section}
        <li
          on:click={scrollTo(section.id)}
          on:keydown={scrollTo(section.id)}
          class:active={section.active}
        >
          {#if hasHeading && !section.heading}
            <div class="navlabel indent">{section.label}</div>
          {:else}
            <div class="navlabel">{section.label}</div>
          {/if}
          <span class="chevron"><ChevronRight /></span>
        </li>
      {/each}
    </ul>
  </div>
  <div class="mainColumn" bind:this={mainColumn}>
    <slot />
  </div>
</div>

<style>
  @media print {
    .twoColumns {
      display: grid;
      grid-template-columns: 0 1fr;
    }
    .sideBar {
      display: none;
    }
  }
  /** Wide Tablet or Desktop **/
  @media screen and (min-width: 1025px) {
    .twoColumns {
      display: grid;
      grid-template-columns: 230px 1fr;
      grid-column-gap: 10px;
    }
    .mainColumn {
      max-width: 750px;
    }
  }
  /** Tall Tablet **/
  @media screen and (max-width: 1024px) {
    /** Hide the sidebar, display only main column*/
    .sideBar {
      display: none;
    }
    .twoColumns {
      display: block;
    }
    .mainColumn {
      margin: 0 auto;
      padding: 0 5px;
    }
  }
  /**
   * This prevents the sidebar from being selected as the "scroll anchoring"
   * element. This is a feature that prevents the page from jumping around
   * when new content is loaded. However, the sidebar doesn't scroll, so it
   * shouldn't be used as the anchor.
   */
  .sideBar {
    overflow-anchor: none;
  }

  ul {
    top: 10px;
    position: sticky;
    margin: 20px 15px 0 0;
    border-radius: 6px;
    max-width: 220px;
    list-style: none;
    padding: 0;
  }
  li {
    line-height: 20px;
    margin-top: 0;
    position: relative;
    display: block;
    color: #0088cc;
    text-decoration: none;
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
    border: 1px solid #e5e5e5;
    padding: 8px 14px;
    margin: 0 0 -1px;
    display: block;
    font-size: 14px;
    cursor: pointer;
  }
  li.active {
    background-color: #0088cc;
    color: #fff;
    border-color: #0088cc;
  }
  li:first-child {
    border-radius: 6px 6px 0 0;
  }
  li:last-child {
    border-radius: 0 0 6px 6px;
  }
  .navlabel {
    display: inline-block;
    max-width: 175px;
    padding-right: 20px;
    white-space: nowrap;
  }
  .navlabel.indent {
    padding-left: 10px;
  }
  .chevron {
    position: absolute;
    top: 10px;
    right: 4px;
  }
</style>
