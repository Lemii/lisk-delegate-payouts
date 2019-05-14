import React from 'react';

const scrollFunction = () => {
  if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
    document.getElementById('back-to-top-button').style.opacity = '1';
  } else {
    document.getElementById('back-to-top-button').style.opacity = '0';
  }
};

const topFunction = () => {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // F
};

window.onscroll = () => {
  scrollFunction();
};

const BackToTop = () => (
  <span
    role="button"
    to="top"
    id="back-to-top-button"
    className="text-dark floating-button bg-light shadow"
    duration={1000}
    onClick={topFunction}
    onKeyPress={topFunction}
    tabIndex={0}
  >
    <i className="fas fa-angle-up" />
  </span>
);

export default BackToTop;
