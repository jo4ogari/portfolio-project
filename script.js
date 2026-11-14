const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const loader = document.querySelector('.loader');

let lenis = null;


/* ==================================================
   BÁSICOS (funcionam mesmo sem GSAP)
================================================== */

document.getElementById('year').textContent = `© ${new Date().getFullYear()}`;

const clock = document.querySelector('.clock-time');
const clockFormat = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
});

function updateClock() {
    clock.textContent = clockFormat.format(new Date());
}

updateClock();
setInterval(updateClock, 15000);


/* MENU MOBILE */

function setMenu(open) {
    mobileMenu.classList.toggle('open', open);
    menuButton.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', open);
    menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    mobileMenu.setAttribute('aria-hidden', !open);
    header.classList.toggle('menu-open', open);

    // o header pode estar escondido pelo scroll; o botão de fechar precisa aparecer
    if (open && window.gsap) gsap.to(header, { yPercent: 0, duration: 0.4, overwrite: true });

    if (lenis) open ? lenis.stop() : lenis.start();
    else document.body.style.overflow = open ? 'hidden' : '';
}

menuButton.addEventListener('click', () => {
    setMenu(!mobileMenu.classList.contains('open'));
});

mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setMenu(false));
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobileMenu.classList.contains('open')) {
        setMenu(false);
        menuButton.focus();
    }
});


/* HEADER COM FUNDO AO ROLAR */

window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 24);
}, { passive: true });


/* Sem GSAP (CDN fora do ar) ou com movimento reduzido: página estática */

if (!window.gsap || !window.ScrollTrigger || reduceMotion) {
    loader?.remove();
} else {
    initMotion();
}


/* ==================================================
   UTILITÁRIOS DE TEXTO
================================================== */

// Divide em letras, preservando elementos filhos como <em>
function splitChars(el, className) {
    const chars = [];

    [...el.childNodes].forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            const fragment = document.createDocumentFragment();

            [...node.textContent].forEach(letter => {
                if (!letter.trim()) {
                    fragment.append(letter);
                    return;
                }

                const span = document.createElement('span');
                span.className = className;
                span.textContent = letter;
                fragment.append(span);
                chars.push(span);
            });

            node.replaceWith(fragment);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            node.classList.add(className);
            chars.push(node);
        }
    });

    return chars;
}

// Divide em palavras com máscara (para reveals de títulos)
function splitWords(el) {
    const inners = [];

    const wrap = text => {
        const fragment = document.createDocumentFragment();

        text.split(/(\s+)/).forEach(part => {
            if (!part) return;

            if (!part.trim()) {
                fragment.append(' ');
                return;
            }

            const word = document.createElement('span');
            const inner = document.createElement('span');
            word.className = 'split-word';
            inner.className = 'split-inner';
            inner.textContent = part;
            word.append(inner);
            fragment.append(word);
            inners.push(inner);
        });

        return fragment;
    };

    [...el.childNodes].forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            node.replaceWith(wrap(node.textContent));
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const text = node.textContent;
            node.textContent = '';
            node.append(wrap(text));
        }
    });

    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.trim());

    return inners;
}


/* ==================================================
   MOVIMENTO
================================================== */

function initMotion() {

    gsap.registerPlugin(ScrollTrigger);

    // o loader sempre começa do topo
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    const ease = 'expo.out';


    /* SMOOTH SCROLL */

    if (window.Lenis) {
        lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(time => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
    }

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', event => {
            const id = link.getAttribute('href');
            const target = id === '#' ? null : document.querySelector(id);
            if (!target || !lenis) return;

            event.preventDefault();
            lenis.scrollTo(target, { offset: id === '#home' ? 0 : -40, duration: 1.4 });
        });
    });


    /* PROGRESSO + HEADER QUE SE ESCONDE */

    gsap.to('.scroll-progress span', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
    });

    ScrollTrigger.create({
        start: 120,
        end: 'max',
        onUpdate: self => {
            if (header.classList.contains('menu-open')) return;
            gsap.to(header, {
                yPercent: self.direction === 1 ? -110 : 0,
                duration: 0.5,
                ease: 'power3.out',
                overwrite: true
            });
        },
        onLeaveBack: () => gsap.to(header, { yPercent: 0, duration: 0.4, overwrite: true })
    });


    /* ==============================================
       HERO + LOADER
    ============================================== */

    const heroChars = [...document.querySelectorAll('[data-hero-line]')]
        .flatMap(line => splitChars(line, 'hero-char'));

    const heroPhoto = document.querySelector('.hero-photo');
    const chips = gsap.utils.toArray('.chip, .badge');
    const heroFades = gsap.utils.toArray('.hero [data-fade], .hero-top, .site-header');

    gsap.set(heroChars, { yPercent: 115, rotate: 6 });
    gsap.set(heroPhoto, { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set(heroPhoto.querySelector('img'), { scale: 1.25 });
    gsap.set(chips, { scale: 0, opacity: 0 });
    gsap.set(heroFades, { y: 24, opacity: 0 });

    if (lenis) lenis.stop();

    const counter = { value: 0 };
    const loaderNum = document.querySelector('.loader-num');

    const intro = gsap.timeline({
        onComplete: () => {
            loader.remove();
            if (lenis) lenis.start();
        }
    });

    intro
        .to(counter, {
            value: 100,
            duration: 1.6,
            ease: 'power2.inOut',
            onUpdate: () => { loaderNum.textContent = Math.round(counter.value); }
        })
        .to('.loader-bar span', { scaleX: 1, duration: 1.6, ease: 'power2.inOut' }, 0)
        .to('.loader-inner', { yPercent: -40, opacity: 0, duration: 0.5, ease: 'power2.in' })
        .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: 'expo.inOut' }, '-=0.1')
        .to(heroChars, { yPercent: 0, rotate: 0, duration: 1.3, stagger: 0.05, ease }, '-=0.55')
        .to(heroPhoto, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' }, '<')
        .to(heroPhoto.querySelector('img'), { scale: 1, duration: 1.8, ease }, '<')
        .to(heroFades, { y: 0, opacity: 1, duration: 1, stagger: 0.08, ease }, '-=1.1')
        .to(chips, { scale: 1, opacity: 1, duration: 0.9, stagger: 0.09, ease: 'back.out(2.2)' }, '-=0.9');


    /* parallax do hero ao rolar */

    const heroScroll = {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
    };

    gsap.to('.hero-line:not(.hero-line-2)', { xPercent: -12, ease: 'none', scrollTrigger: heroScroll });
    gsap.to('.hero-line-2', { xPercent: 10, ease: 'none', scrollTrigger: heroScroll });
    gsap.to('.hero-figure', { yPercent: 12, ease: 'none', scrollTrigger: heroScroll });
    gsap.to('.hero-bottom', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { ...heroScroll, end: '70% top' } });

    // cada chip "voa" numa velocidade diferente
    gsap.utils.toArray('.chip').forEach(chip => {
        const depth = parseFloat(chip.dataset.depth) || 1;
        gsap.to(chip, { y: -160 * depth, ease: 'none', scrollTrigger: heroScroll });
    });

    // selo girando, acelerado pelo scroll
    const badgeSpin = gsap.to('.badge text', {
        rotate: 360,
        svgOrigin: '100 100',
        duration: 14,
        ease: 'none',
        repeat: -1
    });


    /* chips seguem o mouse */

    if (finePointer) {
        const chipMovers = gsap.utils.toArray('.chip').map(chip => ({
            depth: parseFloat(chip.dataset.depth) || 1,
            x: gsap.quickTo(chip, 'x', { duration: 0.9, ease: 'power3' })
        }));

        const chipMoversY = gsap.utils.toArray('.chip').map(chip => ({
            depth: parseFloat(chip.dataset.depth) || 1,
            el: chip
        }));

        document.querySelector('.hero').addEventListener('pointermove', event => {
            const dx = event.clientX / window.innerWidth - 0.5;
            const dy = event.clientY / window.innerHeight - 0.5;

            chipMovers.forEach(({ depth, x }) => x(dx * 40 * depth));
            chipMoversY.forEach(({ depth, el }) => {
                gsap.to(el, { rotationX: dy * -20 * depth, rotationY: dx * 20 * depth, duration: 0.8, overwrite: 'auto' });
            });
        });
    }


    /* ==============================================
       MARQUEE COM VELOCIDADE DO SCROLL
    ============================================== */

    let scrollVelocity = 0;

    ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: self => { scrollVelocity = self.getVelocity(); }
    });

    gsap.utils.toArray('.marquee-row').forEach(row => {
        const track = row.querySelector('.marquee-track');
        row.append(track.cloneNode(true), track.cloneNode(true));
        row.querySelectorAll('.marquee-track:not(:first-child)').forEach(clone => clone.setAttribute('aria-hidden', 'true'));

        const direction = Number(row.dataset.direction) || -1;
        const skew = gsap.quickTo(row, 'skewX', { duration: 0.4, ease: 'power3' });
        let x = 0;

        gsap.ticker.add((_, deltaTime) => {
            const width = track.offsetWidth;
            const boost = 1 + Math.min(Math.abs(scrollVelocity) / 300, 8);
            const scrollDirection = scrollVelocity < 0 ? -1 : 1;

            x += direction * scrollDirection * 0.06 * boost * deltaTime;
            x = gsap.utils.wrap(-width, 0, x);
            gsap.set(row, { x });
            skew(gsap.utils.clamp(-8, 8, scrollVelocity / -250) * direction);
        });
    });

    gsap.ticker.add(() => {
        scrollVelocity *= 0.9;
        badgeSpin.timeScale(1 + Math.min(Math.abs(scrollVelocity) / 200, 10));
    });


    /* ==============================================
       REVEALS GENÉRICOS
    ============================================== */

    document.querySelectorAll('[data-split]').forEach(title => {
        const words = splitWords(title);

        gsap.from(words, {
            yPercent: 110,
            duration: 1.2,
            stagger: 0.06,
            ease,
            scrollTrigger: { trigger: title, start: 'top 85%' }
        });
    });

    gsap.utils.toArray('[data-fade]').forEach(el => {
        if (el.closest('.hero')) return;

        gsap.from(el, {
            y: 40,
            opacity: 0,
            duration: 1.1,
            ease,
            scrollTrigger: { trigger: el, start: 'top 88%' }
        });
    });

    gsap.utils.toArray('[data-reveal-img]').forEach(frame => {
        const img = frame.querySelector('img');

        // revela de cima para baixo: o rosto aparece primeiro
        gsap.fromTo(frame,
            { clipPath: 'inset(0% 0% 100% 0%)' },
            {
                clipPath: 'inset(0% 0% 0% 0%)',
                duration: 1.4,
                ease: 'expo.inOut',
                scrollTrigger: { trigger: frame, start: 'top 80%' }
            }
        );

        // zoom ancorado no topo para nunca cortar o rosto
        gsap.fromTo(img,
            { scale: 1.18 },
            {
                scale: 1,
                transformOrigin: '50% 0%',
                ease: 'none',
                scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true }
            }
        );
    });


    /* ==============================================
       SOBRE: texto que acende palavra por palavra
    ============================================== */

    const statement = document.querySelector('[data-words]');
    const statementText = statement.textContent.trim().split(/\s+/);
    statement.setAttribute('aria-label', statementText.join(' '));
    statement.innerHTML = statementText.map(word => `<span class="word" aria-hidden="true">${word}</span>`).join(' ');

    gsap.fromTo(statement.querySelectorAll('.word'),
        { opacity: 0.12 },
        {
            opacity: 1,
            stagger: 0.1,
            ease: 'none',
            scrollTrigger: { trigger: statement, start: 'top 80%', end: 'bottom 45%', scrub: true }
        }
    );

    document.querySelectorAll('[data-count]').forEach(el => {
        const target = Number(el.dataset.count);
        const value = { n: 0 };

        gsap.to(value, {
            n: target,
            duration: 1.8,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 90%' },
            onUpdate: () => { el.textContent = Math.round(value.n); }
        });
    });

    gsap.from('.stat', {
        y: 60,
        opacity: 0,
        duration: 1,
        stagger: 0.12,
        ease,
        scrollTrigger: { trigger: '.stats', start: 'top 88%' }
    });


    /* ==============================================
       PROJETOS: rolagem horizontal fixada
    ============================================== */

    const mm = gsap.matchMedia();
    const track = document.querySelector('.projects-track');

    mm.add('(min-width: 901px)', () => {
        const distance = () => track.scrollWidth - window.innerWidth;

        const horizontal = gsap.to(track, {
            x: () => -distance(),
            ease: 'none',
            scrollTrigger: {
                trigger: '.projects-pin',
                start: 'top top',
                end: () => `+=${distance()}`,
                pin: true,
                scrub: 1,
                invalidateOnRefresh: true,
                anticipatePin: 1
            }
        });

        gsap.utils.toArray('.project').forEach(project => {
            const img = project.querySelector('.project-img img');
            const info = project.querySelector('.project-info');
            const media = project.querySelector('.project-media');

            if (img) {
                gsap.fromTo(img, { xPercent: -13 }, {
                    xPercent: 0,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: project,
                        containerAnimation: horizontal,
                        start: 'left right',
                        end: 'right left',
                        scrub: true
                    }
                });
            }

            if (media) {
                gsap.fromTo(media, { rotate: 3, scale: 0.88 }, {
                    rotate: 0,
                    scale: 1,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: project,
                        containerAnimation: horizontal,
                        start: 'left right',
                        end: 'left 35%',
                        scrub: true
                    }
                });
            }

            if (info) {
                gsap.from(info.children, {
                    y: 40,
                    opacity: 0,
                    duration: 0.9,
                    stagger: 0.06,
                    ease,
                    scrollTrigger: {
                        trigger: project,
                        containerAnimation: horizontal,
                        start: 'left 75%'
                    }
                });
            }
        });
    });

    mm.add('(max-width: 900px)', () => {
        gsap.utils.toArray('.project').forEach(project => {
            const media = project.querySelector('.project-media');

            if (media) {
                gsap.fromTo(media,
                    { clipPath: 'inset(12% 8% 12% 8% round 1.25rem)' },
                    {
                        clipPath: 'inset(0% 0% 0% 0% round 1.25rem)',
                        ease: 'none',
                        scrollTrigger: { trigger: media, start: 'top 95%', end: 'top 45%', scrub: true }
                    }
                );
            }

            gsap.from(project.querySelector('.project-info') || project, {
                y: 40,
                opacity: 0,
                duration: 1,
                ease,
                scrollTrigger: { trigger: project, start: 'top 75%' }
            });
        });
    });


    /* ==============================================
       STACK
    ============================================== */

    gsap.utils.toArray('.skill-row').forEach(row => {
        gsap.from(row.children, {
            y: 50,
            opacity: 0,
            duration: 1,
            stagger: 0.07,
            ease,
            scrollTrigger: { trigger: row, start: 'top 90%' }
        });
    });


    /* ==============================================
       TRAJETÓRIA: linha que se desenha
    ============================================== */

    gsap.fromTo('.timeline-line span', { scaleY: 0 }, {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 60%', scrub: true }
    });

    gsap.utils.toArray('.timeline-item').forEach(item => {
        const dot = item.querySelector('.timeline-dot');

        gsap.timeline({ scrollTrigger: { trigger: item, start: 'top 75%' } })
            .from(dot, { scale: 0, duration: 0.6, ease: 'back.out(3)' })
            .from([...item.children].filter(child => child !== dot), {
                x: 40,
                opacity: 0,
                duration: 1,
                stagger: 0.08,
                ease
            }, '<0.1');
    });


    /* ==============================================
       CONTATO
    ============================================== */

    document.querySelectorAll('[data-split-chars]').forEach(line => {
        line.setAttribute('aria-hidden', 'true');
        splitChars(line, 'contact-char');
    });

    document.querySelector('.contact-title').setAttribute('aria-label', 'Vamos conversar?');

    gsap.from('.contact-char', {
        yPercent: 110,
        rotate: 8,
        duration: 1.2,
        stagger: 0.035,
        ease,
        scrollTrigger: { trigger: '.contact-title', start: 'top 80%' }
    });

    gsap.fromTo('.contact-line:first-child', { xPercent: 6 }, {
        xPercent: -4,
        ease: 'none',
        scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom bottom', scrub: true }
    });

    gsap.from('.contact-orb', {
        scale: 0,
        rotate: -90,
        duration: 1.2,
        ease: 'back.out(1.6)',
        scrollTrigger: { trigger: '.contact-grid', start: 'top 85%' }
    });

    gsap.from('.contact-links li', {
        y: 30,
        opacity: 0,
        duration: 0.9,
        stagger: 0.1,
        ease,
        scrollTrigger: { trigger: '.contact-links', start: 'top 92%' }
    });


    /* ==============================================
       BOTÕES MAGNÉTICOS + CURSOR
    ============================================== */

    if (finePointer) {
        document.querySelectorAll('.magnetic').forEach(el => {
            const strength = el.classList.contains('contact-orb') ? 0.45 : 0.3;
            const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
            const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });

            el.addEventListener('pointermove', event => {
                const rect = el.getBoundingClientRect();
                x((event.clientX - rect.left - rect.width / 2) * strength);
                y((event.clientY - rect.top - rect.height / 2) * strength);
            });

            el.addEventListener('pointerleave', () => {
                gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.35)' });
            });
        });

        const cursor = document.querySelector('.cursor');
        const dot = cursor.querySelector('.cursor-dot');
        const ring = cursor.querySelector('.cursor-ring');
        const label = cursor.querySelector('.cursor-label');

        const dotX = gsap.quickTo(dot, 'x', { duration: 0.15, ease: 'power3' });
        const dotY = gsap.quickTo(dot, 'y', { duration: 0.15, ease: 'power3' });
        const ringX = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3' });
        const ringY = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3' });

        window.addEventListener('pointermove', event => {
            gsap.to([dot, ring], { opacity: 1, duration: 0.3, overwrite: 'auto' });
            dotX(event.clientX);
            dotY(event.clientY);
            ringX(event.clientX);
            ringY(event.clientY);
        });

        document.addEventListener('pointerleave', () => gsap.to([dot, ring], { opacity: 0, duration: 0.3 }));

        document.addEventListener('pointerover', event => {
            const labelled = event.target.closest('[data-cursor] .project-media');
            const interactive = event.target.closest('a, button');

            cursor.classList.toggle('is-label', Boolean(labelled));
            cursor.classList.toggle('is-hover', Boolean(interactive) && !labelled);

            if (labelled) label.textContent = labelled.closest('[data-cursor]').dataset.cursor;
        });
    }


    /* recalcula posições quando imagens e fontes terminam de carregar */
    window.addEventListener('load', () => ScrollTrigger.refresh());
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
