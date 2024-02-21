<script lang="ts">
  import "$lib/global.css";

  import { onMount } from "svelte";
  import { context } from "$lib/context";

  function scrollTo(section: SidebarSection) {
    return () => {
      const element = document.getElementById(section.id);
      if (element) {
        history.pushState(
          { id: section.id },
          "",
          "#" + section.label.replaceAll(" ", "")
        );
        element.scrollIntoView({ behavior: "smooth" });
      }
    };
  }

  function popState(event: PopStateEvent) {
    if (event.state && event.state.id) {
      if (event.state.id == "top") {
        mainColumn.scrollIntoView({ behavior: "smooth" });
      } else {
        const element = document.getElementById(event.state.id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  }

  let mainColumn: HTMLDivElement;

  let visibleSections: Array<number> = [];

  function observeCallback(entries: Array<IntersectionObserverEntry>, _) {
    entries.forEach((entry) => {
      let id: number = parseInt(entry.target.getAttribute("id").split("-")[1]);
      // If we use entry.isIntersecting, the element may still be partly
      // intersecting the scroll box, but hidden below a sticky element where
      // it's not visible. So we use the boundingClientRect to check if it's
      // bottom point is below the sticky element's height (110px), iff there
      // is a sticky element.

      let isIntersecting = context.isStuck()
        ? entry.boundingClientRect.bottom > 110
        : entry.isIntersecting;

      if (isIntersecting) {
        // Push to front or back, as appropriate, if not already present.
        if (visibleSections.length == 0) {
          visibleSections.push(id);
        } else if (visibleSections[0] > id) {
          visibleSections.unshift(id);
        } else if (visibleSections[visibleSections.length - 1] < id) {
          visibleSections.push(id);
        }
      } else {
        visibleSections = visibleSections.filter((x) => x != id);
      }
    });

    if (lastActiveSection) {
      lastActiveSection.active = false;
    }
    if (visibleSections.length > 0) {
      lastActiveSection = sidebarSections[visibleSections[0]];
      lastActiveSection.active = true;
    }
    sidebarSections = sidebarSections;
  }

  let observer: IntersectionObserver | null = null;

  function createObserver(isStuck: boolean = false) {
    if (!mainColumn) return;
    if (observer) observer.disconnect();
    observer = new IntersectionObserver(observeCallback, {
      root: document,
      rootMargin: "0px",
      // Every 5%:
      threshold: [...Array(20).keys()].map((i) => i / 20),
    });
    let children = mainColumn.querySelectorAll("[data-sidebarsection]");
    for (let i = 0; i < children.length; i++) {
      observer.observe(children[i]);
    }
  }

  class SidebarSection {
    label: string | null = "";
    id: string = "";
    heading: boolean = false;
    active: boolean = false;
    sponsor: boolean = false;
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
        sponsor: child.getAttribute("data-sponsor") == "true",
      });
    }
    sidebarSections = sidebarSections;
    createObserver();
  });
</script>

<svelte:window on:popstate={popState} />

<div class="twoColumns">
  <div class="sideBar">
    <ul>
      {#each sidebarSections as section}
        <li
          on:click={scrollTo(section)}
          on:keydown={scrollTo(section)}
          class:active={section.active}
          class:sponsor={section.sponsor}
          role="presentation"
        >
          <div class="navlabel" class:indent={hasHeading && !section.heading}>
            {section.label}
          </div>

          <span class="chevron">&rsaquo;</span>
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
      display: block;
    }
    .sideBar {
      display: none;
    }
    .mainColumn {
      margin: 0 auto;
      padding: 0 5px;
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
  li.active,
  li.active.sponsor {
    background-color: #0088cc;
    color: #fff;
    border-color: #0088cc;
  }
  li.sponsor {
    background-color: aliceblue;
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
    font-size: 24px;
  }
</style>
