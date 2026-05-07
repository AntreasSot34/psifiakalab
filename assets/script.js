/* ==========================================================================
   Psifiaka Lab - Shared JavaScript
   Navigation, mobile menu, scroll spy
   ========================================================================== */

(function() {
  'use strict';

  // ---------- Mobile menu toggle ----------
  const navToggle = document.querySelector('.nav-toggle');
  const navList = document.querySelector('.nav-list');
  
  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      const isOpen = navList.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen);
      navToggle.textContent = isOpen ? 'Κλείσιμο ✕' : 'Μενού ☰';
    });
    
    // Close on link click (mobile)
    navList.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (navList.classList.contains('is-open')) {
          navList.classList.remove('is-open');
          navToggle.setAttribute('aria-expanded', 'false');
          navToggle.textContent = 'Μενού ☰';
        }
      });
    });
  }

  // ---------- Active link highlight ----------
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-list a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // ---------- Scroll spy for chapter sidebar ----------
  const sidebarLinks = document.querySelectorAll('.chapter-sidebar a[href^="#"]');
  if (sidebarLinks.length > 0) {
    const sections = Array.from(sidebarLinks).map(link => {
      const id = link.getAttribute('href').slice(1);
      return document.getElementById(id);
    }).filter(Boolean);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          sidebarLinks.forEach(link => {
            link.classList.toggle('active',
              link.getAttribute('href') === '#' + entry.target.id);
          });
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });

    sections.forEach(section => observer.observe(section));
  }

  // ---------- PDF tabs ----------
  document.querySelectorAll('.pdf-embed-wrap').forEach(wrap => {
    const tabs = wrap.querySelectorAll('.pdf-tab-btn');
    const iframe = wrap.querySelector('iframe');
    if (!iframe || tabs.length === 0) return;
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        iframe.src = tab.dataset.src;
      });
    });
  });

})();
