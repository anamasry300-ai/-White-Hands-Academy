/* ===============================================
   ESENZA ACADEMY — INTERACTIVE SCRIPT
   =============================================== */

document.addEventListener('DOMContentLoaded', function() {
    initNavbar();
    initOriginCards();
    initScrollAnimations();
    initCtaButton();
    initJourneyGallery();
});

// ==========================================
// NAVBAR SCROLL EFFECT
// ==========================================

function initNavbar() {
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Nav link scroll
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}

// ==========================================
// ORIGIN CARDS INTERACTIVE
// ==========================================

function initOriginCards() {
    const cards = document.querySelectorAll('.origin-card');
    
    cards.forEach(card => {
        const popup = card.querySelector('.origin-popup');
        
        card.addEventListener('mouseenter', function() {
            if (window.innerWidth > 768) {
                popup.style.display = 'flex';
                popup.style.animation = 'slideInRight 0.3s ease';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            if (window.innerWidth > 768) {
                popup.style.display = 'none';
            }
        });
        
        card.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                if (popup.style.display === 'flex') {
                    popup.style.display = 'none';
                } else {
                    popup.style.display = 'flex';
                }
            }
        });
    });
}

// ==========================================
// SCROLL ANIMATIONS
// ==========================================

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    const animatedElements = document.querySelectorAll(
        '.content-card, .process-card, .brewery-method, .gallery-item, .roast-level'
    );
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// ==========================================
// CTA BUTTON
// ==========================================

function initCtaButton() {
    const ctaButton = document.querySelector('.cta-button');
    
    if (ctaButton) {
        ctaButton.addEventListener('click', function() {
            const firstSection = document.querySelector('.academy-section');
            if (firstSection) {
                firstSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

// ==========================================
// SMOOTH SCROLL FOR ALL ANCHOR LINKS
// ==========================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ==========================================
// PARALLAX EFFECT ON HERO (Optional)
// ==========================================

window.addEventListener('scroll', function() {
    const hero = document.querySelector('.hero');
    if (hero) {
        const scrollPosition = window.pageYOffset;
        hero.style.backgroundPosition = `center ${scrollPosition * 0.5}px`;
    }
});

// ==========================================
// RESPONSIVE INTERACTIONS
// ==========================================

function handleResponsive() {
    const width = window.innerWidth;
    
    if (width <= 768) {
        // Mobile adjustments
        document.querySelectorAll('.origin-popup').forEach(popup => {
            popup.style.display = 'none';
        });
    }
}

window.addEventListener('resize', handleResponsive);

// ==========================================
// CONSOLE LOG FOR DEBUGGING
// ==========================================

console.log('🌍 Esenza Academy — من البذرة إلى الفنجان');
console.log('✨ Welcome to the visual storytelling experience');
console.log('📷 All photography should be high-quality, cinematic, and tell a story');

// ==========================================
// JOURNEY GALLERY LIGHTBOX
// ==========================================

function initJourneyGallery(){
    const allItems = Array.from(document.querySelectorAll(
        '.journey-item, .journey-thumb, .visual-lightbox-item, .content-card, .gallery-item, .photo-tile, .image-lesson, .journey-badges img'
    )).filter(el => getItemImage(el));
    const lightbox = document.getElementById('journey-lightbox');
    if(!allItems.length || !lightbox) return;

    const lbImg = lightbox.querySelector('.lightbox-media img');
    const lbTitle = lightbox.querySelector('.lightbox-title');
    const lbCaption = lightbox.querySelector('.lightbox-caption');
    const lbDetailsPanel = lightbox.querySelector('.lightbox-details-panel');
    const lbDetailsContent = lightbox.querySelector('.lightbox-details-content');
    let currentIndex = 0;

    const data = allItems.map((el, i) => {
        const img = getItemImage(el);
        const heading = el.querySelector('h3, h4, strong');
        const caption = el.querySelector('figcaption, .caption, p');
        return {
            el,
            src: img ? img.src : '',
            title: el.dataset.title || (heading ? heading.textContent.trim() : img.alt),
            caption: el.dataset.caption || (caption ? caption.textContent.trim() : img.alt),
            detail: el.dataset.detail || '',
            level: el.dataset.level || ''
        };
    });

    allItems.forEach((el, idx) => {
        el.classList.add('lightbox-trigger');
        if (el.tagName.toLowerCase() !== 'button') {
            el.setAttribute('role', 'button');
            el.setAttribute('tabindex', '0');
        }
        el.addEventListener('click', function(){ openLightbox(idx); });
        el.addEventListener('keydown', function(e){
            if(e.key === 'Enter' || e.key === ' '){
                e.preventDefault();
                openLightbox(idx);
            }
        });
    });

    lightbox.querySelectorAll('[data-action="close"]').forEach(btn=>btn.addEventListener('click', closeLightbox));
    lightbox.querySelector('.lightbox-prev').addEventListener('click', ()=> showLightboxItem(currentIndex-1));
    lightbox.querySelector('.lightbox-next').addEventListener('click', ()=> showLightboxItem(currentIndex+1));

    const detailsBtn = lightbox.querySelector('.lightbox-details');
    detailsBtn.addEventListener('click', ()=>{
        const expanded = detailsBtn.getAttribute('aria-expanded') === 'true';
        detailsBtn.setAttribute('aria-expanded', (!expanded).toString());
        lbDetailsPanel.hidden = expanded;
    });

    function openLightbox(index){
        currentIndex = (index + data.length) % data.length;
        const item = data[currentIndex];
        lbImg.src = item.src;
        lbImg.alt = item.title;
        lbTitle.textContent = item.level ? `${item.title} — مستوى ${item.level}` : item.title;
        lbCaption.textContent = item.caption;
        lbDetailsContent.textContent = item.detail.trim().length ? item.detail : `مزيد من التفاصيل حول ${item.title}. ${item.caption}`;
        detailsBtn.setAttribute('aria-expanded', 'false');
        lbDetailsPanel.hidden = true;
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden','false');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox(){
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden','true');
        document.body.style.overflow = '';
    }

    function showLightboxItem(index){
        openLightbox((index + data.length) % data.length);
    }

    document.addEventListener('keydown', function(e){
        if(!lightbox.classList.contains('open')) return;
        if(e.key === 'Escape') closeLightbox();
        if(e.key === 'ArrowRight') showLightboxItem(currentIndex+1);
        if(e.key === 'ArrowLeft') showLightboxItem(currentIndex-1);
    });

    function getItemImage(el){
        return el.tagName && el.tagName.toLowerCase() === 'img' ? el : el.querySelector('img');
    }
}
