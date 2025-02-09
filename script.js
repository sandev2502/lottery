class KeralaLotteryResults {
    constructor() {
        this.PROXY_URL = "https://api.allorigins.win/get?url=";
        this.BASE_URL = "https://www.keralalotteries.net";
        this.categories = [
            { name: "Akshaya", url: "/search/label/Akshaya%20Lottery%20Results" },
            { name: "Win Win", url: "/search/label/Win%20Win" },
            { name: "Sthree Sakthi", url: "/search/label/Sthree%20Sakthi" },
            { name: "Fifty Fifty", url: "/search/label/Fifty%20Fifty" },
            { name: "Karunya Plus", url: "/search/label/Karunya%20Plus" },
            { name: "Nirmal", url: "/search/label/Nirmal%20Lottery%20Results" },
            { name: "Karunya", url: "/search/label/Karunya%20Lottery%20Results" },
            { name: "Bumper", url: "/search/label/kerala-bumper-lotteries" }
        ];

        // Cache to store fetched results
        this.resultsCache = new Map();

        this.initializeApp();
    }

    initializeApp() {
        this.categoriesContainer = document.getElementById('categories');
        this.resultsContainer = document.getElementById('results');
        this.loadingIndicator = document.getElementById('loading');
        this.errorIndicator = document.getElementById('error');

        // Render categories only once
        this.renderCategories();
    }

    renderCategories() {
        // Use document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        this.categories.forEach(category => {
            const button = document.createElement('button');
            button.textContent = category.name;
            button.className = 'bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors';
            button.addEventListener('click', () => this.fetchLotteryResults(category));
            fragment.appendChild(button);
        });

        this.categoriesContainer.appendChild(fragment);
    }

    async fetchLotteryResults(category) {
        // Clear previous results and show loading
        this.resultsContainer.innerHTML = '';
        this.toggleLoading(true);
        this.toggleError(false);

        try {
            // Check cache first
            if (this.resultsCache.has(category.name)) {
                this.displayResults(this.resultsCache.get(category.name), category);
                return;
            }

            const fullUrl = `${this.BASE_URL}${category.url}`;
            const proxyUrl = `${this.PROXY_URL}${encodeURIComponent(fullUrl)}`;

            const response = await fetch(proxyUrl);
            const data = await response.json();

            // Parse the HTML content
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.contents, 'text/html');

            // Extract posts
            const posts = doc.querySelectorAll('.post');
            
            if (posts.length === 0) {
                this.resultsContainer.innerHTML = `
                    <div class="text-center text-gray-600">
                        No results found for ${category.name}
                    </div>
                `;
                return;
            }

            // Store results in cache
            const processedPosts = this.processPosts(posts, category.name);
            this.resultsCache.set(category.name, processedPosts);

            // Display results
            this.displayResults(processedPosts, category);

        } catch (error) {
            console.error('Fetch error:', error);
            this.toggleError(true);
        } finally {
            this.toggleLoading(false);
        }
    }

    processPosts(posts, categoryName) {
        return Array.from(posts).map(post => {
            const title = post.querySelector('.post-title')?.textContent.trim() || 'Lottery Result';
            const content = post.querySelector('.post-body')?.textContent.trim() || 'No details available';
            const fullContent = post.querySelector('.post-body')?.innerHTML || content;

            return { title, content, fullContent, categoryName };
        });
    }

    displayResults(posts, category) {
        // Use document fragment for better performance
        const fragment = document.createDocumentFragment();

        posts.forEach(postData => {
            const resultCard = document.createElement('div');
            resultCard.className = 'bg-white p-4 rounded-lg shadow-md cursor-pointer hover:bg-gray-50 transition-colors';
            resultCard.innerHTML = `
                <h3 class="text-lg font-bold text-blue-600 mb-2">${postData.title}</h3>
                <p class="text-gray-700">${this.truncateText(postData.content, 200)}</p>
                <div class="mt-2 text-sm text-gray-500">
                    Category: ${category.name}
                </div>
            `;

            // Add click event to open post details
            resultCard.addEventListener('click', () => {
                // Save post data to localStorage
                localStorage.setItem('selectedPost', JSON.stringify({
                    title: postData.title,
                    content: postData.fullContent,
                    category: category.name
                }));
                
                // Open post details page
                window.open('post_details.html', '_blank');
            });

            fragment.appendChild(resultCard);
        });

        this.resultsContainer.appendChild(fragment);
    }

    truncateText(text, maxLength) {
        return text.length > maxLength 
            ? text.substring(0, maxLength) + '...' 
            : text;
    }

    toggleLoading(show) {
        this.loadingIndicator.classList.toggle('hidden', !show);
    }

    toggleError(show) {
        this.errorIndicator.classList.toggle('hidden', !show);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.lotteryApp = new KeralaLotteryResults();
});