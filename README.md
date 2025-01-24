
# eslint-plugin-twig
This plugin treats Twig template expressions and statements as valid Javascript expressions, so that ESLint can check javascript code, ignoring any Jinja expression found.

## Obvious statement
It is highly recommended to avoid using plain JavaScript in Twig templates, and rely on standard WebPack mechanics to process and to optimized JavaScript code. However, in some legacy Symfony applications, JavaScript is present "en masse" in Twig templates, being html templates or templates generating JavaScript. This plug aims at processing this code 

## Work in progress
This progress is still being developed and tested

## Usage

Simply install via `npm install --save-dev eslint-plugin-twig` and add the plugin to your ESLint
configuration. See
[ESLint documentation](http://eslint.org/docs/user-guide/configuring#configuring-plugins).

You can combine this plugin with the eslint-plugin-html plugin to process *.html.twig files.