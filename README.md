
# eslint-plugin-twig
This plugin treats Twig template expressions and statements as valid Javascript expressions, so that ESLint can check javascript code, ignoring any Jinja expression found.

## Obvious statement
It is highly recommended to avoid using plain JavaScript in Twig templates, and rely on standard WebPack mechanics to process and to optimized JavaScript code. However, in some legacy Symfony applications, JavaScript is present "en masse" in Twig templates, being html templates or templates generating JavaScript. This plug aims at processing this code 

## Work in progress
This plugin is still being developed and tested

## Usage

Simply install this plugin along with the esling-plugin-html one via `npm install --save-dev eslint-plugin-html eslint-plugin-twig` and add the plugin to your ESLint
configuration. See
[ESLint documentation](http://eslint.org/docs/user-guide/configuring#configuring-plugins).

<details open>
  <summary>Example with ESLint 9 and above</summary>

```javascript
import html from "eslint-plugin-html"

export default [
  {
    files: ["**/*.html"],
    plugins: { html, twig },
    processor: "twig/ twig",
},
]
```

</details>

<details open>
  <summary>Example with ESLint 8 and below</summary>

```json
{
  "plugins": ["html", "twig"]
}
```

</details>

## Disabling ESLint

To temporarily disable ESLint, use the `<!-- eslint-disable -->` HTML comment. Re-enable it with
`<!-- eslint enable -->`. Example:

```html
<!-- eslint-disable -->
<script>
  var foo = 1
</script>
<!-- eslint-enable -->
```

To disable ESLint for the next script tag only, use the `<!-- eslint-disable-next-script -->` HTML
comment. Example:

```html
<!-- eslint-disable-next-script -->
<script>
  var foo = 1
</script>
```

Disabled script tags are completely ignored: their content will not be parsed as JavaScript. You can
use this to disable script tags containing template syntax.

## Troubleshooting

By placing the following statement in your .twig file, the preprocessed output will be sent to the console when linting. This can be convenient to catch specific problems.
```html
<script>
    // eslint-plugin-twig debug
</script>
```

## Known issues

### Prettier fixes won't be applied

If you are processing Twig templates as HTML files, then your Javascript segments shouldn't follow the Twig indentation but start from the left as if it was a regular .js file.

```html
<script>
// Do this
</script>
    <script>
    // Not this
    </script>
```

### Unreachable code
```html
<script>
{% if someCondition %}
  return something;
{% else %}
  return somethingElse; // This line will trigger the unreachable rule - use eslint-disable-link
{% endif %}
</script>
```
