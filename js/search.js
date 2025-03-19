const SearchManager = {
    init() {
        this.searchInput = document.getElementById('searchInput');
        this.searchInput.addEventListener('input', () => this.filterCards());
    },
    filterCards() {
        const searchTerm = this.searchInput.value.toLowerCase();
        document.querySelectorAll('.service-group').forEach(group => {
            let hasVisible = false;
            group.querySelectorAll('.service-card').forEach(card => {
                const match = card.textContent.toLowerCase().includes(searchTerm);
                card.style.display = match ? 'flex' : 'none';
                if (match) hasVisible = true;
            });
            group.style.display = hasVisible ? 'block' : 'none';
        });
    }
};
