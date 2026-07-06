    /* ────────────────────────────
       REGISTER PLUGINS (must be first)
    ──────────────────────────── */
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    /* ────────────────────────────
       PREFERS REDUCED MOTION
    ──────────────────────────── */
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ────────────────────────────
       CUSTOM CURSOR
    ──────────────────────────── */
    const cursor = document.getElementById('cursor');
    const cursorRing = document.getElementById('cursor-ring');
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let ringX = 0, ringY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function updateCursor() {
      const ease = 0.15;
      const ringEase = 0.08;

      cursorX += (mouseX - cursorX) * ease;
      cursorY += (mouseY - cursorY) * ease;
      ringX += (mouseX - ringX) * ringEase;
      ringY += (mouseY - ringY) * ringEase;

      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';
      cursorRing.style.left = ringX + 'px';
      cursorRing.style.top = ringY + 'px';

      requestAnimationFrame(updateCursor);
    }

    if (!prefersReduced) {
      updateCursor();
    }

    // Hover effect on interactive elements
    const hoverTargets = document.querySelectorAll('a, button, .project-card, .service-item, .submit-btn');
    hoverTargets.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('hovering');
        cursorRing.classList.add('hovering');
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('hovering');
        cursorRing.classList.remove('hovering');
      });
    });

    // Hide cursor on touch devices
    if ('ontouchstart' in window) {
      cursor.style.display = 'none';
      cursorRing.style.display = 'none';
      document.body.style.cursor = 'auto';
      document.querySelectorAll('button, a').forEach(el => el.style.cursor = 'pointer');
    }



    /* ────────────────────────────
       TELHA-STYLE MASTER PRELOADER + HERO TIMELINE
    ──────────────────────────── */
    function runLoader() {
      const words = gsap.utils.toArray('#wordmark .w');
      const pctEl = document.getElementById('pct');

      // Lock scroll during load
      document.body.style.overflow = 'hidden';

      const master = gsap.timeline({ delay: 0.15, onComplete: () => {
        document.body.style.overflow = '';
        initPage();
      }});

      // 1. Words slide up from below
      master.fromTo(words,
        { yPercent: 110 },
        { yPercent: 0, duration: 0.85, ease: 'power4.out', stagger: 0.11 }
      );

      // 2. Counter 0 → 100
      master.to({ v: 0 }, {
        v: 100, duration: 1.1, ease: 'power1.inOut',
        onUpdate() { if (pctEl) pctEl.textContent = Math.round(this.targets()[0].v) + '%'; }
      }, '-=0.2');

      // 3. Short hold
      master.to({}, { duration: 0.2 });

      // 4. Preloader wipes up, curtain follows
      master.to('#preloader', { yPercent: -100, duration: 0.9, ease: 'power4.inOut' });
      master.to('#curtain',   { yPercent: -100, duration: 1.0, ease: 'power4.inOut' }, '-=0.75');

      // 5. Show nav
      master.call(() => {
        const nav = document.getElementById('nav');
        if (nav) {
          nav.style.opacity = '1';
          nav.style.pointerEvents = 'auto';
        }
      }, null, '-=0.15');

      // 6. Hero canvas fades in (no clip-path — frames are loaded separately)
      master.to('#hero-bg',
        { opacity: 1, duration: 0.8, ease: 'power2.out' },
        '-=0.4'
      );

      // 7. Hero body (headline + scroll cue) fades up
      master.to('#hero-body', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.5');
    }

    /* ────────────────────────────
       LENIS SMOOTH SCROLL
    ──────────────────────────── */
    let lenis;

    function initLenis() {
      if (prefersReduced) return;

      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
      });

      // Expose globally so the hero frame animation script can detect it
      window.__lenis = lenis;

      lenis.on('scroll', ScrollTrigger.update);

      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }

    /* ────────────────────────────
       NAV SMOOTH SCROLL
    ──────────────────────────── */
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Close mobile menu on click
        const nav = document.getElementById('nav');
        const hamburger = document.getElementById('nav-toggle');
        if (nav.classList.contains('nav-open')) {
          nav.classList.remove('nav-open');
          hamburger.classList.remove('active');
        }

        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          if (lenis) {
            lenis.scrollTo(target, { offset: 0, duration: 1.5 });
          } else {
            gsap.to(window, { scrollTo: target, duration: 1.2, ease: 'power3.inOut' });
          }
        }
      });
    });

    const hamburger = document.getElementById('nav-toggle');
    if (hamburger) {
      hamburger.addEventListener('click', () => {
        const nav = document.getElementById('nav');
        nav.classList.toggle('nav-open');
        hamburger.classList.toggle('active');
      });
    }

    /* ────────────────────────────
       ACTIVE NAV TRACKING
    ──────────────────────────── */
    function setupNavTracking() {
      const sections = document.querySelectorAll('section');
      const navLinks = document.querySelectorAll('.nav-link');

      sections.forEach(section => {
        ScrollTrigger.create({
          trigger: section,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => setActiveNav(section.id),
          onEnterBack: () => setActiveNav(section.id),
        });
      });

      function setActiveNav(id) {
        navLinks.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav-link[data-section="${id}"]`);
        if (active) active.classList.add('active');
      }
    }

    /* ────────────────────────────
       BLUEPRINT GRID
    ──────────────────────────── */
    // Blueprint SVG removed from hero (now using video bg)
    let bpLines = [];



    /* ────────────────────────────
       INIT PAGE ANIMATIONS
    ──────────────────────────── */
    function initPage() {
      initLenis();



      // ─── Horizontal Rules ───
      gsap.utils.toArray('.h-rule').forEach(rule => {
        gsap.to(rule, {
          scaleX: 1,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: rule,
            start: 'top 90%',
            toggleActions: 'play none none none'
          }
        });
      });

      // ─── Generic Reveal Up ───
      gsap.utils.toArray('.reveal-up').forEach(elem => {
        gsap.fromTo(elem, 
          { opacity: 0, y: 30 },
          {
            opacity: 1, 
            y: 0, 
            duration: 1, 
            ease: 'power3.out',
            scrollTrigger: {
              trigger: elem,
              start: 'top 85%',
              toggleActions: 'play none none none'
            }
          }
        );
      });

      // ─── About Gallery Parallax ───
      const aboutCols = document.querySelectorAll('.about-img-col');
      aboutCols.forEach((col, i) => {
        // Subtle vertical shift on scroll for staggered effect
        const yOffset = [50, -50, 40, -40][i % 4];
        gsap.to(col, {
          y: () => `+=${yOffset}`,
          ease: 'none',
          scrollTrigger: {
            trigger: '.about-gallery',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1
          }
        });

        // Image internal parallax
        const img = col.querySelector('img');
        if (img) {
          gsap.fromTo(img, 
            { yPercent: -15, scale: 1.2 }, 
            {
              yPercent: 15,
              ease: 'none',
              scrollTrigger: {
                trigger: '.about-gallery',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1
              }
            }
          );
        }
      });

      // ─── About: Pinned Word-by-Word Reveal ───
      const statEl = document.getElementById('aboutText');
      const aboutWords = statEl.textContent.trim().split(/\s+/);
      
      // Wrap words in a mask for elegant translation reveal
      statEl.innerHTML = aboutWords.map(w => `<span class="word-mask"><span class="word">${w}</span></span> `).join('');
      const wordSpans = statEl.querySelectorAll('.word');

      // Create a scrubbed animation that staggers the reveal
      gsap.fromTo(wordSpans, 
        { 
          opacity: 0, 
          yPercent: 100,
          rotationX: -20,
          filter: 'blur(10px)'
        },
        {
          opacity: 1,
          yPercent: 0,
          rotationX: 0,
          filter: 'blur(0px)',
          stagger: 0.05,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.about-pin',
            start: 'top 85%',
            end: 'bottom 40%',
            scrub: 1
          }
        }
      );

      // ─── Stats Counter ───
      gsap.utils.toArray('.stat-number').forEach(stat => {
        const target = parseInt(stat.dataset.count);
        ScrollTrigger.create({
          trigger: stat,
          start: 'top 90%',
          once: true,
          onEnter: () => {
            gsap.to(stat, {
              innerText: target,
              duration: 1.6,
              ease: 'power2.out',
              snap: { innerText: 1 },
              onUpdate: function () { stat.innerText = Math.floor(stat.innerText); }
            });
          }
        });
      });


      // ─── Projects: Horizontal Scroll ───
      const galleryTrack = document.getElementById('gallery-track');
      const cards = galleryTrack.querySelectorAll('.project-card');
      const galleryWidth = galleryTrack.scrollWidth - window.innerWidth + 48;

      gsap.to(galleryTrack, {
        x: -galleryWidth,
        ease: 'none',
        scrollTrigger: {
          trigger: '.projects',
          start: 'top top',
          end: () => `+=${galleryWidth}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });

      // Project card reveal on scroll
      cards.forEach((card, i) => {
        const img = card.querySelector('.project-card-image');
        const innerImg = card.querySelector('.project-card-image img');

        gsap.from(innerImg, {
          scale: 1.3,
          scrollTrigger: {
            trigger: card,
            start: 'left 80%',
            end: 'left 20%',
            scrub: 1,
          }
        });
      });

      // ─── Services Section Animations ───
      gsap.from('.services-list .service-item', {
        opacity: 0,
        x: -30,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.services',
          start: 'top 60%',
          toggleActions: 'play none none none'
        }
      });

      gsap.from('.service-image-wrap', {
        opacity: 0,
        scale: 0.95,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.services',
          start: 'top 50%',
          toggleActions: 'play none none none'
        }
      });

      // ─── Contact: Title Reveal ───
      gsap.from('.contact-statement .line-inner', {
        y: '100%',
        duration: 1,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.contact-statement',
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      });

      gsap.from('.contact-form .form-group', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.contact-form',
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      });

      gsap.from('.contact-info > *', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.contact-info',
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      });

      // ─── Nav Tracking ───
      setupNavTracking();

      // Refresh after all triggers created so pin spacing is correctly calculated
      ScrollTrigger.refresh();
    }

    /* ────────────────────────────
       SERVICES ACCORDION
    ──────────────────────────── */
    const serviceItems = document.querySelectorAll('.service-item');
    const serviceImages = document.querySelectorAll('.service-image-wrap img');

    serviceItems.forEach(item => {
      const header = item.querySelector('.service-header');
      header.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all
        serviceItems.forEach(si => {
          si.classList.remove('active');
          si.querySelector('.service-body').style.maxHeight = '0';
        });

        // Open clicked if wasn't active
        if (!isActive) {
          item.classList.add('active');
          const body = item.querySelector('.service-body');
          body.style.maxHeight = body.scrollHeight + 'px';
        }

        // Swap image
        const imgIndex = item.dataset.image;
        serviceImages.forEach(img => img.classList.remove('active'));
        if (!isActive) {
          serviceImages[imgIndex].classList.add('active');
        }
      });

      // Hover image swap
      item.addEventListener('mouseenter', () => {
        const imgIndex = item.dataset.image;
        serviceImages.forEach(img => img.classList.remove('active'));
        serviceImages[imgIndex].classList.add('active');
      });
    });

    /* ────────────────────────────
       FORM HANDLING
    ──────────────────────────── */
    document.getElementById('contact-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = document.getElementById('submit-btn');
      btn.textContent = 'Sent ✓';
      btn.style.background = 'var(--moss)';
      btn.style.borderColor = 'var(--moss)';
      setTimeout(() => {
        btn.textContent = 'Send Inquiry';
        btn.style.background = '';
        btn.style.borderColor = '';
        e.target.reset();
      }, 2500);
    });

    /* ────────────────────────────
       START
    ──────────────────────────── */
    function hideLoaderHard() {
      ['preloader', 'curtain'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.style.transition = 'opacity .5s ease'; el.style.opacity = '0'; setTimeout(() => el.style.display = 'none', 500); }
      });
      document.body.style.overflow = '';
    }

    window.unlockMainLoader = function() {
      if (prefersReduced) {
        hideLoaderHard();
        initPage();
      } else {
        runLoader();
      }
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    };

    // Remove the old load listener that triggered it immediately
    // window.addEventListener('load', () => { ... });

    // Safety net: preloader gone within 5s no matter what
    setTimeout(hideLoaderHard, 5000);


