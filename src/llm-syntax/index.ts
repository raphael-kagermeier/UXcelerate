import { ComputedStyles, PreviousStyles, StylesToInclude } from "./types";

export function manipulate() {
  /**
   * Predefined consts
   */
  const stylesToInclude: StylesToInclude = {
    backgroundColor: {
      shortAttribute: "backgroundColor",
      default: "#000000",
    },
    color: {
      shortAttribute: "color",
      default: "#000000",
    },
    fontSize: {
      shortAttribute: "fontSize",
      isNumeric: true,
    },
    border: {
      shortAttribute: "border",
      default: "0 none rgb(0, 0, 0)",
      valuesToExclude: ["none"],
    },
    display: {
      shortAttribute: "display",
      default: "inline",
      valuesToExclude: ["inline"],
    },
    width: {
      shortAttribute: "width",
      default: "auto",
      valuesToExclude: ["auto"],
      isNumeric: true,
    },
    height: {
      shortAttribute: "height",
      default: "auto",
      valuesToExclude: ["auto"],
      isNumeric: true,
    },
    margin: {
      shortAttribute: "margin",
      default: "0",
    },
    float: {
      shortAttribute: "float",
      default: "none",
      valuesToExclude: ["none"],
    },
    fontWeight: {
      shortAttribute: "fontWeight",
      default: "normal",
      valuesToExclude: [],
    },
    textDecoration: {
      shortAttribute: "textDecoration",
      default: "none solid rgb(0, 0, 0)",
      valuesToExclude: ["none"],
    },
    opacity: {
      shortAttribute: "opacity",
      default: "1",
      valuesToExclude: ["1"],
    },
    visibility: {
      shortAttribute: "visibility",
      default: "visible",
      valuesToExclude: ["visible"],
    },
  };

  const elementsToExclude: string[] = [
    "script",
    "noscript",
    "svg",
    ".cc-revoke",
    ".cc-window",
    ".cookie-status-message",
    "meta",
  ];

  const metaTagNamesToInclude: string[] = ["title", "description"];

  /**
   * Creation of the llm_syntax
   */
  try {
    var originalBody = document.body.cloneNode(true);

    const compressColors = (str: string): string | null => {
      // Check if any rgba color has a === 0
      const checkRegex =
        /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(0)\s*\)/i;
      if (checkRegex.test(str)) {
        return null;
      }

      // Compress colors
      return str.replace(
        /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(1|0?\.\d+))?\s*\)/gi,
        function (match) {
          const result =
            /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(1|0?\.\d+))?\s*\)/i.exec(
              match
            );

          if (result) {
            const r = parseInt(result[1], 10);
            const g = parseInt(result[2], 10);
            const b = parseInt(result[3], 10);
            const a = result[4] ? parseFloat(result[4]) : 1;

            // Skip transparent colors
            if (a < 1) return match;

            // Convert to short hex
            let hex =
              "#" +
              ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            return hex;
          }
          return match;
        }
      );
    };

    const getComputedStyles = (
      element: any,
      stylesToInclude: StylesToInclude
    ) => {
      const style = getComputedStyle(element);
      let computedStyles: ComputedStyles = {};

      for (const key in stylesToInclude) {
        let cssValue = style[key as keyof CSSStyleDeclaration] as string;
        cssValue = cssValue.replaceAll("px", "");

        // if there are values we don't need we skip
        if (
          stylesToInclude[key]?.valuesToExclude?.some((value) =>
            cssValue.includes(value)
          )
        ) {
          continue;
        }

        // handle colors
        if (cssValue.includes("rgb")) {
          const hex = compressColors(cssValue);
          if (hex) computedStyles[key] = hex;
        }

        // handle numbers
        else if (stylesToInclude[key]?.isNumeric) {
          const val = Math.ceil(parseInt(cssValue));

          if (!isNaN(val)) {
            computedStyles[key] = val.toString();
          }
        } else {
          computedStyles[key] =
            stylesToInclude[key]?.default === cssValue ? "" : cssValue;
        }
      }
      return computedStyles;
    };

    let previousStyles: PreviousStyles = Object.entries(stylesToInclude).reduce(
      (newObject: PreviousStyles, [key, value]) => {
        newObject[key] = value.default;
        return newObject;
      },
      {}
    );

    // elements to exclude
    document
      .querySelectorAll(elementsToExclude.map((el) => "body " + el).join(", "))
      .forEach((el) => {
        if (
          el.tagName === "META" &&
          metaTagNamesToInclude.includes(el.getAttribute("name") ?? "")
        ) {
          return;
        }

        el.remove();
      });

    // remove comments
    document.querySelectorAll("*").forEach((el) => {
      if (el.nodeType === Node.COMMENT_NODE) {
        el.remove();
      }
    });

    document.querySelectorAll("body *").forEach((element) => {
      const styles = getComputedStyles(element, stylesToInclude);

      // remove all attributes from element
      Object.keys(element.attributes).forEach((attr) => {
        if (!["name", "content", "alt", "href"].includes(attr))
          element.removeAttribute(attr);
      });

      for (const styleKey in stylesToInclude) {
        if (styles?.hasOwnProperty(styleKey)) {
          const styleAttributes = stylesToInclude[styleKey];
          const styleValue = styles[styleKey];

          if (
            styleValue !== "" &&
            (!previousStyles.hasOwnProperty(styleKey) ||
              previousStyles[styleKey] !== styleValue)
          ) {
            element.setAttribute(
              styleAttributes.shortAttribute,
              styleValue as string
            );
            if (styleValue) {
              previousStyles[styleKey] = styleValue as string;
            }
          }
        }
      }

      // remove all style and link tags
      document.querySelectorAll("body style").forEach((el) => el.remove());
      document.querySelectorAll("body link").forEach((el) => el.remove());
    });

    // send message to background
    const llm_syntax = document.body.innerHTML
      .replaceAll("\n", "")
      .replaceAll("\t", "")
      .replaceAll("  ", "")
      .replaceAll(" />", "/>")
      .trim();

    chrome.runtime.sendMessage({ llm_syntax });
    document.body.replaceWith(originalBody);
  } catch (e) {
    const error = e as Error;
    chrome.runtime.sendMessage({
      html_parsing_error:
        error.message + " stack:" + error.stack + " name:" + error.name,
    });
  }
}
