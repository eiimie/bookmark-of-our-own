class Bo3tracker {
  constructor() {
    this.MAX_TRACKED_FICS = 10;
    this.storageKey = 'bo3Reads';
    this.init();
}

init() {
  this.trackScrollPosition();
  this.checkFicCompletion();
}

trackScrollPosition() { 
  window.addEventListener('scroll', this.debounce(() => { 
    const workId = this.getCurrentWorkId();
    if (workId) {
      const scrollPercentage = this.calculateScrollPercentage();
      this.updateFicPosition(workId, scrollPercentage);
    }
  }, 200));
}

checkFicCompletion() {
    const isEndOfPage = () => 
      (window.innerHeight + window.scrollY) >= document.body.offsetHeight;

    window.addEventListener('scroll', this.debounce(() => {
      if (isEndOfPage()) {
        this.removeFicFromTracked(this.getCurrentWorkId());
      }
    }, 200));
  }

  getCurrentWorkId() {
    const workMatch = window.location.pathname.match(/\/works\/(\d+)/);
    return workMatch ? workMatch[1] : null;
  }

  calculateScrollPercentage() {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    return (scrollTop / (docHeight - winHeight)) * 100;
  }

  async updateFicPosition(workId, scrollPercentage) {
    const recentReads = await this.getRecentReads();
    const existingFicIndex = recentReads.findIndex(fic => fic.id === workId);

    if (existingFicIndex !== -1) {
      recentReads[existingFicIndex].scrollPosition = scrollPercentage;
    } else {
      const ficDetails = this.getFicDetails();
      recentReads.unshift({
        id: workId,
        title: ficDetails.title,
        author: ficDetails.author,
        scrollPosition: scrollPercentage,
        url: window.location.href
      });

      if (recentReads.length > this.MAX_TRACKED_FICS) {
        recentReads.pop();
      }
    }

    await this.saveRecentReads(recentReads);
  }

  getFicDetails() {
    return {
      title: document.querySelector('.title.heading').textContent.trim(),
      author: document.querySelector('.byline a')?.textContent.trim() || 'Unknown Author'
    };
  }

  async getRecentReads() {
    const data = await chrome.storage.sync.get(this.storageKey);
    return data[this.storageKey] || [];
  }

  async saveRecentReads(reads) {
    await chrome.storage.sync.set({ [this.storageKey]: reads });
  }

  async removeFicFromTracked(workId) {
    const recentReads = await this.getRecentReads();
    const updatedReads = recentReads.filter(fic => fic.id !== workId);
    await this.saveRecentReads(updatedReads);
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize when the page loads
if (window.location.hostname === 'archiveofourown.org' && window.location.pathname.includes('/works/')) {
  new AO3ReaderTracker();
}
