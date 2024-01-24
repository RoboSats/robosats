const fs = require('fs');
const yaml = require('js-yaml');

const fileName = 'navigation_{your languageD}';

// Read YAML file
const yamlData = fs.readFileSync(`./docs/_data/${fileName}.yml`, 'utf8');

// Parse YAML to JavaScript object
const jsonData = yaml.load(yamlData);

// Convert JavaScript object to JSON
const jsonContent = JSON.stringify(jsonData, null, 2);

// Write JSON to file
fs.writeFileSync(`./docs/header-menu-jsons/${fileName}.json`, jsonContent, 'utf8');

console.log('Conversion completed successfully!');
