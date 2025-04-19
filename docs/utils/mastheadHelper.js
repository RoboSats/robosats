 const languages = ['en', 'es', 'fr', 'pt'];

function matchPageWithSelection(language, currentUrl){
  // checks if parameter is 'en', if so, removes it from the url
  newLanguage = language === 'en' ? '' : `${language}`;
  // regex to match the current url and extract the language and the rest of the url
  let regex = /(?:(?:(\/(?:docs|contribute|stats)\/))(?:(es|fr|pt)\/)?(.*))|(\/(?:es|fr|pt)\/|\/)$/
  let [fullURL, first, urlLang = 'en', rest, home]  = regex.exec(currentUrl);

  if (home) {
    // if the home page is in the selected language, do nothing
    if ((home === '/' && language === 'en') || home.includes(language)) return;
    // if the home page is not in the selected language, redirect to the home page in the selected language
    window.location.href = `/${newLanguage}`;
    return;
  }
  // if the current page is already in the language passed as parameter, do nothing
  urlLang === language ?
    null :
    window.location.href = `${first}${newLanguage}/${rest.replace(/\/$/, '')}`;

}

 function getNavigationFile(localStorage) {
    return localStorage !== 'en' ? `/header-menu-jsons/navigation_${localStorage}.json` : '/header-menu-jsons/navigation.json';
  }

  function loadDropDownMenu (languageStored) {
    const languageDropdown = document.getElementById('language');

    languageDropdown.innerHTML = languages.map((language) => {
      const option = document.createElement('option');
      option.value = language;
      option.text = language.toUpperCase();
      return option.outerHTML;
    }).join('');
    languageDropdown.value = languageStored;
    languageDropdown.style.border = '1px solid black';
    languageDropdown.style.borderRadius = '5px';

    return languageDropdown
  }

  function generateNavigationMenu (navigationFile) {
    const navigationDOMelement = document.getElementById('navigation');

    fetch(navigationFile)
      .then(response => response.json())
      .then(data => {
        let html = '';
        data.main.forEach(function(link) {
          html += '<li class="masthead__menu-item">';
          html += '<a href="' + link.url + '"';
          if (link.description) {
            html += ' title="' + link.description + '"';
          }
          html += '>' + link.title + '</a>';
          html += '</li>';
        });

        // add the generated navigation menu to the DOM
        navigationDOMelement.innerHTML += html;

      });

  }
