// Current active page
let currentPage = 'home';

let mobileMenu = null;
let burgerButton = null;
let closeButton = null;

function getPageFromLocation() {
  const bodyPage = document.body?.dataset.page;
  if (bodyPage) return bodyPage;

  const pathname = window.location.pathname;
  if (pathname.endsWith('page-2.html')) return 'favorites';
  return 'home';
}

function setActiveLinks(page) {
  const navLinks = document.querySelectorAll('.header__nav-link');
  navLinks.forEach(link => {
    const linkPage = link.getAttribute('data-page');
    if (linkPage === page) {
      link.classList.add('header__nav-link--active');
    } else {
      link.classList.remove('header__nav-link--active');
    }
  });

  const mobileNavLinks = document.querySelectorAll('.mobile-menu__nav-link');
  mobileNavLinks.forEach(link => {
    const linkPage = link.getAttribute('data-page');
    if (linkPage === page) {
      link.classList.add('mobile-menu__nav-link--active');
    } else {
      link.classList.remove('mobile-menu__nav-link--active');
    }
  });
}

function openMobileMenu() {
  if (mobileMenu) {
    mobileMenu.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    mobileMenu.setAttribute('aria-hidden', 'false');
  }
  if (burgerButton) {
    burgerButton.setAttribute('aria-expanded', 'true');
  }
}

function closeMobileMenu() {
  if (mobileMenu) {
    mobileMenu.classList.remove('is-open');
    document.body.style.overflow = '';
    mobileMenu.setAttribute('aria-hidden', 'true');
  }
  if (burgerButton) {
    burgerButton.setAttribute('aria-expanded', 'false');
  }
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
    burgerButton.addEventListener('click', openMobileMenu);
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
