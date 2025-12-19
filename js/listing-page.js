/**
 * Shared JavaScript for listing pages (blog, news)
 * Handles view toggle, filtering, sorting, and pagination
 */

class ListingPage {
    constructor(config) {
        this.gridId = config.gridId;
        this.filterField = config.filterField || 'series';
        this.itemsPerPage = config.itemsPerPage || 6;
        this.currentPage = 1;

        this.grid = document.getElementById(this.gridId);
        this.gridViewBtn = document.getElementById('grid-view-btn');
        this.listViewBtn = document.getElementById('list-view-btn');
        this.filterSelect = document.getElementById('filter-select');
        this.sortSelect = document.getElementById('sort-select');
        this.prevBtn = document.getElementById('prev-page');
        this.nextBtn = document.getElementById('next-page');
        this.pageInfo = document.getElementById('page-info');

        if (this.grid) this.init();
    }

    init() {
        // View Toggle
        this.gridViewBtn?.addEventListener('click', () => {
            this.grid.classList.remove('list-view');
            this.gridViewBtn.classList.add('active');
            this.listViewBtn.classList.remove('active');
        });

        this.listViewBtn?.addEventListener('click', () => {
            this.grid.classList.add('list-view');
            this.listViewBtn.classList.add('active');
            this.gridViewBtn.classList.remove('active');
        });

        // Filter
        this.filterSelect?.addEventListener('change', () => {
            const value = this.filterSelect.value;
            this.grid.querySelectorAll('.blog-card').forEach(card => {
                const match = value === 'all' || card.dataset[this.filterField] === value;
                card.classList.toggle('filtered-out', !match);
            });
            this.currentPage = 1;
            this.updatePagination();
        });

        // Sort
        this.sortSelect?.addEventListener('change', () => {
            const value = this.sortSelect.value;
            const cards = Array.from(this.grid.querySelectorAll('.blog-card'));

            cards.sort((a, b) => {
                if (value === 'date-desc') {
                    return new Date(b.dataset.date) - new Date(a.dataset.date);
                } else if (value === 'date-asc') {
                    return new Date(a.dataset.date) - new Date(b.dataset.date);
                } else if (value === 'series') {
                    return parseInt(a.dataset.seriesOrder || 0) - parseInt(b.dataset.seriesOrder || 0);
                }
                return 0;
            });

            cards.forEach(card => this.grid.appendChild(card));
            this.updatePagination();
        });

        // Pagination
        this.prevBtn?.addEventListener('click', () => {
            this.currentPage--;
            this.updatePagination();
        });

        this.nextBtn?.addEventListener('click', () => {
            this.currentPage++;
            this.updatePagination();
        });

        this.updatePagination();
    }

    getVisibleCards() {
        return Array.from(this.grid.querySelectorAll('.blog-card:not(.filtered-out)'));
    }

    updatePagination() {
        const cards = this.getVisibleCards();
        const totalPages = Math.ceil(cards.length / this.itemsPerPage) || 1;
        this.currentPage = Math.min(this.currentPage, totalPages);

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;

        cards.forEach((card, i) => {
            card.style.display = (i >= start && i < end) ? '' : 'none';
        });

        if (this.pageInfo) {
            this.pageInfo.textContent = `${this.currentPage} / ${totalPages}`;
        }
        if (this.prevBtn) this.prevBtn.disabled = this.currentPage === 1;
        if (this.nextBtn) this.nextBtn.disabled = this.currentPage === totalPages;
    }
}

// Auto-init if data attribute present
document.addEventListener('DOMContentLoaded', () => {
    const listingEl = document.querySelector('[data-listing]');
    if (listingEl) {
        new ListingPage({
            gridId: listingEl.dataset.listing,
            filterField: listingEl.dataset.filterField || 'series',
            itemsPerPage: parseInt(listingEl.dataset.itemsPerPage) || 6
        });
    }
});
