<script lang="ts">
  import { onMount } from "svelte";

  let connections = $state([]);
  let loading = $state(true);
  let error = $state(null);

  onMount(() => {
    chrome.tabs.query(
      {
        url: "https://www.linkedin.com/mynetwork/invite-connect/connections/*",
      },
      (tabs) => {
        const linkedInTab = tabs[0];
        if (!linkedInTab?.id) {
          error = "No LinkedIn connections tab open";
          loading = false;
          return;
        }

        chrome.tabs.sendMessage(linkedInTab.id, { type: "CHECK_LOGIN" }, (res) => {
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
            { type: "SCRAPE_CONNECTIONS" },
            (res) => {
              if (res?.success) {
                connections = res.data;
              } else {
                error = res?.error ?? "Failed to scrape connections";
              }
              loading = false;
            },
          );
        });
      },
    );
  });
</script>

<div class="p-6">
  <h1 class="text-xl font-bold mb-4">LinkedIn Connections</h1>

  {#if loading}
    <p>Loading...</p>
  {:else if error}
    <p class="text-red-500">Error: {error}</p>
  {:else if connections.length === 0}
    <p>No connections found</p>
  {:else}
    <ul class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {#each connections as c}
        <li class="flex items-center space-x-3 p-3 bg-white rounded shadow">
          <img
            class="w-12 h-12 rounded-full"
            src={c.profilePicture}
            alt={c.fullName}
          />
          <div>
            <p class="font-semibold">{c.fullName}</p>
            <p class="text-sm text-gray-600">{c.position}</p>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>
