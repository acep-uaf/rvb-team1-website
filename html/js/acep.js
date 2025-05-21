// Dynamically include fragments
async function includeFragment(id, url) {
    const res = await fetch(url);
    const html = await res.text();
    document.getElementById(id).innerHTML = html;
    }
  
//   Load a markdown file into #page
async function loadMarkdown(page) {
    mdPath = `/md/${page}.md`;
    try {
      const response = await fetch(mdPath);
      if (!response.ok) throw new Error(`Failed to load ${mdPath}: ${response.status}`);
      const mdText = await response.text();
      document.getElementById('page').innerHTML = marked.parse(mdText);
      loadPageScript(`${page}`)
    } catch (err) {
      console.error(err);
      document.getElementById('page').innerHTML = `<pre>Error loading Markdown: ${err.message}</pre>`;
    }
  }

  // Dynamically load a JS file
async function loadPageScript(page) {
    jsPath = `/js/${page}.js`;
    try {
      const res = await fetch(jsPath, { method: 'HEAD' });
      if (!res.ok) return;
  
      const script = document.createElement('script');
      script.src = jsPath;
      script.defer = true;
      document.body.appendChild(script);
      console.log(`Loaded script: ${jsPath}`);
    } catch (err) {
      console.warn(`Script not found: ${jsPath}`);
    }
  }

  // Load Nav
function loadNav() {
    fetch('/api/nav')
      .then(res => res.json())
      .then(navItems => {
        const ul = document.createElement('ul');
        ul.className = 'nav nav-tabs';
  
        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = urlParams.get('page') || 'index';
  
         // Filter out disabled items
        const enabledItems = navItems.filter(item => item.enabled !== false); 

        enabledItems.forEach(item => {
          const li = document.createElement('li');
          li.className = 'nav-item';
  
          const a = document.createElement('a');
          a.className = 'nav-link';
          a.href = `index.html?page=${item.page}`;
          a.innerHTML = `<i class="${item.icon} me-2"></i>${item.title}`;
  
          // Apply 'active' class to the current tab
          if (currentPage === item.page) {
            a.classList.add('active');
            a.setAttribute('aria-current', 'page');
          }
  
          // Optional: Support for disabled nav items in nav.json
          if (item.disabled) {
            a.classList.add('disabled');
            a.setAttribute('aria-disabled', 'true');
          }
  
          li.appendChild(a);
          ul.appendChild(li);
        });
  
        const navContainer = document.getElementById('nav');
        if (navContainer) {
          navContainer.innerHTML = ''; // Clear previous content
          navContainer.appendChild(ul);
        }
      })
      .catch(err => {
        console.error("Failed to load nav:", err);
        document.getElementById('nav').innerHTML =
          '<p class="text-danger">Failed to load navigation menu.</p>';
      });
  }
  
  
  
// Load on page load
window.addEventListener('DOMContentLoaded', () => {
    includeFragment('banner', '/banner.html');
    includeFragment('footer', '/footer.html');
    loadNav();
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page') || 'index';
    loadMarkdown(`${page}`);
});
