<script lang="ts">
  import { onMount } from "svelte";
  import Loader from "../src/component/loader.svelte";

  let connections = $state([]);
  let loading = $state(true);
  let error = $state(null);

  let loadMoreBtn: HTMLButtonElement | null = null;

  async function loadMoreConnections() {
    loading = true;
    error = null;
    chrome.tabs.query(
      {
        url: "https://www.linkedin.com/*",
      },
      (tabs) => {
        const linkedInTab = tabs[0];
        if (!linkedInTab?.id) {
          error = "No LinkedIn connections tab open";
          loading = false;
          return;
        }

        chrome.tabs.sendMessage(
          linkedInTab.id,
          { type: "CHECK_LOGIN" },
          (res) => {
            if (chrome.runtime.lastError) {
              error = "Content script not found. Are you on LinkedIn?";
              loading = false;
              return;
            }

            if (!res?.loggedIn) {
              error = "User not logged in on LinkedIn";
              loading = false;
              return;
            }

            chrome.tabs.sendMessage(
              linkedInTab.id,
              { type: "SCRAPE_CONNECTIONS", offset: connections.length },
              (res) => {
                if (res?.success) {
                  connections = [...connections, ...res.data];
                } else {
                  error = res?.error ?? "Failed to scrape connections";
                }
                loading = false;
              },
            );
          },
        );
      },
    );
  }

  onMount(() => {
    loadMoreConnections();
  });

  $effect(() => {
    if (connections.length === 0 || !loadMoreBtn) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            loadMoreConnections();
          }
        }
      },
      { root: null, rootMargin: "0px", threshold: 0.1 },
    );

    observer.observe(loadMoreBtn);

    return () => observer.disconnect();
  });
</script>

<div class="w-screen h-screen flex flex-col">
  <h1 class="text-xl font-bold mb-4 pt-4 pl-4">LinkedIn Connections</h1>
  <div class="w-full flex-1 flex flex-col justify-center items-center pb-4">
    {#if loading && connections.length === 0}
      <Loader />
    {:else if error}
      <h4 class="text-red-500 text-2xl font-medium">Error: {error}</h4>
    {:else if connections.length === 0}
      <h4 class="text-2xl font-medium">No connections found</h4>
    {:else}
      <ul class="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
        {#each connections as c, i}
          <li class="flex items-center space-x-3 p-3 bg-white rounded shadow">
            <span class="pr-2">{i + 1}</span>
            <img
              class="w-12 h-12 rounded-full"
              src={c.profilePicture}
              alt={c.fullName}
            />
            <div>
              <p class="font-semibold">{c.fullName}</p>
              <p class="text-sm text-gray-600">
                {c.position} {c.currentCompany ? `@ ${c.currentCompany}` : ""}
              </p>
            </div>
          </li>
        {/each}
        {#if !loading}<button bind:this={loadMoreBtn}>Load more</button>
        {:else}<div class="w-screen pt-2 pb-2 flex justify-center"><Loader /></div>
        {/if}
      </ul>
    {/if}
  </div>
</div>
