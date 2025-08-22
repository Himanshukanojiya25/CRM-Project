document.addEventListener('DOMContentLoaded', function() {
  const signUpButton = document.getElementById('signUp');
  const signInButton = document.getElementById('signIn');
  const container = document.getElementById('container');

  // Sign Up button functionality
  if (signUpButton) {
    signUpButton.addEventListener('click', () => {
      container.classList.add('right-panel-active');
    });
  }

  // Sign In button functionality
  if (signInButton) {
    signInButton.addEventListener('click', () => {
      container.classList.remove('right-panel-active');
    });
  }
});

// Social buttons pe click - animation + redirect
document.querySelectorAll('.social[href^="/auth"]').forEach(button => {
  button.addEventListener('click', function(e) {
    e.preventDefault();
    
    // Animation effect
    this.style.transform = 'scale(0.9)';
    setTimeout(() => {
      this.style.transform = 'scale(1)';
    }, 150);
    
    // Redirect after animation
    setTimeout(() => {
      window.location.href = this.getAttribute('href');
    }, 300);
  });
});

// Original animation code (Sign Up/Sign In buttons)
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

if (signUpButton) {
  signUpButton.addEventListener('click', () => {
    container.classList.add('right-panel-active');
  });
}

if (signInButton) {
  signInButton.addEventListener('click', () => {
    container.classList.remove('right-panel-active');
  });
}

// Switch functions
function switchToSignUp() {
  document.getElementById('container').classList.add('right-panel-active');
}

function switchToSignIn() {
  document.getElementById('container').classList.remove('right-panel-active');
}