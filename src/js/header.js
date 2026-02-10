const PAGE = {
  HOME: 'home',
  FAVORITES: 'favorites',
};
const FAVORITES_PATH = 'favorites.html';
const SCROLL_LOCK_KEY = 'scrollLockCount';

let currentPage = PAGE.HOME;

let mobileMenu = null;
let burgerButton = null;
let closeButton = null;
let isMenuOpen = false;

function getPageFromLocation() {
  const bodyPage = document.body?.dataset.page;
  if (bodyPage) return bodyPage;

  const pathname = window.location.pathname;
  if (pathname.endsWith(FAVORITES_PATH)) return PAGE.FAVORITES;
  return PAGE.HOME;
}

function setActiveLinks(page) {
  const navLinks = document.querySelectorAll('.header__nav-link');
  navLinks.forEach(link => {
    const linkPage = link.getAttribute('data-page');
    if (linkPage === page) {
      link.classList.add('header__nav-link--active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('header__nav-link--active');
      link.removeAttribute('aria-current');
    }
  });

  const mobileNavLinks = document.querySelectorAll('.mobile-menu__nav-link');
  mobileNavLinks.forEach(link => {
    const linkPage = link.getAttribute('data-page');
    if (linkPage === page) {
      link.classList.add('mobile-menu__nav-link--active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('mobile-menu__nav-link--active');
      link.removeAttribute('aria-current');
    }
  });
}

function openMobileMenu() {
  if (isMenuOpen) return;
  isMenuOpen = true;

  if (mobileMenu) {
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
  }
  if (burgerButton) {
    burgerButton.setAttribute('aria-expanded', 'true');
  }
  lockBodyScroll();
  document.addEventListener('keydown', handleMenuKeydown);
}

function closeMobileMenu() {
  if (!isMenuOpen) return;
  isMenuOpen = false;

  if (mobileMenu) {
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
  }
  if (burgerButton) {
    burgerButton.setAttribute('aria-expanded', 'false');
  }
  unlockBodyScroll();
  document.removeEventListener('keydown', handleMenuKeydown);
}

function toggleMobileMenu() {
  if (isMenuOpen) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
}

function handleMenuKeydown(event) {
  if (event.key === 'Escape') {
    closeMobileMenu();
  }
}

function lockBodyScroll() {
  const body = document.body;
  if (!body) return;

  const count = Number(body.dataset[SCROLL_LOCK_KEY] || 0) + 1;
  body.dataset[SCROLL_LOCK_KEY] = String(count);
  if (count === 1) {
    body.style.overflow = 'hidden';
  }
}

function unlockBodyScroll() {
  const body = document.body;
  if (!body) return;

  const count = Number(body.dataset[SCROLL_LOCK_KEY] || 0) - 1;
  if (count <= 0) {
    delete body.dataset[SCROLL_LOCK_KEY];
    body.style.overflow = '';
    return;
  }
  body.dataset[SCROLL_LOCK_KEY] = String(count);
}

export function initHeader() {
  currentPage = getPageFromLocation();
  setActiveLinks(currentPage);

  mobileMenu = document.querySelector('.mobile-menu');
  burgerButton = document.querySelector('.header__burger');
  closeButton = document.querySelector('.mobile-menu__close');

  if (mobileMenu) {
    mobileMenu.setAttribute('aria-hidden', 'true');
  }

  if (burgerButton) {
    if (mobileMenu?.id) {
      burgerButton.setAttribute('aria-controls', mobileMenu.id);
    }
    burgerButton.addEventListener('click', toggleMobileMenu);
    burgerButton.setAttribute('aria-expanded', 'false');
  }

  if (closeButton) {
    closeButton.addEventListener('click', closeMobileMenu);
  }

  const mobileNavLinks = document.querySelectorAll('.mobile-menu__nav-link');
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMobileMenu();
    });
  });

  if (mobileMenu) {
    mobileMenu.addEventListener('click', e => {
      if (e.target === mobileMenu) {
        closeMobileMenu();
      }
    });
  }
}

export function getCurrentPage() {
  return currentPage;
}
