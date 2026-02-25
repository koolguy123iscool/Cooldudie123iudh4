const TARGET = "https://btc-bros-invest.base44.app";

export async function handler(event) {
  try {
    const path = event.path.replace("/.netlify/functions/proxy", "");
    const url = TARGET + path + (event.rawQuery ? "?" + event.rawQuery : "");
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });
    const contentType = res.headers.get("content-type") || "";
    // Handle non-HTML assets
    if (!contentType.includes("text/html")) {
      const buffer = await res.arrayBuffer();
      return {
        statusCode: res.status,
        headers: {
          "content-type": contentType,
          "cache-control": "public, max-age=3600"
        },
        body: Buffer.from(buffer).toString("base64"),
        isBase64Encoded: true,
      };
    }
    let html = await res.text();
    // Inject script into page
    html = html.replace(
      "</body>",
      `
<script>
function removeBuilderUI() {
  const nodes = document.querySelectorAll("*");
  nodes.forEach(el => {
    if (el.innerText && el.innerText.includes("Edit with Base44")) {
      el.remove();
    }
  });
}
// Run repeatedly because builders load UI dynamically
setInterval(removeBuilderUI, 500);
removeBuilderUI();
</script>
</body>`
    );
    return {
      statusCode: 200,
      headers: {
        "content-type": "text/html",
      },
      body: html,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: "Proxy error",
    };
  }
}
