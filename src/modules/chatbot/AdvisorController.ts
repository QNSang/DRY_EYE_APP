/**
 * Advisor Controller
 * Manages the FAQ/Advisor tab UI and interactions
 */

import {
    FAQ_CATEGORIES,
    FAQItem,
    FAQCategory,
    getFAQsByCategory,
    getFAQById,
    getRelatedFAQs
} from '../chatbot/FAQBank';

export class AdvisorController {
    private container: HTMLElement | null;
    private currentCategory: FAQCategory | null = null;
    private currentFAQ: FAQItem | null = null;

    constructor() {
        this.container = document.getElementById('advisor-container');
        this.init();
    }

    private init() {
        if (!this.container) {
            console.warn('Advisor container not found');
            return;
        }
        this.renderCategories();
    }

    /**
     * Reset to category view
     */
    public reset() {
        this.currentCategory = null;
        this.currentFAQ = null;
        this.renderCategories();
    }

    /**
     * Render main category selection
     */
    private renderCategories() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="advisor-header">
                <h1><i class="ph-duotone ph-robot"></i> Eye Advisor</h1>
                <p class="advisor-subtitle">Chọn chủ đề bạn muốn tìm hiểu</p>
            </div>
            <div class="category-grid">
                ${FAQ_CATEGORIES.map(cat => `
                    <button class="category-card" data-category="${cat.id}">
                        <div class="category-icon-wrapper">
                            <i class="${cat.icon}"></i>
                        </div>
                        <span class="category-name">${cat.name}</span>
                        <span class="category-desc">${cat.description}</span>
                    </button>
                `).join('')}
            </div>
        `;

        // Add event listeners
        this.container.querySelectorAll('.category-card').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = (e.currentTarget as HTMLElement).dataset.category as FAQCategory;
                this.showCategory(category);
            });
        });
    }

    /**
     * Show questions in a category
     */
    private showCategory(category: FAQCategory) {
        if (!this.container) return;
        this.currentCategory = category;

        const categoryInfo = FAQ_CATEGORIES.find(c => c.id === category);
        const faqs = getFAQsByCategory(category);

        this.container.innerHTML = `
            <div class="advisor-header">
                <button class="back-btn-advisor" id="btn-back-categories">
                    <i class="ph ph-caret-left"></i> Quay lại
                </button>
                <h1><i class="${categoryInfo?.icon}"></i> ${categoryInfo?.name}</h1>
            </div>
            <div class="faq-list">
                ${faqs.map(faq => `
                    <button class="faq-item" data-faq-id="${faq.id}">
                        <span class="faq-question">${faq.question}</span>
                        <span class="faq-arrow"><i class="ph ph-caret-right"></i></span>
                    </button>
                `).join('')}
            </div>
        `;

        // Add event listeners
        document.getElementById('btn-back-categories')?.addEventListener('click', () => {
            this.renderCategories();
        });

        this.container.querySelectorAll('.faq-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const faqId = (e.currentTarget as HTMLElement).dataset.faqId;
                if (faqId) this.showAnswer(faqId);
            });
        });
    }

    /**
     * Show answer for a specific FAQ
     */
    private showAnswer(faqId: string) {
        if (!this.container) return;

        const faq = getFAQById(faqId);
        if (!faq) return;

        this.currentFAQ = faq;
        const relatedFAQs = getRelatedFAQs(faqId);
        const categoryInfo = FAQ_CATEGORIES.find(c => c.id === faq.category);

        // Convert markdown-like formatting to HTML
        const formattedAnswer = this.formatAnswer(faq.answer);

        this.container.innerHTML = `
            <div class="advisor-header">
                <button class="back-btn-advisor" id="btn-back-category">
                    <i class="ph ph-caret-left"></i> ${categoryInfo?.name}
                </button>
            </div>
            <div class="answer-card-advisor">
                <h3 class="answer-question">${faq.question}</h3>
                <div class="answer-content">
                    ${formattedAnswer}
                </div>
            </div>
            ${relatedFAQs.length > 0 ? `
                <div class="related-section">
                    <h4><i class="ph-duotone ph-bookmarks"></i> Câu hỏi liên quan</h4>
                    <div class="related-list">
                        ${relatedFAQs.map(related => `
                            <button class="related-item" data-faq-id="${related.id}">
                                ${related.question}
                            </button>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;

        // Add event listeners
        document.getElementById('btn-back-category')?.addEventListener('click', () => {
            if (this.currentCategory) {
                this.showCategory(this.currentCategory);
            } else {
                this.renderCategories();
            }
        });

        this.container.querySelectorAll('.related-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const relatedId = (e.currentTarget as HTMLElement).dataset.faqId;
                if (relatedId) this.showAnswer(relatedId);
            });
        });
    }

    /**
     * Format answer text with basic markdown support
     */
    private formatAnswer(text: string): string {
        return text
            // Bold **text**
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            // Bullet points
            .replace(/^• /gm, '<span class="bullet">•</span> ')
            // Line breaks
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            // Icon placeholders {ph-icon-name} -> <i class="ph-duotone ph-icon-name"></i>
            .replace(/\{ph-(.+?)\}/g, '<i class="ph-duotone ph-$1 answer-inline-icon"></i>')
            // Wrap in paragraph
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
    }
}
