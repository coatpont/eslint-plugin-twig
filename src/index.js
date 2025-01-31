const fileContentMap = new Map();
let uniqueCounter = 0; // Counter to help generate unique IDs

module.exports = {
  meta: {
    name: "eslint-plugin-twig",
    version: "0.0.7",
  },
  processors: {
    ".twig": {
      preprocess(text, filename) {
        // Handling specific import expressions from {{ }}
        var sanitizedText = text.replace(
          /import\s+({\s*[\w\s,]+\s*}|\w+)\s+from\s+{{\s*(.*?)\s*}}/g,
          function (match, variables, originalContent) {
            const originalContentLength = originalContent.length + 4; // Include the length of '{{' and '}}' (2 characters each) and 2 for the quotes
            const padding = "0".repeat(originalContentLength);

            return `import ${variables} from '${padding}'`; // Zeros are within the single quotes
          },
        );

        // Escaping {{ include( ... ) }}
        sanitizedText = sanitizedText.replace(
          /\{\{\s*include.*?\}\}/g,
          function (match) {
            return "/* " + match.slice(2, -2).trim() + " */"; // Extracts the content within '{{' and '}}', trims it, and wraps it in block comments
          },
        );

        // Handling {{ variable }} expressions, ignoring escaped '{{' and '}}'
        sanitizedText = sanitizedText.replace(/\{\{(.*?)\}\}/g, (str) => {
          const replacementLength = str.length - 2; // Adjusting for the length of '{{' and '}}'
          uniqueCounter++; // Incrementing the counter for uniqueness
          const uniqueID = uniqueCounter
            .toString()
            .padStart(replacementLength, "0");
          return "/" + uniqueID + "/"; // Using slashes to encapsulate the unique ID
        });

        // Handling {% %} expressions on single lines, replacing with comment-style placeholders
        sanitizedText = sanitizedText.replace(/\{%([^\r\n]*?)%\}/g, (str) => {
          const replacementLength = str.length - 2; // Adjusting for the length of '{%' and '%}'
          uniqueCounter++;
          const uniqueID = uniqueCounter
            .toString()
            .padStart(replacementLength - 2, "0");
          return "//" + uniqueID + "//"; // Comment-style placeholder
        });

        // Handling {# #} comment blocks on single lines
        sanitizedText = sanitizedText.replace(/\{#([^\r\n]*?)#\}/g, (str) => {
          const replacementLength = str.length - 2; // Adjusting for the length of '{#' and '#}'
          uniqueCounter++;
          const uniqueID = uniqueCounter
            .toString()
            .padStart(replacementLength - 2, "0");
          return "/*" + uniqueID + "*/"; // Using block comment style for placeholder
        });

        // Handling unmatched start tags
        sanitizedText = sanitizedText.replace(
          /^\{\{|\{%|\{#(?![\s\S]*?\}\}|%}|#})/gm,
          "/*",
        );

        // Handling unmatched end tags
        sanitizedText = sanitizedText.replace(
          /^\}\}|%}|#}(?<!\{\{|\{%|\{#[\s\S]*?)/gm,
          "*/",
        );

        // Store original and sanitized content in map
        fileContentMap.set(filename, {
          original: text,
          sanitized: sanitizedText,
        });

        // Are we debugging?
        if (text.includes("// eslint-plugin-twig debug")) {
          console.log(filename + "\n" + sanitizedText); // eslint-disable-line no-console
        }

        return [sanitizedText];
      },

      postprocess(messages, filename) {
        const flattenedMessages = messages.flat();
        const { original, sanitized } = fileContentMap.get(filename);

        flattenedMessages.forEach((message) => {
          if (message.fix) {
            let fixText = message.fix.text;
            // Regex to find all unique IDs in fix text for all patterns
            const uniqueIDs = fixText.match(
              /(\/\d+\/)|(\/\/\d+\/\/)|(\/\*\d+\*\/)/g,
            );

            if (uniqueIDs) {
              uniqueIDs.forEach((uniqueIDTag) => {
                const sanitizedRegex = new RegExp(`\\${uniqueIDTag}`, "g"); // Use the full tag for regex

                let match;
                while ((match = sanitizedRegex.exec(sanitized)) !== null) {
                  const startIndex = match.index;
                  const endIndex = match.index + match[0].length;
                  const originalContent = original.substring(
                    startIndex,
                    endIndex,
                  ); // Extract original content from the same position

                  // Replace the unique ID in the fix text with the extracted original content
                  fixText = fixText.replace(
                    new RegExp(`\\${uniqueIDTag}`, "g"),
                    originalContent,
                  );
                }
              });
              message.fix.text = fixText; // Update fix text with all replacements done
            }
          }
        });

        return flattenedMessages;
      },

      supportsAutofix: true,
    },
  },
};
