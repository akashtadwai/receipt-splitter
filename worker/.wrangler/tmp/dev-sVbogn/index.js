var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-NOKXH5/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/index.js
var MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
var MISTRAL_MODEL = "pixtral-12b-latest";
var OCR_PROMPT = `
INITIAL DETECTION - Carefully analyze if this image is ACTUALLY a receipt/bill/invoice:
- A valid receipt MUST have ALL of these elements:
* A clear list of purchased items with corresponding prices
* A structured format with items aligned in rows/columns
* A clearly marked total amount
* Usually contains business name, date, and payment information
* Consistent currency symbols (\u20B9, $, \u20AC, etc.) before numerical values

- This is NOT a receipt if ANY of these are true:
* Contains mathematical equations, formulas, or academic notation
* Contains LaTeX or other technical/scientific symbols (\u03C3, \u222B, \u2211, \u2261, etc.)
* Has variables, functions, or mathematical expressions (e.g., max(F(T) - K, 0))
* Primarily consists of paragraphs of text without itemized prices
* Is a menu, poster, advertisement, or academic paper
* Lacks a clear itemized structure and total amount

If it is NOT a receipt/bill (doesn't satisfy ALL receipt criteria or matches ANY non-receipt criteria), respond with: {"is_receipt": false, "reason": "explanation"}.

If it IS a receipt/bill, extract the data with EXACTLY these requirements:
1. Items section must contain product purchases only with their FINAL prices (not MRP)
2. The final total_bill should be the actual amount paid by the customer
3. CRITICAL RULES FOR TAXES AND DISCOUNTS:
   - EXCLUDE ALL line items marked as 'FREE', 'Zero', '0', or '\u20B90'
   - EXCLUDE ALL 'Product discount', 'MRP discount' items - these are already factored into item prices
   - EXCLUDE delivery charges or any other fees with zero value
   - ONLY include fees, charges, and taxes that have a non-zero monetary value AND are charged on top of item prices
   - For Blinkit/grocery receipts, only include 'Handling charge' if it has a non-zero value
4. IMPORTANT - taxes array should ONLY include:
   - Service charges, handling fees, delivery fees (ONLY if they have a positive non-zero value)
   - Tax items like GST, VAT, service tax (ONLY if they have a positive non-zero value)
   - Final bill discounts (NOT product/MRP discounts) (ONLY if they have a negative non-zero value)
5. ALWAYS EXCLUDE from taxes:
   - ANY item with value of 0 or marked as FREE
   - MRP (Maximum Retail Price) information
   - 'Product discount' or any discount showing the difference between MRP and selling price
   - Item totals / subtotals
   - Any line that summarizes the order
6. Format all monetary values as plain numbers without currency symbols
7. Handle + and - correctly (e.g., discount of 45 should be -45.0)

Return a structured JSON matching this schema:
{
  "is_receipt": true,
  "reason": "",
  "file_name": "string",
  "topics": ["string"],
  "languages": ["string"],
  "ocr_contents": {
    "items": [{"name": "string", "price": number}],
    "total_order_bill_details": {
      "total_bill": number,
      "taxes": [{"name": "string", "amount": number}]
    }
  }
}
`;
function corsHeaders(origin, allowedOrigin) {
  const allowedOrigins = [allowedOrigin, "http://localhost:3000"];
  const isAllowed = allowedOrigins.includes(origin) || origin?.startsWith("http://localhost:");
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}
__name(corsHeaders, "corsHeaders");
var src_default = {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = corsHeaders(origin, env.ALLOWED_ORIGIN);
    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }
    try {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file) {
        return new Response(JSON.stringify({ detail: "No file provided" }), {
          status: 400,
          headers: { ...headers, "Content-Type": "application/json" }
        });
      }
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const mimeType = file.type || "image/jpeg";
      const base64DataUrl = `data:${mimeType};base64,${base64}`;
      const mistralResponse = await fetch(MISTRAL_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
          model: MISTRAL_MODEL,
          messages: [{
            role: "user",
            content: [
              { type: "image_url", image_url: { url: base64DataUrl } },
              { type: "text", text: OCR_PROMPT }
            ]
          }],
          response_format: { type: "json_object" },
          temperature: 0
        })
      });
      if (!mistralResponse.ok) {
        const errorData = await mistralResponse.text();
        console.error("Mistral API error:", errorData);
        return new Response(JSON.stringify({ detail: "Error processing receipt with AI" }), {
          status: 500,
          headers: { ...headers, "Content-Type": "application/json" }
        });
      }
      const mistralData = await mistralResponse.json();
      const content = mistralData.choices?.[0]?.message?.content;
      if (!content) {
        return new Response(JSON.stringify({ detail: "No response from AI" }), {
          status: 500,
          headers: { ...headers, "Content-Type": "application/json" }
        });
      }
      const parsedContent = JSON.parse(content);
      if (!parsedContent.is_receipt) {
        return new Response(JSON.stringify({
          detail: parsedContent.reason || "The image doesn't appear to be a valid receipt"
        }), {
          status: 400,
          headers: { ...headers, "Content-Type": "application/json" }
        });
      }
      parsedContent.file_name = file.name || "uploaded_receipt";
      return new Response(JSON.stringify(parsedContent), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(JSON.stringify({ detail: `Error processing receipt: ${error.message}` }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }
  }
};

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-NOKXH5/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-NOKXH5/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
