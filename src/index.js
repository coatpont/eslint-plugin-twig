"use strict";

var _require = require('../package.json');

// Depending on the version of ESLint, the processor name will vary
const eslintPackageJson = require("eslint/package.json");
const eslintVersion = eslintPackageJson.version;
function parseVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

const { major } = parseVersion(eslintVersion);
let processorName = 'twig';
if (major <= 8) {
  processorName = '.twig';
}

var name = _require.name;
var version = _require.version;

var fileContentMap = new Map();
var uniqueCounter = 0; // Counter to help generate unique IDs

module.exports = {
  meta: {
    name: name,
    version: version
  },
  processors: {
    [processorName]: {
      preprocess: function preprocess(text, filename) {
        // Handling specific import expressions using {{ }}
        var sanitizedText = text.replace(/import\s+({\s*[\w\s,]+\s*}|\w+)\s+from\s+{{\s*(.*?)\s*}}/g, function (match, variables, originalContent) {
          var originalContentLength = originalContent.length + 4; // Include the length of '{{' and '}}' (2 characters each) and 2 for the quotes
          var padding = "0".repeat(originalContentLength);

          return "import " + variables + " from '" + padding + "'"; // Zeros are within the single quotes
        });

        // Escaping {{ include( ... ) }}
        sanitizedText = sanitizedText.replace(/\{\{\s*(include|parent).*?\}\}/g, function (match) {
          return "/* " + match.slice(2, -2).trim() + " */"; // Extracts the content within '{{' and '}}', trims it, and wraps it in block comments
        });

        // Handling {{ '{{' }} and {{ '}}' }} exact matchs, rare case but possible in Twig
        sanitizedText = sanitizedText.replace(/\{\{\s*'{{'\s*\}\}|\{\{\s*'}}'\s*\}\}/g, function (str) {
          var replacementLength = str.length - 2; // Adjusting for the length of '{{' and '}}'
          uniqueCounter++; // Incrementing the counter for uniqueness
          var uniqueID = uniqueCounter.toString().padStart(replacementLength, "0");
          return "/" + uniqueID + "/"; // Using slashes to encapsulate the unique ID
        });

        // Handling {% if ... %} ... {% endif %} expressions on single lines, replacing with unique ID placeholders
        sanitizedText = sanitizedText.replace(/\{%\s*if .*?%\}.*?\{%\s*endif\s*%\}/g, function (str) {
          var replacementLength = str.length; // Keep the full length of the matched string
          uniqueCounter++; // Incrementing the counter for uniqueness
          var uniqueID = uniqueCounter.toString().padStart(replacementLength - 2, "0");
          return "/" + uniqueID + "/"; // Using slashes to encapsulate the unique ID, mimicking the style used for {{ variable }}
        });

        // Handling {% for ... %} ... {% endfor %} expressions on single lines, replacing with unique ID placeholders
        sanitizedText = sanitizedText.replace(/\{%\s*for .*?%\}.*?\{%\s*endfor\s*%\}/g, function (str) {
          var replacementLength = str.length; // Keep the full length of the matched string
          uniqueCounter++; // Incrementing the counter for uniqueness
          var uniqueID = uniqueCounter.toString().padStart(replacementLength - 2, "0");
          return "/" + uniqueID + "/"; // Using slashes to encapsulate the unique ID, mimicking the style used for other Twig blocks
        });

        // Handling {{ variable }} expressions, ignoring escaped '{{' and '}}'
        sanitizedText = sanitizedText.replace(/\{\{(.*?)\}\}/g, function (str) {
          var replacementLength = str.length - 2; // Adjusting for the length of '{{' and '}}'
          uniqueCounter++; // Incrementing the counter for uniqueness
          var uniqueID = uniqueCounter.toString().padStart(replacementLength, "0");
          return "/" + uniqueID + "/"; // Using slashes to encapsulate the unique ID
        });

        // Handling {% %} expressions on single lines, replacing with comment-style placeholders
        sanitizedText = sanitizedText.replace(/\{%([^\r\n]*?)%\}/g, function (str) {
          var replacementLength = str.length - 2; // Adjusting for the length of '{%' and '%}'
          uniqueCounter++;
          var uniqueID = uniqueCounter.toString().padStart(replacementLength - 2, "0");
          return "//" + uniqueID + "//"; // Comment-style placeholder
        });

        // Handling {# #} comment blocks on single lines
        sanitizedText = sanitizedText.replace(/\{#([^\r\n]*?)#\}/g, function (str) {
          var replacementLength = str.length - 2; // Adjusting for the length of '{#' and '#}'
          uniqueCounter++;
          var uniqueID = uniqueCounter.toString().padStart(replacementLength - 2, "0");
          return "/*" + uniqueID + "*/"; // Using block comment style for placeholder
        });

        // Handling unmatched start tags
        sanitizedText = sanitizedText.replace(/^\{\{|\{%|\{#(?![\s\S]*?\}\}|%}|#})/gm, "/*");

        // Handling unmatched end tags
        sanitizedText = sanitizedText.replace(/^\}\}|%}|#}(?<!\{\{|\{%|\{#[\s\S]*?)/gm, "*/");

        // Store original and sanitized content in map
        fileContentMap.set(filename, {
          original: text,
          sanitized: sanitizedText
        });

        // Are we debugging?
        if (text.includes("// eslint-plugin-twig debug")) {
          console.log(filename + "\n" + sanitizedText);
        }

        return [sanitizedText];
      },

      postprocess: function postprocess(messages, filename) {
        var flattenedMessages = messages.flat();

        var _fileContentMap$get = fileContentMap.get(filename);

        var original = _fileContentMap$get.original;
        var sanitized = _fileContentMap$get.sanitized;

        flattenedMessages.forEach(function (message) {
          if (message.fix) {
            (function () {
              var fixText = message.fix.text;
              // Regex to find all unique IDs in fix text for all patterns
              var uniqueIDs = fixText.match(/(\/\d+\/)|(\/\/\d+\/\/)|(\/\*\d+\*\/)/g);

              if (uniqueIDs) {
                uniqueIDs.forEach(function (uniqueIDTag) {
                  var sanitizedRegex = new RegExp("\\" + uniqueIDTag, "g"); // Use the full tag for regex

                  var match = undefined;
                  while ((match = sanitizedRegex.exec(sanitized)) !== null) {
                    var startIndex = match.index;
                    var endIndex = match.index + match[0].length;
                    var originalContent = original.substring(startIndex, endIndex); // Extract original content from the same position

                    // Replace the unique ID in the fix text with the extracted original content
                    fixText = fixText.replace(new RegExp("\\" + uniqueIDTag, "g"), originalContent);
                  }
                });
                message.fix.text = fixText; // Update fix text with all replacements done
              }
            })();
          }
        });

        return flattenedMessages;
      },

      supportsAutofix: true
    }
  }
};