import { registerTemplate } from "lwc";

function tmpl($api, $cmp, $slotset, $ctx) {
  const {
    t: api_text,
    d: api_dynamic,
    h: api_element,
    k: api_key,
    i: api_iterator
  } = $api;
  return [
    api_element(
      "section",
      {
        key: 3
      },
      api_iterator($cmp.items, function(xValue, xIndex, xCounter, xFirst, xLast, xOdd, xEven) {
        return api_element(
          "div",
          {
            attrs: {
              "data-islast": xLast,
              "data-isfirst": xFirst,
              "data-isodd": xOdd,
              "data-iseven": xEven
            },
            key: api_key(2, xValue.id)
          },
          [
            api_element(
              "span",
              {
                key: 0
              },
              [api_text("Row: "), api_dynamic(xIndex)]
            ),
            api_text(". "),
            api_element(
              "span",
              {
                key: 1
              },
              [api_text("Number: "), api_dynamic(xCounter)]
            ),
            api_text(". Value: "),
            api_dynamic(xValue)
          ]
        );
      })
    )
  ];
}

export default registerTemplate(tmpl);
tmpl.stylesheets = [];
