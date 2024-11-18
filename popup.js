console.log("Lorem Ipsum");

document.addEventListener('DOMContentLoaded', async () => {
  const recentReadsContainer = document.getElementById('recentReads');
  const recentReads = await chrome.storage.sync.get('ao3RecentReads');
  const reads = recentReads.ao3RecentReads || [];

  if (reads.length === 0) {
    recentReadsContainer.innerHTML = '<p>No recent reads</p>';
    return;
  }

  reads.forEach(fic => {
    const ficElement = document.createElement('div');
    ficElement.classList.add('fic-item');
    ficElement.innerHTML = `
      <h3>${fic.title}</h3>
      <p>By ${fic.author}</p>
      <p>Progress: ${Math.round(fic.scrollPosition)}%</p>
      <div class="fic-actions">
        <button class="continue-reading" data-url="${fic.url}">Continue Reading</button>
        <button class="remove-fic" data-id="${fic.id}">Remove</button>
      </div>
    `;
    recentReadsContainer.appendChild(ficElement);
  });

  // Continue Reading functionality
  document.querySelectorAll('.continue-reading').forEach(button => {
    button.addEventListener('click', (e) => {
      chrome.tabs.create({ url: e.target.dataset.url });
    });
  });

  // Remove Fic functionality
  document.querySelectorAll('.remove-fic').forEach(button => {
    button.addEventListener('click', async (e) => {
      const workId = e.target.dataset.id;
      const recentReads = await chrome.storage.sync.get('ao3RecentReads');
      const updatedReads = recentReads.ao3RecentReads.filter(fic => fic.id !== workId);
      await chrome.storage.sync.set({ 'ao3RecentReads': updatedReads });
      e.target.closest('.fic-item').remove();
    });
  });
});
